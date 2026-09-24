import { describe, it, expect } from 'vitest'
import { convertHoursLine, isUnknownHoursLine, splitHoursLine } from './placeHoursFormat'

describe('convertHoursLine', () => {
  it('FE-PLANNER-HOURS-001: a range that stays in one half of the day carries the meridiem back to its opener', () => {
    // Google writes "1:00 – 3:00 PM" for one to three in the afternoon (#2412). The
    // opener used to stay "1:00" next to a converted "15:00".
    expect(convertHoursLine('Wednesday: 1:00 – 3:00 PM, 5:00 – 8:00 PM', '24h'))
      .toBe('Wednesday: 13:00 – 15:00, 17:00 – 20:00')
  })

  it('FE-PLANNER-HOURS-002: a range spelled on both sides is converted as written', () => {
    expect(convertHoursLine('Monday: 11:00 AM – 1:00 PM', '24h')).toBe('Monday: 11:00 – 13:00')
    expect(convertHoursLine('Friday: 5:00 PM – 2:00 AM', '24h')).toBe('Friday: 17:00 – 02:00')
  })

  it('FE-PLANNER-HOURS-003: twelve stays twelve in the afternoon and turns to zero after midnight', () => {
    expect(convertHoursLine('Sunday: 12:00 – 3:00 PM', '24h')).toBe('Sunday: 12:00 – 15:00')
    expect(convertHoursLine('Sunday: 12:00 – 1:00 AM', '24h')).toBe('Sunday: 00:00 – 01:00')
  })

  it('FE-PLANNER-HOURS-004: a morning range keeps its morning', () => {
    expect(convertHoursLine('Tuesday: 8:00 – 11:30 AM', '24h')).toBe('Tuesday: 08:00 – 11:30')
  })

  it('FE-PLANNER-HOURS-005: a plain hyphen separates the same way the en dash does', () => {
    expect(convertHoursLine('Thursday: 1:00-3:00 PM', '24h')).toBe('Thursday: 13:00-15:00')
  })

  it('FE-PLANNER-HOURS-006: the 12h display and lines without a meridiem are untouched', () => {
    expect(convertHoursLine('Wednesday: 1:00 – 3:00 PM', '12h')).toBe('Wednesday: 1:00 – 3:00 PM')
    expect(convertHoursLine('Montag: 11:30–23:00', '24h')).toBe('Montag: 11:30–23:00')
    expect(convertHoursLine('Saturday: Open 24 hours', '24h')).toBe('Saturday: Open 24 hours')
    expect(convertHoursLine('', '24h')).toBe('')
  })

  it('FE-PLANNER-HOURS-007: 24h lines become 12h, with the German "Uhr" dropped', () => {
    expect(convertHoursLine('Montag: 09:00 – 21:00 Uhr', '12h')).toBe('Montag: 9:00 AM – 9:00 PM')
    expect(convertHoursLine('Monday: 00:30 – 12:00', '12h')).toBe('Monday: 12:30 AM – 12:00 PM')
  })
})

describe('splitHoursLine', () => {
  it('FE-PLANNER-HOURS-008: splits on the first colon only, the fullwidth one included', () => {
    expect(splitHoursLine('Monday: 09:00-18:00')).toEqual(['Monday', '09:00-18:00'])
    expect(splitHoursLine('月曜日：9:00～18:00')).toEqual(['月曜日', '9:00～18:00'])
    expect(splitHoursLine('Open 24 hours')).toEqual(['', 'Open 24 hours'])
  })
})

describe('isUnknownHoursLine', () => {
  it('FE-PLANNER-HOURS-009: a bare question mark is the tag saying nothing', () => {
    expect(isUnknownHoursLine(' ? ')).toBe(true)
    expect(isUnknownHoursLine('09:00-18:00')).toBe(false)
  })
})
