// FE-TOUR-POINTSREPO-001 to FE-TOUR-POINTSREPO-004: one read of a tour's saved points, shared by every
// view showing it at the same time (MDT-02).
import type { TourListItem, TourWaypoint } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tourPointsRepo } from './tourPointsRepo';
import { tourRepo } from './tourRepo';

const TOUR = { place_id: 81, name: 'Hut to hut', tour_type: 'hike' } as TourListItem;
const POINTS: TourWaypoint[] = [
  { lat: 47, lng: 11, role: 'start', sequence: 0, key: 'stop-start' },
  { lat: 47.03, lng: 11, role: 'end', sequence: 1, key: 'stop-end' },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(tourRepo, 'detail').mockResolvedValue({ tour: TOUR, waypoints: POINTS });
});

describe('tourPointsRepo', () => {
  it('FE-TOUR-POINTSREPO-001: views showing the same tour at once share one read', async () => {
    const first = tourPointsRepo.hold(9, 81, '81:2');
    const second = tourPointsRepo.hold(9, 81, '81:2');
    expect(await first.points).toEqual(POINTS);
    expect(await second.points).toEqual(POINTS);
    expect(tourRepo.detail).toHaveBeenCalledTimes(1);
    expect(tourRepo.detail).toHaveBeenCalledWith(9, 81, expect.any(AbortSignal));
    first.release();
    second.release();
  });

  it('FE-TOUR-POINTSREPO-002: a new revision is a read of its own', async () => {
    const before = tourPointsRepo.hold(9, 81, '81:2');
    const after = tourPointsRepo.hold(9, 81, '81:3');
    await Promise.all([before.points, after.points]);
    expect(tourRepo.detail).toHaveBeenCalledTimes(2);
    before.release();
    after.release();
  });

  it('FE-TOUR-POINTSREPO-003: the read is aborted once nobody holds it, and the next view reads again', async () => {
    const first = tourPointsRepo.hold(9, 81, '81:2');
    const second = tourPointsRepo.hold(9, 81, '81:2');
    const signal = vi.mocked(tourRepo.detail).mock.calls[0]?.[2];
    first.release();
    // Letting go twice does not let go of the other view's hold.
    first.release();
    expect(signal?.aborted).toBe(false);
    second.release();
    expect(signal?.aborted).toBe(true);
    const next = tourPointsRepo.hold(9, 81, '81:2');
    await next.points;
    expect(tourRepo.detail).toHaveBeenCalledTimes(2);
    next.release();
  });

  it('FE-TOUR-POINTSREPO-004: a failed read is dropped at once, so the next view reads again', async () => {
    vi.mocked(tourRepo.detail).mockRejectedValueOnce(new Error('offline'));
    const failed = tourPointsRepo.hold(9, 81, '81:2');
    await expect(failed.points).rejects.toThrow('offline');
    const retry = tourPointsRepo.hold(9, 81, '81:2');
    expect(await retry.points).toEqual(POINTS);
    expect(tourRepo.detail).toHaveBeenCalledTimes(2);
    failed.release();
    retry.release();
  });
});
