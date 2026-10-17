import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { offlineDb } from '../db/offlineDb';
import { isEffectivelyOffline } from '../sync/networkMode';
import { wandererErrorCode, WandererOfflineError, wandererRepo } from './wandererRepo';

vi.mock('../sync/networkMode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../sync/networkMode')>()),
  isEffectivelyOffline: vi.fn(() => false),
}));

const tour = {
  place_id: 70,
  name: 'Ridge',
  tour_type: 'hike',
  distance: 5,
  elevation_gain: 300,
  elevation_loss: 300,
  duration: null,
  difficulty: 'easy',
  wanderer_ref: 'https://w.test#abc',
  match_confidence: 1,
  max_hiking_difficulty: 1,
  planned: false,
  caution: false,
  has_waypoints: false,
};

beforeEach(async () => {
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  await offlineDb.tours.clear();
});

describe('wandererRepo', () => {
  it('RS-04: searches and previews through the server, with the trail id kept safe in the path', async () => {
    const seen: string[] = [];
    server.use(
      http.post('/api/trips/3/tours/wanderer/search', async ({ request }) => {
        seen.push(JSON.stringify(await request.json()));
        return HttpResponse.json({ instance: 'https://w.test', trails: [], total: 0, pageSize: 20 });
      }),
      http.get('/api/trips/3/tours/wanderer/trails/:id', ({ params }) => {
        seen.push(String(params.id));
        return HttpResponse.json({ ok: true });
      })
    );
    await expect(wandererRepo.search(3, { q: 'ridge', page: 1 })).resolves.toMatchObject({ total: 0 });
    await wandererRepo.preview(3, 'abc');
    expect(seen).toEqual(['{"q":"ridge","page":1}', 'abc']);
  });

  it('RS-05: an import is cached like every other tour', async () => {
    server.use(http.post('/api/trips/3/tours/wanderer/import', () => HttpResponse.json({ tour })));
    await wandererRepo.importTrail(3, { trailId: 'abc', contentHash: '0123456789abcdef' });
    expect(await offlineDb.tours.get(70)).toMatchObject({ place_id: 70, trip_id: 3 });
  });

  it('RS-04: is online only and says so instead of sending', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    await expect(wandererRepo.search(3, { q: '', page: 1 })).rejects.toBeInstanceOf(WandererOfflineError);
    await expect(wandererRepo.preview(3, 'abc')).rejects.toBeInstanceOf(WandererOfflineError);
    await expect(
      wandererRepo.importTrail(3, { trailId: 'abc', contentHash: '0123456789abcdef' })
    ).rejects.toBeInstanceOf(WandererOfflineError);
  });

  it('RS-03: reads the reason of a failed call from the server, the offline case or nothing', () => {
    expect(wandererErrorCode(new WandererOfflineError())).toBe('offline');
    expect(wandererErrorCode({ response: { data: { code: 'not_own_trail' } } })).toBe('not_own_trail');
    expect(wandererErrorCode({ response: { data: {} } })).toBe('unknown');
    expect(wandererErrorCode(new Error('boom'))).toBe('unknown');
  });
});
