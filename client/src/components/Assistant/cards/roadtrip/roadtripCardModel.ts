import type { ChargingCard, DayRouteCard, RoadtripCard, RoadtripCardDay, RoadtripCardStop } from '@trek/shared';
import type { RoadtripDay, RoadtripStop, RouteSegment } from '@trek/shared/roadtrip';

import type { CardEntry } from '../cardTypes';
import type { SketchLine, SketchMark } from '../parts/routeSketchModel';

/**
 * The road trip cards read for drawing, pure: a card's day rebuilt as the
 * planner's own `RoadtripDay`, so the chat hands it to the planner's day card
 * and gets the planner's rows; the day an answer opens on; which days carry
 * a warning; the sketch of a drive or of a day route; and the chargers of an
 * answer that belong to a stop the drive shows.
 */

/** A leg as the rail reads it, rebuilt from the card's metres, seconds and mode. */
function legOf(leg: RoadtripCardDay['legs'][number], from: RoadtripCardStop, to: RoadtripCardStop) {
  if (!leg) return undefined;
  const segment: RouteSegment = {
    mid: [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2],
    from: [from.lat, from.lng],
    to: [to.lat, to.lng],
    distance: leg.distanceM,
    duration: leg.durationS,
    walkingText: '',
    drivingText: '',
    distanceText: '',
    mode: leg.mode,
  };
  return segment;
}

/** One stop as the rail reads it; a terminal or a booked night, no place or assignment, gets ids of its own. */
function stopOf(stop: RoadtripCardStop, index: number, dayId: number): RoadtripStop {
  const own = -(index + 1);
  return {
    assignmentId: stop.assignmentId ?? own,
    ownerDayId: dayId,
    ownerIndex: index,
    placeId: stop.placeId ?? own,
    name: stop.name,
    lat: stop.lat,
    lng: stop.lng,
    time: stop.time,
    leaveAt: stop.leaveAt,
    dwellMinutes: stop.dwellMinutes,
    checkInTime: stop.night?.checkIn ?? null,
    night: stop.night !== null,
    legMode: null,
    incomingLegMode: null,
    stopType: stop.stopType,
    fillPercent: stop.fillPercent,
    offRoadMeters: stop.offRoadM,
    ...(stop.carrier
      ? { carrier: { ...stop.carrier, code: stop.carrier.code ?? null, at: stop.carrier.at ?? null } }
      : {}),
    ...(stop.autoNight ? { automaticNight: stop.autoNight } : {}),
    ...(stop.bookend
      ? {
          bookend: {
            phase: stop.bookend.phase,
            accommodationId: 0,
            reservationId: stop.bookend.reservationId,
            checkingIn: stop.bookend.checkingIn,
            checkingOut: stop.bookend.checkingOut,
            checkIn: stop.bookend.checkIn,
            checkOut: stop.bookend.checkOut,
          },
        }
      : {}),
  };
}

/** A card's day as the planner's day card takes it: the same stops, schedule, findings and warnings. */
export function toRoadtripDay(day: RoadtripCardDay): RoadtripDay {
  const stops = day.stops.map((stop, index) => stopOf(stop, index, day.dayId));
  return {
    dayId: day.dayId,
    dayNumber: day.dayNumber,
    date: day.date,
    title: day.title,
    stops,
    legs: day.stops.slice(1).map((to, index) => {
      const from = day.stops[index];
      return from ? legOf(day.legs[index] ?? null, from, to) : undefined;
    }),
    schedule: {
      entries: day.stops.map((stop) => ({
        arrival: stop.arrival,
        departure: stop.departure,
        anchored: stop.anchored,
        dayOffset: stop.dayOffset,
      })),
      warnings: day.stops.flatMap((stop, index) =>
        stop.late.map((late) => ({ index, code: late.code, minutes: late.minutes }))
      ),
    },
    legVias: day.stops.map(() => []),
    geometry: [],
    distance: day.distanceM,
    duration: day.durationS,
    driveWarnings: day.stops.flatMap((stop, index) =>
      stop.findings.map((finding) => ({
        index,
        code: finding.code,
        ...(finding.overMinutes !== null ? { overMinutes: finding.overMinutes } : {}),
        ...(finding.sinceKm !== null ? { sinceKm: finding.sinceKm } : {}),
      }))
    ),
    dayWarning: day.dayOver ? { code: 'dayDriving', ...day.dayOver } : null,
    avoidMissed: day.avoidMissed,
  };
}

/** Whether a day carries something to look at: lateness, a finding on a drive, too long a day, a dry tank. */
export function dayHasWarning(day: RoadtripCardDay): boolean {
  return (
    day.dayOver !== null || day.dryKm !== null || day.stops.some((stop) => stop.late.length + stop.findings.length > 0)
  );
}

/** The day an answer opens on: the day the chat is about when the drive holds it, else the first that drives. */
export function defaultDayIndex(card: RoadtripCard, focusDayId: number | null | undefined): number {
  const focused = card.days.findIndex((day) => day.dayId === focusDayId);
  if (focused >= 0) return focused;
  const driving = card.days.findIndex((day) => day.legs.length > 0);
  return driving >= 0 ? driving : 0;
}

/** The colours a day is drawn in: the day's own, or day 1's for every day when the trip draws one colour. */
type DayPaint = (dayNumber: number) => { line: string; casing: string };

/** The sketch of a drive: every day's lines, the selected day bold and the others faded, its stops marked. */
export function driveSketch(
  card: RoadtripCard,
  selected: number,
  paint: DayPaint
): { lines: SketchLine[]; marks: SketchMark[] } {
  const lines = card.days.flatMap((day, dayIndex) => {
    const colour = paint(card.dayColors ? day.dayNumber : 1);
    return day.lines.map((points, index) => ({
      id: `${day.dayId}:${index}`,
      points,
      color: colour.line,
      casing: colour.casing,
      dim: dayIndex !== selected,
    }));
  });
  const shown = card.days[selected];
  const marks = (shown?.stops ?? [])
    .filter((stop) => stop.autoNight === null)
    .map((stop, index): SketchMark => ({
      id: `${shown?.dayId ?? 0}:${index}`,
      lat: stop.lat,
      lng: stop.lng,
      shape: stop.stopType && stop.stopType !== 'hotel' ? 'service' : 'stop',
    }));
  return { lines, marks };
}

/** Where a moved via stood, faint. */
function fromMark(index: number, [lat, lng]: [number, number]): SketchMark {
  return { id: `from:${index}`, lat, lng, shape: 'via', state: 'removed' };
}

/** A day route's sketch: its stops joined by straight dashed lines, new stops and vias marked by their change. */
export function dayRouteSketch(card: DayRouteCard, pending: boolean): { lines: SketchLine[]; marks: SketchMark[] } {
  const points = card.stops.map((stop): [number, number] => [stop.lat, stop.lng]);
  const lines: SketchLine[] =
    points.length >= 2
      ? [{ id: 'stops', points, color: 'var(--border-primary)', casing: 'transparent', dashed: true }]
      : [];
  for (const [index, via] of card.vias.entries()) {
    if (via.state === 'moved' && via.from) {
      lines.push({
        id: `move:${index}`,
        points: [via.from, [via.lat, via.lng]],
        color: 'var(--accent)',
        casing: 'transparent',
        dashed: true,
      });
    }
  }
  const marks: SketchMark[] = [
    ...card.stops.map((stop, index): SketchMark => ({
      id: `stop:${index}`,
      lat: stop.lat,
      lng: stop.lng,
      shape: stop.added ? 'new' : 'stop',
      ...(stop.added && pending ? { state: 'pending' } : {}),
    })),
    ...card.vias.flatMap((via, index): SketchMark[] => [
      ...(via.from ? [fromMark(index, via.from)] : []),
      {
        id: `via:${index}`,
        lat: via.lat,
        lng: via.lng,
        shape: 'via',
        ...(via.state === 'removed' ? { state: 'removed' } : pending ? { state: 'pending' } : {}),
      },
    ]),
  ];
  return { lines, marks };
}

/** The roadtrip and charging cards of an answer group, apart. */
export function splitDriveEntries(entries: readonly CardEntry[]): {
  drives: { toolCallId: string; card: RoadtripCard }[];
  chargers: { toolCallId: string; card: ChargingCard }[];
} {
  const drives: { toolCallId: string; card: RoadtripCard }[] = [];
  const chargers: { toolCallId: string; card: ChargingCard }[] = [];
  for (const { toolCallId, card } of entries) {
    if (card.kind === 'roadtrip') drives.push({ toolCallId, card });
    if (card.kind === 'charging') chargers.push({ toolCallId, card });
  }
  return { drives, chargers };
}

/** The chargers that belong to a stop of the shown day, by its place; the rest stand on their own. */
export function chargersOnDay(
  day: RoadtripCardDay | undefined,
  chargers: readonly { toolCallId: string; card: ChargingCard }[]
): { joined: Map<number, ChargingCard>; apart: { toolCallId: string; card: ChargingCard }[] } {
  const places = new Set((day?.stops ?? []).flatMap((stop) => (stop.placeId === null ? [] : [stop.placeId])));
  const joined = new Map<number, ChargingCard>();
  const apart: { toolCallId: string; card: ChargingCard }[] = [];
  for (const charger of chargers) {
    const placeId = charger.card.placeId;
    if (placeId !== null && places.has(placeId)) joined.set(placeId, charger.card);
    else apart.push(charger);
  }
  return { joined, apart };
}

/** Every point of a drive's day, for the map to fit the camera to. */
export function dayPoints(day: RoadtripCardDay): [number, number][] {
  const linePoints = day.lines.flat();
  return linePoints.length > 0 ? linePoints : day.stops.map((stop): [number, number] => [stop.lat, stop.lng]);
}
