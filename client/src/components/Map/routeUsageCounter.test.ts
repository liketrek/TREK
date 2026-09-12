import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { countRoute, flushRouteUsage } from './routeUsageCounter'
import { routeUsageApi } from '../../api/routeUsage'

/**
 * FE-MAP-ROUTECOUNT-001..006 — the tally behind "how much routing does an instance do".
 *
 * Two things are worth pinning: that it batches rather than posting per route, because a
 * counter that costs a request of its own measures the load by adding to it, and that it
 * never throws — it sits on the hot path of every route the map draws.
 */

const sample = {
  profile: 'driving' as const,
  surface: 'legs' as const,
  selfHosted: false,
  waypoints: 3,
  km: 100,
  failed: false,
}

describe('routeUsageCounter', () => {
  beforeEach(() => {
    vi.spyOn(routeUsageApi, 'report').mockResolvedValue(undefined)
    vi.useFakeTimers()
  })

  afterEach(() => {
    flushRouteUsage()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('FE-MAP-ROUTECOUNT-001: a single route posts nothing on its own', () => {
    countRoute(sample)
    expect(routeUsageApi.report).not.toHaveBeenCalled()
  })

  it('FE-MAP-ROUTECOUNT-002: the tally goes out once the timer runs out', () => {
    countRoute(sample)
    vi.advanceTimersByTime(60_000)

    expect(routeUsageApi.report).toHaveBeenCalledTimes(1)
    const [entries] = vi.mocked(routeUsageApi.report).mock.calls[0]
    expect(entries).toEqual([{ ...sample, requests: 1, failed: 0 }])
  })

  it('FE-MAP-ROUTECOUNT-003: routes of one kind add onto one entry', () => {
    countRoute(sample)
    countRoute({ ...sample, waypoints: 5, km: 200 })
    countRoute({ ...sample, failed: true })
    flushRouteUsage()

    const [entries] = vi.mocked(routeUsageApi.report).mock.calls[0]
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ requests: 3, waypoints: 11, km: 400, failed: 1 })
  })

  it('FE-MAP-ROUTECOUNT-004: a different kind or engine is its own entry', () => {
    countRoute(sample)
    countRoute({ ...sample, surface: 'alternatives' })
    countRoute({ ...sample, selfHosted: true })
    countRoute({ ...sample, profile: 'walking' })
    flushRouteUsage()

    const [entries] = vi.mocked(routeUsageApi.report).mock.calls[0]
    expect(entries).toHaveLength(4)
  })

  it('FE-MAP-ROUTECOUNT-005: a busy stretch flushes on its own, without waiting', () => {
    for (let i = 0; i < 25; i++) countRoute(sample)
    expect(routeUsageApi.report).toHaveBeenCalledTimes(1)
    const [entries] = vi.mocked(routeUsageApi.report).mock.calls[0]
    expect(entries[0].requests).toBe(25)
  })

  it('FE-MAP-ROUTECOUNT-006: a refused report is swallowed, and the next tally starts clean', async () => {
    vi.mocked(routeUsageApi.report).mockRejectedValueOnce(new Error('offline'))
    countRoute(sample)
    expect(() => flushRouteUsage()).not.toThrow()
    await Promise.resolve()

    countRoute(sample)
    flushRouteUsage()
    const [entries] = vi.mocked(routeUsageApi.report).mock.calls[1]
    expect(entries[0].requests).toBe(1)
  })
})
