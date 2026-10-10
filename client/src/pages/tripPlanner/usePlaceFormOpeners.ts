import { useCallback, useMemo } from 'react'
import { normalizePlaceWebsite, type RoadtripStopType } from '@trek/shared'
import { projectOntoRoute, sliceAtMeters, type LatLng } from '../../components/Roadtrip/corridor'
import { roadtripInsertion } from '../../components/Roadtrip/dayWindow'
import type { ServiceStopMode } from '../../components/Roadtrip/manualStop'
import { isServiceStopType } from '../../components/Roadtrip/roadtripModel'
import { stopArrival } from '../../components/Roadtrip/stopArrival'
import { isOvernightCategory } from '../../components/Roadtrip/stopKinds'
import type { CorridorPoi } from '../../components/Roadtrip/useCorridorPois'
import type { usePlaceLanguage } from '../../hooks/usePlaceLanguage'
import type { TripStoreState } from '../../store/tripStore'
import type { Accommodation, Place } from '../../types'
import { getDayOrder } from '../../utils/dayOrder'
import type { PlannerBase } from './plannerTypes'
import { resolvePoolAssignmentId } from './tripPlannerModel'
import type { PlaceEdits } from './usePlaceEdits'
import type { PlannerDialogs } from './usePlannerDialogs'
import type { RoadtripDriveShaping } from './useRoadtripDriveShaping'
import type { RoadtripFeed } from './useRoadtripFeed'

interface PlaceFormOpenersOptions
  extends Pick<PlannerBase, 'trip' | 'can'>,
  Pick<PlannerDialogs, 'stopDraft' | 'setStopDraft' | 'serviceStopForm' | 'setServiceStopForm' | 'serviceStopKind'
    | 'setServiceStopKind' | 'setPrefillCoords' | 'setEditingPlace' | 'setEditingAssignmentId' | 'setPlaceFormDayId'
    | 'setPlaceFormPosition' | 'setShowPlaceForm'>,
  Pick<RoadtripFeed, 'roadtripActive' | 'roadtripFeedActive' | 'roadtripRoutes' | 'roadtripCorridor'>,
  Pick<RoadtripDriveShaping, 'manualStopTargetFor'>,
  Pick<PlaceEdits, 'isTourPlace'> {
  placeLang: ReturnType<typeof usePlaceLanguage>
  isMobile: boolean
  days: TripStoreState['days']
  /** The places the planner lists, without the stops the day lists leave out. */
  places: Place[]
  /** The day lists read as a plan, without the stops only the drive wants. */
  assignments: TripStoreState['assignments']
  tripAccommodations: Accommodation[]
  /** Selects a place the way a click on it in a list does. */
  handlePlaceClick: (placeId: number | null, assignmentId?: number | null) => void
}

/**
 * Every way into the place form or the stop popup: a right click on the map, a POI
 * marker, a hit on the drive, a service stop added by hand with the legs it can go on,
 * the popup handing over to the full form with its duplicate check, and the place editor,
 * which opens the popup instead for a stop or a night of the drive.
 *
 * Nothing here runs an effect, so where useTripPlanner calls it changes nothing.
 */
export function usePlaceFormOpeners(options: PlaceFormOpenersOptions) {
  const {
    trip, can, isMobile, placeLang, places, days, assignments, tripAccommodations, handlePlaceClick, isTourPlace,
    setPrefillCoords, setEditingPlace, setEditingAssignmentId, setPlaceFormDayId, setPlaceFormPosition, setShowPlaceForm,
    stopDraft, setStopDraft, serviceStopForm, serviceStopKind, setServiceStopForm, setServiceStopKind,
    roadtripActive, roadtripFeedActive, roadtripRoutes, roadtripCorridor, manualStopTargetFor,
  } = options
  const handleMapContextMenu = useCallback(async (e, dayId?: number | null) => {
    if (!can('place_edit', trip)) return
    e.originalEvent?.preventDefault()
    const { lat, lng } = e.latlng
    setPrefillCoords({ lat, lng })
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setPlaceFormDayId(dayId ?? null)
    setServiceStopForm(false)
    setShowPlaceForm(true)
    try {
      const { mapsApi } = await import('../../api/client')
      const data = await mapsApi.reverse(lat, lng, placeLang)
      if (data.name || data.address) {
        setPrefillCoords(prev => prev ? { ...prev, name: data.name || '', address: data.address || '' } : prev)
      }
    } catch { /* best effort */ }
  }, [placeLang, setEditingAssignmentId, setEditingPlace, setPlaceFormDayId, setPrefillCoords, setServiceStopForm, setShowPlaceForm])

  // Open the Add-Place form pre-filled from an OSM "explore" POI marker: all the
  // data already comes from the POI, so no reverse-geocode is needed.
  const openAddPlaceFromPoi = useCallback((
    poi: { lat: number; lng: number; name: string; address: string | null; website: string | null; phone: string | null; osm_id: string; category?: string | null; poi_type?: string | null },
    dayId?: number | null,
    /** Index within that day. Omitted, the place is appended, which is what every caller did before. */
    position?: number | null,
    /**
     * What the corridor popup had worked out before the traveller asked for the full
     * form. Without it, leaving the popup by "more details" quietly turned a fuel stop
     * into a numbered destination that counts in every total.
     */
    stop?: { stopType: RoadtripStopType | null; dwellMinutes: number } | null,
  ) => {
    if (!can('place_edit', trip)) return
    setPrefillCoords({
      lat: poi.lat,
      lng: poi.lng,
      name: poi.name,
      address: poi.address || '',
      // Checked again on the way into the form: a plugin POI's website is the plugin's
      // text, and only an address a browser opens as a page belongs in the field.
      website: normalizePlaceWebsite(poi.website) ?? undefined,
      phone: poi.phone || undefined,
      // A plugin POI's `plugin:<pluginId>:<id>` rides along as it is. The server never
      // takes that prefix for a Google place id, so the details column makes no Google call.
      osm_id: poi.osm_id,
      // What the map search filed it under, so the form can preselect a category (#2282).
      category: poi.poi_type || poi.category || undefined,
      stop_type: stop?.stopType ?? null,
      duration_minutes: stop?.dwellMinutes,
    })
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setPlaceFormDayId(dayId ?? null)
    setPlaceFormPosition(position ?? null)
    setServiceStopForm(false)
    setShowPlaceForm(true)
  }, [trip, setEditingAssignmentId, setEditingPlace, setPlaceFormDayId, setPlaceFormPosition, setPrefillCoords, setServiceStopForm, setShowPlaceForm])

  const roadtripDayId = roadtripCorridor.day?.dayId ?? null
  const { insertIndexFor: roadtripInsertIndexFor } = roadtripCorridor
  const roadtripDayNumber = roadtripCorridor.day?.dayNumber ?? 0
  /**
   * The check-out days a night started on `dayId` can end on.
   *
   * Ordered by the trip's own day order rather than by array position, the same rule the
   * day detail panel follows: a day list can be sorted by anything, and a hotel booked
   * out on "the next day" has to mean the next day of the trip.
   */
  const overnightOptions = useCallback((dayId: number) => {
    const ordered = [...days].sort((a, b) => getDayOrder(a, days) - getDayOrder(b, days))
    const from = ordered.findIndex(d => d.id === dayId)
    const rest = from < 0 ? ordered : ordered.slice(from)
    return {
      days: rest.map(d => ({ id: d.id, number: d.day_number ?? 0, date: d.date ?? null })),
      // The day after, or this one when it is the last: a night on the final day of a
      // trip has nowhere else to end.
      defaultEndDayId: rest[1]?.id ?? rest[0]?.id ?? dayId,
    }
  }, [days])

  /**
   * Adding a POI straight off the map, with the day it belongs to.
   *
   * In road trip mode that is the day being searched: without it the place lands in the
   * unplanned pool, and neither column shows that pool while road trip mode is on, so a
   * just-added stop disappears without a trace. Outside road trip mode nothing changes:
   * `undefined` keeps the old "let the user pick" behaviour.
   *
   * Memoised because both map renderers rebuild every POI marker whenever this callback's
   * identity changes.
   */
  const handlePoiClick = useCallback((poi: Parameters<typeof openAddPlaceFromPoi>[0]) => {
    if (!can('place_edit', trip)) return
    // A corridor hit knows how far along the drive it sits, so it can go straight into
    // the chain in driving order instead of being dragged there afterwards.
    //
    // Gated on the FEED, not on road trip mode: the phone never turns that mode on (it
    // is a data switch the mobile sheets cannot survive, see `roadtripFeedActive` in
    // useRoadtripFeed), so reading it here sent every hit found on the stage map into
    // the full place form instead, losing the stop kind, the stay, and the position
    // worked out just above.
    const hit = roadtripFeedActive && 'alongKm' in poi ? (poi as unknown as CorridorPoi) : null
    if (hit && roadtripDayId != null) {
      const displayed = roadtripRoutes.days.find(d => d.dayId === roadtripDayId)
      const insert = displayed && roadtripInsertion(displayed, roadtripInsertIndexFor(hit))
      if (!insert) return
      setStopDraft({
        poi: hit,
        arrivalTime: displayed ? stopArrival(displayed, roadtripInsertIndexFor(hit), hit.alongKm) : null,
        ...insert,
        dayNumber: roadtripDayNumber,
        // Only for a hit somebody could sleep at, and it is what gives the popup its
        // second mode. The check-out options are the days from this one on in travel
        // order; the default is the next one, which is what a night usually means.
        ...(isOvernightCategory(hit.category) ? { overnight: overnightOptions(insert.dayId) } : {}),
      })
      return
    }
    const selected = roadtripRoutes.days.find(d => d.dayId === roadtripDayId)
    const target = selected && roadtripInsertion(selected, selected.stops.length)
    openAddPlaceFromPoi(poi, roadtripFeedActive ? target?.dayId ?? roadtripDayId : undefined)
  }, [openAddPlaceFromPoi, roadtripFeedActive, roadtripDayId, roadtripDayNumber, roadtripInsertIndexFor, roadtripRoutes.days, overnightOptions, can, trip, setStopDraft])

  /**
   * Adding a stop the corridor search never found.
   *
   * The search reads OpenStreetMap, and a good share of the chargers actually standing
   * at a motorway junction are not in it. The way round it was to leave road trip mode,
   * add the place under Days, drag it onto the right day, come back and mark it a
   * charging stop.
   *
   * So this opens the form the rest of TREK adds places with, on nothing at all: no
   * place, no coordinates, no day. The traveller finds the charger in the form's own
   * typed-ahead search, which is the whole reason to use it, and where the stop belongs
   * is worked out at the save, from what the save carries.
   */
  const openManualRoadtripStop = useCallback((kind: RoadtripStopType | null = null) => {
    if (!can('place_edit', trip)) return
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setPrefillCoords(null)
    // Deliberately nowhere. A corridor hit knows its day and its position before the
    // form opens; this one cannot, because nothing has been chosen yet.
    setPlaceFormDayId(null)
    setPlaceFormPosition(null)
    // Set in the same batch as the flag below, so the kind is already there when the
    // form's opening effect reads the mode out of its closure.
    setServiceStopKind(kind)
    setServiceStopForm(true)
    setShowPlaceForm(true)
  }, [can, trip, setEditingAssignmentId, setEditingPlace, setPlaceFormDayId, setPlaceFormPosition, setPrefillCoords, setServiceStopForm, setServiceStopKind, setShowPlaceForm])

  /**
   * What the place form needs to ask for a service stop, or null for every other use.
   *
   * The legs are flat across the whole drive rather than per card, because the charger
   * the search missed is as likely to be on tomorrow's stretch as on today's. The names
   * travel as plain strings so the form does its own labelling and this stays free of
   * translated text.
   */
  const serviceStopMode = useMemo<ServiceStopMode | null>(() => {
    if (!serviceStopForm) return null
    const panelDay = roadtripCorridor.day
    return {
      defaultKind: serviceStopKind,
      // A day that has not routed has no order to place anything in.
      days: roadtripRoutes.days
        .filter(day => day.geometry.length > 1)
        .map(day => {
          const spine: LatLng[] = day.geometry.map(([la, ln]) => ({ lat: la, lng: ln }))
          const stopsAlong = day.stops.map(stop => projectOntoRoute({ lat: stop.lat, lng: stop.lng }, spine)?.alongKm ?? 0)
          return {
            dayId: day.dayId,
            dayNumber: day.dayNumber,
            stops: day.stops.map(stop => stop.name),
            // Each leg's own road, cut out of the day's line where the two stops it runs
            // between fall on it. The form measures the place against each of these, so
            // the leg it offers first is visibly the nearest one rather than a guess the
            // reader has to take on trust.
            legLines: day.stops.slice(0, -1).map((_, i) =>
              sliceAtMeters(spine, (stopsAlong[i] ?? 0) * 1000, (stopsAlong[i + 1] ?? 0) * 1000)),
          }
        }),
      // The end of the day the panel is looking at, which is what the dialog this
      // replaced did. Offered whatever else has routed, not only when nothing has: with
      // its neighbours drawn and its own line still coming, a day left out of this list
      // is a day a stop meant for it cannot be put on at all.
      appendDay: panelDay
        ? { dayId: panelDay.dayId, dayNumber: panelDay.dayNumber, position: panelDay.stops.length }
        : null,
      targetFor: manualStopTargetFor,
    }
  }, [serviceStopForm, serviceStopKind, roadtripRoutes.days, roadtripCorridor.day, manualStopTargetFor])

  /** Hands the draft over to the full form, keeping the day and the position it worked out. */
  const stopDraftToForm = useCallback((stop?: { stopType: RoadtripStopType | null; dwellMinutes: number }) => {
    if (!stopDraft) return
    const { poi, dayId, position } = stopDraft
    setStopDraft(null)
    if (stopDraft.editing) {
      const place = places.find(place => place.id === stopDraft.editing?.placeId)
      if (place) {
        setEditingPlace(place)
        setEditingAssignmentId(resolvePoolAssignmentId(assignments, place.id))
        setShowPlaceForm(true)
      }
      return
    }
    // Carries the kind and the dwell the popup had already worked out. Leaving them
    // behind is what turned a fuel stop into a numbered destination on the way to the
    // full form, silently and in every total.
    openAddPlaceFromPoi(poi, dayId, position, stop ?? null)
  }, [stopDraft, openAddPlaceFromPoi, places, assignments, setEditingAssignmentId, setEditingPlace, setShowPlaceForm, setStopDraft])

  /**
   * A place on this trip that came from the same OSM object.
   *
   * The full place form warns about duplicates; without the same check here the popup
   * would be the quickest way to add one petrol station twice.
   */
  const stopDraftDuplicate = useMemo(() => {
    if (stopDraft?.editing || !stopDraft?.poi.osm_id) return null
    return places.find(p => p.osm_id === stopDraft.poi.osm_id)?.name ?? null
  }, [stopDraft, places])

  // Open the place editor from any entry point (Places pool, inspector, map).
  // Times live per day-assignment, so when no day is in context resolve the
  // place's lone assignment to hydrate & persist its times; with 0 or 2+
  // assignments the time is ambiguous and the modal hides the fields (#1247).
  const openPlaceEditor = useCallback((place: Place, preferredAssignmentId: number | null = null) => {
    if (isMobile && isTourPlace(place.id)) {
      handlePlaceClick(place.id, preferredAssignmentId)
      return
    }
    if (!can('place_edit', trip)) return
    if (roadtripActive && (isServiceStopType(place.stop_type) || tripAccommodations.some(stay => stay.place_id === place.id)) && typeof place.lat === 'number' && typeof place.lng === 'number') {
      const visitId = preferredAssignmentId ?? resolvePoolAssignmentId(assignments, place.id)
      const entry = Object.entries(assignments).find(([, visits]) => visits.some(visit => visit.id === visitId))
      if (entry) {
        const dayId = Number(entry[0])
        const visit = entry[1].find(visit => visit.id === visitId)!
        const stay = tripAccommodations.find(stay => stay.place_id === place.id && stay.start_day_id === dayId)
        const category = place.stop_type ?? (stay ? 'hotel' : '')
        const routedDay = roadtripRoutes.days.find(day => day.stops.some(stop => stop.assignmentId === visitId))
        const arrivalTime = routedDay?.schedule.entries[routedDay.stops.findIndex(stop => stop.assignmentId === visitId)]?.arrival ?? null
        setStopDraft({
          poi: { osm_id: place.osm_id ?? '', name: place.name, lat: place.lat, lng: place.lng, category, poi_type: category, address: place.address ?? null, website: place.website ?? null, phone: place.phone ?? null, opening_hours: null, cuisine: null, source: 'trek', offRouteKm: 0, alongKm: 0 },
          arrivalTime, dayId, dayNumber: days.find(day => day.id === dayId)?.day_number ?? 0, position: visit.order_index ?? 0,
          editing: { placeId: place.id, stopType: place.stop_type ?? (stay ? 'hotel' : null), dwellMinutes: place.duration_minutes ?? 30, accommodationId: stay?.id, checkIn: stay?.check_in ?? '', checkOut: stay?.check_out ?? '' },
          ...(isOvernightCategory(category) ? { overnight: { ...overnightOptions(dayId), ...(stay ? { defaultEndDayId: stay.end_day_id } : {}) } } : {}),
        })
        return
      }
    }
    setEditingPlace(place)
    setEditingAssignmentId(preferredAssignmentId ?? resolvePoolAssignmentId(assignments, place.id))
    setPlaceFormDayId(null)
    setServiceStopForm(false)
    setShowPlaceForm(true)
  }, [isMobile, isTourPlace, handlePlaceClick, can, trip, assignments, roadtripActive, tripAccommodations, days, overnightOptions, roadtripRoutes.days, setEditingAssignmentId, setEditingPlace, setPlaceFormDayId, setServiceStopForm, setShowPlaceForm, setStopDraft])

  return {
    handleMapContextMenu, openAddPlaceFromPoi, handlePoiClick, openManualRoadtripStop, serviceStopMode,
    stopDraftToForm, stopDraftDuplicate, openPlaceEditor,
  }
}

export type PlaceFormOpeners = ReturnType<typeof usePlaceFormOpeners>
