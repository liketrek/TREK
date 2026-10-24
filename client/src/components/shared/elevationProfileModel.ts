import type { DistanceIndexedProfileSample } from '../../utils/routeGeometry'

export interface ElevationProfileChartPoint {
  x: number
  y: number
}

export interface ElevationProfileChartModel {
  minElevation: number
  maxElevation: number
  elevationSpan: number
  maxDistance: number
  hasGeographicCoordinates: boolean
  points: ElevationProfileChartPoint[]
  linePath: string
  areaPath: string
}

/** The axes a chart is drawn on: its lowest and highest heights and its length. */
interface ElevationProfileDomain {
  minElevation: number
  maxElevation: number
  maxDistance: number
}

/**
 * One set of axes for several profiles drawn over each other (the ways a
 * route can take), so a way that climbs higher or runs longer looks it.
 * Null when none of them has a sample.
 */
export function sharedProfileDomain(
  profiles: ReadonlyArray<readonly DistanceIndexedProfileSample[]>,
): ElevationProfileDomain | null {
  const samples = profiles.flat()
  if (samples.length === 0) return null
  const elevations = samples.map(sample => sample.elevationMeters)
  return {
    minElevation: Math.min(...elevations),
    maxElevation: Math.max(...elevations),
    maxDistance: Math.max(...profiles.map(profile => profile[profile.length - 1]?.distanceMeters ?? 0)),
  }
}

/** The chart of a profile, on its own axes or on the `domain` it shares with others. */
export function prepareElevationProfileChart(
  samples: readonly DistanceIndexedProfileSample[],
  width: number,
  height: number,
  domain: ElevationProfileDomain | null = null,
): ElevationProfileChartModel {
  if (samples.length === 0) return {
    minElevation: 0,
    maxElevation: 0,
    elevationSpan: 1,
    maxDistance: 1,
    hasGeographicCoordinates: false,
    points: [],
    linePath: '',
    areaPath: '',
  }
  const elevations = samples.map(sample => sample.elevationMeters)
  const minElevation = domain?.minElevation ?? Math.min(...elevations)
  const maxElevation = domain?.maxElevation ?? Math.max(...elevations)
  const elevationSpan = Math.max(maxElevation - minElevation, 1)
  const maxDistance = (domain?.maxDistance ?? samples[samples.length - 1].distanceMeters) || 1
  const points = samples.map(sample => ({
    x: (sample.distanceMeters / maxDistance) * width,
    y: height - ((sample.elevationMeters - minElevation) / elevationSpan) * (height - 8) - 4,
  }))
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')

  return {
    minElevation,
    maxElevation,
    elevationSpan,
    maxDistance,
    hasGeographicCoordinates: samples.every(sample => Number.isFinite(sample.lat) && Number.isFinite(sample.lng)),
    points,
    linePath,
    // On shared axes a shorter way ends before the right edge: its area closes under its own ends.
    areaPath: domain
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`
      : `${linePath} L${width},${height} L0,${height} Z`,
  }
}