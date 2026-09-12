import type { RoadtripDayBoundary } from '@trek/shared'
import type { RoadtripStop } from './useRoadtripRoutes'
import { lineMetres } from './corridor'

export interface DayBoundaryLeg {
  from: RoadtripStop
  to: RoadtripStop
  position: number
  line: [number, number][]
}
export interface DayBoundaryTarget {
  boundary: RoadtripDayBoundary
  lat: number
  lng: number
  position: number
}
export type ProjectPoint = (lat: number, lng: number) => { x: number; y: number }

export function nearestDayBoundary(
  legs: DayBoundaryLeg[], day: number, point: { x: number; y: number }, project: ProjectPoint,
  min = -1, max = Infinity,
): DayBoundaryTarget | null {
  let best: DayBoundaryTarget | null = null
  let distance = Infinity
  const offer = (target: DayBoundaryTarget, gap: number) => {
    if (target.position <= min + 0.000001 || target.position >= max - 0.000001 || gap >= distance) return
    best = target
    distance = gap
  }
  for (const leg of legs) {
    for (const [stop, position] of [[leg.from, leg.position], [leg.to, leg.position + 1]] as const) {
      const p = project(stop.lat, stop.lng)
      const gap = Math.hypot(p.x - point.x, p.y - point.y)
      if (gap <= 25) offer({ boundary: { day_number: day, from_assignment_id: stop.assignmentId, to_assignment_id: null, fraction: 1 }, lat: stop.lat, lng: stop.lng, position }, gap)
    }
  }
  if (best) return best
  for (const leg of legs) {
    const metres = lineMetres(leg.line.map(([lat, lng]) => ({ lat, lng })))
    if (!metres) continue
    let travelled = 0
    for (let i = 1; i < leg.line.length; i++) {
      const a = leg.line[i - 1], b = leg.line[i]
      const p = project(a[0], a[1]), q = project(b[0], b[1])
      const dx = q.x - p.x, dy = q.y - p.y
      const share = dx || dy ? Math.max(0, Math.min(1, ((point.x - p.x) * dx + (point.y - p.y) * dy) / (dx * dx + dy * dy))) : 0
      const length = lineMetres([{ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] }])
      const fraction = (travelled + length * share) / metres
      offer({
        boundary: { day_number: day, from_assignment_id: leg.from.assignmentId, to_assignment_id: leg.to.assignmentId, fraction },
        lat: a[0] + (b[0] - a[0]) * share, lng: a[1] + (b[1] - a[1]) * share, position: leg.position + fraction,
      }, Math.hypot(p.x + dx * share - point.x, p.y + dy * share - point.y))
      travelled += length
    }
  }
  return best
}
