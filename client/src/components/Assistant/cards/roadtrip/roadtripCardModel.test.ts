/**
 * FE-AI-RT-001 to FE-AI-RT-008
 *
 * The road trip cards read for drawing: a card's day rebuilt as the planner's
 * own day (stops, legs, schedule, findings), the day an answer opens on, the
 * days that carry a warning, a charger joined to its stop, the sketch of a
 * drive and of a day route, the settings in words, and the look's map hooks.
 */
import type { DayRouteCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { charger, DRIVE, FLORENCE_DAY, MUNICH_DAY } from '../../../../../tests/helpers/assistantRoadtrip';
import { dayColor } from '../../../Roadtrip/dayColors';
import { CARD_RULES } from '../cardLooks';
import type { EntityLook } from '../cardTypes';
import {
  chargersOnDay,
  dayHasWarning,
  dayRouteSketch,
  defaultDayIndex,
  driveSketch,
  splitDriveEntries,
  toRoadtripDay,
} from './roadtripCardModel';
import { dayRouteGhosts, dayRouteLines, ROADTRIP_LOOK, roadtripTarget } from './roadtripLook';
import { settingLabel, settingValueText, type SettingWords } from './roadtripSettings';

const ROUTE: DayRouteCard = {
  kind: 'dayRoute',
  dayId: 31,
  dayNumber: 1,
  stops: [
    { placeId: 1, name: 'Munich', lat: 48.1, lng: 11.6, added: false },
    { placeId: null, name: 'Garmisch', lat: 47.5, lng: 11.1, added: true },
  ],
  vias: [
    { lat: 47.8, lng: 11.3, after: 0, state: 'moved', from: [47.7, 11.4] },
    { lat: 47.6, lng: 11.2, after: 0, state: 'removed', from: null },
  ],
  afterName: 'Munich',
  track: null,
  unresolved: [],
};

describe('roadtripCardModel', () => {
  it('FE-AI-RT-001: rebuilds a card day as the planner day: stops, terminals, the booked night, legs and schedule', () => {
    const day = toRoadtripDay(MUNICH_DAY);
    expect(day.stops.map((stop) => stop.name)).toEqual([
      'Munich',
      'Ionity Holzkirchen',
      'Munich Airport',
      'Rome Fiumicino',
      'Hotel Roma',
    ]);
    expect(day.stops[2]).toMatchObject({
      assignmentId: -3,
      placeId: -3,
      carrier: { reservationId: 9, role: 'departure' },
    });
    expect(day.stops[4]).toMatchObject({
      assignmentId: -5,
      placeId: 5,
      bookend: { phase: 'evening', checkingIn: true, checkIn: '15:00', reservationId: null },
    });
    expect(day.stops.every((stop, index) => stop.ownerDayId === 31 && stop.ownerIndex === index)).toBe(true);
    expect(day.legs.map((leg) => leg?.mode)).toEqual(['driving', 'driving', 'flight', 'driving']);
    expect(day.legs[0]).toMatchObject({ distance: 30_000, duration: 1800, from: [48.137, 11.575] });
    expect(day.schedule.entries[1]).toEqual({ arrival: '09:00', departure: '09:30', anchored: false, dayOffset: 0 });
    expect(day.schedule.warnings).toEqual([{ index: 2, code: 'late', minutes: 15 }]);
    expect(day.driveWarnings).toEqual([{ index: 1, code: 'leg', overMinutes: 25 }]);
    expect(day.dayWarning).toEqual({ code: 'dayDriving', minutes: 400, limitMinutes: 360 });
    expect(day.legVias).toHaveLength(5);
  });

  it('FE-AI-RT-002: opens on the day the chat is about, else the first that drives; flags the days to look at', () => {
    expect(defaultDayIndex(DRIVE, 32)).toBe(1);
    expect(defaultDayIndex(DRIVE, null)).toBe(0);
    expect(defaultDayIndex({ ...DRIVE, days: [{ ...MUNICH_DAY, legs: [] }, FLORENCE_DAY] }, null)).toBe(1);
    expect(dayHasWarning(MUNICH_DAY)).toBe(true);
    expect(dayHasWarning(FLORENCE_DAY)).toBe(false);
    expect(dayHasWarning({ ...FLORENCE_DAY, dryKm: 280 })).toBe(true);
  });

  it('FE-AI-RT-003: a charger on a stop of the shown day joins its row, any other stands apart', () => {
    const entries = [
      { toolCallId: 'call_1', card: DRIVE },
      { toolCallId: 'call_2', card: charger() },
      { toolCallId: 'call_3', card: charger({ placeId: null, name: 'Elsewhere' }) },
    ];
    const { drives, chargers } = splitDriveEntries(entries);
    expect(drives.map((drive) => drive.toolCallId)).toEqual(['call_1']);
    const { joined, apart } = chargersOnDay(MUNICH_DAY, chargers);
    expect([...joined.keys()]).toEqual([2]);
    expect(apart.map((entry) => entry.toolCallId)).toEqual(['call_3']);
    expect(chargersOnDay(FLORENCE_DAY, chargers).joined.size).toBe(0);
  });

  it('FE-AI-RT-004: the drive sketch draws every day in its colour, the chosen one bold, and marks its stops', () => {
    const { lines, marks } = driveSketch(DRIVE, 1, dayColor);
    expect(lines.map((line) => [line.id, line.dim])).toEqual([
      ['31:0', true],
      ['31:1', true],
      ['32:0', false],
    ]);
    expect(lines[2]?.color).toBe(dayColor(2).line);
    expect(marks.map((mark) => mark.id)).toEqual(['32:0', '32:1']);
    const oneColour = driveSketch({ ...DRIVE, dayColors: false }, 0, dayColor);
    expect(new Set(oneColour.lines.map((line) => line.color))).toEqual(new Set([dayColor(1).line]));
    expect(driveSketch(DRIVE, 0, dayColor).marks.find((mark) => mark.id === '31:1')?.shape).toBe('service');
  });

  it('FE-AI-RT-005: the day route sketch dashes what waits, fades what goes and shows where a via came from', () => {
    const waiting = dayRouteSketch(ROUTE, true);
    expect(waiting.lines.map((line) => line.id)).toEqual(['stops', 'move:0']);
    expect(waiting.marks.find((mark) => mark.id === 'stop:1')).toMatchObject({ shape: 'new', state: 'pending' });
    expect(waiting.marks.find((mark) => mark.id === 'via:0')).toMatchObject({ shape: 'via', state: 'pending' });
    expect(waiting.marks.find((mark) => mark.id === 'via:1')?.state).toBe('removed');
    expect(waiting.marks.find((mark) => mark.id === 'from:0')).toMatchObject({ lat: 47.7, state: 'removed' });
    const applied = dayRouteSketch(ROUTE, false);
    expect(applied.marks.find((mark) => mark.id === 'via:0')?.state).toBeUndefined();
  });

  it('FE-AI-RT-006: names the settings as the settings dialog does and words their values', () => {
    const words: SettingWords = {
      t: (key) => `<${key}>`,
      minutes: (value) => `${value} min`,
      clock: (value) => `@${value}`,
      distance: (km) => `${km} km`,
      number: (value) => String(value),
    };
    expect(settingLabel('roadtrip_day_start', words.t)).toBe('<roadtrip.window.start>');
    expect(settingLabel('roadtrip_new_thing', words.t)).toBe('roadtrip_new_thing');
    expect(settingValueText('roadtrip_day_start', '09:30', words)).toBe('@09:30');
    expect(settingValueText('roadtrip_day_start', '', words)).toBe('<assistant.card.roadtrip.setting.off>');
    expect(settingValueText('roadtrip_leg_minutes', 0, words)).toBe('<assistant.card.roadtrip.setting.off>');
    expect(settingValueText('roadtrip_leg_minutes', 150, words)).toBe('150 min');
    expect(settingValueText('roadtrip_range_km', 420, words)).toBe('420 km');
    expect(settingValueText('roadtrip_fill_percent', 80, words)).toBe('80 %');
    expect(settingValueText('roadtrip_hotel_bookends', true, words)).toBe('<assistant.card.roadtrip.setting.on>');
    expect(settingValueText('roadtrip_vehicle', 'electric', words)).toBe('<roadtrip.limit.vehicleElectric>');
    const avoided = settingValueText('roadtrip_avoid', 'toll,ferry', words);
    expect(avoided).toBe('<roadtrip.avoid.toll>, <roadtrip.avoid.ferry>');
    expect(settingValueText('roadtrip_day_end_mode', 'stop', words)).toBe('<roadtrip.window.atStop>');
  });

  it('FE-AI-RT-007: an applied road trip change opens its day in the road trip and shows the day on the map', () => {
    const look: EntityLook = ROADTRIP_LOOK.entities.roadtrip;
    const applied = { toolCallId: 'call_1', entity: 'roadtrip' as const, ids: [], dayId: 31, undoUntil: null };
    expect(look.onMap?.(applied, null)).toEqual({ placeId: null, dayId: 31 });
    expect(look.open?.(applied, null)).toEqual({ kind: 'tab', tab: 'roadtrip', params: { day: '31' } });
    expect(look.onMap?.({ ...applied, dayId: null }, null)).toBeNull();
    expect(roadtripTarget({ dayId: null })).toEqual({ kind: 'tab', tab: 'roadtrip' });
    expect(CARD_RULES.group(DRIVE)).toBe('drive');
    expect(CARD_RULES.group(charger())).toBe('drive');
    expect(ROADTRIP_LOOK.cards.transit.followUps?.find((followUp) => followUp.id === 'addTransit')?.edits).toBe(true);
  });

  it('FE-AI-RT-008: a waiting day route marks its new stops and vias on the map and draws where a via moves', () => {
    expect(dayRouteGhosts(ROUTE)).toEqual([
      { id: 'stop:1', lat: 47.5, lng: 11.1, name: 'Garmisch', variant: 'pin' },
      { id: 'via:0', lat: 47.8, lng: 11.3, name: 'Munich', variant: 'point' },
    ]);
    expect(dayRouteLines(ROUTE, 'pending')).toEqual([
      {
        id: 'via-moves',
        lines: [
          [
            [47.7, 11.4],
            [47.8, 11.3],
          ],
        ],
        color: 'var(--accent)',
        dashed: true,
      },
    ]);
    expect(dayRouteLines(ROUTE, 'look')).toEqual([]);
  });
});
