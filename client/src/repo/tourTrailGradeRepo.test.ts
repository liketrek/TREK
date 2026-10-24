import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../api/client';
import { cycleMapAdminApi, hikingMapAdminApi, skiRoutingAdminApi } from '../api/tourBaseMaps';
import { tourTrailGradeApi } from '../api/tourTrailGrade';
import { OnlineOnlyError } from './onlineOnly';
import { tourTrailGradeRepo } from './tourTrailGradeRepo';

// FE-REPO-TRAIL-GRADE-001 to FE-REPO-TRAIL-GRADE-003

const network = vi.hoisted(() => ({ offline: false }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: () => network.offline }));

beforeEach(() => {
  network.offline = false;
  vi.restoreAllMocks();
});

describe('tourTrailGradeRepo (BIK-05)', () => {
  it('FE-REPO-TRAIL-GRADE-001: asks only online, and offline says so instead', async () => {
    network.offline = true;
    const grades = vi.spyOn(tourTrailGradeApi, 'grades');
    await expect(tourTrailGradeRepo.grades(3, { way_ids: [1] })).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(grades).not.toHaveBeenCalled();
  });

  it('FE-REPO-TRAIL-GRADE-002: posts the ways to the trip, with a timeout long enough for a long tour', async () => {
    const answer = { ways: [], unanswered: [] };
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: answer });
    const signal = new AbortController().signal;
    await expect(tourTrailGradeRepo.grades(3, { way_ids: [1, 2] }, signal)).resolves.toBe(answer);
    expect(post).toHaveBeenCalledWith('/trips/3/tours/trail-grades', { way_ids: [1, 2] }, { signal, timeout: 60_000 });
  });
});

describe('tourBaseMaps admin api (MAP-01, BIK-06)', () => {
  it('FE-REPO-TRAIL-GRADE-003: each map on terms has its own switch, read and written at its own path', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { enabled: true } });
    const put = vi.spyOn(apiClient, 'put').mockResolvedValue({ data: { enabled: false } });
    expect(await cycleMapAdminApi.get()).toEqual({ enabled: true });
    expect(get).toHaveBeenCalledWith('/admin/tours-cycle-map');
    expect(await cycleMapAdminApi.update(false)).toEqual({ enabled: false });
    expect(put).toHaveBeenCalledWith('/admin/tours-cycle-map', { enabled: false });
    await hikingMapAdminApi.update(true);
    expect(put).toHaveBeenLastCalledWith('/admin/tours-hiking-map', { enabled: true });
    await skiRoutingAdminApi.update(false);
    expect(put).toHaveBeenLastCalledWith('/admin/tours-ski-routing', { enabled: false });
  });
});
