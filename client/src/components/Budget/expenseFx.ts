import { bookedInTrip, useExchangeRates } from '../../hooks/useExchangeRates'
import { useTripStore } from '../../store/tripStore'
import { currencyDecimals, formatMoney } from '../../utils/formatters'

/**
 * The conversion preview of the expense editors, shared by the desktop ExpenseModal and the
 * phone MCostSheet so the two can never preview the same save differently (#2525). The
 * editors only lay it out.
 */

interface EditedExpense {
  currency?: string | null
  exchange_rate?: number | null
}

/**
 * The currency an edited expense opens in. A saved expense without a currency is in the
 * trip's own, which is how the lists read it; opening it in the display currency relabelled
 * the amount, and a save then stored it in that currency.
 */
export function editingCurrencyOf(editing: EditedExpense | null | undefined, tripCurrency: string | null | undefined, base: string): string {
  return ((editing && (editing.currency || tripCurrency)) || base).toUpperCase()
}

export interface ExpenseFx {
  /** The amount in the trip currency, when the save keeps a rate frozen on entry. */
  inTrip: number | null
  /** The amount in the display currency at today's rate; null when `inTrip` already is. */
  shown: number | null
}

/**
 * What the amount being edited will count as. An edit that keeps the currency keeps the rate
 * frozen when the expense was entered (the server re-freezes only when the currency changes),
 * so it is previewed at that rate, the way the list will show it after the save. Anything
 * else is previewed at today's rate. Null when there is nothing to convert, including a bill
 * in the display currency that still reads back as typed.
 */
export function expenseFxPreview(args: {
  total: number
  currency: string
  editing: EditedExpense | null | undefined
  editingCurrency: string
  tripCurrency: string
  base: string
  convert: (amount: number, from: string | null | undefined) => number
}): ExpenseFx | null {
  const { total, currency, editing, editingCurrency, tripCurrency, base, convert } = args
  if (total === 0) return null
  const inTrip = editing && currency === editingCurrency ? bookedInTrip(total, currency, editing.exchange_rate, tripCurrency) : null
  if (currency === base && inTrip == null) return null
  const shown = inTrip == null ? convert(total, currency) : convert(inTrip, tripCurrency)
  const unit = 10 ** currencyDecimals(base)
  if (currency === base && Math.round(shown * unit) === Math.round(total * unit)) return null
  return { inTrip, shown: inTrip != null && tripCurrency === base ? null : shown }
}

/**
 * One equal share as the split summary prints it, "$400.88", followed by what that share
 * counts as when the amount is converted, "$400.88 → $390.54". That second figure is the
 * one the row's "you lent" is made of, so the editor and the row cannot disagree.
 */
export function splitShareLabel(
  each: number,
  currency: string,
  fx: ExpenseFx | null,
  participants: number,
  base: string,
  sym: ((currency: string) => string) | null,
  locale: string,
): string {
  const entered = sym ? sym(currency) + each.toFixed(2) : formatMoney(each, currency, locale)
  const whole = fx ? (fx.shown ?? fx.inTrip) : null
  if (whole == null || participants <= 0) return entered
  return `${entered} → ${formatMoney(whole / participants, base, locale)}`
}

/** Everything an expense editor needs to preview a conversion, from the trip in the store. */
export function useExpenseFx(base: string, editing: EditedExpense | null | undefined) {
  const storedTripCurrency = useTripStore(s => s.trip?.currency)
  const tripCurrency = (storedTripCurrency || base).toUpperCase()
  const { convert } = useExchangeRates(base, tripCurrency)
  const editingCurrency = editingCurrencyOf(editing, storedTripCurrency, base)
  const preview = (total: number, currency: string) =>
    expenseFxPreview({ total, currency, editing, editingCurrency, tripCurrency, base, convert })
  return { tripCurrency, editingCurrency, preview }
}
