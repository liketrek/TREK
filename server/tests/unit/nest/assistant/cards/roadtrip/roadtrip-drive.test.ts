/**
 * The card of calculate_roadtrip: the planner's rail rebuilt from the tool's
 * raw answer (stops with their schedule, terminals, booked nights and
 * findings), the totals and the problem it reports, the driven lines without
 * the ride between two terminals, and a trip too long for one card fitted
 * under the size cap by keeping its first days and thinning its lines.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { redactForProvider } from '../../../../../../src/nest/assistant/assistant-redact';
import { AssistantToolSession } from '../../../../../../src/nest/assistant/assistant-tools.service';
import { answerCardOf, ASSISTANT_ARG_POLICY } from '../../../../../../src/nest/assistant/cards/registry';
import { roadtripAnswerCard } from '../../../../../../src/nest/assistant/cards/roadtrip/roadtrip-drive';
import { MAX_CARD_CHARS, ROADTRIP_CARD_DAYS_MAX, roadtripCardSchema, type RoadtripCard } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

const card = buildTripCard(1, 7, { trip: { title: 'Alps' } }, null, null);

const stop = (name: string, lat: number, lng: number, extra: Record<string, unknown> = {}) => ({
  assignmentId: 100 + Math.round(lat * 10),
  ownerDayId: 3,
  ownerIndex: 0,
  placeId: 200 + Math.round(lat * 10),
  name,
  lat,
  lng,
  time: null,
  dwellMinutes: 30,
  legMode: null,
  incomingLegMode: null,
  stopType: null,
  ...extra,
});

const leg = (distance: number, duration: number, mode = 'driving') => ({
  distance,
  duration,
  mode,
  mid: [0, 0],
  from: [0, 0],
  to: [0, 0],
  walkingText: '',
  drivingText: '',
  distanceText: '',
});

/** Munich, a charger, the airport, a flight to Rome, a stay booked in Rome for the night. */
function day(dayId: number, extra: Record<string, unknown> = {}) {
  return {
    dayId,
    dayNumber: dayId,
    date: '2026-10-01',
    title: 'Munich to Rome',
    stops: [
      stop('Munich', 48.137, 11.575),
      stop('Ionity Holzkirchen', 47.883, 11.701, { stopType: 'charging', fillPercent: 80 }),
      stop('Munich Airport', 48.354, 11.786, {
        assignmentId: -1,
        placeId: -1,
        carrier: { reservationId: 9, type: 'flight', role: 'departure', title: 'LH 1840', code: 'MUC', at: '11:05' },
      }),
      stop('Rome Fiumicino', 41.8, 12.25, {
        assignmentId: -2,
        placeId: -2,
        carrier: { reservationId: 9, type: 'flight', role: 'arrival', title: 'LH 1840', code: 'FCO', at: '12:50' },
      }),
      stop('Hotel Roma', 41.9, 12.5, {
        assignmentId: -3,
        stopType: 'hotel',
        bookend: {
          phase: 'evening',
          accommodationId: 4,
          reservationId: null,
          checkingIn: true,
          checkingOut: false,
          checkOut: null,
          checkIn: '15:00',
        },
      }),
    ],
    schedule: {
      entries: [
        { arrival: '08:00', departure: '08:30', anchored: true, dayOffset: 0 },
        { arrival: '09:00', departure: '09:30', anchored: false, dayOffset: 0 },
        { arrival: '10:15', departure: '11:05', anchored: false, dayOffset: 0 },
        { arrival: '12:50', departure: '13:10', anchored: false, dayOffset: 0 },
        { arrival: '14:00', departure: null, anchored: false, dayOffset: 0 },
      ],
      warnings: [
        { index: 2, code: 'late', minutes: 15 },
        { index: 4, code: 'overnight' },
      ],
    },
    legs: [leg(30_000, 1800), leg(52_000, 2700), leg(0, 6300, 'flight'), leg(28_000, 1500)],
    distanceMetres: 110_000,
    durationSeconds: 12_300,
    driveWarnings: [{ index: 1, code: 'leg', overMinutes: 25 }],
    dayWarning: { code: 'dayDriving', minutes: 400, limitMinutes: 360 },
    avoidMissed: ['toll', 'toll', 'unknown'],
    dryPoints: [{ legIndex: 3, intoLegKm: 4, drivenMeters: 4000, sinceKm: 312.46 }],
    geometry: [
      [48.137, 11.575],
      [47.883, 11.701],
      [48.354, 11.786],
      [41.8, 12.25],
      [41.9, 12.5],
    ],
    ...extra,
  };
}

const answer = (days: unknown[], extra: Record<string, unknown> = {}) => ({
  complete: true,
  settings: { roadtrip_vehicle: 'electric', roadtrip_fill_percent: 80, roadtrip_day_colors: true },
  failures: [],
  omittedVisitIds: [],
  undatedRides: [{ id: 5, type: 'train', title: 'ICE' }],
  dayWindowIssue: null,
  totalDistanceMetres: 110_000,
  totalDurationSeconds: 12_300,
  totalStops: 5,
  days,
  quietDays: [{ dayId: 9, dayNumber: 9 }],
  ...extra,
});

const input = (value: unknown, args: Record<string, unknown> = {}) => ({
  toolCallId: 'call_1',
  args,
  value,
  card,
  today: '2026-10-01',
});

describe('calculate_roadtrip card', () => {
  it('ASTRT-001: rebuilds the rail of a day with its schedule, terminals, booked night and findings', () => {
    const built = roadtripAnswerCard(input(answer([day(3)]))) as RoadtripCard;
    expect(roadtripCardSchema.safeParse(built).success).toBe(true);
    const [first] = built.days;
    expect(first.stops.map((s) => s.name)).toEqual([
      'Munich',
      'Ionity Holzkirchen',
      'Munich Airport',
      'Rome Fiumicino',
      'Hotel Roma',
    ]);
    expect(first.stops[0]).toMatchObject({ arrival: '08:00', departure: '08:30', anchored: true, placeId: 681 });
    expect(first.stops[1]).toMatchObject({ stopType: 'charging', fillPercent: 80 });
    expect(first.stops[2]).toMatchObject({
      placeId: null,
      assignmentId: null,
      carrier: { reservationId: 9, type: 'flight', role: 'departure', title: 'LH 1840', code: 'MUC', at: '11:05' },
      late: [{ code: 'late', minutes: 15 }],
    });
    expect(first.stops[4]).toMatchObject({
      assignmentId: null,
      bookend: { phase: 'evening', checkingIn: true, checkIn: '15:00', reservationId: null },
      late: [],
    });
    expect(first.legs).toEqual([
      { distanceM: 30_000, durationS: 1800, mode: 'driving' },
      { distanceM: 52_000, durationS: 2700, mode: 'driving' },
      { distanceM: 0, durationS: 6300, mode: 'flight' },
      { distanceM: 28_000, durationS: 1500, mode: 'driving' },
    ]);
    expect(first).toMatchObject({
      dayOver: { minutes: 400, limitMinutes: 360 },
      avoidMissed: ['toll'],
      dryKm: 312.5,
      moreStops: 0,
    });
  });

  it('ASTRT-002: names the drive leaving a stop by its own index', () => {
    const built = roadtripAnswerCard(input(answer([day(3)]))) as RoadtripCard;
    expect(built.days[0].stops.map((s) => s.findings.map((f) => f.code))).toEqual([[], ['leg'], [], [], []]);
    expect(built.days[0].stops[1].findings[0]).toEqual({ code: 'leg', overMinutes: 25, sinceKm: null });
  });

  it('ASTRT-003: leaves the flight out of the lines and keeps the rest at five decimals', () => {
    const built = roadtripAnswerCard(input(answer([day(3)]))) as RoadtripCard;
    const lines = built.days[0].lines;
    expect(lines.length).toBe(2);
    // No line reaches from Bavaria to Rome: the flight between the two terminals is no drive.
    expect(lines.some((line) => line.some(([lat]) => lat > 47) && line.some(([lat]) => lat < 42))).toBe(false);
    const points = lines.flat();
    for (const [lat, lng] of points) {
      expect(Math.round(lat * 1e5) / 1e5).toBe(lat);
      expect(Math.round(lng * 1e5) / 1e5).toBe(lng);
    }
  });

  it('ASTRT-004: carries the totals, the vehicle, the preview keys and the problem the answer reports', () => {
    const built = roadtripAnswerCard(
      input(answer([day(3)], { complete: false, failures: [{ from: 1, to: 2 }] }), {
        settings: { roadtrip_hotel_bookends: true, endpoint: 'x' },
      }),
    ) as RoadtripCard;
    expect(built).toMatchObject({
      complete: false,
      problem: 'routing',
      previewKeys: ['roadtrip_hotel_bookends'],
      vehicle: 'electric',
      defaultFill: 80,
      dayColors: true,
      distanceM: 110_000,
      durationS: 12_300,
      stopCount: 5,
      chargingCount: 1,
      moreDays: 0,
      quietDays: 1,
      undatedRides: 1,
    });
    const omitted = roadtripAnswerCard(input(answer([day(3)], { omittedVisitIds: [4] }))) as RoadtripCard;
    expect(omitted.problem).toBe('coordinates');
    const window = roadtripAnswerCard(input(answer([day(3)], { dayWindowIssue: 'conflict' }))) as RoadtripCard;
    expect(window.problem).toBe('dayWindow');
  });

  it('ASTRT-005: a trip of thirty full days fits under the cap by its first days, its lines thinned', () => {
    const many = Array.from({ length: 24 }, (_, index) => stop(`Stop ${index}`, 45 + index * 0.1, 10 + index * 0.1));
    const geometry = Array.from({ length: 3000 }, (_, index) => [45 + index * 0.0008, 10 + index * 0.0008]);
    const days = Array.from({ length: 30 }, (_, index) =>
      day(index + 1, { stops: many, legs: many.slice(1).map(() => leg(1000, 60)), geometry, driveWarnings: [] }),
    );
    const built = answerCardOf('calculate_roadtrip', input(answer(days))) as RoadtripCard;
    expect(built).not.toBeNull();
    expect(JSON.stringify(built).length).toBeLessThanOrEqual(MAX_CARD_CHARS);
    expect(built.days.length).toBeLessThanOrEqual(ROADTRIP_CARD_DAYS_MAX);
    expect(built.days.length + built.moreDays).toBe(30);
    expect(built.days[0].stops).toHaveLength(16);
    expect(built.days[0].moreStops).toBe(8);
    for (const line of built.days.flatMap((d) => d.lines)) expect(line.length).toBeLessThanOrEqual(64);
    expect(built.days.flatMap((d) => d.lines).flat().length).toBeLessThanOrEqual(400);
    for (const kept of built.days) expect(kept.lines.length).toBeGreaterThan(0);
    expect(logMock.logWarn).not.toHaveBeenCalled();
  });

  it('ASTRT-008: a ten day trip of six stops a day keeps a line on every day it shows', () => {
    const six = Array.from({ length: 6 }, (_, index) => stop(`Stop ${index}`, 46 + index * 0.2, 9 + index * 0.2));
    const geometry = Array.from({ length: 800 }, (_, index) => [46 + index * 0.0015, 9 + index * 0.0015]);
    const days = Array.from({ length: 10 }, (_, index) =>
      day(index + 1, { stops: six, legs: six.slice(1).map(() => leg(20_000, 900)), geometry, driveWarnings: [] }),
    );
    const built = roadtripAnswerCard(input(answer(days))) as RoadtripCard;
    expect(JSON.stringify(built).length).toBeLessThanOrEqual(MAX_CARD_CHARS);
    expect(built.days.length + built.moreDays).toBe(10);
    expect(built.days.length).toBeGreaterThan(1);
    for (const kept of built.days) {
      expect(kept.lines.length).toBeGreaterThan(0);
      for (const line of kept.lines) expect(line.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('ASTRT-006: gives no card for a drive without a day, and the geometry is asked for without the model', () => {
    expect(roadtripAnswerCard(input(answer([])))).toBeNull();
    expect(roadtripAnswerCard(input('Trip not found'))).toBeNull();
    expect(ASSISTANT_ARG_POLICY.calculate_roadtrip).toEqual({ forced: { includeGeometry: true } });
  });

  it('ASTRT-009: the model never sees the geometry switch, the call always sets it, the answer drops it', async () => {
    const callTool = vi.fn(async () => ({ content: [{ type: 'text', text: JSON.stringify(answer([day(3)])) }] }));
    const tool = {
      name: 'calculate_roadtrip',
      description: '',
      inputSchema: {
        type: 'object',
        properties: { tripId: { type: 'number' }, includeGeometry: { type: 'boolean' }, dayId: { type: 'number' } },
        required: ['tripId', 'includeGeometry'],
      },
      kind: 'read',
      pinned: true,
      hint: { destructive: false, creates: false, group: 'roadtrip' },
    };
    const tools = new Map([['calculate_roadtrip', tool]]);
    const audit = () => undefined;
    const session = new AssistantToolSession({ callTool } as never, {} as never, tools as never, 1, audit, 'undo');
    const [spec] = session.specs();
    expect(Object.keys(spec.parameters.properties as object)).toEqual(['dayId']);
    expect(spec.parameters.required).toBeUndefined();
    const run = await session.call('calculate_roadtrip', { includeGeometry: false, dayId: 3 });
    expect(callTool).toHaveBeenCalledWith({
      name: 'calculate_roadtrip',
      arguments: { includeGeometry: true, dayId: 3, tripId: 1 },
    });
    expect(JSON.stringify(run.value)).toContain('geometry');
    expect(JSON.stringify(redactForProvider(run.value))).not.toContain('geometry');
  });

  it('ASTRT-007: carries no web address and ends a day at a stop without a position', () => {
    const stops = [stop('Munich', 48.1, 11.5), stop('Nowhere', Number.NaN, 11), stop('Ulm', 48.4, 10)];
    const broken = day(3, { stops });
    const built = roadtripAnswerCard(input(answer([broken]))) as RoadtripCard;
    expect(built.days[0].stops.map((s) => s.name)).toEqual(['Munich']);
    expect(built.days[0].moreStops).toBe(2);
    expect(built.days[0].legs).toEqual([]);
    expect(JSON.stringify(built)).not.toMatch(/https?:|url/i);
  });
});
