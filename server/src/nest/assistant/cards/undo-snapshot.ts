import type { UndoSnapshot } from './card-types';
import { recordOf, type Row } from './card-values';

/**
 * The pieces an undo check reads the trip with, for the core checks
 * (assistant-undo.helpers.ts) and every package's own `undo.unchanged`. An
 * undo removes the created row with everything that hangs off it, so a check
 * holds that row to what the change created and asks whether anything else
 * has come to depend on it since.
 */

type TripReads = Pick<UndoSnapshot, 'summary' | 'places'>;

export function rowsOf(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}

/** The fields that say a row is still the one that was created; a field either side lacks is not compared. */
export const STABLE_FIELDS = {
  place: ['name', 'updated_at', 'lat', 'lng', 'address', 'category_id', 'description', 'notes'],
  assignment: ['day_id', 'place_id'],
  note: ['text', 'time', 'icon', 'color'],
  packing: ['name', 'updated_at', 'checked', 'quantity', 'category'],
  todo: ['name', 'checked', 'due_date', 'description', 'priority', 'assigned_user_id', 'category'],
  budget: ['name', 'total_price', 'currency', 'category', 'note', 'expense_date'],
} as const;

export function same(created: Row, current: Row | undefined, fields: readonly string[]): boolean {
  if (!current) return false;
  return fields.every((field) => !(field in created) || !(field in current) || created[field] === current[field]);
}

export function byId(rows: Row[], id: unknown): Row | undefined {
  return rows.find((row) => row.id === id);
}

export function snapshotDays(snapshot: TripReads): Row[] {
  return rowsOf(recordOf(snapshot.summary).days);
}

export function snapshotAssignments(snapshot: TripReads): Row[] {
  return snapshotDays(snapshot).flatMap((day) => rowsOf(day.assignments));
}

/** The trip's places as `list_places` answered. */
export function snapshotPlaces(snapshot: TripReads): Row[] {
  return rowsOf(recordOf(snapshot.places).places);
}

/** A created place, unchanged and still only where the change put it: on no other day, in no booking or expense. */
export function placeUnchanged(result: Row, snapshot: TripReads): boolean {
  const created = recordOf(result.place);
  const current = byId(snapshotPlaces(snapshot), created.id);
  if (!same(created, current, STABLE_FIELDS.place)) return false;
  const ownAssignment = recordOf(result.assignment).id;
  const plannedElsewhere = snapshotAssignments(snapshot).some(
    (a) => a.place_id === created.id && a.id !== ownAssignment,
  );
  const summary = recordOf(snapshot.summary);
  const referenced = [
    ...rowsOf(summary.reservations),
    ...rowsOf(summary.accommodations),
    ...rowsOf(recordOf(summary.budget).items),
  ].some((row) => row.place_id === created.id);
  return !plannedElsewhere && !referenced;
}
