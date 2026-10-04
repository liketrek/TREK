import { describe, it, expect } from 'vitest'
import { alternativeSubline, alternativesBusy, alternativesPhase, buildAlternativeOverlays, otherEngineNote, type AlternativeOverlay } from './alternativeOverlays'
import { formatDurationShort } from './roadtripModel'
import { ALT_PRIMARY, ALT_SECONDARY, ALT_LABEL_PRIMARY_BG, ALT_LABEL_SECONDARY_BG } from './alternativeColors'
import type { RouteAlternative } from '../Map/RouteCalculator'

/**
 * FE-ALTOVL-001..023: turning the router's answers into something drawable.
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

  it('FE-ALTOVL-011: a route the other engine priced cannot win the quickest election', () => {
    // The shape a default install actually produces: OSRM answered with the one road
    // it likes, and the toll-free offer beside it came from the avoidance router,
    // whose speed model reads a Spanish motorway a seventh faster. Electing across
    // the two paints the detour blue and calls the road being driven the slow way
    // round, on nothing but that gap.
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 11_880, coordinates: line(20, 0) }),
        alt({ duration: 10_140, coordinates: line(20, 1), avoids: 'toll', engine: 'valhalla' }),
      ],
      LABELS,
    )
    expect(out[0].color).toBe(ALT_PRIMARY)
    expect(out[1].color).toBe(ALT_SECONDARY)
    expect(out[0].note).toBe('Fastest')
    expect(out[1].note).toBe('No tolls')
  })

  it('FE-ALTOVL-012: no difference is printed across two engines', () => {
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 11_880, coordinates: line(20, 0) }),
        alt({ duration: 10_140, coordinates: line(20, 1), avoids: 'toll', engine: 'valhalla' }),
      ],
      LABELS,
    )
    expect(out[0].slowerThanQuickest).toBe(0)
    expect(out[1].slowerThanQuickest).toBe(0)
    expect(out[0].otherEngine).toBe(false)
    expect(out[1].otherEngine).toBe(true)
    // Each route still reports its own time; it is only the subtraction that is refused.
    expect(out[0].duration).toBe(11_880)
    expect(out[1].duration).toBe(10_140)
  })

  it('FE-ALTOVL-013: an instance whose own router answers still gets a real difference', () => {
    // A self-hosted OSRM built through the MLD pipeline answers `exclude` itself, so
    // the avoidance offer carries no engine of its own and the two figures are the
    // same engine's. That comparison is sound and must keep working.
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 3600, coordinates: line(20, 0) }),
        alt({ duration: 5400, coordinates: line(20, 1), avoids: 'toll' }),
      ],
      LABELS,
    )
    expect(out[1].slowerThanQuickest).toBe(1800)
    expect(out.every(o => o.otherEngine === false)).toBe(true)
  })

  it('FE-ALTOVL-014: a list with nothing comparable in it still names one road primary', () => {
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 3600, coordinates: line(20, 0), engine: 'valhalla' }),
        alt({ duration: 5400, coordinates: line(20, 1), avoids: 'toll', engine: 'valhalla' }),
      ],
      LABELS,
    )
    expect(out.filter(o => o.color === ALT_PRIMARY)).toHaveLength(1)
    expect(out[0].color).toBe(ALT_PRIMARY)
    expect(out.every(o => o.slowerThanQuickest === 0)).toBe(true)
  })

  it('FE-ALTOVL-015: the road being driven stays blue whatever the other engine says', () => {
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 11_880, coordinates: line(20, 0), current: true }),
        alt({ duration: 10_140, coordinates: line(20, 1), avoids: 'toll', engine: 'valhalla' }),
      ],
      LABELS,
    )
    expect(out[0].color).toBe(ALT_PRIMARY)
    expect(out[0].note).toBe('Current')
    expect(out[1].color).toBe(ALT_SECONDARY)
  })

  it('FE-ALTOVL-018: the blue belongs to the road being driven, never to the quickest offer', () => {
    // The picker always lists the rail's road as the current one. After a choice took, the
    // old road came back as the router's quickest and was painted blue as if still driven.
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 11_400, coordinates: line(20, 0), current: true }),
        alt({ duration: 10_800, coordinates: line(20, 1) }),
        alt({ duration: 12_000, coordinates: line(20, 2) }),
      ],
      LABELS,
    )
    expect(out.map(o => o.color)).toEqual([ALT_PRIMARY, ALT_SECONDARY, ALT_SECONDARY])
    expect(out.map(o => o.note)).toEqual(['Current', 'Fastest', ''])
    // Current takes part in the comparison: it is the rail's engine's own figure.
    expect(out[0].slowerThanQuickest).toBe(600)
  })

  it('FE-ALTOVL-019: on a leg the second engine drives, its offers are the comparable ones', () => {
    // A trip that avoids something is routed by Valhalla, rail and offers alike. Read
    // against OSRM they would all be marked as another engine's and none could be timed.
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 6_778, coordinates: line(20, 0), current: true, engine: 'valhalla' }),
        alt({ duration: 6_400, coordinates: line(20, 1), engine: 'valhalla' }),
        alt({ duration: 5_600, coordinates: line(20, 2) }),
      ],
      LABELS,
      'valhalla',
    )
    expect(out.map(o => o.otherEngine)).toEqual([false, false, true])
    // The quickest is elected among Valhalla's figures, so the OSRM one cannot take it.
    expect(out[1].note).toBe('Fastest')
    expect(out[0].slowerThanQuickest).toBe(378)
    expect(out[2].slowerThanQuickest).toBe(0)
  })

  it('FE-ALTOVL-020: on a leg a plugin prices, every router offer is read as another engine', () => {
    const out = buildAlternativeOverlays(
      [
        alt({ duration: 9_000, coordinates: line(20, 0), current: true, engine: 'plugin' }),
        alt({ duration: 7_200, coordinates: line(20, 1) }),
      ],
      LABELS,
      'plugin',
    )
    expect(out.map(o => o.otherEngine)).toEqual([false, true])
    expect(out[1].note).toBe('')
    expect(out.every(o => o.slowerThanQuickest === 0)).toBe(true)
  })
})

describe('alternativesPhase', () => {
  const two = buildAlternativeOverlays([alt({ coordinates: line(20, 0) }), alt({ coordinates: line(20, 1) })], LABELS)

  it('FE-ALTOVL-016: asking beats a failure, a failure beats an empty list, and only two roads are a choice', () => {
    // A new question replaces the old answer and its error with it.
    expect(alternativesPhase({ loading: true, error: true }, two)).toBe('loading')
    expect(alternativesPhase({ loading: true, error: false }, [])).toBe('loading')
    // A router that will not answer is not a leg with one sensible way.
    expect(alternativesPhase({ loading: false, error: true }, [])).toBe('failed')
    expect(alternativesPhase({ loading: false, error: true }, two)).toBe('failed')
    expect(alternativesPhase({ loading: false, error: false }, [])).toBe('onlyOne')
    expect(alternativesPhase({ loading: false, error: false }, two.slice(0, 1))).toBe('onlyOne')
    expect(alternativesPhase({ loading: false, error: false }, two)).toBe('choose')
  })
})

describe('alternativeSubline', () => {
  const overlay = (over: Partial<AlternativeOverlay>): AlternativeOverlay => ({
    ...buildAlternativeOverlays([alt({ coordinates: line(20, 0) }), alt({ coordinates: line(20, 1) })], LABELS)[1],
    ...over,
  })

  it('FE-ALTOVL-017: an offer is named by what it is, and only a plain one by how much slower it is', () => {
    const slower = (time: string) => `${time} slower`
    for (const note of ['No motorway', 'Current', 'Fastest']) {
      expect(alternativeSubline(overlay({ note, slowerThanQuickest: 1800 }), slower)).toBe(note)
    }
    // The caller words the difference; the figure is the same short duration the map prints.
    expect(alternativeSubline(overlay({ note: '', slowerThanQuickest: 1800 }), slower))
      .toBe(`${formatDurationShort(1800)} slower`)
    // Another engine's road has no difference to print, only its own time.
    expect(alternativeSubline(overlay({ note: '', otherEngine: true, label: '2 h', slowerThanQuickest: 0 }), slower))
      .toBe('2 h')
  })
})

describe('otherEngineNote', () => {
  it('FE-ALTOVL-022: a route another engine timed is named after that engine, one the rail timed not at all', () => {
    // On a plugin leg the offers are OSRM's. They used to be called the avoidance
    // router's, an engine that had nothing to do with them.
    const plugin = buildAlternativeOverlays(
      [
        alt({ coordinates: line(20, 0), current: true, engine: 'plugin' }),
        alt({ coordinates: line(20, 1) }),
        alt({ coordinates: line(20, 2), engine: 'valhalla', avoids: 'motorway' }),
      ],
      LABELS,
      'plugin',
    )
    expect(plugin.map(o => o.engine)).toEqual(['plugin', 'osrm', 'valhalla'])
    expect(plugin.map(otherEngineNote)).toEqual([null, 'roadtrip.alt.otherEngineStandard', 'roadtrip.alt.otherEngine'])
    // On a trip that avoids nothing, the avoidance router's offer is the other one.
    const plain = buildAlternativeOverlays(
      [alt({ coordinates: line(20, 0), current: true }), alt({ coordinates: line(20, 1), engine: 'valhalla' })],
      LABELS,
    )
    expect(plain.map(otherEngineNote)).toEqual([null, 'roadtrip.alt.otherEngine'])
  })

  it('FE-ALTOVL-023: a line OSRM drew in the avoidance router’s place heads the list as the other engine’s', () => {
    const out = buildAlternativeOverlays(
      [
        alt({ coordinates: line(20, 0), current: true, engine: 'osrm' }),
        alt({ coordinates: line(20, 1), engine: 'valhalla' }),
      ],
      LABELS,
      'valhalla',
    )
    expect(out.map(otherEngineNote)).toEqual(['roadtrip.alt.otherEngineStandard', null])
    // Nothing is measured against it: the offer is the quickest the rail's engine timed.
    expect(out[1].note).toBe('Fastest')
    expect(out.every(o => o.slowerThanQuickest === 0)).toBe(true)
    // An engine no offer comes from has nothing to say.
    expect(otherEngineNote({ otherEngine: true, engine: 'plugin' })).toBeNull()
  })
})

describe('alternativesBusy', () => {
  it('FE-ALTOVL-021: a picker is busy exactly while one of its offers is being checked', () => {
    expect(alternativesBusy(null)).toBe(false)
    expect(alternativesBusy(undefined)).toBe(false)
    expect(alternativesBusy({ proving: null })).toBe(false)
    // Index 0 is a real offer, not "nothing".
    expect(alternativesBusy({ proving: 0 })).toBe(true)
    expect(alternativesBusy({ proving: 2 })).toBe(true)
  })
})
