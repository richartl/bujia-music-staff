import { useEffect, useMemo, useRef } from 'react';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';

export type EvidenceUploaderItemStatus = 'idle' | 'initing' | 'queued' | 'uploading' | 'completing' | 'done' | 'error';

export type EvidenceUploaderItem = {
  id: string;
  file: File;
  status: EvidenceUploaderItemStatus;
  errorMessage?: string | null;
};

type EvidenceUploaderProps = {
  items: EvidenceUploaderItem[];
  maxFiles: number;
  existingCount?: number;
  title?: string;
  onAddFiles: (files: File[]) => void;
  onRetry?: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

function getStatusLabel(status: EvidenceUploaderItemStatus) {
  if (status === 'done' || status === 'queued') return 'Listo';
  if (status === 'error') return 'Error';
  if (status === 'idle' || status === 'initing') return 'Subiendo...';
  return 'Subiendo...';
}

export function EvidenceUploader({
  items,
  maxFiles,
  existingCount = 0,
  title = 'Evidencia (opcional)',
  onAddFiles,
  onRetry,
  onRemove,
}: EvidenceUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const slotsLeft = Math.max(0, maxFiles - items.length - existingCount);
  const previewMap = useMemo(() => {
    const entries = items
      .filter((item) => item.file.type.startsWith('image/'))
      .map((item) => [item.id, URL.createObjectURL(item.file)] as const);
    return new Map(entries);
  }, [items]);

  useEffect(() => () => previewMap.forEach((url) => URL.revokeObjectURL(url)), [previewMap]);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">Máx. {maxFiles}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files || []).slice(0, slotsLeft);
          if (files.length) onAddFiles(files);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        className="btn-secondary mt-2 h-10 w-full justify-center"
        onClick={() => inputRef.current?.click()}
        disabled={!slotsLeft}
      >
        Adjuntar evidencia
      </button>

      {!!items.length ? (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-2">
              <div className="flex items-center gap-2">
                {previewMap.get(item.id) ? (
                  <img src={previewMap.get(item.id)} alt={item.file.name} className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{item.file.name}</p>
                  <p className="text-[11px] text-slate-500">{getStatusLabel(item.status)}</p>
                  {item.status === 'error' && item.errorMessage ? (
                    <p className="text-[11px] text-red-600">{item.errorMessage}</p>
                  ) : null}
                </div>
                {item.status === 'error' && onRetry ? (
                  <button
                    type="button"
                    aria-label={`Reintentar ${item.file.name}`}
                    className="rounded p-1 text-slate-500"
                    onClick={() => onRetry(item.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Quitar ${item.file.name}`}
                  className="rounded p-1 text-slate-500"
                  onClick={() => onRemove(item.id)}
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
      ) : null}
    </div>
  );
}
