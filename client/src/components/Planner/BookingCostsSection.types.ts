import type { BudgetItem } from '../../types'

/**
 * A request from a booking modal — or from the place form (#1298) — to open the
 * Costs expense editor: either to edit the already-linked expense, or to create
 * a new one prefilled from the record. The modal saves itself first, so the
 * `reservationId` / `placeId` it names already exists.
 */
export interface BookingExpenseRequest {
  editItem?: BudgetItem
  prefill?: { reservationId?: number; placeId?: number; name?: string; category?: string; amount?: number }
}
