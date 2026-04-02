import { useCallback, useMemo, useRef, useState } from 'react';
import { filesApi, getUploadErrorCode } from '../api/filesApi';

export type IntakeUploadStatus = 'idle' | 'initing' | 'uploading' | 'completing' | 'done' | 'error';

export type IntakeUploadItem = {
  localId: string;
  file: File;
  status: IntakeUploadStatus;
  progress: number;
  mediaId?: string;
  errorCode?: string;
  errorMessage?: string;
};

type UseIntakeMediaUploadOptions = {
  scope: string;
  onFileError?: (item: IntakeUploadItem) => void;
};

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Archivo inválido. Revisa nombre, tipo y tamaño.',
  MEDIA_TIMEOUT: 'Tiempo de subida agotado. Intenta de nuevo.',
  MEDIA_PROVIDER_ERROR: 'Proveedor de archivos no disponible. Intenta más tarde.',
  MEDIA_NOT_FOUND: 'No se encontró el mediaId para completar.',
  MEDIA_STATE_CONFLICT: 'El archivo ya fue procesado en otro estado.',
  UNKNOWN_ERROR: 'Ocurrió un error inesperado subiendo el archivo.',
};

function createLocalId(file: File) {
  return `${file.name}-${file.size}-${Date.now()}-${crypto.randomUUID()}`;
}

function mapErrorMessage(code: string) {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function useIntakeMediaUpload({ scope, onFileError }: UseIntakeMediaUploadOptions) {
  const [items, setItems] = useState<IntakeUploadItem[]>([]);
  const controllersRef = useRef<Record<string, AbortController>>({});

  const updateItem = useCallback((localId: string, updater: (item: IntakeUploadItem) => IntakeUploadItem) => {
    setItems((current) => current.map((item) => (item.localId === localId ? updater(item) : item)));
  }, []);

  const uploadSingle = useCallback(
    async (item: IntakeUploadItem) => {
      const localId = item.localId;
      const controller = new AbortController();
      controllersRef.current[localId] = controller;

      try {
        updateItem(localId, (current) => ({
          ...current,
          status: 'initing',
          progress: 0,
          errorCode: undefined,
          errorMessage: undefined,
          mediaId: undefined,
        }));

        const initResult = await filesApi.initUpload(item.file, scope);

        updateItem(localId, (current) => ({
          ...current,
          status: 'uploading',
          mediaId: initResult.mediaId,
          progress: 1,
        }));

        await filesApi.putBinaryToSignedUrl(
          initResult.uploadUrl,
          item.file,
          initResult.requiredHeaders,
          (progress) => {
            updateItem(localId, (current) => ({ ...current, progress }));
          },
          controller.signal,
        );

        updateItem(localId, (current) => ({
          ...current,
          status: 'completing',
        }));

        await filesApi.completeUpload(initResult.mediaId, {
          sizeBytes: item.file.size,
          metadata: {
            originalName: item.file.name,
            mimeType: item.file.type || 'application/octet-stream',
          },
        });

        updateItem(localId, (current) => ({
          ...current,
          status: 'done',
          progress: 100,
        }));
      } catch (error) {
        const errorCode = getUploadErrorCode(error);
        if (errorCode === 'UPLOAD_ABORTED') {
          return;
        }

        updateItem(localId, (current) => {
          const next = {
            ...current,
            status: 'error' as const,
            errorCode,
            errorMessage: mapErrorMessage(errorCode),
          };
          onFileError?.(next);
          return next;
        });
      } finally {
        delete controllersRef.current[localId];
      }
    },
    [onFileError, scope, updateItem],
  );

  const addFiles = useCallback(
    (filesToAdd: FileList | File[]) => {
      const normalizedFiles = Array.from(filesToAdd);
      if (!normalizedFiles.length) return;

      const newItems = normalizedFiles.map<IntakeUploadItem>((file) => ({
        localId: createLocalId(file),
        file,
        status: 'idle',
        progress: 0,
      }));

      setItems((current) => [...current, ...newItems]);
      newItems.forEach((item) => {
        void uploadSingle(item);
      });
    },
    [uploadSingle],
  );

  const retryFile = useCallback(
    (localId: string) => {
      const item = items.find((current) => current.localId === localId);
      if (!item) return;
      void uploadSingle(item);
    },
    [items, uploadSingle],
  );

  const removeFile = useCallback((localId: string) => {
    const controller = controllersRef.current[localId];
    controller?.abort();
    delete controllersRef.current[localId];
    setItems((current) => current.filter((item) => item.localId !== localId));
  }, []);

  const uploadedMediaIds = useMemo(
    () => items.filter((item) => item.status === 'done' && item.mediaId).map((item) => item.mediaId as string),
    [items],
  );

  const hasBlockingUploads = useMemo(
    () =>
      items.some(
        (item) =>
          item.status === 'initing' || item.status === 'uploading' || item.status === 'completing',
      ),
    [items],
  );

  return {
    items,
    addFiles,
    retryFile,
    removeFile,
    uploadedMediaIds,
    hasBlockingUploads,
  };
}
