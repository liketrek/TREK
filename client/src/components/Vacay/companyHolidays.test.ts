// FE-VACAY-COMPANY-001 to FE-VACAY-COMPANY-003 (#2439)
import { describe, it, expect } from 'vitest'
import { companyHolidaySets, leaveFractionFor, toggledCompanyHolidays } from './companyHolidays'

describe('company holidays', () => {
  it('FE-VACAY-COMPANY-001: splits whole and half days, old rows being whole', () => {
    const { full, half } = companyHolidaySets([{ date: 'a' }, { date: 'b', fraction: 0.5 }, { date: 'c', fraction: 1 }])
    expect([...full]).toEqual(['a', 'c'])
    expect([...half]).toEqual(['b'])
  })

  it('FE-VACAY-COMPANY-002: adds, converts and clears by the server rule', () => {
    const one = toggledCompanyHolidays([], 'x', 0.5)
    expect(one).toEqual([{ date: 'x', fraction: 0.5 }])
    const whole = toggledCompanyHolidays(one, 'x', 1)
    expect(whole).toEqual([{ date: 'x', fraction: 1 }])
    expect(toggledCompanyHolidays(whole, 'x', 1)).toEqual([])
  })

  it('FE-VACAY-COMPANY-003: leave on a half company holiday is half a day', () => {
    expect(leaveFractionFor('x', new Set(['x']), 1)).toBe(0.5)
    expect(leaveFractionFor('y', new Set(['x']), 1)).toBe(1)
  })
})
