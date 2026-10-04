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

/**
 * The UTC offset the caller means its calendar days in, in minutes east of UTC
 * (600 for UTC+10, -480 for UTC-8). A date-only `from`/`to` names a day on
 * somebody's wall clock; without this the server can only read it as a UTC day,
 * which is the wrong 24 hours for everyone outside UTC.
 *
 * Deliberately not called `offset`: that name is taken on the Synology body and
 * means the NAS pagination offset. One body shape goes to whichever provider, so
 * reusing the name would make a UTC+10 user ask the NAS to skip 600 photos.
 */
const utcOffsetMinutes = looseNumber;

// ── Immich ────────────────────────────────────────────────────────────────

/**
 * Trust a self-signed certificate on the Immich server (#2475). Absent means
 * "leave the stored choice as it is", so a client that predates the switch
 * cannot turn it off by saving. A plain boolean: the field is new, and the
 * settings form has always sent its checkboxes as booleans, so none of the
 * string leniency `synology_skip_ssl` carries is owed here.
 */
const immichAllowInsecureTls = z.boolean().optional();

export const immichSettingsSchema = z.looseObject({
  immich_url: optionalText,
  immich_api_key: optionalText,
  // Applied only when it is a real boolean (`typeof auto_upload === 'boolean'`),
  // so anything else is accepted and ignored, exactly as before.
  auto_upload: z.unknown().optional(),
  allow_insecure_tls: immichAllowInsecureTls,
});

export const immichTestSchema = z.looseObject({
  immich_url: optionalText,
  immich_api_key: optionalText,
  allow_insecure_tls: immichAllowInsecureTls,
});

export const immichSearchSchema = z.looseObject({
  from: optionalText,
  to: optionalText,
  size: looseNumber,
  page: looseNumber,
  // Accepted so the client can send one body to either provider. The Immich
  // route ignores it: Immich returns each photo's own local capture stamp, so
  // the day is answered from the photo rather than from the reader's zone.
  utc_offset_minutes: utcOffsetMinutes,
});

/**
 * How far the journey photo picker pages a date-bounded search (#1587): its
 * first page and at most this many after it, so it never asks for a page past
 * PROVIDER_SELECT_ALL_MAX_PAGES + 1. At the picker's 200 a page that is 50,200
 * photos.
 *
 * An absolute page rather than a count per run: whether "Select all" loads the
 * pages or they are scrolled into view, and however often it is pressed, page
 * 251 is the last. Shared because both ends size against it: the picker stops
 * there, and the Immich search keeps its absolute scan ceiling deep enough that
 * this last page is still answered in full.
 */
export const PROVIDER_SELECT_ALL_MAX_PAGES = 250;

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
  // Rows to skip on the NAS — pagination, nothing to do with time zones.
  offset: looseNumber,
  page: looseNumber,
  limit: looseNumber,
  size: looseNumber,
  utc_offset_minutes: utcOffsetMinutes,
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
