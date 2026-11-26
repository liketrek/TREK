import { http, HttpResponse } from 'msw';
import { useAddonStore } from '../../src/store/addonStore';
import { useAuthStore } from '../../src/store/authStore';
import { usePermissionsStore } from '../../src/store/permissionsStore';
import type { User } from '../../src/types';
import { server } from './msw/server';
import { seedStore } from './store';

/**
 * The install the journey page suite runs on: the owner is signed in with full
 * rights, and a photo provider is on, so the entry editor offers External photos.
 */
export function seedJourneyOwner(user: User): void {
  seedStore(useAuthStore, { isAuthenticated: true, user });
  seedStore(usePermissionsStore, { level: 'owner' } as never);
  seedStore(useAddonStore, {
    addons: [{ id: 'immich', name: 'Immich', type: 'photo_provider', enabled: true } as never],
  });
}

/** When the suite's journal was made; its entries and photos are dated by it. */
export const journeyNow = Date.now();

/** The journal the page suite opens: an owner's active trip journal with entries, photos and a synced trip. */
export const mockJourneyDetail = {
  id: 1,
  user_id: 1,
  title: 'Italy 2026',
  subtitle: 'Rome, Florence, Venice',
  status: 'active',
  cover_image: null,
  cover_gradient: null,
  created_at: journeyNow,
  updated_at: journeyNow,
  entries: [
    {
      id: 10,
      journey_id: 1,
      author_id: 1,
      type: 'entry',
      entry_date: '2026-03-15',
      title: 'Arrived in Rome',
      story: 'Amazing city!',
      location_name: 'Rome',
      location_lat: 41.9,
      location_lng: 12.5,
      mood: 'amazing',
      weather: 'sunny',
      tags: ['culture'],
      pros_cons: { pros: ['Great food'], cons: ['Crowded'] },
      visibility: 'private',
      sort_order: 0,
      entry_time: '10:00',
      photos: [
        {
          id: 100,
          entry_id: 10,
          photo_id: 100,
          provider: 'local',
          file_path: 'photos/test.jpg',
          asset_id: null,
          owner_id: null,
          thumbnail_path: null,
          caption: 'Colosseum',
          sort_order: 0,
          width: 800,
          height: 600,
          shared: 1,
          created_at: journeyNow,
        },
      ],
      created_at: journeyNow,
      updated_at: journeyNow,
    },
    {
      id: 11,
      journey_id: 1,
      author_id: 1,
      type: 'entry',
      entry_date: '2026-03-16',
      title: 'Florence Day',
      story: null,
      location_name: 'Florence',
      location_lat: 43.77,
      location_lng: 11.25,
      mood: 'good',
      weather: 'cloudy',
      tags: [],
      pros_cons: null,
      visibility: 'private',
      sort_order: 0,
      entry_time: null,
      photos: [],
      created_at: journeyNow,
      updated_at: journeyNow,
    },
  ],
  trips: [
    {
      trip_id: 5,
      added_at: journeyNow,
      title: 'Italy Trip',
      start_date: '2026-03-14',
      end_date: '2026-03-20',
      cover_image: null,
      currency: 'EUR',
      place_count: 8,
    },
  ],
  contributors: [
    {
      journey_id: 1,
      user_id: 1,
      role: 'owner',
      added_at: journeyNow,
      username: 'testuser',
      avatar: null,
    },
  ],
  stats: { entries: 2, photos: 1, places: 2 },
  gallery: [
    {
      id: 100,
      journey_id: 1,
      photo_id: 100,
      provider: 'local',
      file_path: 'photos/test.jpg',
      asset_id: null,
      owner_id: null,
      thumbnail_path: null,
      caption: 'Colosseum',
      sort_order: 0,
      width: 800,
      height: 600,
      shared: 1,
      created_at: journeyNow,
    },
  ],
};

/** The journal's own reads and writes, answered with that journal (merged with `journeyOverride`). */
export function setupJourneyHandlers(journeyOverride?: Record<string, unknown>) {
  const journey = journeyOverride ? { ...mockJourneyDetail, ...journeyOverride } : mockJourneyDetail;

  server.use(
    http.get('/api/journeys/1', () => {
      return HttpResponse.json(journey);
    }),
    http.get('/api/addons', () => {
      return HttpResponse.json({
        addons: [
          { id: 'journey', name: 'Journey', type: 'feature', icon: 'book', enabled: true },
          { id: 'immich', name: 'Immich', type: 'photo_provider', icon: 'camera', enabled: true },
        ],
      });
    }),
    http.get('/api/integrations/memories/:provider/status', () => {
      return HttpResponse.json({ connected: false });
    }),
    http.patch('/api/journeys/1', () => {
      return HttpResponse.json({ ...mockJourneyDetail, title: 'Updated' });
    }),
    http.get('/api/journeys/1/share-link', () => {
      return HttpResponse.json({ link: null });
    })
  );
}
