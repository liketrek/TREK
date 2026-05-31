import { reservationsApi } from '../../api/client'
import { reservationRepo } from '../../repo/reservationRepo'
import type { StoreApi } from 'zustand'
import type { TripStoreState } from '../tripStore'
import type { Reservation } from '../../types'
import { getApiErrorMessage } from '../../types'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

export interface ReservationsSlice {
  loadReservations: (tripId: number | string) => Promise<void>
  addReservation: (tripId: number | string, data: Partial<Reservation> & { title: string }) => Promise<Reservation>
  updateReservation: (tripId: number | string, id: number, data: Partial<Reservation>) => Promise<Reservation>
  toggleReservationStatus: (tripId: number | string, id: number) => Promise<void>
  deleteReservation: (tripId: number | string, id: number) => Promise<void>
}

export const createReservationsSlice = (set: SetState, get: GetState): ReservationsSlice => ({
  loadReservations: async (tripId) => {
    try {
      const data = await reservationRepo.list(tripId)
      set({ reservations: data.reservations })
    } catch (err: unknown) {
      console.error('Failed to load reservations:', err)
    }
  },

  addReservation: async (tripId, data) => {
    try {
      const result = await reservationsApi.create(tripId, data)
      set(state => ({ reservations: [result.reservation, ...state.reservations] }))
      return result.reservation
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error creating reservation'))
    }
  },

  updateReservation: async (tripId, id, data) => {
    try {
      const result = await reservationsApi.update(tripId, id, data)
      set(state => ({
        reservations: state.reservations.map(r => r.id === id ? result.reservation : r)
      }))
      return result.reservation
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error updating reservation'))
    }
  },

  toggleReservationStatus: async (tripId, id) => {
    const prev = get().reservations
    const current = prev.find(r => r.id === id)
    if (!current) return
    const newStatus: 'pending' | 'confirmed' = current.status === 'confirmed' ? 'pending' : 'confirmed'
    set(state => ({
      reservations: state.reservations.map(r => r.id === id ? { ...r, status: newStatus } : r)
    }))
    try {
      await reservationsApi.update(tripId, id, { status: newStatus })
    } catch (err: unknown) {
      // Roll back the optimistic toggle and surface the failure so the caller's
      // catch can notify the user — without it the status silently snaps back.
      set({ reservations: prev })
      throw new Error(getApiErrorMessage(err, 'Error updating reservation'))
    }
  },

  deleteReservation: async (tripId, id) => {
    try {
      await reservationsApi.delete(tripId, id)
      set(state => ({ reservations: state.reservations.filter(r => r.id !== id) }))
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Error deleting reservation'))
    }
  },
})
