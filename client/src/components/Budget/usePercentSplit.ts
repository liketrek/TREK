import { useEffect, useState } from 'react'
import { amountToInputString, currencyDecimals } from '../../utils/formatters'

export type CustomSplitUnit = 'amount' | 'percent'

const PERCENT_INPUT = /^\d{0,3}(\.\d{0,2})?$/

/** A percent as typed back into the field: at most two decimals, no trailing zeros. */
export function percentString(value: number): string {
  return String(Math.round(value * 100) / 100)
}

/**
 * Amounts from percentages of `total` (#1709), in whole minor units. When the
 * percentages add up to 100 the shares add up to the total exactly: the units a
 * plain rounding would lose go to the largest remainders, the same way
 * splitEqualShares hands out an indivisible cent. Ids without a percentage get
 * no amount.
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
    const floors = raw.map(r => ({ id: r.id, units: Math.floor(r.exact), rest: r.exact - Math.floor(r.exact) }))
    let left = totalUnits - floors.reduce((s, f) => s + f.units, 0)
    // On a refund the total is negative, so the remainder runs the other way.
    const order = [...floors].sort((a, b) => (left >= 0 ? b.rest - a.rest : a.rest - b.rest) || a.id - b.id)
    for (const f of order) {
      if (left === 0) break
      f.units += Math.sign(left)
      left -= Math.sign(left)
    }
    for (const f of floors) out[f.id] = f.units / factor
  } else {
    for (const r of raw) out[r.id] = Math.round(r.exact) / factor
  }
  return out
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
 * The "%" side of a custom split (#1709). Percentages are only an input aid:
 * every change is turned straight into the amounts the custom split already
 * keeps, so what is saved, validated and settled is unchanged.
 */
export function usePercentSplit({ total, participants, customAmounts, setCustomAmounts, currency, initialUnit = 'amount' }: Args) {
  const [unit, setUnitState] = useState<CustomSplitUnit>(initialUnit)
  const [percents, setPercents] = useState<Record<number, string>>({})
  const ids = [...participants]

  const setUnit = (next: CustomSplitUnit) => {
    if (next === unit) return
    if (next === 'percent') setPercents(amountsToPercents(total, customAmounts, ids))
    setUnitState(next)
  }

  const onPercentChange = (id: number, raw: string) => {
    const val = raw.replace(',', '.')
    if (val !== '' && !PERCENT_INPUT.test(val)) return
    setPercents(prev => {
      const next = { ...prev, [id]: val }
      if (val === '') delete next[id]
      return next
    })
  }

  // The amounts follow the percentages: on every percentage typed, and when the
  // total changes or somebody leaves the split.
  const idsKey = ids.join(',')
  useEffect(() => {
    if (unit !== 'percent') return
    const idList = idsKey ? idsKey.split(',').map(Number) : []
    const amounts = percentsToAmounts(total, percents, idList, currency)
    const strings: Record<number, string> = {}
    for (const [id, amount] of Object.entries(amounts)) strings[Number(id)] = amountToInputString(amount, currency)
    setCustomAmounts(strings)
  }, [unit, percents, total, idsKey, currency, setCustomAmounts])

  const percentSum = ids.reduce((s, id) => s + (Number.parseFloat(percents[id]) || 0), 0)
  const empty = ids.filter(id => !percents[id])
  const placeholderPercent = empty.length > 0 ? percentString(Math.max(0, 100 - percentSum) / empty.length) : '0'

  return { unit, setUnit, percents, onPercentChange, percentSum, placeholderPercent }
}
