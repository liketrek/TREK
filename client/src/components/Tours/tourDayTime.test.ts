// TIME-02-001 to TIME-02-010: a tour's start and end on its day, and an end that runs into the next timed item.
import type { TourListItem } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { MergedItem } from '../../utils/dayMerge';
import { dayItemOverrun, tourDayEntryOf, tourDayTimeOf, tourOverrunOf } from './tourDayTime';

const planned: TourListItem = {
  place_id: 7,
  name: 'Ridge',
  tour_type: 'hike',
  distance: 8,
  elevation_gain: 300,
  elevation_loss: 300,
  duration: 150,
  planned_duration_minutes: null,
  break_additional_minutes: 30,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: 2,
  planned: true,
  caution: false,
};

// 12 km, 300 m up and 500 m down, never timed by the planner: estimated at 4 h.
const imported: TourListItem = {
  ...planned,
  distance: 12,
  elevation_loss: 500,
  duration: null,
  break_additional_minutes: null,
  max_hiking_difficulty: null,
};

describe('tourDayTimeOf', () => {
  it('TIME-02-001: the end follows as the start plus the planned total, marked as worked out', () => {
    expect(tourDayTimeOf({ start: '09:00', end: null }, planned)).toEqual({
      start: '09:00',
      end: '12:00',
      endMinutes: 720,
      workedOut: true,
      estimated: false,
      atLeast: false,
      nextDay: false,
      totalMinutes: 180,
    });
  });

  it('TIME-02-002: a total entered by hand is the total, and an import is worked out with its estimate', () => {
    const entered = { ...planned, planned_duration_minutes: 300 };
    expect(tourDayTimeOf({ start: '09:00', end: '' }, entered)?.end).toBe('14:00');
    expect(tourDayTimeOf({ start: '9:30', end: null }, imported)).toMatchObject({
      end: '13:30',
      workedOut: true,
      estimated: true,
    });
  });

  it('TIME-02-003: an end typed by hand wins and is no worked-out end; one before the start is on the next day', () => {
    expect(tourDayTimeOf({ start: '09:00', end: '15:15' }, planned)).toMatchObject({
      end: '15:15',
      endMinutes: 915,
      workedOut: false,
      totalMinutes: null,
    });
    expect(tourDayTimeOf({ start: '22:00', end: '01:00' }, planned)).toMatchObject({
      endMinutes: 1500,
      nextDay: true,
    });
  });

  it('TIME-02-004: without a start there is no time, and without a known total no end', () => {
    expect(tourDayTimeOf({ start: null, end: '12:00' }, planned)).toBeNull();
    expect(tourDayTimeOf({ start: 'later', end: null }, planned)).toBeNull();
    const unknown = { ...imported, elevation_gain: null, elevation_loss: null };
    expect(tourDayTimeOf({ start: '09:00', end: null }, unknown)).toMatchObject({ end: null, workedOut: false });
  });

  it('TIME-02-005: past midnight it ends on the next day', () => {
    expect(tourDayTimeOf({ start: '22:30', end: null }, planned)).toMatchObject({
      end: '01:30',
      endMinutes: 1530,
      nextDay: true,
    });
  });

  it('TIME-02-006: a day holding one stage of a multi-day tour gets no end worked out from the whole route', () => {
    expect(tourDayTimeOf({ start: '09:00', end: null, stageKey: 'stop-2' }, planned)).toMatchObject({
      end: null,
      workedOut: false,
    });
  });

  it("TIME-02-007: a day entry's own times come before the place's", () => {
    const place = { id: 7, name: 'Ridge', place_time: '08:00', end_time: '10:00' };
    const entry = { assignment_time: '09:00', assignment_end_time: null, tour_stage_key: null, place };
    expect(tourDayEntryOf(entry as unknown as Parameters<typeof tourDayEntryOf>[0])).toEqual({
      start: '09:00',
      end: '10:00',
      stageKey: null,
    });
  });
});

const placeItem = (id: number, name: string, time: string | null, extra: Record<string, unknown> = {}): MergedItem => ({
  type: 'place',
  sortKey: id,
  data: { id, place_id: id, place: { id, name, place_time: time, end_time: null }, ...extra },
});
const note = (time: string | null, text: string): MergedItem => ({ type: 'note', sortKey: 0, data: { text, time } });
const train = (time: string, title: string): MergedItem => ({
  type: 'transport',
  sortKey: 0,
  data: { title, day_id: 3, reservation_time: `2026-07-10T${time}` },
});

describe('tourOverrunOf', () => {
  it('TIME-02-008: names the next timed item the end runs past, passing over the untimed ones between', () => {
    const end = { endMinutes: 13 * 60 };
    expect(tourOverrunOf([note(null, 'Snack'), placeItem(2, 'Museum', '12:30')], 3, end)).toEqual({
      name: 'Museum',
      time: '12:30',
      end: '13:00',
    });
    expect(tourOverrunOf([train('12:45', 'Train home')], 3, end)).toEqual({
      name: 'Train home',
      time: '12:45',
      end: '13:00',
    });
    expect(tourOverrunOf([note('12:00', 'Call')], 3, end)).toMatchObject({ name: 'Call' });
  });

  it('TIME-02-009: says nothing when the end is in time, at the next start, unknown, or nothing timed follows', () => {
    const atTheStart = [placeItem(2, 'Museum', '13:00'), placeItem(3, 'Cafe', '12:00')];
    expect(tourOverrunOf(atTheStart, 3, { endMinutes: 780 })).toBeNull();
    expect(tourOverrunOf([placeItem(2, 'Museum', '12:00')], 3, { endMinutes: null })).toBeNull();
    expect(tourOverrunOf([placeItem(2, 'Museum', '12:00')], 3, null)).toBeNull();
    expect(tourOverrunOf([placeItem(2, 'Museum', null)], 3, { endMinutes: 780 })).toBeNull();
  });
});

describe('dayItemOverrun', () => {
  it('TIME-02-010: reads the tour of a day item off the trip tours, and a plain place never runs over', () => {
    const tourItem = placeItem(7, 'Ridge', '10:00', { tour_place_id: 7, assignment_time: '10:00' });
    const items = [tourItem, placeItem(2, 'Lunch', '12:00')];
    const tourOf = (placeId: number) => (placeId === 7 ? planned : undefined);
    expect(dayItemOverrun(items, 0, 3, tourOf)).toEqual({ name: 'Lunch', time: '12:00', end: '13:00' });
    expect(dayItemOverrun(items, 1, 3, tourOf)).toBeNull();
    expect(dayItemOverrun(items, 0, 3, () => undefined)).toBeNull();
    expect(dayItemOverrun([note('09:00', 'Wake'), ...items], 0, 3, tourOf)).toBeNull();
    // A tour just added to the day, online or offline, carries no tour_place_id yet and still runs over.
    const fresh = placeItem(7, 'Ridge', '10:00', { assignment_time: '10:00' });
    expect(dayItemOverrun([fresh, placeItem(2, 'Lunch', '12:00')], 0, 3, tourOf)).toEqual({
      name: 'Lunch',
      time: '12:00',
      end: '13:00',
    });
  });
});
