// FE-BUDGET-PCT-001 to FE-BUDGET-PCT-009
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import { amountsToPercents, percentsToAmounts, percentString, sharesToAmounts, shareWeight, usePercentSplit } from './usePercentSplit'

describe('percent split maths (#1709)', () => {
  it('FE-BUDGET-PCT-001: thirds add up to the total exactly', () => {
    const amounts = percentsToAmounts(100, { 1: '33.33', 2: '33.33', 3: '33.34' }, [1, 2, 3], 'EUR')
    expect(amounts).toEqual({ 1: 33.33, 2: 33.33, 3: 33.34 })
    const even = percentsToAmounts(10, { 1: '33.33', 2: '33.33', 3: '33.34' }, [1, 2, 3], 'EUR')
    expect(Object.values(even).reduce((s, v) => s + v, 0)).toBeCloseTo(10, 10)
  })

  it('FE-BUDGET-PCT-002: a refund splits negative and still balances', () => {
    const amounts = percentsToAmounts(-10, { 1: '50', 2: '25', 3: '25' }, [1, 2, 3], 'EUR')
    expect(amounts).toEqual({ 1: -5, 2: -2.5, 3: -2.5 })
    const odd = percentsToAmounts(-0.05, { 1: '50', 2: '50' }, [1, 2], 'EUR')
    expect(Math.round((odd[1] + odd[2]) * 100)).toBe(-5)
  })

  it('FE-BUDGET-PCT-003: zero-decimal currencies stay whole, and percentages short of 100 just round', () => {
    expect(percentsToAmounts(1000, { 1: '33.33', 2: '66.67' }, [1, 2], 'JPY')).toEqual({ 1: 333, 2: 667 })
    expect(percentsToAmounts(80, { 1: '25', 2: '' }, [1, 2], 'EUR')).toEqual({ 1: 20 })
  })

  it('FE-BUDGET-PCT-004: amounts read back as percentages of the total', () => {
    expect(amountsToPercents(80, { 1: '20', 2: '60', 3: '' }, [1, 2, 3])).toEqual({ 1: '25', 2: '75' })
    expect(amountsToPercents(0, { 1: '20' }, [1])).toEqual({})
    expect(percentString(33.3333)).toBe('33.33')
  })
})

describe('share split maths (#1165)', () => {
  it('FE-BUDGET-PCT-007: five nights against four split the stay 5/9 to 4/9, to the cent', () => {
    expect(sharesToAmounts(390, { 1: '5', 2: '4' }, [1, 2], 'EUR')).toEqual({ 1: 216.67, 2: 173.33 })
    const thirds = sharesToAmounts(100, { 1: '1', 2: '1', 3: '1' }, [1, 2, 3], 'EUR')
    expect(Math.round(Object.values(thirds).reduce((s, v) => s + v, 0) * 100)).toBe(10000)
    // A refund runs negative and still adds up; a won amount stays whole.
    const refund = sharesToAmounts(-10, { 1: '2', 2: '1' }, [1, 2], 'EUR')
    expect(Math.round((refund[1] + refund[2]) * 100)).toBe(-1000)
    expect(sharesToAmounts(1000, { 1: '1', 2: '2' }, [1, 2], 'KRW')).toEqual({ 1: 333, 2: 667 })
  })

  it('FE-BUDGET-PCT-008: an empty field is one share, zero is none, and nobody holding one gives no amounts', () => {
    expect(shareWeight(undefined)).toBe(1)
    expect(shareWeight('')).toBe(1)
    expect(shareWeight('0')).toBe(0)
    expect(shareWeight('2.5')).toBe(2.5)
    expect(sharesToAmounts(90, { 1: '2' }, [1, 2], 'EUR')).toEqual({ 1: 60, 2: 30 })
    expect(sharesToAmounts(90, { 1: '0', 2: '3' }, [1, 2], 'EUR')).toEqual({ 1: 0, 2: 90 })
    expect(sharesToAmounts(90, { 1: '0', 2: '0' }, [1, 2], 'EUR')).toEqual({})
  })
})

describe('usePercentSplit (#1709, #1165)', () => {
  function setup(total = 90) {
    return renderHook(({ t }) => {
      const [amounts, setAmounts] = useState<Record<number, string>>({ 1: '30', 2: '60' })
      const pct = usePercentSplit({ total: t, participants: new Set([1, 2, 3]), customAmounts: amounts, setCustomAmounts: setAmounts, currency: 'EUR' })
      return { amounts, pct }
    }, { initialProps: { t: total } })
  }

  it('FE-BUDGET-PCT-005: switching to % carries the typed amounts over, and typing writes amounts back', () => {
    const { result } = setup()
    act(() => result.current.pct.setUnit('percent'))
    expect(result.current.pct.entries).toEqual({ 1: '33.33', 2: '66.67' })
    act(() => result.current.pct.onEntryChange(1, '50'))
    act(() => result.current.pct.onEntryChange(2, '25'))
    act(() => result.current.pct.onEntryChange(3, '25'))
    expect(result.current.amounts).toEqual({ 1: '45.00', 2: '22.50', 3: '22.50' })
    expect(result.current.pct.percentSum).toBe(100)
    // Not a percentage: ignored.
    act(() => result.current.pct.onEntryChange(3, 'abc'))
    expect(result.current.pct.entries[3]).toBe('25')
  })

  it('FE-BUDGET-PCT-006: a changed total moves the amounts, the placeholder offers the rest', () => {
    const { result, rerender } = setup()
    act(() => result.current.pct.setUnit('percent'))
    act(() => result.current.pct.onEntryChange(1, '50'))
    act(() => result.current.pct.onEntryChange(2, ''))
    expect(result.current.pct.placeholder).toBe('25')
    rerender({ t: 200 })
    expect(result.current.amounts).toEqual({ 1: '100.00' })
  })

  it('FE-BUDGET-PCT-009: shares start even, one each, and typed shares write the amounts back', () => {
    const { result, rerender } = setup()
    act(() => result.current.pct.setUnit('shares'))
    expect(result.current.pct.entries).toEqual({})
    expect(result.current.pct.placeholder).toBe('1')
    expect(result.current.amounts).toEqual({ 1: '30.00', 2: '30.00', 3: '30.00' })
    act(() => result.current.pct.onEntryChange(1, '5'))
    act(() => result.current.pct.onEntryChange(2, '4'))
    act(() => result.current.pct.onEntryChange(3, '0'))
    expect(result.current.amounts).toEqual({ 1: '50.00', 2: '40.00', 3: '0.00' })
    rerender({ t: 390 })
    expect(result.current.amounts).toEqual({ 1: '216.67', 2: '173.33', 3: '0.00' })
  })
})
