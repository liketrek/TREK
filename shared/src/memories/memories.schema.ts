import { z } from 'zod';

/**
 * Contracts for the memories (photo provider) mutation endpoints.
 *
 * Deliberately permissive. Every one of these bodies was read as
 * `Record<string, unknown>` and coerced by hand in the controller —
 * `Number(page) || 1`, `body.synology_skip_ssl === 'true'`,
 * `body?.shared === undefined ? true : !!body?.shared`. A strict schema would
 * turn requests the client sends today into 400s, and the parity rule outranks
 * tightening: these schemas describe the shape that already works, so the
 * boot-time contract gate has something to point at and the client has a typed
 * surface. Narrowing them is a separate, client-visible change.
 *
 * They are LOOSE objects for the same reason: a strict object strips unknown
 * keys, and `selections[]` is handed straight to the services as `Selection[]`.
 * Stripping there would silently drop a field a provider adds later.
 */

/** Accepts what `_parseStringBodyField` accepted: a string, or nothing. */
const optionalText = z.string().optional().nullable();

/** `x === true || x === 'true'` — the checkbox arrives either way. */
const looseBoolean = z.union([z.boolean(), z.literal('true'), z.literal('false')]).optional();

/** `Number(x) || fallback` — the client sends these as strings from query-ish forms. */
const looseNumber = z.union([z.number(), z.string()]).optional();

// ── Immich ────────────────────────────────────────────────────────────────

export const immichSettingsSchema = z.looseObject({
  immich_url: optionalText,
  immich_api_key: optionalText,
  // Applied only when it is a real boolean (`typeof auto_upload === 'boolean'`),
  // so anything else is accepted and ignored, exactly as before.
  auto_upload: z.unknown().optional(),
});

export const immichTestSchema = z.looseObject({
  immich_url: optionalText,
  immich_api_key: optionalText,
});

export const immichSearchSchema = z.looseObject({
  from: optionalText,
  to: optionalText,
  size: looseNumber,
  page: looseNumber,
});

// ── Synology ──────────────────────────────────────────────────────────────

export const synologySettingsSchema = z.looseObject({
  synology_url: optionalText,
  synology_username: optionalText,
  synology_password: optionalText,
  synology_skip_ssl: looseBoolean,
});

export const synologyTestSchema = synologySettingsSchema.extend({
  synology_otp: optionalText,
});

export const synologySearchSchema = z.looseObject({
  from: optionalText,
  to: optionalText,
  offset: looseNumber,
  page: looseNumber,
  limit: looseNumber,
  size: looseNumber,
});

// ── Unified (provider-agnostic trip photo surface) ────────────────────────

/** One provider's picked assets. Mirrors the `Selection` type the services take. */
export const photoSelectionSchema = z.looseObject({
  provider: z.string(),
  asset_ids: z.array(z.string()),
  owner_id: z.number().optional(),
  passphrase: z.string().optional(),
});

export const addTripPhotosSchema = z.looseObject({
  // Non-arrays fall back to [] rather than 400 (`Array.isArray(body?.selections) ? … : []`).
  selections: z.array(photoSelectionSchema).optional(),
  // Absent means shared; anything else is read for truthiness.
  shared: z.unknown().optional(),
});

export const setTripPhotoSharingSchema = z.looseObject({
  photo_id: looseNumber,
  shared: z.unknown().optional(),
});

/** The photo to unlink from the trip. Same shape the sharing toggle takes. */
export const removeTripPhotoSchema = z.looseObject({
  photo_id: looseNumber,
});

export const createAlbumLinkSchema = z.looseObject({
  provider: z.unknown().optional(),
  album_id: z.unknown().optional(),
  album_name: z.unknown().optional(),
  passphrase: z.unknown().optional(),
});

export type ImmichSettingsInput = z.infer<typeof immichSettingsSchema>;
export type ImmichTestInput = z.infer<typeof immichTestSchema>;
export type ImmichSearchInput = z.infer<typeof immichSearchSchema>;
export type SynologySettingsInput = z.infer<typeof synologySettingsSchema>;
export type SynologyTestInput = z.infer<typeof synologyTestSchema>;
export type SynologySearchInput = z.infer<typeof synologySearchSchema>;
export type PhotoSelectionInput = z.infer<typeof photoSelectionSchema>;
export type AddTripPhotosInput = z.infer<typeof addTripPhotosSchema>;
export type SetTripPhotoSharingInput = z.infer<typeof setTripPhotoSharingSchema>;
export type RemoveTripPhotoInput = z.infer<typeof removeTripPhotoSchema>;
export type CreateAlbumLinkInput = z.infer<typeof createAlbumLinkSchema>;
