// vi.unmock must run before the module is imported (tests/setup.ts mocks it globally)
vi.unmock('./websocket')

// FE-WSCORE-001 to FE-WSCORE-014
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import {
  connect, disconnect, joinTrip, leaveTrip, getActiveTrips,
  setRefetchCallback, setPreReconnectHook,
} from './websocket'

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances: MockWebSocket[] = []

  readyState: number = MockWebSocket.OPEN
  send = vi.fn((_data: string) => {})
  close = vi.fn(() => {})
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
  }
}

function lastSocket(): MockWebSocket {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1]
}

const realLocation = window.location

beforeEach(() => {
  vi.useFakeTimers()
  MockWebSocket.instances = []
  Object.defineProperty(globalThis, 'WebSocket', {
    writable: true, configurable: true, value: MockWebSocket,
  })
  server.use(http.post('/api/auth/ws-token', () => HttpResponse.json({ token: 'ws-tok' })))
})

afterEach(() => {
  disconnect()
  setRefetchCallback(null)
  setPreReconnectHook(null)
  vi.useRealTimers()
  vi.restoreAllMocks()
  Object.defineProperty(window, 'location', { writable: true, configurable: true, value: realLocation })
})

/** connect() + settle the token fetch so a socket exists. */
async function openSocket(): Promise<MockWebSocket> {
  connect()
  await vi.advanceTimersByTimeAsync(0)
  return lastSocket()
}

describe('websocket > active trips', () => {
  it('FE-WSCORE-001: getActiveTrips lists the joined trips as strings', async () => {
    expect(getActiveTrips()).toEqual([])

    joinTrip(42)
    joinTrip('7')
    expect(getActiveTrips()).toEqual(['42', '7'])

    disconnect()
    expect(getActiveTrips()).toEqual([])
  })

  it('FE-WSCORE-013: join/leave still bookkeep while no socket is open', () => {
    joinTrip(5)
    expect(getActiveTrips()).toEqual(['5'])

    leaveTrip(5)
    expect(getActiveTrips()).toEqual([])
  })

  it('FE-WSCORE-014: a trip joined before onopen is not re-sent while the socket is closing', async () => {
    joinTrip(11)
    const sock = await openSocket()
    sock.readyState = MockWebSocket.CLOSING

    sock.onopen!()

    expect(sock.send).not.toHaveBeenCalled()
  })
})

describe('websocket > reconnect refetch hook', () => {
  it('FE-WSCORE-002: the pre-reconnect hook is awaited before the refetch runs', async () => {
    const order: string[] = []
    setPreReconnectHook(async () => { order.push('flush') })
    setRefetchCallback(() => { order.push('refetch') })

    joinTrip(3)
    const sock = await openSocket()
    sock.onopen!()
    await vi.advanceTimersByTimeAsync(0)

    expect(order).toEqual(['flush', 'refetch'])
  })

  it('FE-WSCORE-003: a rejecting pre-reconnect hook still lets the refetch run', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const refetch = vi.fn((_tripId: string) => {})
    setPreReconnectHook(async () => { throw new Error('queue flush failed') })
    setRefetchCallback(refetch)

    joinTrip(3)
    const sock = await openSocket()
    sock.onopen!()
    await vi.advanceTimersByTimeAsync(0)

    expect(refetch).toHaveBeenCalledWith('3')
    expect(consoleError).toHaveBeenCalled()
  })

  it('FE-WSCORE-004: a throwing refetch callback is logged, not propagated', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    setRefetchCallback(() => { throw new Error('store blew up') })

    joinTrip(3)
    const sock = await openSocket()

    expect(() => sock.onopen!()).not.toThrow()
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to refetch trip data on reconnect:',
      expect.any(Error),
    )
  })

  it('FE-WSCORE-005: with no joined trips onopen sends nothing and skips the refetch', async () => {
    const refetch = vi.fn((_tripId: string) => {})
    setRefetchCallback(refetch)

    const sock = await openSocket()
    sock.onopen!()

    expect(sock.send).not.toHaveBeenCalled()
    expect(refetch).not.toHaveBeenCalled()
  })
})

describe('websocket > connection lifecycle', () => {
  it('FE-WSCORE-006: connect() is a no-op while a socket is still CONNECTING', async () => {
    const sock = await openSocket()
    sock.readyState = MockWebSocket.CONNECTING

    connect()
    await vi.advanceTimersByTimeAsync(0)

    expect(MockWebSocket.instances).toHaveLength(1)
  })

  it('FE-WSCORE-007: connect() cancels a pending reconnect timer', async () => {
    server.use(http.post('/api/auth/ws-token', () => new HttpResponse(null, { status: 503 })))
    connect()
    await vi.advanceTimersByTimeAsync(0)
    expect(MockWebSocket.instances).toHaveLength(0)

    // A retry is now armed; connect() must clear it and dial immediately.
    server.use(http.post('/api/auth/ws-token', () => HttpResponse.json({ token: 'fresh' })))
    connect()
    await vi.advanceTimersByTimeAsync(0)
    expect(MockWebSocket.instances).toHaveLength(1)

    // The cancelled timer must not fire a second dial afterwards.
    await vi.advanceTimersByTimeAsync(5000)
    expect(MockWebSocket.instances).toHaveLength(1)
  })

  it('FE-WSCORE-008: a duplicate close does not stack a second timer or skip a backoff step', async () => {
    const sock = await openSocket()

    // Every further token fetch fails, so each retry attempt is countable.
    let attempts = 0
    server.use(http.post('/api/auth/ws-token', () => {
      attempts++
      return new HttpResponse(null, { status: 503 })
    }))

    // A browser can deliver close twice (after onerror); the second must be ignored.
    sock.onclose!()
    sock.onclose!()

    await vi.advanceTimersByTimeAsync(1001)
    await vi.advanceTimersByTimeAsync(0)
    expect(attempts, 'first retry fires after the 1s delay').toBe(1)

    // Backoff advanced once (1s → 2s), not twice, so the next retry lands at 2s.
    await vi.advanceTimersByTimeAsync(2001)
    await vi.advanceTimersByTimeAsync(0)
    expect(attempts, 'second retry fires after the doubled 2s delay').toBe(2)

    expect(MockWebSocket.instances).toHaveLength(1)
  })

  it('FE-WSCORE-009: a failing ws-token fetch schedules a retry instead of throwing', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))

    connect()
    await vi.advanceTimersByTimeAsync(0)
    expect(MockWebSocket.instances).toHaveLength(0)

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ token: 'back-online' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }),
    )
    await vi.advanceTimersByTimeAsync(1001)
    await vi.advanceTimersByTimeAsync(0)

    expect(MockWebSocket.instances).toHaveLength(1)
    expect(lastSocket().url).toContain('token=back-online')
  })

  it('FE-WSCORE-010: the socket URL uses ws:// on http and wss:// on https', async () => {
    const httpSock = await openSocket()
    expect(httpSock.url.startsWith('ws://')).toBe(true)

    disconnect()
    MockWebSocket.instances = []
    Object.defineProperty(window, 'location', {
      writable: true, configurable: true,
      value: {
        protocol: 'https:',
        host: 'trip.example',
        origin: 'https://trip.example',
        href: 'https://trip.example/dashboard',
        pathname: '/dashboard',
      },
    })

    const secure = await openSocket()
    expect(secure.url).toBe('wss://trip.example/ws?token=ws-tok')
  })

  it('FE-WSCORE-011: disconnect() detaches onclose so no reconnect is armed', async () => {
    const sock = await openSocket()
    disconnect()

    expect(sock.onclose).toBeNull()
    expect(sock.close).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(5000)
    expect(MockWebSocket.instances).toHaveLength(1)
  })

  it('FE-WSCORE-012: onerror is inert — the reconnect is driven by onclose', async () => {
    const sock = await openSocket()

    expect(() => sock.onerror!()).not.toThrow()
    expect(MockWebSocket.instances).toHaveLength(1)

    sock.onclose!()
    await vi.advanceTimersByTimeAsync(1001)
    await vi.advanceTimersByTimeAsync(0)

    expect(MockWebSocket.instances).toHaveLength(2)
  })
})
