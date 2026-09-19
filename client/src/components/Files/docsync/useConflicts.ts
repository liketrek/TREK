import { useCallback, useEffect, useState } from 'react'
import { docsyncApi } from '../../../api/client'
import type { useDocSync } from './useDocSync'

/**
 * The documents that changed in both places, and the way out of that.
 *
 * The server has resolved conflicts since the first version and the strings
 * have been in the locales just as long, but neither shell ever listed them: a
 * binding reported "1 conflict" and the only place to act on it was the MCP
 * tool. So a conflict was a dead end for anyone using the app.
 *
 * Shared between the panel and the phone sheet because both list the same rows
 * with the same three answers, and because the duplication gate counts a second
 * copy of it against the PR.
 */

export interface ConflictItem {
  id: number
  /** The trip file's name, or the provider's when TREK never got a copy. */
  name: string
  remoteName: string | null
}

interface ItemRow {
  id: number
  file_name?: string | null
  remote_name?: string | null
}

export function useConflicts(tripId: number | string, sync: ReturnType<typeof useDocSync>, open: boolean) {
  const [items, setItems] = useState<ConflictItem[] | null>(null)
  const [working, setWorking] = useState<number | null>(null)

  const reload = useCallback(async () => {
    const rows = (await docsyncApi.items(tripId, 'conflict')) as ItemRow[]
    setItems(
      rows.map(r => ({
        id: r.id,
        name: r.file_name || r.remote_name || '',
        remoteName: r.remote_name ?? null,
      })),
    )
  }, [tripId])

  // Only once the list is on screen: a trip with no conflicts should not pay
  // for a request to find that out, and the count above it already says so.
  useEffect(() => {
    if (open) void reload()
  }, [open, reload])

  const resolve = useCallback(
    async (itemId: number, keep: 'trek' | 'provider' | 'both') => {
      setWorking(itemId)
      try {
        await sync.resolveConflict(itemId, keep)
        // The row is gone from this list either way: it was resolved, or the
        // call failed and `sync.error` says so. Re-reading is what tells the
        // difference, rather than removing it here and hoping.
        await reload()
      } finally {
        setWorking(null)
      }
    },
    [sync, reload],
  )

  return { items, working, resolve, reload }
}
