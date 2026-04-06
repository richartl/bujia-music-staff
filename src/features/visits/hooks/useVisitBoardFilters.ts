import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { VisitFilters } from '../api/types';

const DEFAULT_FILTERS: VisitFilters = {
  search: '',
  statusId: '',
  statusCode: '',
  createdByUserId: '',
  branchId: '',
  clientId: '',
  instrumentId: '',
  isActive: '',
  isArchived: 'false',
  page: '',
  limit: '',
  openedFrom: '',
  openedTo: '',
};

function toUrlSearchParams(filters: VisitFilters) {
  const entries = Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null);
  return new URLSearchParams(entries as Array<[string, string]>);
}

export function useVisitBoardFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  const urlFilters = useMemo<VisitFilters>(
    () => ({
      search: searchParams.get('search') || '',
      statusId: searchParams.get('statusId') || '',
      statusCode: searchParams.get('statusCode') || '',
      createdByUserId: '',
      branchId: '',
      clientId: '',
      instrumentId: '',
      isActive: (searchParams.get('isActive') as VisitFilters['isActive']) || '',
      isArchived: (searchParams.get('isArchived') as VisitFilters['isArchived']) || 'false',
      page: searchParams.get('page') || '',
      limit: searchParams.get('limit') || '',
      openedFrom: '',
      openedTo: '',
    }),
    [searchParams],
  );

  const [filters, setFilters] = useState<VisitFilters>(urlFilters);
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  useEffect(() => {
    setFilters(urlFilters);
  }, [urlFilters]);

  useEffect(() => {
    if (debouncedSearch === (urlFilters.search || '').trim()) return;
    const next = { ...filters, search: debouncedSearch };
    setSearchParams(toUrlSearchParams(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function apply(next: VisitFilters) {
    setFilters(next);
    setSearchParams(toUrlSearchParams(next));
  }

  function update<K extends keyof VisitFilters>(key: K, value: VisitFilters[K]) {
    apply({ ...filters, [key]: value });
  }

  function clear() {
    apply({ ...DEFAULT_FILTERS });
  }

  return {
    filters,
    setFilters,
    apply,
    update,
    clear,
    isExpanded,
    setIsExpanded,
  };
}
