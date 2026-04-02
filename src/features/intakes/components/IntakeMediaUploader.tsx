import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Camera, Clapperboard, FilePlus2, ImagePlus, Loader2, Mic, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useIntakeMediaUpload,
  type IntakeUploadItem,
  type IntakeUploadStatus,
} from '../hooks/useIntakeMediaUpload';

type IntakeMediaUploaderProps = {
  workshopId: string;
  onUploadedMediaIdsChange: (mediaIds: string[]) => void;
  onBlockingUploadsChange: (isBlocking: boolean) => void;
  onFileErrorToast: (message: string) => void;
};

const STATUS_LABEL: Record<IntakeUploadStatus, string> = {
  idle: 'En cola',
  initing: 'Preparando',
  uploading: 'Subiendo',
  completing: 'Confirmando',
  done: 'Listo',
  error: 'Error',
};

function isImage(file: File) {
  return file.type.startsWith('image/');
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function IntakeMediaUploader({
  workshopId,
  onUploadedMediaIdsChange,
  onBlockingUploadsChange,
  onFileErrorToast,
}: IntakeMediaUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const filesInputRef = useRef<HTMLInputElement | null>(null);
  const scope = useMemo(() => `workshop:${workshopId}/intake:new`, [workshopId]);

  const { items, addFiles, removeFile, retryFile, uploadedMediaIds, hasBlockingUploads } =
    useIntakeMediaUpload({
      scope,
      onFileError: (item) => {
        onFileErrorToast(`${item.file.name}: ${item.errorMessage || 'Error al subir archivo.'}`);
      },
    });

  const previewMap = useMemo(() => {
    const entries = items
      .filter((item) => isImage(item.file))
      .map((item) => [item.localId, URL.createObjectURL(item.file)] as const);
    return new Map(entries);
  }, [items]);

  useEffect(() => {
    onUploadedMediaIdsChange(uploadedMediaIds);
  }, [onUploadedMediaIdsChange, uploadedMediaIds]);

  useEffect(() => {
    onBlockingUploadsChange(hasBlockingUploads);
  }, [hasBlockingUploads, onBlockingUploadsChange]);

  useEffect(() => {
    return () => {
      previewMap.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewMap]);

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;
    addFiles(event.target.files);
    event.target.value = '';
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragActive(false);
    if (!event.dataTransfer.files?.length) return;
    addFiles(event.dataTransfer.files);
  }

  async function requestDevicePermission(kind: 'camera' | 'microphone') {
    if (!navigator.mediaDevices?.getUserMedia) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: kind === 'camera',
        audio: kind === 'microphone',
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      onFileErrorToast(
        kind === 'camera'
          ? 'Sin permiso de cámara. Habilítalo para tomar fotos.'
          : 'Sin permiso de micrófono. Habilítalo para grabar audio.',
      );
      return false;
    }
  }

  async function onTakePhoto() {
    const allowed = await requestDevicePermission('camera');
    if (!allowed) return;
    photoInputRef.current?.click();
  }

  async function onRecordAudio() {
    const allowed = await requestDevicePermission('microphone');
    if (!allowed) return;
    audioInputRef.current?.click();
  }

  async function onTakeVideo() {
    const allowed = await requestDevicePermission('camera');
    if (!allowed) return;
    videoInputRef.current?.click();
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">Media (fotos/video/audio)</p>
        <span className="text-xs text-slate-500">{uploadedMediaIds.length} archivo(s) listos</span>
      </div>

      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={onDrop}
        className={cn(
          'flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-3 py-4 text-center transition',
          isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50',
        )}
      >
        <input
          type="file"
          className="hidden"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={onInputChange}
        />
        <UploadCloud className="h-5 w-5 text-slate-500" />
        <p className="mt-2 text-sm text-slate-700">Arrastra archivos o toca para seleccionar</p>
      </label>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onInputChange}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={onInputChange}
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          capture="user"
          className="hidden"
          onChange={onInputChange}
        />
        <input
          ref={filesInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={onInputChange}
        />

        <button type="button" className="btn-secondary h-10 justify-center gap-2" onClick={onTakePhoto}>
          <Camera className="h-4 w-4" />
          Tomar foto
        </button>
        <button type="button" className="btn-secondary h-10 justify-center gap-2" onClick={onTakeVideo}>
          <Clapperboard className="h-4 w-4" />
          Tomar video
        </button>
        <button type="button" className="btn-secondary h-10 justify-center gap-2" onClick={onRecordAudio}>
          <Mic className="h-4 w-4" />
          Tomar audio
        </button>
        <button
          type="button"
          className="btn-secondary h-10 justify-center gap-2"
          onClick={() => filesInputRef.current?.click()}
        >
          <FilePlus2 className="h-4 w-4" />
          Agregar media
        </button>
      </div>

      {!items.length ? (
        <p className="text-sm text-slate-500">Aún no agregas archivos.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const canRetry = item.status === 'error';
            const canRemove = item.status !== 'uploading' && item.status !== 'completing';
            const previewUrl = previewMap.get(item.localId) || '';

            return (
              <li key={item.localId} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {previewUrl ? (
                      <img src={previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{item.file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(item.file.size)}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {STATUS_LABEL[item.status]}
                      {item.status === 'uploading' ? ` · ${item.progress}%` : ''}
                    </p>

                    {(item.status === 'uploading' || item.status === 'completing') && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-200">
                        <div className="h-full bg-emerald-500" style={{ width: `${item.progress}%` }} />
                      </div>
                    )}

                    {item.status === 'error' && item.errorMessage ? (
                      <p className="mt-1 text-xs text-red-600">{item.errorMessage}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'uploading' || item.status === 'completing' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : null}
                    {canRetry ? (
                      <button type="button" className="btn-secondary h-8 px-2" onClick={() => retryFile(item.localId)}>
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    ) : null}
                    {canRemove ? (
                      <button type="button" className="btn-secondary h-8 px-2" onClick={() => removeFile(item.localId)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasBlockingUploads ? (
        <p className="text-xs text-amber-700">Finaliza las subidas en curso para habilitar guardar intake.</p>
      ) : null}
    </section>
  );
}
