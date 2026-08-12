import { useEffect, useRef, useState } from 'react'
import type { Reservation, ReservationEndpoint } from '../types'
import { calculateRouteWithLegs } from '../components/Map/RouteCalculator'

/**
 * Real road-network geometry for road-based transport bookings (car, bus, taxi,
 * bicycle), so their map lines follow actual streets instead of a straight
 * as-the-crow-flies line — the same idea as the real transit paths (#1065),
 * but routed on demand rather than stored on the reservation.
 *
 * Trains and "other transport" keep their straight line (rail/unknown modes
 * aren't road-routable); flights/cruises/ferries use the great-circle arc.
 * Any routing failure falls back to the straight line the overlay already draws.
 */

const ROAD_PROFILE: Record<string, 'driving' | 'cycling'> = {
  car: 'driving',
  bus: 'driving',
  taxi: 'driving',
  bicycle: 'cycling',
}

// Beyond this straight-line distance a car/taxi/bike (or even coach) booking is
// almost always a data quirk or an inter-continental hop the road router can't
// resolve — keep the straight line and don't hammer the public OSRM demo.
const MAX_ROUTE_KM = 2000

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const la1 = a.lat * Math.PI / 180
  const la2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function orderedWaypoints(r: Reservation): ReservationEndpoint[] {
  return (r.endpoints || [])
    .filter(e => e.role === 'from' || e.role === 'to' || e.role === 'stop')
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
}

/**
 * Returns a map of reservation id → routed [lat, lng] polyline for the
 * road-based bookings among `reservations`. Missing entries mean "not routed
 * (yet / not routable)" — the caller should draw its straight line for those.
 * Routing runs once per reservation waypoint-set and is cached across the app
 * by RouteCalculator, so day switches and re-renders don't re-fetch.
 */
export function useTransportRoutes(reservations: Reservation[]): Map<number, [number, number][]> {
  const [routes, setRoutes] = useState<Map<number, [number, number][]>>(new Map())
  // id → waypoint signature already fetched/attempted, so an unchanged booking
  // is never re-requested even as the reservations array identity churns.
  const attemptedRef = useRef<Map<number, string>>(new Map())

  useEffect(() => {
    // Captured once: this is the same Map instance for the hook's whole
    // lifetime (only ever mutated in place, never reassigned), so closing over
    // it here — rather than reading `attemptedRef.current` again inside the
    // cleanup below — is equivalent and keeps the cleanup lint-clean.
    const attempted = attemptedRef.current
    const jobs: { id: number; profile: 'driving' | 'cycling'; points: { lat: number; lng: number }[] }[] = []
    for (const r of reservations) {
      const profile = ROAD_PROFILE[r.type]
      if (!profile) continue
      const wps = orderedWaypoints(r)
      if (wps.length < 2) continue
      let dist = 0
      for (let i = 0; i < wps.length - 1; i++) dist += haversineKm(wps[i], wps[i + 1])
      if (dist > MAX_ROUTE_KM) continue
      const key = `${profile}:${wps.map(w => `${w.lat},${w.lng}`).join('|')}`
      if (attempted.get(r.id) === key) continue
      attempted.set(r.id, key)
      jobs.push({ id: r.id, profile, points: wps.map(w => ({ lat: w.lat, lng: w.lng })) })
    }
    if (!jobs.length) return

    // A fresh controller per effect run (never a ref-cached singleton): React
    // StrictMode's dev-only mount->cleanup->remount cycle runs this effect's
    // cleanup once before the real, lasting mount — a controller reused across
    // that cleanup would already be permanently aborted by the time the real
    // mount's fetch starts, so its request would fail instantly every time.
    const controller = new AbortController()
    // Ids this run's jobs have finished for (success or a genuine, non-abort
    // failure) — checked synchronously in cleanup below, so it stays empty for
    // a cleanup that fires before any of them settle (StrictMode's simulated
    // cleanup always does, since it runs in the same tick, before any await
    // resolves) and is already populated for one that fires afterward (e.g. an
    // unrelated deps change once this run's fetches are long done).
    const settledIds = new Set<number>()
    let cancelled = false
    void (async () => {
      // Sequential to stay gentle on the shared public router.
      for (const job of jobs) {
        try {
          const result = await calculateRouteWithLegs(job.points, { signal: controller.signal, profile: job.profile })
          settledIds.add(job.id)
          if (cancelled) return
          if (result.coordinates.length >= 2) {
            setRoutes(prev => {
              const next = new Map(prev)
              next.set(job.id, result.coordinates)
              return next
            })
          }
        } catch {
          // A genuine failure (not this run being cancelled) also counts as
          // settled — leave it marked attempted, the overlay keeps the
          // straight line. If it WAS the cancellation that rejected this
          // fetch, cleanup already ran (synchronously, before this catch) and
          // un-marked it via `settledIds` never having gained this id in time.
          if (!cancelled) settledIds.add(job.id)
        }
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
      for (const job of jobs) {
        if (!settledIds.has(job.id)) attempted.delete(job.id)
      }
    }
  }, [reservations])

  return routes
}
