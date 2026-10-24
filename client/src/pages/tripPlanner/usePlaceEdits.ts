import { useCallback, useMemo, useState } from 'react'
import { roadtripInsertion } from '../../components/Roadtrip/dayWindow'
import { reanchorAfterInsert } from '../../components/Roadtrip/roadtripModel'
import type { usePlaceSelection } from '../../hooks/usePlaceSelection'
import type { useRouteCalculation } from '../../hooks/useRouteCalculation'
import type { useTourPlaceIds } from '../../hooks/useTourPlaceIds'
import { translateApiError } from '../../i18n'
import { useAuthStore } from '../../store/authStore'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import { isEffectivelyOffline } from '../../sync/networkMode'
import type { Accommodation, Place } from '../../types'
import { savePendingImage, takePendingImage } from './placeImageSave'
import { capturePlaceVisits, deleteLosesDependents, restorePlace } from './placeUndo'
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
  /** Reads the stays again, which live in the planner rather than the store. */
  loadAccommodations: () => void
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
    places, allPlaces, tripAccommodations, loadAccommodations, reservations, selectedDayId, selectedPlaceId, setSelectedPlaceId,
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
    // A file cannot wait in the offline queue the way the place can, so the form
    // stays open with them instead of saving a place that loses them.
    if (pendingFiles?.length > 0 && isEffectivelyOffline()) throw new Error(t('files.placeFilesNeedConnection'))
    delete data._pendingFiles
    const pendingImage = takePendingImage(data, () => t('places.image.needsConnection'))
    const imageFailed = (err: unknown) => toast.error(translateApiError(t, err, 'places.imageUploadError'))
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
      await savePendingImage(tripActions, tripId, editingPlace.id, pendingImage, imageFailed)
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
      await savePendingImage(tripActions, tripId, place?.id, pendingImage, imageFailed)
      toast.success(t('trip.toast.placeAdded'))
      if (place?.id) {
        const capturedId = place.id
        pushUndo(t('undo.addPlace'), async () => {
          await tripActions.deletePlace(tripId, capturedId)
        }, undefined, [capturedId])
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

  /**
   * What the undo of deleting these places needs, taken before the delete while the
   * store still has them. Not restorable when the delete takes something along that
   * writing the places again would not bring back (see deleteLosesDependents).
   */
  const captureForUndo = useCallback((placeIds: number[]) => {
    const state = useTripStore.getState()
    const userId = useAuthStore.getState().user?.id
    const captured = state.places.filter(p => placeIds.includes(p.id))
    const lost = deleteLosesDependents(placeIds, {
      places: captured, tripAccommodations, reservations, budgetItems: state.budgetItems, files: state.files, userId,
    })
    return {
      places: captured,
      visits: lost ? [] : capturePlaceVisits(state.assignments, placeIds),
      restorable: !lost && captured.length > 0,
      hadStay: tripAccommodations.some(stay => stay.place_id != null && placeIds.includes(stay.place_id)),
      userId,
    }
  }, [tripAccommodations, reservations])

  /**
   * Steps taken back from the planner's history that still name a deleted place
   * could only fail now, so they go as soon as the place does. A booked night went
   * with it as well, so the stays are read again.
   */
  const afterDelete = useCallback((placeIds: number[], hadStay: boolean) => {
    for (const id of placeIds) forgetPlace(id)
    if (hadStay) loadAccommodations()
  }, [forgetPlace, loadAccommodations])

  const confirmDeletePlace = useCallback(async () => {
    if (!deletePlaceId) return null
    const undo = captureForUndo([deletePlaceId])
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
      afterDelete([deletePlaceId], undo.hadStay)
      if (!deletedTour && undo.restorable) {
        pushUndo(t('undo.deletePlace'), async () => {
          await restorePlace(tripId, tripActions, undo.places[0], undo.visits, undo.userId)
        })
      }
      return deletedTour ? deletePlaceId : null
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      return null
    }
  }, [deletePlaceId, tripId, toast, selectedPlaceId, selectedDayId, updateRouteForDay, pushUndo, captureForUndo, afterDelete, invalidateTourPlaceIds, reloadTourPlaceIds, isTourPlace])

  const confirmDeletePlaces = useCallback(async (ids?: number[]) => {
    const targetIds = ids ?? deletePlaceIds
    if (!targetIds?.length) return
    const undo = captureForUndo(targetIds)
    try {
      const deletion = await tripActions.deletePlacesMany(tripId, targetIds)
      const deletedTourIds = Array.isArray(deletion?.tourPlaceIds)
        ? deletion.tourPlaceIds.filter(id => targetIds.includes(id))
        : targetIds.filter(isTourPlace)
      void reloadTourPlaceIds()
      if (selectedPlaceId != null && targetIds.includes(selectedPlaceId)) setSelectedPlaceId(null)
      if (!ids) setDeletePlaceIds(null)
      updateRouteForDay(selectedDayId)
      toast.success(t('trip.toast.placesDeleted', { count: undo.places.length }))
      afterDelete(targetIds, undo.hadStay)
      if (deletedTourIds.length === 0 && undo.restorable) {
        pushUndo(t('undo.deletePlaces'), async () => {
          for (const place of undo.places) await restorePlace(tripId, tripActions, place, undo.visits, undo.userId)
        })
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [deletePlaceIds, tripId, toast, selectedPlaceId, selectedDayId, updateRouteForDay, pushUndo, captureForUndo, afterDelete, reloadTourPlaceIds, isTourPlace])

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
        }, undefined, captured.map(({ id }) => id))
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
