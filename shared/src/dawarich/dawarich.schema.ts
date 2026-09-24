import { z } from 'zod';
import { idSchema } from '../common/primitives.schema';

/**
 * Dawarich integration contracts (#2279, #214).
 *
 * Dawarich (github.com/Freika/dawarich) is a self-hosted location-history
 * tracker. The split of duties is deliberate and settled: **Dawarich records,
 * TREK plans and interprets.** TREK never starts a location tracker of its own,
 * never writes into Dawarich, and never keeps a copy of the raw GPS archive —
 * the track overlay is fetched for the window being looked at and thrown away
 * again.
 *
 * The connection is per user (Settings → Integrations); the global on/off is
 * the `dawarich` addon. Each user stores their own instance URL and API key,
 * which reaches exactly that user's own recordings.
 *
 * Everything Dawarich produces arrives as a **suggestion owned by the person
 * who connected the instance**. Nothing reaches a shared trip until they accept
 * it, because a background poll that edits a trip three other people are
 * planning is not a feature.
 */

// ── Per-user connection ──────────────────────────────────────────────────────

/** Placeholder returned instead of the stored key. Never the key itself. */
export const DAWARICH_KEY_MASK = '••••••••';

export const dawarichSettingsSchema = z.object({
  /** Instance origin, e.g. https://dawarich.example.com — TREK appends /api/v1 itself. */
  url: z.string().trim().max(2048),
  /** API key. Omitted, blank or the mask keeps the stored key unchanged. */
  apiKey: z.string().max(512).optional(),
  /** Allow self-signed TLS certificates, which LAN instances routinely use. */
  allowInsecureTls: z.boolean().optional().default(false),
  /**
   * Poll for new visits in the background. Off means the user pulls by hand —
   * some people would rather their trip planner not talk to their location
   * history on a timer.
   */
  syncEnabled: z.boolean().optional().default(true),
});
export type DawarichSettings = z.infer<typeof dawarichSettingsSchema>;

/**
 * What the connected instance actually offers, probed once per connect and
 * re-probed on every successful sync.
 *
 * This exists because three things were discussed with Dawarich's maintainer
 * and none of them had shipped as of 1.14.4: an `updated_at` on a visit, a
 * status filter on the visits endpoint, and an ISO-3166 country code on the
 * visit's place. TREK works without all three — change detection falls back to
 * a content hash, status filtering happens here, and the country is derived
 * from the coordinates — and picks the better path up automatically if a later
 * Dawarich version starts sending them. A missing capability is never a reason
 * to refuse to connect.
 */
export const dawarichCapabilitiesSchema = z.object({
  /** `GET /api/v1/visits` answered. Without it there are no suggestions. */
  visits: z.boolean(),
  /** `GET /api/v1/tracks` answered — pre-segmented lines, the good overlay source. */
  tracks: z.boolean(),
  /** `GET /api/v1/points` answered — the fallback overlay source. */
  points: z.boolean(),
  /** `GET /api/v1/locations` answered — used to tick off bucket-list entries. */
  locations: z.boolean(),
  /** `GET /api/v1/countries/visited_cities` answered — feeds the Atlas. */
  visitedCities: z.boolean(),
  /** A visit carries `updated_at`. As of 1.14.4 it does not. */
  visitUpdatedAt: z.boolean(),
  /** A visit's place carries a country code. As of 1.14.4 it does not. */
  visitCountryCode: z.boolean(),
  /** Reported by `X-Dawarich-Version`, so it is the instance's own word. */
  serverVersion: z.string().nullable(),
  /** When this probe ran, ISO-8601. */
  probedAt: z.string(),
});
export type DawarichCapabilities = z.infer<typeof dawarichCapabilitiesSchema>;

/** How the last sync attempt ended — what the connection card reports. */
export const DAWARICH_SYNC_STATES = ['never', 'ok', 'partial', 'failed'] as const;
export const dawarichSyncStateSchema = z.enum(DAWARICH_SYNC_STATES);
export type DawarichSyncState = z.infer<typeof dawarichSyncStateSchema>;

export const dawarichConnectionSchema = z.object({
  url: z.string(),
  apiKeyMasked: z.string(),
  allowInsecureTls: z.boolean(),
  syncEnabled: z.boolean(),
  connected: z.boolean(),
  /** ISO-8601 of the last sync that finished, successfully or not. */
  lastSyncAt: z.string().nullable(),
  lastSyncState: dawarichSyncStateSchema,
  /**
   * Why the last sync did not fully succeed, already translated by the server
   * into one of the reason codes below. Null when it did.
   */
  lastSyncError: z.string().nullable(),
  capabilities: dawarichCapabilitiesSchema.nullable(),
});
export type DawarichConnection = z.infer<typeof dawarichConnectionSchema>;

/**
 * Why a Dawarich call failed, as a code rather than a sentence.
 *
 * The client renders these through i18n. A raw upstream message would reach the
 * user in English on a German install, and some of them quote the URL back.
 */
export const DAWARICH_ERROR_CODES = [
  'unreachable',
  'unauthorized',
  'forbidden',
  'not_found',
  'rate_limited',
  'server_error',
  'invalid_response',
  'too_large',
  'not_connected',
  'addon_disabled',
] as const;
export const dawarichErrorCodeSchema = z.enum(DAWARICH_ERROR_CODES);
export type DawarichErrorCode = z.infer<typeof dawarichErrorCodeSchema>;

export const dawarichStatusSchema = z.object({
  connected: z.boolean(),
  /** Visits found in the probe window, so the user sees the connection did something. */
  visitCount: z.number().optional(),
  error: dawarichErrorCodeSchema.optional(),
  /** Free-text detail for the cases where the code alone is not actionable. */
  errorDetail: z.string().optional(),
  capabilities: dawarichCapabilitiesSchema.optional(),
});
export type DawarichStatus = z.infer<typeof dawarichStatusSchema>;

// ── Visit suggestions ────────────────────────────────────────────────────────

/**
 * What Dawarich thinks about a visit. Since 1.12.0 declining a visit **deletes**
 * it, so only these two remain — and, crucially, an unconfirmed visit is
 * displayed in Dawarich exactly like a confirmed one. Importing only
 * `confirmed` would leave most instances looking empty, which is the failure
 * mode the maintainer specifically warned about.
 */
export const DAWARICH_VISIT_STATUSES = ['suggested', 'confirmed'] as const;
export const dawarichVisitStatusSchema = z.enum(DAWARICH_VISIT_STATUSES);
export type DawarichVisitStatus = z.infer<typeof dawarichVisitStatusSchema>;

/** Where a suggestion stands in TREK. Independent of what Dawarich thinks of it. */
export const DAWARICH_SUGGESTION_STATES = ['new', 'accepted', 'dismissed'] as const;
export const dawarichSuggestionStateSchema = z.enum(DAWARICH_SUGGESTION_STATES);
export type DawarichSuggestionState = z.infer<typeof dawarichSuggestionStateSchema>;

/** What accepting a suggestion produced. */
export const DAWARICH_SUGGESTION_TARGETS = ['place', 'journal', 'bucket_list'] as const;
export const dawarichSuggestionTargetSchema = z.enum(DAWARICH_SUGGESTION_TARGETS);
export type DawarichSuggestionTarget = z.infer<typeof dawarichSuggestionTargetSchema>;

/**
 * One recorded stay, as TREK holds it for review.
 *
 * `source_changed` and `source_missing` are the honest answer to a question the
 * API cannot answer directly: Dawarich sends no `updated_at`, and deleting a
 * visit removes it from the list rather than marking it. So a changed visit is
 * detected by comparing a hash of the fields TREK shows, and a removed one by
 * noticing it was absent from a full re-read of the same window. Neither ever
 * rewrites something the user already accepted and possibly edited — they raise
 * a flag and leave the decision where it belongs.
 */
export const dawarichSuggestionSchema = z.object({
  id: idSchema,
  /** Dawarich's own visit id. The dedup key, together with the user. */
  sourceVisitId: z.string(),
  /** The trip whose dates this stay fell into when it was first seen. */
  tripId: idSchema.nullable(),
  tripTitle: z.string().nullable(),
  name: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** ISO-8601 with offset, exactly as Dawarich reported it. */
  startedAt: z.string(),
  endedAt: z.string(),
  /** The stay's length in minutes, the number the review list sorts and filters on. */
  durationMinutes: z.number(),
  /**
   * The local calendar date this stay belongs to, resolved in the trip's own
   * timezone. A stay that starts at 23:40 belongs to that evening, not to the
   * next morning because UTC says so.
   */
  localDate: z.string(),
  sourceStatus: dawarichVisitStatusSchema,
  /**
   * Dawarich's own confidence in the detection, 0..100. Null when its detector
   * reported none — older rows and manually created visits have none.
   */
  confidence: z.number().nullable(),
  /**
   * The same number as a word: `high` (>= 70), `medium` (>= 40), `low`.
   * Kept as a plain string rather than an enum, so a band a later Dawarich adds
   * arrives intact instead of failing validation for the whole suggestion.
   */
  confidenceBand: z.string().nullable(),
  state: dawarichSuggestionStateSchema,
  target: dawarichSuggestionTargetSchema.nullable(),
  acceptedPlaceId: idSchema.nullable(),
  acceptedJournalEntryId: idSchema.nullable(),
  acceptedBucketListItemId: idSchema.nullable(),
  /** The source row changed since this was accepted — shown, never auto-applied. */
  sourceChanged: z.boolean(),
  /** The source row is gone from Dawarich — shown, never auto-deleted. */
  sourceMissing: z.boolean(),
  /** A bucket-list entry this stay sits on top of, if one matched. */
  matchedBucketListItemId: idSchema.nullable(),
  matchedBucketListName: z.string().nullable(),
  /** ISO-3166-1 alpha-2, derived from the coordinates — Dawarich sends no code. */
  countryCode: z.string().nullable(),
  firstSeenAt: z.string(),
  lastSeenAt: z.string(),
});
export type DawarichSuggestion = z.infer<typeof dawarichSuggestionSchema>;

export const dawarichSuggestionListSchema = z.object({
  suggestions: z.array(dawarichSuggestionSchema),
  /** Repeated here so a panel can show provenance without a second request. */
  connected: z.boolean(),
  lastSyncAt: z.string().nullable(),
  lastSyncState: dawarichSyncStateSchema,
  lastSyncError: z.string().nullable(),
});
export type DawarichSuggestionList = z.infer<typeof dawarichSuggestionListSchema>;

/**
 * Accepting a suggestion. Every field the user could correct before saving is
 * here, because the review step exists precisely so a detector's guess can be
 * fixed rather than swallowed.
 */
export const dawarichAcceptSchema = z.object({
  target: dawarichSuggestionTargetSchema,
  /** Required for `place`; optional context for `journal`. */
  tripId: idSchema.optional(),
  /** Which day of the trip the place lands on. Omitted leaves it unplanned. */
  dayId: idSchema.optional(),
  /** Required for `journal`. */
  journalId: idSchema.optional(),
  /** Required for `bucket_list` — which wish this stay ticks off. */
  bucketListItemId: idSchema.optional(),
  /** Corrected name. Falls back to the suggestion's own. */
  name: z.string().trim().min(1).max(255).optional(),
  notes: z.string().max(5000).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  /** `YYYY-MM-DD`. Falls back to the suggestion's resolved local date. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** `HH:MM`. Falls back to the recorded arrival and departure. */
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});
export type DawarichAccept = z.infer<typeof dawarichAcceptSchema>;

export const dawarichAcceptResultSchema = z.object({
  suggestion: dawarichSuggestionSchema,
  /** What was created, so the caller can navigate straight to it. */
  createdPlaceId: idSchema.nullable(),
  createdJournalEntryId: idSchema.nullable(),
  bucketListItemId: idSchema.nullable(),
});
export type DawarichAcceptResult = z.infer<typeof dawarichAcceptResultSchema>;

/** Putting a dismissed or accepted suggestion back into review. */
export const dawarichSuggestionStateSchemaBody = z.object({
  state: z.enum(['new', 'dismissed']),
});
export type DawarichSuggestionStateBody = z.infer<typeof dawarichSuggestionStateSchemaBody>;

// ── Track overlay ────────────────────────────────────────────────────────────

/**
 * How a segment was travelled, as Dawarich classified it. Passed through rather
 * than mapped onto TREK's own transport modes: the two vocabularies do not line
 * up (Dawarich has `stationary`, TREK has `ferry`), and inventing a mapping
 * would put a confident wrong label on a recorded fact.
 */
export const dawarichTrackSegmentSchema = z.object({
  /** `[lat, lng]` pairs, matching how TREK stores every other track. */
  points: z.array(z.tuple([z.number(), z.number()])),
  /** Dawarich's `dominant_mode`, or null on an instance too old to report one. */
  mode: z.string().nullable(),
  startedAt: z.string(),
  endedAt: z.string(),
  distanceMeters: z.number().nullable(),
});
export type DawarichTrackSegment = z.infer<typeof dawarichTrackSegmentSchema>;

/** One local calendar day of recorded movement. */
export const dawarichTrackDaySchema = z.object({
  /** `YYYY-MM-DD` in the trip's timezone. */
  date: z.string(),
  segments: z.array(dawarichTrackSegmentSchema),
});
export type DawarichTrackDay = z.infer<typeof dawarichTrackDaySchema>;

/**
 * The recorded route for a window, as fetched — not as stored. Nothing here is
 * written to TREK's database; the next request asks Dawarich again.
 */
export const dawarichTrackSchema = z.object({
  days: z.array(dawarichTrackDaySchema),
  /**
   * Which endpoint answered. `tracks` is pre-segmented and cheap; `points` is
   * the fallback for an instance that has not generated tracks yet, thinned
   * before it leaves the server.
   */
  source: z.enum(['tracks', 'points']),
  /** ISO-8601 of the fetch, so the map can say how fresh the line is. */
  fetchedAt: z.string(),
  /** Points after thinning, across all days. */
  pointCount: z.number(),
  /** The window hit the page cap and the line is incomplete. Said out loud, never hidden. */
  truncated: z.boolean(),
});
export type DawarichTrack = z.infer<typeof dawarichTrackSchema>;

// ── Atlas ────────────────────────────────────────────────────────────────────

/**
 * A country Dawarich's recordings say the user was in, offered to the Atlas.
 *
 * Offered, not applied: the Atlas is a thing people curate, and a poll that
 * quietly ticks off countries would overwrite a deliberate choice. Entries
 * already marked by hand come back with `alreadyVisited` so they are shown as
 * confirmation rather than as something new.
 */
export const dawarichAtlasCountrySchema = z.object({
  /** ISO-3166-1 alpha-2, resolved from Dawarich's country name. */
  countryCode: z.string(),
  /** Dawarich's own spelling, kept so an unresolved country can still be named. */
  sourceName: z.string(),
  cities: z.array(
    z.object({
      name: z.string(),
      /** How long the recordings put the user there, in minutes. */
      minutes: z.number(),
      /**
       * ISO-8601 of the most recent point in that city, or null when the
       * instance sent none. Nullable rather than defaulted: a city stamped
       * 1970-01-01 looks like data and is not.
       */
      lastSeenAt: z.string().nullable(),
    }),
  ),
  alreadyVisited: z.boolean(),
});
export type DawarichAtlasCountry = z.infer<typeof dawarichAtlasCountrySchema>;

export const dawarichAtlasSuggestionsSchema = z.object({
  countries: z.array(dawarichAtlasCountrySchema),
  /** Dawarich country names that matched no ISO code — named rather than dropped. */
  unresolved: z.array(z.string()),
  fetchedAt: z.string(),
});
export type DawarichAtlasSuggestions = z.infer<typeof dawarichAtlasSuggestionsSchema>;

export const dawarichAtlasAcceptSchema = z.object({
  countryCodes: z.array(z.string().length(2)).min(1).max(300),
});
export type DawarichAtlasAccept = z.infer<typeof dawarichAtlasAcceptSchema>;

// ── Bucket list ──────────────────────────────────────────────────────────────

/**
 * Result of asking Dawarich whether the user ever reached a place on their
 * bucket list.
 *
 * Proximity alone is not a visit — driving past a cathedral is not visiting it —
 * so a match needs both a distance and a dwell time, and both are reported so
 * the user can judge the call rather than trust it.
 */
export const dawarichBucketMatchSchema = z.object({
  itemId: idSchema,
  name: z.string(),
  /** Null when the recordings show nothing near it. */
  match: z
    .object({
      /** ISO-8601 of the stay's start. */
      at: z.string(),
      minutes: z.number(),
      distanceMeters: z.number(),
      /** How many recorded points backed the match. */
      points: z.number(),
    })
    .nullable(),
  /** Already ticked off before this scan ran. */
  alreadyVisited: z.boolean(),
});
export type DawarichBucketMatch = z.infer<typeof dawarichBucketMatchSchema>;

export const dawarichBucketScanSchema = z.object({
  matches: z.array(dawarichBucketMatchSchema),
  /** Entries skipped because they carry no coordinates — nothing to match against. */
  skippedWithoutCoordinates: z.number(),
  /** The scan stopped at the per-run cap; run it again for the rest. */
  truncated: z.boolean(),
  fetchedAt: z.string(),
});
export type DawarichBucketScan = z.infer<typeof dawarichBucketScanSchema>;

export const dawarichBucketConfirmSchema = z.object({
  itemIds: z.array(idSchema).min(1).max(200),
  /** ISO-8601 the visit is recorded at. Defaults to the matched stay. */
  visitedAt: z.string().optional(),
});
export type DawarichBucketConfirm = z.infer<typeof dawarichBucketConfirmSchema>;

// ── Tuning ───────────────────────────────────────────────────────────────────

/**
 * What counts as being somewhere.
 *
 * These are TREK's numbers, not Dawarich's: Dawarich decides where a visit was,
 * TREK decides whether that is enough to call a wish fulfilled. Kept next to the
 * contract so the server, the tests and the help text cannot disagree.
 */
export const DAWARICH_BUCKET_MATCH_RADIUS_M = 250;
export const DAWARICH_BUCKET_MATCH_MIN_MINUTES = 20;
/** Bucket-list entries examined per scan — one upstream request each. */
export const DAWARICH_BUCKET_SCAN_LIMIT = 50;
/** Points kept per day after thinning, so a month-long trip stays drawable. */
export const DAWARICH_TRACK_POINTS_PER_DAY = 600;
/**
 * Days before a trip's start a sync still asks about, for every trip: the
 * visits endpoint filters on the start of a visit, so a stay that began the
 * evening before is invisible at an exact boundary.
 */
export const DAWARICH_SYNC_LOOKBACK_DAYS = 3;
/** Days past a trip's end still worth polling — a stay can end after midnight. */
export const DAWARICH_SYNC_LOOKAHEAD_DAYS = 1;
