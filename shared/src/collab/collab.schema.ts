import { z } from 'zod';

/**
 * Collab API contract — single source of truth for the /api/trips/:tripId/collab
 * endpoints (shared notes + file attachments, decision polls, group chat with
 * reactions, link previews).
 *
 * Trip-scoped; mutations use 'collab_edit' (file uploads use 'file_upload'). The
 * legacy route (server/src/routes/collab.ts) wraps collabService and broadcasts
 * over WebSocket + fires chat/note notifications. Rows are wide and kept open;
 * the request schemas + the bespoke 400/403/404 controller messages pin the rest.
 */

export const collabNoteCreateRequestSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  website: z.string().optional(),
});
export type CollabNoteCreateRequest = z.infer<typeof collabNoteCreateRequestSchema>;

export const collabNoteUpdateRequestSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  pinned: z.union([z.boolean(), z.number()]).optional(),
  website: z.string().optional(),
});
export type CollabNoteUpdateRequest = z.infer<typeof collabNoteUpdateRequestSchema>;

export const collabPollCreateRequestSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.unknown()).min(2),
  multiple: z.boolean().optional(),
  multiple_choice: z.boolean().optional(),
  deadline: z.string().optional(),
});
export type CollabPollCreateRequest = z.infer<typeof collabPollCreateRequestSchema>;

export const collabPollVoteRequestSchema = z.object({
  option_index: z.number(),
});
export type CollabPollVoteRequest = z.infer<typeof collabPollVoteRequestSchema>;

export const collabMessageCreateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  reply_to: z.number().nullable().optional(),
});
export type CollabMessageCreateRequest = z.infer<typeof collabMessageCreateRequestSchema>;

export const collabReactionRequestSchema = z.object({
  emoji: z.string().min(1),
});
export type CollabReactionRequest = z.infer<typeof collabReactionRequestSchema>;
