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

/**
 * Split `total` equally across `members`, in whole cents.
 *
 * The remainder cent rotates with the item id rather than always landing on the
 * first member, so across several expenses the rounding evens out instead of
 * always favouring the same person.
 */
export function splitEqualShares(total: number, members: { user_id: number }[], itemId: number): Record<number, number> {
  const n = members.length
  if (n === 0) return {}

  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / n)
  const remainder = totalCents % n

  const shares: Record<number, number> = {}
  const sortedMembers = [...members].sort((a, b) => a.user_id - b.user_id)
  const startIndex = itemId % n

  for (let i = 0; i < n; i++) {
    const member = sortedMembers[i]
    const hasExtraCent = ((i - startIndex + n) % n) < remainder
    shares[member.user_id] = (baseCents + (hasExtraCent ? 1 : 0)) / 100
  }

  return shares
}

/** One line of a receipt: what it cost and who is in on it. */
export interface TicketItem {
  id: string
  name: string
  price: string
  participants: Set<number>
}

/** Per-person totals for a receipt split line by line, plus the receipt total. */
export function calculateTicketShares(items: TicketItem[]): { shares: Record<number, number>; total: number } {
  const shares: Record<number, number> = {}
  let totalCents = 0

  for (const item of items) {
    const priceNum = parseFloat(item.price) || 0
    const priceCents = Math.round(priceNum * 100)
    totalCents += priceCents

    const partIds = [...item.participants]
    const n = partIds.length
    if (n === 0) continue

    const baseCents = Math.floor(priceCents / n)
    const remainder = priceCents % n

    const sortedPartIds = [...partIds].sort((a, b) => a - b)

    for (let i = 0; i < n; i++) {
      const id = sortedPartIds[i]
      const hasExtraCent = i < remainder
      const shareCents = baseCents + (hasExtraCent ? 1 : 0)
      shares[id] = (shares[id] || 0) + shareCents
    }
  }

  const finalShares: Record<number, number> = {}
  for (const id of Object.keys(shares)) {
    finalShares[Number(id)] = shares[Number(id)] / 100
  }

  return { shares: finalShares, total: totalCents / 100 }
}
