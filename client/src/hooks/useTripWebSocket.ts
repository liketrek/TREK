import { useEffect } from 'react'
import { useTripStore } from '../store/tripStore'
import { joinTrip, leaveTrip, addListener, removeListener } from '../api/websocket'
import type { WebSocketEvent } from '../types'
import type { ToursInvalidation } from './useTourPlaceIds'

export function useTripWebSocket(tripId: number | string | undefined, onToursChanged?: (change?: ToursInvalidation) => void) {
  const tripStore = useTripStore()

  useEffect(() => {
    if (!tripId) return
    const handler = useTripStore.getState().handleRemoteEvent
    joinTrip(tripId)
    addListener(handler)
    const collabFileSync = (event: WebSocketEvent) => {
      if (event?.type === 'collab:note:deleted' || event?.type === 'collab:note:updated') {
        tripStore.loadFiles?.(tripId)
      }
    }
    addListener(collabFileSync)
    const toursInvalidation = (event: WebSocketEvent) => {
      if (String(event?.tripId ?? '') !== String(tripId)) return
      if (event?.type === 'tours:changed') {
        const placeIds = Array.isArray(event.placeIds)
          ? event.placeIds.map(Number).filter(Number.isSafeInteger)
          : []
        onToursChanged?.(placeIds.length ? { placeIds } : undefined)
      } else if (event?.type === 'place:deleted') {
        const placeId = Number(event.placeId)
        onToursChanged?.(Number.isSafeInteger(placeId) ? { removedPlaceIds: [placeId] } : undefined)
      } else if (event?.type === 'assignment:created' || event?.type === 'assignment:deleted'
        || event?.type === 'day:deleted') {
        onToursChanged?.()
      }
    }
    addListener(toursInvalidation)
    const localFileSync = () => tripStore.loadFiles?.(tripId)
    window.addEventListener('collab-files-changed', localFileSync)
    return () => {
      leaveTrip(tripId)
      removeListener(handler)
      removeListener(collabFileSync)
      removeListener(toursInvalidation)
      window.removeEventListener('collab-files-changed', localFileSync)
    }
  }, [tripId, onToursChanged])
}
