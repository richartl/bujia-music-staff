import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authStore } from '@/stores/auth-store';
import { normalizeVisit } from '../utils/visitAdapter';
import { getWorkshopVisitStatuses, getWorkshopVisitsWithFilters } from '../api/visitsApi';
import type { VisitFilters } from '../api/types';

export type VisitBoardColumn = {
  statusId: string;
  name: string;
  color?: string | null;
  visits: Array<ReturnType<typeof normalizeVisit>['raw']>;
  totalAmount: number;
};

export function useVisitsBoard(filters: VisitFilters) {
  const workshopId = authStore((state) => state.workshopId);

  const visitsQuery = useQuery({
    queryKey: ['workshop-visits', workshopId, filters],
    queryFn: () => getWorkshopVisitsWithFilters(workshopId!, filters),
    enabled: !!workshopId,
  });

  const statusesQuery = useQuery({
    queryKey: ['visit-statuses', workshopId],
    queryFn: () => getWorkshopVisitStatuses(workshopId!),
    enabled: !!workshopId,
  });

  const normalizedVisits = useMemo(() => (visitsQuery.data || []).map((visit) => normalizeVisit(visit)), [visitsQuery.data]);

  const columns = useMemo(() => {
    const statusList = statusesQuery.data || [];
    const grouped = new Map<string, VisitBoardColumn>();

    statusList.forEach((status) => {
      grouped.set(status.id, {
        statusId: status.id,
        name: status.name,
        color: status.color || null,
        visits: [],
        totalAmount: 0,
      });
    });

    const noStatusKey = '__no_status__';
    grouped.set(noStatusKey, { statusId: '', name: 'Sin estatus', color: null, visits: [], totalAmount: 0 });

    normalizedVisits.forEach((visit) => {
      const key = visit.status.id && grouped.has(visit.status.id) ? visit.status.id : noStatusKey;
      const bucket = grouped.get(key);
      if (!bucket) return;
      bucket.visits.push(visit.raw);
      bucket.totalAmount += visit.total;
    });

    const ordered = statusList
      .map((status) => grouped.get(status.id))
      .filter((column): column is VisitBoardColumn => Boolean(column));
    const noStatusColumn = grouped.get(noStatusKey);
    if (noStatusColumn?.visits.length) ordered.push(noStatusColumn);

    return ordered;
  }, [normalizedVisits, statusesQuery.data]);

  return {
    workshopId,
    visitsQuery,
    statusesQuery,
    columns,
    visitsCount: normalizedVisits.length,
    activeCount: normalizedVisits.filter((visit) => visit.isActive).length,
  };
}
