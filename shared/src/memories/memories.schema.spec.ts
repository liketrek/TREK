import {
  addTripPhotosSchema,
  createAlbumLinkSchema,
  immichSearchSchema,
  immichSettingsSchema,
  setTripPhotoSharingSchema,
  synologySearchSchema,
  synologySettingsSchema,
  synologyTestSchema,
} from './memories.schema';

import { describe, it, expect } from 'vitest';

/**
 * These contracts exist to describe what the endpoints already accept, not to
 * tighten them — the nine routes were read as `Record<string, unknown>` and
 * coerced by hand before. The cases below pin that tolerance, because a
 * well-meaning narrowing here turns working clients into 400s.
 */

describe('immich contracts', () => {
  it('accepts the settings body with an empty payload — every field is optional', () => {
    expect(immichSettingsSchema.safeParse({}).success).toBe(true);
  });

  it('accepts auto_upload in any shape, since only a real boolean is acted on', () => {
    for (const auto_upload of [true, false, 'yes', 1, null]) {
      expect(immichSettingsSchema.safeParse({ auto_upload }).success).toBe(true);
    }
  });

  it('accepts search paging as numbers OR strings (the controller does Number(x) || fallback)', () => {
    expect(immichSearchSchema.safeParse({ page: 2, size: 50 }).success).toBe(true);
    expect(immichSearchSchema.safeParse({ page: '2', size: '50' }).success).toBe(true);
  });

  it('rejects a page that is neither', () => {
    expect(immichSearchSchema.safeParse({ page: { nope: true } }).success).toBe(false);
  });

  it('takes the zone the dates are meant in, even though Immich answers by the photo', () => {
    // One body goes to whichever provider, so the field has to parse on both.
    expect(immichSearchSchema.safeParse({ from: '2026-03-15', utc_offset_minutes: 600 }).success).toBe(true);
    expect(immichSearchSchema.safeParse({ utc_offset_minutes: '-480' }).success).toBe(true);
    expect(immichSearchSchema.safeParse({}).success).toBe(true);
  });
});

describe('synology contracts', () => {
  it("accepts synology_skip_ssl as a boolean or the string 'true'/'false'", () => {
    for (const synology_skip_ssl of [true, false, 'true', 'false']) {
      expect(synologySettingsSchema.safeParse({ synology_skip_ssl }).success).toBe(true);
    }
  });

  it('lets the test body carry an OTP on top of the settings fields', () => {
    const parsed = synologyTestSchema.safeParse({
      synology_url: 'https://nas.example.org',
      synology_username: 'ada',
      synology_password: 'secret',
      synology_otp: '123456',
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts every paging field of the search body, in either type', () => {
    expect(synologySearchSchema.safeParse({ offset: '10', page: 2, limit: '100', size: 0 }).success).toBe(true);
  });

  it('keeps the row offset and the UTC offset as two separate fields', () => {
    // `offset` is rows to skip on the NAS; `utc_offset_minutes` is which 24
    // hours from/to name. A UTC+10 reader sending the zone as `offset` would
    // have asked the NAS to skip 600 photos (#2336).
    const parsed = synologySearchSchema.safeParse({ offset: 40, utc_offset_minutes: 600 });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.offset).toBe(40);
    expect(parsed.success && parsed.data.utc_offset_minutes).toBe(600);
  });

  it('leaves the search body valid without a zone, which is the UTC day as before', () => {
    expect(synologySearchSchema.safeParse({ from: '2026-03-15', to: '2026-03-15' }).success).toBe(true);
  });
});

describe('unified contracts', () => {
  it('accepts a selection list and keeps unknown keys on the items', () => {
    const parsed = addTripPhotosSchema.safeParse({
      selections: [{ provider: 'immich', asset_ids: ['a', 'b'], passphrase: 'p', future_field: 1 }],
      shared: false,
    });
    expect(parsed.success).toBe(true);
    // Loose on purpose: `selections` is handed to the services as `Selection[]`,
    // so a stripped key would be a silent data loss the day a provider adds one.
    expect(parsed.success && (parsed.data.selections![0] as Record<string, unknown>).future_field).toBe(1);
  });

  it('accepts a body with no selections at all (the controller falls back to [])', () => {
    expect(addTripPhotosSchema.safeParse({}).success).toBe(true);
  });

  it('rejects a selection missing its asset ids', () => {
    expect(addTripPhotosSchema.safeParse({ selections: [{ provider: 'immich' }] }).success).toBe(false);
  });

  it('accepts photo_id as a number or a string', () => {
    expect(setTripPhotoSharingSchema.safeParse({ photo_id: 7, shared: true }).success).toBe(true);
    expect(setTripPhotoSharingSchema.safeParse({ photo_id: '7', shared: true }).success).toBe(true);
  });

  it('leaves the album-link fields untyped — the service validates them, and it answers 400 with its own wording', () => {
    expect(createAlbumLinkSchema.safeParse({}).success).toBe(true);
    expect(createAlbumLinkSchema.safeParse({ provider: 'synology', album_id: 12, album_name: null }).success).toBe(
      true,
    );
  });
});
