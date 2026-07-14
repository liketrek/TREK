import { describe, it, expect } from 'vitest'
import { splitCents, payerSum, payersBalanced, rebalancePayers } from './CostsPanel.helpers'

describe('splitCents', () => {
  it('splits evenly when it divides cleanly', () => {
    expect(splitCents(90, 3)).toEqual([30, 30, 30])
  })

  it('distributes the remainder cents so the parts sum back exactly', () => {
    const parts = splitCents(100.01, 3)
    expect(parts).toEqual([33.34, 33.34, 33.33])
    expect(parts.reduce((a, b) => a + b, 0)).toBeCloseTo(100.01, 2)
  })

  it('returns an empty list for a non-positive count', () => {
    expect(splitCents(50, 0)).toEqual([])
  })

  it('floors a negative amount at zero rather than inventing debt', () => {
    expect(splitCents(-10, 2)).toEqual([0, 0])
  })
})

describe('payerSum', () => {
  it('sums only the selected payers', () => {
    const amounts = { 1: '45', 2: '45', 3: '99' }
    expect(payerSum(amounts, new Set([1, 2]))).toBeCloseTo(90, 2)
  })

  it('treats blank and unparseable amounts as zero', () => {
    expect(payerSum({ 1: '', 2: 'abc' }, new Set([1, 2]))).toBe(0)
  })
})

describe('payersBalanced', () => {
  it('is true when the payer amounts add up to the total', () => {
    expect(payersBalanced({ 1: '45', 2: '45' }, new Set([1, 2]), 90)).toBe(true)
  })

  it('is false when they do not', () => {
    expect(payersBalanced({ 1: '45', 2: '40' }, new Set([1, 2]), 90)).toBe(false)
  })

  it('compares to the cent, tolerating float dust', () => {
    expect(payersBalanced({ 1: '33.34', 2: '33.34', 3: '33.33' }, new Set([1, 2, 3]), 100.01)).toBe(true)
  })
})

describe('rebalancePayers', () => {
  it('spreads the total across payers when none are pinned', () => {
    const next = rebalancePayers({}, new Set(), new Set([1, 2]), 90)
    expect(next).toEqual({ 1: '45.00', 2: '45.00' })
  })

  it('leaves pinned payers alone and lets the rest absorb the remainder', () => {
    // Alice pinned at 70 of a 100 bill → Bob must absorb 30.
    const next = rebalancePayers({ 1: '70' }, new Set([1]), new Set([1, 2]), 100)
    expect(next[1]).toBe('70')
    expect(next[2]).toBe('30.00')
  })

  it('returns the amounts untouched when every payer is pinned', () => {
    const amounts = { 1: '70', 2: '20' }
    const next = rebalancePayers(amounts, new Set([1, 2]), new Set([1, 2]), 100)
    expect(next).toEqual(amounts)
  })

  it('blanks a free payer whose share works out to zero', () => {
    // Alice pinned at the full total → Bob is a payer with nothing left to pay.
    const next = rebalancePayers({ 1: '100' }, new Set([1]), new Set([1, 2]), 100)
    expect(next[2]).toBe('')
  })

  it('keeps the result balanced after rebalancing', () => {
    const next = rebalancePayers({ 1: '33.33' }, new Set([1]), new Set([1, 2, 3]), 100)
    expect(payersBalanced(next, new Set([1, 2, 3]), 100)).toBe(true)
  })
})
