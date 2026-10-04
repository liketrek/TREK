import { useState, useEffect } from 'react'
import type { WeatherResult } from '@trek/shared'
import { weatherApi, accommodationsApi } from '../../api/client'
import { isDayInAccommodationRange } from '../../utils/dayOrder'
import { applyStayStops } from '../../store/stayStops'
import type { Accommodation, Day } from '../../types'

export interface HotelForm {
  check_in: string
  check_in_end: string
  check_out: string
  confirmation: string
  place_id: number | null
}

export interface HotelDayRange {
  start: number | undefined
  end: number | undefined
}

/** false while closed, true for a new stay, 'edit' for the one in `accommodation`. */
export type HotelPickerMode = boolean | 'edit'

const EMPTY_HOTEL_FORM: HotelForm = { check_in: '', check_in_end: '', check_out: '', confirmation: '', place_id: null }

/** Day-detail data + accommodation logic: weather load, accommodations list,
 *  hotel picker form state and create/update/delete handlers.
 *
 *  The write handlers let a failed request through to the caller, which is the
 *  one that can tell the user; the picker stays open with what was entered. */
export function useDayDetail(day: Day | null, days: Day[], tripId: number, lat: number | null, lng: number | null, language: string, onAccommodationChange?: () => void) {
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [dayAccommodations, setDayAccommodations] = useState<Accommodation[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [showHotelPicker, setShowHotelPicker] = useState<HotelPickerMode>(false)
  // A stay virtually never checks out the day it checks in — default the range
  // to check-out on the next day, unless the trip ends here.
  const defaultHotelDayRange = (d: Day | null): HotelDayRange => {
    const idx = (days || []).findIndex(x => x.id === d?.id)
    return { start: d?.id, end: (idx >= 0 && days[idx + 1]?.id) || d?.id }
  }
  const [hotelDayRange, setHotelDayRange] = useState<HotelDayRange>(() => defaultHotelDayRange(day))
  const [hotelCategoryFilter, setHotelCategoryFilter] = useState<number | ''>('')
  const [hotelForm, setHotelForm] = useState<HotelForm>(EMPTY_HOTEL_FORM)

  const isForDay = (a: Accommodation) => day ? isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days) : false

  useEffect(() => {
    if (!day?.date || !lat || !lng) { setWeather(null); return }
    setLoading(true)
    weatherApi.getDetailed(lat, lng, day.date, language)
      .then(data => setWeather(data.error ? null : data))
      .catch(() => setWeather(null))
      .finally(() => setLoading(false))
  }, [day?.date, lat, lng, language])

  useEffect(() => {
    if (!tripId) return
    accommodationsApi.list(tripId)
      .then(data => {
        const all: Accommodation[] = data.accommodations || []
        setAccommodations(all)
        const allForDay = all.filter(isForDay)
        setDayAccommodations(allForDay)
        setAccommodation(allForDay[0] || null)
      })
      .catch(() => {})
  }, [tripId, day?.id])

  useEffect(() => { if (day) setHotelDayRange(defaultHotelDayRange(day)) }, [day?.id])

  const handleSelectPlace = (placeId: number) => {
    setHotelForm(f => ({ ...f, place_id: placeId }))
  }

  /** Creates the stay the picker describes. Throws when the server refuses it. */
  const handleSaveAccommodation = async () => {
    if (!hotelForm.place_id || hotelDayRange.start == null || hotelDayRange.end == null) return
    const data = await accommodationsApi.create(tripId, {
      place_id: hotelForm.place_id,
      start_day_id: hotelDayRange.start,
      end_day_id: hotelDayRange.end,
      check_in: hotelForm.check_in || null,
      check_in_end: hotelForm.check_in_end || null,
      check_out: hotelForm.check_out || null,
      confirmation: hotelForm.confirmation || null,
    })
    applyStayStops(data)
    const newAcc: Accommodation = data.accommodation
    const updated = [...accommodations, newAcc]
    setAccommodations(updated)
    setAccommodation(newAcc)
    setDayAccommodations(updated.filter(isForDay))
    setShowHotelPicker(false)
    setHotelForm(EMPTY_HOTEL_FORM)
    onAccommodationChange?.()
  }

  /** Saves the picker over the stay in `accommodation`, then reloads the list. Throws when the server refuses it. */
  const handleUpdateAccommodation = async () => {
    if (!accommodation) return
    applyStayStops(await accommodationsApi.update(tripId, accommodation.id, {
      place_id: hotelForm.place_id,
      start_day_id: hotelDayRange.start,
      end_day_id: hotelDayRange.end,
      check_in: hotelForm.check_in || null,
      check_in_end: hotelForm.check_in_end || null,
      check_out: hotelForm.check_out || null,
      confirmation: hotelForm.confirmation || null,
    }))
    setShowHotelPicker(false)
    setHotelForm(EMPTY_HOTEL_FORM)
    const d = await accommodationsApi.list(tripId)
    const all: Accommodation[] = d.accommodations || []
    setAccommodations(all)
    const forDay = all.filter(isForDay)
    setDayAccommodations(forDay)
    setAccommodation(forDay[0] || null)
    onAccommodationChange?.()
  }

  const updateAccommodationField = async (field: string, value: string | null) => {
    if (!accommodation) return
    try {
      const data = await accommodationsApi.update(tripId, accommodation.id, { [field]: value || null })
      applyStayStops(data)
      setAccommodation(data.accommodation)
      onAccommodationChange?.()
    } catch {}
  }

  /**
   * Deletes the given stay. It is handed in rather than read from
   * `accommodation`: that one is the stay last opened, and with two hotels on a
   * day the X of the second one used to delete the first. Throws when the server
   * refuses it.
   */
  const handleRemoveAccommodation = async (target: Accommodation | null = accommodation) => {
    if (!target) return
    applyStayStops(await accommodationsApi.delete(tripId, target.id))
    const updated = accommodations.filter(a => a.id !== target.id)
    setAccommodations(updated)
    setDayAccommodations(updated.filter(isForDay))
    setAccommodation(prev => (prev && prev.id !== target.id ? prev : null))
    onAccommodationChange?.()
  }

  return {
    weather, loading, accommodation, setAccommodation, dayAccommodations, setDayAccommodations,
    accommodations, setAccommodations, showHotelPicker, setShowHotelPicker,
    hotelDayRange, setHotelDayRange, hotelCategoryFilter, setHotelCategoryFilter,
    hotelForm, setHotelForm, handleSelectPlace, handleSaveAccommodation, handleUpdateAccommodation,
    updateAccommodationField, handleRemoveAccommodation,
  }
}
