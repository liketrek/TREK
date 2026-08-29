import { useCallback, useEffect, useState } from 'react'
import { roadtripApi } from '../../api/client'
import { isEmptyReanchoring, type Reanchoring } from './roadtripModel'
import type { RoadtripVia } from '@trek/shared'

export interface RoadtripVias {
  /** Every via of the trip, keyed by day. */
  byDay: Record<number, RoadtripVia[]>
  add: (dayId: number, afterOrderIndex: number, lat: number, lng: number) => Promise<void>
  move: (dayId: number, id: number, lat: number, lng: number) => Promise<void>
  remove: (dayId: number, id: number) => Promise<void>
  /**
   * Correct a day's anchors after its stops changed shape.
   *
   * Awaited by the caller before it lets the day re-route: the routing effect resolves
   * `after_order_index` against whatever the stop list looks like at that moment, so a
   * re-anchoring that lands afterwards is a second, visibly wrong route in between.
   */
  reanchor: (dayId: number, plan: Reanchoring) => Promise<void>
}

const EMPTY: Record<number, RoadtripVia[]> = {}

/**
 * The points this trip's drives are routed through.
 *
 * Loaded once for the whole trip rather than per day: a road trip routes every day at
 * once, and one request for the lot beats one per day against a server that has to open
 * the same table each time.
 *
 * Writes are optimistic in the sense that the list is refreshed from the answer, not
 * patched by hand — a via has a server-assigned id and sequence, and guessing them would
 * be a second source of truth for the sake of one round trip.
 */
export function useRoadtripVias(tripId: number | string | null, active: boolean): RoadtripVias {
  const [byDay, setByDay] = useState<Record<number, RoadtripVia[]>>(EMPTY)

  const group = useCallback((vias: RoadtripVia[]) => {
    const next: Record<number, RoadtripVia[]> = {}
    for (const v of vias) (next[v.day_id] ??= []).push(v)
    return next
  }, [])

  const reload = useCallback(async () => {
    if (!tripId || !active) { setByDay(EMPTY); return }
    try {
      const { vias } = await roadtripApi.listVias(tripId)
      setByDay(group(vias))
    } catch {
      // An instance with the addon off answers 404 here, which is not an error worth
      // reporting — it just means there are no vias to draw.
      setByDay(EMPTY)
    }
  }, [tripId, active, group])

  useEffect(() => { void reload() }, [reload])

  const add = useCallback(async (dayId: number, afterOrderIndex: number, lat: number, lng: number) => {
    if (!tripId) return
    await roadtripApi.addVia(tripId, dayId, { after_order_index: afterOrderIndex, lat, lng })
    await reload()
  }, [tripId, reload])

  const move = useCallback(async (dayId: number, id: number, lat: number, lng: number) => {
    if (!tripId) return
    await roadtripApi.moveVia(tripId, dayId, id, { lat, lng })
    await reload()
  }, [tripId, reload])

  const reanchor = useCallback(async (dayId: number, plan: Reanchoring) => {
    if (!tripId || isEmptyReanchoring(plan)) return
    await roadtripApi.reanchorVias(tripId, dayId, plan)
    await reload()
  }, [tripId, reload])

  const remove = useCallback(async (dayId: number, id: number) => {
    if (!tripId) return
    await roadtripApi.removeVia(tripId, dayId, id)
    await reload()
  }, [tripId, reload])

  return { byDay, add, move, remove, reanchor }
}
