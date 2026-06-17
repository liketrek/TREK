import type { BudgetItem } from '../../types'

/**
 * A request from a booking modal to open the Costs expense editor — either to
 * edit the already-linked expense, or to create a new one prefilled from the
 * booking (the modal saves the booking first so `reservationId` is known).
 */
export interface BookingExpenseRequest {
  editItem?: BudgetItem
  prefill?: { reservationId?: number; name?: string; category?: string; amount?: number }
}
