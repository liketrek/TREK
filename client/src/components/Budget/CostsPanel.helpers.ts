/**
 * Pure payer math for the Costs expense modal.
 *
 * An expense's payers must always sum to its total. The server re-derives
 * budget_items.total_price from the payer sum (budgetService.createItem), so an
 * unbalanced payer list would silently rewrite the expense total — and in custom
 * split mode the member debits, balanced against the old total, would stop
 * cancelling the payer credits. rebalancePayers keeps the payers the user hasn't
 * touched absorbing the remainder as they type; payersBalanced gates the save.
 *
 * Amounts are the raw input strings, parsed on use (same as customAmounts).
 */

/** Spread `amount` across `n` payers in whole cents so the parts sum back exactly. */
export function splitCents(amount: number, n: number): number[] {
  if (n <= 0) return []
  const cents = Math.max(0, Math.round(amount * 100))
  const base = Math.floor(cents / n)
  const rem = cents - base * n
  return Array.from({ length: n }, (_, i) => (base + (i < rem ? 1 : 0)) / 100)
}

/** Sum the amounts of the selected payers. */
export function payerSum(amounts: Record<number, string>, ids: Set<number>): number {
  return [...ids].reduce((a, id) => a + (parseFloat(amounts[id]) || 0), 0)
}

/** True when the payer amounts add up to the expense total, to the cent. */
export function payersBalanced(amounts: Record<number, string>, ids: Set<number>, total: number): boolean {
  return Math.round(payerSum(amounts, ids) * 100) === Math.round(total * 100)
}

/**
 * Recompute the payers the user has not explicitly edited (everyone not in
 * `pinned`) so the whole list sums to `total`. Pinned amounts are left as typed.
 */
export function rebalancePayers(
  amounts: Record<number, string>,
  pinned: Set<number>,
  ids: Set<number>,
  total: number,
): Record<number, string> {
  const all = [...ids]
  const free = all.filter(id => !pinned.has(id))
  if (free.length === 0) return amounts
  const pinnedSum = all
    .filter(id => pinned.has(id))
    .reduce((a, id) => a + (parseFloat(amounts[id]) || 0), 0)
  const shares = splitCents(total - pinnedSum, free.length)
  const next = { ...amounts }
  free.forEach((id, i) => { next[id] = shares[i] ? shares[i].toFixed(2) : '' })
  return next
}
