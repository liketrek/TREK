import { describe, expect, it } from 'vitest'
import { analyzeRouteGeometry, focusRouteProfileAtDistance, parseRenderableRouteGeometry } from './routeGeometry'

describe('analyzeRouteGeometry', () => {
  it('shares a validated rendering parser that retains valid elevation values', () => {
    expect(parseRenderableRouteGeometry('[[48,11,512.125],[48.01,11.02,520.75]]'))
      .toEqual([[48, 11, 512.125], [48.01, 11.02, 520.75]])
  })

  it('derives distance, elevation extrema, gain, loss and cumulative-distance samples together', () => {
    const analysis = analyzeRouteGeometry(JSON.stringify([
      [0, 0, 100],
      [0, 0.01, 130],
      [0, 0.03, 110],
    ]))

    expect(analysis).not.toBeNull()
    expect(analysis!.routeCoordinates).toEqual([[0, 0], [0, 0.01], [0, 0.03]])
    expect(analysis!.distanceKm).toBeCloseTo(3.3358, 3)
    expect(analysis!.minEle).toBe(100)
    expect(analysis!.maxEle).toBe(130)
    expect(analysis!.gain).toBe(30)
    expect(analysis!.loss).toBe(20)
    expect(analysis!.distanceIndexedProfileSamples).toHaveLength(3)
    expect(analysis!.distanceIndexedProfileSamples[1]).toMatchObject({ lat: 0, lng: 0.01 })
    expect(analysis!.distanceIndexedProfileSamples[1].distanceMeters).toBeCloseTo(1111.95, 1)
    expect(analysis!.distanceIndexedProfileSamples[2].distanceMeters).toBeCloseTo(3335.85, 1)
  })

  it('maps route endpoints and interpolates focus between prepared samples', () => {
    const samples = [
      { distanceMeters: 0, elevationMeters: 100, lat: 10, lng: 20 },
      { distanceMeters: 100, elevationMeters: 200, lat: 12, lng: 24 },
      { distanceMeters: 300, elevationMeters: 300, lat: 14, lng: 28 },
    ]
    expect(focusRouteProfileAtDistance(samples, -20)).toMatchObject({ distanceMeters: 0, elevationMeters: 100, lat: 10, lng: 20, sampleIndex: 0 })
    expect(focusRouteProfileAtDistance(samples, 150)).toMatchObject({ distanceMeters: 150, elevationMeters: 225, lat: 12.5, lng: 25, sampleIndex: 1 })
    expect(focusRouteProfileAtDistance(samples, 500)).toMatchObject({ distanceMeters: 300, elevationMeters: 300, lat: 14, lng: 28, sampleIndex: 2 })
  })

  it('does not create geographic focus for samples without coordinates', () => {
    expect(focusRouteProfileAtDistance([
      { distanceMeters: 0, elevationMeters: 100 },
      { distanceMeters: 10, elevationMeters: 110 },
    ], 5)).toBeNull()
  })

  it('keeps distance but omits all elevation outputs when any point lacks elevation', () => {
    const analysis = analyzeRouteGeometry(JSON.stringify([
      [48, 11, 500],
      [48.01, 11.01],
    ]))

    expect(analysis?.distanceKm).toBeGreaterThan(0)
    expect(analysis?.minEle).toBeNull()
    expect(analysis?.maxEle).toBeNull()
    expect(analysis?.gain).toBeNull()
    expect(analysis?.loss).toBeNull()
    expect(analysis?.distanceIndexedProfileSamples).toEqual([])
  })

  it.each([undefined, null, '', 'not json', '[]', '[[0,0]]', '[[0,"bad"],[1,1]]'])('returns null for unusable geometry %s', geometry => {
    expect(analyzeRouteGeometry(geometry)).toBeNull()
  })
})
