import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMergedMapPois } from './useMergedMapPois'
import type { Poi } from './poiCategories'

/**
 * FE-MAP-MERGEPOI-001..006 — the two searches that can run at once in road trip mode.
 *
 * The corridor answers "what is along the drive", the category pill answers "what is in
 * view". Both are drawn, the corridor's copy of a shared hit wins, and the reference is
 * only new when the content really is — the map rebuilds every pin off it.
 */

const poi = (osm_id: string, name = osm_id): Poi => ({
  osm_id, name, lat: 48, lng: 2, category: 'hotel', source: 'openstreetmap',
} as Poi)

describe('useMergedMapPois', () => {
  it('FE-MAP-MERGEPOI-001: outside road trip mode only the pill hits are drawn', () => {
    const explore = [poi('n1')]
    const { result } = renderHook(() => useMergedMapPois(null, explore))
    expect(result.current).toBe(explore)
  })

  it('FE-MAP-MERGEPOI-002: with nothing found in view the corridor list passes through as-is', () => {
    const corridor = [poi('n1')]
    const { result } = renderHook(() => useMergedMapPois(corridor, []))
    expect(result.current).toBe(corridor)
  })

  it('FE-MAP-MERGEPOI-003: before a corridor search the pill hits pass through as-is', () => {
    const explore = [poi('n2')]
    const { result } = renderHook(() => useMergedMapPois([], explore))
    expect(result.current).toBe(explore)
  })

  it('FE-MAP-MERGEPOI-004: both searches draw together, corridor first', () => {
    const { result } = renderHook(() => useMergedMapPois([poi('n1')], [poi('n2')]))
    expect(result.current.map(p => p.osm_id)).toEqual(['n1', 'n2'])
  })

  it('FE-MAP-MERGEPOI-005: a place both searches found is drawn once, as the corridor knows it', () => {
    // The corridor copy carries how far along the drive it sits, which the pill's does not.
    const corridor = [poi('n1', 'Hotel am Weg')]
    const { result } = renderHook(() => useMergedMapPois(corridor, [poi('n1', 'Hotel am Weg (Sicht)')]))
    expect(result.current).toBe(corridor)
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Hotel am Weg')
  })

  it('FE-MAP-MERGEPOI-006: an unchanged pair keeps its reference, so no pin is rebuilt', () => {
    const corridor = [poi('n1')]
    const explore = [poi('n2')]
    const { result, rerender } = renderHook(() => useMergedMapPois(corridor, explore))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

describe('useMergedMapPois — the refuel offers', () => {
  const poi = (id: string): Poi => ({ osm_id: id, name: id, lat: 0, lng: 0 } as Poi)

  it('FE-MAP-MERGEPOI-007: an offered station is drawn even with no search running', () => {
    // In road trip mode this is the only channel a POI reaches the map through, so
    // without it somebody is asked to accept a stop they cannot see.
    const { result } = renderHook(() => useMergedMapPois([], [], [poi('offer')]))
    expect(result.current.map(p => p.osm_id)).toEqual(['offer'])
  })

  it('FE-MAP-MERGEPOI-008: an offer already on the route is one pin, not two', () => {
    const { result } = renderHook(() => useMergedMapPois([poi('a')], [], [poi('a'), poi('b')]))
    expect(result.current.map(p => p.osm_id)).toEqual(['a', 'b'])
  })

  it('FE-MAP-MERGEPOI-009: nothing offered keeps the same array, so no pin is rebuilt', () => {
    const corridor = [poi('a')]
    const { result, rerender } = renderHook(({ o }: { o: Poi[] }) => useMergedMapPois(corridor, [], o), {
      initialProps: { o: [] as Poi[] },
    })
    const first = result.current
    rerender({ o: [] })
    expect(result.current).toBe(first)
    expect(result.current).toBe(corridor)
  })
})
