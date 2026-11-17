import { useEffect, useState } from 'react'
import { amountToInputString, currencyDecimals } from '../../utils/formatters'

export type CustomSplitUnit = 'amount' | 'percent' | 'shares'

/** What a percent or a share field takes: up to 999, with two decimals at most. */
const UNIT_INPUT = /^\d{0,3}(\.\d{0,2})?$/

/** A percent as typed back into the field: at most two decimals, no trailing zeros. */
export function percentString(value: number): string {
  return String(Math.round(value * 100) / 100)
}

/**
 * Whole minor units for each id from its exact (fractional) part of `totalUnits`.
 * The parts must add up to `totalUnits`; the units a plain rounding would lose go
 * to the largest remainders, the same way splitEqualShares hands out an
 * indivisible cent, so the result adds up to the total exactly.
 */
function largestRemainder(totalUnits: number, parts: { id: number; exact: number }[]): Record<number, number> {
  const floors = parts.map(p => ({ id: p.id, units: Math.floor(p.exact), rest: p.exact - Math.floor(p.exact) }))
  let left = totalUnits - floors.reduce((s, f) => s + f.units, 0)
  // On a refund the total is negative, so the remainder runs the other way.
  const order = [...floors].sort((a, b) => (left >= 0 ? b.rest - a.rest : a.rest - b.rest) || a.id - b.id)
  for (const f of order) {
    if (left === 0) break
    f.units += Math.sign(left)
    left -= Math.sign(left)
  }
  return Object.fromEntries(floors.map(f => [f.id, f.units]))
}

/**
 * Amounts from percentages of `total` (#1709), in whole minor units. When the
 * percentages add up to 100 the shares add up to the total exactly (see
 * largestRemainder). Ids without a percentage get no amount.
 */
export function percentsToAmounts(total: number, percents: Record<number, string>, ids: number[], currency: string): Record<number, number> {
  const factor = 10 ** currencyDecimals(currency)
  const totalUnits = Math.round(total * factor)
  const entered = ids
    .map(id => ({ id, pct: Number.parseFloat(percents[id]) }))
    .filter(e => Number.isFinite(e.pct))
  const raw = entered.map(e => ({ id: e.id, exact: (totalUnits * e.pct) / 100 }))
  const out: Record<number, number> = {}
  const pctSum = entered.reduce((s, e) => s + e.pct, 0)
  if (Math.abs(pctSum - 100) < 1e-9) {
    for (const [id, units] of Object.entries(largestRemainder(totalUnits, raw))) out[Number(id)] = units / factor
  } else {
    for (const r of raw) out[r.id] = Math.round(r.exact) / factor
  }
  return out
}

/** A person's number of shares; a field left empty counts as one, the equal split. */
export function shareWeight(raw: string | undefined): number {
  const n = Number.parseFloat(raw ?? '')
  return Number.isFinite(n) ? n : 1
}

/**
 * Amounts from shares of `total` (#1165): five nights against four split a
 * stay 5/9 to 4/9. The shares always add up to the whole, so the amounts add
 * up to the total exactly (see largestRemainder). No amounts while nobody holds
 * a share, which leaves the split unbalanced instead of dividing by zero.
 */
export function sharesToAmounts(total: number, shares: Record<number, string>, ids: number[], currency: string): Record<number, number> {
  const factor = 10 ** currencyDecimals(currency)
  const totalUnits = Math.round(total * factor)
  const weights = ids.map(id => ({ id, weight: shareWeight(shares[id]) }))
  const weightSum = weights.reduce((s, w) => s + w.weight, 0)
  if (weightSum <= 0) return {}
  const units = largestRemainder(totalUnits, weights.map(w => ({ id: w.id, exact: (totalUnits * w.weight) / weightSum })))
  return Object.fromEntries(Object.entries(units).map(([id, u]) => [Number(id), u / factor]))
}

/** The percentages the typed amounts make of `total`; an empty or unparsable amount stays empty. */
export function amountsToPercents(total: number, amounts: Record<number, string>, ids: number[]): Record<number, string> {
  const out: Record<number, string> = {}
  if (total === 0) return out
  for (const id of ids) {
    const amount = Number.parseFloat(amounts[id])
    if (Number.isFinite(amount)) out[id] = percentString((amount / total) * 100)
  }
  return out
}

interface Args {
  total: number
  participants: Set<number>
  customAmounts: Record<number, string>
  /** Must be stable across renders (a state setter), it is an effect dependency. */
  setCustomAmounts: (next: Record<number, string>) => void
  currency: string
  initialUnit?: CustomSplitUnit
}

/**
 * The "%" (#1709) and "shares" (#1165) sides of a custom split. Both are only
 * an input aid: every change is turned straight into the amounts the custom
 * split already keeps, so what is saved, validated and settled is unchanged.
 * `entries` holds what the person typed in the current unit, percentages or
 * shares; the amount unit types the amounts themselves.
 */
export function usePercentSplit({ total, participants, customAmounts, setCustomAmounts, currency, initialUnit = 'amount' }: Args) {
  const [unit, setUnitState] = useState<CustomSplitUnit>(initialUnit)
  const [entries, setEntries] = useState<Record<number, string>>({})
  const ids = [...participants]

  // Percentages carry the typed amounts over; shares start even, one each.
  const setUnit = (next: CustomSplitUnit) => {
    if (next === unit) return
    setEntries(next === 'percent' ? amountsToPercents(total, customAmounts, ids) : {})
    setUnitState(next)
  }

  const onEntryChange = (id: number, raw: string) => {
    const val = raw.replace(',', '.')
    if (val !== '' && !UNIT_INPUT.test(val)) return
    setEntries(prev => {
      const next = { ...prev, [id]: val }
      if (val === '') delete next[id]
      return next
    })
  }

  // The amounts follow the entries: on every one typed, and when the total
  // changes or somebody leaves the split.
  const idsKey = ids.join(',')
  useEffect(() => {
    if (unit === 'amount') return
    const idList = idsKey ? idsKey.split(',').map(Number) : []
    const amounts = (unit === 'percent' ? percentsToAmounts : sharesToAmounts)(total, entries, idList, currency)
    const strings: Record<number, string> = {}
    for (const [id, amount] of Object.entries(amounts)) strings[Number(id)] = amountToInputString(amount, currency)
    setCustomAmounts(strings)
  }, [unit, entries, total, idsKey, currency, setCustomAmounts])

  const percentSum = ids.reduce((s, id) => s + (Number.parseFloat(entries[id]) || 0), 0)
  const empty = ids.filter(id => !entries[id])
  // The percent left over spread across the empty fields; a share field reads one.
  const placeholder = unit === 'shares' ? '1' : empty.length > 0 ? percentString(Math.max(0, 100 - percentSum) / empty.length) : '0'

  return { unit, setUnit, entries, onEntryChange, percentSum, placeholder }
}
