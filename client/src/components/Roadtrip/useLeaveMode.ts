import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { getApiErrorMessage } from '../../types'
import { useToast } from '../shared/Toast'
import { readStay } from './stayReading'

/** The visit a stay dialog is open on, as far as a time set to leave it goes. */
export interface LeaveSubject {
  leaveAt?: string | null
  arrival?: string | null
  departure?: string | null
  /** How many minutes after the time the drive gets here, as the schedule found it. */
  missedBy?: number | null
  assignmentId?: number
  /** The day the visit is stored on, which is where the store files it. */
  dayId?: number
}

export interface LeaveMode {
  /** The time the stop is left at, or null when the dialog is about an ordinary stay. */
  until: string | null
  /** How long that makes the stay, when the drive says when the stop is reached. */
  minutes: number | null
  /** The drive gets here this many minutes after the time, and leaves on arrival. */
  missedBy: number | null
  /** The travel hours close the day before the time comes, see `StayReading`. */
  dayEndsFirst: boolean
  /**
   * Takes the end time off the visit. Absent for a traveller who may not make the writes
   * that takes, and for an End that cannot go without taking another visit's with it: a
   * button that changes nothing is worse than none.
   */
  remove?: () => Promise<void>
  removing: boolean
}

/**
 * The half of the stay dialog that is about a time set to leave a stop.
 *
 * Shared by the desktop dialog and the phone sheet, so the two cannot answer differently.
 * A stop the traveller leaves at a set time has no length to choose: it is stood at until
 * then. So the dialog says when the drive leaves and what stay that makes, and offers to
 * take the end time off the visit, after which the stay is a choice again.
 *
 * The End a visit is left at is its own, or else the one its place carries: the server
 * reads COALESCE(assignment_end_time, places.end_time), and so do mergeAssignmentPlace and
 * the road trip's stops. A migration copied the place's End onto every visit there was,
 * so on older trips both hold it, and clearing only the visit's column left the stop
 * leaving at the same time. Removing therefore clears both. The place's End is only taken
 * when no other visit of the place still leans on it; when one does, the removal is not
 * offered, because it could not take the End off this visit alone.
 *
 * The visit's own End is cleared through its time write, the one the place form saves
 * Start and End with. That write sets both, so the visit's Start goes along as it stands.
 */
export function useLeaveMode(subject: LeaveSubject | null): LeaveMode {
  const { t } = useTranslation()
  const toast = useToast()
  const can = useCanDo()
  const trip = useTripStore(s => s.trip)
  const [removed, setRemoved] = useState(false)
  const [removing, setRemoving] = useState(false)
  const assignmentId = subject?.assignmentId
  const dayId = subject?.dayId
  const leaveAt = subject?.leaveAt ?? null
  const ownEnd = useTripStore(s => s.assignments[String(dayId)]?.find(a => a.id === assignmentId)?.assignment_end_time ?? null)
  const placeId = useTripStore(s => s.assignments[String(dayId)]?.find(a => a.id === assignmentId)?.place_id ?? null)
  const placeEnd = useTripStore(s => (placeId === null ? null : s.places.find(p => p.id === placeId)?.end_time ?? null))
  const leanedOn = useTripStore(s => placeEnd !== null && Object.values(s.assignments).some(list =>
    list.some(a => a.place_id === placeId && a.id !== assignmentId && a.assignment_end_time == null)))

  // Opened on another visit, or on one whose end time changed: nothing was removed there.
  useEffect(() => { setRemoved(false) }, [assignmentId, leaveAt])

  const remove = useCallback(async () => {
    const store = useTripStore.getState()
    const visit = store.assignments[String(dayId)]?.find(a => a.id === assignmentId)
    // Gone between the render that offered this and the tap.
    if (!trip || !visit || dayId == null) return
    const place = store.places.find(p => p.id === visit.place_id)
    setRemoving(true)
    try {
      if (visit.assignment_end_time != null) {
        await store.setAssignmentTimes(trip.id, dayId, visit.id, { place_time: visit.assignment_time ?? null, end_time: null })
      }
      if (place?.end_time != null) await store.updatePlace(trip.id, place.id, { end_time: null })
      setRemoved(true)
      // As the place form does after the same write: a Start can reorder the day on the
      // server, and only the day read back shows it.
      await store.refreshDays(trip.id)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('common.unknownError')))
    } finally {
      setRemoving(false)
    }
  }, [trip, dayId, assignmentId, toast, t])

  const reading = readStay({ dwellMinutes: null, leaveAt }, subject)
  const allowed = !!trip && assignmentId != null && assignmentId > 0 && (ownEnd !== null || placeEnd !== null)
    && (ownEnd === null || can('day_edit', trip))
    && (placeEnd === null || (can('place_edit', trip) && !leanedOn))
  return {
    until: removed ? null : reading.until,
    minutes: reading.minutes,
    missedBy: subject?.missedBy ?? null,
    dayEndsFirst: reading.dayEndsFirst === true,
    remove: allowed ? remove : undefined,
    removing,
  }
}
