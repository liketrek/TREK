import { useCallback, useEffect, useRef, useState } from 'react'
import type { StorageAdminState, StorageBackend, StorageConfig, StorageConfigPut, StorageTestResponse } from '@trek/shared'
import { adminApi } from '../../../api/client'
import { getApiErrorMessage, type ApiError } from '../../../types'
import { settingsDocumentOf } from './storageModel'

export type StorageTestResults = Record<string, StorageTestResponse | 'running'>

/** 50ms under vitest so poll tests run on real timers (MSW + fake timers don't mix). */
export const BACKFILL_POLL_MS = import.meta.env.MODE === 'test' ? 50 : 5000

/** True for a 409 response — the version this draft was built at is no longer current (audit #7). */
function isConflictError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'response' in err && (err as ApiError).response?.status === 409
}

export interface StorageAdmin {
  state: StorageAdminState | null
  /**
   * Whether the server is already busy with a storage job: a migration or a
   * backfill, since its one-job-at-a-time rule spans both. Answered off the
   * last response rather than off `state`, so it is current the instant that
   * response lands rather than on the commit that renders it.
   *
   * That difference is the whole point. An effect re-run by a DEFERRED commit
   * still closes over the `state` of the render it belongs to, which under load
   * is several responses old by the time it runs, and the queue effect deciding
   * on that closure POSTed a second migration on top of a running one. Anything
   * deciding whether to fire a request asks this; anything rendering reads
   * `state`. Never called during render.
   */
  storageBusy: () => boolean
  /** The settings-owned document (the PUT body), with local edits layered in. Carries the version the draft was built at. */
  draft: StorageConfigPut | null
  dirty: boolean
  loading: boolean
  loadError: string | null
  /** Server 400s/409s land here VERBATIM (400) or as the distinct conflict copy (409) — long registry messages outlive a toast. */
  saveError: string | null
  /** True while `saveError` is the 409 copy — the panels render the discard-and-reload escape next to it. */
  saveConflict: boolean
  saving: boolean
  testResults: StorageTestResults
  setDraft: (next: StorageConfig) => void
  /** PUTs `overrideDraft ?? draft` — an override lets a caller strip categories from the wire body without staging them (and marking dirty) via setDraft. */
  save: (overrideDraft?: StorageConfig) => Promise<boolean>
  test: (backend: StorageBackend) => Promise<void>
  /**
   * Probe each target individually (client-expanded mirror primary +
   * replicas — see `mirrorProbeTargets`) and merge the results into one
   * `StorageTestResponse` under `key` (the row's mirror wire name). Never
   * sends the mirror stub itself — each call probes a concrete backend.
   */
  testMirror: (key: string, targets: StorageBackend[]) => Promise<void>
  /** null on success; the verbatim server error otherwise. */
  startBackfill: (mirrorName: string) => Promise<string | null>
  cancelBackfill: (mirrorName: string) => Promise<string | null>
  startMigration: (category: string, to: string) => Promise<string | null>
  cancelMigration: (category: string) => Promise<string | null>
  refreshStats: () => Promise<string | null>
  /** Re-GETs admin state (poll-safe — see the implementation comment below). Exposed for the panel's failed-queue recovery path. */
  refreshState: () => Promise<void>
  /**
   * The 409's only exit: throw the local edits away and reload the saved
   * settings (fresh GET → fresh draft → fresh version), clearing dirty and
   * saveError. See the implementation comment for why refreshState can't do
   * this itself.
   */
  discardDraft: () => Promise<void>
}

/**
 * Shared by the desktop and phone storage panels (DefaultUserSettingsTab
 * model: self-contained, adminApi directly, deliberately no offline core —
 * hoster-level config is online-only).
 */
export function useStorageAdmin(genericError: string, conflictError: string): StorageAdmin {
  const [state, setState] = useState<StorageAdminState | null>(null)
  const [draft, setDraftState] = useState<StorageConfigPut | null>(null)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveConflict, setSaveConflict] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResults, setTestResults] = useState<StorageTestResults>({})

  // Read imperatively from the poll effect/refreshState so a stale closure
  // never re-derives the draft out from under an in-flight edit.
  const dirtyRef = useRef(dirty)
  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  // Read imperatively at refreshState's resolve time so a poll GET that was
  // in flight when a save started never applies after the save's own state.
  const savingRef = useRef(saving)
  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  // Written by every state application, at response time rather than at commit
  // time, and read back through storageBusy(). See the interface doc.
  const stateRef = useRef<StorageAdminState | null>(null)
  const storageBusy = useCallback((): boolean => {
    const live = stateRef.current
    if (!live) return false
    return live.migrations.some((m) => m.status === 'running') || live.backfills.some((b) => b.status === 'running')
  }, [])

  // Bumped by every deliberate state application (initial load, save
  // success). A refreshState() call captures the seq before its GET and
  // drops the response if the seq moved on — i.e. a save applied its own
  // fresher state — while that GET was in flight.
  const stateSeq = useRef(0)

  const applyState = useCallback((next: StorageAdminState) => {
    stateSeq.current += 1
    stateRef.current = next
    setState(next)
    setDraftState(settingsDocumentOf(next))
    setDirty(false)
    setSaveError(null)
    setSaveConflict(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    adminApi
      .getStorage()
      .then((data) => {
        if (!cancelled) applyState(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getApiErrorMessage(err, genericError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applyState, genericError])

  // Re-attaches the CURRENT draft's version onto whatever shape the caller
  // hands in (the storageModel edit helpers are version-blind — they operate
  // on plain StorageConfig — so this is the one place that keeps `version`
  // pinned to what the operator's form was loaded at, no matter how many
  // local edits run in between).
  const setDraft = useCallback((next: StorageConfig) => {
    setDraftState((prev) => ({ ...next, version: prev?.version ?? 0 }))
    setDirty(true)
  }, [])

  // Poll-safe refresh: replaces `state` unconditionally, but only re-derives
  // `draft` when the operator has no unsaved edits in flight — never touches
  // `dirty`/`saveError`, so a running poll cannot clobber a dirty draft or
  // mask a pending save error.
  //
  // Race guard: a poll GET issued before a save's PUT resolves can resolve
  // AFTER the save applied its own (fresher) response, overwriting it with
  // the pre-save world. Capture the state-application sequence number before
  // the await and drop the response if it moved on, or if a save is
  // in-flight/just landed (read via a ref so it's current at resolve time).
  //
  // Declared before `save` (which calls it on a 409) — a hook's `const`s
  // must exist before another callback's dependency array references them.
  const refreshState = useCallback(async (): Promise<void> => {
    const seq = stateSeq.current
    const next = await adminApi.getStorage()
    if (stateSeq.current !== seq || savingRef.current) return
    stateRef.current = next
    setState(next)
    if (!dirtyRef.current) setDraftState(settingsDocumentOf(next))
  }, [])

  const save = useCallback(
    async (overrideDraft?: StorageConfig): Promise<boolean> => {
      if (!draft) return false
      // Always the DRAFT's own version, even for an overrideDraft (a variant
      // of the same draft with categories stripped, per stripCategories) —
      // both share the same version basis: what the operator's form was
      // loaded/refreshed at, never re-read from `state` here (that would
      // defeat the whole check — see setDraft's re-attach comment above).
      const body: StorageConfigPut = { ...(overrideDraft ?? draft), version: draft.version }
      setSaving(true)
      setSaveError(null)
      setSaveConflict(false)
      try {
        // The response is the fresh effective world, never the request echo.
        applyState(await adminApi.updateStorage(body))
        return true
      } catch (err: unknown) {
        if (isConflictError(err)) {
          // Something else (another admin's save, or a category migration's
          // flip) wrote since this draft's version was captured. Refresh
          // `state` so the operator sees the fresh world, but the dirty
          // draft itself is left untouched for review (dirty is never
          // cleared here) — refreshState() already respects dirtyRef.
          setSaveError(conflictError)
          setSaveConflict(true)
          void refreshState().catch(() => {})
        } else {
          setSaveError(getApiErrorMessage(err, genericError))
        }
        return false
      } finally {
        setSaving(false)
      }
    },
    [draft, applyState, genericError, conflictError, refreshState],
  )

  /**
   * Conflict recovery (final-review fix): after a 409 the dirty draft keeps
   * the version it was built at. refreshState deliberately leaves a dirty
   * draft's version alone — bumping it there would resurrect audit #7, where
   * the background poll floats a mid-edit draft past a migration flip it
   * never carried — so nothing else can ever move it, and every retry 409s
   * again. The operator's way out is to say so explicitly: discard the local
   * edits, reload the saved settings, and start over from the fresh version.
   * A fresh GET (not the possibly-dropped post-409 refresh) guarantees that
   * version is current, and applyState clears dirty/saveError with it.
   */
  const discardDraft = useCallback(async (): Promise<void> => {
    try {
      applyState(await adminApi.getStorage())
    } catch (err: unknown) {
      setSaveError(getApiErrorMessage(err, genericError))
      setSaveConflict(false)
    }
  }, [applyState, genericError])

  const test = useCallback(
    async (backend: StorageBackend): Promise<void> => {
      setTestResults((prev) => ({ ...prev, [backend.name]: 'running' }))
      try {
        const result = await adminApi.testStorageBackend(backend)
        setTestResults((prev) => ({ ...prev, [backend.name]: result }))
      } catch (err: unknown) {
        const error = getApiErrorMessage(err, genericError)
        setTestResults((prev) => ({
          ...prev,
          [backend.name]: { ok: false, targets: [{ name: backend.name, ok: false, error }] },
        }))
      }
    },
    [genericError],
  )

  const testMirror = useCallback(
    async (key: string, targets: StorageBackend[]): Promise<void> => {
      setTestResults((prev) => ({ ...prev, [key]: 'running' }))
      const settled = await Promise.all(
        targets.map(async (target) => {
          try {
            const result = await adminApi.testStorageBackend(target)
            return result.targets[0] ?? { name: target.name, ok: result.ok }
          } catch (err: unknown) {
            return { name: target.name, ok: false, error: getApiErrorMessage(err, genericError) }
          }
        }),
      )
      setTestResults((prev) => ({ ...prev, [key]: { ok: settled.every((r) => r.ok), targets: settled } }))
    },
    [genericError],
  )

  // While any backfill or category migration is running, poll GET state so
  // progress/counts advance without the operator refreshing the page.
  useEffect(() => {
    if (
      !state?.backfills.some((b) => b.status === 'running') &&
      !state?.migrations.some((m) => m.status === 'running')
    )
      return
    const iv = setInterval(() => {
      // A transient poll failure is retried on the next tick — it must never
      // surface as a toast or interrupt the operator's in-progress edit.
      void refreshState().catch(() => {})
    }, BACKFILL_POLL_MS)
    return () => clearInterval(iv)
  }, [state, refreshState])

  const startBackfill = useCallback(
    async (mirrorName: string): Promise<string | null> => {
      try {
        await adminApi.startStorageBackfill(mirrorName)
        void refreshState().catch(() => {})
        return null
      } catch (err: unknown) {
        return getApiErrorMessage(err, genericError)
      }
    },
    [refreshState, genericError],
  )

  const cancelBackfill = useCallback(
    async (mirrorName: string): Promise<string | null> => {
      try {
        await adminApi.cancelStorageBackfill(mirrorName)
        void refreshState().catch(() => {})
        return null
      } catch (err: unknown) {
        return getApiErrorMessage(err, genericError)
      }
    },
    [refreshState, genericError],
  )

  const startMigration = useCallback(
    async (category: string, to: string): Promise<string | null> => {
      try {
        await adminApi.startStorageMigration(category, to)
        // Awaited (unlike cancelMigration/startBackfill/cancelBackfill): the
        // queue effect's in-flight lock releases as soon as this promise
        // resolves, so admin.state must already reflect the just-started
        // migration by then — otherwise the next queued candidate can
        // dequeue and POST before the server has confirmed this one.
        await refreshState().catch(() => {})
        return null
      } catch (err: unknown) {
        return getApiErrorMessage(err, genericError)
      }
    },
    [refreshState, genericError],
  )

  const cancelMigration = useCallback(
    async (category: string): Promise<string | null> => {
      try {
        await adminApi.cancelStorageMigration(category)
        void refreshState().catch(() => {})
        return null
      } catch (err: unknown) {
        return getApiErrorMessage(err, genericError)
      }
    },
    [refreshState, genericError],
  )

  const refreshStats = useCallback(async (): Promise<string | null> => {
    try {
      const usage = await adminApi.refreshStorageStats()
      // Off stateRef rather than a functional updater, so the ref and the
      // rendered state stay one world: every writer here sets both.
      const prev = stateRef.current
      if (prev) {
        const next = { ...prev, usage }
        stateRef.current = next
        setState(next)
      }
      return null
    } catch (err: unknown) {
      return getApiErrorMessage(err, genericError)
    }
  }, [genericError])

  return {
    state,
    storageBusy,
    draft,
    dirty,
    loading,
    loadError,
    saveError,
    saveConflict,
    saving,
    testResults,
    setDraft,
    save,
    test,
    testMirror,
    startBackfill,
    cancelBackfill,
    startMigration,
    cancelMigration,
    refreshStats,
    refreshState,
    discardDraft,
  }
}
