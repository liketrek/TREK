import { describe, expect, it } from 'vitest'
import {
  alongLabel,
  anchorKmFor,
  corridorHitLabel,
  corridorWindow,
  DESKTOP_CORRIDOR_BUDGET,
  offRouteLabel,
  PHONE_CORRIDOR_BUDGET,
  PHONE_CORRIDOR_OPTIONS,
  PHONE_REACH_KM,
} from './corridorSearchModel'
import type { TranslationFn } from '../../types'

// FE-ROADTRIP-CORWIN-001 to FE-ROADTRIP-CORWIN-012

/** Echoes the key and its parameters, so assertions stay off the copy. */
const t: TranslationFn = (key, params) =>
  params ? `${key}:${Object.values(params).join(',')}` : key

describe('corridorWindow', () => {
  it('FE-ROADTRIP-CORWIN-001: a stage search has no window, which is the whole day', () => {
    expect(corridorWindow(120, 'stage')).toBeNull()
  })

  it('FE-ROADTRIP-CORWIN-002: an ahead search starts at the anchor and runs one reach', () => {
    expect(corridorWindow(120, 'ahead')).toEqual({ fromKm: 120, toKm: 120 + PHONE_REACH_KM })
  })

  it('FE-ROADTRIP-CORWIN-003: never starts behind the beginning of the drive', () => {
    // A negative anchor cannot come from `anchorKmFor`, but a window that started at
    // -20 would ask the slicer for road that does not exist.
    expect(corridorWindow(-20, 'ahead')).toEqual({ fromKm: 0, toKm: PHONE_REACH_KM })
  })

  it('FE-ROADTRIP-CORWIN-004: takes a reach of its own, so the figure is not baked in', () => {
    expect(corridorWindow(10, 'ahead', 25)).toEqual({ fromKm: 10, toKm: 35 })
  })
})

describe('anchorKmFor', () => {
  const stops = [0, 40, 95, 180]

  it('FE-ROADTRIP-CORWIN-005: without a next stop it is the start of the stage', () => {
    // No position source and no clock reading: the honest answer is the beginning of
    // the day, not a guess dressed up as a location.
    expect(anchorKmFor(stops, null)).toBe(0)
  })

  it('FE-ROADTRIP-CORWIN-006: the first stop is also the start, not a step back', () => {
    expect(anchorKmFor(stops, 0)).toBe(0)
  })

  it('FE-ROADTRIP-CORWIN-007: otherwise it is the stop already behind the traveller', () => {
    // Heading for the third stop means the second is behind: that is where the road
    // still to drive begins.
    expect(anchorKmFor(stops, 2)).toBe(40)
  })

  it('FE-ROADTRIP-CORWIN-008: an index the stop list cannot answer falls back to the start', () => {
    expect(anchorKmFor(stops, 99)).toBe(0)
    expect(anchorKmFor([0, Number.NaN, 95], 2)).toBe(0)
  })
})

describe('the labels a hit carries', () => {
  it('FE-ROADTRIP-CORWIN-009: anything under half a kilometre in is "at the start"', () => {
    expect(alongLabel(0.2, 'metric', t)).toBe('roadtrip.poi.atStart')
    expect(alongLabel(0.5, 'metric', t)).toBe('roadtrip.poi.alongRoute:500 m')
  })

  it('FE-ROADTRIP-CORWIN-010: the detour is stated in the trip’s own unit', () => {
    expect(offRouteLabel(1.5, 'metric', t)).toBe('roadtrip.poi.offRoute:1.5 km')
    expect(offRouteLabel(1.5, 'imperial', t)).toBe('roadtrip.poi.offRoute:0.9 mi')
  })

  it('FE-ROADTRIP-CORWIN-011: the phone joins both into the one line a row has room for', () => {
    expect(corridorHitLabel({ alongKm: 82, offRouteKm: 0.4 }, 'metric', t))
      .toBe('roadtrip.poi.alongRoute:82 km · roadtrip.poi.offRoute:400 m')
  })
})

describe('the budgets', () => {
  it('FE-ROADTRIP-CORWIN-012: the desk keeps its old behaviour, the phone is capped', () => {
    // The desktop budget IS today's behaviour written down: no deadline, every failed
    // box retried. Loosening the phone's numbers is a product decision, not a tidy-up,
    // so they are pinned.
    expect(DESKTOP_CORRIDOR_BUDGET).toEqual({ maxTiles: 16, maxRetries: null, deadlineMs: null })
    expect(PHONE_CORRIDOR_BUDGET).toEqual({ maxTiles: 10, maxRetries: 2, deadlineMs: 25_000 })
    // Handed down by identity so the search callback underneath is not rebuilt.
    expect(PHONE_CORRIDOR_OPTIONS.budget).toBe(PHONE_CORRIDOR_BUDGET)
  })
})
