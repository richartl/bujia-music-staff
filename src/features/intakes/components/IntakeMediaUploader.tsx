import { useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import { Camera, Clapperboard, Loader2, Mic, RefreshCw, Trash2 } from 'lucide-react';
import {
  useIntakeMediaUpload,
  type IntakeUploadStatus,
} from '../hooks/useIntakeMediaUpload';

type IntakeMediaUploaderProps = {
  workshopId: string;
  onUploadedMediaIdsChange: (mediaIds: string[]) => void;
  onBlockingUploadsChange: (isBlocking: boolean) => void;
  onFileErrorToast: (message: string) => void;
};

const MAX_EVIDENCE_FILES = 4;

const STATUS_LABEL: Record<IntakeUploadStatus, string> = {
  idle: 'En cola',
  initing: 'Preparando',
  uploading: 'Subiendo...',
  completing: 'Subiendo...',
  done: 'Listo',
  error: 'Error',
};

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
      .filter((item) => item.file.type.startsWith('image/'))
      .map((item) => [item.localId, URL.createObjectURL(item.file)] as const);
    return new Map(entries);
  }, [items]);

  const slotsLeft = Math.max(0, MAX_EVIDENCE_FILES - items.length);

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
    const files = Array.from(event.target.files || []).slice(0, slotsLeft);
    if (!files.length) return;
    addFiles(files);
    event.target.value = '';
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
          ? 'Sin permiso de cámara. Habilítalo para tomar fotos/video.'
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
    <section className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">Evidencia de visita (opcional)</p>
        <p className="text-xs text-slate-500">Máx. {MAX_EVIDENCE_FILES}</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">Adjunta fotos, video o audio para documentar el estado inicial.</p>

      <input
        ref={filesInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={onInputChange}
      />
      <button
        type="button"
        className="btn-secondary mt-2 h-10 w-full justify-center"
        onClick={() => filesInputRef.current?.click()}
        disabled={!slotsLeft}
      >
        Adjuntar evidencia
      </button>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onInputChange} />
        <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={onInputChange} />
        <input ref={audioInputRef} type="file" accept="audio/*" capture="user" className="hidden" onChange={onInputChange} />

        <button type="button" className="btn-secondary h-9 justify-center gap-1 text-xs" onClick={onTakePhoto} disabled={!slotsLeft}>
          <Camera className="h-3.5 w-3.5" />
          Foto
        </button>
        <button type="button" className="btn-secondary h-9 justify-center gap-1 text-xs" onClick={onTakeVideo} disabled={!slotsLeft}>
          <Clapperboard className="h-3.5 w-3.5" />
          Video
        </button>
        <button type="button" className="btn-secondary h-9 justify-center gap-1 text-xs" onClick={onRecordAudio} disabled={!slotsLeft}>
          <Mic className="h-3.5 w-3.5" />
          Audio
        </button>
      </div>

      {!!items.length ? (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div key={item.localId} className="rounded-lg border border-slate-200 p-2">
              <div className="flex items-center gap-2">
                {previewMap.get(item.localId) ? (
                  <img src={previewMap.get(item.localId)} alt={item.file.name} className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{item.file.name}</p>
                  <p className="text-[11px] text-slate-500">{formatFileSize(item.file.size)}</p>
                  <p className="text-[11px] text-slate-500">
                    {STATUS_LABEL[item.status]}
                    {item.status === 'uploading' ? ` · ${item.progress}%` : ''}
                  </p>
                </div>
                {item.status === 'error' ? (
                  <button
                    type="button"
                    aria-label={`Reintentar ${item.file.name}`}
                    className="rounded p-1 text-slate-500"
                    onClick={() => retryFile(item.localId)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Quitar ${item.file.name}`}
                  className="rounded p-1 text-slate-500"
                  onClick={() => removeFile(item.localId)}
                >
                  {item.status === 'uploading' || item.status === 'completing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Sin evidencia seleccionada.</p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{uploadedMediaIds.length} archivo(s) listos</span>
        {hasBlockingUploads ? (
          <span className="text-xs text-amber-700">Finaliza las subidas para guardar intake.</span>
        ) : null}
      </div>
    </section>
  );
}
