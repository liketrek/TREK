import { describe, it, expect } from 'vitest'
import { buildAlternativeOverlays } from './alternativeOverlays'
import { ALT_PRIMARY, ALT_SECONDARY, ALT_LABEL_PRIMARY_BG, ALT_LABEL_SECONDARY_BG } from './alternativeColors'
import type { RouteAlternative } from '../Map/RouteCalculator'

/**
 * FE-ALTOVL-001..010 — turning the router's answers into something drawable.
 *
 * Two decisions live here and neither is cosmetic: which of the offered roads is
 * drawn as the one you are on, and where each label hangs. A label anchored on a
 * stretch two routes share appears pinned to the wrong road, which is the whole
 * reason this is not simply the midpoint.
 */

const LABELS = { fastest: 'Fastest', current: 'Current', noMotorway: 'No motorway', noToll: 'No tolls', noFerry: 'No ferry' }

/** A straight line of `n` points from (0,0) heading east, offset north by `lat`. */
function line(n: number, lat: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => [lat, i / 10] as [number, number])
}

function alt(over: Partial<RouteAlternative & { current?: boolean }> = {}): RouteAlternative & { current?: boolean } {
  return {
    coordinates: line(20, 0),
    duration: 3600,
    distance: 100_000,
    ...over,
  } as RouteAlternative & { current?: boolean }
}

describe('buildAlternativeOverlays', () => {
  it('FE-ALTOVL-001: nothing to choose between is not a choice', () => {
    // One answer drawn as an "alternative" would just double the route already
    // on the map.
    expect(buildAlternativeOverlays(undefined, LABELS)).toEqual([])
    expect(buildAlternativeOverlays([], LABELS)).toEqual([])
    expect(buildAlternativeOverlays([alt()], LABELS)).toEqual([])
  })

  it('FE-ALTOVL-002: the quickest is the blue one when no road is being driven yet', () => {
    const out = buildAlternativeOverlays(
      [alt({ duration: 5400, coordinates: line(20, 0) }), alt({ duration: 3600, coordinates: line(20, 1) })],
      LABELS,
    )
    expect(out[1].color).toBe(ALT_PRIMARY)
    expect(out[1].labelBg).toBe(ALT_LABEL_PRIMARY_BG)
    expect(out[0].color).toBe(ALT_SECONDARY)
    expect(out[0].labelBg).toBe(ALT_LABEL_SECONDARY_BG)
  })

  it('FE-ALTOVL-003: the road already being driven takes the blue, even when it is slower', () => {
    // Blue means "the road you are on". Handing it to the quickest offer instead
    // would recolour the drive the traveller deliberately bent.
    const out = buildAlternativeOverlays(
      [alt({ duration: 7200, current: true, coordinates: line(20, 0) }), alt({ duration: 3600, coordinates: line(20, 1) })],
      LABELS,
    )
    expect(out[0].color).toBe(ALT_PRIMARY)
    expect(out[0].note).toBe('Current')
    expect(out[1].color).toBe(ALT_SECONDARY)
  })

  it('FE-ALTOVL-004: what a road IS beats what it is not', () => {
    // A way offered because the motorway was left out says so, rather than being
    // labelled by how much slower it is — being off the motorway is the reason
    // somebody would take it.
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 3600, coordinates: line(20, 0) }),
        alt({ duration: 5400, avoids: 'motorway', coordinates: line(20, 1) }),
        alt({ duration: 5400, avoids: 'toll', coordinates: line(20, 2) }),
      ],
      LABELS,
    )
    expect(out.map(o => o.note)).toEqual(['Fastest', 'No motorway', 'No tolls'])
  })

  it('FE-ALTOVL-005: a plain slower offer carries no note at all', () => {
    const out = buildAlternativeOverlays(
      [alt({ duration: 3600, coordinates: line(20, 0) }), alt({ duration: 5400, coordinates: line(20, 1) })],
      LABELS,
    )
    expect(out[1].note).toBe('')
  })

  it('FE-ALTOVL-006: how much slower is measured against the quickest, and never negative', () => {
    const out = buildAlternativeOverlays(
      [alt({ duration: 5400, coordinates: line(20, 0) }), alt({ duration: 3600, coordinates: line(20, 1) })],
      LABELS,
    )
    expect(out[0].slowerThanQuickest).toBe(1800)
    expect(out[1].slowerThanQuickest).toBe(0)
    expect(out.every(o => o.slowerThanQuickest >= 0)).toBe(true)
  })

  it('FE-ALTOVL-007: a label hangs where its own road is unlike every other', () => {
    // Two roads that share both ends and part in the middle. The midpoint of the
    // shared stretch would put both labels on the same line; the point furthest
    // from the other route puts each on the stretch only it uses.
    const shared = (lat: number): [number, number][] => [
      [0, 0], [0, 1], [lat, 2], [lat, 3], [0, 4], [0, 5],
    ]
    const out = buildAlternativeOverlays(
      [alt({ coordinates: shared(0.5) }), alt({ coordinates: shared(-0.5) })],
      LABELS,
    )
    // Each label sits on its own detour, not on the common ends.
    expect(Math.abs(out[0].at.lat)).toBeCloseTo(0.5, 5)
    expect(Math.abs(out[1].at.lat)).toBeCloseTo(0.5, 5)
    expect(out[0].at.lat).not.toBe(out[1].at.lat)
  })

  it('FE-ALTOVL-008: a route with no coordinates gets a label anchor rather than crashing', () => {
    const out = buildAlternativeOverlays(
      [alt({ coordinates: [] }), alt({ coordinates: line(20, 1) })],
      LABELS,
    )
    expect(out).toHaveLength(2)
    expect(out[0].at).toEqual({ lat: 0, lng: 0 })
  })

  it('FE-ALTOVL-009: the drive time is carried through as text and as seconds', () => {
    const out = buildAlternativeOverlays(
      [alt({ duration: 3600, distance: 42_000 }), alt({ duration: 5400, coordinates: line(20, 1) })],
      LABELS,
    )
    expect(out[0].duration).toBe(3600)
    expect(out[0].distance).toBe(42_000)
    // The label is the readable form of the same number.
    expect(out[0].label).toBeTruthy()
    expect(out[0].index).toBe(0)
    expect(out[1].index).toBe(1)
  })

  it('FE-ALTOVL-010: only one road is ever the blue one', () => {
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 3600, coordinates: line(20, 0) }),
        alt({ duration: 3600, coordinates: line(20, 1) }),
        alt({ duration: 3600, coordinates: line(20, 2) }),
      ],
      LABELS,
    )
    expect(out.filter(o => o.color === ALT_PRIMARY)).toHaveLength(1)
  })
})
