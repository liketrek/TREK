/**
 * The daily look at the winter layer (spec 7.2): registered on the cron
 * registrar only, sweeping unused area files, fetching the index when the
 * host serves a new build, and fetching the kept areas whose graph changed.
 */
import { logInfo } from '../../../../src/nest/audit/audit-log.logger';
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { SkiAreasJob } from '../../../../src/nest/ski-routing/ski-areas.job';
import type { SkiAreasService, SkiIndex } from '../../../../src/nest/ski-routing/ski-areas.service';

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const row = (id: string, sha: string) => ({
  row: { id, sha256: sha.repeat(64) },
  minLat: 0,
  minLng: 0,
  maxLat: 0,
  maxLng: 0,
});

function setup(refreshed: 'updated' | 'unchanged' | 'refused' = 'updated') {
  const index = { areas: [row('w:1', 'a'), row('w:2', 'b'), row('w:3', 'c')] } as unknown as SkiIndex;
  const areas = {
    sweep: vi.fn().mockResolvedValue(2),
    enabled: vi.fn(() => true),
    refresh: vi.fn().mockResolvedValue(refreshed),
    index: vi.fn().mockResolvedValue(index),
    keptAreas: vi.fn().mockResolvedValue([
      { id: 'w:1', sha8: 'aaaaaaaa' },
      { id: 'w:2', sha8: '00000000' },
    ]),
    ensureArea: vi.fn().mockResolvedValue({ file: 'x', stale: false }),
    placesHeldBack: vi.fn(() => false),
  };
  const registrar = { isEnabled: vi.fn(() => true), register: vi.fn() };
  const job = new SkiAreasJob(areas as unknown as SkiAreasService, registrar as unknown as CronRegistrarService);
  return { job, areas, registrar };
}

describe('SkiAreasJob', () => {
  it('SKIJOB-001: registers once a day at 04:40, and not where the registrar runs nothing', () => {
    const { job, registrar } = setup();
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('ski-areas', '40 4 * * *', expect.any(Function));
    registrar.register.mockClear();
    registrar.isEnabled.mockReturnValue(false);
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
  });

  it('SKIJOB-002: sweeps, takes a new build and fetches the kept areas it changed', async () => {
    const { job, areas } = setup('updated');
    await job.tick();
    expect(areas.sweep).toHaveBeenCalled();
    expect(areas.refresh).toHaveBeenCalled();
    expect(areas.ensureArea).toHaveBeenCalledTimes(1);
    expect(areas.ensureArea).toHaveBeenCalledWith({ id: 'w:2', sha256: 'b'.repeat(64) });
  });

  it('SKIJOB-003: fetches nothing when the build is the same, or TREK Places is off; a failure is logged', async () => {
    const same = setup('unchanged');
    await same.job.tick();
    expect(same.areas.ensureArea).not.toHaveBeenCalled();
    const off = setup();
    off.areas.enabled.mockReturnValue(false);
    await off.job.tick();
    expect(off.areas.refresh).not.toHaveBeenCalled();
    const broken = setup();
    broken.areas.refresh.mockRejectedValue(new Error('TREK Places API 503'));
    await expect(broken.job.tick()).resolves.toBeUndefined();
    const lost = setup();
    lost.areas.index.mockResolvedValue(null);
    await lost.job.tick();
    expect(lost.areas.keptAreas).not.toHaveBeenCalled();
    const failing = setup();
    failing.areas.ensureArea.mockRejectedValue(new Error('no'));
    await expect(failing.job.tick()).resolves.toBeUndefined();
  });

  it('SKIJOB-004: fetches the changed areas two at a time, and leaves the rest once the breaker opens', async () => {
    const { job, areas } = setup('updated');
    const ids = Array.from({ length: 6 }, (_, i) => `w:${10 + i}`);
    areas.index.mockResolvedValue({ areas: ids.map((id) => row(id, 'd')) } as unknown as SkiIndex);
    areas.keptAreas.mockResolvedValue(ids.map((id) => ({ id, sha8: '00000000' })));
    let open = 0;
    let most = 0;
    let calls = 0;
    areas.ensureArea.mockImplementation(async () => {
      const call = ++calls;
      open += 1;
      most = Math.max(most, open);
      await new Promise((resolve) => setImmediate(resolve));
      open -= 1;
      if (call === 2) throw new Error('TREK Places API 503');
      return { file: 'x', stale: call === 3 };
    });
    // The breaker opens once four areas were asked for.
    areas.placesHeldBack.mockImplementation(() => calls >= 4);
    vi.mocked(logInfo).mockClear();
    await job.tick();
    expect(most).toBe(2);
    expect(areas.ensureArea).toHaveBeenCalledTimes(4);
    expect(vi.mocked(logInfo)).toHaveBeenCalledWith(
      '[Ski] 2 of 6 kept ski areas fetched anew, 2 left for later while TREK Places is unreachable',
    );
    areas.placesHeldBack.mockReturnValue(false);
    areas.ensureArea.mockResolvedValue({ file: 'x', stale: false });
    vi.mocked(logInfo).mockClear();
    await job.tick();
    expect(vi.mocked(logInfo)).toHaveBeenCalledWith('[Ski] 6 of 6 kept ski areas fetched anew');
  });
});
