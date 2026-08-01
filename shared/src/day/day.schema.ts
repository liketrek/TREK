import { assignmentSchema } from '../assignment/assignment.schema';

import { z } from 'zod';

/**
 * Day + day-note API contract — single source of truth for the
 * /api/trips/:tripId/days and /api/trips/:tripId/days/:dayId/notes endpoints.
 *
 * Trip-scoped, both gated by the 'day_edit' permission. Served by the Nest
 * DaysController / DayNotesController (server/src/nest/days/). Day rows (with
 * their assignments) are wide and DB-derived, so list responses stay open. Day
 * notes cap text at 500 and time at 150 chars (the legacy
 * validateStringLengths middleware) — reproduced in the controller.
 */

/**
 * Day note entity (server day_notes table / dayNoteService). `sort_order` is
 * SQLite REAL; `icon` defaults to a note emoji.
 */
export const DAY_NOTE_COLOR_VALUES = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'] as const;
export const dayNoteColorSchema = z.enum(DAY_NOTE_COLOR_VALUES);
export type DayNoteColor = z.infer<typeof dayNoteColorSchema>;

export const dayNoteSchema = z.object({
  id: z.number(),
  day_id: z.number(),
  trip_id: z.number().optional(),
  text: z.string(),
  time: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: dayNoteColorSchema.nullable().optional(),
  sort_order: z.number().optional(),
  created_at: z.string().optional(),
});
export type DayNote = z.infer<typeof dayNoteSchema>;

/**
 * Day entity as returned by the day list/get endpoints
 * (server/src/services/dayService.ts -> listDays). Columns of the `days` table
 * plus the embedded `assignments` and `notes_items` arrays.
 */
export const daySchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  day_number: z.number().optional(),
  date: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // Whole-day default route mode (#1281); per-segment leg modes override it.
  default_transport_mode: z.string().nullable().optional(),
  assignments: z.array(assignmentSchema).optional(),
  notes_items: z.array(dayNoteSchema).optional(),
});
export type Day = z.infer<typeof daySchema>;

export const dayCreateRequestSchema = z.object({
  date: z.string().optional(),
  notes: z.string().optional(),
  // 1-based slot to insert a new empty day at (omit to append at the end).
  position: z.number().int().positive().optional(),
});
export type DayCreateRequest = z.infer<typeof dayCreateRequestSchema>;

/** Reorder whole days: the desired full sequence of this trip's day ids. */
export const dayReorderRequestSchema = z.object({
  orderedIds: z.array(z.number()),
});
export type DayReorderRequest = z.infer<typeof dayReorderRequestSchema>;

export const dayUpdateRequestSchema = z.object({
  notes: z.string().optional(),
  title: z.string().nullable().optional(),
});
export type DayUpdateRequest = z.infer<typeof dayUpdateRequestSchema>;

/**
 * Whole-day default route mode (#1281). The client always sends
 * `{ transport_mode: string | null }`; null clears the default. Kept loose (no
 * enum, no max) — the legacy raw-body route accepted any string.
 */
export const dayTransportRequestSchema = z.object({
  transport_mode: z.string().nullable().optional(),
});
export type DayTransportRequest = z.infer<typeof dayTransportRequestSchema>;

// `time`/`icon` accept null on the wire: the client's moveDayNote re-sends the
// entity fields (both nullable on dayNoteSchema) through create, and an explicit
// null time on update means "clear" (the legacy raw-body route accepted both).
export const dayNoteCreateRequestSchema = z.object({
  text: z.string().min(1).max(500),
  time: z.string().max(250).nullable().optional(),
  icon: z.string().nullable().optional(),
  color: dayNoteColorSchema.nullable().optional(),
  sort_order: z.number().optional(),
});
export type DayNoteCreateRequest = z.infer<typeof dayNoteCreateRequestSchema>;

export const dayNoteUpdateRequestSchema = z.object({
  text: z.string().max(500).optional(),
  time: z.string().max(250).nullable().optional(),
  icon: z.string().nullable().optional(),
  color: dayNoteColorSchema.nullable().optional(),
  sort_order: z.number().optional(),
});
export type DayNoteUpdateRequest = z.infer<typeof dayNoteUpdateRequestSchema>;
