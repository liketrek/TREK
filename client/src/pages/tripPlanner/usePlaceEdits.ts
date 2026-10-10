import { useCallback, useMemo, useState } from 'react'
import { roadtripInsertion } from '../../components/Roadtrip/dayWindow'
import { reanchorAfterInsert } from '../../components/Roadtrip/roadtripModel'
import type { usePlaceSelection } from '../../hooks/usePlaceSelection'
import type { useRouteCalculation } from '../../hooks/useRouteCalculation'
import type { useTourPlaceIds } from '../../hooks/useTourPlaceIds'
import { translateApiError } from '../../i18n'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import type { Accommodation, Place } from '../../types'
import type { PlannerBase, PlannerHistory } from './plannerTypes'
import type { PlannerDialogs } from './usePlannerDialogs'
import type { RoadtripFeed } from './useRoadtripFeed'

interface PlaceEditsOptions
  extends Pick<PlannerBase, 'tripId' | 'trip' | 'can' | 'tripActions' | 'toast' | 't'>,
  Pick<PlannerHistory, 'pushUndo' | 'forgetPlace'>,
  Pick<ReturnType<typeof usePlaceSelection>, 'selectedPlaceId' | 'setSelectedPlaceId'>,
  Pick<ReturnType<typeof useTourPlaceIds>, 'tourPlaceIds' | 'invalidateTourPlaceIds' | 'reloadTourPlaceIds'>,
  Pick<PlannerDialogs, 'editingPlace' | 'editingAssignmentId' | 'placeFormDayId' | 'placeFormPosition'>,
  Pick<RoadtripFeed, 'roadtripRoutes' | 'roadtripVias' | 'viaLiesBefore'> {
  /** The places the planner lists, without the stops the day lists leave out. */
  places: Place[]
  /** Every place of the trip, so a booked night is named whatever the lists leave out. */
  allPlaces: TripStoreState['places']
  tripAccommodations: Accommodation[]
  reservations: TripStoreState['reservations']
  toursEnabled: boolean
  selectedDayId: TripStoreState['selectedDayId']
  updateRouteForDay: ReturnType<typeof useRouteCalculation>['updateRouteForDay']
}

/**
 * Writes to the trip's places, each with its undo: saving the place form, including the
 * day it was added from and the vias that stop pushes along, deleting one place, a tour
 * or several places with the booked nights the question warns about, and moving
 * several places to another category.
 *
 * Nothing here runs an effect, so where useTripPlanner calls it changes nothing.
 */
export function usePlaceEdits(options: PlaceEditsOptions) {
  const {
    tripId, trip, can, tripActions, toast, t, editingPlace, editingAssignmentId, placeFormDayId, placeFormPosition,
    places, allPlaces, tripAccommodations, reservations, selectedDayId, selectedPlaceId, setSelectedPlaceId,
    toursEnabled, tourPlaceIds, invalidateTourPlaceIds, reloadTourPlaceIds, forgetPlace, pushUndo, updateRouteForDay,
    roadtripRoutes, roadtripVias, viaLiesBefore,
  } = options
  const [deletePlaceId, setDeletePlaceId] = useState<number | null>(null)
  const [deletePlaceIds, setDeletePlaceIds] = useState<number[] | null>(null)
  const isTourPlace = useCallback((placeId: number) => tourPlaceIds.has(placeId)
    || places.some(place => place.id === placeId && place.tour_place_id === placeId), [places, tourPlaceIds])
  const deletePlaceIsTour = deletePlaceId != null && isTourPlace(deletePlaceId)
  const deletePlacesIncludeTours = !!deletePlaceIds?.some(isTourPlace)
  /**
   * The sentence the delete question adds when a night is booked at one of the places.
   *
   * The server takes a booked night down with its place, and with the night the
   * booking made for it and the expense written against that booking. The question
   * itself only names the place, and those are the rows the traveller least expects
   * to lose, so the dialog says so before the yes. The expense list is loaded with
   * the costs tab, not here, so the sentence speaks of any expense rather than
   * counting them. A booking named after its hotel, which is how most are named,
   * is not quoted a second time. Null when nothing beyond the place is at stake.
   */
  const bookedNightsNote = useCallback((placeIds: number[]): string | null => {
    const stays = tripAccommodations.filter(stay => stay.place_id != null && placeIds.includes(stay.place_id))
    if (stays.length === 0) return null
    const names = [...new Set(stays.map(stay => allPlaces.find(p => p.id === stay.place_id)?.name ?? stay.place_name ?? ''))]
      .filter(Boolean)
    const bookings = stays
      .map(stay => reservations.find(r => r.accommodation_id != null && Number(r.accommodation_id) === stay.id)?.title
        ?? stay.reservation_title ?? null)
      .filter((title): title is string => !!title)
    const name = names.join(', ')
    if (bookings.length === 0) return t('trip.confirm.deletePlaceNight', { name })
    return bookings.every(title => names.includes(title))
      ? t('trip.confirm.deletePlaceBookedSame', { name })
      : t('trip.confirm.deletePlaceBooked', { name, booking: bookings.join(', ') })
  }, [tripAccommodations, allPlaces, reservations, t])
  const deletePlaceNote = useMemo(
    () => (deletePlaceId ? bookedNightsNote([deletePlaceId]) : null),
    [deletePlaceId, bookedNightsNote],
  )
  const deletePlacesNote = useMemo(
    () => (deletePlaceIds?.length ? bookedNightsNote(deletePlaceIds) : null),
    [deletePlaceIds, bookedNightsNote],
  )

  const handleSavePlace = useCallback(async (data) => {
    const pendingFiles = data._pendingFiles
    delete data._pendingFiles
    // Where a service stop added by hand belongs on the drive. The form worked it out
    // from the coordinates being saved, because until a place was chosen in it there
    // were none to project.
    const serviceStop = data._serviceStop
    delete data._serviceStop
    if (editingPlace) {
      // Always strip time fields from place update: time is per-assignment only.
      // Same for the day-specific note (#2163): it belongs to the assignment,
      // never to the pool place.
      const { place_time, end_time, assignment_notes, ...placeData } = data
      await tripActions.updatePlace(tripId, editingPlace.id, placeData)
      // If editing from assignment context, save time per-assignment
      if (editingAssignmentId) {
        // Through the store and the visit's repo, so a time still waiting in the
        // queue for this visit goes out first and a retry cannot land over this one.
        const assignments = useTripStore.getState().assignments
        const dayKey = Object.keys(assignments).find(key => assignments[key].some(a => a.id === editingAssignmentId))
        if (dayKey) {
          await tripActions.setAssignmentTimes(tripId, Number(dayKey), editingAssignmentId, {
            place_time: place_time || null, end_time: end_time || null,
          })
          // The form only includes assignment_notes when the user changed it, so
          // an untouched note never produces a PUT (#2163). '' clears like null.
          // Through the visit's repo as well, so the cached day keeps the new note.
          if (assignment_notes !== undefined) {
            await tripActions.setAssignmentNotes(tripId, Number(dayKey), editingAssignmentId, assignment_notes || null)
          }
        }
      }
      // Upload pending files with place_id
      if (pendingFiles?.length > 0) {
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('place_id', String(editingPlace.id))
          try { await tripActions.addFile(tripId, fd) } catch (err) { toast.error(translateApiError(t, err, 'files.uploadError')) }
        }
      }
      toast.success(t('trip.toast.placeUpdated'))
      return { id: editingPlace.id }
    } else {
      const place = await tripActions.addPlace(tripId, data)
      // A card of the rail can draw stops that are STORED on the day before it
      // (`nightSpill.ts`), so a leg named by the card and the position in it is
      // translated once here, the same way every other path into this write is.
      const card = serviceStop && roadtripRoutes.days.find(day => day.dayId === serviceStop.dayId)
      const insert = serviceStop
        ? (card && roadtripInsertion(card, serviceStop.position)) || { dayId: serviceStop.dayId, position: serviceStop.position }
        : null
      const dayId = insert ? insert.dayId : placeFormDayId
      const position = insert ? insert.position : placeFormPosition
      // Added from inside a day? Then it belongs to that day. Without this the
      // place drops into the unplanned pool and, on mobile, into a different
      // screen entirely, which reads as "it wasn't saved" (#1998).
      if (place?.id && dayId != null) {
        // Worked out BEFORE the stop lands, against the day as it stands and the road as
        // it is currently driven: once the list has shifted there is no record of which
        // leg each via was drawn for. A via is stored as (day, after_order_index) and
        // that index is a POSITION in the day's stop list, so a stop dropped into the
        // middle of a routed day pushes every via at or behind it onto the wrong leg and
        // the drawn road runs forward, doubles back and runs out again. Keyed on the
        // position rather than on the service-stop form: a corridor hit handed to the
        // full form carries its position too, and was the one way into the middle of a
        // day that left the vias where they were.
        const plan = position != null && typeof data.lat === 'number' && typeof data.lng === 'number'
          ? reanchorAfterInsert(
            roadtripVias.byDay[dayId] ?? [],
            position,
            viaLiesBefore(dayId, { lat: data.lat, lng: data.lng }),
          )
          : null
        try {
          // With a position the stop lands where it will be driven past, not at the end
          // of the day. The slice has taken one all along; nothing ever passed it.
          await tripActions.assignPlaceToDay(tripId, dayId, place.id, position)
          // Awaited before the day re-routes: the routing effect reads the anchors against
          // the new stop list, so a correction landing after it would draw the wrong road
          // first and the right one a moment later.
          if (plan) await roadtripVias.reanchor(dayId, plan)
          updateRouteForDay(dayId)
        } catch (err: unknown) {
          // The place itself exists; only the day link failed.
          toast.error(err instanceof Error ? err.message : t('common.unknownError'))
        }
      }
      if (pendingFiles?.length > 0 && place?.id) {
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('place_id', String(place.id))
          try { await tripActions.addFile(tripId, fd) } catch (err) { toast.error(translateApiError(t, err, 'files.uploadError')) }
        }
      }
      toast.success(t('trip.toast.placeAdded'))
      if (place?.id) {
        const capturedId = place.id
        pushUndo(t('undo.addPlace'), async () => {
          await tripActions.deletePlace(tripId, capturedId)
        })
      }
      // Handed back so the form can link an expense to a place that did not
      // exist a moment ago (#1298), the same way the booking modals work.
      return place?.id ? { id: place.id } : undefined
    }
  }, [editingPlace, editingAssignmentId, placeFormDayId, placeFormPosition, roadtripRoutes.days, tripId, toast, pushUndo, updateRouteForDay, roadtripVias, viaLiesBefore])

  const handleDeletePlace = useCallback(
    (placeId) => {
      if (!can('place_edit', trip)) return
      if (toursEnabled && isTourPlace(placeId)) return
      setDeletePlaceId(placeId)
    },
    [can, trip, toursEnabled, isTourPlace]
  )

  const handleDeleteTour = useCallback(
    (placeId: number) => {
      if (!can('place_edit', trip) || !toursEnabled || !isTourPlace(placeId)) return
      setDeletePlaceId(placeId)
    },
    [can, trip, toursEnabled, isTourPlace]
  )

  const confirmDeletePlace = useCallback(async () => {
    if (!deletePlaceId) return null
    const state = useTripStore.getState()
    const capturedPlace = state.places.find(p => p.id === deletePlaceId)
    const capturedAssignments = Object.entries(state.assignments).flatMap(([dayId, as]) =>
      as.filter(a => a.place?.id === deletePlaceId).map(a => ({ dayId: Number(dayId), orderIndex: a.order_index }))
    )
    try {
      const deletion = await tripActions.deletePlace(tripId, deletePlaceId)
      const deletedTour = Array.isArray(deletion?.tourPlaceIds)
        ? deletion.tourPlaceIds.includes(deletePlaceId)
        : isTourPlace(deletePlaceId)
      if (deletedTour) invalidateTourPlaceIds({ removedPlaceIds: [deletePlaceId] })
      else void reloadTourPlaceIds()
      if (selectedPlaceId === deletePlaceId) setSelectedPlaceId(null)
      updateRouteForDay(selectedDayId)
      toast.success(t('trip.toast.placeDeleted'))
      if (deletedTour) forgetPlace(deletePlaceId)
      else if (capturedPlace) {
        pushUndo(t('undo.deletePlace'), async () => {
          const newPlace = await tripActions.addPlace(tripId, {
            name: capturedPlace.name,
            description: capturedPlace.description,
            lat: capturedPlace.lat,
            lng: capturedPlace.lng,
            address: capturedPlace.address,
            category_id: capturedPlace.category_id,
            price: capturedPlace.price,
            // An undone track has to come back as a track, not a bare point.
            route_geometry: capturedPlace.route_geometry,
            route_color: capturedPlace.route_color,
          })
          const live = new Set(useTripStore.getState().days.map(d => d.id))
          for (const { dayId, orderIndex } of capturedAssignments) {
            if (live.has(dayId)) await tripActions.assignPlaceToDay(tripId, dayId, newPlace.id, orderIndex)
          }
        })
      }
      return deletedTour ? deletePlaceId : null
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      return null
    }
  }, [deletePlaceId, tripId, toast, selectedPlaceId, selectedDayId, updateRouteForDay, pushUndo, forgetPlace, invalidateTourPlaceIds, reloadTourPlaceIds, isTourPlace])

  const confirmDeletePlaces = useCallback(async (ids?: number[]) => {
    const targetIds = ids ?? deletePlaceIds
    if (!targetIds?.length) return
    const state = useTripStore.getState()
    const capturedPlaces = state.places.filter(p => targetIds.includes(p.id))
    const capturedAssignments = Object.entries(state.assignments).flatMap(([dayId, as]) =>
      as.filter(a => a.place?.id != null && targetIds.includes(a.place.id)).map(a => ({ dayId: Number(dayId), placeId: a.place!.id, orderIndex: a.order_index }))
    )
    try {
      const deletion = await tripActions.deletePlacesMany(tripId, targetIds)
      const deletedTourIds = Array.isArray(deletion?.tourPlaceIds)
        ? deletion.tourPlaceIds.filter(id => targetIds.includes(id))
        : targetIds.filter(isTourPlace)
      void reloadTourPlaceIds()
      if (selectedPlaceId != null && targetIds.includes(selectedPlaceId)) setSelectedPlaceId(null)
      if (!ids) setDeletePlaceIds(null)
      updateRouteForDay(selectedDayId)
      toast.success(t('trip.toast.placesDeleted', { count: capturedPlaces.length }))
      if (deletedTourIds.length > 0) deletedTourIds.forEach(forgetPlace)
      else if (capturedPlaces.length > 0) {
        pushUndo(t('undo.deletePlaces'), async () => {
          const live = new Set(useTripStore.getState().days.map(d => d.id))
          for (const place of capturedPlaces) {
            const newPlace = await tripActions.addPlace(tripId, {
              name: place.name, description: place.description,
              lat: place.lat, lng: place.lng, address: place.address,
              category_id: place.category_id, price: place.price,
              route_geometry: place.route_geometry, route_color: place.route_color,
            })
            for (const a of capturedAssignments.filter(x => x.placeId === place.id && live.has(x.dayId))) {
              await tripActions.assignPlaceToDay(tripId, a.dayId, newPlace.id, a.orderIndex)
            }
          }
        })
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [deletePlaceIds, tripId, toast, selectedPlaceId, selectedDayId, updateRouteForDay, pushUndo, forgetPlace, reloadTourPlaceIds, isTourPlace])

  const confirmChangeCategory = useCallback(async (ids: number[], categoryId: number | null) => {
    if (!ids.length) return
    const state = useTripStore.getState()
    // Capture each place's prior category so undo can restore them per group.
    const captured = state.places.filter(p => ids.includes(p.id)).map(p => ({ id: p.id, prev: p.category_id ?? null }))
    try {
      await tripActions.updatePlacesMany(tripId, ids, { category_id: categoryId })
      toast.success(t('places.categoryChanged', { count: ids.length }))
      if (captured.length > 0) {
        pushUndo(t('undo.changeCategory'), async () => {
          // Group the captured ids by their prior category so each set is restored
          // in one call ('null' key = previously uncategorized).
          const byPrev: Record<string, number[]> = {}
          for (const { id, prev } of captured) {
            const key = prev === null ? 'null' : String(prev)
            ;(byPrev[key] ??= []).push(id)
          }
          for (const [key, group] of Object.entries(byPrev)) {
            await tripActions.updatePlacesMany(tripId, group, { category_id: key === 'null' ? null : Number(key) })
          }
        })
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [tripId, toast, pushUndo])

  return {
    deletePlaceId, setDeletePlaceId, deletePlaceIds, setDeletePlaceIds, isTourPlace, deletePlaceIsTour,
    deletePlacesIncludeTours, deletePlaceNote, deletePlacesNote, handleSavePlace, handleDeletePlace,
    handleDeleteTour, confirmDeletePlace, confirmDeletePlaces, confirmChangeCategory,
  }
}

export type PlaceEdits = ReturnType<typeof usePlaceEdits>
