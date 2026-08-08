import { describe, it, expect } from 'vitest'
import { katColor, itemWeight, bagFillPct, countsTowardsMyLoad, parseCsvLine, parseImportLines } from './packingListPanel.helpers'
import { KAT_COLORS } from './packingListPanel.constants'

describe('packingListPanel.helpers', () => {
  describe('katColor', () => {
    it('maps a category to its palette slot by index', () => {
      const cats = ['Documents', 'Clothing', 'Toiletries']
      expect(katColor('Documents', cats)).toBe(KAT_COLORS[0])
      expect(katColor('Clothing', cats)).toBe(KAT_COLORS[1])
      expect(katColor('Toiletries', cats)).toBe(KAT_COLORS[2])
    })

    it('cycles the palette when the index exceeds palette length', () => {
      const cats = Array.from({ length: KAT_COLORS.length + 1 }, (_, i) => `cat${i}`)
      expect(katColor(`cat${KAT_COLORS.length}`, cats)).toBe(KAT_COLORS[0])
    })

    it('falls back to a deterministic hash when the category is not in the list', () => {
      const a = katColor('Missing', ['Other'])
      const b = katColor('Missing', ['Other'])
      expect(a).toBe(b)
      expect(KAT_COLORS).toContain(a)
    })

    it('falls back to hash when no category list is provided', () => {
      const color = katColor('Anything')
      expect(KAT_COLORS).toContain(color)
    })
  })

  describe('itemWeight', () => {
    it('multiplies unit weight by quantity', () => {
      expect(itemWeight({ weight_grams: 250, quantity: 3 })).toBe(750)
    })

    it('defaults quantity to 1 and weight to 0', () => {
      expect(itemWeight({ weight_grams: 120 })).toBe(120)
      expect(itemWeight({ quantity: 5 })).toBe(0)
      expect(itemWeight({})).toBe(0)
    })

    it('treats null weight/quantity as their defaults', () => {
      expect(itemWeight({ weight_grams: null, quantity: null })).toBe(0)
      expect(itemWeight({ weight_grams: 100, quantity: null })).toBe(100)
    })
  })

  describe('countsTowardsMyLoad', () => {
    it('counts the common pool for everyone', () => {
      // owner_id is stamped on every item, common ones included — filtering by it alone
      // would shrink the group total to "only what I entered myself".
      expect(countsTowardsMyLoad({ is_private: 0, owner_id: 2 }, 1)).toBe(true)
    })

    it('counts my own private items', () => {
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: 1 }, 1)).toBe(true)
    })

    it('leaves out an item somebody else shared with me', () => {
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: 2 }, 1)).toBe(false)
    })

    it('counts unowned legacy rows', () => {
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: null }, 1)).toBe(true)
    })

    it('filters nothing when the viewer is unknown', () => {
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: 2 }, null)).toBe(true)
      expect(countsTowardsMyLoad({ is_private: 1, owner_id: 2 }, undefined)).toBe(true)
    })
  })

  describe('bagFillPct', () => {
    it('measures against the bag limit when there is one', () => {
      expect(bagFillPct(5000, 20000, 99999)).toBe(25)
      expect(bagFillPct(20000, 20000, 1)).toBe(100)
    })

    it('never reports more than full', () => {
      expect(bagFillPct(30000, 20000, 1)).toBe(100)
    })

    it('falls back to the heaviest bag when no limit is set', () => {
      expect(bagFillPct(2500, null, 5000)).toBe(50)
      expect(bagFillPct(2500, undefined, 5000)).toBe(50)
      expect(bagFillPct(0, 0, 5000)).toBe(0)
    })

    it('does not divide by zero on an empty trip', () => {
      expect(bagFillPct(0, null, 0)).toBe(0)
    })
  })

  describe('parseCsvLine', () => {
    it('splits on comma, semicolon and tab and trims fields', () => {
      expect(parseCsvLine('a, b ;c\td')).toEqual(['a', 'b', 'c', 'd'])
    })

    it('keeps quoted separators inside one field', () => {
      expect(parseCsvLine('Clothing,"Shirt, blue",200')).toEqual(['Clothing', 'Shirt, blue', '200'])
    })

    it('returns the single field for a line without separators', () => {
      expect(parseCsvLine('Passport')).toEqual(['Passport'])
    })
  })

  describe('parseImportLines', () => {
    it('parses a full row into name/category/weight/bag/checked', () => {
      const [row] = parseImportLines('Documents, Passport, 50, Backpack, checked')
      expect(row).toEqual({ name: 'Passport', category: 'Documents', weight_grams: '50', bag: 'Backpack', checked: true })
    })

    it('treats "1" as checked and anything else as unchecked', () => {
      expect(parseImportLines('Cat, A, , , 1')[0].checked).toBe(true)
      expect(parseImportLines('Cat, B, , , nope')[0].checked).toBe(false)
    })

    it('treats a single value as just a name with no category', () => {
      const [row] = parseImportLines('Sunglasses')
      expect(row).toEqual({ name: 'Sunglasses', category: undefined, weight_grams: undefined, bag: undefined, checked: false })
    })

    it('skips blank lines and rows without a name', () => {
      const rows = parseImportLines('Documents, Passport\n\n   \n,')
      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe('Passport')
    })
  })
})
