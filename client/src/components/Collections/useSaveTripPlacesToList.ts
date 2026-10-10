import type { Collection } from '@trek/shared';
import { useEffect, useMemo, useState } from 'react';

import { collectionsApi } from '../../api/collections';
import { useTranslation } from '../../i18n';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../shared/Toast';

export interface SaveTripPlacesToListOptions {
  /** Whether the picker is showing: every opening loads the lists afresh. */
  open: boolean;
  tripId: number;
  /** The selected trip place ids to copy into the chosen list. */
  placeIds: number[];
  onClose: () => void;
  /** Called after a successful save (e.g. to clear the trip selection). */
  onDone: () => void;
}

/**
 * Bulk "save to collection" for the trip's place selection: the one logic path behind
 * the desktop dialog and the phone sheet, which render their own markup over it. Every
 * opening loads the lists the user can add to, the search narrows them by name, and a
 * pick copies every selected place into that list at once (the server dedups).
 */
export function useSaveTripPlacesToList({ open, tripId, placeIds, onClose, onDone }: SaveTripPlacesToListOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const [lists, setLists] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setSearch('');
    collectionsApi
      .list()
      // Only lists the user can add to (their own or an editor/admin share). The
      // server still enforces this; here we drop lists that are clearly read-only.
      .then((res) => {
        if (!cancelled) setLists((res.collections ?? []).filter((c) => c.is_owner !== false));
      })
      .catch(() => {
        if (!cancelled) setLists([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? lists.filter((l) => l.name.toLowerCase().includes(q)) : lists;
  }, [lists, search]);

  const pick = async (list: Collection) => {
    if (busyId != null || placeIds.length === 0) return;
    setBusyId(list.id);
    try {
      const res = await collectionsApi.saveFromTripMany(list.id, tripId, placeIds);
      if (res.copied > 0) toast.success(t('collections.addedNToList', { count: res.copied, name: list.name }));
      if (res.skipped.length > 0) toast.info(t('collections.skippedDuplicates', { count: res.skipped.length }));
      if (res.copied === 0 && res.skipped.length === 0) toast.info(t('collections.copyNothing'));
      onDone();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setBusyId(null);
    }
  };

  return { lists, loading, search, setSearch, filtered, busyId, pick };
}
