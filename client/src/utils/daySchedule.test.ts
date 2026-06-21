import { describe, expect, it } from 'vitest'
import { buildActivitySchedule, getMaxSleepMinutes } from './daySchedule'
import type { Assignment, Day } from '../types'

const day = (wake_up_time = '08:00'): Pick<Day, 'wake_up_time'> => ({ wake_up_time })

const assignment = (
  id: number,
  duration_minutes: number,
  place_time?: string | null,
  overrides: Partial<Assignment> = {},
): Assignment => ({
  id,
  day_id: 1,
  place_id: id,
  order_index: id,
  notes: null,
  duration_minutes,
  ...overrides,
  place: {
    id,
    name: `Place ${id}`,
    duration_minutes: 15,
    place_time: place_time ?? null,
    ...overrides.place,
  },
} as Assignment)

describe('daySchedule', () => {
  it('builds activity timestamps from wake up time and durations', () => {
    const slots = buildActivitySchedule(day('09:30'), [
      assignment(1, 70),
      assignment(2, 50),
    ])

    expect(slots[1]).toMatchObject({ start: '09:30', end: '10:40' })
    expect(slots[2]).toMatchObject({ start: '10:40', end: '11:30' })
  })

  it('ignores legacy explicit activity times because timestamps are calculated', () => {
    const slots = buildActivitySchedule(day('08:00'), [
      assignment(1, 60, '10:00'),
      assignment(2, 30),
    ])

    expect(slots[1]).toMatchObject({ start: '08:00', end: '09:00' })
    expect(slots[2]).toMatchObject({ start: '09:00', end: '09:30' })
  })

  it('adds route travel time before and between activities', () => {
    const slots = buildActivitySchedule(day('09:00'), [
      assignment(1, 60),
      assignment(2, 30),
    ], {
      initialTravelMinutes: 15,
      travelAfterAssignmentMinutes: { 1: 20 },
    })

    expect(slots[1]).toMatchObject({ start: '09:15', end: '10:15' })
    expect(slots[2]).toMatchObject({ start: '10:35', end: '11:05' })
  })

  it('adds assignment margins outside activity duration', () => {
    const slots = buildActivitySchedule(day('08:00'), [
      assignment(1, 60, null, { margin_before_minutes: 15, margin_after_minutes: 10 }),
      assignment(2, 30),
    ])

    expect(slots[1]).toMatchObject({
      start: '08:15',
      end: '09:15',
      durationMinutes: 60,
      marginBeforeMinutes: 15,
      marginAfterMinutes: 10,
    })
    expect(slots[2]).toMatchObject({ start: '09:25', end: '09:55' })
  })

  it('calculates max sleep until the next wake up time', () => {
    expect(getMaxSleepMinutes(day('08:00'), [assignment(1, 120)], day('07:30'))).toBe(1290)
  })

  it('subtracts route travel time from max sleep', () => {
    expect(getMaxSleepMinutes(day('08:00'), [assignment(1, 120)], day('07:30'), {
      initialTravelMinutes: 15,
      finalTravelMinutes: 20,
    })).toBe(1255)
  })

  it('subtracts assignment margins from max sleep', () => {
    expect(getMaxSleepMinutes(day('08:00'), [
      assignment(1, 120, null, { margin_before_minutes: 15, margin_after_minutes: 10 }),
    ], day('07:30'))).toBe(1265)
  })

  it('treats the next wake up as the following day for empty days', () => {
    expect(getMaxSleepMinutes(day('08:00'), [], day('08:00'))).toBe(1440)
  })
})
