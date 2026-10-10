import type { Collection } from '@trek/shared';
import { useEffect, useState } from 'react';

import { collectionsApi } from '../../api/collections';

/** The user's saved-place lists for the dashboard widgets, loaded once on mount. */
export function useCollectionLists() {
  const [lists, setLists] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await collectionsApi.list();
        if (!cancelled) setLists(data.collections);
      } catch {
        if (!cancelled) setLists([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { lists, loading };
}
