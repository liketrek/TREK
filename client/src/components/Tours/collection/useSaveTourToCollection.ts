import type { Collection } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../../i18n';
import { collectionToursRepo } from '../../../repo/collectionToursRepo';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { useAuthStore } from '../../../store/authStore';
import { canAddToCollection } from '../../../utils/collectionAccess';
import { useToast } from '../../shared/Toast';

/** The saved tour of a trip that is to be kept. */
export interface TourSaveTarget {
  tripId: number | string;
  placeId: number;
  name: string;
}

/** A list as the picker shows it: every list the user has, the ones they may not add to dimmed. */
export interface CollectionChoice {
  collection: Collection;
  canAdd: boolean;
}

type ListStatus = 'loading' | 'ready' | 'error' | 'offline';

/** The lists with the opening they were read for, so a newer opening reads as loading, never as an older answer. */
interface ListsAnswer {
  key: string;
  status: Exclude<ListStatus, 'loading'>;
  lists: Collection[];
}

const failure = (err: unknown): 'error' | 'offline' => (err instanceof OnlineOnlyError ? 'offline' : 'error');

/**
 * LIB-03: keeping a saved tour in a collection. Every opening reads the
 * user's lists afresh and preselects the first one they may add to; the tour
 * is kept only on an explicit confirm, under the name in the field, as an
 * independent copy. Closing writes nothing. With startOpen the dialog is open
 * from the first render, for a host that mounts it on demand.
 */
export function useSaveTourToCollection(target: TourSaveTarget, { startOpen = false }: { startOpen?: boolean } = {}) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const [opening, setOpening] = useState(0);
  const [open, setOpen] = useState(startOpen);
  const [answer, setAnswer] = useState<ListsAnswer | null>(null);
  const [listId, setListId] = useState<number | null>(null);
  const [name, setName] = useState(target.name);
  const [saving, setSaving] = useState(false);
  const key = String(opening);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    collectionToursRepo
      .lists()
      .then((lists) => {
        if (cancelled) return;
        setAnswer({ key, status: 'ready', lists });
        const first = lists.find((collection) => canAddToCollection(collection, userId));
        setListId((current) => current ?? first?.id ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setAnswer({ key, status: failure(err), lists: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [open, key, userId]);

  const status: ListStatus = answer?.key === key ? answer.status : 'loading';
  const lists = answer?.key === key ? answer.lists : null;
  const choices = useMemo<CollectionChoice[]>(
    () => (lists ?? []).map((collection) => ({ collection, canAdd: canAddToCollection(collection, userId) })),
    [lists, userId]
  );

  const show = useCallback(() => {
    setName(target.name);
    setListId(null);
    setOpening((value) => value + 1);
    setOpen(true);
  }, [target.name]);
  const close = () => {
    if (!saving) setOpen(false);
  };
  const choose = (id: number) => {
    if (choices.some((choice) => choice.collection.id === id && choice.canAdd)) setListId(id);
  };

  const confirm = async () => {
    const chosenName = name.trim();
    const list = choices.find((choice) => choice.collection.id === listId && choice.canAdd)?.collection;
    if (!list || !chosenName || saving) return;
    setSaving(true);
    try {
      const { tour } = await collectionToursRepo.save(list.id, {
        source_trip_id: Number(target.tripId),
        source_place_id: target.placeId,
        name: chosenName,
      });
      setOpen(false);
      toast.success(t('tours.collection.kept', { name: tour.name, list: list.name }));
    } catch (err: unknown) {
      toast.error(t(failure(err) === 'offline' ? 'tours.collection.offline' : 'tours.collection.keepFailed'));
    } finally {
      setSaving(false);
    }
  };

  return {
    open,
    show,
    close,
    status,
    choices,
    listId,
    choose,
    name,
    setName,
    saving,
    canConfirm: status === 'ready' && listId !== null && name.trim().length > 0 && !saving,
    confirm,
    retry: () => setOpening((value) => value + 1),
    openCollections: () => {
      setOpen(false);
      void navigate('/collections');
    },
  };
}

export type SaveTourToCollection = ReturnType<typeof useSaveTourToCollection>;
