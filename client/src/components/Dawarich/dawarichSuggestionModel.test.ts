// FE-DAWARICH-SUGMODEL-001 to FE-DAWARICH-SUGMODEL-014
import { describe, it, expect } from 'vitest'
import type { DawarichSuggestion } from '@trek/shared'
import {
  clockOf,
  formatDayHeading,
  formatDayOption,
  formatDuration,
  groupByDay,
  openStaysByDate,
  timeRange,
} from './dawarichSuggestionModel'

function stay(over: Partial<DawarichSuggestion> & { id: number; localDate: string }): DawarichSuggestion {
  return {
    id: over.id,
    sourceVisitId: String(over.id),
    tripId: over.tripId ?? null,
    tripTitle: over.tripTitle ?? null,
    name: over.name ?? 'Cafe Reichard',
    lat: over.lat ?? 50.94,
    lng: over.lng ?? 6.96,
    startedAt: over.startedAt ?? `${over.localDate}T10:15:00+02:00`,
    endedAt: over.endedAt ?? `${over.localDate}T12:40:00+02:00`,
    durationMinutes: over.durationMinutes ?? 145,
    localDate: over.localDate,
    sourceStatus: over.sourceStatus ?? 'suggested',
    confidence: over.confidence ?? null,
    confidenceBand: over.confidenceBand ?? null,
    state: over.state ?? 'new',
    target: over.target ?? null,
    acceptedPlaceId: over.acceptedPlaceId ?? null,
    acceptedJournalEntryId: over.acceptedJournalEntryId ?? null,
    acceptedBucketListItemId: over.acceptedBucketListItemId ?? null,
    sourceChanged: over.sourceChanged ?? false,
    sourceMissing: over.sourceMissing ?? false,
    matchedBucketListItemId: over.matchedBucketListItemId ?? null,
    matchedBucketListName: over.matchedBucketListName ?? null,
    countryCode: over.countryCode ?? null,
    firstSeenAt: over.firstSeenAt ?? '2026-09-10T06:00:00Z',
    lastSeenAt: over.lastSeenAt ?? '2026-09-10T06:00:00Z',
  }
}

const t = (key: string, params?: Record<string, unknown>): string =>
  `${key}:${JSON.stringify(params ?? {})}`

describe('groupByDay', () => {
  it('FE-DAWARICH-SUGMODEL-001: newest day first, earliest stay first within a day', () => {
    const days = groupByDay([
      stay({ id: 1, localDate: '2026-09-10', startedAt: '2026-09-10T18:00:00+02:00' }),
      stay({ id: 2, localDate: '2026-09-11' }),
      stay({ id: 3, localDate: '2026-09-10', startedAt: '2026-09-10T09:00:00+02:00' }),
    ])
    expect(days.map(d => d.date)).toEqual(['2026-09-11', '2026-09-10'])
    expect(days[1].stays.map(s => s.id)).toEqual([3, 1])
  })

  it('FE-DAWARICH-SUGMODEL-002: the colour counts from the oldest day, like the map does', () => {
    const days = groupByDay([
      stay({ id: 1, localDate: '2026-09-10' }),
      stay({ id: 2, localDate: '2026-09-11' }),
    ])
    const oldest = days.find(d => d.date === '2026-09-10')!
    const newest = days.find(d => d.date === '2026-09-11')!
    expect(oldest.color).not.toBe(newest.color)
    // Same input in a different order paints the same day the same colour.
    const again = groupByDay([
      stay({ id: 2, localDate: '2026-09-11' }),
      stay({ id: 1, localDate: '2026-09-10' }),
    ])
    expect(again.find(d => d.date === '2026-09-10')!.color).toBe(oldest.color)
  })

  it('FE-DAWARICH-SUGMODEL-003: nothing in, nothing out', () => {
    expect(groupByDay([])).toEqual([])
  })

  it('FE-DAWARICH-SUGMODEL-013: a day that already reads in order is left in it', () => {
    // Three stays rather than two: with two, a comparator that answered the
    // same thing both ways would still look right half the time.
    const input = [
      stay({ id: 1, localDate: '2026-09-10', startedAt: '2026-09-10T09:00:00+02:00' }),
      stay({ id: 2, localDate: '2026-09-10', startedAt: '2026-09-10T18:00:00+02:00' }),
      stay({ id: 3, localDate: '2026-09-10', startedAt: '2026-09-10T13:30:00+02:00' }),
    ]

    const days = groupByDay(input)

    expect(days).toHaveLength(1)
    expect(days[0].stays.map(s => s.id)).toEqual([1, 3, 2])
    // The list handed in belongs to the store. Sorting it in place would
    // reorder what the panel is rendering from underneath it.
    expect(input.map(s => s.id)).toEqual([1, 2, 3])
  })
})

describe('clockOf / timeRange', () => {
  it('FE-DAWARICH-SUGMODEL-004: reads the clock out of the timestamp\'s own offset', () => {
    expect(clockOf('2026-09-10T10:15:00+02:00')).toBe('10:15')
  })

  it('FE-DAWARICH-SUGMODEL-005: an unreadable timestamp has no clock', () => {
    expect(clockOf('yesterday')).toBe('')
    expect(clockOf('')).toBe('')
  })

  it('FE-DAWARICH-SUGMODEL-006: a range when both ends read, the arrival alone when the end does not', () => {
    expect(timeRange('2026-09-10T10:15:00+02:00', '2026-09-10T12:40:00+02:00', false)).toBe('10:15 – 12:40')
    expect(timeRange('2026-09-10T10:15:00+02:00', 'nonsense', false)).toBe('10:15')
  })

  it('FE-DAWARICH-SUGMODEL-007: no arrival, no range', () => {
    expect(timeRange('nonsense', '2026-09-10T12:40:00+02:00', false)).toBe('')
  })

  it('FE-DAWARICH-SUGMODEL-012: a twelve-hour clock gets twelve-hour times, both ends of the range', () => {
    // These were cut out of the timestamp and printed as they stood, so a traveller on a
    // 12-hour clock read every Dawarich time in 24-hour while the rest of the app obeyed
    // the setting.
    expect(timeRange('2026-09-10T10:15:00+02:00', '2026-09-10T12:40:00+02:00', true)).toBe('10:15 AM – 12:40 PM')
    expect(timeRange('2026-09-10T14:05:00+02:00', '2026-09-10T23:00:00+02:00', true)).toBe('2:05 PM – 11:00 PM')
    // Midnight is 12 AM, not 0 AM, and noon is 12 PM.
    expect(timeRange('2026-09-10T00:30:00+02:00', '2026-09-10T12:00:00+02:00', true)).toBe('12:30 AM – 12:00 PM')
  })
})

describe('formatDuration', () => {
  it('FE-DAWARICH-SUGMODEL-008: minutes under an hour, hours above it, both when there is a remainder', () => {
    expect(formatDuration(45, t)).toBe('dawarich.duration.minutes:{"minutes":45}')
    expect(formatDuration(120, t)).toBe('dawarich.duration.hours:{"hours":2}')
    expect(formatDuration(145, t)).toBe('dawarich.duration.hoursMinutes:{"hours":2,"minutes":25}')
  })
})

describe('formatDayHeading', () => {
  it('FE-DAWARICH-SUGMODEL-009: reads as the local date, not as yesterday', () => {
    // Built from the date parts rather than from a Date at midnight UTC, which
    // is the difference between "Thu, 10 Sept" and "Wed, 9 Sept" west of UTC.
    expect(formatDayHeading('2026-09-10', 'en-GB')).toContain('10')
    expect(formatDayHeading('2026-09-10', 'en-GB')).toMatch(/Thu/)
  })

  it('FE-DAWARICH-SUGMODEL-010: an unparseable date is shown as it came', () => {
    expect(formatDayHeading('not-a-date', 'en-GB')).toBe('not-a-date')
  })

  it('FE-DAWARICH-SUGMODEL-014: a date missing its month or its day is shown as it came too', () => {
    // Each guard on its own, because `Date` would rather guess than refuse:
    // month 0 rolls the heading back into December of the previous year, and a
    // missing day silently becomes the first of the month. Either one reads as
    // a real date, which is worse than showing the string that arrived.
    expect(formatDayHeading('2026-00-10', 'en-GB')).toBe('2026-00-10')
    expect(formatDayHeading('2026-09-00', 'en-GB')).toBe('2026-09-00')
    expect(formatDayHeading('2026-09', 'en-GB')).toBe('2026-09')
  })
})

describe('formatDayOption', () => {
  it('FE-DAWARICH-SUGMODEL-011: the day number is the label, the date rides along as a badge', () => {
    const option = formatDayOption(3, '2026-09-10', 'en-GB', t)
    expect(option.label).toBe('planner.dayN:{"n":3}')
    expect(option.badge).toMatch(/10/)
  })

  it('FE-DAWARICH-SUGMODEL-012: a day without a date gets no badge rather than an empty one', () => {
    expect(formatDayOption(1, null, 'en-GB', t)).toEqual({ label: 'planner.dayN:{"n":1}', badge: undefined })
  })
})

describe('openStaysByDate', () => {
  it('FE-DAWARICH-SUGMODEL-015: buckets the open stays by their own local day', () => {
    // What a journal timeline asks for: it draws one day and folds that day's stays into
    // it, so it looks them up by date rather than walking a flat list per day.
    const byDate = openStaysByDate([
      stay({ id: 1, localDate: '2026-09-10' }),
      stay({ id: 2, localDate: '2026-09-11' }),
      stay({ id: 3, localDate: '2026-09-10' }),
    ])

    expect([...byDate.keys()].sort()).toEqual(['2026-09-10', '2026-09-11'])
    expect(byDate.get('2026-09-10')!.map(s => s.id)).toEqual([1, 3])
  })

  it('FE-DAWARICH-SUGMODEL-016: within a day they are in the order they were lived', () => {
    // A run of stays reads as an afternoon only in that order; whatever order the server
    // sent them in is not it.
    const byDate = openStaysByDate([
      stay({ id: 1, localDate: '2026-09-10', startedAt: '2026-09-10T16:00:00+02:00' }),
      stay({ id: 2, localDate: '2026-09-10', startedAt: '2026-09-10T08:30:00+02:00' }),
      stay({ id: 3, localDate: '2026-09-10', startedAt: '2026-09-10T12:15:00+02:00' }),
    ])

    expect(byDate.get('2026-09-10')!.map(s => s.id)).toEqual([2, 3, 1])
  })

  it('FE-DAWARICH-SUGMODEL-017: only what is still waiting', () => {
    // An accepted stay is an entry on that timeline already, and a dismissed one was waved
    // away on purpose; offering either again is offering to do it twice.
    const byDate = openStaysByDate([
      stay({ id: 1, localDate: '2026-09-10', state: 'accepted' }),
      stay({ id: 2, localDate: '2026-09-10', state: 'dismissed' }),
      stay({ id: 3, localDate: '2026-09-10' }),
    ])

    expect(byDate.get('2026-09-10')!.map(s => s.id)).toEqual([3])
  })

  it('FE-DAWARICH-SUGMODEL-018: a day whose every stay is handled is not a day at all', () => {
    // An empty bucket would draw a fold saying "0 stays" on a day that has none.
    const byDate = openStaysByDate([stay({ id: 1, localDate: '2026-09-10', state: 'accepted' })])

    expect(byDate.size).toBe(0)
  })
})
