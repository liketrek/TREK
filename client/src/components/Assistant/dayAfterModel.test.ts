/**
 * FE-AI-DAYAFTER-001 to FE-AI-DAYAFTER-009
 *
 * A day as it would read once a card's waiting changes ran, without React: who
 * stays, who joins at the end and who leaves, the way between two stops as a
 * straight-line estimate, free time and clashes, and where the map looks.
 */
import type { AssistantChangeEffect } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { buildAssignment, buildPlace } from '../../../tests/helpers/factories';
import type { AssignmentsMap } from '../../types';
import { buildDayAfter, changedDays, changePoints, type DayChange, minutesOf } from './dayAfterModel';

// 0.01° of latitude is 1.112 km: with the detour factor that is 19 minutes on foot, 6 by bike.
const louvre = buildPlace({ id: 10, name: 'Louvre', lat: 48.0, lng: 2.0, duration_minutes: 60 });
const orsay = buildPlace({ id: 11, name: 'Orsay', lat: 48.01, lng: 2.0, duration_minutes: 60 });
const hotel = buildPlace({ id: 12, name: 'Hotel', lat: 48.02, lng: 2.0 });

function plan(): AssignmentsMap {
  return {
    3: [
      buildAssignment({ id: 101, day_id: 3, order_index: 1, place: orsay, assignment_time: '13:00' }),
      buildAssignment({ id: 100, day_id: 3, order_index: 0, place: louvre, assignment_time: '09:00' }),
      buildAssignment({ id: 102, day_id: 3, order_index: 2, place: hotel, accommodation_id: 7 }),
    ],
    4: [],
  };
}

function effect(over: Partial<AssistantChangeEffect>): AssistantChangeEffect {
  return { kind: 'add', dayId: 3, fromDayId: null, placeId: null, assignmentId: null, place: null, ...over };
}

const change = (toolCallId: string, e: AssistantChangeEffect, subject: string | null = null): DayChange => ({
  toolCallId,
  effect: e,
  subject,
});

function day(dayId: number, changes: DayChange[], assignments = plan()) {
  return buildDayAfter({ dayId, assignments, places: [louvre, orsay, hotel], changes, defaultMode: 'walking' });
}

describe('dayAfterModel', () => {
  it('FE-AI-DAYAFTER-001: keeps the day in order without hotel stops, and reads the way and free time', () => {
    const { stops } = day(3, []);
    expect(stops.map((s) => [s.name, s.status, s.time])).toEqual([
      ['Louvre', 'kept', '09:00'],
      ['Orsay', 'kept', '13:00'],
    ]);
    expect(stops[0]?.lead).toBeNull();
    // 09:00 plus an hour, 19 minutes on foot, so 161 minutes are left before 13:00.
    expect(stops[1]?.lead).toEqual({ travelMinutes: 19, freeMinutes: 161, overlapsWith: null, shortBy: null });
  });

  it('FE-AI-DAYAFTER-002: a new place joins at the end, named and placed by the change', () => {
    const pantheon = effect({ place: { name: 'Pantheon', lat: 48.02, lng: 2.0, categoryId: null } });
    const { stops } = day(3, [change('c1', pantheon)]);
    const last = stops[stops.length - 1];
    expect(last).toMatchObject({ key: 'new:c1', name: 'Pantheon', status: 'new', toolCallId: 'c1', time: null });
    expect(last?.lead).toEqual({ travelMinutes: 19, freeMinutes: null, overlapsWith: null, shortBy: null });
  });

  it('FE-AI-DAYAFTER-003: a planned place joins by its id; a change with nothing to name it by is left out', () => {
    const { stops } = day(4, [change('c1', effect({ dayId: 4, placeId: 11 })), change('c2', effect({ dayId: 4 }))]);
    expect(stops.map((s) => s.name)).toEqual(['Orsay']);
    const named = day(4, [change('c3', effect({ dayId: 4, placeId: 99 }), 'Sainte-Chapelle')]);
    expect(named.stops.map((s) => s.name)).toEqual(['Sainte-Chapelle']);
  });

  it('FE-AI-DAYAFTER-004: a removed stop stays struck in place; the next one follows the stop before it', () => {
    const { stops } = day(3, [change('c1', effect({ kind: 'remove', placeId: 11, assignmentId: 101 }))]);
    expect(stops.map((s) => [s.name, s.status, s.toolCallId])).toEqual([
      ['Louvre', 'kept', null],
      ['Orsay', 'removed', 'c1'],
    ]);
    expect(stops[1]?.lead).toBeNull();
  });

  it('FE-AI-DAYAFTER-005: a move leaves one day and joins the other with its own time', () => {
    const move = change('c1', effect({ kind: 'move', dayId: 4, fromDayId: 3, placeId: 10, assignmentId: 100 }));
    expect(day(3, [move]).stops.map((s) => [s.name, s.status])).toEqual([
      ['Louvre', 'removed'],
      ['Orsay', 'kept'],
    ]);
    expect(day(4, [move]).stops).toEqual([
      expect.objectContaining({ key: 'new:c1', name: 'Louvre', status: 'new', time: '09:00', lead: null }),
    ]);
    // Within one day the order is the server's to set; the card leaves the day as it is.
    const within = change('c2', effect({ kind: 'move', dayId: 3, fromDayId: 3, placeId: 10, assignmentId: 100 }));
    expect(day(3, [within]).stops.map((s) => s.status)).toEqual(['kept', 'kept']);
  });

  it('FE-AI-DAYAFTER-006: stops at the same time clash, a short break is no line, a bike is faster', () => {
    const tight = plan();
    tight[3] = [
      buildAssignment({ id: 100, day_id: 3, order_index: 0, place: louvre, assignment_time: '09:00' }),
      buildAssignment({ id: 101, day_id: 3, order_index: 1, place: orsay, assignment_time: '09:30' }),
    ];
    expect(day(3, [], tight).stops[1]?.lead?.overlapsWith).toBe('Louvre');

    const short = plan();
    short[3] = [
      buildAssignment({
        id: 100,
        day_id: 3,
        order_index: 0,
        place: louvre,
        assignment_time: '09:00',
        leg_transport_mode: 'cycling',
      }),
      buildAssignment({ id: 101, day_id: 3, order_index: 1, place: orsay, assignment_time: '10:30' }),
    ];
    const lead = day(3, [], short).stops[1]?.lead;
    expect(lead?.travelMinutes).toBe(6);
    // 10:00 to 10:30 less the ride leaves 24 minutes, under GAP_MIN_MINUTES.
    expect(lead?.freeMinutes).toBeNull();
  });

  it('FE-AI-DAYAFTER-007: only a clock time counts as a time', () => {
    expect(minutesOf('09:30')).toBe(570);
    expect(minutesOf('7:05 am')).toBe(425);
    expect(minutesOf('25:00')).toBeNull();
    expect(minutesOf('noon')).toBeNull();
    expect(minutesOf(null)).toBeNull();
  });

  it('FE-AI-DAYAFTER-008: the days follow the changes, and the map looks at the places and their days', () => {
    const move = change('c1', effect({ kind: 'move', dayId: 4, fromDayId: 3, placeId: 10, assignmentId: 100 }));
    const pantheon = { name: 'Pantheon', lat: 41.9, lng: 12.48, categoryId: null };
    const add = change('c2', effect({ dayId: 4, place: pantheon }));
    expect(changedDays([move, add])).toEqual([4, 3]);
    expect(changePoints([move, add], plan(), [louvre, orsay, hotel])).toEqual([
      [48.0, 2.0],
      [41.9, 12.48],
      [48.01, 2.0],
      [48.0, 2.0],
      [48.02, 2.0],
    ]);
  });

  it('FE-AI-DAYAFTER-009: a way longer than the time between two stops is too tight by the difference', () => {
    // Louvre until 10:00, then 19 minutes on foot to Orsay, which starts at 10:10: nine minutes short.
    const tight = plan();
    tight[3] = (tight[3] ?? []).map((a) => (a.id === 101 ? { ...a, assignment_time: '10:10' } : a));
    const after = day(3, [], tight);
    expect(after.stops[1]?.lead).toMatchObject({ travelMinutes: 19, shortBy: 9 });
  });
});
