import { Archive, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { copyTextToClipboard } from '@/lib/clipboard';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { VisitResponse, VisitStatusCatalog } from '../api/types';
import { getTrackingUrlFromVisit } from '../utils/publicTrackingUrl';
import { VisitStatusChangeAction } from './VisitStatusChangeAction';

type VisitBoardCardActionsProps = {
  visit: VisitResponse;
  statuses: VisitStatusCatalog[];
  onStatusChange: (statusId: string) => void;
  isChangingStatus?: boolean;
  onArchive?: () => void;
  onUnarchive?: () => void;
  isArchiving?: boolean;
  isArchiveMode?: boolean;
};

export function VisitBoardCardActions({
  visit,
  statuses,
  onStatusChange,
  isChangingStatus = false,
  onArchive,
  onUnarchive,
  isArchiving = false,
  isArchiveMode = false,
}: VisitBoardCardActionsProps) {
  const trackingUrl = getTrackingUrlFromVisit(visit);
  const canArchive = !visit.isArchived;
  const canUnarchive = Boolean(visit.isArchived);
  const hasArchiveAction = canArchive || (canUnarchive && isArchiveMode);

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
      <div className={`grid gap-2 ${hasArchiveAction ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Link to={`/app/visits/${visit.id}?instrumentId=${visit.instrumentId}`} className="btn-secondary h-8 justify-center px-2 py-1.5 text-xs">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <button type="button" className="btn-secondary h-8 px-2 py-1.5 text-xs disabled:opacity-50" onClick={copyTracking} disabled={!trackingUrl}>
          <Copy className="h-3.5 w-3.5" />
        </button>
        {canArchive ? (
          <button
            type="button"
            className="btn-secondary h-8 justify-center px-2 py-1.5 text-xs"
            onClick={onArchive}
            disabled={isArchiving}
            title="Archivar visita"
            aria-label="Archivar visita"
          >
            <Archive className="h-3.5 w-3.5 text-violet-400" />
          </button>
        ) : null}
        {canUnarchive && isArchiveMode ? (
          <button
            type="button"
            className="btn-secondary h-8 justify-center px-2 py-1.5 text-xs"
            onClick={onUnarchive}
            disabled={isArchiving}
            title="Desarchivar visita"
            aria-label="Desarchivar visita"
          >
            <RotateCcw className="h-3.5 w-3.5 text-violet-400" />
          </button>
        ) : null}
      </div>

      <VisitStatusChangeAction visit={visit} statuses={statuses} onChange={onStatusChange} isLoading={isChangingStatus} />
    </div>
  );
}
