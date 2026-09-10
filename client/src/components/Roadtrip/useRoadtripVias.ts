import { useCallback, useEffect, useState } from 'react'
import { addListener, removeListener } from '../../api/websocket'
import { roadtripApi } from '../../api/client'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { isEmptyReanchoring, type Reanchoring } from './roadtripModel'
import type { RoadtripDayTrack, RoadtripVia } from '@trek/shared'

/**
 * Via points are DELIBERATELY online-only, which the repo asks to be said out
 * loud rather than left to be discovered.
 *
 * Everything else on this screen goes through a repo and the mutation queue:
 * optimistic Dexie write, temporary negative id, idempotent replay on
 * reconnect. A via cannot follow that shape as it stands, because its anchor is
 * a POSITION rather than an id — `after_order_index` counts stops as the routing
 * request builds them — so a queued write replayed after somebody else has
 * added or removed a stop would re-pin the drive onto a leg nobody chose, and it
 * would do so silently, hours later. The correct offline story needs the anchor
 * to be an assignment id first, which is a change to the wire contract and to
 * the migration, not to this hook.
 *
 * Until then the honest behaviour is to say so: `editable` is false with no
 * network, so the map stops offering a drag it cannot keep, instead of failing
 * one write at a time and losing the edit.
 */
export interface RoadtripVias {
  /** Every via of the trip, keyed by day. */
  byDay: Record<number, RoadtripVia[]>
  /**
   * Which imported track each day was fitted to, keyed by day.
   *
   * The vias are what make the day follow it; this is what lets the day say so. Empty for
   * a day shaped by hand, and gone by itself when the track is deleted — the row cascades
   * with the place, so nothing here can name a line that no longer exists.
   */
  trackByDay: Record<number, RoadtripDayTrack>
  /**
   * True when the last read failed for a reason other than "there is nothing
   * here", so what is drawn may be older than what the server holds.
   *
   * The read runs after every write, and the via list feeds the routing key, so
   * emptying on a transient failure re-routed the whole trip along the roads the
   * traveller had steered away from — indistinguishable from having deleted
   * them. The list is kept and the staleness is said instead.
   */
  stale: boolean
  /**
   * Whether shaping the drive is possible right now.
   *
   * False with no network: the domain is online-only (see the note above this
   * interface), so the surfaces disable the gesture rather than accepting one
   * and dropping it.
   */
  editable: boolean
  add: (dayId: number, afterOrderIndex: number, lat: number, lng: number) => Promise<void>
  /**
   * Lay a chain of vias on one day, optionally clearing the legs it fills first.
   *
   * One request and one reload for the whole chain. `add` per point would trigger a full
   * trip re-route between each one, spaced by the routing host's rate limit, so a
   * twenty-anchor track would spend half a minute drawing routes nobody asked to see.
   */
  addMany: (
    dayId: number,
    vias: { after_order_index: number; lat: number; lng: number }[],
    replaceLegs?: number[],
    /** Absent leaves the day's track alone, null clears it, an object records a new one. */
    track?: { place_id: number; stray_km?: number | null } | null,
  ) => Promise<void>
  move: (dayId: number, id: number, lat: number, lng: number, afterOrderIndex?: number) => Promise<void>
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
const EMPTY_TRACKS: Record<number, RoadtripDayTrack> = {}

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
/** A copy of the map without one day, so an emptied day does not linger as an empty list. */
function omit<T>(map: Record<number, T>, dayId: number): Record<number, T> {
  if (!(dayId in map)) return map
  const next = { ...map }
  delete next[dayId]
  return next
}

export function useRoadtripVias(tripId: number | string | null, active: boolean): RoadtripVias {
  const [byDay, setByDay] = useState<Record<number, RoadtripVia[]>>(EMPTY)
  const [trackByDay, setTrackByDay] = useState<Record<number, RoadtripDayTrack>>(EMPTY_TRACKS)
  /**
   * The list on screen may be older than the server's.
   *
   * Set when a read fails for a reason that is not "there is nothing here", so
   * the rail can say the shaping it is drawing might be out of date rather than
   * quietly showing a trip that has lost its detours.
   */
  const [stale, setStale] = useState(false)
  // Read through the app's single source of truth for connectivity, which also
  // covers the offline switch a user can set with the network still up.
  const { offline } = useNetworkMode()

  const group = useCallback((vias: RoadtripVia[]) => {
    const next: Record<number, RoadtripVia[]> = {}
    for (const v of vias) (next[v.day_id] ??= []).push(v)
    return next
  }, [])

  const reload = useCallback(async () => {
    if (!tripId || !active) { setByDay(EMPTY); setTrackByDay(EMPTY_TRACKS); return }
    try {
      const { vias, tracks } = await roadtripApi.listVias(tripId)
      setByDay(group(vias))
      const byId: Record<number, RoadtripDayTrack> = {}
      for (const track of tracks ?? []) byId[track.day_id] = track
      setTrackByDay(byId)
      setStale(false)
    } catch (err) {
      // An instance with the addon off answers 404 here, and a caller without
      // the permission 403. Neither is worth reporting: it just means there are
      // no vias to draw, and emptying is the truthful answer.
      //
      // Anything else is not. This read runs after every write, so a 502 from a
      // proxy, a dropped connection or a tab that has just gone offline used to
      // empty the map — and because the via list feeds the routing key, the whole
      // trip was then re-routed along the roads the traveller had steered away
      // from. Nothing said so, nothing retried, and it looked exactly like
      // having deleted them. The last known list is kept instead.
      const status = (err as { response?: { status?: number } } | null)?.response?.status
      if (status === 404 || status === 403) {
        setByDay(EMPTY)
        setTrackByDay(EMPTY_TRACKS)
        setStale(false)
        return
      }
      setStale(true)
    }
  }, [tripId, active, group])

  useEffect(() => { void reload() }, [reload])

  /**
   * What somebody else did to the drive, applied as it happens.
   *
   * Its own listener rather than a slice in the store, the way the collab tabs do it:
   * these points live in this hook and nowhere else, and giving them a store slice would
   * be a second copy of the same list to keep in step.
   *
   * The server sends the whole day's list, so applying it is a replace rather than a
   * merge — and it excludes the socket that wrote, so a drag never gets its own point
   * handed back mid-gesture.
   */
  useEffect(() => {
    if (!tripId || !active) return
    const handler = (event: Record<string, unknown>) => {
      if (String(event.tripId) !== String(tripId)) return
      const dayId = Number(event.dayId)
      if (!Number.isFinite(dayId)) return
      if (event.type === 'roadtripVia:changed') {
        const vias = (event.vias ?? []) as RoadtripVia[]
        setByDay(prev => (vias.length ? { ...prev, [dayId]: vias } : omit(prev, dayId)))
      }
      if (event.type === 'roadtripTrack:changed') {
        const track = event.track as RoadtripDayTrack | null
        setTrackByDay(prev => (track ? { ...prev, [dayId]: track } : omit(prev, dayId)))
      }
    }
    addListener(handler)
    return () => removeListener(handler)
  }, [tripId, active])

  const add = useCallback(async (dayId: number, afterOrderIndex: number, lat: number, lng: number) => {
    if (!tripId) return
    await roadtripApi.addVia(tripId, dayId, { after_order_index: afterOrderIndex, lat, lng })
    await reload()
  }, [tripId, reload])

  const addMany = useCallback(async (
    dayId: number,
    vias: { after_order_index: number; lat: number; lng: number }[],
    replaceLegs?: number[],
    track?: { place_id: number; stray_km?: number | null } | null,
  ) => {
    if (!tripId) return
    // An empty chain with nothing to clear is not a write. It is a real call though, from
    // a track that thinned down to nothing on a very short day, and from a track that the
    // drive already followed — which still has a name to record.
    if (!vias.length && !replaceLegs?.length && track === undefined) return
    await roadtripApi.addVias(tripId, dayId, {
      vias,
      replace_legs: replaceLegs,
      ...(track === undefined ? {} : { track }),
    })
    await reload()
  }, [tripId, reload])

  const move = useCallback(async (dayId: number, id: number, lat: number, lng: number, afterOrderIndex?: number) => {
    if (!tripId) return
    // The anchor rides along when the caller worked out a new one: a via dragged past the
    // stop it used to sit before belongs to the next leg now, and saying only where it is
    // leaves it claiming the old one.
    await roadtripApi.moveVia(tripId, dayId, id, {
      lat,
      lng,
      ...(afterOrderIndex === undefined ? {} : { after_order_index: afterOrderIndex }),
    })
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

  return { byDay, trackByDay, stale, editable: !offline, add, addMany, move, remove, reanchor }
}
