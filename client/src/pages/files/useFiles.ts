import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTripStore } from '../../store/tripStore'
import { tripRepo } from '../../repo/tripRepo'
import { placeRepo } from '../../repo/placeRepo'
import type { Trip, Place, TripFile } from '../../types'

/**
 * Files page data hook — owns the trip/places load, the file sync from the trip
 * store and the upload/delete handlers. FilesPage is a pure wiring container.
 * Behaviour is identical to the previous in-component logic.
 */
export function useFiles() {
  const { id } = useParams<{ id: string }>()
  const tripId = Number(id)
  const navigate = useNavigate()
  const tripStore = useTripStore()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [files, setFiles] = useState<TripFile[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    loadData()
  }, [tripId])

  const loadData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const [tripData, placesData] = await Promise.all([
        tripRepo.get(tripId),
        placeRepo.list(tripId),
      ])
      setTrip(tripData.trip)
      setPlaces(placesData.places)
      await tripStore.loadFiles(tripId)
    } catch (err: unknown) {
      navigate('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setFiles(tripStore.files)
  }, [tripStore.files])

  const handleUpload = async (formData: FormData): Promise<void> => {
    await tripStore.addFile(tripId, formData)
  }

  const handleDelete = async (fileId: number): Promise<void> => {
    await tripStore.deleteFile(tripId, fileId)
  }

  return { tripId, navigate, trip, places, files, isLoading, handleUpload, handleDelete }
}
