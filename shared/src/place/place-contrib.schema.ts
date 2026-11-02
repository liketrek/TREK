import { paginationQuerySchema } from '../common/pagination.schema';

import { z } from 'zod';

/**
 * Community enrichment of place details: an installation sends the details its
 * users typed in (never what a provider, the assistant, a plugin or an import
 * filled) to the TREK Places API, so every installation gets better details
 * over time. Off until an admin agrees, for the whole installation.
 *
 * Three groups live here: where a place's value came from (origin tracking,
 * which the place write contracts carry), the admin surface under
 * /api/admin/places-contribute, and the wire format of the central service,
 * which the server validates every answer against.
 */

/** The place details that can be shared. `image` is the place's own picture, the `image_url` column. */
export const PLACE_CONTRIB_FIELDS = ['website', 'phone', 'email', 'opening_hours', 'description', 'image'] as const;
export const placeContribFieldSchema = z.enum(PLACE_CONTRIB_FIELDS);
export type PlaceContribField = z.infer<typeof placeContribFieldSchema>;

/**
 * Where the current value of a field came from. Only `user` is ever shared, and
 * only while the stored hash still matches the value. The server decides
 * `agent` (MCP), `plugin` (plugin RPC), `import` (file and list imports) and
 * `attachment` (a trip file made the picture); `unknown` is a changed value
 * nobody vouched for.
 */
export const PLACE_FIELD_ORIGINS = [
  'user',
  'attachment',
  'agent',
  'plugin',
  'import',
  'google',
  'amap',
  'osm',
  'trek',
  'wikimedia',
  'website',
  'unsplash',
  'enrichment',
  'unknown',
] as const;
export const placeFieldOriginSchema = z.enum(PLACE_FIELD_ORIGINS);
export type PlaceFieldOrigin = z.infer<typeof placeFieldOriginSchema>;

/** The origins a client may report: the user, or the provider a search pick or a details lookup came from. */
export const PLACE_CLIENT_ORIGINS = [
  'user',
  'google',
  'amap',
  'osm',
  'trek',
  'wikimedia',
  'website',
  'unsplash',
  'enrichment',
] as const;
export const placeClientOriginSchema = z.enum(PLACE_CLIENT_ORIGINS);
export type PlaceClientOrigin = z.infer<typeof placeClientOriginSchema>;

/**
 * `fieldOrigins` on a place create or update: which fields of this write the
 * user typed and which a provider filled. Optional and partial; a changed field
 * without an entry is stored as `unknown`, and the server keeps the provider's
 * origin when a value claimed as typed equals what a provider supplied.
 */
export const placeFieldOriginsSchema = z.object({
  website: placeClientOriginSchema.optional(),
  phone: placeClientOriginSchema.optional(),
  email: placeClientOriginSchema.optional(),
  opening_hours: placeClientOriginSchema.optional(),
  description: placeClientOriginSchema.optional(),
  image: placeClientOriginSchema.optional(),
});
export type PlaceFieldOrigins = z.infer<typeof placeFieldOriginsSchema>;

// ── Consent and the admin surface ───────────────────────────────────────────

/**
 * The version of the contribution terms the admin agrees to. Raised when the
 * text or the set of fields changes; sending stops until an admin agrees again.
 */
export const PLACE_CONTRIB_TERMS_VERSION = 1;

/** One switch per field. */
export const placeContribFieldSwitchesSchema = z.object({
  website: z.boolean(),
  phone: z.boolean(),
  email: z.boolean(),
  opening_hours: z.boolean(),
  description: z.boolean(),
  image: z.boolean(),
});
export type PlaceContribFieldSwitches = z.infer<typeof placeContribFieldSwitchesSchema>;

/**
 * The installation's decision, as the `places_contribute` app setting holds it
 * and the admin state answers it. `decision` is null until an admin chose,
 * `declined` keeps the prompt away until the terms change, `off` is an
 * agreement taken back.
 */
export const placeContribConsentSchema = z.object({
  enabled: z.boolean(),
  fields: placeContribFieldSwitchesSchema,
  termsVersion: z.number().int().nonnegative().nullable(),
  decision: z.enum(['agreed', 'declined', 'off']).nullable(),
  decidedBy: z.number().int().positive().nullable(),
  decidedAt: z.string().nullable(),
  /**
   * The agreement was given in a prompt that said what users typed before it
   * is shared as well (from TREK 5.1.1 on); only then does a field switched on
   * later catch up too. Absent on an agreement from 5.1.0.
   */
  includesEarlier: z.boolean().optional(),
});
export type PlaceContribConsent = z.infer<typeof placeContribConsentSchema>;

/**
 * Why this installation cannot send, checked in this order: the environment
 * ceiling, a non-production or demo instance, the index switched off, an own
 * TREK_PLACES_URL, TREK_SERVICES=off, no installation key (yet).
 */
export const placeContribIneligibleReasonSchema = z.enum([
  'env_off',
  'not_production',
  'demo',
  'index_off',
  'custom_places_url',
  'services_off',
  'no_key',
]);
export type PlaceContribIneligibleReason = z.infer<typeof placeContribIneligibleReasonSchema>;

/** Why sending waits although the admin agreed: a refused key, or the service not taking contributions now. */
export const placeContribPauseReasonSchema = z.enum(['key_invalid', 'key_refused', 'not_accepting']);
export type PlaceContribPauseReason = z.infer<typeof placeContribPauseReasonSchema>;

/** What became of one field, as the transmission log keeps it. */
export const placeContribLogResultSchema = z.enum(['accepted', 'duplicate', 'rejected', 'withheld', 'retracted']);
export type PlaceContribLogResult = z.infer<typeof placeContribLogResultSchema>;

const count = z.number().int().nonnegative();

/** GET /api/admin/places-contribute */
export const placeContribStateSchema = z.object({
  /** The terms an agreement has to name. */
  termsVersion: z.number().int().positive(),
  /** TREK_PLACES_CONTRIBUTE. */
  ceiling: z.enum(['off', 'admin']),
  eligible: z.boolean(),
  ineligibleReason: placeContribIneligibleReasonSchema.nullable(),
  consent: placeContribConsentSchema,
  /** Whether this admin gets the prompt now: eligible, undecided for these terms, not snoozed. */
  showPrompt: z.boolean(),
  /** When this admin's "not now" ends (ISO), or null. */
  snoozedUntil: z.string().nullable(),
  /** Whether sending is on right now: eligible, agreed to the current terms, at least one field. */
  active: z.boolean(),
  /** Log rows of the last 30 days, per result. */
  counts: z.object({ accepted: count, duplicate: count, rejected: count, withheld: count, retracted: count }),
  /** The day (YYYY-MM-DD) of the last accepted field, or null. */
  lastSuccessDay: z.string().nullable(),
  queue: z.object({ size: count, cap: count, full: z.boolean() }),
  pauseReason: placeContribPauseReasonSchema.nullable(),
  /** Open registration: anyone can make an account and type details, which the prompt warns about. */
  registrationOpen: z.boolean(),
});
export type PlaceContribState = z.infer<typeof placeContribStateSchema>;

/**
 * PUT /api/admin/places-contribute/decision
 *
 * - `agree`: the prompt's "Agree", with the field switches it showed and the
 *   terms version it was built for (a stale dialog answers 409).
 * - `snooze`: "Not now", for this admin, 14 days.
 * - `decline`: "No"; the prompt comes back only with new terms.
 * - `fields`: change the switches of an agreement; a field switched off drops
 *   its queued values, and with `withdraw` also what was sent of it.
 * - `off`: the master switch off; the queue is emptied, and with `withdraw`
 *   everything this installation sent is withdrawn.
 */
export const placeContribDecisionRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('agree'),
    termsVersion: z.number().int().positive(),
    fields: placeContribFieldSwitchesSchema,
  }),
  z.object({ action: z.literal('snooze') }),
  z.object({ action: z.literal('decline'), termsVersion: z.number().int().positive() }),
  z.object({
    action: z.literal('fields'),
    fields: placeContribFieldSwitchesSchema,
    withdraw: z.boolean().optional(),
  }),
  z.object({ action: z.literal('off'), withdraw: z.boolean().optional() }),
]);
export type PlaceContribDecisionRequest = z.infer<typeof placeContribDecisionRequestSchema>;

/** GET /api/admin/places-contribute/log?page=&perPage=&result=&field= */
export const placeContribLogQuerySchema = paginationQuerySchema.extend({
  result: placeContribLogResultSchema.optional(),
  field: placeContribFieldSchema.optional(),
});
export type PlaceContribLogQuery = z.infer<typeof placeContribLogQuerySchema>;

/** One line of the transmission log. No user, trip or row ids: the place's key and name, the field, what it said. */
export const placeContribLogEntrySchema = z.object({
  id: z.number().int().positive(),
  day: z.string(),
  key: z.string(),
  placeName: z.string(),
  field: placeContribFieldSchema,
  valueSummary: z.string().nullable(),
  result: placeContribLogResultSchema,
  reason: z.string().nullable(),
});
export type PlaceContribLogEntry = z.infer<typeof placeContribLogEntrySchema>;

export const placeContribLogResponseSchema = z.object({
  entries: z.array(placeContribLogEntrySchema),
  total: count,
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
});
export type PlaceContribLogResponse = z.infer<typeof placeContribLogResponseSchema>;

/** POST /api/admin/places-contribute/withdraw: the confirmation the button sends. */
export const placeContribWithdrawRequestSchema = z.object({ confirm: z.literal(true) });
export type PlaceContribWithdrawRequest = z.infer<typeof placeContribWithdrawRequestSchema>;

/** What the service withdrew, per kind as it counts them, and how many queued values were dropped here. */
export const placeContribWithdrawResponseSchema = z.object({
  withdrawn: z.record(z.string(), count),
  cleared: count,
});
export type PlaceContribWithdrawResponse = z.infer<typeof placeContribWithdrawResponseSchema>;

// ── The central service's wire format ───────────────────────────────────────

/** What the service made of one field. */
export const placeContribFieldResultSchema = z.enum([
  'published',
  'checking',
  'review',
  'unchanged',
  'rejected',
  'quota',
]);
export type PlaceContribFieldResult = z.infer<typeof placeContribFieldResultSchema>;

/** The idempotency id of one request. */
export const placeContribCidSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);

const shortText = z.string().max(200);

/** POST /v1/contrib/place: one place, the fields of it this installation's users typed in. */
export const placeContribPlaceBodySchema = z.object({
  v: z.literal(1),
  termsVersion: z.number().int().positive(),
  cid: placeContribCidSchema,
  key: z.string().max(80),
  fields: z.partialRecord(
    placeContribFieldSchema.exclude(['image']),
    z.object({
      value: z.string().min(1).max(4000),
      baseHash: z
        .string()
        .regex(/^[0-9a-f]{8,64}$/)
        .nullable(),
    }),
  ),
  place: z.object({
    name: z.string().max(200),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    country: z.string().length(2).nullable(),
  }),
});
export type PlaceContribPlaceBody = z.infer<typeof placeContribPlaceBodySchema>;

/** Its 200 answer. */
export const placeContribPlaceAnswerSchema = z.object({
  ok: z.literal(true),
  cid: z.string().max(64),
  duplicate: z.boolean(),
  key: z.string().max(80),
  community: z.object({ version: z.number().int().nonnegative() }).nullable().optional(),
  results: z.partialRecord(
    placeContribFieldSchema,
    z.object({
      result: placeContribFieldResultSchema,
      reason: shortText.nullable().optional(),
      flags: z.array(z.string().max(64)).max(32).optional(),
    }),
  ),
});
export type PlaceContribPlaceAnswer = z.infer<typeof placeContribPlaceAnswerSchema>;

/** POST /v1/contrib/image's 200 answer. */
export const placeContribImageAnswerSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    result: z.enum(['review', 'published', 'rejected', 'quota']),
    image: z
      .string()
      .regex(/^[0-9a-f]{32}$/)
      .nullable()
      .optional(),
    sameAs: z.boolean().optional(),
    reason: shortText.nullable().optional(),
  }),
});
export type PlaceContribImageAnswer = z.infer<typeof placeContribImageAnswerSchema>;

/** DELETE /v1/contrib/install's 200 answer. */
export const placeContribWithdrawAnswerSchema = z.object({
  ok: z.literal(true),
  withdrawn: z.record(z.string(), z.unknown()).optional(),
});
export type PlaceContribWithdrawAnswer = z.infer<typeof placeContribWithdrawAnswerSchema>;

/** Every refusal: `{ error: "<code>" }`, `field_not_accepted:<name>` naming the field. */
export const placeContribErrorSchema = z.object({ error: shortText });
export type PlaceContribError = z.infer<typeof placeContribErrorSchema>;
