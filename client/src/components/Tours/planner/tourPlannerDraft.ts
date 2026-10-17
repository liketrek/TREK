import {
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  paddleLockSchema,
  plannableTourTypeSchema,
  type PlannableTourType,
  type TourMaxHikingDifficulty,
} from '@trek/shared';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';
import type { PaddleFieldValues } from './usePaddleFields';

/**
 * The tour planner's draft as it is kept in local storage between visits, and
 * the check a stored draft has to pass before the planner takes it back: a
 * draft from an older version, or one edited by hand, is dropped rather than
 * half read.
 */
export interface DraftPayload {
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
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
  tourType?: PlannableTourType;
  paddle?: PaddleFieldValues;
}

const DRAFT_VERSIONS: ReadonlyArray<DraftPayload['version']> = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
    (point.lock == null || paddleLockSchema.safeParse(point.lock).success)
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
    optionalDifficulty(draft.maxHikingDifficulty) &&
    (draft.tourType === undefined || plannableTourTypeSchema.safeParse(draft.tourType).success) &&
    Array.isArray(draft.waypoints) &&
    draft.waypoints.every(validDraftWaypoint)
  );
}
