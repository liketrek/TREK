import { journeyPublicResponseSchema } from './journey-public.schema';

import { describe, expect, it } from 'vitest';

const photo = {
  id: 3,
  photo_id: 30,
  caption: 'The tower',
  media_type: 'image',
  width: 800,
  height: 600,
  duration_ms: null,
  taken_at: '2026-05-14T10:00:00Z',
  lat: null,
  lng: null,
  posterless: false,
};

const answer = {
  journey: {
    title: 'Venice',
    subtitle: null,
    cover_image: 'covers/venice.jpg',
    status: 'completed',
    show_verdict: 1,
    show_mood: 1,
    show_weather: 0,
  },
  entries: [
    {
      id: 7,
      type: 'entry',
      entry_date: '2026-05-14',
      entry_time: '10:00',
      sort_order: 0,
      title: 'Piazza San Marco',
      story: 'Pigeons everywhere.',
      location_name: 'Venice',
      location_lat: null,
      location_lng: null,
      country_code: 'IT',
      mood: 'good',
      weather: 'sunny',
      tags: ['square'],
      pros_cons: { pros: ['light'], cons: [] },
      photos: [photo],
    },
    // A map-only share: the marker fields alone.
    {
      id: 8,
      type: 'entry',
      entry_date: '2026-05-15',
      sort_order: 0,
      title: null,
      location_name: 'Murano',
      location_lat: 45.458,
      location_lng: 12.353,
    },
  ],
  gallery: [photo],
  stats: { entries: 2, photos: 1, places: 2 },
  cartoApiKey: '',
  permissions: { share_timeline: true, share_gallery: true, share_map: false, newest_first: false },
};

describe('journeyPublicResponseSchema', () => {
  it('JRNPUB-SCHEMA-001: reads a shared journey with a timeline entry and a map-only one', () => {
    expect(journeyPublicResponseSchema.safeParse(answer).success).toBe(true);
    // A clip may carry its provider for clients from before `posterless`.
    const clip = { ...photo, media_type: 'video', provider: 'local' };
    expect(journeyPublicResponseSchema.safeParse({ ...answer, gallery: [clip] }).success).toBe(true);
  });

  it('JRNPUB-SCHEMA-002: refuses a storage key, an asset id or an author anywhere in the answer', () => {
    const leaks = [
      { ...answer, gallery: [{ ...photo, file_path: 'journey/abc.jpg' }] },
      { ...answer, gallery: [{ ...photo, thumbnail_path: 'journey/abc_thumb.jpg' }] },
      { ...answer, gallery: [{ ...photo, asset_id: 'immich-1', provider: 'immich' }] },
      { ...answer, entries: [{ ...answer.entries[0], author_id: 1 }] },
      { ...answer, entries: [{ ...answer.entries[0], visibility: 'private' }] },
      { ...answer, entries: [{ ...answer.entries[0], photos: [{ ...photo, owner_id: 1 }] }] },
      { ...answer, journey: { ...answer.journey, user_id: 1 } },
    ];
    for (const leak of leaks) expect(journeyPublicResponseSchema.safeParse(leak).success).toBe(false);
  });
});
