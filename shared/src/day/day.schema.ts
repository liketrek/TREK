import { assignmentSchema } from '../assignment/assignment.schema';

import { z } from 'zod';

/**
 * Day + day-note API contract — single source of truth for the
 * /api/trips/:tripId/days and /api/trips/:tripId/days/:dayId/notes endpoints.
 *
 * Trip-scoped, both gated by the 'day_edit' permission. The legacy routes
 * (server/src/routes/days.ts + routes/dayNotes.ts) wrap dayService /
 * dayNoteService. Day rows (with their assignments) are wide and DB-derived, so
 * list responses stay open. Day notes cap text at 500 and time at 150 chars
 * (the legacy validateStringLengths middleware) — reproduced in the controller.
 */

/**
 * Day note entity (server day_notes table / dayNoteService). `sort_order` is
 * SQLite REAL; `icon` defaults to a note emoji.
 */
export const dayNoteSchema = z.object({
  id: z.number(),
  day_id: z.number(),
  trip_id: z.number().optional(),
  text: z.string(),
  time: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
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

export const dayNoteCreateRequestSchema = z.object({
  text: z.string().min(1).max(500),
  time: z.string().max(250).optional(),
  icon: z.string().optional(),
  sort_order: z.number().optional(),
});
export type DayNoteCreateRequest = z.infer<typeof dayNoteCreateRequestSchema>;

export const dayNoteUpdateRequestSchema = z.object({
  text: z.string().max(500).optional(),
  time: z.string().max(250).optional(),
  icon: z.string().optional(),
  sort_order: z.number().optional(),
});
export type DayNoteUpdateRequest = z.infer<typeof dayNoteUpdateRequestSchema>;
