// FE-UTIL-DAYLABEL-001 to FE-UTIL-DAYLABEL-003
import { describe, it, expect } from 'vitest'
import { dayLabel } from './dayLabel'

const t = (key: string, params?: Record<string, string | number>) => `${key}:${params?.n}`

describe('dayLabel', () => {
  it('FE-UTIL-DAYLABEL-001: a title wins over the date', () => {
    expect(dayLabel({ title: 'Old Town', date: '2026-05-02' }, 1, t, 'en-US')).toBe('Old Town')
  })

  it('FE-UTIL-DAYLABEL-002: without a title the date reads as a short local weekday and day', () => {
    expect(dayLabel({ title: null, date: '2026-05-01' }, 0, t, 'en-US')).toBe('Fri, May 1')
    // A full timestamp names the same calendar day.
    expect(dayLabel({ title: '', date: '2026-05-03T09:30:00' }, 2, t, 'en-US')).toBe('Sun, May 3')
  })

  it('FE-UTIL-DAYLABEL-003: no title and no usable date falls back to the position, counted from one', () => {
    expect(dayLabel({ title: null, date: null }, 0, t, 'en-US')).toBe('dayplan.dayN:1')
    expect(dayLabel({ title: null, date: 'not-a-date' }, 4, t, 'en-US')).toBe('dayplan.dayN:5')
  })
})
