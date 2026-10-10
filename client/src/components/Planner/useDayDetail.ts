import { useState, useEffect, useRef } from 'react'
import type { WeatherResult } from '@trek/shared'
import { weatherApi, accommodationsApi } from '../../api/client'
import { isDayInAccommodationRange } from '../../utils/dayOrder'
import { applyStayStops } from '../../store/stayStops'
import { stayCheckoutDay, stayRequestBody } from './stayFormModel'
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

/**
 * Creates a stay, or updates the one with `accId`, and applies the stops the
 * server moved for it, for the desktop day panel and the phone accommodation
 * sheet alike. Throws when the server refuses the write.
 */
export async function writeStay(tripId: number, accId: number | null, body: Parameters<typeof accommodationsApi.create>[1]) {
  const data = accId != null ? await accommodationsApi.update(tripId, accId, body) : await accommodationsApi.create(tripId, body)
  applyStayStops(data)
  return data
}

/**
 * A day's detailed forecast (Open-Meteo through the weather service, climate
 * fallback), shared by the desktop day panel and the phone day sheet. `ready` says
 * whether there is a day and a place to ask about; while it is false the forecast
 * is cleared. An answer that arrives after the day or the place changed is dropped:
 * the panel stays mounted across a day switch, and the previous day's late
 * response would otherwise overwrite the new day's forecast.
 */
export function useDayForecast(ready: boolean, date: string | null | undefined, lat: number | null, lng: number | null, language: string) {
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!ready || !date || lat == null || lng == null) { setWeather(null); return }
    let cancelled = false
    setLoading(true)
    weatherApi.getDetailed(lat, lng, date, language)
      .then(data => { if (!cancelled) setWeather(data.error ? null : data) })
      .catch(() => { if (!cancelled) setWeather(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ready, date, lat, lng, language])
  return { weather, loading }
}

/**
 * Renaming a day in place (#1065), shared by the desktop day panel and the phone
 * day sheet: the field takes the focus when it opens, and committing closes it and
 * hands the trimmed title on.
 */
export function useDayRename(onCommit: (title: string) => void) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => { if (editingTitle) titleInputRef.current?.focus() }, [editingTitle])
  const startRename = (title: string) => {
    setTitleDraft(title)
    setEditingTitle(true)
  }
  const commitRename = () => {
    setEditingTitle(false)
    onCommit(titleDraft.trim())
  }
  return { editingTitle, setEditingTitle, titleDraft, setTitleDraft, titleInputRef, startRename, commitRename }
}

/** Day-detail data + accommodation logic: weather load, accommodations list,
 *  hotel picker form state and create/update/delete handlers.
 *
 *  The write handlers let a failed request through to the caller, which is the
 *  one that can tell the user; the picker stays open with what was entered. */
export function useDayDetail(day: Day | null, days: Day[], tripId: number, lat: number | null, lng: number | null, language: string, onAccommodationChange?: () => void) {
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [dayAccommodations, setDayAccommodations] = useState<Accommodation[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [showHotelPicker, setShowHotelPicker] = useState<HotelPickerMode>(false)
  // A stay virtually never checks out the day it checks in — default the range
  // to check-out on the next day, unless the trip ends here.
  const defaultHotelDayRange = (d: Day | null): HotelDayRange => {
    return { start: d?.id, end: stayCheckoutDay(days || [], d?.id) || d?.id }
  }
  const [hotelDayRange, setHotelDayRange] = useState<HotelDayRange>(() => defaultHotelDayRange(day))
  const [hotelCategoryFilter, setHotelCategoryFilter] = useState<number | ''>('')
  const [hotelForm, setHotelForm] = useState<HotelForm>(EMPTY_HOTEL_FORM)

  const isForDay = (a: Accommodation) => day ? isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days) : false

  // Both effects drop an answer that arrives after the day changed: the panel
  // stays mounted across a day switch, and the previous day's late response
  // would otherwise overwrite the new day's forecast and hotel.
  const { weather, loading } = useDayForecast(!!(day?.date && lat && lng), day?.date, lat, lng, language)

  useEffect(() => {
    if (!tripId) return
    let cancelled = false
    accommodationsApi.list(tripId)
      .then(data => {
        if (cancelled) return
        const all: Accommodation[] = data.accommodations || []
        setAccommodations(all)
        const allForDay = all.filter(isForDay)
        setDayAccommodations(allForDay)
        setAccommodation(allForDay[0] || null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [tripId, day?.id])

  useEffect(() => { if (day) setHotelDayRange(defaultHotelDayRange(day)) }, [day?.id])

  const handleSelectPlace = (placeId: number) => {
    setHotelForm(f => ({ ...f, place_id: placeId }))
  }

  /** Creates the stay the picker describes. Throws when the server refuses it. */
  const handleSaveAccommodation = async () => {
    if (!hotelForm.place_id || hotelDayRange.start == null || hotelDayRange.end == null) return
    const data = await writeStay(tripId, null, stayRequestBody(hotelForm, hotelDayRange))
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
    await writeStay(tripId, accommodation.id, stayRequestBody(hotelForm, hotelDayRange))
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
