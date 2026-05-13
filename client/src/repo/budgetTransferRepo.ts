import { budgetApi } from '../api/client'
import { offlineDb, replaceBudgetTransfersForTrip } from '../db/offlineDb'
import type { BudgetTransfer } from '../types'

export const budgetTransferRepo = {
  async list(tripId: number | string): Promise<{ transfers: BudgetTransfer[] }> {
    const id = Number(tripId)
    const fromCache = async () => {
      const cached = await offlineDb.budgetTransfers.where('trip_id').equals(id).toArray()
      cached.sort((a, b) =>
        b.transfer_date.localeCompare(a.transfer_date) ||
        String(b.created_at || '').localeCompare(String(a.created_at || '')) ||
        b.id - a.id
      )
      return { transfers: cached }
    }

    if (!navigator.onLine) {
      return fromCache()
    }

    try {
      const result = await budgetApi.transfers(tripId) as { transfers: BudgetTransfer[] }
      await replaceBudgetTransfersForTrip(id, result.transfers)
      return result
    } catch (err) {
      return fromCache()
    }
  },
}
