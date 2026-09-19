import { useCallback, useEffect, useState } from 'react'
import type { DawarichAccept, DawarichSuggestion, DawarichSyncState } from '@trek/shared'
import { dawarichApi } from '../api/dawarich'
import { dawarichRepo, DawarichOfflineError } from '../repo/dawarichRepo'
import { isEffectivelyOffline } from '../sync/networkMode'
import { useAddonStore } from '../store/addonStore'
import { useTranslation } from '../i18n'
import { useToast } from '../components/shared/Toast'

export type DawarichSuggestionsStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'disconnected'
  | 'offline'
  | 'unavailable'

export interface DawarichSuggestionsState {
  suggestions: DawarichSuggestion[]
  status: DawarichSuggestionsStatus
  lastSyncAt: string | null
  lastSyncState: DawarichSyncState
  /** Already translated; null when the last sync was clean. */
  lastSyncError: string | null
  busyId: number | null
  reload: () => void
  accept: (id: number, body: DawarichAccept) => Promise<boolean>
  dismiss: (id: number) => Promise<void>
  restore: (id: number) => Promise<void>
}

/**
 * The stays waiting for review, and what a user can do with them.
 *
 * Shared by the journal and the trip planner so the two never disagree about
 * what is still pending — and so the review logic exists once rather than in
 * each shell.
 *
 * Every mutation updates the row in place rather than refetching the list. A
 * refetch would reorder under the cursor, and someone working down a backlog
 * would lose their place every time they pressed something.
 */
export function useDawarichSuggestions(filter?: {
  tripId?: number
  state?: 'new' | 'accepted' | 'dismissed'
}): DawarichSuggestionsState {
  const { t } = useTranslation()
  const toast = useToast()
  const addonEnabled = useAddonStore(s => s.isEnabled)
  const active = addonEnabled('dawarich')

  const [suggestions, setSuggestions] = useState<DawarichSuggestion[]>([])
  const [status, setStatus] = useState<DawarichSuggestionsStatus>('idle')
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [lastSyncState, setLastSyncState] = useState<DawarichSyncState>('never')
  const [lastSyncErrorCode, setLastSyncErrorCode] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const tripId = filter?.tripId
  const stateFilter = filter?.state

  const reload = useCallback(() => setReloadToken(token => token + 1), [])

  useEffect(() => {
    if (!active) {
      setStatus('idle')
      return
    }
    let cancelled = false
    setStatus('loading')
    dawarichRepo
      .suggestions({ tripId, state: stateFilter })
      .then(result => {
        if (cancelled) return
        setSuggestions(result.suggestions)
        setLastSyncAt(result.lastSyncAt)
        setLastSyncState(result.lastSyncState)
        setLastSyncErrorCode(result.lastSyncError)
        setStatus(result.connected ? 'ready' : 'disconnected')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStatus(err instanceof DawarichOfflineError ? 'offline' : 'unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [active, tripId, stateFilter, reloadToken])

  const replace = useCallback((updated: DawarichSuggestion) => {
    setSuggestions(prev => prev.map(item => (item.id === updated.id ? updated : item)))
  }, [])

  const accept = useCallback(
    async (id: number, body: DawarichAccept): Promise<boolean> => {
      // Accepting writes into a trip or a journal, which needs the server. The
      // reads go through the repo, which is offline-aware; this one says so
      // rather than hanging until the request times out.
      if (isEffectivelyOffline()) {
        toast.error(t('dawarich.error.offline'))
        return false
      }
      setBusyId(id)
      try {
        const result = await dawarichApi.accept(id, body)
        replace(result.suggestion)
        toast.success(t(`dawarich.toast.accepted.${body.target}`))
        return true
      } catch (err) {
        toast.error(serverError(err, t) ?? t('dawarich.toast.acceptError'))
        return false
      } finally {
        setBusyId(null)
      }
    },
    [replace, toast, t],
  )

  const setRowState = useCallback(
    async (id: number, next: 'new' | 'dismissed') => {
      if (isEffectivelyOffline()) {
        toast.error(t('dawarich.error.offline'))
        return
      }
      setBusyId(id)
      try {
        replace(await dawarichApi.setState(id, next))
      } catch (err) {
        toast.error(serverError(err, t) ?? t('dawarich.toast.updateError'))
      } finally {
        setBusyId(null)
      }
    },
    [replace, toast, t],
  )

  return {
    suggestions,
    status,
    lastSyncAt,
    lastSyncState,
    lastSyncError: translateCode(lastSyncErrorCode, t),
    busyId,
    reload,
    accept,
    dismiss: (id: number) => setRowState(id, 'dismissed'),
    restore: (id: number) => setRowState(id, 'new'),
  }
}

/**
 * The server's `{ code, error }` envelope, as a sentence the reader can read.
 *
 * The controller ships a code beside every message precisely so nothing reaches
 * a non-English install in English; the prose is the fallback for a code this
 * build has no string for.
 */
function serverError(err: unknown, t: (key: string) => string): string | null {
  const data = (err as { response?: { data?: { error?: unknown; code?: unknown } } })?.response?.data
  if (typeof data?.code === 'string') {
    const key = `dawarich.error.${data.code}`
    const text = t(key)
    if (text !== key) return text
  }
  return typeof data?.error === 'string' ? data.error : null
}

/** A reason code turned into the reader's language, with a fallback for new codes. */
function translateCode(code: string | null, t: (key: string) => string): string | null {
  if (!code) return null
  const key = `dawarich.error.${code}`
  const text = t(key)
  return text === key ? t('dawarich.error.unknown') : text
}
