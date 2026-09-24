import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAutomaticDayPoints } from './useAutomaticDayPoints'
import type { RoadtripRoutes } from './useRoadtripRoutes'

vi.mock('../../i18n/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string, args?: { day: number; time: string }) => args ? `End of day ${args.day} at ${args.time}` : key }) }))

describe('automatic pause map points', () => {
  it('adds each pause once, respects collapsed days and discards obsolete focus', () => {
    const routes = {
      vias: [{ lat: 1, lng: 1, label: 'Charger', tone: 'success' }],
      days: [{
        dayId: 1, dayNumber: 1,
        stops: [
          { lat: 2, lng: 3, automaticNight: { phase: 'end' } },
          { lat: 2, lng: 3, automaticNight: { phase: 'start' } },
          { lat: 4, lng: 5 },
        ],
        schedule: { entries: [{ arrival: '18:00' }] },
      }],
    } as unknown as RoadtripRoutes
    const { result, rerender } = renderHook(
      ({ current, collapsed }) => useAutomaticDayPoints(current, collapsed),
      { initialProps: { current: routes, collapsed: new Set<number>() } },
    )
    expect(result.current.markers).toHaveLength(2)
    expect(result.current.markers[1]).toMatchObject({ lat: 2, lng: 3, hoverCard: true, nightPause: { day: 1, atPlace: false } })
    expect(result.current.markers[1].label).toBe('End of day 1 at 18:00')
    act(() => result.current.focusPoint(2, 3))
    expect(result.current.focusPoints).toEqual([[2, 3]])
    rerender({ current: routes, collapsed: new Set([1]) })
    expect(result.current.markers).toEqual(routes.vias)
    rerender({ current: { ...routes, days: [] }, collapsed: new Set() })
    expect(result.current.focusPoints).toBeNull()
  })
})
