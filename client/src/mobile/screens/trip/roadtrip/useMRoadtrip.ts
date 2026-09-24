import { useEffect, useMemo, useState } from 'react'
import { destinationCount, roadtripRows, stageClocks, stageEnd, stageOf, upNextStop } from '../../../../components/Roadtrip/roadtripRowModel'
import { useRoadtripSettings } from '../../../../hooks/useRoadtripSettings'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useTripStore } from '../../../../store/tripStore'
import { isEffectivelyOffline, onNetworkModeChange } from '../../../../sync/networkMode'
import type { RoadtripDay } from '@trek/shared/roadtrip'
import type { MTripShellApi, TripPlanner } from '../MTripShell'
import type { RoadtripRow, StopRow } from '../../../../components/Roadtrip/roadtripRowModel'
import type { Category, Place } from '../../../../types'
import { localIsoDate } from '../../../../utils/localDate'

/** Minutes since midnight, local time. */
const nowMinutes = (): number => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/** The same 30 s tick the day timeline runs on, so the two never disagree by a minute. */
const TICK_MS = 30_000

export interface MRoadtripController {
  stage: RoadtripDay | null
  rows: RoadtripRow[]
  /** The head card's two figures, both taken from the arrival column the rows print. See stageClocks. */
  clocks: ReturnType<typeof stageClocks>
  /** The stop the bar over the map names, pictures and opens, with the clock it shows. See stageEnd. */
  end: StopRow | null
  /** The place row behind `end`, for the picture the bar leads with. Null without one. */
  endPlace: Place | null
  /** Its category, whose icon and colour stand in for a place that has no photo. */
  endCategory: Category | null
  stops: number
  /** True while the routing round is still working through the trip's days. */
  loading: boolean
  /** The trip has the addon on but nothing routable: one place on a day is not a drive. */
  empty: boolean
  offline: boolean
  electric: boolean
  /** Next destination the plan still owes, today only. Negative minutesUntil is late. */
  upNext: ReturnType<typeof upNextStop>
  isToday: boolean
}

/**
 * Everything the stage screen needs, kept out of its markup.
 *
 * The clock is the only moving part: a screen that shows a morning's plan all day
 * quietly lies once you leave twenty minutes late, and the fix is arithmetic on the
 * schedule rather than a request. Nothing here asks the network for anything.
 */
export function useMRoadtrip(planner: TripPlanner): MRoadtripController {
  const { roadtripRoutes, selectedDayId, days } = planner
  const vehicle = useRoadtripSettings(s => s.roadtrip_vehicle, planner.tripId)
  const [minutes, setMinutes] = useState(nowMinutes)
  const [offline, setOffline] = useState(isEffectivelyOffline)

  useEffect(() => {
    const id = window.setInterval(() => setMinutes(nowMinutes()), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => onNetworkModeChange(() => setOffline(isEffectivelyOffline())), [])

  const stage = useMemo(
    () => stageOf(roadtripRoutes.days, selectedDayId),
    [roadtripRoutes.days, selectedDayId],
  )

  const rows = useMemo(() => (stage ? roadtripRows(stage) : []), [stage])
  const clocks = useMemo(() => stageClocks(rows), [rows])
  const end = useMemo(() => stageEnd(rows), [rows])

  // The place behind the end comes from the whole trip store, not planner.places: with
  // service stops hidden from the day lists the phone filters them out of that list, while
  // the stage still draws them, and a day that ends at a hidden campsite still ends there.
  // The stop sheet and the stage pins read the same list for the same reason.
  const tripPlaces = useTripStore(s => s.places)
  const endPlace = useMemo(
    () => (end ? tripPlaces.find(p => p.id === end.stop.placeId) ?? null : null),
    [end, tripPlaces],
  )
  const categories = planner.categories
  const endCategory = useMemo(
    () => (endPlace?.category_id == null ? null : categories.find(c => c.id === endPlace.category_id) ?? null),
    [endPlace, categories],
  )

  // "Today" is the stage's own date, not the selected day's index: a trip can be
  // planned for next year, and a countdown on a day in March is noise.
  const isToday = useMemo(() => {
    const date = days.find(d => d.id === selectedDayId)?.date
    if (!date) return false
    // The wall clock, not UTC: `nowMinutes` above is local, and between local midnight
    // and the UTC rollover the two disagree, so east of Greenwich the card hung on
    // yesterday's stage for the first hours of every night. `localDate.ts` says as much.
    return date.slice(0, 10) === localIsoDate()
  }, [days, selectedDayId])

  return {
    stage,
    rows,
    clocks,
    end,
    endPlace,
    endCategory,
    stops: stage ? destinationCount(stage) : 0,
    loading: roadtripRoutes.loading,
    empty: !roadtripRoutes.loading && roadtripRoutes.days.length === 0,
    offline,
    electric: vehicle === 'electric',
    upNext: upNextStop(stage, minutes, isToday),
    isToday,
  }
}

/**
 * Brings one stop of the drive into view on the map half, from wherever it was asked for.
 *
 * Through the camera and never through the planner's place selection: the place inspector
 * opens off that selection, so selecting the place came up with the plan tab's card over
 * the very map this was meant to show. The corridor search shows its hits the same way.
 *
 * `cardDayId` is the card the stop is DRAWN on, which after a night drive is not the day it
 * is stored on. When that card is not the stage on screen it becomes the stage first, so the
 * line around the stop the camera lands on is the stage the bar is about. With skipFit, as
 * the day swipe does it: on the stage the camera follows focus points, and here the focus
 * is the stop. The map area lets a focus go once the day moves off the one it arrived with,
 * so the day is picked first, in the same tap, and the focus arrives together with it
 * instead of being let go by it (see MMapArea).
 */
export function showStopOnMap(
  planner: TripPlanner,
  shell: MTripShellApi,
  stop: { lat: number; lng: number },
  cardDayId: number,
): void {
  if (planner.selectedDayId !== cardDayId) planner.handleSelectDay(cardDayId, true)
  planner.focusRoadtripPoint(stop.lat, stop.lng)
  if (shell.rtView === 'list') shell.toggleRtView()
}

/** The trip's own distance unit, for every figure the stage prints. */
export function useDistanceUnit() {
  return useSettingsStore(s => s.settings.distance_unit)
}

/** Kept for the tick's identity in tests. */
export const ROADTRIP_TICK_MS = TICK_MS
