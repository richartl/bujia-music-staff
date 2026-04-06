import { Copy, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { copyTextToClipboard } from '@/lib/clipboard';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { VisitResponse, VisitStatusCatalog } from '../api/types';
import { VisitStatusChangeAction } from './VisitStatusChangeAction';

type VisitBoardCardActionsProps = {
  visit: VisitResponse;
  statuses: VisitStatusCatalog[];
  onOpenImage?: () => void;
  onStatusChange: (statusId: string) => void;
  isChangingStatus?: boolean;
};

function resolveTrackingUrl(visit: VisitResponse) {
  const visitAsRecord = visit as Record<string, unknown>;
  const tracking = visitAsRecord.tracking as Record<string, unknown> | undefined;
  const trackingLink = visitAsRecord.trackingLink as Record<string, unknown> | undefined;

  const candidates = [
    tracking?.url,
    trackingLink?.publicUrl,
    visitAsRecord.publicTrackingUrl,
    visitAsRecord.trackingUrl,
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim()) as string | undefined;
}

export function VisitBoardCardActions({
  visit,
  statuses,
  onOpenImage,
  onStatusChange,
  isChangingStatus = false,
}: VisitBoardCardActionsProps) {
  const trackingUrl = resolveTrackingUrl(visit);

  async function copyTracking() {
    if (!trackingUrl) {
      notifyError('La visita no tiene tracking público');
      return;
    }
    try {
      await copyTextToClipboard(trackingUrl);
      notifySuccess('Tracking copiado');
    } catch {
      notifyError('No se pudo copiar el tracking');
    }
  }

  return (
    <div className="space-y-2 border-t border-slate-700/70 pt-2">
      <div className="grid grid-cols-3 gap-2">
        <Link to={`/app/visits/${visit.id}?instrumentId=${visit.instrumentId}`} className="btn-secondary h-10 justify-center px-2 py-2 text-xs">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <button type="button" className="btn-secondary h-10 px-2 py-2 text-xs" onClick={copyTracking}>
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="btn-secondary h-10 px-2 py-2 text-xs" onClick={onOpenImage} disabled={!onOpenImage}>
          <ImageIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <VisitStatusChangeAction visit={visit} statuses={statuses} onChange={onStatusChange} isLoading={isChangingStatus} />
    </div>
  );
}
