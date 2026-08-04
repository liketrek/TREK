// FE-SYNC-PROBE-001 to FE-SYNC-PROBE-008
// Covers the subscription/lifecycle half of connectivity.ts; the probe-state
// matrix lives in tests/unit/sync/connectivity.test.ts.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isReachable, onChange, probeNow, startConnectivityProbe } from './connectivity'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, configurable: true })
}

function fetchReturns(res: Partial<Response>): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res as Response))
}

const okHealth: Partial<Response> = {
  type: 'basic',
  ok: true,
  headers: new Headers({ 'content-type': 'application/json' }),
}

beforeEach(() => {
  setOnline(true)
  fetchReturns(okHealth)
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  setOnline(true)
})

describe('connectivity — reachability subscriptions', () => {
  it('FE-SYNC-PROBE-001: a subscriber is notified when reachability flips, once per change', async () => {
    fetchReturns(okHealth)
    await probeNow()

    const seen: boolean[] = []
    const off = onChange(v => seen.push(v))

    setOnline(false)
    await probeNow()
    await probeNow()

    expect(seen).toEqual([false])
    expect(isReachable()).toBe(false)

    setOnline(true)
    fetchReturns(okHealth)
    await probeNow()

    expect(seen).toEqual([false, true])
    expect(isReachable()).toBe(true)
    off()
  })

  it('FE-SYNC-PROBE-002: the returned unsubscribe stops further notifications', async () => {
    fetchReturns(okHealth)
    await probeNow()

    const fn = vi.fn()
    const off = onChange(fn)
    off()

    setOnline(false)
    await probeNow()

    expect(fn).not.toHaveBeenCalled()
    expect(isReachable()).toBe(false)
  })

  it('FE-SYNC-PROBE-003: a proxy wall counts as unreachable', async () => {
    fetchReturns(okHealth)
    await probeNow()

    fetchReturns({ type: 'opaqueredirect', ok: false, headers: new Headers() })
    expect(await probeNow()).toBe('proxy-wall')
    expect(isReachable()).toBe(false)
  })
})

// startConnectivityProbe installs a permanent interval + window listeners, so
// these run on fake timers to keep the interval out of the other tests.
describe('connectivity — startConnectivityProbe', () => {
  it('FE-SYNC-PROBE-004: probes /api/health immediately on start', async () => {
    vi.useFakeTimers()
    const probeFetch = vi.fn().mockResolvedValue(okHealth as Response)
    vi.stubGlobal('fetch', probeFetch)

    startConnectivityProbe()
    await vi.advanceTimersByTimeAsync(0)

    expect(probeFetch).toHaveBeenCalledWith('/api/health', expect.objectContaining({
      cache: 'no-store',
      credentials: 'include',
      redirect: 'manual',
    }))
    expect(isReachable()).toBe(true)
  })

  it('FE-SYNC-PROBE-005: re-probes on the 30s interval', async () => {
    vi.useFakeTimers()
    const probeFetch = vi.fn().mockResolvedValue(okHealth as Response)
    vi.stubGlobal('fetch', probeFetch)

    startConnectivityProbe()
    await vi.advanceTimersByTimeAsync(0)
    const afterStart = probeFetch.mock.calls.length

    await vi.advanceTimersByTimeAsync(30_000)
    expect(probeFetch.mock.calls.length).toBeGreaterThan(afterStart)
  })

  it('FE-SYNC-PROBE-006: the browser offline event marks us unreachable without a request', async () => {
    vi.useFakeTimers()
    const probeFetch = vi.fn().mockResolvedValue(okHealth as Response)
    vi.stubGlobal('fetch', probeFetch)

    startConnectivityProbe()
    await vi.advanceTimersByTimeAsync(0)
    expect(isReachable()).toBe(true)
    probeFetch.mockClear()

    window.dispatchEvent(new Event('offline'))

    expect(isReachable()).toBe(false)
    expect(probeFetch).not.toHaveBeenCalled()
  })

  it('FE-SYNC-PROBE-007: the browser online event triggers a fresh probe', async () => {
    vi.useFakeTimers()
    const probeFetch = vi.fn().mockResolvedValue(okHealth as Response)
    vi.stubGlobal('fetch', probeFetch)

    startConnectivityProbe()
    await vi.advanceTimersByTimeAsync(0)
    window.dispatchEvent(new Event('offline'))
    expect(isReachable()).toBe(false)

    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)

    expect(isReachable()).toBe(true)
  })

  it('FE-SYNC-PROBE-008: an aborted health check (timeout) reads as offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })))

    expect(await probeNow()).toBe('offline')
    expect(isReachable()).toBe(false)
  })
})
