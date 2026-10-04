// FE-UTIL-DAYADD-001 to FE-UTIL-DAYADD-003
import { describe, it, expect } from 'vitest'
import { addIsoDays, MAX_TRIP_DAYS } from '@trek/shared'
import { datedDayOption } from './dayAdd'

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}|${Object.values(params).join('|')}` : key

describe('datedDayOption', () => {
  it('FE-UTIL-DAYADD-001: offers the day after the end date, or after a day dated past it', () => {
    const trip = { start_date: '2026-10-10', end_date: '2026-10-12' }
    expect(datedDayOption(trip, [{ date: '2026-10-10' }, { date: '2026-10-12' }, { date: null }], t))
      .toEqual({ nextDate: '2026-10-13', datedBlocked: null })
    expect(datedDayOption(trip, [{ date: '2026-10-14' }], t))
      .toEqual({ nextDate: '2026-10-15', datedBlocked: null })
  })

  it('FE-UTIL-DAYADD-002: a trip without dates has no dated day to offer', () => {
    expect(datedDayOption({ start_date: null, end_date: null }, [{ date: null }], t))
      .toEqual({ nextDate: null, datedBlocked: null })
    expect(datedDayOption({ start_date: '2026-10-10', end_date: null }, [], t))
      .toEqual({ nextDate: null, datedBlocked: null })
    expect(datedDayOption(null, [], t)).toEqual({ nextDate: null, datedBlocked: null })
  })

  it('FE-UTIL-DAYADD-003: a trip at the day limit names its date but says why it cannot grow', () => {
    const start = '2026-01-01'
    const end = addIsoDays(start, MAX_TRIP_DAYS - 1)
    expect(datedDayOption({ start_date: start, end_date: end }, [], t)).toEqual({
      nextDate: addIsoDays(end, 1),
      datedBlocked: `dashboard.tripTooLong|${MAX_TRIP_DAYS}`,
    })
  })
})
