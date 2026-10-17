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
  // The desktop notes form clears optional fields by sending explicit null
  // (the service coerces falsy to its defaults), so they are all nullable.
  content: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});
export type CollabNoteCreateRequest = z.infer<typeof collabNoteCreateRequestSchema>;

export const collabNoteUpdateRequestSchema = z.object({
  title: z.string().optional(),
  // Same null-clearing protocol as create (the desktop form resends the whole
  // note object, with cleared fields as explicit null).
  content: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  pinned: z.union([z.boolean(), z.number()]).optional(),
  website: z.string().nullable().optional(),
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

// `z.url()` rather than `new URL(...)`: this package compiles against lib
// ES2022 only, deliberately, so it stays free of both DOM and Node globals and
// `URL` is not one of the names it has. The protocol check stays, because
// z.url() alone would accept mailto: and javascript:.
const httpUrl = z.url().refine((value) => /^https?:\/\//i.test(value.trim()), 'A valid http(s) URL is required');

export const collabLinkCreateRequestSchema = z.object({
  title: z.string().trim().min(1),
  url: httpUrl,
  pinned: z.union([z.boolean(), z.number()]).optional(),
});
export type CollabLinkCreateRequest = z.infer<typeof collabLinkCreateRequestSchema>;

export const collabLinkUpdateRequestSchema = z.object({
  title: z.string().trim().min(1).optional(),
  url: httpUrl.optional(),
  pinned: z.union([z.boolean(), z.number()]).optional(),
});
export type CollabLinkUpdateRequest = z.infer<typeof collabLinkUpdateRequestSchema>;

// text may be empty when the chat message is image-only (multipart). The
// controller still rejects a request with neither text nor files.
export const collabMessageCreateRequestSchema = z.object({
  text: z.string().max(5000).optional(),
  // Multipart fields arrive as strings; JSON chat still sends a number/null.
  reply_to: z.union([z.number(), z.string(), z.null()]).optional(),
});
export type CollabMessageCreateRequest = z.infer<typeof collabMessageCreateRequestSchema>;

export const collabReactionRequestSchema = z.object({
  emoji: z.string().min(1),
});
export type CollabReactionRequest = z.infer<typeof collabReactionRequestSchema>;

// ── Responses ───────────────────────────────────────────────────────────────
// Rows keep SQLite's storage spelling (0/1 flags, TEXT times), as the routes
// have always answered; the derived booleans the service adds are booleans.

/** A file attached to a note or a message, with the download route the client links to. */
export const collabAttachmentSchema = z.object({
  id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_size: z.number().nullable(),
  mime_type: z.string().nullable(),
  url: z.string(),
});
export type CollabAttachment = z.infer<typeof collabAttachmentSchema>;

/** A collab note with its author and attachments. */
export const collabNoteSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  user_id: z.number(),
  category: z.string().nullable(),
  title: z.string(),
  content: z.string().nullable(),
  color: z.string().nullable(),
  pinned: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  website: z.string().nullable(),
  username: z.string(),
  avatar: z.string().nullable(),
  avatar_url: z.string().nullable(),
  attachments: z.array(collabAttachmentSchema),
});
export type CollabNote = z.infer<typeof collabNoteSchema>;

export const collabNotesResponseSchema = z.object({ notes: z.array(collabNoteSchema) });
export type CollabNotesResponse = z.infer<typeof collabNotesResponseSchema>;
export const collabNoteResponseSchema = z.object({ note: collabNoteSchema });
export type CollabNoteResponse = z.infer<typeof collabNoteResponseSchema>;
/** POST notes/:id/files */
export const collabNoteFileResponseSchema = z.object({ file: collabAttachmentSchema });
export type CollabNoteFileResponse = z.infer<typeof collabNoteFileResponseSchema>;

/** A shared link with the name of whoever added it. */
export const collabLinkSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  user_id: z.number(),
  title: z.string(),
  url: z.string(),
  pinned: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  username: z.string(),
});
export type CollabLink = z.infer<typeof collabLinkSchema>;

export const collabLinksResponseSchema = z.object({ links: z.array(collabLinkSchema) });
export type CollabLinksResponse = z.infer<typeof collabLinksResponseSchema>;
export const collabLinkResponseSchema = z.object({ link: collabLinkSchema });
export type CollabLinkResponse = z.infer<typeof collabLinkResponseSchema>;

/** Someone who voted for a poll option. */
export const collabPollVoterSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  username: z.string(),
  avatar: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

/** A poll with its options and their voters. `options` is replaced by the formatted list; the stored JSON never leaves. */
export const collabPollSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  user_id: z.number(),
  question: z.string(),
  options: z.array(z.object({ text: z.unknown(), label: z.unknown(), voters: z.array(collabPollVoterSchema) })),
  multiple: z.number().nullable(),
  closed: z.number().nullable(),
  deadline: z.string().nullable(),
  created_at: z.string().nullable(),
  username: z.string(),
  avatar: z.string().nullable(),
  avatar_url: z.string().nullable(),
  is_closed: z.boolean(),
  multiple_choice: z.boolean(),
});
export type CollabPoll = z.infer<typeof collabPollSchema>;

export const collabPollsResponseSchema = z.object({ polls: z.array(collabPollSchema) });
export type CollabPollsResponse = z.infer<typeof collabPollsResponseSchema>;
export const collabPollResponseSchema = z.object({ poll: collabPollSchema });
export type CollabPollResponse = z.infer<typeof collabPollResponseSchema>;

/** One emoji on a message, with who reacted. */
export const collabReactionSchema = z.object({
  emoji: z.string(),
  users: z.array(z.object({ user_id: z.number(), username: z.string() })),
  count: z.number(),
});
export type CollabReaction = z.infer<typeof collabReactionSchema>;

/** A chat message with its author, the message it replies to, reactions and attachments. A deleted one keeps its row with empty text. */
export const collabMessageSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  user_id: z.number(),
  text: z.string(),
  reply_to: z.number().nullable(),
  created_at: z.string().nullable(),
  deleted: z.number().nullable(),
  username: z.string(),
  avatar: z.string().nullable(),
  reply_text: z.string().nullable(),
  reply_username: z.string().nullable(),
  user_avatar: z.string().nullable(),
  avatar_url: z.string().nullable(),
  reactions: z.array(collabReactionSchema),
  attachments: z.array(collabAttachmentSchema),
});
export type CollabMessage = z.infer<typeof collabMessageSchema>;

export const collabMessagesResponseSchema = z.object({ messages: z.array(collabMessageSchema) });
export type CollabMessagesResponse = z.infer<typeof collabMessagesResponseSchema>;
export const collabMessageResponseSchema = z.object({ message: collabMessageSchema });
export type CollabMessageResponse = z.infer<typeof collabMessageResponseSchema>;
/** POST messages/:id/react: the message's reactions after the toggle. */
export const collabReactionsResponseSchema = z.object({ reactions: z.array(collabReactionSchema) });
export type CollabReactionsResponse = z.infer<typeof collabReactionsResponseSchema>;

/** GET link-preview: what the page's Open Graph tags (or its title) say; nulls when nothing could be read. */
export const collabLinkPreviewResponseSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  site_name: z.string().nullable().optional(),
  url: z.string(),
});
export type CollabLinkPreviewResponse = z.infer<typeof collabLinkPreviewResponseSchema>;
