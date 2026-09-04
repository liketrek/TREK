import { describe, it, expect } from 'vitest'
import { ACCESS_SPUR_MIN_M, ACCESS_LABEL_MIN_M, spurFor, spurWorthLabelling } from './accessSpur'
import type { SnappedWaypoint } from '../../types'

const snap = (meters: number): SnappedWaypoint => ({
  asked: [53.5, 10.0],
  at: [53.51, 10.01],
  meters,
})

describe('access spur', () => {
  it('FE-ACCESSSPUR-001: a gap worth showing becomes the line from the place to the road', () => {
    const s = snap(400)
    expect(spurFor(s)).toEqual([s.asked, s.at])
  })

  it('FE-ACCESSSPUR-002: map precision is not a gap', () => {
    // A place pinned off an aerial photo lands a few metres from the centreline it
    // belongs to all the time. Drawing those would put a dash on nearly every stop.
    expect(spurFor(snap(0))).toBeNull()
    expect(spurFor(snap(ACCESS_SPUR_MIN_M - 1))).toBeNull()
  })

  it('FE-ACCESSSPUR-003: the threshold itself counts as a gap', () => {
    expect(spurFor(snap(ACCESS_SPUR_MIN_M))).not.toBeNull()
  })

  it('FE-ACCESSSPUR-004: nothing to draw when the router said nothing', () => {
    expect(spurFor(undefined)).toBeNull()
    expect(spurFor(null)).toBeNull()
  })

  it('FE-ACCESSSPUR-005: a NaN distance is not a gap either', () => {
    // Recomputed distances can come out NaN from a malformed coordinate, and NaN >= n is
    // false — asserted rather than assumed, because the guard reads as a plain comparison.
    expect(spurFor(snap(Number.NaN))).toBeNull()
  })

  it('FE-ACCESSSPUR-006: only a walk long enough to change the plan gets a number', () => {
    expect(spurWorthLabelling(ACCESS_LABEL_MIN_M)).toBe(true)
    expect(spurWorthLabelling(ACCESS_LABEL_MIN_M - 1)).toBe(false)
    expect(spurWorthLabelling(null)).toBe(false)
    expect(spurWorthLabelling(undefined)).toBe(false)
  })

  it('FE-ACCESSSPUR-007: the line is drawn but left unlabelled in between', () => {
    // The band where the map says "there is a gap" and the rail stays quiet.
    const between = (ACCESS_SPUR_MIN_M + ACCESS_LABEL_MIN_M) / 2
    expect(spurFor(snap(between))).not.toBeNull()
    expect(spurWorthLabelling(between)).toBe(false)
  })
})
