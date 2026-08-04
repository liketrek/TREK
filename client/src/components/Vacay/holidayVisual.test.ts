// FE-COMP-VCYVIS-001 to FE-COMP-VCYVIS-004
import { describe, it, expect } from 'vitest'
import { schoolHolidayBand, schoolHolidayWash } from './holidayVisual'

describe('holidayVisual', () => {
  it('FE-COMP-VCYVIS-001: a day without a school break has no band', () => {
    expect(schoolHolidayBand([])).toBe('transparent')
  })

  it('FE-COMP-VCYVIS-002: one calendar paints the band in its own colour', () => {
    expect(schoolHolidayBand(['#bbf7d0'])).toBe('#bbf7d0')
  })

  it('FE-COMP-VCYVIS-003: several calendars split the band into equal segments', () => {
    expect(schoolHolidayBand(['#bbf7d0', '#fecaca'])).toBe(
      'linear-gradient(90deg, #bbf7d0 0% 50%, #fecaca 50% 100%)',
    )
  })

  it('FE-COMP-VCYVIS-004: the band caps at three segments', () => {
    const band = schoolHolidayBand(['#a', '#b', '#c', '#d'])
    expect(band).toBe('linear-gradient(90deg, #a 0% 33%, #b 33% 67%, #c 67% 100%)')
    expect(band).not.toContain('#d')
  })

  it('FE-COMP-VCYVIS-005: the wash keeps the calendar colour at a readable 15%', () => {
    expect(schoolHolidayWash('#bbf7d0')).toBe('color-mix(in srgb, #bbf7d0 15%, transparent)')
  })
})
