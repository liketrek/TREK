import { expect, it } from 'vitest'
import { nearestDayBoundary, type DayBoundaryLeg } from './dayBoundaryPath'
import type { RoadtripStop } from './useRoadtripRoutes'

const point = (assignmentId: number, lng: number) => ({ assignmentId, lat: 0, lng }) as RoadtripStop
const path: DayBoundaryLeg[] = [{ from: point(10, 0), to: point(20, 1), position: 0, line: [[0, 0], [0, 0.5], [0, 1]] }]
const project = (lat: number, lng: number) => ({ x: lng * 1000, y: lat * 1000 })

it('snaps to a visit before considering nearby road segments', () => {
  expect(nearestDayBoundary(path, 1, { x: 985, y: 2 }, project)?.boundary).toEqual({ day_number: 1, from_assignment_id: 20, to_assignment_id: null, fraction: 1 })
})
it('projects the pointer onto the full route with a distance fraction', () => {
  const target = nearestDayBoundary(path, 2, { x: 300, y: 100 }, project)!
  expect(target.boundary.fraction).toBeCloseTo(0.3)
  expect(target.lng).toBeCloseTo(0.3)
  expect(target.lat).toBe(0)
})
it('excludes the previous and next fixed day endings', () => {
  expect(nearestDayBoundary(path, 2, { x: 0, y: 0 }, project, 1, 2)).toBeNull()
  expect(nearestDayBoundary(path, 2, { x: 1000, y: 0 }, project, 0, 0.2)).toBeNull()
})
