import type { CollectionTourItem } from '@trek/shared';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../../i18n';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { useAddonStore } from '../../../store/addonStore';
import { useAuthStore } from '../../../store/authStore';
import { useCollectionStore } from '../../../store/collectionStore';
import { useCollectionTourStore, watchCollectionTours } from '../../../store/collectionTourStore';
import { canRemoveFromCollection, collectionRoleOf } from '../../../utils/collectionAccess';
import { useToast } from '../../shared/Toast';

/**
 * LIB-03: the tours a collection keeps, for the collection's page. Read when
 * the collection opens and kept current while its members keep or remove one;
 * nothing at all while the Tours addon is off. Removing asks first and says
 * how it went.
 */
export function useCollectionTours(collectionId: number) {
  const { t } = useTranslation();
  const toast = useToast();
  const enabled = useAddonStore((state) => state.isEnabled('tours'));
  const { tours, status, shownFor } = useCollectionTourStore(
    useShallow((state) => ({ tours: state.tours, status: state.status, shownFor: state.collectionId }))
  );
  const [removing, setRemoving] = useState<CollectionTourItem | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    void useCollectionTourStore.getState().load(collectionId);
    return watchCollectionTours();
  }, [collectionId, enabled]);

  const confirmRemove = async () => {
    const tour = removing;
    setRemoving(null);
    if (!tour) return;
    try {
      await useCollectionTourStore.getState().remove(collectionId, tour.id);
      toast.success(t('tours.collection.removed'));
    } catch (err: unknown) {
      toast.error(t(err instanceof OnlineOnlyError ? 'tours.collection.offline' : 'tours.collection.removeFailed'));
    }
  };

  const current = shownFor === collectionId;
  return {
    enabled,
    tours: enabled && current ? tours : [],
    status: enabled && current ? status : 'idle',
    retry: () => void useCollectionTourStore.getState().load(collectionId),
    removing,
    askRemove: setRemoving,
    cancelRemove: () => setRemoving(null),
    confirmRemove,
  };
}

export type CollectionTours = ReturnType<typeof useCollectionTours>;

/** The kept tours whose name holds the list's search, all of them without one. */
export function toursMatching(tours: readonly CollectionTourItem[], search: string): CollectionTourItem[] {
  const query = search.trim().toLocaleLowerCase();
  return query ? tours.filter((tour) => tour.name.toLocaleLowerCase().includes(query)) : [...tours];
}

/**
 * The list open on the collections page and whether this user may remove its
 * tours (its owner or an admin of it), read from the list itself; no list on
 * "All saved" or before one opens. Desktop and phone both ask here.
 */
export function useActiveCollectionTourList(): { collectionId: number | null; canRemove: boolean } {
  const { activeId, collections, members } = useCollectionStore(
    useShallow((state) => ({ activeId: state.activeId, collections: state.collections, members: state.members }))
  );
  const userId = useAuthStore((state) => state.user?.id);
  if (typeof activeId !== 'number') return { collectionId: null, canRemove: false };
  const isOwner = collections.find((collection) => collection.id === activeId)?.is_owner ?? false;
  return { collectionId: activeId, canRemove: canRemoveFromCollection(collectionRoleOf(isOwner, members, userId)) };
}
