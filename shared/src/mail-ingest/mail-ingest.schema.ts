import { idSchema, idParamSchema, isoDateTime } from '../common/primitives.schema';
import { bookingImportPreviewItemSchema } from '../reservation/reservation.schema';
import {
  mailIngestCheckResultSchema,
  mailIngestCheckSchema,
  mailIngestFieldSchema,
  mailIngestHintSchema,
  mailIngestReasonSchema,
} from './mail-ingest-reason.schema';

import { z } from 'zod';

/**
 * Booking mail import contract: the /api/mail-ingest endpoints, the trip
 * address under /api/trips/:tripId/mail-ingest, and the admin status card.
 *
 * A person forwards a booking mail to their own address; the server reads it,
 * adds what passes its checks to the matching trip and keeps the rest in the
 * inbox ("open bookings") with a reason and three ways out. Timestamps are
 * ISO 8601 with an offset. Addresses carry their secret token, so they are
 * only ever sent to their owner and never through MCP.
 */

// ── Building blocks ─────────────────────────────────────────────────────────

/** How a mail reached the server: the instance's own IMAP box or webhook, the TREK Cloud relay, or an upload. */
export const mailIngestTransportSchema = z.enum(['imap', 'webhook', 'cloud', 'upload']);
export type MailIngestTransport = z.infer<typeof mailIngestTransportSchema>;

/** The attachment types a booking travels in; every other attachment is left in the mail. */
export const mailAttachmentKindSchema = z.enum(['pdf', 'pkpass', 'ics', 'jpeg', 'png', 'webp']);
export type MailAttachmentKind = z.infer<typeof mailAttachmentKindSchema>;

/** A mail's way through the import: waiting, being read, done, dropped (no booking), or given up on. */
export const mailIngestMessageStatusSchema = z.enum(['queued', 'processing', 'processed', 'discarded', 'failed']);
export type MailIngestMessageStatus = z.infer<typeof mailIngestMessageStatusSchema>;

/** Where a booking's fields came from: the AI, or one of the machine-readable sources read without it. */
export const mailIngestSourceSchema = z.enum(['ai', 'kitinerary', 'json_ld', 'ics', 'pkpass', 'text']);
export type MailIngestSource = z.infer<typeof mailIngestSourceSchema>;

/**
 * What became of one booking read from a mail: waiting in the inbox, added on
 * its own or by the person, filed as a document, discarded, set aside as a
 * duplicate or a conflict, or added and undone.
 */
export const mailIngestResolutionSchema = z.enum([
  'pending',
  'auto_applied',
  'applied',
  'filed',
  'discarded',
  'duplicate',
  'conflict',
  'undone',
]);
export type MailIngestResolution = z.infer<typeof mailIngestResolutionSchema>;

/** A trip as the inbox names it: enough to show and pick it, nothing of its content. */
export const mailIngestTripRefSchema = z.object({
  id: idSchema,
  title: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
});
export type MailIngestTripRef = z.infer<typeof mailIngestTripRefSchema>;

/** The trip the AI proposed to create when none fits; never created on its own. */
export const mailIngestSuggestedTripSchema = z.object({
  destination: z.string().max(120),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
});
export type MailIngestSuggestedTrip = z.infer<typeof mailIngestSuggestedTripSchema>;

// ── Address and preferences ────────────────────────────────────────────────

/**
 * A forwarding address: the person's own, or one for a single trip
 * (`trip_id`). The address holds its secret, so it reaches its owner only.
 */
export const mailIngestAddressSchema = z.object({
  id: idSchema,
  address: z.string().min(3).max(320),
  trip_id: idSchema.nullable(),
  created_at: isoDateTime,
  last_used_at: isoDateTime.nullable(),
});
export type MailIngestAddress = z.infer<typeof mailIngestAddressSchema>;

/** The person's own switches: the import itself, AI reading, and adding on its own or asking first. */
export const mailIngestPrefsSchema = z.object({
  enabled: z.boolean(),
  ai_enabled: z.boolean(),
  auto_add: z.boolean(),
});
export type MailIngestPrefs = z.infer<typeof mailIngestPrefsSchema>;

/** GET /api/mail-ingest/settings, and the answer to every write of the settings card. */
export const mailIngestSettingsResponseSchema = z.object({
  /** False where the import is off on this server or not part of the plan: the client shows nothing. */
  available: z.boolean(),
  address: mailIngestAddressSchema.nullable(),
  prefs: mailIngestPrefsSchema,
  /** Whether a mail could be read by AI for this person right now. */
  ai_available: z.boolean(),
  /** Open entries in the inbox. */
  pending: z.number().int().nonnegative(),
});
export type MailIngestSettingsResponse = z.infer<typeof mailIngestSettingsResponseSchema>;

/** PATCH /api/mail-ingest/settings: any of the switches, at least one. */
export const mailIngestPrefsUpdateRequestSchema = z
  .strictObject({
    enabled: z.boolean().optional(),
    ai_enabled: z.boolean().optional(),
    auto_add: z.boolean().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Name at least one setting',
  });
export type MailIngestPrefsUpdateRequest = z.infer<typeof mailIngestPrefsUpdateRequestSchema>;

/**
 * POST /api/mail-ingest/address/renew, and GET, POST
 * /api/trips/:tripId/mail-ingest/address. A renewed address replaces the old
 * one at once; null where a trip has no address of the person's.
 */
export const mailIngestAddressResponseSchema = z.object({ address: mailIngestAddressSchema.nullable() });
export type MailIngestAddressResponse = z.infer<typeof mailIngestAddressResponseSchema>;

// ── Messages and the bookings read from them ────────────────────────────────

export const mailIngestAttachmentSchema = z.object({
  file_name: z.string(),
  kind: mailAttachmentKindSchema,
  size: z.number().int().nonnegative(),
});
export type MailIngestAttachment = z.infer<typeof mailIngestAttachmentSchema>;

/** One forwarded mail, without its content: the inbox row's header. */
export const mailIngestMessageSchema = z.object({
  id: idSchema,
  transport: mailIngestTransportSchema,
  subject: z.string().nullable(),
  received_at: isoDateTime,
  status: mailIngestMessageStatusSchema,
  reason: mailIngestReasonSchema.nullable(),
  hints: z.array(mailIngestHintSchema),
  /** Whether the AI read it, which counts against the person's limits. */
  ai_used: z.boolean(),
  /** The trip whose address it came in on, null for the person's own address. */
  trip_id: idSchema.nullable(),
  attachments: z.array(mailIngestAttachmentSchema),
  /** The code of a forwarding confirmation, shown large so the person can copy it; nothing is clicked. */
  forwarding_code: z.string().max(64).nullable(),
});
export type MailIngestMessage = z.infer<typeof mailIngestMessageSchema>;

/**
 * One booking read from a mail, or, for a mail that yielded none, the entry
 * standing for the mail itself (`item` null) so the ways out still apply.
 */
export const mailIngestCandidateSchema = z.object({
  id: idSchema,
  message_id: idSchema,
  item: bookingImportPreviewItemSchema.nullable(),
  source: mailIngestSourceSchema.nullable(),
  uncertain_fields: z.array(mailIngestFieldSchema),
  checks: z.partialRecord(mailIngestCheckSchema, mailIngestCheckResultSchema),
  suggested_trip: mailIngestTripRefSchema.nullable(),
  suggested_new_trip: mailIngestSuggestedTripSchema.nullable(),
  resolution: mailIngestResolutionSchema,
  reason: mailIngestReasonSchema.nullable(),
  resolved_trip_id: idSchema.nullable(),
  reservation_ids: z.array(idSchema),
  file_ids: z.array(idSchema),
  created_at: isoDateTime,
  resolved_at: isoDateTime.nullable(),
  /** Until when an added booking can be undone in one tap; null once that is over or for one not added. */
  undo_until: isoDateTime.nullable(),
});
export type MailIngestCandidate = z.infer<typeof mailIngestCandidateSchema>;

/** An inbox row: the booking and the mail it came from. */
export const mailIngestInboxEntrySchema = mailIngestCandidateSchema.extend({ message: mailIngestMessageSchema });
export type MailIngestInboxEntry = z.infer<typeof mailIngestInboxEntrySchema>;

// ── The inbox ───────────────────────────────────────────────────────────────

/** GET /api/mail-ingest/inbox: open entries (the default) or decided ones, newest first, paged by id. */
export const mailIngestInboxQuerySchema = z.strictObject({
  status: z.enum(['open', 'resolved']).default('open'),
  before: idParamSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type MailIngestInboxQuery = z.infer<typeof mailIngestInboxQuerySchema>;

export const mailIngestInboxResponseSchema = z.object({
  entries: z.array(mailIngestInboxEntrySchema),
  pending: z.number().int().nonnegative(),
  /** The `before` of the next page, null on the last one. */
  next_before: idSchema.nullable(),
});
export type MailIngestInboxResponse = z.infer<typeof mailIngestInboxResponseSchema>;

/** GET /api/mail-ingest/inbox/count: the badge on the menu entry. */
export const mailIngestInboxCountResponseSchema = z.object({ pending: z.number().int().nonnegative() });
export type MailIngestInboxCountResponse = z.infer<typeof mailIngestInboxCountResponseSchema>;

/** GET /api/mail-ingest/messages/:id/preview: "Show mail", as plain text without its headers. */
export const mailIngestMessagePreviewResponseSchema = z.object({
  id: idSchema,
  subject: z.string().nullable(),
  received_at: isoDateTime,
  text: z.string(),
  attachments: z.array(mailIngestAttachmentSchema),
});
export type MailIngestMessagePreviewResponse = z.infer<typeof mailIngestMessagePreviewResponseSchema>;

// ── Acting on an entry ──────────────────────────────────────────────────────
// Every write takes an X-Idempotency-Key header, so a replayed tap from the
// offline queue does nothing twice; the key is not part of the bodies.

/**
 * POST /api/mail-ingest/candidates/:id/apply: add the booking, to the trip
 * the inbox suggested or, with `trip_id`, to the one the person picked.
 */
export const mailIngestApplyRequestSchema = z.strictObject({ trip_id: idSchema.optional() });
export type MailIngestApplyRequest = z.infer<typeof mailIngestApplyRequestSchema>;

/** POST /api/mail-ingest/candidates/:id/move: the added booking into another trip. */
export const mailIngestMoveRequestSchema = z.strictObject({ trip_id: idSchema });
export type MailIngestMoveRequest = z.infer<typeof mailIngestMoveRequestSchema>;

/** POST /api/mail-ingest/candidates/:id/file: the mail's attachments, or its text, as documents of a trip. */
export const mailIngestFileRequestSchema = z.strictObject({ trip_id: idSchema });
export type MailIngestFileRequest = z.infer<typeof mailIngestFileRequestSchema>;

/**
 * POST /api/mail-ingest/candidates/:id/undo. An added booking whose cost has
 * moved balances, or that was edited since, is only undone with `confirm`.
 */
export const mailIngestUndoRequestSchema = z.strictObject({ confirm: z.boolean().optional() });
export type MailIngestUndoRequest = z.infer<typeof mailIngestUndoRequestSchema>;

/** The 409 an undo without `confirm` answers with, naming what undoing it would touch. */
export const mailIngestUndoConflictSchema = z.object({
  error: z.string(),
  code: z.literal('needs_confirmation'),
  affects: z.array(z.enum(['balances', 'edited'])).min(1),
});
export type MailIngestUndoConflict = z.infer<typeof mailIngestUndoConflictSchema>;

/**
 * The answer of every action on an entry (apply, move, file, undo, discard,
 * read with AI): the entry as it is now, with what it created.
 */
export const mailIngestCandidateResponseSchema = z.object({ candidate: mailIngestCandidateSchema });
export type MailIngestCandidateResponse = z.infer<typeof mailIngestCandidateResponseSchema>;

/**
 * GET /api/mail-ingest/candidates/:id/prefill ("Fill in yourself"): the
 * booking form's starting values and the trip it opens in. The form saves
 * through the ordinary booking route.
 */
export const mailIngestPrefillResponseSchema = z.object({
  trip_id: idSchema.nullable(),
  item: bookingImportPreviewItemSchema,
});
export type MailIngestPrefillResponse = z.infer<typeof mailIngestPrefillResponseSchema>;

/**
 * POST /api/trips/:tripId/reservations/:id/mail-review ("Looks right"): clear
 * the check marks of the named fields, or of all of them.
 */
export const mailIngestReviewRequestSchema = z.strictObject({
  fields: z.array(mailIngestFieldSchema).min(1).optional(),
});
export type MailIngestReviewRequest = z.infer<typeof mailIngestReviewRequestSchema>;

export const mailIngestReviewResponseSchema = z.object({
  reservation_id: idSchema,
  /** The fields still marked. */
  uncertain_fields: z.array(mailIngestFieldSchema),
});
export type MailIngestReviewResponse = z.infer<typeof mailIngestReviewResponseSchema>;

// ── Mail coming in ──────────────────────────────────────────────────────────

/** POST /api/mail-ingest/upload: an .eml file read like a forwarded mail; a mail already in is not read twice. */
export const mailIngestUploadResponseSchema = z.object({
  message: mailIngestMessageSchema,
  duplicate: z.boolean(),
});
export type MailIngestUploadResponse = z.infer<typeof mailIngestUploadResponseSchema>;

/** POST /api/mail-ingest/inbound, the signed webhook: taken in, or known already. */
export const mailIngestInboundResponseSchema = z.object({
  accepted: z.literal(true),
  duplicate: z.boolean(),
});
export type MailIngestInboundResponse = z.infer<typeof mailIngestInboundResponseSchema>;

// ── Admin ───────────────────────────────────────────────────────────────────

/** How this instance takes mail in: not at all, its own IMAP box, a webhook, or the TREK Cloud relay. */
export const mailIngestTransportSettingSchema = z.enum(['off', 'imap', 'webhook', 'cloud']);
export type MailIngestTransportSetting = z.infer<typeof mailIngestTransportSettingSchema>;

const countSchema = z.number().int().nonnegative();

/**
 * GET /api/admin/mail-ingest/status: how the import runs, in counts only.
 * No subject, sender or content of any mail is part of it.
 */
export const mailIngestAdminStatusResponseSchema = z.object({
  transport: mailIngestTransportSettingSchema,
  last_ok_at: isoDateTime.nullable(),
  last_error: z.string().nullable(),
  lease_until: isoDateTime.nullable(),
  /** Mails of the last 24 hours, by status and by reason. */
  last_day: z.object({
    by_status: z.partialRecord(mailIngestMessageStatusSchema, countSchema),
    by_reason: z.partialRecord(mailIngestReasonSchema, countSchema),
  }),
  auto_applied: countSchema,
  undone: countSchema,
  ai_calls_today: countSchema,
  /** Open entries per person who has any, as numbers; who they are is not part of it. */
  backlog: z.array(countSchema),
});
export type MailIngestAdminStatusResponse = z.infer<typeof mailIngestAdminStatusResponseSchema>;
