// FE-PLANNER-CATGUESS-001 to FE-PLANNER-CATGUESS-006
import { describe, it, expect } from 'vitest'
import { guessCategoryId, kindOfResult } from './placeCategoryGuess'

const seeded = [
  { id: 1, name: 'Hotel', icon: '🏨' },
  { id: 2, name: 'Restaurant', icon: '🍽️' },
  { id: 3, name: 'Attraction', icon: '🏛️' },
  { id: 4, name: 'Shopping', icon: '🛍️' },
  { id: 5, name: 'Transport', icon: '🚌' },
  { id: 6, name: 'Activity', icon: '🎯' },
  { id: 7, name: 'Bar/Cafe', icon: '☕' },
  { id: 8, name: 'Beach', icon: '🏖️' },
  { id: 9, name: 'Nature', icon: '🌿' },
  { id: 10, name: 'Other', icon: '📍' },
]

describe('guessCategoryId', () => {
  it('FE-PLANNER-CATGUESS-001: an OSM hotel lands in the Hotel category', () => {
    expect(guessCategoryId({ category: 'hotel' }, seeded)).toBe(1)
    expect(guessCategoryId({ category: 'guest_house' }, seeded)).toBe(1)
  })

  it('FE-PLANNER-CATGUESS-002: Google types are read in order, so a restaurant bar is still a bar', () => {
    expect(guessCategoryId({ types: ['restaurant', 'food', 'point_of_interest'] }, seeded)).toBe(2)
    expect(guessCategoryId({ types: ['bar', 'restaurant'] }, seeded)).toBe(7)
    expect(guessCategoryId({ types: ['museum', 'tourist_attraction'] }, seeded)).toBe(3)
  })

  it('FE-PLANNER-CATGUESS-003: a shop and a station find their categories', () => {
    expect(guessCategoryId({ category: 'shop_bakery' }, seeded)).toBe(7)
    expect(guessCategoryId({ category: 'shop_clothes' }, seeded)).toBe(4)
    expect(guessCategoryId({ types: ['train_station', 'transit_station'] }, seeded)).toBe(5)
  })

  it('FE-PLANNER-CATGUESS-004: renamed categories are still found, by a local name or their icon', () => {
    expect(guessCategoryId({ category: 'hotel' }, [{ id: 42, name: 'Unterkunft', icon: 'X' }])).toBe(42)
    expect(guessCategoryId({ category: 'hotel' }, [{ id: 43, name: 'Schlafen', icon: 'BedDouble' }])).toBe(43)
  })

  it('FE-PLANNER-CATGUESS-005: nothing to go on, or nothing that fits, leaves the field empty', () => {
    expect(guessCategoryId({}, seeded)).toBeNull()
    expect(guessCategoryId({ types: ['point_of_interest'] }, seeded)).toBeNull()
    expect(guessCategoryId({ category: 'hotel' }, [{ id: 1, name: 'Food', icon: '🍴' }])).toBeNull()
  })

  it('FE-PLANNER-CATGUESS-006: the kind is read from any source vocabulary', () => {
    expect(kindOfResult({ category: 'italian_restaurant' })).toBe('food')
    expect(kindOfResult({ category: 'beach' })).toBe('beach')
    expect(kindOfResult({ types: ['park'] })).toBe('nature')
    expect(kindOfResult({ category: 'swimming_pool' })).toBe('activity')
  })
})
