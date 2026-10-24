// FE-BUDGET-PCT-001 to FE-BUDGET-PCT-006
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import { amountsToPercents, percentsToAmounts, percentString, usePercentSplit } from './usePercentSplit'

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

describe('usePercentSplit (#1709)', () => {
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
    expect(result.current.pct.percents).toEqual({ 1: '33.33', 2: '66.67' })
    act(() => result.current.pct.onPercentChange(1, '50'))
    act(() => result.current.pct.onPercentChange(2, '25'))
    act(() => result.current.pct.onPercentChange(3, '25'))
    expect(result.current.amounts).toEqual({ 1: '45.00', 2: '22.50', 3: '22.50' })
    expect(result.current.pct.percentSum).toBe(100)
    // Not a percentage: ignored.
    act(() => result.current.pct.onPercentChange(3, 'abc'))
    expect(result.current.pct.percents[3]).toBe('25')
  })

  it('FE-BUDGET-PCT-006: a changed total moves the amounts, the placeholder offers the rest', () => {
    const { result, rerender } = setup()
    act(() => result.current.pct.setUnit('percent'))
    act(() => result.current.pct.onPercentChange(1, '50'))
    act(() => result.current.pct.onPercentChange(2, ''))
    expect(result.current.pct.placeholderPercent).toBe('25')
    rerender({ t: 200 })
    expect(result.current.amounts).toEqual({ 1: '100.00' })
  })
})
