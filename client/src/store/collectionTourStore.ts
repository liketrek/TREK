import type { CollectionTourItem } from '@trek/shared';
import { create } from 'zustand';
import { addListener, removeListener } from '../api/websocket';
import { collectionToursRepo } from '../repo/collectionToursRepo';
import { OnlineOnlyError } from '../repo/onlineOnly';
import type { WebSocketEvent } from '../types';

/** How far the open collection's tours are: asked for, there, or not to be had right now. */
type CollectionTourStatus = 'idle' | 'loading' | 'ready' | 'error' | 'offline';

interface CollectionTourState {
  /** The collection the tours are read for. */
  collectionId: number | null;
  tours: CollectionTourItem[];
  status: CollectionTourStatus;
  /** Raised by every read: only the answer to the latest one is taken in. */
  loadSeq: number;
  load: (collectionId: number) => Promise<void>;
  /** Removes one kept tour; a refusal puts it back and throws. */
  remove: (collectionId: number, tourId: number) => Promise<void>;
  clear: () => void;
}

/**
 * LIB-03: the whole tours kept in the collection that is open. Read when it
 * opens, again when another member keeps or removes one (watchCollectionTours),
 * and never shown under another collection, not even while that one loads.
 * Reads can overlap (two members' changes in a row, the first read and a
 * change); only the latest one's answer counts, so an older list never
 * replaces a newer one.
 */

/** The list with a tour put back where it stood, unless it is there already. */
function withPutBack(tours: CollectionTourItem[], tour: CollectionTourItem, at: number): CollectionTourItem[] {
  if (tours.some((item) => item.id === tour.id)) return tours;
  const index = Math.min(Math.max(at, 0), tours.length);
  return [...tours.slice(0, index), tour, ...tours.slice(index)];
}

export const useCollectionTourStore = create<CollectionTourState>((set, get) => ({
  collectionId: null,
  tours: [],
  status: 'idle',
  loadSeq: 0,
  load: async (collectionId) => {
    const seq = get().loadSeq + 1;
    set({ loadSeq: seq });
    // Another collection's tours never show under this one.
    if (get().collectionId !== collectionId) set({ collectionId, tours: [], status: 'loading' });
    const current = () => get().loadSeq === seq && get().collectionId === collectionId;
    try {
      const { tours } = await collectionToursRepo.list(collectionId);
      if (current()) set({ tours, status: 'ready' });
    } catch (err: unknown) {
      if (current()) set({ status: err instanceof OnlineOnlyError ? 'offline' : 'error' });
    }
  },
  remove: async (collectionId, tourId) => {
    const before = get().tours;
    const at = before.findIndex((tour) => tour.id === tourId);
    const removed = before[at];
    if (get().collectionId === collectionId) set({ tours: before.filter((tour) => tour.id !== tourId) });
    try {
      await collectionToursRepo.remove(collectionId, tourId);
    } catch (err) {
      // Only the removed tour comes back: a list read meanwhile keeps the other members' changes.
      if (get().collectionId === collectionId && removed) set({ tours: withPutBack(get().tours, removed, at) });
      throw err;
    }
  },
  clear: () => set((state) => ({ collectionId: null, tours: [], status: 'idle', loadSeq: state.loadSeq + 1 })),
}));

/**
 * Keeps the open collection's tours current while its members work on it: a
 * `collections:updated` for that collection reads them again. Returns the
 * function that stops listening.
 */
export function watchCollectionTours(): () => void {
  const onEvent = (event: WebSocketEvent) => {
    const { collectionId } = useCollectionTourStore.getState();
    if (event?.type !== 'collections:updated' || collectionId === null || event.collectionId !== collectionId) return;
    void useCollectionTourStore.getState().load(collectionId);
  };
  addListener(onEvent);
  return () => removeListener(onEvent);
}
