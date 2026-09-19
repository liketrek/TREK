import { describe, it, expect } from 'vitest'
import {
  reachableRefuels, outcomeOf, refuelBandState, refuelKey, REFUEL_EMPTY_KEY, REFUEL_OFFER_LIMIT, REFUEL_WORDS,
  type RefuelCandidate, type RefuelOutcome, type RefuelSearchView,
} from './refuelSuggestion'
import type { LatLng } from './corridor'
import type { Poi } from '../Map/poiCategories'

// A straight run due east at 52° north, where a degree of longitude is about 68.5 km.
const LINE: LatLng[] = [
  { lat: 52, lng: 13 },
  { lat: 52, lng: 14 },
  { lat: 52, lng: 15 },
]

const poi = (name: string, lat: number, lng: number): Poi =>
  ({ osm_id: `node:${name}`, name, lat, lng } as Poi)

describe('reachableRefuels', () => {
  it('FE-ROADTRIP-REFUEL-001: offers only what lies before the tank runs out', () => {
    // Dry at 100 km in. A pump at 50 km is reachable; one at 130 km is on the far side
    // of an empty tank, and offering it is offering a walk.
    const early = poi('early', 52, 13.73)   // ~50 km
    const late = poi('late', 52, 14.9)      // ~130 km
    const out = reachableRefuels([early, late], LINE, 100)
    expect(out.map(p => p.name)).toEqual(['early'])
  })

  it('FE-ROADTRIP-REFUEL-002: the detour counts twice, because it is driven out and back', () => {
    // Both sit at the same point along the road, 60 km in, with 100 km of range. One is
    // on the road; the other is 20 km off it, so 40 km of driving, which no longer fits
    // in the 40 km that are left once the reserve is kept back.
    const onRoad = poi('on-road', 52, 13.876)
    const offRoad = poi('off-road', 52.18, 13.876)  // ~20 km north
    const out = reachableRefuels([onRoad, offRoad], LINE, 100)
    expect(out.map(p => p.name)).toEqual(['on-road'])
  })

  it('FE-ROADTRIP-REFUEL-003: a reserve is kept back, so nobody is sent to the last drop', () => {
    // 8 km before the dry point is inside the ten kilometre reserve.
    const onTheLimit = poi('on-the-limit', 52, 14.34)  // ~93 km
    expect(reachableRefuels([onTheLimit], LINE, 100)).toEqual([])
  })

  it('FE-ROADTRIP-REFUEL-004: the smallest detour comes first, however late the others sit', () => {
    // Measured on a real day: the station that got furthest was 9.2 km off the road for
    // one kilometre more of range. Everything in this list is already reachable, so what
    // separates them is what the stop costs.
    const nearRoad = poi('near-road', 52, 13.15)          // on the line, early
    const bigDetour = poi('big-detour', 52.05, 13.9)      // ~5.5 km off, later
    const out = reachableRefuels([bigDetour, nearRoad], LINE, 100)
    expect(out.map(p => p.name)).toEqual(['near-road', 'big-detour'])
  })

  it('FE-ROADTRIP-REFUEL-009: with the same detour, the later one wins', () => {
    // Filling up early wastes the tank that was already paid for.
    const early = poi('early', 52, 13.15)
    const later = poi('later', 52, 14.16)
    const out = reachableRefuels([early, later], LINE, 100)
    expect(out.map(p => p.name)).toEqual(['later', 'early'])
  })

  it('FE-ROADTRIP-REFUEL-005: a pump already on the plan is not suggested next to itself', () => {
    // Matched on position, not on id: the same station added by hand or from another
    // source carries a different osm_id.
    const pump = poi('pump', 52, 13.73)
    const out = reachableRefuels([pump], LINE, 100, { existing: [{ lat: 52.0005, lng: 13.7302 }] })
    expect(out).toEqual([])
  })

  it('FE-ROADTRIP-REFUEL-006: something nowhere near the road is not on the way', () => {
    const wayOff = poi('way-off', 49, 13.5)
    expect(reachableRefuels([wayOff], LINE, 100)).toEqual([])
  })
})

describe('outcomeOf', () => {
  it('FE-ROADTRIP-REFUEL-007: no answer is not the same as no filling station', () => {
    // The distinction the whole band hangs on. Saying "none on this stretch" after a
    // failed request states a fact that was never checked.
    expect(outcomeOf([], null)).toBe('failed')
    expect(outcomeOf([], { truncated: true })).toBe('incomplete')
    expect(outcomeOf([], {})).toBe('none')
    // `clamped` is not the same thing: it means the server searched a smaller circle
    // than the box described, and the caller sizes the box so that never happens.
    // Treating it as "could not check" turned every empty answer into a shrug.
    expect(outcomeOf([], { clamped: true })).toBe('none')
  })

  it('FE-ROADTRIP-REFUEL-008: a hit is a hit even when the answer was cut short', () => {
    const found = [{ name: 'x' }] as never
    expect(outcomeOf(found, { truncated: true })).toBe('found')
  })
})

describe('reachableRefuels — one entry per station', () => {
  const at = (name: string, lat: number, lng: number): Poi =>
    ({ osm_id: `node:${name}-${lat}-${lng}`, name, lat, lng } as Poi)

  it('FE-ROADTRIP-REFUEL-010: a charging site mapped as one node per socket is offered once', () => {
    // Measured on a real day: the top three offers were the same "autostrom plus GmbH"
    // three times over, because OSM maps every socket as its own node.
    // The real shape of it: four nodes in two pairs, 6 m and 7 m apart, with 450 m
    // between the pairs.
    const sockets = [
      at('autostrom plus GmbH', 52, 13.3),
      at('autostrom plus GmbH', 52.00005, 13.30005),
      at('autostrom plus GmbH', 52.004, 13.3005),
      at('autostrom plus GmbH', 52.00405, 13.30045),
    ]
    const out = reachableRefuels(sockets, LINE, 100)
    expect(out).toHaveLength(1)
  })

  it('FE-ROADTRIP-REFUEL-011: the same chain in two towns stays two entries', () => {
    // Name alone is not identity: a chain has a branch everywhere.
    // Measured: genuinely different branches were 18 to 36 km apart.
    const out = reachableRefuels([at('Aral', 52, 13.2), at('Aral', 52, 13.6)], LINE, 100)
    expect(out).toHaveLength(2)
  })

  it('FE-ROADTRIP-REFUEL-012: two operators sharing one services are both offered', () => {
    // Position alone is not identity either.
    const out = reachableRefuels([at('Aral', 52, 13.3), at('Shell', 52.0003, 13.3)], LINE, 100)
    expect(out.map(p => p.name).sort()).toEqual(['Aral', 'Shell'])
  })
})

describe('refuelBandState', () => {
  const candidate = (name: string): RefuelCandidate =>
    ({ ...poi(name, 52, 13.5), alongKm: 40, offRouteKm: 0.4, spareKm: 30 })
  const search = (over: Partial<RefuelSearchView> = {}): RefuelSearchView =>
    ({ openFor: null, loading: false, outcome: null, results: [], ...over })

  it('FE-ROADTRIP-REFUEL-013: a search filed under another leg leaves this band alone', () => {
    // One search is open at a time and it names the dry point it belongs to, so a band
    // three legs down the chain must not light up for a question asked about this one.
    expect(refuelKey(7, 1)).toBe('7:1')
    const band = refuelBandState(search({ openFor: '7:4', outcome: 'found', results: [candidate('a')] }), 7, 1)
    expect(band).toEqual({ open: false, loading: false, offers: [], empty: null, control: 'find' })
  })

  it('FE-ROADTRIP-REFUEL-014: while the request runs the lamp steps aside for the way out', () => {
    const band = refuelBandState(search({ openFor: '7:1', loading: true }), 7, 1)
    expect(band).toEqual({ open: true, loading: true, offers: [], empty: null, control: 'close' })
  })

  it('FE-ROADTRIP-REFUEL-015: an answer lists three at most, in the order the search ranked them', () => {
    const results = ['a', 'b', 'c', 'd', 'e'].map(candidate)
    const band = refuelBandState(search({ openFor: '7:1', outcome: 'found', results }), 7, 1)
    expect(REFUEL_OFFER_LIMIT).toBe(3)
    expect(band.offers.map(o => o.name)).toEqual(['a', 'b', 'c'])
    expect(band.control).toBe('close')
    expect(band.empty).toBeNull()
  })

  it.each<Exclude<RefuelOutcome, 'found'>>(['none', 'incomplete', 'failed'])(
    'FE-ROADTRIP-REFUEL-016: an empty answer (%s) says which nothing it was and leaves a retry',
    outcome => {
      // A retry rather than a dead end: the place search is a shared service that does
      // time out, and no answer with no way to ask again reads as broken.
      const band = refuelBandState(search({ openFor: '7:1', outcome }), 7, 1)
      expect(band).toEqual({ open: true, loading: false, offers: [], empty: outcome, control: 'again' })
      expect(REFUEL_EMPTY_KEY[outcome]).toBe(`roadtrip.refuel.${outcome}`)
    },
  )

  it('FE-ROADTRIP-REFUEL-017: asked but nothing back yet keeps the lamp and says nothing', () => {
    const band = refuelBandState(search({ openFor: '7:1' }), 7, 1)
    expect(band).toEqual({ open: true, loading: false, offers: [], empty: null, control: 'find' })
  })

  it('FE-ROADTRIP-REFUEL-018: the battery never borrows the tank\'s words', () => {
    expect(REFUEL_WORDS.fuel).toEqual({
      dry: 'roadtrip.refuel.dry', find: 'roadtrip.refuel.find', add: 'roadtrip.refuel.add',
    })
    expect(REFUEL_WORDS.electric).toEqual({
      dry: 'roadtrip.refuel.dryElectric', find: 'roadtrip.refuel.findElectric', add: 'roadtrip.refuel.addElectric',
    })
  })

  it('FE-ROADTRIP-REFUEL-019: results that arrive before their outcome already offer the way out', () => {
    // The close control follows the results rather than the outcome, which is how the
    // desktop rail always decided it: once there is something on the map to dismiss,
    // the band offers to dismiss it.
    const band = refuelBandState(search({ openFor: '7:1', results: [candidate('a')] }), 7, 1)
    expect(band.control).toBe('close')
    expect(band.offers).toEqual([])
    expect(band.empty).toBeNull()
  })
})
