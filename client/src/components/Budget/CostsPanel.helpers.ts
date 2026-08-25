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
  return [...ids].reduce((a, id) => a + (Number.parseFloat(amounts[id]) || 0), 0)
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
    .reduce((a, id) => a + (Number.parseFloat(amounts[id]) || 0), 0)
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

/**
 * Read the itemized receipt off an expense (#1658).
 *
 * It lives in `ticket_json` since migration 186. Before that it was smuggled
 * through `note` behind a `TICKETJSON:` prefix, which is why an expense split by
 * receipt could never carry a written note. The old shape is still read here so
 * a response cached before the migration keeps rendering its split.
 */
export function readTicketItems(item: { ticket_json?: string | null; note?: string | null } | null | undefined): TicketItem[] {
  const raw = item?.ticket_json ?? (item?.note?.startsWith('TICKETJSON:') ? item.note.slice(11) : null)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return (parsed.items || []).map((line: { name?: string; price?: unknown; parts?: number[] }, i: number) => ({
      id: `${i}`,
      name: String(line.name ?? ''),
      price: String(line.price ?? ''),
      participants: new Set(line.parts || []),
    }))
  } catch {
    return []
  }
}

/** True when this expense is split line by line rather than equally or by amount. */
export function hasTicketSplit(item: { ticket_json?: string | null; note?: string | null } | null | undefined): boolean {
  return Boolean(item?.ticket_json || item?.note?.startsWith('TICKETJSON:'))
}

/** Serialize the receipt lines for storage in `ticket_json`. */
export function writeTicketItems(items: TicketItem[]): string {
  return JSON.stringify({ items: items.map(i => ({ name: i.name, price: i.price, parts: [...i.participants] })) })
}

/** Long enough for a receipt discrepancy or a reimbursement reminder, short
 *  enough that the row stays a row. */
export const NOTE_MAX = 500

/**
 * The note a user actually typed, which is never the receipt blob. Only matters
 * for data written before migration 186 moved the receipt out of the field.
 */
export function readUserNote(item: { note?: string | null } | null | undefined): string {
  const note = item?.note
  return note && !note.startsWith('TICKETJSON:') ? note : ''
}

/**
 * Per-person totals for a receipt split line by line, plus the receipt total.
 *
 * Every cent on the receipt lands on somebody: a line nobody was ticked for is
 * carried by everyone who appears on the receipt, so the shares add back up to
 * the total. They used to count toward the total only, which left the expense
 * with member debits that could never cancel the payer's credit — a permanent
 * difference the settle-up view showed as debt but had no flow to clear (#1382).
 * A receipt with no participants at all splits nothing; it is not saveable
 * anyway, since every line needs someone on it.
 */
export function calculateTicketShares(items: TicketItem[]): { shares: Record<number, number>; total: number } {
  const shares: Record<number, number> = {}
  let totalCents = 0

  const everyone = [...new Set(items.flatMap(i => [...i.participants]))].sort((a, b) => a - b)

  for (const item of items) {
    const priceNum = Number.parseFloat(item.price) || 0
    const priceCents = Math.round(priceNum * 100)
    totalCents += priceCents

    const sortedPartIds = item.participants.size > 0
      ? [...item.participants].sort((a, b) => a - b)
      : everyone
    const n = sortedPartIds.length
    if (n === 0) continue

    const baseCents = Math.floor(priceCents / n)
    const remainder = priceCents - baseCents * n

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
