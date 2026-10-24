import { useEffect, useState } from 'react';

/** The two lists the Lists tab switches between. */
export type ListsSubTab = 'packing' | 'todo';

const storageKey = (tripId: number) => `trip-lists-subtab-${tripId}`;

/** Lists tabs that are on screen, told when another surface picks their sub-tab. */
const followers = new Set<(tripId: number, tab: ListsSubTab) => void>();

function readStored(tripId: number): string | null {
  try {
    return sessionStorage.getItem(storageKey(tripId));
  } catch {
    return null;
  }
}

function store(tripId: number, tab: ListsSubTab) {
  try {
    sessionStorage.setItem(storageKey(tripId), tab);
  } catch {
    // Storage can be blocked; the choice then lasts as long as the tab is on screen.
  }
}

/**
 * Picks the Lists tab's sub-tab from outside it, e.g. "Open packing list" on a
 * tour. The Lists tab opens with it next time, and one already on screen
 * switches to it right away.
 */
export function rememberListsSubTab(tripId: number, tab: ListsSubTab) {
  store(tripId, tab);
  followers.forEach((follow) => follow(tripId, tab));
}

/**
 * The Lists tab's sub-tab, remembered per trip for the browser session. Both the
 * desktop container and the phone shell read and write the same key. The phone
 * shell only takes a stored value it knows (`onlyKnownTabs`); the desktop one
 * takes whatever is stored, as it always has.
 */
export function useListsSubTab(tripId: number, { onlyKnownTabs = false }: { onlyKnownTabs?: boolean } = {}) {
  const [subTab, setSubTabState] = useState<ListsSubTab>(() => {
    const saved = readStored(tripId);
    if (onlyKnownTabs) return saved === 'todo' ? 'todo' : 'packing';
    return (saved as ListsSubTab) || 'packing';
  });
  useEffect(() => {
    const follow = (forTrip: number, tab: ListsSubTab) => {
      if (forTrip === tripId) setSubTabState(tab);
    };
    followers.add(follow);
    return () => {
      followers.delete(follow);
    };
  }, [tripId]);
  const setSubTab = (tab: ListsSubTab) => {
    setSubTabState(tab);
    store(tripId, tab);
  };
  return [subTab, setSubTab] as const;
}
