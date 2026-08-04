// FE-W4CNH-001 to FE-W4CNH-008
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { formatTimestamp } from './CollabNotes.helpers'

// The helper feeds t() with a key and params; echo them so the branches are visible.
const t = (key: string, params?: Record<string, number>) =>
  params ? `${key}:${Object.values(params)[0]}` : key

const NOW = new Date('2026-06-15T12:00:00Z')

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

function ago(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString().replace('Z', '')
}

describe('formatTimestamp', () => {
  it('FE-W4CNH-001: renders an empty string for a missing timestamp', () => {
    expect(formatTimestamp(null, t, 'en')).toBe('')
    expect(formatTimestamp('', t, 'en')).toBe('')
  })

  it('FE-W4CNH-002: labels the last minute as just now', () => {
    expect(formatTimestamp(ago(0), t, 'en')).toBe('collab.chat.justNow')
  })

  it('FE-W4CNH-003: counts minutes below the hour', () => {
    expect(formatTimestamp(ago(5), t, 'en')).toBe('collab.chat.minutesAgo:5')
    expect(formatTimestamp(ago(59), t, 'en')).toBe('collab.chat.minutesAgo:59')
  })

  it('FE-W4CNH-004: counts hours below the day', () => {
    expect(formatTimestamp(ago(60), t, 'en')).toBe('collab.chat.hoursAgo:1')
    expect(formatTimestamp(ago(60 * 23), t, 'en')).toBe('collab.chat.hoursAgo:23')
  })

  it('FE-W4CNH-005: counts days below a week', () => {
    expect(formatTimestamp(ago(60 * 24), t, 'en')).toBe('collab.notes.daysAgo:1')
    expect(formatTimestamp(ago(60 * 24 * 6), t, 'en')).toBe('collab.notes.daysAgo:6')
  })

  it('FE-W4CNH-006: falls back to a localized short date beyond a week', () => {
    expect(formatTimestamp(ago(60 * 24 * 10), t, 'en-US')).toBe('Jun 5')
  })

  it('FE-W4CNH-007: treats a naive timestamp as UTC and accepts an explicit Z', () => {
    const withZ = new Date(NOW.getTime() - 5 * 60_000).toISOString()
    expect(formatTimestamp(withZ, t, 'en')).toBe('collab.chat.minutesAgo:5')
  })

  it('FE-W4CNH-008: falls back to English labels when the translation is missing', () => {
    const empty = () => ''
    expect(formatTimestamp(ago(0), empty, 'en')).toBe('just now')
    expect(formatTimestamp(ago(5), empty, 'en')).toBe('5m ago')
    expect(formatTimestamp(ago(120), empty, 'en')).toBe('2h ago')
    expect(formatTimestamp(ago(60 * 24 * 2), empty, 'en')).toBe('2d ago')
  })
})
