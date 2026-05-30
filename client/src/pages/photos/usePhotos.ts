import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTripStore } from '../../store/tripStore'
import { tripsApi, daysApi, placesApi } from '../../api/client'
import type { Trip, Day, Place, Photo } from '../../types'

/**
 * Photos page data hook — owns the trip/days/places load, the photo sync from
 * the trip store and the upload/delete/update handlers. PhotosPage is a pure
 * wiring container. Behaviour is identical to the previous in-component logic.
 */
export function usePhotos() {
  const { id: tripId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tripStore = useTripStore()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    loadData()
  }, [tripId])

  const loadData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const [tripData, daysData, placesData] = await Promise.all([
        tripsApi.get(tripId),
        daysApi.list(tripId),
        placesApi.list(tripId),
      ])
      setTrip(tripData.trip)
      setDays(daysData.days)
      setPlaces(placesData.places)

      // Load photos
      await tripStore.loadPhotos(tripId)
    } catch (err: unknown) {
      navigate('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  // Sync photos from store
  useEffect(() => {
    setPhotos(tripStore.photos)
  }, [tripStore.photos])

  const handleUpload = async (formData: FormData): Promise<void> => {
    await tripStore.addPhoto(tripId, formData)
  }

  const handleDelete = async (photoId: number): Promise<void> => {
    await tripStore.deletePhoto(tripId, photoId)
  }

  const handleUpdate = async (photoId: number, data: Record<string, string | number | null>): Promise<void> => {
    await tripStore.updatePhoto(tripId, photoId, data)
  }

  return { tripId, navigate, trip, days, places, photos, isLoading, handleUpload, handleDelete, handleUpdate }
}
