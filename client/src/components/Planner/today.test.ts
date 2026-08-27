import { describe, it, expect } from 'vitest'
import { findRelevantDayId, findTodayDayId, localToday } from './today'

describe('localToday', () => {
  it('FE-TODAY-001: reads the date off the local clock, not UTC', () => {
    // 08:00 in Tokyo on the 12th is still the 11th in UTC. Using toISOString()
    // here would tell a traveller in Japan that today is yesterday, every
    // morning, which is exactly who "jump to today" is for.
    const tokyoMorning = new Date(2026, 7, 12, 8, 0, 0)
    expect(localToday(tokyoMorning)).toBe('2026-08-12')

    // And the other end: late evening must not roll over into tomorrow.
    expect(localToday(new Date(2026, 7, 12, 23, 30, 0))).toBe('2026-08-12')
  })

  it('FE-TODAY-002: pads month and day to two digits', () => {
    expect(localToday(new Date(2026, 0, 5, 12, 0, 0))).toBe('2026-01-05')
  })
})

describe('findTodayDayId', () => {
  const days = [
    { id: 1, date: '2026-08-10' },
    { id: 2, date: '2026-08-11' },
    { id: 3, date: '2026-08-12' },
  ]
  const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 10, 0, 0)

  it('FE-TODAY-003: finds the day that is today', () => {
    expect(findTodayDayId(days, at(2026, 8, 11))).toBe(2)
  })

  it('FE-TODAY-004: is null when the trip is not running', () => {
    expect(findTodayDayId(days, at(2026, 8, 9))).toBeNull()
    expect(findTodayDayId(days, at(2026, 8, 13))).toBeNull()
    expect(findTodayDayId([], at(2026, 8, 11))).toBeNull()
  })

  it('FE-TODAY-005: a trip planned without dates has no today to jump to', () => {
    expect(findTodayDayId([{ id: 1, date: null }, { id: 2 }], at(2026, 8, 11))).toBeNull()
  })

  it('FE-TODAY-006: tolerates a full timestamp in the date column', () => {
    expect(findTodayDayId([{ id: 7, date: '2026-08-11T00:00:00.000Z' }], at(2026, 8, 11))).toBe(7)
  })
})

describe('findRelevantDayId', () => {
  const days = [
    { id: 1, date: '2026-08-10' },
    { id: 2, date: '2026-08-12' },
    { id: 3, date: '2026-08-14' },
  ]
  const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 10, 0, 0)

  it('FE-TODAY-007: keeps the exact local-calendar day when the trip is running', () => {
    expect(findRelevantDayId(days, at(2026, 8, 12))).toBe(2)
  })

  it('FE-TODAY-008: selects the next dated day before or between trip days', () => {
    expect(findRelevantDayId(days, at(2026, 8, 9))).toBe(1)
    expect(findRelevantDayId(days, at(2026, 8, 11))).toBe(2)
  })

  it('FE-TODAY-009: keeps the final day after the trip has finished', () => {
    expect(findRelevantDayId(days, at(2026, 8, 15))).toBe(3)
  })

  it('FE-TODAY-010: returns null when no dated day can be focused', () => {
    expect(findRelevantDayId([{ id: 1, date: null }, { id: 2 }], at(2026, 8, 11))).toBeNull()
    expect(findRelevantDayId([], at(2026, 8, 11))).toBeNull()
  })

  it('FE-TODAY-011: tolerates full timestamps and does not mutate caller order', () => {
    const timestampDays = [
      { id: 2, date: '2026-08-12T00:00:00.000Z' },
      { id: 1, date: '2026-08-10T00:00:00.000Z' },
    ]
    expect(findRelevantDayId(timestampDays, at(2026, 8, 11))).toBe(2)
    expect(timestampDays.map(day => day.id)).toEqual([2, 1])
  })
})
