import { useEffect, useMemo, useState } from 'react';

import { tripsApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import type { TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../shared/Toast';

export interface TripOption {
  id: number;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  cover_image?: string | null;
}

export interface CopyResult {
  copied: number;
  skipped: { id: number; name: string }[];
}

export interface TripCopyPickerOptions {
  open: boolean;
  /** Copies the selected places into the trip; resolves with the server's reconcile result. */
  onCopy: (tripId: number) => Promise<CopyResult>;
  onClose: () => void;
  t: TranslationFn;
  /** True when nothing is selected: a pick then does nothing (the desktop dialog's guard). */
  emptySelection?: boolean;
}

/** Trips whose title holds the trimmed, case folded query; all of them for an empty query. */
export function filterTripOptions(trips: TripOption[], search: string): TripOption[] {
  const q = search.trim().toLowerCase();
  if (!q) return trips;
  return trips.filter((tr) => (tr.title ?? '').toLowerCase().includes(q));
}

/**
 * The "Copy to trip" picker behind both the desktop dialog and the phone sheet, which
 * render their own markup over it. Every opening loads the user's trips afresh and
 * clears the search; a pick copies the selected places and turns the server's dedup
 * result into copied / skipped duplicates toasts before closing.
 */
export function useTripCopyPicker({ open, onCopy, onClose, t, emptySelection = false }: TripCopyPickerOptions) {
  const toast = useToast();
  const { language } = useTranslation();
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [busyTripId, setBusyTripId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setSearch('');
    tripsApi
      .list()
      .then((res: { trips?: TripOption[] }) => {
        if (!cancelled) setTrips(res.trips ?? []);
      })
      .catch(() => {
        if (!cancelled) setTrips([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => filterTripOptions(trips, search), [trips, search]);

  const dateRange = (tr: TripOption): string => {
    const s = formatDate(tr.start_date, language);
    const e = formatDate(tr.end_date, language);
    if (s && e) return `${s} – ${e}`;
    return s || e || '';
  };

  const handleCopy = async (tripId: number) => {
    if (busyTripId != null || emptySelection) return;
    setBusyTripId(tripId);
    try {
      const res = await onCopy(tripId);
      if (res.copied > 0) toast.success(t('collections.copiedCount', { count: res.copied }));
      if (res.skipped.length > 0) toast.info(t('collections.skippedDuplicates', { count: res.skipped.length }));
      if (res.copied === 0 && res.skipped.length === 0) toast.info(t('collections.copyNothing'));
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setBusyTripId(null);
    }
  };

  return { loading, search, setSearch, filtered, busyTripId, dateRange, handleCopy };
}
