import { describe, it, expect } from 'vitest'
import { greatCircle, unwrapLngs, geodesicArcs } from './flightGeodesy'

const YVR: [number, number] = [49.19, -123.18]
const ICN: [number, number] = [37.46, 126.44]
const FRA: [number, number] = [50.03, 8.57]
const JFK: [number, number] = [40.64, -73.78]

const maxConsecutiveDeltaLng = (pts: [number, number][]) =>
  pts.reduce((max, p, i) => (i === 0 ? 0 : Math.max(max, Math.abs(p[1] - pts[i - 1][1]))), 0)

describe('flightGeodesy (#1411)', () => {
  it('a date-line crossing unwraps into one continuous arc plus a shifted copy for Leaflet', () => {
    const arcs = geodesicArcs(YVR, ICN, true)
    expect(arcs).toHaveLength(2)
    const [base, shifted] = arcs
    // continuous: no ±360 jump anywhere
    expect(maxConsecutiveDeltaLng(base)).toBeLessThan(180)
    // endpoints: starts at YVR, ends at ICN unwrapped westwards (126.44 - 360)
    expect(base[0][0]).toBeCloseTo(YVR[0], 5)
    expect(base[0][1]).toBeCloseTo(YVR[1], 5)
    expect(base[base.length - 1][1]).toBeCloseTo(ICN[1] - 360, 5)
    // the copy is the base shifted by exactly +360
    expect(shifted).toHaveLength(base.length)
    shifted.forEach(([lat, lng], i) => {
      expect(lat).toBe(base[i][0])
      expect(lng).toBeCloseTo(base[i][1] + 360, 10)
    })
  })

  it('an eastbound crossing unwraps upwards and shifts by -360', () => {
    const arcs = geodesicArcs(ICN, YVR, true)
    expect(arcs).toHaveLength(2)
    const [base, shifted] = arcs
    expect(maxConsecutiveDeltaLng(base)).toBeLessThan(180)
    expect(base[base.length - 1][1]).toBeCloseTo(YVR[1] + 360, 5)
    expect(shifted[0][1]).toBeCloseTo(base[0][1] - 360, 10)
  })

  it('a non-crossing flight stays a single in-range arc', () => {
    const arcs = geodesicArcs(FRA, JFK, true)
    expect(arcs).toHaveLength(1)
    for (const [, lng] of arcs[0]) {
      expect(lng).toBeGreaterThanOrEqual(-180)
      expect(lng).toBeLessThanOrEqual(180)
    }
  })

  it('GL mode always returns exactly one continuous arc (world copies handle the wrap)', () => {
    const arcs = geodesicArcs(YVR, ICN, false)
    expect(arcs).toHaveLength(1)
    expect(maxConsecutiveDeltaLng(arcs[0])).toBeLessThan(180)
  })

  it('a zero-distance leg passes the endpoints through', () => {
    expect(greatCircle(YVR, YVR)).toEqual([YVR, YVR])
  })

  it('unwrapLngs keeps already-continuous input unchanged', () => {
    const pts: [number, number][] = [[0, 170], [0, 175], [0, 179]]
    expect(unwrapLngs(pts)).toEqual(pts)
  })
})
