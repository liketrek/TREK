import { describe, expect, it } from 'vitest'
import { defaultVacayYear } from './vacayStore'

describe('defaultVacayYear', () => {
  it('selects the current year instead of the newest configured year', () => {
    expect(defaultVacayYear([2025, 2026, 2027], 2026)).toBe(2026)
  })

  it('uses the nearest past year when the current year is not configured', () => {
    expect(defaultVacayYear([2024, 2025, 2027], 2026)).toBe(2025)
  })

  it('uses the earliest future year when only future years exist', () => {
    expect(defaultVacayYear([2028, 2027], 2026)).toBe(2027)
  })
})
