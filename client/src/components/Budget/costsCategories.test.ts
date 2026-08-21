import { describe, it, expect } from 'vitest'
import { COST_CATEGORIES, typeToCostCategory } from '@trek/shared'
import { COST_CAT_META, COST_CATEGORY_LIST, catMeta } from './costsCategories'

describe('COST_CAT_META', () => {
  it('has metadata for every fixed category, including fuel and parking', () => {
    for (const key of COST_CATEGORIES) {
      expect(COST_CAT_META[key]).toBeDefined()
      expect(COST_CAT_META[key].key).toBe(key)
    }
  })

  it('derives COST_CATEGORY_LIST in the same order as COST_CATEGORIES', () => {
    expect(COST_CATEGORY_LIST.map(m => m.key)).toEqual([...COST_CATEGORIES])
  })
})

describe('catMeta', () => {
  it('resolves fuel and parking directly', () => {
    expect(catMeta('fuel').key).toBe('fuel')
    expect(catMeta('parking').key).toBe('parking')
  })

  it('maps legacy/free-text aliases to the new categories', () => {
    expect(catMeta('gas').key).toBe('fuel')
    expect(catMeta('petrol').key).toBe('fuel')
    expect(catMeta('Parking').key).toBe('parking')
    expect(catMeta('car park').key).toBe('parking')
  })

  it('resolves a parking booking the same way whichever path created the expense', () => {
    expect(catMeta(typeToCostCategory('parking')).key).toBe('parking')
    expect(catMeta('parking').key).toBe(typeToCostCategory('parking'))
  })

  it('falls back to other for unknown categories', () => {
    expect(catMeta('made-up-category').key).toBe('other')
    expect(catMeta(null).key).toBe('other')
  })
})
