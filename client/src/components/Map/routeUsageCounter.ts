import type { RouteUsageEntry, RouteUsageProfile, RouteUsageSurface } from '@trek/shared'
import { routeUsageApi } from '../../api/routeUsage'

/**
 * Counts the routing this browser asks for, and posts the totals in batches.
 *
 * All routing happens client-side against an external engine, so the server never
 * sees a route request and cannot count one. Without a count nobody knows what a
 * self-hosted router would have to carry — how many requests a real trip costs, how
 * big they are, how much already goes to an operator's own engine.
 *
 * Counters only. What goes over the wire is four integers per bucket: how many
 * requests, how many waypoints, how many kilometres, how many failed. No coordinate,
 * no route, no trip, nothing that says where anybody went.
 *
 * Batched on purpose. A counter that cost a request of its own would measure the load
 * by adding to it, so the tally is held in memory and flushed on a timer, when it
 * grows past a threshold, and when the page goes away.
 */

/** Flush when the tally has this many requests in it, whichever comes first. */
const FLUSH_AFTER_REQUESTS = 25
/** …or after this long, so a quiet session still reports what it did. */
const FLUSH_AFTER_MS = 60_000
/** Guard against a pathological session: drop the tally rather than grow forever. */
const MAX_BUCKETS = 40

type Bucket = Omit<RouteUsageEntry, 'profile' | 'surface' | 'selfHosted'> & {
  profile: RouteUsageProfile
  surface: RouteUsageSurface
  selfHosted: boolean
}

const buckets = new Map<string, Bucket>()
let pending = 0
let timer: ReturnType<typeof setTimeout> | null = null
let unloadWired = false

function flush(): void {
  if (timer !== null) { clearTimeout(timer); timer = null }
  if (!buckets.size) return
  const entries = [...buckets.values()]
  buckets.clear()
  pending = 0
  // Fire and forget: a failed report is a lost count, not a problem worth telling
  // anybody about. The next flush carries on from an empty tally either way.
  void routeUsageApi.report(entries).catch(() => {})
}

function wireUnload(): void {
  if (unloadWired || typeof document === 'undefined') return
  unloadWired = true
  // `visibilitychange`, not `unload`: the latter no longer fires reliably on mobile,
  // where a session ends by switching apps rather than by closing a tab.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

/**
 * Records one routing request. Never throws and never awaits: it sits on the hot path
 * of every route the map draws.
 */
export function countRoute(sample: {
  profile: RouteUsageProfile
  surface: RouteUsageSurface
  selfHosted: boolean
  waypoints: number
  km: number
  failed: boolean
}): void {
  try {
    wireUnload()
    const key = `${sample.profile}|${sample.surface}|${sample.selfHosted}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.requests += 1
      bucket.waypoints += sample.waypoints
      bucket.km += sample.km
      if (sample.failed) bucket.failed += 1
    } else {
      if (buckets.size >= MAX_BUCKETS) return
      buckets.set(key, {
        profile: sample.profile,
        surface: sample.surface,
        selfHosted: sample.selfHosted,
        requests: 1,
        waypoints: sample.waypoints,
        km: sample.km,
        failed: sample.failed ? 1 : 0,
      })
    }
    pending += 1
    if (pending >= FLUSH_AFTER_REQUESTS) { flush(); return }
    if (timer === null) timer = setTimeout(flush, FLUSH_AFTER_MS)
  } catch { /* counting must never break routing */ }
}

/** Flushes now. Exported for tests and for a deliberate "report before you go". */
export function flushRouteUsage(): void {
  flush()
}
