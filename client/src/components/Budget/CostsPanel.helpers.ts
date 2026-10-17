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

import { splitEqualShares as splitEqualMinorShares, splitTicketLines, toMinor } from '@trek/shared'
import type { BudgetParticipantFinal, ReceiptRead } from '@trek/shared'
import { amountToInputString, currencyDecimals } from '../../utils/formatters'
import { localIsoDate } from '../../utils/localDate'
import type { ExpensePrefill } from './CostsPanel'
import type { BudgetItem } from '../../types'

// The split and receipt fields guard their own precision on every keystroke, so the
// guard has to follow the currency: a three-decimal one (KWD, BHD, …) seeds three
// places, and the old fixed two rejected every keystroke after that, leaving the field
// unusable until a digit was deleted (#2175). A currency without minor units (KRW,
// JPY) takes no decimals at all, or a won amount could carry cents the list then
// rounds away (#2604). The point itself may stand, so a digit typed after it is
// dropped instead of joining the whole won. Callers cut the input with
// clampAmountDecimals first, so a longer value a field was seeded with stays editable.
export const amountPattern = (currency: string, signed: boolean) =>
  new RegExp(`^${signed ? '-?' : ''}\\d*\\.?\\d{0,${currencyDecimals(currency)}}$`)

/**
 * A dot-normalized amount as typed, cut to the decimals the currency has (#2604):
 * "1000.555" in won is "1000.", in euros "1000.55". Cut, not rounded, so the digits
 * left are the ones the user typed, and a won amount keeps its point so a digit
 * typed after it is dropped rather than read as one more whole won.
 */
export function clampAmountDecimals(value: string, currency: string): string {
  const dot = value.indexOf('.')
  return dot < 0 ? value : value.slice(0, dot + 1 + currencyDecimals(currency))
}

/** An amount already typed, in the currency it was switched to: cut, and without a point left bare. */
export function amountInCurrency(value: string, currency: string): string {
  return clampAmountDecimals(value, currency).replace(/\.$/, '')
}

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
 * A settlement's `created_at` doubled as its date before `settled_at` existed.
 * It is SQLite's UTC clock ("2026-10-11 23:30:00"), so it is read as UTC and
 * placed on the viewer's own calendar: in Seoul that payment was made on the
 * 12th, not the 11th (#2604).
 */
export function settlementDate(s: { settled_at?: string | null; created_at?: string | null }): string {
  if (s.settled_at) return s.settled_at.slice(0, 10)
  if (!s.created_at) return ''
  const iso = s.created_at.replace(' ', 'T')
  const at = new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(iso) ? iso : `${iso}Z`)
  return Number.isNaN(at.getTime()) ? s.created_at.slice(0, 10) : localIsoDate(at)
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
 * Every name the server sent along with the expenses and the settlement, by user
 * id. Someone removed from the trip keeps their payer and split rows (#2604) but
 * is no longer among the trip members, so the views fall back to these instead
 * of printing "?" for them.
 */
export function knownPersonNames(
  items: { payers?: { user_id: number; username?: string }[] | null; members?: { user_id: number; username: string }[] | null }[],
  settlement: { balances?: { user_id: number; username: string }[]; finalBudgets?: { user_id: number; username: string }[]; flows?: { from: { user_id: number; username: string }; to: { user_id: number; username: string } }[] } | null | undefined,
): Map<number, string> {
  const names = new Map<number, string>()
  const add = (p: { user_id: number; username?: string | null }) => { if (p.username && !names.has(p.user_id)) names.set(p.user_id, p.username) }
  for (const item of items) {
    for (const p of item.payers || []) add(p)
    for (const m of item.members || []) add(m)
  }
  for (const b of settlement?.balances || []) add(b)
  for (const f of settlement?.finalBudgets || []) add(f)
  for (const f of settlement?.flows || []) { add(f.from); add(f.to) }
  return names
}

/**
 * The server's rows for people no longer on the trip that still carry money, to
 * list after the members' own. The balances net to zero across everyone the
 * expenses name, so leaving a former member out made the list stop adding up.
 */
export function formerParticipantRows<T extends { user_id: number }>(memberIds: number[], rows: T[], carriesMoney: (row: T) => boolean): T[] {
  const onTrip = new Set(memberIds)
  return rows.filter(r => !onTrip.has(r.user_id) && carriesMoney(r))
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
 * Split `total` equally across `members`, in whole cents, as euros for the
 * preview. The cents come from the shared `splitEqualShares` the server nets
 * the settlement with, so the preview and the settlement cannot disagree: the
 * remainder cent rotates with the item id and a negative total (a refund,
 * #2176) still sums back exactly.
 */
export function splitEqualShares(total: number, members: { user_id: number }[], itemId: number): Record<number, number> {
  const cents = splitEqualMinorShares(toMinor(total), members, itemId)
  return Object.fromEntries(Object.entries(cents).map(([id, c]) => [id, c / 100]))
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
  const { shares, totalMinor } = splitTicketLines(items.map(i => ({ price: i.price, parts: [...i.participants] })))
  const finalShares: Record<number, number> = {}
  for (const [id, cents] of Object.entries(shares)) finalShares[Number(id)] = cents / 100
  return { shares: finalShares, total: totalMinor / 100 }
}

/**
 * Where a new expense's editor starts from a prefill: a booking's price, or a
 * scanned receipt, which also brings its currency, day, lines and photo. Both
 * editors (the desktop modal and the phone sheet) seed from this one place.
 *
 * A prefill without a currency is in `base`, which is also what the currency
 * field starts on. Receipt lines seed the Ticket split, shared by everyone like
 * a line added by hand, while the split itself stays Equally until the person
 * switches.
 */
export function newExpenseSeed(prefill: ExpensePrefill | undefined, base: string, peopleIds: number[], today: string) {
  const currency = (prefill?.currency || base).toUpperCase()
  return {
    currency,
    day: prefill?.date || today,
    total: prefill?.amount != null ? amountToInputString(prefill.amount, currency) : '',
    ticketItems: (prefill?.lines ?? []).map((line, i): TicketItem => ({
      id: `receipt-${i}`,
      name: line.name,
      price: amountToInputString(line.price, currency),
      participants: new Set(peopleIds),
    })),
    receiptFiles: prefill?.receiptFiles ?? [],
  }
}

/** A scanned receipt as the prefill of a new expense, with its photo to attach on save. */
export function receiptToPrefill(receipt: ReceiptRead, photos: File[]): ExpensePrefill {
  return {
    name: receipt.merchant ?? undefined,
    amount: receipt.total ?? undefined,
    currency: receipt.currency ?? undefined,
    date: receipt.date ?? undefined,
    lines: receipt.items,
    receiptFiles: photos,
  }
}

/**
 * The expense editor a trip page shows, if any. Two things open it: a booking's
 * Costs block (edit that expense, or start one from the booking's price) and a
 * receipt scanned from Costs. The booking wins, since it is what the person just
 * clicked; `key` remounts the editor when one hands over to the other, so each
 * starts from its own seed.
 */
export function expenseEditorFor(
  booking: { editing: BudgetItem | null; prefill?: ExpensePrefill } | null,
  closeBooking: () => void,
  receipt: ExpensePrefill | null,
  closeReceipt: () => void,
): { key: string; editing: BudgetItem | null; prefill?: ExpensePrefill; close: () => void } | null {
  if (booking) return { key: 'booking', editing: booking.editing, prefill: booking.prefill, close: closeBooking }
  if (receipt) return { key: 'receipt', editing: null, prefill: receipt, close: closeReceipt }
  return null
}
