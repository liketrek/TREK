import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '../../../helpers/render'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { buildAssignment, buildDay, buildPlace, buildTrip } from '../../../helpers/factories'
import { useMPlanTimeline } from '../../../../src/mobile/screens/trip/plan/useMPlanTimeline'
import type { RouteSegment } from '../../../../src/types'

// FE-MOB-PLTL-HOOK-001 to FE-MOB-PLTL-HOOK-002: public transit for one leg (#2398)

vi.mock('../../../../src/hooks/useRouteCalculation', () => ({
  useRouteCalculation: () => ({ routeSegments: [] }),
}))

vi.mock('../../../../src/api/client', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../src/api/client')>()
  return { ...actual, weatherApi: { ...actual.weatherApi, get: vi.fn(() => new Promise(() => {})) } }
})

const DAY = buildDay({ id: 5, trip_id: 1, day_number: 1, date: '2026-05-02' })
const assignments = {
  '5': [
    buildAssignment({ id: 11, day_id: 5, order_index: 0, place: buildPlace({ id: 1, name: 'Museum', place_time: '09:30', lat: 35.71, lng: 139.79 }) }),
    buildAssignment({ id: 12, day_id: 5, order_index: 1, place: buildPlace({ id: 2, name: 'Ueno Park', lat: 35.72, lng: 139.77 }) }),
  ],
}
const SEG = { from: [35.71, 139.79], to: [35.72, 139.77] } as unknown as RouteSegment

function planner(trip = buildTrip({ id: 1, start_date: '2026-05-01', end_date: '2026-05-05' })) {
  return buildPlanner({ trip, days: [DAY], selectedDayId: DAY.id, assignments } as never)
}

describe('useMPlanTimeline, public transit for one leg', () => {
  it('FE-MOB-PLTL-HOOK-001: seeds the automated search with the leg and opens it for the day', () => {
    const p = planner()
    const { result } = renderHook(() => useMPlanTimeline(p))

    const leg = result.current.transitLegFor(SEG)
    expect(leg).toEqual({
      from: { name: 'Museum', lat: 35.71, lng: 139.79 },
      to: { name: 'Ueno Park', lat: 35.72, lng: 139.77 },
      time: '09:30',
    })

    act(() => result.current.planTransitLeg(leg!))

    expect(p.setTransportModalDayId).toHaveBeenCalledWith(5)
    expect(p.setEditingTransport).toHaveBeenCalledWith(null)
    expect(p.setTransitPrefill).toHaveBeenCalledWith(leg)
    expect(p.setTransportModalAutomated).toHaveBeenCalledWith(true)
    expect(p.setShowTransportModal).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-PLTL-HOOK-002: offers nothing on a trip without dates, like the desktop and the day sheet', () => {
    const p = planner(buildTrip({ id: 1, start_date: null, end_date: null }))
    const { result } = renderHook(() => useMPlanTimeline(p))

    expect(result.current.transitLegFor(SEG)).toBeNull()
  })
})
