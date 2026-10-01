// FE-JOURNEY-PHOTOORDER-001 (#824)
import { describe, it, expect } from 'vitest'
import { movedTo } from './useEntryPhotoOrder'

describe('movedTo', () => {
  it('FE-JOURNEY-PHOTOORDER-001: moves an item to a new place and leaves the list alone otherwise', () => {
    expect(movedTo(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(movedTo(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    const same = ['a', 'b']
    expect(movedTo(same, 1, 1)).toBe(same)
    expect(movedTo(same, 5, 0)).toBe(same)
  })
})
