import { reservationsApi } from '../api/client'
import { offlineDb, upsertReservations } from '../db/offlineDb'
import { onlineThenCache } from './withOfflineFallback'
import type { Reservation } from '../types'

export const reservationRepo = {
  async list(tripId: number | string): Promise<{ reservations: Reservation[] }> {
    return onlineThenCache(
      async () => {
        const result = await reservationsApi.list(tripId)
        upsertReservations(result.reservations)
        return result
      },
      async () => ({
        reservations: await offlineDb.reservations
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },
}
