import { useState } from 'react';

/** The two lists the Lists tab switches between. */
export type ListsSubTab = 'packing' | 'todo';

const storageKey = (tripId: number) => `trip-lists-subtab-${tripId}`;

/**
 * The Lists tab's sub-tab, remembered per trip for the browser session. Both the
 * desktop container and the phone shell read and write the same key. The phone
 * shell only takes a stored value it knows (`onlyKnownTabs`); the desktop one
 * takes whatever is stored, as it always has.
 */
export function useListsSubTab(tripId: number, { onlyKnownTabs = false }: { onlyKnownTabs?: boolean } = {}) {
  const [subTab, setSubTabState] = useState<ListsSubTab>(() => {
    const saved = sessionStorage.getItem(storageKey(tripId));
    if (onlyKnownTabs) return saved === 'todo' ? 'todo' : 'packing';
    return (saved as ListsSubTab) || 'packing';
  });
  const setSubTab = (tab: ListsSubTab) => {
    setSubTabState(tab);
    sessionStorage.setItem(storageKey(tripId), tab);
  };
  return [subTab, setSubTab] as const;
}
