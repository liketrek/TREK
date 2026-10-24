// FE-STA2-REPO-001 to FE-STA2-REPO-004
// STA-02: the user's own tour activities are read live and parsed against the
// shared contract; offline, nothing is requested at all.
import type { TourActivityStatsResponse } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { TourActivityStatsOfflineError, tourActivityStatsRepo } from './tourActivityStatsRepo';

const BASE = '/api/tours/activity-stats';

const stats: TourActivityStatsResponse = {
  entries: [
    {
      place_id: 7,
      name: 'Ridge',
      tour_type: 'hike',
      trip: { id: 5, title: 'Alps' },
      derived_from_place_id: null,
      date: '2026-07-02',
      basis: 'plan',
      track: null,
      day_count: 1,
      distance_km: 12.5,
      ascent_m: 800,
      descent_m: 790,
      excluded: false,
    },
  ],
  uncounted: { unassigned: 1, undated: 0 },
};

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
}

beforeEach(() => {
  setOnline(true);
  _resetNetworkMode();
});

afterEach(() => {
  _resetNetworkMode();
  setOnline(true);
});

describe('tourActivityStatsRepo', () => {
  it('FE-STA2-REPO-001: get() reads the sums and parses them', async () => {
    server.use(http.get(BASE, () => HttpResponse.json(stats)));
    expect(await tourActivityStatsRepo.get()).toEqual(stats);
  });

  it('FE-STA2-REPO-002: setExcluded() sends the tour and the choice and answers the new sums', async () => {
    let sent: unknown = null;
    server.use(
      http.put(`${BASE}/exclusions`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ ...stats, entries: [{ ...stats.entries[0], excluded: true }] });
      })
    );
    const answer = await tourActivityStatsRepo.setExcluded({ place_id: 7, excluded: true });
    expect(sent).toEqual({ place_id: 7, excluded: true });
    expect(answer.entries[0]?.excluded).toBe(true);
  });

  it('FE-STA2-REPO-003: offline, by the browser or by the switch, nothing is requested', async () => {
    let reached = false;
    server.use(
      http.all(`${BASE}*`, () => {
        reached = true;
        return HttpResponse.json(stats);
      })
    );
    setOnline(false);
    await expect(tourActivityStatsRepo.get()).rejects.toBeInstanceOf(TourActivityStatsOfflineError);
    setOnline(true);
    setForcedOffline(true);
    await expect(tourActivityStatsRepo.setExcluded({ place_id: 7, excluded: true })).rejects.toBeInstanceOf(
      TourActivityStatsOfflineError
    );
    expect(reached).toBe(false);
  });

  it('FE-STA2-REPO-004: an answer outside the contract fails in the repo, naming the field', async () => {
    const broken = { ...stats, entries: [{ ...stats.entries[0], basis: 'guess' }] };
    server.use(http.get(BASE, () => HttpResponse.json(broken)));
    const error = await tourActivityStatsRepo.get().catch((err: unknown) => err);
    expect((error as { issues?: Array<{ path: Array<string | number> }> }).issues?.[0]?.path).toEqual([
      'entries',
      0,
      'basis',
    ]);
  });
});
