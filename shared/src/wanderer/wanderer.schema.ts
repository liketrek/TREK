import { idSchema } from '../common/primitives.schema';
import { tourListItemSchema } from '../tours/tours.schema';

import { z } from 'zod';

/**
 * wanderer integration contracts (RS-03 to RS-06, MF-02).
 *
 * wanderer (github.com/open-wanderer/wanderer) is a self-hosted trail
 * database. A user connects their own instance with a personal API token; the
 * token reaches that user's whole account, so it is kept like a password: it
 * is stored encrypted, never sent back, and every call to the instance goes
 * from the server.
 *
 * What a trip gets out of it is a snapshot: a trail is copied into the trip as
 * an independent tour, with its original GPX and a note of where it came from.
 * Nothing is synchronised. A later import of the same trail is compared with
 * the snapshot and the user decides what happens; TREK never replaces or
 * deletes a tour on its own.
 *
 * Verified against wanderer v0.21.0 (2026-09-28), its source and a running
 * instance: auth is `Authorization: Bearer wanderer_key_...` on `/api/v1/*`,
 * a token without that prefix is silently treated as anonymous, and a revoked
 * one answers HTTP 500.
 */

/** Every token wanderer issues starts with this; anything else is read as no token at all. */
export const WANDERER_TOKEN_PREFIX = 'wanderer_key_';

/** Placeholder returned instead of the stored token. Never the token itself. */
export const WANDERER_TOKEN_MASK = '••••••••';

/** Why a call to the instance did not work, as a code the client translates. */
export const wandererErrorCodeSchema = z.enum([
  /** The admin has not allowed wanderer under Tours. */
  'disabled',
  'not_connected',
  'invalid_url',
  /** The SSRF guard refused the address: a private network the admin has not allowed, or worse. */
  'blocked_address',
  'unreachable',
  'tls',
  'unauthorized',
  'forbidden',
  'not_found',
  /** The trail is someone else's: only the connected account's own trails are imported. */
  'not_own_trail',
  'invalid_response',
  'too_large',
  'server_error',
]);
export type WandererErrorCode = z.infer<typeof wandererErrorCodeSchema>;

// ── Per-user connection ──────────────────────────────────────────────────────

const instanceUrlSchema = z.string().trim().min(1).max(2048);

/** A typed token, or the mask / nothing for "keep the stored one". */
const tokenInputSchema = z
  .string()
  .trim()
  .max(512)
  .refine((value) => value === '' || value === WANDERER_TOKEN_MASK || value.startsWith(WANDERER_TOKEN_PREFIX), {
    message: 'not a wanderer API token',
  });

export const wandererSettingsRequestSchema = z.object({
  /** Instance origin, e.g. https://wanderer.example.com; TREK appends /api/v1 itself. */
  url: instanceUrlSchema,
  /** Omitted, blank or the mask keeps the stored token. */
  token: tokenInputSchema.optional(),
  /** Allow a self-signed certificate, which instances on a home network often use. */
  allowInsecureTls: z.boolean().optional().default(false),
});
export type WandererSettingsRequest = z.infer<typeof wandererSettingsRequestSchema>;

/** A test of what is typed in the form, before it is saved; blank fields fall back to the stored ones. */
export const wandererTestRequestSchema = z.object({
  url: instanceUrlSchema.optional(),
  token: tokenInputSchema.optional(),
  allowInsecureTls: z.boolean().optional(),
});
export type WandererTestRequest = z.infer<typeof wandererTestRequestSchema>;

export const wandererConnectionSchema = z.object({
  url: z.string(),
  /** The mask when a token is stored, empty when none is. */
  tokenMasked: z.string(),
  allowInsecureTls: z.boolean(),
  connected: z.boolean(),
  /** When the connection last answered a test, and how. */
  lastCheckedAt: z.string().nullable(),
  lastCheckOk: z.boolean().nullable(),
  lastCheckError: wandererErrorCodeSchema.nullable(),
});
export type WandererConnection = z.infer<typeof wandererConnectionSchema>;

export const wandererSaveResponseSchema = z.object({
  success: z.literal(true),
  /** The address resolves into a private network: saved, but worth a word. */
  warning: z.literal('private_ip').optional(),
});
export type WandererSaveResponse = z.infer<typeof wandererSaveResponseSchema>;

export const wandererTestResponseSchema = z.object({
  ok: z.boolean(),
  code: wandererErrorCodeSchema.optional(),
  /** How many trails the token can see, when the instance said. */
  trailCount: z.number().int().nonnegative().nullable().optional(),
});
export type WandererTestResponse = z.infer<typeof wandererTestResponseSchema>;

// ── Trails ───────────────────────────────────────────────────────────────────

const latitude = z.number().finite().min(-90).max(90);
const longitude = z.number().finite().min(-180).max(180);

/** The part of the map being looked at. `west` greater than `east` crosses the antimeridian. */
export const wandererBboxSchema = z
  .object({ south: latitude, west: longitude, north: latitude, east: longitude })
  .refine((box) => box.south <= box.north, { message: 'south must not lie north of north' });
export type WandererBbox = z.infer<typeof wandererBboxSchema>;

export const WANDERER_SEARCH_PAGE_SIZE = 20;
/** Deep pages of a search are a scroll nobody makes; the cap keeps a loop from walking an archive. */
export const WANDERER_SEARCH_MAX_PAGE = 25;

export const wandererSearchRequestSchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  page: z.number().int().min(1).max(WANDERER_SEARCH_MAX_PAGE).optional().default(1),
  /** Only trails whose extent overlaps this box. */
  bbox: wandererBboxSchema.optional(),
});
export type WandererSearchRequest = z.input<typeof wandererSearchRequestSchema>;

export const wandererDifficultySchema = z.enum(['easy', 'moderate', 'difficult']);
export type WandererDifficulty = z.infer<typeof wandererDifficultySchema>;

/**
 * wanderer's three levels on the one scale tours use, the SAC hiking scale: an
 * easy trail is a T1 walk, a moderate one a T2 mountain hike, a difficult one
 * a T3. wanderer says no more than that, so nothing above T3 is claimed.
 */
export function wandererDifficultyToSac(difficulty: WandererDifficulty | null | undefined): 1 | 2 | 3 | null {
  if (difficulty === 'easy') return 1;
  if (difficulty === 'moderate') return 2;
  if (difficulty === 'difficult') return 3;
  return null;
}

/**
 * A trail as the search lists it: the facts the instance indexes, its line
 * simplified for a preview, and whether this trip already holds a snapshot of it.
 */
export const wandererTrailSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  distanceM: z.number().nullable(),
  durationS: z.number().nullable(),
  elevationGainM: z.number().nullable(),
  elevationLossM: z.number().nullable(),
  difficulty: wandererDifficultySchema.nullable(),
  public: z.boolean(),
  author: z.string().nullable(),
  /** `[lat, lng]` pairs of the instance's own simplified line; empty when it has none. */
  line: z.array(z.tuple([latitude, longitude])),
  /** The trail on the instance, for the user to open there. */
  externalUrl: z.string(),
  /** The tours of this trip that are snapshots of this trail, newest first. */
  importedAs: z.array(idSchema),
});
export type WandererTrailSummary = z.infer<typeof wandererTrailSummarySchema>;

export const wandererSearchResponseSchema = z.object({
  trails: z.array(wandererTrailSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});
export type WandererSearchResponse = z.infer<typeof wandererSearchResponseSchema>;

/** How a trail stands to the snapshot this trip already holds of it. */
export const wandererSnapshotStateSchema = z.enum([
  /** Not in this trip yet. */
  'new',
  /** In this trip, and the instance holds the same content. */
  'unchanged',
  /** In this trip, and the instance holds something else now. */
  'changed',
]);
export type WandererSnapshotState = z.infer<typeof wandererSnapshotStateSchema>;

/**
 * Everything the import step shows before anything is written: the trail as
 * the full GPX describes it, and how it compares to a snapshot already here.
 */
export const wandererImportPreviewSchema = z.object({
  trail: wandererTrailSummarySchema,
  /** Measured from the full GPX, not from the index. */
  distanceKm: z.number().nonnegative(),
  elevationGainM: z.number().nullable(),
  elevationLossM: z.number().nullable(),
  hasElevation: z.boolean(),
  points: z.number().int().nonnegative(),
  /** `[lat, lng]` of the full line, thinned for the map. */
  line: z.array(z.tuple([latitude, longitude])),
  /** Fingerprint of what would be imported; the import refuses when the instance moved on since. */
  contentHash: z.string(),
  state: wandererSnapshotStateSchema,
  /** The newest snapshot of this trail in the trip, when there is one. */
  snapshot: z
    .object({
      placeId: idSchema,
      name: z.string(),
      importedAt: z.string(),
      /** The tour was changed here after it was imported. */
      editedLocally: z.boolean(),
    })
    .nullable(),
  /** What differs between the snapshot and the instance, when it does. */
  changes: z.array(z.enum(['name', 'description', 'route'])),
});
export type WandererImportPreview = z.infer<typeof wandererImportPreviewSchema>;

export const wandererImportRequestSchema = z.object({
  trailId: z.string().trim().min(1).max(64),
  /** The preview's fingerprint: what the user saw is what gets imported, or nothing. */
  contentHash: z.string().trim().min(16).max(128),
});
export type WandererImportRequest = z.infer<typeof wandererImportRequestSchema>;

export const wandererImportResponseSchema = z.object({
  tour: tourListItemSchema,
});
export type WandererImportResponse = z.infer<typeof wandererImportResponseSchema>;
