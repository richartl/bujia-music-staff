import { Archive, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { copyTextToClipboard } from '@/lib/clipboard';
import { notifyError, notifySuccess } from '@/lib/notify';
import type { VisitResponse, VisitStatusCatalog } from '../api/types';
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

function resolveTrackingUrl(visit: VisitResponse) {
  const visitAsRecord = visit as Record<string, unknown>;
  const tracking = visitAsRecord.tracking as Record<string, unknown> | undefined;
  const trackingLink = visitAsRecord.trackingLink as Record<string, unknown> | undefined;

  const candidates = [
    tracking?.url,
    tracking?.publicUrl,
    trackingLink?.publicUrl,
    visitAsRecord.publicTrackingUrl,
    visitAsRecord.trackingUrl,
  ];

  const directUrl = candidates.find((value) => typeof value === 'string' && value.trim()) as string | undefined;
  if (directUrl) return directUrl;

  const tokenCandidates = [tracking?.token, trackingLink?.token, visitAsRecord.publicTrackingToken];
  const token = tokenCandidates.find((value) => typeof value === 'string' && value.trim()) as string | undefined;
  if (!token) return undefined;

  return `${window.location.origin}/tracking/${token}`;
}

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
  const trackingUrl = resolveTrackingUrl(visit);
  const canArchive = !visit.isArchived && !visit.isActive;
  const canUnarchive = Boolean(visit.isArchived);

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
      <div className="grid grid-cols-2 gap-2">
        <Link to={`/app/visits/${visit.id}?instrumentId=${visit.instrumentId}`} className="btn-secondary h-10 justify-center px-2 py-2 text-xs">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <button type="button" className="btn-secondary h-10 px-2 py-2 text-xs disabled:opacity-50" onClick={copyTracking} disabled={!trackingUrl}>
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      {canArchive ? (
        <button type="button" className="btn-secondary h-10 w-full justify-center gap-2 text-xs" onClick={onArchive} disabled={isArchiving}>
          <Archive className="h-3.5 w-3.5" />
          {isArchiving ? 'Archivando...' : 'Archivar'}
        </button>
      ) : null}
      {canUnarchive && isArchiveMode ? (
        <button type="button" className="btn-secondary h-10 w-full justify-center gap-2 text-xs" onClick={onUnarchive} disabled={isArchiving}>
          <RotateCcw className="h-3.5 w-3.5" />
          {isArchiving ? 'Desarchivando...' : 'Desarchivar'}
        </button>
      ) : null}

      <VisitStatusChangeAction visit={visit} statuses={statuses} onChange={onStatusChange} isLoading={isChangingStatus} />
    </div>
  );
}
