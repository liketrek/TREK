// FE-DOCSYNC-HOOK-001 to FE-DOCSYNC-HOOK-026

/**
 * The document-sync hook.
 *
 * Everything the panel and the phone sheet know about sync comes through here,
 * so the interesting behaviour is what a person sees: holdings that arrive on a
 * different route than the bindings they belong to, a dialog that must not flash
 * white every time a switch is flipped, a toggle that moves before the server
 * has answered, and a probe that has to produce a verdict even when the request
 * itself fell over.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '../../../../tests/helpers/render'

const providersApi = vi.fn(async (_tripId: number | string): Promise<unknown> => [])
const statusApi = vi.fn(async (_tripId: number | string): Promise<unknown> => ({}))
const listConnectionsApi = vi.fn(async (_tripId: number | string): Promise<unknown> => [])
const listLinksApi = vi.fn(async (_tripId: number | string): Promise<unknown> => [])
const saveConnectionApi = vi.fn(async (_tripId: number | string, _data: unknown): Promise<unknown> => ({}))
const testConnectionApi = vi.fn(async (_tripId: number | string, _data: unknown): Promise<unknown> => ({ connected: true }))
const updateLinkApi = vi.fn(async (_tripId: number | string, _linkId: number, _patch: unknown): Promise<unknown> => ({}))
const syncNowApi = vi.fn(async (_tripId: number | string, _linkId: number, _full: boolean): Promise<unknown> => ({}))

vi.mock('../../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/client')>()
  return {
    ...actual,
    docsyncApi: {
      ...actual.docsyncApi,
      providers: (tripId: number | string) => providersApi(tripId),
      status: (tripId: number | string) => statusApi(tripId),
      listConnections: (tripId: number | string) => listConnectionsApi(tripId),
      listLinks: (tripId: number | string) => listLinksApi(tripId),
      saveConnection: (tripId: number | string, data: unknown) => saveConnectionApi(tripId, data),
      testConnection: (tripId: number | string, data: unknown) => testConnectionApi(tripId, data),
      updateLink: (tripId: number | string, linkId: number, patch: unknown) => updateLinkApi(tripId, linkId, patch),
      syncNow: (tripId: number | string, linkId: number, full: boolean) => syncNowApi(tripId, linkId, full),
    },
  }
})

import { useDocSync, canManageDocSync, storeName, type DocSyncLink, type DocSyncProvider } from './useDocSync'

const TRIP = 3

const provider = (overrides: Record<string, unknown> = {}) => ({
  id: 'nextcloud',
  name: 'Nextcloud',
  description: null,
  icon: 'cloud',
  available: true,
  fields: [],
  ...overrides,
})

const connection = (overrides: Record<string, unknown> = {}) => ({
  id: 9,
  providerId: 'nextcloud',
  baseUrl: 'https://cloud.example',
  settings: {},
  secrets: {},
  allowInsecureTls: false,
  lastProbeState: 'ok',
  lastProbeError: null,
  ...overrides,
})

const link = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  connectionId: 9,
  providerId: 'nextcloud',
  scopeKey: 'trip',
  remoteLabel: 'Trip documents',
  remoteRootPath: '/Trips/Rome',
  direction: 'both',
  deletePolicy: 'unlink',
  conflictPolicy: 'newer',
  syncEnabled: true,
  lastSyncAt: null,
  lastSyncState: 'idle',
  lastSyncError: null,
  webhookUrl: null,
  ...overrides,
})

/** A promise this test settles by hand, to hold a request open. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

/** Mount the hook and record `loading` on every render it goes through. */
function mount(tripId: number | string = TRIP, enabled = true) {
  const seenLoading: boolean[] = []
  const view = renderHook(() => {
    const hook = useDocSync(tripId, enabled)
    seenLoading.push(hook.loading)
    return hook
  })
  return { ...view, seenLoading }
}

/** Mount and wait until the first load is through. */
async function mountLoaded(tripId: number | string = TRIP) {
  const view = mount(tripId)
  await waitFor(() => expect(view.result.current.loading).toBe(false))
  return view
}

beforeEach(() => {
  vi.clearAllMocks()
  providersApi.mockResolvedValue([provider()])
  statusApi.mockResolvedValue({ items: {}, links: [] })
  listConnectionsApi.mockResolvedValue([connection()])
  listLinksApi.mockResolvedValue([link()])
  saveConnectionApi.mockResolvedValue({})
  testConnectionApi.mockResolvedValue({ connected: true })
  updateLinkApi.mockResolvedValue({})
  syncNowApi.mockResolvedValue({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 })
})

describe('useDocSync initial load', () => {
  it('FE-DOCSYNC-HOOK-001: joins the status route holdings onto the binding they belong to', async () => {
    const holdings = { inTrek: 7, atProvider: 5, paired: 4, missing: 1 }
    listLinksApi.mockResolvedValue([link()])
    statusApi.mockResolvedValue({ items: { conflict: 2, pending: 1 }, links: [{ id: 1, holdings }] })

    const { result } = await mountLoaded()

    expect(result.current.links).toHaveLength(1)
    expect(result.current.links[0].holdings).toEqual(holdings)
    expect(result.current.itemCounts).toEqual({ conflict: 2, pending: 1 })
    expect(result.current.connections).toEqual([connection()])
  })

  it('FE-DOCSYNC-HOOK-002: a binding the status route never mentions does not inherit another binding counts', async () => {
    const holdings = { inTrek: 7, atProvider: 5, paired: 4, missing: 1 }
    listLinksApi.mockResolvedValue([link(), link({ id: 2, remoteLabel: 'Receipts' })])
    statusApi.mockResolvedValue({ items: {}, links: [{ id: 1, holdings }] })

    const { result } = await mountLoaded()

    expect(result.current.links[0].holdings).toEqual(holdings)
    expect(result.current.links[1].holdings).toBeUndefined()
  })

  it('FE-DOCSYNC-HOOK-025: carries the provider switch from the status route onto its binding', async () => {
    listLinksApi.mockResolvedValue([link(), link({ id: 2 }), link({ id: 3 })])
    statusApi.mockResolvedValue({ items: {}, links: [{ id: 1, providerOff: true }, { id: 2, providerOff: false }] })

    const { result } = await mountLoaded()

    // The third is one the status route never mentions: running, not paused.
    expect(result.current.links.map(l => l.providerOff)).toEqual([true, false, false])
  })

  it('FE-DOCSYNC-HOOK-003: a status body without an items map leaves the counts empty', async () => {
    statusApi.mockResolvedValue({})

    const { result } = await mountLoaded()

    expect(result.current.itemCounts).toEqual({})
    expect(result.current.links[0].holdings).toBeUndefined()
  })

  it('FE-DOCSYNC-HOOK-004: offers only the providers this instance can actually use', async () => {
    providersApi.mockResolvedValue([
      provider(),
      provider({ id: 'gdrive', name: 'Google Drive', available: false }),
    ])

    const { result } = await mountLoaded()

    expect(result.current.providers.map(p => p.id)).toEqual(['nextcloud'])
  })

  it('FE-DOCSYNC-HOOK-005: a failed load leaves nothing to configure instead of blowing up', async () => {
    // The addon was switched off, or this member lost access to the trip.
    providersApi.mockRejectedValue(Object.assign(new Error('forbidden'), { response: { status: 403 } }))

    const { result } = await mountLoaded()

    expect(result.current.providers).toEqual([])
    expect(result.current.links).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('FE-DOCSYNC-HOOK-023: a reload that finds the addon gone drops the bindings it had loaded', async () => {
    statusApi.mockResolvedValue({ items: { conflict: 1 }, links: [] })
    const { result } = await mountLoaded()
    expect(result.current.links).toHaveLength(1)

    providersApi.mockRejectedValue(Object.assign(new Error('not found'), { response: { status: 404 } }))
    await act(async () => { await result.current.load() })

    expect(result.current.providers).toEqual([])
    expect(result.current.connections).toEqual([])
    expect(result.current.links).toEqual([])
    expect(result.current.itemCounts).toEqual({})
    expect(result.current.error).toBeNull()
  })

  it('FE-DOCSYNC-HOOK-006: asks the server nothing while the panel is closed', async () => {
    const { result } = mount(TRIP, false)

    await act(async () => { await Promise.resolve() })

    expect(providersApi).not.toHaveBeenCalled()
    expect(listLinksApi).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })
})

describe('useDocSync spinner', () => {
  it('FE-DOCSYNC-HOOK-007: shows the spinner for the first load, which has nothing to show yet', async () => {
    const gate = deferred<unknown>()
    listLinksApi.mockReturnValueOnce(gate.promise)

    const { result, seenLoading } = mount()

    expect(result.current.loading).toBe(true)
    expect(seenLoading[seenLoading.length - 1]).toBe(true)

    await act(async () => { gate.resolve([link()]) })
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('FE-DOCSYNC-HOOK-008: never raises the spinner again while a mutation refetches', async () => {
    // Regression guard: a refetch that flips `loading` swaps the whole dialog
    // for a spinner and back, so flipping one switch flashes the panel white.
    const { result, seenLoading } = await mountLoaded()
    const gate = deferred<unknown>()
    listLinksApi.mockReturnValueOnce(gate.promise)
    seenLoading.length = 0

    let pending!: Promise<boolean>
    await act(async () => { pending = result.current.updateLink(1, { syncEnabled: false }) })
    expect(result.current.loading).toBe(false)

    await act(async () => {
      gate.resolve([link({ syncEnabled: false })])
      await pending
    })

    // the refetch really happened...
    expect(listLinksApi).toHaveBeenCalledTimes(2)
    // ...and the panel never went blank for it
    expect(seenLoading).not.toContain(true)
    expect(result.current.loading).toBe(false)
  })
})

describe('useDocSync updateLink', () => {
  it('FE-DOCSYNC-HOOK-009: moves the switch before the server has answered', async () => {
    const { result } = await mountLoaded()
    const gate = deferred<unknown>()
    updateLinkApi.mockReturnValueOnce(gate.promise)

    let pending!: Promise<boolean>
    await act(async () => { pending = result.current.updateLink(1, { direction: 'pull' }) })

    expect(result.current.links[0].direction).toBe('pull')
    expect(updateLinkApi).toHaveBeenCalledWith(TRIP, 1, { direction: 'pull' })

    await act(async () => { gate.resolve({}); await pending })
  })

  it('FE-DOCSYNC-HOOK-010: reloads afterwards, so the server row is what stays on screen', async () => {
    const { result } = await mountLoaded()
    listLinksApi.mockResolvedValue([link({ direction: 'pull', lastSyncState: 'ok', remoteLabel: 'Trip documents (moved)' })])

    await act(async () => { await result.current.updateLink(1, { direction: 'pull' }) })

    expect(listLinksApi).toHaveBeenCalledTimes(2)
    expect(result.current.links[0].remoteLabel).toBe('Trip documents (moved)')
    expect(result.current.links[0].lastSyncState).toBe('ok')
  })

  it('FE-DOCSYNC-HOOK-011: a rejected update does not leave the optimistic value standing', async () => {
    const { result } = await mountLoaded()
    updateLinkApi.mockRejectedValueOnce({ response: { data: { error: 'forbidden' } } })
    listLinksApi.mockResolvedValueOnce([link({ direction: 'both' })])

    let ok: boolean | undefined
    await act(async () => { ok = await result.current.updateLink(1, { direction: 'pull' }) })

    // Reported rather than thrown: both shells call this as `void`, so a
    // rejection reached nobody. The reload puts the server's answer back and
    // the reason stays on screen.
    expect(ok).toBe(false)
    expect(result.current.links[0].direction).toBe('both')
    expect(result.current.error).toBe('forbidden')
  })
})

describe('useDocSync testConnection', () => {
  it('FE-DOCSYNC-HOOK-012: hands the probe verdict back to the form', async () => {
    testConnectionApi.mockResolvedValue({ connected: true, account: 'owner@cloud.example' })
    const { result } = await mountLoaded()

    let verdict: { connected: boolean; account?: string; error?: string } | undefined
    await act(async () => {
      verdict = await result.current.testConnection('nextcloud', 'https://cloud.example', { token: 'abc' }, false)
    })

    expect(verdict).toEqual({ connected: true, account: 'owner@cloud.example' })
    expect(testConnectionApi).toHaveBeenCalledWith(TRIP, {
      providerId: 'nextcloud',
      baseUrl: 'https://cloud.example',
      credentials: { token: 'abc' },
      allowInsecureTls: false,
    })
  })

  it('FE-DOCSYNC-HOOK-013: a request that throws still produces a verdict the form can render', async () => {
    testConnectionApi.mockRejectedValueOnce({ response: { data: { error: 'docsync.unreachable' } } })
    const { result } = await mountLoaded()

    let verdict: { connected: boolean; error?: string } | undefined
    await act(async () => {
      verdict = await result.current.testConnection('nextcloud', 'https://typo.example', {}, false)
    })

    expect(verdict).toEqual({ connected: false, error: 'docsync.unreachable' })
  })

  it('FE-DOCSYNC-HOOK-014: an error with no message of its own falls back to a generic one', async () => {
    testConnectionApi.mockRejectedValueOnce(new Error('socket hang up'))
    const { result } = await mountLoaded()

    let verdict: { connected: boolean; error?: string } | undefined
    await act(async () => {
      verdict = await result.current.testConnection('nextcloud', 'https://cloud.example', {}, false)
    })

    expect(verdict).toEqual({ connected: false, error: 'unknown' })
  })

  it('FE-DOCSYNC-HOOK-015: marks the probe busy while it runs and clears it when it lands', async () => {
    const { result } = await mountLoaded()
    const gate = deferred<unknown>()
    testConnectionApi.mockReturnValueOnce(gate.promise)

    let pending!: Promise<unknown>
    await act(async () => { pending = result.current.testConnection('nextcloud', 'https://cloud.example', {}, false) })
    expect(result.current.busy).toBe('test')

    await act(async () => { gate.resolve({ connected: true }); await pending })
    expect(result.current.busy).toBeNull()
  })
})

describe('useDocSync run and save feedback', () => {
  it('FE-DOCSYNC-HOOK-016: remembers what the last run moved, per binding', async () => {
    syncNowApi.mockResolvedValue({ state: 'ok', pulled: 4, pushed: 2, conflicts: 0, missing: 0 })
    const { result } = await mountLoaded()

    await act(async () => { await result.current.syncNow(1) })

    expect(syncNowApi).toHaveBeenCalledWith(TRIP, 1, false)
    // What a run moved is no longer kept: the flow bar shows standing holdings,
    // which is the question somebody opening the dialog actually has. The run's
    // own numbers were only ever on screen for the moment after pressing it.
    expect(result.current.links).toHaveLength(1)
  })

  it('FE-DOCSYNC-HOOK-017: a refused run says so instead of vanishing into a void call', async () => {
    // syncNow is called as `void sync.syncNow(...)` from both shells, so a
    // rejection that escaped the hook reached nobody. An orphaned binding
    // answers 409 here, and the person pressing the button deserves the reason.
    syncNowApi.mockRejectedValueOnce({ response: { data: { error: 'link_orphaned' } } })
    const { result } = await mountLoaded()

    let outcome: unknown
    await act(async () => { outcome = await result.current.syncNow(1) })

    expect(outcome).toBeNull()
    expect(result.current.error).toBe('link_orphaned')
  })

  it('FE-DOCSYNC-HOOK-026: a run refused because an admin switched the provider off keeps the code', async () => {
    // Both shells render the error as docsync.error.<code>, so the code has to
    // arrive untouched for the sentence to be the right one.
    syncNowApi.mockRejectedValueOnce({ response: { status: 409, data: { error: 'provider_disabled' } } })
    const { result } = await mountLoaded()

    await act(async () => { await result.current.syncNow(1) })

    expect(result.current.error).toBe('provider_disabled')
  })

  it('FE-DOCSYNC-HOOK-018: a refused save reports failure and surfaces the server reason', async () => {
    saveConnectionApi.mockRejectedValueOnce({ response: { data: { message: 'docsync.badCredentials' } } })
    const { result } = await mountLoaded()

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.saveConnection('nextcloud', 'https://cloud.example', { token: 'nope' }, false)
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('docsync.badCredentials')
    expect(result.current.busy).toBeNull()
    // nothing was refetched, because nothing changed server-side
    expect(listLinksApi).toHaveBeenCalledTimes(1)
  })
})

describe('storeName', () => {
  it('FE-DOCSYNC-HOOK-024: prefers the provider list, then the name on the link, then the raw id', () => {
    const bound = link() as DocSyncLink
    const listed = [provider({ name: 'Nextcloud Hub' }) as DocSyncProvider]

    expect(storeName({ ...bound, providerName: 'Nextcloud' }, listed)).toBe('Nextcloud Hub')
    // Switched off by an admin, so the providers route no longer lists it.
    expect(storeName({ ...bound, providerName: 'Nextcloud' }, [])).toBe('Nextcloud')
    expect(storeName(bound, [])).toBe('nextcloud')
  })
})

describe('canManageDocSync', () => {
  it('FE-DOCSYNC-HOOK-019: the trip owner may repoint a binding', () => {
    expect(canManageDocSync({ id: 4, role: 'user' }, { user_id: 4 })).toBe(true)
  })

  it('FE-DOCSYNC-HOOK-020: an instance admin may, even on a trip that is not theirs', () => {
    expect(canManageDocSync({ id: 12, role: 'admin' }, { user_id: 4 })).toBe(true)
  })

  it('FE-DOCSYNC-HOOK-021: an ordinary member may not point the owner archive somewhere else', () => {
    expect(canManageDocSync({ id: 12, role: 'user' }, { user_id: 4 })).toBe(false)
    expect(canManageDocSync({ id: 12, role: 'user' }, null)).toBe(false)
    expect(canManageDocSync({ id: 12, role: 'user' }, {})).toBe(false)
  })

  it('FE-DOCSYNC-HOOK-022: nobody signed in, nobody may manage', () => {
    expect(canManageDocSync(null, { user_id: 4 })).toBe(false)
    expect(canManageDocSync(undefined, { user_id: 4 })).toBe(false)
    // ids arrive as strings on some routes and as numbers on others
    expect(canManageDocSync({ id: '4', role: 'user' }, { user_id: 4 })).toBe(true)
  })
})
