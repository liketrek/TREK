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

import type { BudgetParticipantFinal } from '@trek/shared'
import { currencyDecimals } from '../../utils/formatters'

// The split and receipt fields guard their own precision on every keystroke, so the
// guard has to follow the currency: a three-decimal one (KWD, BHD, …) seeds three
// places, and the old fixed two rejected every keystroke after that, leaving the field
// unusable until a digit was deleted (#2175). Never stricter than two places, so no
// value a field accepts today can become uneditable.
export const amountPattern = (currency: string, signed: boolean) =>
  new RegExp(`^${signed ? '-?' : ''}\\d*\\.?\\d{0,${Math.max(2, currencyDecimals(currency))}}$`)

/**
 * Spread `amount` across `n` payers in whole cents so the parts sum back exactly.
 * Floor-based, so a negative total (a refund, #2176) splits just as exactly:
 * the remainder is always in [0, n) and the parts still sum to the input.
 */
export function splitCents(amount: number, n: number): number[] {
  if (n <= 0) return []
  const cents = Math.round(amount * 100)
  const base = Math.floor(cents / n)
  const rem = cents - base * n
  return Array.from({ length: n }, (_, i) => (base + (i < rem ? 1 : 0)) / 100)
}

/**
 * The calendar day a settle-up payment counts on for grouping/filtering: its own
 * `settled_at` if the user set one, else the day it was recorded (`created_at`).
 * Mirrors `expense_date` falling back nowhere on a budget item — a settlement's
 * `created_at` doubled as its date before `settled_at` existed, so this keeps
 * every pre-existing row grouped exactly where it already was.
 */
export function settlementDate(s: { settled_at?: string | null; created_at?: string | null }): string {
  return (s.settled_at || s.created_at || '').slice(0, 10)
}

/**
 * What one participant fronted for an expense, in the expense's own currency.
 *
 * Several payers can share one bill, and the same person can appear only once,
 * but the reduce covers a row that somehow carries them twice rather than
 * picking one of the two. The caller converts the result — this file never
 * touches exchange rates.
 */
export function paidByUser(
  item: { payers?: { user_id: number; amount: number }[] | null },
  userId: number,
): number {
  return (item.payers || []).filter(p => p.user_id === userId).reduce((a, p) => a + p.amount, 0)
}

/** The figures a final budget is made of, for someone the server left out of the ledger. */
export function finalBudgetFor(finals: BudgetParticipantFinal[], member: { id: number; username: string }): BudgetParticipantFinal {
  // Absent means they neither fronted anything nor were split into an expense:
  // the trip has cost them nothing, which is worth a row of its own.
  return finals.find(f => f.user_id === member.id) || {
    user_id: member.id, username: member.username, avatar_url: null,
    expenses: 0, reimbursed: 0, pending: 0, final: 0,
    sources: { fronted: [], moved: [], outstanding: [] },
  }
}

/**
 * The rows behind one traveler's final budget, ready to print. They arrive as
 * ids and display cents: the server spreads each of the three figures over its
 * rows with the same largest-remainder split the figure came from, so every list
 * adds up to the line it sits under, in whatever currency was asked for and
 * whether or not the live rates have loaded yet. Only the expense names are
 * looked up here; who "you" is in a transfer is the shell's call.
 */
export function finalBudgetSources(
  row: Pick<BudgetParticipantFinal, 'sources'>,
  items: { id: number; name: string }[],
): {
  fronted: { item_id: number; name: string; amount: number }[]
  moved: { settlement_id: number; from_user_id: number; to_user_id: number; amount: number }[]
  outstanding: { from_user_id: number; to_user_id: number; amount: number }[]
} {
  const { fronted, moved, outstanding } = row.sources
  return {
    fronted: fronted.map(r => ({ item_id: r.item_id, name: items.find(i => i.id === r.item_id)?.name ?? '?', amount: r.cents / 100 })),
    moved: moved.map(r => ({ settlement_id: r.settlement_id, from_user_id: r.from_user_id, to_user_id: r.to_user_id, amount: r.cents / 100 })),
    outstanding: outstanding.map(r => ({ from_user_id: r.from_user_id, to_user_id: r.to_user_id, amount: r.cents / 100 })),
  }
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
 *
 * Must stay share-for-share identical to the server's
 * BudgetService.splitEqualShares (budget.service.ts) — the settlement is netted
 * there, this copy only previews it. The remainder is `totalCents - baseCents*n`
 * rather than `%` so a negative total (a refund, #2176) still yields a remainder
 * in [0, n) and the shares sum back to the total exactly, like the server's do.
 * The parity fixture in CostsPanel.helpers.test.ts pins both sides.
 */
export function splitEqualShares(total: number, members: { user_id: number }[], itemId: number): Record<number, number> {
  const n = members.length
  if (n === 0) return {}

  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / n)
  const remainder = totalCents - baseCents * n

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
