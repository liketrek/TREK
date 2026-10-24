import {
  bikeProfileSchema,
  hikingPreferencesSchema,
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  paddleLockSchema,
  plannableTourTypeSchema,
  runProfileSchema,
  skiDisciplineSchema,
  skiRouteOptionsSchema,
  skiTechniqueSchema,
  type BikeProfile,
  type HikingPreferences,
  type PlannableTourType,
  type RunProfile,
  type TourMaxHikingDifficulty,
} from '@trek/shared';
import type { SkiChoice } from '../ski/skiChoice';
import { normalizePlannerWaypoints, type TourPlannerWaypoint } from './tourPlannerWaypoints';
import type { PaddleFieldValues } from './usePaddleFields';
import { DEFAULT_ROUTING_CHOICES, type RoutingChoices } from './useRoutingChoices';

/** CW-07: where a draft's points were read from outside the trip, said in the planner until it is saved. */
export type DraftSource = 'google_maps';

/** What a tour planned from an import starts with. */
export interface DerivedTourDraft {
  name: string;
  description?: string | null;
  website?: string | null;
  difficulty: TourMaxHikingDifficulty;
  /** The control points in order; a city walk's stop keeps the name it came with (CW-07). */
  points: Array<{ lat: number; lng: number; name?: string | null }>;
  /** The import the points were taken from; absent for a link read from outside the trip (CW-07). */
  sourcePlaceId?: number;
  /**
   * Plan the import over in place, keeping its id, days and notes (the server
   * keeps the recorded track to go back to), rather than as a new tour beside it.
   */
  inPlace: boolean;
  /** P2C-03: the import's revision, which a save planned over in place names. */
  revision?: number;
  /** A paddle import stays a paddle tour, with its boat and water, and a bike or run import its type with its profile. */
  tourType?: PlannableTourType;
  paddle?: PaddleFieldValues;
  bikeProfile?: BikeProfile;
  runProfile?: RunProfile;
  /** RUN-01: a run planned over keeps the pace it was planned at, so the runner need not type it again. */
  runPaceSecondsPerKm?: number | null;
  /** SKI-02: a ski import planned over keeps its discipline and technique. */
  ski?: SkiChoice;
  /** CW-07: where the points came from, said in the planner until the draft is saved. */
  source?: DraftSource;
}

/**
 * The tour planner's draft as it is kept on the account between visits (and,
 * before that, in this browser's local storage), and the check a kept draft
 * has to pass before the planner takes it back: a draft from an older
 * version, or one edited by hand, is dropped rather than half read.
 */
export interface DraftPayload {
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  name: string;
  description?: string;
  website?: string;
  plannedDurationMinutes?: number | null;
  breakAdditionalMinutes?: number | null;
  waypoints: TourPlannerWaypoint[];
  maxHikingDifficulty?: TourMaxHikingDifficulty;
  editingPlaceId?: number | null;
  /** The import a new tour is being planned from; carried until it is saved. */
  derivedFromPlaceId?: number | null;
  /** CW-07: a draft loaded from a Google Maps walk keeps saying so across a reload. */
  draftSource?: DraftSource | null;
  tourType?: PlannableTourType;
  paddle?: PaddleFieldValues;
  /** P2C-03: the revision of the tour the draft edits, as it was loaded. */
  baseRevision?: number | null;
  /** MF-08: what the hike asks the router for besides its limit. */
  hikingPreferences?: HikingPreferences | null;
  /** BIK-01: the profile a bike tour is routed for. */
  bikeProfile?: BikeProfile;
  /** SKI-02: a ski tour's discipline and cross-country technique; absent in a draft older than it. */
  ski?: SkiChoice;
  /** RUN-01: the profile a run is routed for, and its pace in seconds per km; absent in a draft older than them. */
  runProfile?: RunProfile;
  runPaceSecondsPerKm?: number | null;
}

const DRAFT_VERSIONS: ReadonlyArray<DraftPayload['version']> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function optionalMinutes(value: number | null | undefined): boolean {
  return (
    value === undefined ||
    value === null ||
    (Number.isInteger(value) && value >= 0 && value <= MAX_PLANNED_TOUR_DURATION_MINUTES)
  );
}

function optionalPlaceId(value: number | null | undefined): boolean {
  return value == null || (Number.isInteger(value) && value > 0);
}

function optionalSource(value: unknown): boolean {
  return value == null || value === 'google_maps';
}

function optionalDifficulty(value: number | null | undefined): boolean {
  return value == null || (Number.isInteger(value) && value >= 1 && value <= 6);
}

function validDraftWaypoint(point: TourPlannerWaypoint): boolean {
  return (
    !!point &&
    typeof point.id === 'string' &&
    Number.isFinite(point.lat) &&
    Math.abs(point.lat) <= 90 &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lng) <= 180 &&
    (point.lock == null || paddleLockSchema.safeParse(point.lock).success) &&
    (point.stageEnd === undefined || typeof point.stageEnd === 'boolean')
  );
}

/**
 * RUN-01: a run's pace as a draft keeps it, whole seconds. Text that was no
 * pace yet (NaN in the planner) is written as JSON null and comes back as none.
 */
function optionalPace(value: number | null | undefined): boolean {
  return value == null || (Number.isInteger(value) && value > 0);
}

/** SKI-02: a ski choice as a draft keeps it, each half nothing chosen or a value the contract knows. */
function optionalSki(value: SkiChoice | undefined): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object') return false;
  return (
    (value.discipline === null || skiDisciplineSchema.safeParse(value.discipline).success) &&
    (value.technique === null || skiTechniqueSchema.safeParse(value.technique).success) &&
    (value.options == null || skiRouteOptionsSchema.safeParse(value.options).success)
  );
}

/** The type of a draft and what its route is planned by, each one absent in a draft older than it. */
function validRouteChoices(draft: Partial<DraftPayload>): boolean {
  return (
    (draft.tourType === undefined || plannableTourTypeSchema.safeParse(draft.tourType).success) &&
    (draft.bikeProfile === undefined || bikeProfileSchema.safeParse(draft.bikeProfile).success) &&
    (draft.runProfile === undefined || runProfileSchema.safeParse(draft.runProfile).success) &&
    optionalPace(draft.runPaceSecondsPerKm) &&
    (draft.hikingPreferences == null || hikingPreferencesSchema.safeParse(draft.hikingPreferences).success) &&
    optionalSki(draft.ski) &&
    optionalDifficulty(draft.maxHikingDifficulty)
  );
}

export function validDraft(value: unknown): value is DraftPayload {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<DraftPayload>;
  return (
    draft.version !== undefined &&
    DRAFT_VERSIONS.includes(draft.version) &&
    typeof draft.name === 'string' &&
    optionalString(draft.description) &&
    optionalString(draft.website) &&
    optionalMinutes(draft.plannedDurationMinutes) &&
    optionalMinutes(draft.breakAdditionalMinutes) &&
    optionalPlaceId(draft.editingPlaceId) &&
    optionalPlaceId(draft.derivedFromPlaceId) &&
    optionalSource(draft.draftSource) &&
    optionalPlaceId(draft.baseRevision) &&
    validRouteChoices(draft) &&
    Array.isArray(draft.waypoints) &&
    draft.waypoints.every(validDraftWaypoint)
  );
}

/** A kept draft's JSON text as the planner takes it back, its points in order; null for none or one that fails the check. */
export function draftFromText(text: string | null): DraftPayload | null {
  if (text === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  return validDraft(parsed)
    ? { ...parsed, waypoints: normalizePlannerWaypoints(parsed.waypoints, parsed.tourType) }
    : null;
}

/** The routing choices a draft was planned with, each one it lacks at its default. */
export function draftChoices(draft: DraftPayload): RoutingChoices {
  return {
    difficulty: draft.maxHikingDifficulty ?? DEFAULT_ROUTING_CHOICES.difficulty,
    preferences: draft.hikingPreferences ?? DEFAULT_ROUTING_CHOICES.preferences,
    bikeProfile: draft.bikeProfile ?? DEFAULT_ROUTING_CHOICES.bikeProfile,
    runProfile: draft.runProfile ?? DEFAULT_ROUTING_CHOICES.runProfile,
  };
}
