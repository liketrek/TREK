import { useMemo, useState } from 'react';

import type { Day, Place } from '../../types';
import { toggledTraveler } from './bookingFormModel';
import {
  type CheckInEndField,
  isEndBeforeStart,
  type ReservationFields,
  reservationSaveData,
  type ReservationSaveOptions,
  startParts,
  tripDateBounds,
  withHotelEnd,
  withHotelPlace,
  withHotelStart,
  withLinkedPlace,
  withLinkedStopDay,
  withStartDate,
  withStartTime,
} from './reservationFormModel';

/**
 * The booking form behind the desktop ReservationModal and the phone's booking
 * sheet: the fields, the travellers and the files picked before saving, the date
 * rules and the place and hotel picks. Each shell decides when to fill it and what
 * to do around a save.
 */
export function useReservationForm<F extends ReservationFields & CheckInEndField>(
  emptyForm: F,
  days: Day[],
  places: Pick<Place, 'id' | 'name' | 'address'>[]
) {
  const [form, setForm] = useState<F>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // Travelers assigned to this booking (#1517), seeded on open and persisted after the save resolves.
  const [travelerIds, setTravelerIds] = useState<Set<number>>(new Set());

  const set = (field: keyof F, value: string | number) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleTraveler = (id: number) => setTravelerIds((prev) => toggledTraveler(prev, id));

  // Restrict non-hotel booking dates to the trip's span (#1662). Hotels already
  // constrain to trip days via their day dropdowns.
  const dateBounds = useMemo(() => tripDateBounds(days || []), [days]);
  const start = startParts(form.reservation_time);

  return {
    form,
    setForm,
    set,
    isSaving,
    setIsSaving,
    pendingFiles,
    setPendingFiles,
    travelerIds,
    setTravelerIds,
    toggleTraveler,
    isEndBeforeStart: isEndBeforeStart(form),
    dateBounds,
    startDate: start.date,
    startTime: start.time,
    setStartDate: (date: string | null | undefined) =>
      set('reservation_time', withStartDate(form.reservation_time, date)),
    setStartTime: (time: string, fallbackDate: string) =>
      set('reservation_time', withStartTime(form.reservation_time, time, fallbackDate)),
    /** An undated booking takes the day of the stop it was just linked to. */
    takeStopDay: (dayDate: string) => setForm((prev) => withLinkedStopDay(prev, dayDate)),
    pickPlace: (value: string | number) => setForm((prev) => withLinkedPlace(prev, value, places)),
    pickHotelPlace: (value: string | number) => setForm((prev) => withHotelPlace(prev, value, places)),
    pickHotelStart: (value: string | number) => setForm((prev) => withHotelStart(prev, value, days)),
    pickHotelEnd: (value: string | number) => setForm((prev) => withHotelEnd(prev, value, days)),
    saveData: (opts: ReservationSaveOptions) => reservationSaveData(form, opts),
  };
}
