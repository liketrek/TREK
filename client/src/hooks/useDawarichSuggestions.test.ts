/**
 * FE-DAWARICH-SUGG-001 to FE-DAWARICH-SUGG-019: the review list both Dawarich
 * shells read from.
 *
 * This hook is the only place the integration's review logic lives: the planner
 * panel and the journal sheet both call it, so a regression here is a
 * regression in both at once, and the two shells disagreeing about what is
 * still pending is precisely what it was written to prevent.
 *
 * Four things are worth pinning, and the cases below are grouped around them.
 *
 *  - **The status ladder.** `idle` / `loading` / `ready` / `disconnected` /
 *    `offline` / `unavailable` are not decoration: the panel renders nothing at
 *    all on `idle`, so an instance without the addon has to produce `idle` and
 *    no request, and a read that failed must not collapse into the same value
 *    as "connected and quiet".
 *  - **The stale-response guard.** Every read carries a `cancelled` flag. Lose
 *    it and the answer to the trip the reader just left overwrites the list for
 *    the trip they are looking at now, which reads as rows appearing from
 *    nowhere.
 *  - **In-place updates.** Accepting or dismissing replaces the one row and
 *    never refetches, deliberately: a refetch reorders under the cursor, and
 *    somebody working down a backlog loses their place on every press.
 *  - **The message chain.** The server ships a reason code beside its English
 *    prose so a non-English install never gets English. The code wins when this
 *    build has a string for it, the prose is the fallback for a code it does
 *    not know, and a generic sentence is the last resort. Each step is a branch,
 *    and each of them is a sentence a real person reads.
 *
 * The repo and the API are mocked, the way the neighbouring
 * `DawarichAtlasDialog` test does it. Connectivity is not: `setForcedOffline`
 * drives the real `networkMode`, which is the single source of truth the hook
 * gates its writes on, and translation is the real provider, because the two
 * helpers at the bottom of the source depend on `t()` returning the key
 * untouched for a string this build does not have.
 */
import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DawarichAccept, DawarichAcceptResult, DawarichSuggestion, DawarichSuggestionList } from '@trek/shared'
import { TranslationProvider } from '../i18n/TranslationContext'
import { useAddonStore } from '../store/addonStore'
import { setForcedOffline } from '../sync/networkMode'
import { DawarichOfflineError } from '../repo/dawarichRepo'
import { useDawarichSuggestions } from './useDawarichSuggestions'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('../components/shared/Toast', () => ({ useToast: () => toast, default: () => toast }))

const repo = { suggestions: vi.fn() }
vi.mock('../repo/dawarichRepo', () => {
  // The hook branches on `err instanceof DawarichOfflineError`, so the class the
  // test throws has to be the very one the hook imported. Defined inside the
  // factory and read back through the mocked module, it is.
  class DawarichOfflineError extends Error {}
  return {
    dawarichRepo: { suggestions: (...args: unknown[]) => repo.suggestions(...args) },
    DawarichOfflineError,
  }
})

const api = { accept: vi.fn(), setState: vi.fn() }
vi.mock('../api/dawarich', () => ({
  dawarichApi: {
    accept: (...args: unknown[]) => api.accept(...args),
    setState: (...args: unknown[]) => api.setState(...args),
  },
}))

const ADDON = { id: 'dawarich', name: 'Dawarich', type: 'integration', icon: 'route', enabled: true }

/**
 * One recorded stay. Only a handful of these fields matter to this hook (id,
 * state and target), but the contract demands all of them, and a partial cast
 * would hide the day a required field is added.
 */
function stay(over: Partial<DawarichSuggestion> & { id: number }): DawarichSuggestion {
  return {
    id: over.id,
    sourceVisitId: String(over.id),
    tripId: null,
    tripTitle: null,
    name: `Stay ${over.id}`,
    lat: 50.94,
    lng: 6.96,
    startedAt: '2026-09-10T10:15:00+02:00',
    endedAt: '2026-09-10T12:40:00+02:00',
    durationMinutes: 145,
    localDate: '2026-09-10',
    sourceStatus: 'suggested',
    confidence: null,
    confidenceBand: null,
    state: 'new',
    target: null,
    acceptedPlaceId: null,
    acceptedJournalEntryId: null,
    acceptedBucketListItemId: null,
    sourceChanged: false,
    sourceMissing: false,
    matchedBucketListItemId: null,
    matchedBucketListName: null,
    countryCode: null,
    firstSeenAt: '2026-09-10T06:00:00Z',
    lastSeenAt: '2026-09-10T06:00:00Z',
    ...over,
  }
}

/** Two rows, because "replaced in place" is only provable against a neighbour. */
function list(over: Partial<DawarichSuggestionList> = {}): DawarichSuggestionList {
  return {
    suggestions: [stay({ id: 1 }), stay({ id: 2 })],
    connected: true,
    lastSyncAt: '2026-09-12T06:00:00Z',
    lastSyncState: 'ok',
    lastSyncError: null,
    ...over,
  }
}

function acceptResult(suggestion: DawarichSuggestion): DawarichAcceptResult {
  return {
    suggestion,
    createdPlaceId: suggestion.acceptedPlaceId,
    createdJournalEntryId: suggestion.acceptedJournalEntryId,
    bucketListItemId: null,
  }
}

/** A promise this test controls the settling of, to pin down state mid-flight. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

type Filter = Parameters<typeof useDawarichSuggestions>[0]

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children)

function mount(filter?: Filter) {
  return renderHook((props: Filter) => useDawarichSuggestions(props), { wrapper, initialProps: filter })
}

const PLACE_BODY: DawarichAccept = { target: 'place', tripId: 7, dayId: 3 }

// The shipped English for the keys the hook reaches for. Written out rather than
// read back from the bundle so a reader of this file sees the sentence that ends
// up on screen, and so a reworded string is a decision somebody makes here too.
const EN = {
  offline: 'This needs a connection — TREK is offline right now.',
  unauthorized: 'Dawarich rejected the API key.',
  unknown: 'Something went wrong talking to Dawarich.',
  acceptError: 'Could not add this',
  updateError: 'Could not update this suggestion',
  acceptedPlace: 'Added to the trip',
  acceptedJournal: 'Added to the journal',
}

beforeEach(() => {
  useAddonStore.setState({ addons: [ADDON], loaded: true })
  setForcedOffline(false)
  repo.suggestions.mockReset().mockResolvedValue(list())
  api.accept.mockReset()
  api.setState.mockReset()
  toast.success.mockReset()
  toast.error.mockReset()
})

// The force-offline flag is module state, not component state: left on, it would
// leak into the next file's writes.
afterEach(() => setForcedOffline(false))

describe('useDawarichSuggestions', () => {
  it('FE-DAWARICH-SUGG-001: an instance without the addon asks nothing and reports idle', () => {
    useAddonStore.setState({ addons: [{ ...ADDON, enabled: false }] })

    const { result } = mount()

    // `idle` is what the panel keys "render nothing at all" off, so the empty
    // defaults underneath it matter as much as the status itself.
    expect(result.current.status).toBe('idle')
    expect(repo.suggestions).not.toHaveBeenCalled()
    expect(result.current.suggestions).toEqual([])
    expect(result.current.lastSyncState).toBe('never')
    expect(result.current.lastSyncError).toBeNull()
  })

  it('FE-DAWARICH-SUGG-002: the enabled addon reads with the filter it was handed and reports the sync', async () => {
    const read = deferred<DawarichSuggestionList>()
    repo.suggestions.mockReturnValueOnce(read.promise)

    const { result } = mount({ tripId: 7, state: 'new' })

    expect(result.current.status).toBe('loading')
    await act(async () => read.resolve(list()))

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(repo.suggestions).toHaveBeenCalledWith({ tripId: 7, state: 'new' })
    expect(result.current.suggestions.map(s => s.id)).toEqual([1, 2])
    expect(result.current.lastSyncAt).toBe('2026-09-12T06:00:00Z')
    expect(result.current.lastSyncState).toBe('ok')
    expect(result.current.lastSyncError).toBeNull()
  })

  it('FE-DAWARICH-SUGG-003: a list from an instance nobody is connected to still shows its rows', async () => {
    // The suggestions survive a disconnect: they are TREK's own rows by then,
    // and hiding them would lose a backlog somebody still has to work through.
    repo.suggestions.mockResolvedValue(list({ connected: false, lastSyncState: 'never', lastSyncAt: null }))

    const { result } = mount()

    await waitFor(() => expect(result.current.status).toBe('disconnected'))
    expect(result.current.suggestions).toHaveLength(2)
    expect(result.current.lastSyncAt).toBeNull()
  })

  it('FE-DAWARICH-SUGG-004: a read refused for being offline says offline, and says it quietly', async () => {
    repo.suggestions.mockRejectedValue(new DawarichOfflineError())

    const { result } = mount()

    await waitFor(() => expect(result.current.status).toBe('offline'))
    // No toast: a read that could not run is a state the panel renders, not an
    // incident to interrupt somebody with.
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-SUGG-005: any other failure is unavailable, kept apart from offline', async () => {
    repo.suggestions.mockRejectedValue({ response: { data: { code: 'unreachable' } } })

    const { result } = mount()

    await waitFor(() => expect(result.current.status).toBe('unavailable'))
    expect(result.current.suggestions).toEqual([])
  })

  it('FE-DAWARICH-SUGG-006: reload re-reads with the same (absent) filter and takes the new answer', async () => {
    repo.suggestions
      .mockResolvedValueOnce(list())
      .mockResolvedValueOnce(list({ suggestions: [stay({ id: 3 })] }))

    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    act(() => result.current.reload())

    await waitFor(() => expect(result.current.suggestions.map(s => s.id)).toEqual([3]))
    expect(repo.suggestions).toHaveBeenCalledTimes(2)
    expect(repo.suggestions).toHaveBeenLastCalledWith({ tripId: undefined, state: undefined })
  })

  it('FE-DAWARICH-SUGG-007: a changed filter re-reads, an equal one does not', async () => {
    const { result, rerender } = mount({ tripId: 7 })
    await waitFor(() => expect(result.current.status).toBe('ready'))

    rerender({ tripId: 9, state: 'dismissed' })
    await waitFor(() => expect(repo.suggestions).toHaveBeenLastCalledWith({ tripId: 9, state: 'dismissed' }))
    // The request is fired synchronously by the effect, so the assertion above
    // can pass while the answer is still in the air. Let it land first: what the
    // next render must not do is start a third read, and that is only a clean
    // statement once the second one is finished.
    await waitFor(() => expect(result.current.status).toBe('ready'))

    // A fresh object carrying the same two values. The effect depends on the
    // unpacked primitives precisely so this does not fire a second request.
    // Every caller builds its filter object inline on every render.
    rerender({ tripId: 9, state: 'dismissed' })
    expect(repo.suggestions).toHaveBeenCalledTimes(2)
  })

  it('FE-DAWARICH-SUGG-008: the answer to the previous filter never overwrites the current list', async () => {
    const first = deferred<DawarichSuggestionList>()
    const second = deferred<DawarichSuggestionList>()
    repo.suggestions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    const { result, rerender } = mount({ tripId: 7 })
    rerender({ tripId: 8 })

    await act(async () => second.resolve(list({ suggestions: [stay({ id: 8 })] })))
    await waitFor(() => expect(result.current.suggestions.map(s => s.id)).toEqual([8]))

    // The slow trip-7 read lands last. Without the cancelled flag the reader
    // would now be looking at another trip's stays under trip 8's heading.
    await act(async () => first.resolve(list({ suggestions: [stay({ id: 7 })] })))
    expect(result.current.suggestions.map(s => s.id)).toEqual([8])
    expect(result.current.status).toBe('ready')
  })

  it('FE-DAWARICH-SUGG-009: a read that fails after the panel closed changes nothing', async () => {
    const read = deferred<DawarichSuggestionList>()
    repo.suggestions.mockReturnValueOnce(read.promise)

    const { result, unmount } = mount()
    expect(result.current.status).toBe('loading')
    unmount()

    await act(async () => read.reject(new DawarichOfflineError()))

    // The last value the hook ever rendered, untouched by the late rejection.
    expect(result.current.status).toBe('loading')
  })

  it('FE-DAWARICH-SUGG-010: accepting while offline is refused before the request, not after a timeout', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    // The reader flips the offline switch while the list is on screen. Reads go
    // through the repo, which knows; this write does not, so the hook says so.
    setForcedOffline(true)
    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.accept(1, PLACE_BODY)
    })

    expect(ok).toBe(false)
    expect(api.accept).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(EN.offline)
    expect(result.current.busyId).toBeNull()
  })

  it('FE-DAWARICH-SUGG-011: accepting marks the row busy, replaces only that row, and never refetches', async () => {
    const settled = deferred<DawarichAcceptResult>()
    api.accept.mockReturnValueOnce(settled.promise)
    const accepted = stay({ id: 1, state: 'accepted', target: 'place', acceptedPlaceId: 41 })

    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let pending!: Promise<boolean>
    act(() => {
      pending = result.current.accept(1, PLACE_BODY)
    })
    // The row is disabled while its write is in the air; only that row.
    expect(result.current.busyId).toBe(1)

    await act(async () => settled.resolve(acceptResult(accepted)))

    await expect(pending).resolves.toBe(true)
    expect(api.accept).toHaveBeenCalledWith(1, PLACE_BODY)
    expect(result.current.suggestions[0]).toEqual(accepted)
    expect(result.current.suggestions[1]).toEqual(stay({ id: 2 }))
    expect(result.current.busyId).toBeNull()
    expect(toast.success).toHaveBeenCalledWith(EN.acceptedPlace)
    // One read, for the mount. A refetch here would reorder the list under the
    // cursor of somebody working down a backlog.
    expect(repo.suggestions).toHaveBeenCalledTimes(1)

    // The target picks the sentence: a stay written into a journal must not be
    // reported as added to the trip.
    const journalled = stay({ id: 2, state: 'accepted', target: 'journal', acceptedJournalEntryId: 88 })
    api.accept.mockResolvedValueOnce(acceptResult(journalled))
    await act(async () => {
      await result.current.accept(2, { target: 'journal', journalId: 5 })
    })
    expect(toast.success).toHaveBeenLastCalledWith(EN.acceptedJournal)
  })

  it('FE-DAWARICH-SUGG-012: a failure carrying a known code is said in the language of the install', async () => {
    // The server sends both. The code wins, so a German install never gets the
    // English sentence sitting right beside it in the envelope.
    api.accept.mockRejectedValue({ response: { data: { code: 'unauthorized', error: 'Dawarich rejected the API key' } } })

    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.accept(1, PLACE_BODY)
    })

    expect(ok).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(EN.unauthorized)
    // Nothing was written, so nothing in the list may look as if it had been.
    expect(result.current.suggestions[0].state).toBe('new')
    expect(result.current.busyId).toBeNull()
  })

  it('FE-DAWARICH-SUGG-013: an unknown code falls back to the server prose, and no envelope to the generic sentence', async () => {
    // A code from a server newer than this build: the prose beside it is the
    // only thing left that describes what actually happened.
    api.accept.mockRejectedValueOnce({ response: { data: { code: 'meteor_strike', error: 'Dawarich fell over' } } })

    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      await result.current.accept(1, PLACE_BODY)
    })
    expect(toast.error).toHaveBeenCalledWith('Dawarich fell over')

    // A transport-level failure carries no envelope at all.
    api.accept.mockRejectedValueOnce(new Error('Network Error'))
    await act(async () => {
      await result.current.accept(1, PLACE_BODY)
    })
    expect(toast.error).toHaveBeenLastCalledWith(EN.acceptError)
  })

  it('FE-DAWARICH-SUGG-014: dismiss and restore move the one row between the two states', async () => {
    api.setState.mockImplementation(async (id: number, next: 'new' | 'dismissed') => stay({ id, state: next }))

    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      await result.current.dismiss(2)
    })
    expect(api.setState).toHaveBeenCalledWith(2, 'dismissed')
    expect(result.current.suggestions.map(s => s.state)).toEqual(['new', 'dismissed'])

    // Restoring is the same call with the other value. The panel offers it on
    // the handled rows, and it has to land on the same row it left.
    await act(async () => {
      await result.current.restore(2)
    })
    expect(api.setState).toHaveBeenLastCalledWith(2, 'new')
    expect(result.current.suggestions.map(s => s.state)).toEqual(['new', 'new'])
    expect(result.current.busyId).toBeNull()
  })

  it('FE-DAWARICH-SUGG-015: dismissing while offline is refused before the request too', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    setForcedOffline(true)
    await act(async () => {
      await result.current.dismiss(1)
    })

    expect(api.setState).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(EN.offline)
    expect(result.current.busyId).toBeNull()
  })

  it('FE-DAWARICH-SUGG-016: a state change that fails leaves the row alone and clears the busy flag', async () => {
    // An envelope with neither a code nor prose: a 500 through a proxy that
    // rewrote the body. The generic sentence is all that is left to say.
    api.setState.mockRejectedValue({ response: { data: {} } })

    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      await result.current.dismiss(1)
    })

    expect(toast.error).toHaveBeenCalledWith(EN.updateError)
    expect(result.current.suggestions[0].state).toBe('new')
    // Cleared in `finally`: a row left busy after a failure can never be pressed
    // again, and the only way out would be a reload.
    expect(result.current.busyId).toBeNull()
  })

  it('FE-DAWARICH-SUGG-017: the last sync reason is translated, with a sentence for a code this build does not know', async () => {
    repo.suggestions.mockResolvedValue(list({ lastSyncState: 'failed', lastSyncError: 'unauthorized' }))
    const known = mount()
    await waitFor(() => expect(known.result.current.lastSyncError).toBe(EN.unauthorized))
    expect(known.result.current.lastSyncState).toBe('failed')
    known.unmount()

    // A newer server reporting a reason this build has no string for. Showing
    // the bare code would put `dawarich.error.meteor_strike` on screen.
    repo.suggestions.mockResolvedValue(list({ lastSyncState: 'partial', lastSyncError: 'meteor_strike' }))
    const unfamiliar = mount()
    await waitFor(() => expect(unfamiliar.result.current.lastSyncError).toBe(EN.unknown))
  })

  it('FE-DAWARICH-SUGG-018: a refused state change is said in the language of the install too', async () => {
    // Dismissing has its own error chain, and the code path through it is the
    // one somebody hits when the API key was revoked while the list sat open.
    // Only the generic fallback is exercised above, so without this the panel
    // could start answering half its failures in English and nothing would say so.
    api.setState.mockRejectedValue({
      response: { data: { code: 'unauthorized', error: 'Dawarich rejected the API key' } },
    })

    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    await act(async () => {
      await result.current.restore(1)
    })

    expect(toast.error).toHaveBeenCalledWith(EN.unauthorized)
    expect(result.current.suggestions[0].state).toBe('new')
    expect(result.current.busyId).toBeNull()
  })

  it('FE-DAWARICH-SUGG-019: a rejection carrying no reason at all still ends in a sentence and a false', async () => {
    // `Promise.reject()` with nothing in it is what an aborted request hands the
    // catch block. Reading `.response` off that unguarded throws inside the error
    // handler itself, and the dialog waiting on `accept` would then get a
    // rejected promise where it expects a plain `false` and stay open forever.
    api.accept.mockRejectedValueOnce(undefined)

    const { result } = mount()
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.accept(1, PLACE_BODY)
    })

    expect(ok).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(EN.acceptError)
    expect(result.current.busyId).toBeNull()
  })
})
