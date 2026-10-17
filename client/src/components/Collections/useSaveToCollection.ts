import type { Collection, CollectionMembership, CollectionStatus } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { collectionsApi } from '../../api/collections';
import { useTranslation } from '../../i18n';
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../shared/Toast';

type MembershipEntry = CollectionMembership['lists'][number];

/** busyId while the "visited everywhere" bulk action runs. */
export const VISITED_EVERYWHERE_BUSY = -1;

/**
 * The store-driven "Save to Collection" picker: the one logic path behind the desktop
 * dialog and the phone sheet, which render their own markup over it. Every new target
 * loads the user's lists and the place's membership; a list toggles the place in or out,
 * a status changes per list, and "visited everywhere" marks every editable list at once.
 * Each change refreshes the membership and bumps the store version so the inspector
 * bookmark indicator stays in sync.
 */
export function useSaveToCollection() {
  const target = useSaveToCollectionStore((s) => s.target);
  const close = useSaveToCollectionStore((s) => s.close);
  const bumpVersion = useSaveToCollectionStore((s) => s.bumpVersion);
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [lists, setLists] = useState<Collection[]>([]);
  const [membership, setMembership] = useState<CollectionMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const membershipQuery = useMemo(() => {
    if (!target) return null;
    return {
      google_place_id: target.google_place_id ?? undefined,
      google_ftid: target.google_ftid ?? undefined,
      name: target.name,
      lat: target.lat ?? undefined,
      lng: target.lng ?? undefined,
    };
  }, [target]);

  const refreshMembership = useCallback(async () => {
    if (!membershipQuery) return;
    try {
      setMembership(await collectionsApi.membership(membershipQuery));
    } catch {
      setMembership({ saved: false, lists: [] });
    }
  }, [membershipQuery]);

  // Load lists + membership whenever the picker opens for a new target. The query is
  // derived from the target alone, so both change together.
  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setLoading(true);
    setMembership(null);
    void Promise.all([
      collectionsApi.list().catch(() => ({ collections: [], incomingInvites: [] })),
      membershipQuery
        ? collectionsApi.membership(membershipQuery).catch(() => ({ saved: false, lists: [] as MembershipEntry[] }))
        : Promise.resolve({ saved: false, lists: [] as MembershipEntry[] }),
    ])
      .then(([listRes, m]) => {
        if (cancelled) return;
        setLists(listRes.collections);
        setMembership(m);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [target, membershipQuery]);

  const savedByCollection = new Map<number, MembershipEntry>();
  for (const l of membership?.lists ?? []) savedByCollection.set(l.collection_id, l);

  /** Lists holding this place that the viewer may edit and that are not visited yet. */
  const unvisited = (membership?.lists ?? []).filter((l) => l.can_edit && l.status !== 'visited');

  const handleStatus = async (entry: MembershipEntry, next: CollectionStatus) => {
    if (busyId != null) return;
    setBusyId(entry.collection_id);
    try {
      await collectionsApi.setStatus(entry.place_id, next);
      await refreshMembership();
      bumpVersion();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setBusyId(null);
    }
  };

  const handleVisitedEverywhere = async () => {
    if (busyId != null || unvisited.length === 0) return;
    setBusyId(VISITED_EVERYWHERE_BUSY);
    try {
      const { updated } = await collectionsApi.setStatusMany(
        unvisited.map((l) => l.place_id),
        'visited'
      );
      toast.success(t('collections.markedVisited', { count: updated }));
      await refreshMembership();
      bumpVersion();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (list: Collection) => {
    if (busyId != null || !target) return;
    const savedPlaceId = savedByCollection.get(list.id)?.place_id;
    setBusyId(list.id);
    try {
      if (savedPlaceId != null) {
        await collectionsApi.deletePlace(savedPlaceId);
        toast.success(t('collections.removedFromList', { name: list.name }));
      } else {
        await collectionsApi.savePlace({
          collection_id: list.id,
          source_trip_id: target.source_trip_id ?? null,
          source_place_id: target.source_place_id ?? null,
          name: target.name,
          description: target.description ?? null,
          lat: target.lat ?? null,
          lng: target.lng ?? null,
          address: target.address ?? null,
          category_id: target.category_id ?? null,
          price: target.price ?? null,
          currency: target.currency ?? null,
          notes: target.notes ?? null,
          image_url: target.image_url ?? null,
          google_place_id: target.google_place_id ?? null,
          google_ftid: target.google_ftid ?? null,
          osm_id: target.osm_id ?? null,
          website: target.website ?? null,
          phone: target.phone ?? null,
          force: true,
        });
        toast.success(t('collections.addedToList', { name: list.name }));
      }
      await refreshMembership();
      bumpVersion();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setBusyId(null);
    }
  };

  const openCollections = () => {
    close();
    navigate('/collections');
  };

  return {
    target,
    close,
    lists,
    loading,
    busyId,
    savedByCollection,
    unvisited,
    handleStatus,
    handleVisitedEverywhere,
    handleToggle,
    openCollections,
  };
}
