import { describe, it, expect } from 'vitest'
import {
  getDayBookendHotels as sharedBookendHotels,
  getDayOrder as sharedDayOrder,
  isDayInAccommodationRange as sharedInRange,
} from '@trek/shared'
import { getDayBookendHotels, getDayOrder, isDayInAccommodationRange } from './dayOrder'

describe('the night hotels Days reads', () => {
  it('FE-UTIL-DAYORDER-001: are the rule in @trek/shared itself, not a copy of it', () => {
    expect(getDayOrder).toBe(sharedDayOrder)
    expect(isDayInAccommodationRange).toBe(sharedInRange)
    expect(getDayBookendHotels).toBe(sharedBookendHotels)
  })
})
