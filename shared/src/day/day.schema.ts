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

export const dayCreateRequestSchema = z.object({
  date: z.string().optional(),
  notes: z.string().optional(),
});
export type DayCreateRequest = z.infer<typeof dayCreateRequestSchema>;

export const dayUpdateRequestSchema = z.object({
  notes: z.string().optional(),
  title: z.string().nullable().optional(),
});
export type DayUpdateRequest = z.infer<typeof dayUpdateRequestSchema>;

export const dayNoteCreateRequestSchema = z.object({
  text: z.string().min(1).max(500),
  time: z.string().max(150).optional(),
  icon: z.string().optional(),
  sort_order: z.number().optional(),
});
export type DayNoteCreateRequest = z.infer<typeof dayNoteCreateRequestSchema>;

export const dayNoteUpdateRequestSchema = z.object({
  text: z.string().max(500).optional(),
  time: z.string().max(150).optional(),
  icon: z.string().optional(),
  sort_order: z.number().optional(),
});
export type DayNoteUpdateRequest = z.infer<typeof dayNoteUpdateRequestSchema>;
