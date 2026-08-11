import { useState, useEffect } from 'react'
import { weatherApi, accommodationsApi } from '../../api/client'
import { isDayInAccommodationRange } from '../../utils/dayOrder'

/** Day-detail data + accommodation logic: weather load, accommodations list,
 *  hotel picker form state and create/update/delete handlers. */
export function useDayDetail(day: any, days: any, tripId: any, lat: any, lng: any, language: any, onAccommodationChange: any) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [accommodation, setAccommodation] = useState(null)
  const [dayAccommodations, setDayAccommodations] = useState<any[]>([])
  const [accommodations, setAccommodations] = useState([])
  const [showHotelPicker, setShowHotelPicker] = useState(false)
  // A stay virtually never checks out the day it checks in — default the range
  // to check-out on the next day, unless the trip ends here.
  const defaultHotelDayRange = (d: any) => {
    const idx = (days || []).findIndex((x: any) => x.id === d?.id)
    return { start: d?.id, end: (idx >= 0 && days[idx + 1]?.id) || d?.id }
  }
  const [hotelDayRange, setHotelDayRange] = useState(() => defaultHotelDayRange(day))
  const [hotelCategoryFilter, setHotelCategoryFilter] = useState('')
  const [hotelForm, setHotelForm] = useState({ check_in: '', check_in_end: '', check_out: '', confirmation: '', place_id: null })

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
        setAccommodations(data.accommodations || [])
        const allForDay = (data.accommodations || []).filter(a =>
          day ? isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days) : false
        )
        setDayAccommodations(allForDay)
        setAccommodation(allForDay[0] || null)
      })
      .catch(() => {})
  }, [tripId, day?.id])

  useEffect(() => { if (day) setHotelDayRange(defaultHotelDayRange(day)) }, [day?.id])

  const handleSelectPlace = (placeId) => {
    setHotelForm(f => ({ ...f, place_id: placeId }))
  }

  const handleSaveAccommodation = async () => {
    if (!hotelForm.place_id) return
    try {
      const data = await accommodationsApi.create(tripId, {
        place_id: hotelForm.place_id,
        start_day_id: hotelDayRange.start,
        end_day_id: hotelDayRange.end,
        check_in: hotelForm.check_in || null,
        check_in_end: hotelForm.check_in_end || null,
        check_out: hotelForm.check_out || null,
        confirmation: hotelForm.confirmation || null,
      })
      const newAcc = data.accommodation
      const updated = [...accommodations, newAcc]
      setAccommodations(updated)
      setAccommodation(newAcc)
      setDayAccommodations(updated.filter(a =>
        day ? isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days) : false
      ))
      setShowHotelPicker(false)
      setHotelForm({ check_in: '', check_in_end: '', check_out: '', confirmation: '', place_id: null })
      onAccommodationChange?.()
    } catch {}
  }

  const updateAccommodationField = async (field, value) => {
    if (!accommodation) return
    try {
      const data = await accommodationsApi.update(tripId, accommodation.id, { [field]: value || null })
      setAccommodation(data.accommodation)
      onAccommodationChange?.()
    } catch {}
  }

  const handleRemoveAccommodation = async () => {
    if (!accommodation) return
    try {
      await accommodationsApi.delete(tripId, accommodation.id)
      const updated = accommodations.filter(a => a.id !== accommodation.id)
      setAccommodations(updated)
      setDayAccommodations(updated.filter(a =>
        day ? isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days) : false
      ))
      setAccommodation(null)
      onAccommodationChange?.()
    } catch {}
  }

  return {
    weather, loading, accommodation, setAccommodation, dayAccommodations, setDayAccommodations,
    accommodations, setAccommodations, showHotelPicker, setShowHotelPicker,
    hotelDayRange, setHotelDayRange, hotelCategoryFilter, setHotelCategoryFilter,
    hotelForm, setHotelForm, handleSelectPlace, handleSaveAccommodation,
    updateAccommodationField, handleRemoveAccommodation,
  }
}
