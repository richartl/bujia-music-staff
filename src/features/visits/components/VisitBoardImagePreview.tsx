import { X } from 'lucide-react';
import { OverlayPortal } from '@/components/ui/OverlayPortal';

type VisitBoardImagePreviewProps = {
  image: { url: string; name: string } | null;
  onClose: () => void;
};

export function VisitBoardImagePreview({ image, onClose }: VisitBoardImagePreviewProps) {
  if (!image) return null;

  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white"
          onClick={onClose}
          aria-label="Cerrar preview"
        >
          <X className="h-5 w-5" />
        </button>
        <img
          src={image.url}
          alt={image.name}
          className="max-h-[85vh] w-auto max-w-full rounded-xl border border-white/20 object-contain"
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </OverlayPortal>
  );
}
