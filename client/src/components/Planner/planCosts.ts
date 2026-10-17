import type { AssignmentsMap, BudgetItem, Day, Reservation } from '../../types'
import type { MoneyEntry } from '../../utils/formatters'
import { bookedInTrip } from '../../hooks/useExchangeRates'
import { daySpan, startKey } from './bookings/bookingsModel'

/** What the plan's cost figures add up: per day, and for the whole trip. */
export interface PlanCosts {
  byDay: Map<number, MoneyEntry[]>
  total: MoneyEntry[]
}

/**
 * The money behind the day pills and the Total Cost at the foot of the plan, and
 * behind the same figures in the PDF (#2551).
 *
 * With Costs on, the expenses are the one record of what the trip costs, so the
 * plan reads them and nothing else: deleting an expense takes it off the plan, and
 * the plan's total is the Costs total. The plan used to add up the price column of
 * every stop instead, a figure no form shows since expenses replaced it and that
 * nothing in Costs ever changed, once per day the stop sat on.
 *
 * An expense counts on the day its booking starts, else the first day its place is
 * planned on, else the day of its date. One that belongs to no day still counts in
 * the total. A foreign amount booked at a frozen rate counts at that rate, as Costs
 * counts it.
 *
 * With Costs off there are no expenses, and a place's own price (set through the
 * API) still counts, once, on the first day the place is planned on.
 */
export function planCosts({ days, assignments, reservations, budgetItems, costsEnabled, tripCurrency }: {
  days: Day[]
  assignments: AssignmentsMap
  reservations: Reservation[]
  budgetItems: BudgetItem[]
  costsEnabled: boolean
  tripCurrency: string
}): PlanCosts {
  const trip = (tripCurrency || 'EUR').toUpperCase()
  const firstDayOfPlace = new Map<number, number>()
  for (const day of days) {
    for (const a of assignments[String(day.id)] || []) {
      if (a.place?.id != null && !firstDayOfPlace.has(a.place.id)) firstDayOfPlace.set(a.place.id, day.id)
    }
  }

  const byDay = new Map<number, MoneyEntry[]>()
  const total: MoneyEntry[] = []
  const add = (dayId: number | null, entry: MoneyEntry) => {
    total.push(entry)
    if (dayId == null) return
    const list = byDay.get(dayId)
    if (list) list.push(entry)
    else byDay.set(dayId, [entry])
  }

  if (!costsEnabled) {
    const seen = new Set<number>()
    for (const day of days) {
      for (const a of assignments[String(day.id)] || []) {
        const place = a.place
        if (!place || seen.has(place.id)) continue
        seen.add(place.id)
        const amount = Number.parseFloat(String(place.price ?? '')) || 0
        if (amount !== 0) add(day.id, { amount, currency: (place.currency || trip).toUpperCase() })
      }
    }
    return { byDay: netted(byDay), total: netByCurrency(total) }
  }

  const dayByDate = (value: string | null | undefined) => {
    const date = value ? value.slice(0, 10) : ''
    return date ? days.find(d => d.date === date)?.id ?? null : null
  }
  const dayOfExpense = (item: BudgetItem): number | null => {
    const booking = item.reservation_id != null ? reservations.find(r => r.id === item.reservation_id) : undefined
    if (booking) {
      const onDay = daySpan(booking, days).start?.id ?? dayByDate(startKey(booking, days))
      if (onDay != null) return onDay
    }
    if (item.place_id != null && firstDayOfPlace.has(item.place_id)) return firstDayOfPlace.get(item.place_id)!
    return dayByDate(item.expense_date)
  }

  for (const item of budgetItems) {
    const amount = item.total_price || 0
    if (amount === 0) continue
    const booked = bookedInTrip(amount, item.currency, item.exchange_rate, trip)
    const entry = booked != null
      ? { amount: booked, currency: trip }
      : { amount, currency: (item.currency || trip).toUpperCase() }
    add(dayOfExpense(item), entry)
  }
  return { byDay: netted(byDay), total: netByCurrency(total) }
}

/**
 * One entry per currency, signed amounts summed first, so a refund (a negative
 * expense) takes its amount back off the figure the way Costs nets it, instead of
 * being skipped by the formatter that only prints what is above zero.
 */
function netByCurrency(entries: MoneyEntry[]): MoneyEntry[] {
  const sums = new Map<string, number>()
  for (const e of entries) sums.set(e.currency, (sums.get(e.currency) || 0) + e.amount)
  return [...sums].map(([currency, amount]) => ({ currency, amount }))
}

function netted(byDay: Map<number, MoneyEntry[]>): Map<number, MoneyEntry[]> {
  return new Map([...byDay].map(([dayId, entries]) => [dayId, netByCurrency(entries)]))
}
