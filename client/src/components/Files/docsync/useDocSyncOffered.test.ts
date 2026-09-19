// FE-DOCSYNC-OFFER-001 to FE-DOCSYNC-OFFER-013

/**
 * Whether the Files screen offers document sync.
 *
 * The providers ship switched off, so the rule is what keeps an upgraded
 * instance from growing a button into an empty dialog on every trip: a bound
 * trip shows it to everybody, an unbound one only to somebody who could bind
 * it, and only once the admin has switched a provider on.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { act, renderHook, waitFor } from '../../../../tests/helpers/render'
import { server } from '../../../../tests/helpers/msw/server'
import { useDocSyncOfferStore } from '../../../store/docSyncOfferStore'
import { setForcedOffline } from '../../../sync/networkMode'
import { useDocSyncOffered } from './useDocSyncOffered'

const listeners = new Set<(e: Record<string, unknown>) => void>()

vi.mock('../../../api/websocket', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../api/websocket')>()),
  addListener: (fn: (e: Record<string, unknown>) => void) => { listeners.add(fn) },
  removeListener: (fn: (e: Record<string, unknown>) => void) => { listeners.delete(fn) },
}))

/** Deliver an event the way the websocket layer would. */
function emit(type: string): void {
  for (const fn of [...listeners]) fn({ type })
}

const TRIP = 4

let providerCalls = 0
let linkCalls = 0

function routes({ providers = [] as unknown[], links = [] as unknown[], linksStatus = 200 } = {}) {
  server.use(
    http.get('/api/trips/:tripId/docsync/providers', () => {
      providerCalls += 1
      return HttpResponse.json(providers)
    }),
    http.get('/api/trips/:tripId/docsync/links', () => {
      linkCalls += 1
      return linksStatus === 200
        ? HttpResponse.json(links)
        : HttpResponse.json({ error: 'nope' }, { status: linksStatus })
    }),
  )
}

const paperless = { id: 'paperless', name: 'Paperless-ngx', available: true }
const binding = { id: 1, providerId: 'paperless' }

beforeEach(() => {
  providerCalls = 0
  linkCalls = 0
  listeners.clear()
  useDocSyncOfferStore.setState({ bound: {}, providers: null })
})

afterEach(() => setForcedOffline(false))

describe('useDocSyncOffered', () => {
  it('FE-DOCSYNC-OFFER-001: somebody who may bind the trip sees it once a provider is on, without asking about bindings', async () => {
    routes({ providers: [paperless] })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, true))

    await waitFor(() => expect(result.current).toBe(true))
    expect(providerCalls).toBe(1)
    expect(linkCalls).toBe(0)
  })

  it('FE-DOCSYNC-OFFER-002: with every provider off and nothing bound, nobody sees it', async () => {
    routes({ providers: [] })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, true))

    await waitFor(() => expect(linkCalls).toBe(1))
    expect(result.current).toBe(false)
  })

  it('FE-DOCSYNC-OFFER-003: a provider row without an adapter does not count as offered', async () => {
    routes({ providers: [{ ...paperless, available: false }] })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, true))

    await waitFor(() => expect(linkCalls).toBe(1))
    expect(result.current).toBe(false)
  })

  it('FE-DOCSYNC-OFFER-004: a member sees a bound trip, and is never asked about providers', async () => {
    routes({ providers: [paperless], links: [binding] })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, false))

    await waitFor(() => expect(result.current).toBe(true))
    expect(providerCalls).toBe(0)
  })

  it('FE-DOCSYNC-OFFER-005: a member does not see an unbound trip, providers or not', async () => {
    routes({ providers: [paperless], links: [] })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, false))

    await waitFor(() => expect(linkCalls).toBe(1))
    expect(result.current).toBe(false)
  })

  it('FE-DOCSYNC-OFFER-006: a bound trip keeps the button after the admin switched every provider off', async () => {
    routes({ providers: [], links: [binding] })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, true))

    await waitFor(() => expect(result.current).toBe(true))
  })

  it('FE-DOCSYNC-OFFER-007: the last answer renders at once on the next visit, then is checked again', async () => {
    routes({ links: [binding] })
    const first = renderHook(() => useDocSyncOffered(TRIP, false))
    await waitFor(() => expect(first.result.current).toBe(true))
    first.unmount()

    const second = renderHook(() => useDocSyncOffered(TRIP, false))
    expect(second.result.current).toBe(true)
    await waitFor(() => expect(linkCalls).toBe(2))
  })

  it('FE-DOCSYNC-OFFER-008: offline it asks nothing and keeps what it knew, and asks again once back', async () => {
    routes({ links: [] })
    useDocSyncOfferStore.setState({ bound: { [TRIP]: true } })
    act(() => setForcedOffline(true))
    const { result } = renderHook(() => useDocSyncOffered(TRIP, false))

    expect(result.current).toBe(true)
    expect(linkCalls).toBe(0)

    act(() => setForcedOffline(false))
    await waitFor(() => expect(result.current).toBe(false))
    expect(linkCalls).toBe(1)
  })

  it('FE-DOCSYNC-OFFER-009: a request that never got an answer leaves the last one standing', async () => {
    server.use(http.get('/api/trips/:tripId/docsync/links', () => HttpResponse.error()))
    useDocSyncOfferStore.setState({ bound: { [TRIP]: true } })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, false))

    await act(() => useDocSyncOfferStore.getState().refresh(TRIP, false))
    expect(result.current).toBe(true)
  })

  it('FE-DOCSYNC-OFFER-010: the Documents addon switched off is a real no', async () => {
    routes({ linksStatus: 403 })
    useDocSyncOfferStore.setState({ bound: { [TRIP]: true } })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, false))

    await waitFor(() => expect(result.current).toBe(false))
  })

  it('FE-DOCSYNC-OFFER-011: a refresh asked for while offline sends nothing and changes nothing', async () => {
    routes({ providers: [paperless] })
    useDocSyncOfferStore.setState({ providers: false })
    setForcedOffline(true)

    await useDocSyncOfferStore.getState().refresh(TRIP, true)

    expect(providerCalls).toBe(0)
    expect(useDocSyncOfferStore.getState().providers).toBe(false)
  })

  it('FE-DOCSYNC-OFFER-012: a member on the Files tab gets the button when the owner binds the trip', async () => {
    routes({ links: [] })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, false))
    await waitFor(() => expect(linkCalls).toBe(1))
    expect(result.current).toBe(false)

    // The owner binds it: nothing remounts here, the server only pings.
    routes({ links: [binding] })
    act(() => emit('docsync:changed'))

    await waitFor(() => expect(result.current).toBe(true))
    expect(linkCalls).toBe(2)
  })

  it('FE-DOCSYNC-OFFER-013: the button goes when the last binding does, with every provider off', async () => {
    routes({ providers: [], links: [binding] })
    const { result } = renderHook(() => useDocSyncOffered(TRIP, true))
    await waitFor(() => expect(result.current).toBe(true))

    routes({ providers: [], links: [] })
    act(() => emit('docsync:changed'))

    await waitFor(() => expect(result.current).toBe(false))
  })
})
