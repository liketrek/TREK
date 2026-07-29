import { describe, it, expect } from 'vitest'
import { calcPP, hasCustomMemberSplit, normalizePastedAmount } from './BudgetPanel.helpers'

describe('BudgetPanel.helpers', () => {
  describe('hasCustomMemberSplit (#1458)', () => {
    it('is false when no members', () => {
      expect(hasCustomMemberSplit({})).toBe(false)
      expect(hasCustomMemberSplit({ members: [] })).toBe(false)
    })

    it('is false for an equal split (members carry no amount)', () => {
      expect(hasCustomMemberSplit({ members: [{ amount: null }, { amount: null }] })).toBe(false)
      expect(hasCustomMemberSplit({ members: [{}, {}] })).toBe(false)
    })

    it('is true as soon as any member has a custom amount', () => {
      expect(hasCustomMemberSplit({ members: [{ amount: 90 }, { amount: 10 }] })).toBe(true)
      expect(hasCustomMemberSplit({ members: [{ amount: null }, { amount: 10 }] })).toBe(true)
      expect(hasCustomMemberSplit({ members: [{ amount: 0 }] })).toBe(true)
    })
  })

  it('calcPP still averages the total for equal splits', () => {
    expect(calcPP(100, 2)).toBe(50)
    expect(calcPP(100, 0)).toBeNull()
    expect(calcPP(100, null)).toBeNull()
  })

  describe('normalizePastedAmount', () => {
    it('keeps the last separator as the decimal point', () => {
      expect(normalizePastedAmount('1.234,56 €')).toBe('1234.56')
      expect(normalizePastedAmount('$1,234.56')).toBe('1234.56')
      expect(normalizePastedAmount('  -12,5 ')).toBe('-12.5')
    })

    it('drops everything that is not part of the number', () => {
      expect(normalizePastedAmount('EUR 1 234 567')).toBe('1234567')
      expect(normalizePastedAmount('42')).toBe('42')
      expect(normalizePastedAmount('abc')).toBe('')
    })
  })
})
