import type { Waypoint } from '../../../types'
import { valhallaBase, valhallaRun, valhallaTurn } from '../../Map/valhallaRoute'

export interface TourRouteResult {
  coordinates: [number, number][]
  distanceMeters: number
  durationSeconds: number
}

/**
 * Defensive fallback only. Normal planner calls pass the persisted/draft value.
 * TREK exposes 1..6 and never exposes Valhalla's internal 0.
 */
const TOURS_MAX_HIKING_DIFFICULTY = 2

/** Tours deliberately bypasses the OSRM-first RouteCalculator. */
export async function routeWalkingTour(
  waypoints: Pick<Waypoint, 'lat' | 'lng'>[],
  signal?: AbortSignal,
  maxHikingDifficulty = TOURS_MAX_HIKING_DIFFICULTY,
): Promise<TourRouteResult | null> {
  const run = await valhallaRun(waypoints, 'walking', [], signal, {
    max_hiking_difficulty: maxHikingDifficulty,
  })
  if (!run) return null
  return {
    coordinates: run.total.coordinates,
    distanceMeters: run.total.distance,
    durationSeconds: run.total.duration,
  }
}

const HEIGHT_CHUNK_SIZE = 500

export type TourElevationPoint = [number, number] | [number, number, number]

type HeightResponse = {
  range_height?: unknown
}

export function parseValhallaElevation(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseElevations(data: HeightResponse, expected: number): (number | null)[] | null {
  if (!Array.isArray(data.range_height) || data.range_height.length !== expected) return null
  return data.range_height.map(entry => {
    if (!Array.isArray(entry) || entry.length < 2) return null
    return parseValhallaElevation(entry[1])
  })
}

/**
 * Ask Valhalla's independent /height stage for every routed vertex. Chunks
 * overlap by one point so full route resolution is retained without inventing
 * elevations when a host rejects a large request.
 */
export async function enrichTourElevations(
  coordinates: [number, number][],
  signal?: AbortSignal,
): Promise<TourElevationPoint[] | null> {
  const base = valhallaBase()
  if (!base || coordinates.length < 2) return null

  const elevations: (number | null)[] = Array(coordinates.length).fill(null)
  for (let offset = 0; offset < coordinates.length; offset += HEIGHT_CHUNK_SIZE - 1) {
    if (signal?.aborted) return null
    const chunk = coordinates.slice(offset, offset + HEIGHT_CHUNK_SIZE)
    if (chunk.length === 1 && offset > 0) break
    try {
      // The route came from the same host a moment ago, and the public one allows a
      // request a second: without the wait the first height question is refused and
      // the tour cannot be saved for want of elevation.
      await valhallaTurn(base, signal)
      if (signal?.aborted) return null
      const response = await fetch(`${base}/height`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'trek' },
        body: JSON.stringify({
          shape: chunk.map(([lat, lng]) => ({ lat, lon: lng })),
          range: true,
        }),
        signal,
      })
      if (!response.ok) break
      const chunkElevations = parseElevations(await response.json() as HeightResponse, chunk.length)
      if (!chunkElevations) break
      chunkElevations.forEach((elevation, index) => {
        const routeIndex = offset + index
        if (offset > 0 && index === 0 && elevations[routeIndex] !== null) return
        elevations[routeIndex] = elevation
      })
    } catch {
      if (signal?.aborted) return null
      break
    }
  }

  return coordinates.map(([lat, lng], index) => {
    const elevation = elevations[index]
    return elevation === null ? [lat, lng] : [lat, lng, elevation]
  })
}
