import { describe, expect, it, vi } from 'vitest'
import type { RoadtripDay, RoadtripStop } from '@trek/shared/roadtrip'
import { inspectorStay, locateStop, missedLeaveOf, readStay, shownStay, stayDraftOf } from './stayReading'

// FE-ROADTRIP-STAY-001..014: what a stay badge reads for a stop, and where the dialog
// finds the visit it opens on.

const stop = (over: Partial<RoadtripStop> = {}): RoadtripStop => ({
  assignmentId: 7,
  ownerDayId: 1,
  ownerIndex: 1,
  placeId: 70,
  name: 'Lueneburg',
  lat: 53.2,
  lng: 10.4,
  time: null,
  dwellMinutes: 30,
  legMode: null,
  incomingLegMode: null,
  stopType: null,
  ...over,
})

const entry = (arrival: string | null, departure: string | null) => ({ arrival, departure, anchored: false, dayOffset: 0 })

const day = (dayId: number, stops: RoadtripStop[], entries = stops.map(() => entry('10:00', '14:00'))): RoadtripDay =>
  ({ dayId, dayNumber: dayId, date: null, title: null, stops, schedule: { entries, warnings: [] } }) as unknown as RoadtripDay

describe('readStay', () => {
  it('FE-ROADTRIP-STAY-001: an ordinary stop reads the stay the place carries', () => {
    expect(readStay(stop(), entry('10:00', '10:30'))).toEqual({ minutes: 30, until: null })
  })

  it('FE-ROADTRIP-STAY-002: a stop left at a set time reads the stay the schedule made of it', () => {
    expect(readStay(stop({ leaveAt: '14:00' }), entry('10:00', '14:00'))).toEqual({ minutes: 240, until: '14:00' })
  })

  it('FE-ROADTRIP-STAY-003: a stay across midnight is not read as a negative one', () => {
    expect(readStay(stop({ leaveAt: '01:00' }), entry('23:30', '01:00')).minutes).toBe(90)
  })

  it('FE-ROADTRIP-STAY-004: without an arrival it can only say until when', () => {
    expect(readStay(stop({ leaveAt: '14:00:00' }), entry(null, '14:00'))).toEqual({ minutes: null, until: '14:00' })
  })

  it('FE-ROADTRIP-STAY-005: a leave time that is not a clock is no leave time', () => {
    expect(readStay(stop({ leaveAt: 'later' }), undefined)).toEqual({ minutes: 30, until: null })
  })

  it('FE-ROADTRIP-STAY-012: reached after the time, it is left on arrival and stays nothing', () => {
    expect(readStay(stop({ leaveAt: '14:00' }), entry('14:30', '14:30'))).toEqual({ minutes: 0, until: '14:00' })
  })

  it('FE-ROADTRIP-STAY-013: travel hours that end first give no length, only until when', () => {
    // Reached at half past ten, the window shuts at six, the End is at eight: the row's
    // 18:00 is where the day stops, not a departure, so seven and a half hours would be
    // a stay that ends neither at the End nor when the drive goes on the next morning.
    expect(readStay(stop({ leaveAt: '20:00' }), entry('10:30', '18:00'))).toEqual({
      minutes: null,
      until: '20:00',
      dayEndsFirst: true,
    })
  })
})

describe('shownStay', () => {
  it('FE-ROADTRIP-STAY-006: no stay on an ordinary stop shows nothing, a zero until a time shows zero', () => {
    expect(shownStay({ minutes: 0, until: null })).toBeNull()
    expect(shownStay({ minutes: null, until: null })).toBeNull()
    expect(shownStay({ minutes: 45, until: null })).toBe(45)
    expect(shownStay({ minutes: 0, until: '14:00' })).toBe(0)
  })
})

describe('locateStop', () => {
  it('FE-ROADTRIP-STAY-007: finds the visit on the card that draws it, starting at the one it names', () => {
    const drawn = stop({ ownerDayId: 1 })
    const days = [day(1, [stop({ assignmentId: 1 })]), day(2, [drawn])]
    const located = locateStop(days, 7, 1)
    expect(located).toMatchObject({ index: 0, stop: drawn })
    expect(located?.day.dayId).toBe(2)
    expect(locateStop(days, 99)).toBeNull()
  })

  it('FE-ROADTRIP-STAY-008: an automatic night standing on the stop is not the stop', () => {
    const night = stop({ automaticNight: { phase: 'end', fromDayNumber: 1 } })
    expect(locateStop([day(1, [night])], 7)).toBeNull()
  })
})

describe('the dialog draft', () => {
  it('FE-ROADTRIP-STAY-009: carries the visit, its end time and both of its clocks', () => {
    expect(stayDraftOf(stop({ leaveAt: '14:00' }), entry('10:00', '14:00'))).toEqual({
      placeId: 70,
      name: 'Lueneburg',
      minutes: 30,
      arrival: '10:00',
      departure: '14:00',
      leaveAt: '14:00',
      missedBy: null,
      assignmentId: 7,
      dayId: 1,
    })
  })

  it('FE-ROADTRIP-STAY-014: carries the finding of a missed time from the card, for the inspector too', () => {
    const visit = stop({ leaveAt: '14:00' })
    const late = {
      ...day(1, [stop({ assignmentId: 1 }), visit], [entry('13:30', '13:30'), entry('14:30', '14:30')]),
      schedule: {
        entries: [entry('13:30', '13:30'), entry('14:30', '14:30')],
        warnings: [
          { index: 1, code: 'late' as const, minutes: 5 },
          { index: 1, code: 'missedLeave' as const, minutes: 30 },
        ],
      },
    } as unknown as RoadtripDay
    expect(missedLeaveOf(late, 1)).toBe(30)
    expect(missedLeaveOf(late, 0)).toBeNull()
    expect(stayDraftOf(visit, entry('14:30', '14:30'), 30).missedBy).toBe(30)
    const onEdit = vi.fn()
    inspectorStay([late], visit, { id: 70, name: 'Lueneburg' }, onEdit).onEdit?.()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ missedBy: 30, departure: '14:30' }))
  })

  it('FE-ROADTRIP-STAY-010: the inspector tile reads the drive the rail reads', () => {
    const onEdit = vi.fn()
    const visit = stop({ leaveAt: '14:00' })
    const tile = inspectorStay([day(1, [visit])], visit, { id: 70, name: 'Lueneburg', duration_minutes: 30 }, onEdit)
    expect(tile).toMatchObject({ minutes: 240, until: '14:00' })
    tile.onEdit?.()
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ leaveAt: '14:00', arrival: '10:00', assignmentId: 7 }))
  })

  it('FE-ROADTRIP-STAY-011: a place not on the drive falls back to the stay it carries', () => {
    const onEdit = vi.fn()
    const tile = inspectorStay([], undefined, { id: 70, name: 'Lueneburg', duration_minutes: 45 }, onEdit)
    expect(tile).toMatchObject({ minutes: 45, until: null })
    tile.onEdit?.()
    expect(onEdit).toHaveBeenCalledWith({ placeId: 70, name: 'Lueneburg', minutes: 45, arrival: null })
    expect(inspectorStay([], stop({ dwellMinutes: 20 }), { id: 70, name: 'Lueneburg' }).onEdit).toBeUndefined()
    expect(inspectorStay([], stop({ dwellMinutes: 20 }), { id: 70, name: 'Lueneburg' }).minutes).toBe(20)
  })
})
