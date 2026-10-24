import { walkStationsOf } from '@trek/shared';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

/**
 * CW-02: a city walk's time, walking and staying kept apart. While no stay is
 * entered at all, the walk is planned as its walking time alone and nothing
 * calls the stays unknown. Once some are entered, one left empty is unknown,
 * never nothing: the total then counts only what is known and says it is at
 * least that much. A point passed through is a stay of 0, entered on purpose.
 */
export interface WalkTimes {
  walkingMinutes: number | null;
  /** The stays entered, summed. */
  stayMinutes: number;
  /** Stations whose stay nobody entered. */
  unknownStays: number;
  /** The walk's stations, so that some stays unknown and all of them unknown read apart. */
  stations: number;
  /**
   * CW-12: the minutes its crossings by boat take, never walking; null while
   * the router gave one of them no time, absent for a walk without any.
   */
  ferryMinutes?: number | null;
  /** Walking, the boat and the known stays; what is known of them while the walking time is not, null while nothing is. */
  totalMinutes: number | null;
  /** The total leaves out a stay, a boat's time or the walking time that is not known. */
  partial: boolean;
}

/** The times of a walk from its parts: the walking time, the stays entered, how many are unknown and of how many. */
export function walkTimesOf(parts: Omit<WalkTimes, 'totalMinutes' | 'partial'>): WalkTimes {
  const { walkingMinutes, stayMinutes, unknownStays, stations, ferryMinutes } = parts;
  // Without a walking time the stays entered are still part of the whole: at least that much, never nothing.
  const known = stayMinutes + (ferryMinutes ?? 0);
  const totalMinutes = walkingMinutes !== null ? walkingMinutes + known : known > 0 ? known : null;
  return {
    ...parts,
    totalMinutes,
    partial:
      totalMinutes !== null &&
      (someStaysUnknown({ unknownStays, stations }) || walkingMinutes === null || ferryMinutes === null),
  };
}

/** Some stays entered and some not: none entered at all means none planned, not unknown. */
export function someStaysUnknown({ unknownStays, stations }: Pick<WalkTimes, 'unknownStays' | 'stations'>): boolean {
  return unknownStays > 0 && unknownStays < stations;
}

export function walkTimes(points: readonly TourPlannerWaypoint[], walkingMinutes: number | null): WalkTimes {
  // A shaping point is no station, and the way back of a loop is its start again: its stay counts once.
  const stations = walkStationsOf(points);
  return walkTimesOf({
    walkingMinutes,
    stayMinutes: stations.reduce((sum, station) => sum + (station.stayMinutes ?? 0), 0),
    unknownStays: stations.filter((station) => station.stayMinutes == null).length,
    stations: stations.length,
  });
}

/** What the station dialog edits; the rest of the point stays as it is. */
export type StationFields = Pick<TourPlannerWaypoint, 'name' | 'stayMinutes' | 'importance' | 'protected'>;

/** The point with the fields as edited, each one left out where it is empty. */
export function withStationFields(point: TourPlannerWaypoint, fields: StationFields): TourPlannerWaypoint {
  const { name: _name, stayMinutes: _stay, importance: _importance, protected: _protected, ...rest } = point;
  const name = fields.name?.trim();
  return {
    ...rest,
    ...(name ? { name } : {}),
    ...(fields.stayMinutes != null ? { stayMinutes: fields.stayMinutes } : {}),
    ...(fields.importance ? { importance: fields.importance } : {}),
    ...(fields.protected ? { protected: true } : {}),
  };
}

/** A stay as typed: empty is unknown, a whole number from 0 to a day is minutes, anything else is not taken. */
export function parseStay(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  if (!/^\d{1,4}$/.test(trimmed)) return undefined;
  const minutes = Number(trimmed);
  return minutes <= 24 * 60 ? minutes : undefined;
}
