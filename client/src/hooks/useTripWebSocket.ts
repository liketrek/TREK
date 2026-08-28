import { useEffect } from 'react'
import { useTripStore } from '../store/tripStore'
import { joinTrip, leaveTrip, addListener, removeListener } from '../api/websocket'
import type { WebSocketEvent } from '../types'

export function useTripWebSocket(tripId: number | string | undefined) {
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
    const forkSync = (event: WebSocketEvent) => {
      if (event?.type === 'budget:exchange-rates-updated' || event?.type === 'budget:exchange-rates-applied') {
        useTripStore.getState().loadBudgetItems(tripId)
        window.dispatchEvent(new CustomEvent('budget:exchange-rates-changed'))
      }
      if (event?.type === 'guest:identity-transferred') {
        useTripStore.getState().hydrateActiveTrip(tripId)
        window.dispatchEvent(new CustomEvent('guest:identity-transferred'))
      }
    }
    addListener(forkSync)
    const localFileSync = () => tripStore.loadFiles?.(tripId)
    window.addEventListener('collab-files-changed', localFileSync)
    return () => {
      leaveTrip(tripId)
      removeListener(handler)
      removeListener(collabFileSync)
      removeListener(forkSync)
      window.removeEventListener('collab-files-changed', localFileSync)
    }
  }, [tripId])
}
