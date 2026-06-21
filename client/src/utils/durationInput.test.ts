import { describe, expect, it } from 'vitest'
import { formatDurationInput, parseDurationMinutes } from './durationInput'

describe('durationInput', () => {
  it('parses plain minute values', () => {
    expect(parseDurationMinutes('150')).toBe(150)
    expect(parseDurationMinutes(45)).toBe(45)
  })

  it('parses hour and minute unit values', () => {
    expect(parseDurationMinutes('2h')).toBe(120)
    expect(parseDurationMinutes('2 hr')).toBe(120)
    expect(parseDurationMinutes('150m')).toBe(150)
    expect(parseDurationMinutes('150 min')).toBe(150)
  })

  it('parses combined duration expressions', () => {
    expect(parseDurationMinutes('2h 30m')).toBe(150)
    expect(parseDurationMinutes('1.5 hours')).toBe(90)
    expect(parseDurationMinutes('1h, 15 min')).toBe(75)
  })

  it('rejects invalid or non-positive duration expressions', () => {
    expect(parseDurationMinutes('')).toBeNull()
    expect(parseDurationMinutes('soon')).toBeNull()
    expect(parseDurationMinutes('2 days')).toBeNull()
    expect(parseDurationMinutes('0m')).toBeNull()
  })

  it('allows zero when requested', () => {
    expect(parseDurationMinutes('0m', { allowZero: true })).toBe(0)
    expect(parseDurationMinutes('0 min', { allowZero: true })).toBe(0)
    expect(formatDurationInput(0, { allowZero: true })).toBe('0m')
  })

  it('formats minutes for editing', () => {
    expect(formatDurationInput(45)).toBe('45m')
    expect(formatDurationInput(120)).toBe('2h')
    expect(formatDurationInput(150)).toBe('2h 30m')
  })
})
