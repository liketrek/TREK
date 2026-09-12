import type { RouteAvoidClass } from './planning-types';

export const SERVICE_STOP_TYPES = [
  'fuel',
  'charging',
  'rest_area',
  'campsite',
  'restaurant',
  'sights',
  'hotel',
] as const;

export const SERVICE_COLORS: Record<string, string> = {
  fuel: '#E8590C',
  charging: '#CA8A04',
  rest_area: '#3B82F6',
  campsite: '#16A34A',
  restaurant: '#EF4444',
  sights: '#EC4899',
  hotel: '#2563EB',
};

export function serviceColor(stopType: string | null | undefined): string {
  return SERVICE_COLORS[stopType ?? ''] ?? '#64748B';
}

export function isServiceStopType(stopType: string | null | undefined): boolean {
  return !!stopType && (SERVICE_STOP_TYPES as readonly string[]).includes(stopType);
}

export function formatDurationShort(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.round((safe % 3600) / 60);

  if (m === 60) return `${h + 1} h`;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  return `${m} min`;
}

export function parseClock(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatClock(minutes: number): string {
  const day = 24 * 60;
  const wrapped = ((minutes % day) + day) % day;
  const h = Math.floor(wrapped / 60);
  const m = Math.round(wrapped % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface ScheduleStop {
  departureAt?: number;
  anchor: string | null;

  dwellMinutes: number | null;
}

export interface ScheduleWarning {
  index: number;
  code: 'late' | 'overnight' | 'leg' | 'range';

  minutes?: number;

  overMinutes?: number;

  sinceKm?: number;
}

export const REFUELLING_STOP_TYPES = ['fuel', 'charging'] as const;

export type VehicleKind = 'combustion' | 'electric';

export function refuelStopTypeFor(vehicle: VehicleKind | null | undefined): readonly string[] {
  if (vehicle === 'combustion') return ['fuel'];
  if (vehicle === 'electric') return ['charging'];
  return REFUELLING_STOP_TYPES;
}

export function refuelsRange(stopType: string | null | undefined, vehicle?: VehicleKind | null): boolean {
  return refuelStopTypeFor(vehicle).includes(stopType ?? '');
}

export interface DriveLimits {
  fillPercent?: number | null;

  legMinutes: number | null;

  dayMinutes: number | null;

  rangeKm: number | null;
}

export interface DayWarning {
  code: 'dayDriving';

  minutes: number;
  limitMinutes: number;
}

export interface ScheduleEntry {
  arrival: string | null;
  departure: string | null;

  anchored: boolean;

  dayOffset: number;
}

export interface Schedule {
  entries: ScheduleEntry[];
  warnings: ScheduleWarning[];
}

const DAY_MINUTES = 24 * 60;

function resolveArrival(
  anchor: number | null,
  cursor: number | null,
  dayOffset: number,
): { arrival: number | null; lateBy: number | null } {
  if (anchor === null) return { arrival: cursor, lateBy: null };

  if (cursor === null) return { arrival: anchor + dayOffset * DAY_MINUTES, lateBy: null };

  const k = Math.round((cursor - anchor) / DAY_MINUTES);
  const anchorAt = anchor + k * DAY_MINUTES;
  return {
    arrival: anchorAt,
    lateBy: cursor > anchorAt + 1 ? Math.round(cursor - anchorAt) : null,
  };
}

export function computeSchedule(stops: ScheduleStop[], legSeconds: (number | undefined)[]): Schedule {
  const warnings: ScheduleWarning[] = [];

  const arrivals: (number | null)[] = new Array(stops.length).fill(null);
  const anchored: boolean[] = new Array(stops.length).fill(false);

  let cursor: number | null = null;
  let dayOffset = 0;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]!;
    const anchor = parseClock(stop.anchor);
    const { arrival, lateBy } = resolveArrival(anchor, cursor, dayOffset);
    if (lateBy !== null) warnings.push({ index: i, code: 'late', minutes: lateBy });

    if (arrival === null) {
      const leg = legSeconds[i];
      if (stop.departureAt !== undefined && leg !== undefined) cursor = stop.departureAt + Math.round(leg / 60);
      continue;
    }

    const offset = Math.floor(arrival / DAY_MINUTES);
    if (offset > dayOffset) dayOffset = offset;

    arrivals[i]! = arrival;
    anchored[i]! = anchor !== null;

    const leg = legSeconds[i];
    cursor =
      leg === undefined
        ? null
        : (stop.departureAt === undefined ? arrival + (stop.dwellMinutes ?? 0) : Math.max(arrival, stop.departureAt)) +
          Math.round(leg / 60);
  }

  const firstKnown = arrivals.findIndex((a) => a !== null);
  for (let i = firstKnown - 1; i >= 0; i--) {
    if (stops[i]!.departureAt !== undefined) break;
    const leg = legSeconds[i];
    const next = arrivals[i + 1]!;
    if (leg === undefined || next === null) break;
    arrivals[i]! = next - Math.round(leg / 60) - (stops[i]!.dwellMinutes ?? 0);
  }

  const earliest = arrivals.reduce<number | null>((m, a) => (a === null ? m : m === null || a < m ? a : m), null);
  const shift = earliest === null || earliest >= 0 ? 0 : -Math.floor(earliest / DAY_MINUTES) * DAY_MINUTES;

  const entries: ScheduleEntry[] = [];
  let lastOffset = 0;
  for (let i = 0; i < stops.length; i++) {
    const raw = arrivals[i]!;
    if (raw === null) {
      entries.push({
        arrival: null,
        departure: stops[i]!.departureAt === undefined ? null : formatClock(stops[i]!.departureAt!),
        anchored: false,
        dayOffset: 0,
      });
      continue;
    }
    const arrival = raw + shift;
    const offset = Math.floor(arrival / DAY_MINUTES);

    if (offset > lastOffset) warnings.push({ index: i, code: 'overnight' });
    lastOffset = offset;
    entries.push({
      arrival: formatClock(arrival),
      departure: formatClock(
        stops[i]!.departureAt === undefined
          ? arrival + (stops[i]!.dwellMinutes ?? 0)
          : Math.max(arrival, stops[i]!.departureAt! + shift),
      ),
      anchored: anchored[i]!,
      dayOffset: offset,
    });
  }

  return { entries, warnings };
}

export function splitIntoRuns<T>(stops: T[], modeOfLeg: (from: T, to: T) => string): { stops: T[]; mode: string }[] {
  const runs: { stops: T[]; mode: string }[] = [];
  let current: T[] = [];
  let currentMode: string | null = null;

  for (let i = 0; i < stops.length - 1; i++) {
    const mode = modeOfLeg(stops[i]!, stops[i + 1]!);
    if (currentMode === null) {
      current = [stops[i]!, stops[i + 1]!];
      currentMode = mode;
    } else if (mode === currentMode) {
      current.push(stops[i + 1]!);
    } else {
      runs.push({ stops: current, mode: currentMode });
      current = [stops[i]!, stops[i + 1]!];
      currentMode = mode;
    }
  }
  if (currentMode !== null && current.length > 1) runs.push({ stops: current, mode: currentMode });
  return runs;
}

export function sumLegSeconds(legSeconds: (number | undefined)[]): number {
  return legSeconds.reduce<number>((sum, s) => sum + (s ?? 0), 0);
}

export interface DryPoint {
  inboundLine?: [number, number][];

  legIndex: number;

  intoLegKm: number;

  drivenMeters: number;

  sinceKm: number;
}

export function deriveDriveWarnings(
  legs: ({ duration?: number; distance?: number; mode?: string } | undefined)[],

  refuelsAt: boolean[],
  limits: DriveLimits,

  carryKm: number | null,

  fillAt: readonly (number | null | undefined)[] = [],
): { warnings: ScheduleWarning[]; day: DayWarning | null; carryKm: number | null; emptyAt: DryPoint[] } {
  const warnings: ScheduleWarning[] = [];
  const emptyAt: DryPoint[] = [];
  let budget = carryKm;
  let totalSeconds = 0;

  let drivenMeters = 0;

  const usedAfterFilling = (i: number): number => {
    const percent = fillAt[i] ?? limits.fillPercent;
    return limits.rangeKm && percent && percent > 0 && percent < 100 ? limits.rangeKm * (1 - percent / 100) : 0;
  };

  for (let i = 0; i < legs.length; i++) {
    if (refuelsAt[i]!) budget = usedAfterFilling(i);
    const leg = legs[i];

    const at = i + 1;

    if (leg && leg.mode !== undefined && leg.mode !== 'driving') continue;
    const seconds = leg?.duration;
    if (typeof seconds === 'number') {
      totalSeconds += seconds;
      if (limits.legMinutes && seconds / 60 > limits.legMinutes) {
        warnings.push({ index: at, code: 'leg', overMinutes: Math.round(seconds / 60 - limits.legMinutes) });
      }
    }
    const metres = leg?.distance;
    if (typeof metres !== 'number') {
      budget = null;
    } else if (budget !== null) {
      const before = budget;
      budget += metres / 1000;

      if (limits.rangeKm && before <= limits.rangeKm && budget > limits.rangeKm) {
        const intoLegKm = limits.rangeKm - before;
        emptyAt.push({
          legIndex: i,
          intoLegKm,
          drivenMeters: drivenMeters + intoLegKm * 1000,
          sinceKm: Math.round(limits.rangeKm),
        });
      }

      if (limits.rangeKm && budget > limits.rangeKm && !refuelsAt[at]!) {
        warnings.push({ index: at, code: 'range', sinceKm: Math.round(budget) });
      }
      drivenMeters += metres;
    }
  }

  if (refuelsAt[legs.length]!) budget = usedAfterFilling(legs.length);

  const minutes = Math.round(totalSeconds / 60);
  const day =
    limits.dayMinutes && minutes > limits.dayMinutes
      ? { code: 'dayDriving' as const, minutes, limitMinutes: limits.dayMinutes }
      : null;

  return { warnings, day, carryKm: budget, emptyAt };
}

export function legIndexForAlong(legEndMeters: number[], alongMeters: number): number {
  if (!legEndMeters.length) return -1;
  for (let i = 0; i < legEndMeters.length; i++) {
    if (alongMeters < legEndMeters[i]!) return i;
  }
  return legEndMeters.length - 1;
}

export interface SectionAnchor {
  kind: 'stop' | 'leg';

  index: number;
  alongKm: number;
}

export function sectionAnchors(stopsAlongKm: number[]): SectionAnchor[] {
  const out: SectionAnchor[] = [];
  for (let i = 0; i < stopsAlongKm.length; i++) {
    out.push({ kind: 'stop', index: i, alongKm: stopsAlongKm[i]! });
    if (i + 1 < stopsAlongKm.length) {
      out.push({ kind: 'leg', index: i, alongKm: (stopsAlongKm[i]! + stopsAlongKm[i + 1]!) / 2 });
    }
  }
  return out;
}

export function insertIndexForAlong(stopsAlongKm: number[], hitAlongKm: number): number {
  if (stopsAlongKm.length < 2) return stopsAlongKm.length;
  let i = 0;
  while (i < stopsAlongKm.length && stopsAlongKm[i]! <= hitAlongKm) i++;
  return Math.min(Math.max(i, 1), stopsAlongKm.length - 1);
}

export interface AnchoredVia {
  id: number;
  after_order_index: number;
  lat: number;
  lng: number;
}

export interface ReanchoredVia {
  id: number;
  after_order_index: number;
}

export interface Reanchoring {
  vias: ReanchoredVia[];
  remove: number[];
}

const EMPTY_REANCHORING: Reanchoring = { vias: [], remove: [] };

function collect(vias: AnchoredVia[], at: (index: number) => number | null): Reanchoring {
  const moved: ReanchoredVia[] = [];
  const remove: number[] = [];
  for (const via of vias) {
    const next = at(via.after_order_index);
    if (next === null) remove.push(via.id);
    else if (next !== via.after_order_index) moved.push({ id: via.id, after_order_index: next });
  }
  return { vias: moved, remove };
}

export function reanchorAfterInsert(
  vias: AnchoredVia[],
  position: number,
  liesBeforeInsert: (via: AnchoredVia) => boolean,
): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING;
  const split = position - 1;
  const moved: ReanchoredVia[] = [];
  for (const via of vias) {
    const i = via.after_order_index;
    let next = i;
    if (i === split) next = liesBeforeInsert(via) ? i : i + 1;
    else if (i >= position) next = i + 1;
    if (next !== i) moved.push({ id: via.id, after_order_index: next });
  }
  return { vias: moved, remove: [] };
}

export function reanchorAfterRemove(vias: AnchoredVia[], position: number, stopCount: number): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING;

  if (stopCount <= 2) return { vias: [], remove: vias.map((v) => v.id) };
  return collect(vias, (i) => {
    if (position === 0) return i === 0 ? null : i - 1;
    if (position === stopCount - 1) return i === position - 1 ? null : i;
    if (i === position) return position - 1;
    return i > position ? i - 1 : i;
  });
}

export function reanchorByStopOrder(vias: AnchoredVia[], previousIds: number[], nextIds: number[]): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING;
  const moved: ReanchoredVia[] = [];
  const remove: number[] = [];
  for (const via of vias) {
    const stopId = previousIds[via.after_order_index]!;
    const next = stopId === undefined ? -1 : nextIds.indexOf(stopId);

    if (next === -1 || next >= nextIds.length - 1) {
      remove.push(via.id);
      continue;
    }
    if (next !== via.after_order_index) moved.push({ id: via.id, after_order_index: next });
  }
  return { vias: moved, remove };
}

export function reanchorAfterReorder(vias: AnchoredVia[], from: number, to: number, stopCount: number): Reanchoring {
  if (!vias.length || from === to) return EMPTY_REANCHORING;

  if (stopCount <= 2) return EMPTY_REANCHORING;
  const afterRemove = reanchorAfterRemove(vias, from, stopCount);
  const dropped = new Set(afterRemove.remove);
  const movedTo = new Map(afterRemove.vias.map((v) => [v.id, v.after_order_index] as const));

  const shifted: AnchoredVia[] = vias
    .filter((v) => !dropped.has(v.id))
    .map((v) => ({ ...v, after_order_index: movedTo.get(v.id) ?? v.after_order_index }));
  const afterInsert = reanchorAfterInsert(shifted, to, () => true);
  const finalIndex = new Map(afterInsert.vias.map((v) => [v.id, v.after_order_index] as const));

  const result: ReanchoredVia[] = [];
  for (const via of vias) {
    if (dropped.has(via.id)) continue;
    const mid = movedTo.get(via.id) ?? via.after_order_index;
    const end = finalIndex.get(via.id) ?? mid;
    if (end !== via.after_order_index) result.push({ id: via.id, after_order_index: end });
  }
  return { vias: result, remove: afterRemove.remove };
}

export function isEmptyReanchoring(r: Reanchoring): boolean {
  return r.vias.length === 0 && r.remove.length === 0;
}

export function parseAvoid(raw: unknown): RouteAvoidClass[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  const asked = new Set(raw.split(',').map((part) => part.trim().toLowerCase()));
  return AVOIDABLE.filter((cls) => asked.has(cls));
}

export const AVOIDABLE: readonly RouteAvoidClass[] = ['toll', 'motorway', 'ferry'];

export function serializeAvoid(classes: readonly RouteAvoidClass[]): string {
  return AVOIDABLE.filter((cls) => classes.includes(cls)).join(',');
}
