import { describe, it, expect } from 'vitest'
import { formatMoney } from '../../utils/formatters'
import { editingCurrencyOf, expenseFxPreview, splitShareLabel } from './expenseFx'

// A euro trip read in dollars, converted with the euro's own quote: one euro is 1.1551
// dollars today, and 1.17 on the day the hotel was booked (#2525).
const convert = (amount: number, from: string | null | undefined): number =>
  (amount / ({ EUR: 1, USD: 1.1551, JPY: 170 } as Record<string, number>)[(from || 'USD').toUpperCase()]) * 1.1551
const hotel = { currency: 'USD', exchange_rate: 1.17 }
const base = { editing: hotel, editingCurrency: 'USD', tripCurrency: 'EUR', base: 'USD', convert }

describe('editingCurrencyOf', () => {
  it('opens a saved expense without a currency in the trip currency', () => {
    expect(editingCurrencyOf({ currency: null }, 'eur', 'USD')).toBe('EUR')
    expect(editingCurrencyOf({ currency: 'jpy' }, 'EUR', 'USD')).toBe('JPY')
  })

  it('starts a new expense, or one on a trip without a currency, in the display currency', () => {
    expect(editingCurrencyOf(null, 'EUR', 'usd')).toBe('USD')
    expect(editingCurrencyOf({ currency: null }, null, 'usd')).toBe('USD')
  })
})

describe('expenseFxPreview', () => {
  it('previews an edit that keeps the currency at the rate frozen on entry', () => {
    const fx = expenseFxPreview({ ...base, total: 801.76, currency: 'USD' })!
    expect(fx.inTrip).toBeCloseTo(685.26, 2)
    expect(fx.shown).toBeCloseTo(791.55, 2)
  })

  it('has nothing to preview for a bill in the display currency that reads back as typed', () => {
    expect(expenseFxPreview({ ...base, editing: { currency: 'USD', exchange_rate: 1.1551 }, total: 12345.67, currency: 'USD' })).toBeNull()
    expect(expenseFxPreview({ ...base, editing: null, total: 250, currency: 'USD' })).toBeNull()
    expect(expenseFxPreview({ ...base, total: 0, currency: 'USD' })).toBeNull()
  })

  it('previews a new or re-currencied amount at today\'s rate', () => {
    expect(expenseFxPreview({ ...base, editing: null, total: 1700, currency: 'JPY' })).toEqual({ inTrip: null, shown: convert(1700, 'JPY') })
    // Switching the hotel to yen re-freezes on save, so the old rate does not apply.
    expect(expenseFxPreview({ ...base, total: 1700, currency: 'JPY' })?.inTrip).toBeNull()
  })

  it('stops at the trip amount when the viewer reads the trip currency', () => {
    expect(expenseFxPreview({ ...base, base: 'EUR', total: 801.76, currency: 'USD' })).toEqual({ inTrip: 801.76 / 1.17, shown: null })
  })
})

describe('splitShareLabel', () => {
  const sym = (c: string) => (c === 'USD' ? '$' : c + ' ')

  it('prints the entered share, then the share the row lends or borrows', () => {
    const fx = expenseFxPreview({ ...base, total: 801.76, currency: 'USD' })
    expect(splitShareLabel(400.88, 'USD', fx, 2, 'USD', sym, 'en-US')).toBe('$400.88 → $395.77')
    // Read in the trip currency, the share is the booked euros.
    const inEur = expenseFxPreview({ ...base, base: 'EUR', total: 801.76, currency: 'USD' })
    expect(splitShareLabel(400.88, 'USD', inEur, 2, 'EUR', sym, 'en-US')).toBe(`$400.88 → ${formatMoney(342.63, 'EUR', 'en-US')}`)
  })

  it('prints the entered share alone when nothing is converted', () => {
    expect(splitShareLabel(125, 'USD', null, 2, 'USD', sym, 'en-US')).toBe('$125.00')
    expect(splitShareLabel(0, 'USD', { inTrip: null, shown: 10 }, 0, 'USD', sym, 'en-US')).toBe('$0.00')
  })
})
