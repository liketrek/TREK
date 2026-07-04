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
  // Aborted only on unmount — a reservations change must not cancel an
  // in-flight route we still want.
  const abortRef = useRef<AbortController | null>(null)
  if (!abortRef.current) abortRef.current = new AbortController()
  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
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
      if (attemptedRef.current.get(r.id) === key) continue
      attemptedRef.current.set(r.id, key)
      jobs.push({ id: r.id, profile, points: wps.map(w => ({ lat: w.lat, lng: w.lng })) })
    }
    if (!jobs.length) return

    let cancelled = false
    void (async () => {
      // Sequential to stay gentle on the shared public router.
      for (const job of jobs) {
        try {
          const result = await calculateRouteWithLegs(job.points, { signal: abortRef.current?.signal, profile: job.profile })
          if (cancelled) return
          if (result.coordinates.length >= 2) {
            setRoutes(prev => {
              const next = new Map(prev)
              next.set(job.id, result.coordinates)
              return next
            })
          }
        } catch {
          // Leave it unrouted — the overlay keeps the straight line.
        }
      }
    })()
    return () => { cancelled = true }
  }, [reservations])

  return routes
}
