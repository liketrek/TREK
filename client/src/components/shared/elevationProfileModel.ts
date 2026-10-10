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

export function prepareElevationProfileChart(
  samples: readonly DistanceIndexedProfileSample[],
  width: number,
  height: number,
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
  const minElevation = Math.min(...elevations)
  const maxElevation = Math.max(...elevations)
  const elevationSpan = Math.max(maxElevation - minElevation, 1)
  const maxDistance = samples[samples.length - 1].distanceMeters || 1
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
    areaPath: `${linePath} L${width},${height} L0,${height} Z`,
  }
}