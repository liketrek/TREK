import { assignmentPlaceSchema } from '../place/place.schema';

import { z } from 'zod';

/**
 * Assignment API contract — single source of truth for the place↔day itinerary
 * endpoints under /api/trips/:tripId/days/:dayId/assignments and
 * /api/trips/:tripId/assignments/:id/*.
 *
 * Trip-scoped; mutations use the 'day_edit' permission. The legacy route
 * (server/src/routes/assignments.ts, mounted on /api) wraps assignmentService.
 * Assignment rows carry joined place data and are kept open in responses; the
 * request schemas + the bespoke 404/400 controller messages pin the rest.
 */

/**
 * Assignment participant embedded on an assignment
 * (server/src/services/queryHelpers.ts -> loadParticipantsByAssignmentIds).
 */
export const assignmentParticipantSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  avatar: z.string().nullable().optional(),
});
export type AssignmentParticipant = z.infer<typeof assignmentParticipantSchema>;

/**
 * Assignment entity as returned by the day/assignment endpoints
 * (server/src/services/queryHelpers.ts -> formatAssignmentWithPlace, and
 * assignmentService.getAssignmentWithPlace). The embedded `place` is the trimmed
 * assignment-place projection, NOT the full place pool entity. Legacy
 * assignment_time / assignment_end_time fields may appear on older rows, but
 * activity timestamps are calculated from wake-up time, route travel, duration,
 * and assignment margins.
 */
export const assignmentSchema = z.object({
  id: z.number(),
  day_id: z.number(),
  place_id: z.number(),
  order_index: z.number(),
  notes: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  margin_before_minutes: z.number().nullable().optional(),
  margin_after_minutes: z.number().nullable().optional(),
  assignment_time: z.string().nullable().optional(),
  assignment_end_time: z.string().nullable().optional(),
  participants: z.array(assignmentParticipantSchema).optional(),
  created_at: z.string().optional(),
  place: assignmentPlaceSchema,
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const assignmentCreateRequestSchema = z.object({
  place_id: z.union([z.number(), z.string()]),
  notes: z.string().nullable().optional(),
});
export type AssignmentCreateRequest = z.infer<typeof assignmentCreateRequestSchema>;

export const assignmentReorderRequestSchema = z.object({
  orderedIds: z.array(z.number()),
});
export type AssignmentReorderRequest = z.infer<typeof assignmentReorderRequestSchema>;

export const assignmentMoveRequestSchema = z.object({
  new_day_id: z.union([z.number(), z.string()]),
  order_index: z.number().optional(),
});
export type AssignmentMoveRequest = z.infer<typeof assignmentMoveRequestSchema>;

export const assignmentTimeRequestSchema = z.object({
  duration_minutes: z.number().int().positive().nullable().optional(),
  margin_before_minutes: z.number().int().min(0).nullable().optional(),
  margin_after_minutes: z.number().int().min(0).nullable().optional(),
}).strict();
export type AssignmentTimeRequest = z.infer<typeof assignmentTimeRequestSchema>;

export const assignmentParticipantsRequestSchema = z.object({
  user_ids: z.array(z.number()),
});
export type AssignmentParticipantsRequest = z.infer<typeof assignmentParticipantsRequestSchema>;
