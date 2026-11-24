/**
 * The two keyless ADS-B feeds and the budget that spaces them: what goes out
 * (the callsign, nothing else), what an answer has to look like, and how a
 * bad, oversized, slow or refusing source is handled. fetch is stubbed.
 */
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { BUDGET_PER_HOUR, FeedBudget } from '../../../../src/nest/flight-live/flight-live.budget';
import { FlightLiveFeedService } from '../../../../src/nest/flight-live/flight-live.feeds';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  logWarn: vi.fn(),
}));

const db = createSnapshotTestDb();
let t: TestModule;
let feeds: FlightLiveFeedService;
let clock = 1_000_000;
const now = () => clock;

const AIRCRAFT = {
  hex: '3c6444',
  flight: 'DLH716  ',
  r: 'D-AIXA',
  t: 'A359',
  alt_baro: 36000,
  alt_geom: 36500,
  gs: 480.2,
  track: 51.3,
  baro_rate: 0,
  geom_rate: 64,
  lat: 55.1,
  lon: 60.2,
  seen: 0.4,
  seen_pos: 1.1,
  category: 'A5',
  squawk: '1000',
};

function answer(body: unknown, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(async () => {
  clock += 60 * 60 * 1000;
  t = await createTestModule({ db, imports: [AppConfigModule], providers: [FlightLiveFeedService] });
  feeds = t.get(FlightLiveFeedService);
  feeds.sleep = async () => undefined;
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await t.close();
});
afterAll(() => db.close());

describe('FeedBudget', () => {
  it('FLFEED-001: one request a second and 200 an hour, a paused source for a quarter of an hour', () => {
    const budget = new FeedBudget();
    expect(budget.tryTake(0)).toBe(true);
    expect(budget.tryTake(500)).toBe(false);
    expect(budget.waitMs(500)).toBe(500);
    expect(budget.tryTake(1000)).toBe(true);
    for (let i = 2; i < BUDGET_PER_HOUR; i++) expect(budget.tryTake(i * 1000)).toBe(true);
    expect(budget.exhausted(BUDGET_PER_HOUR * 1000)).toBe(true);
    expect(budget.tryTake(BUDGET_PER_HOUR * 1000)).toBe(false);
    expect(budget.tryTake(60 * 60 * 1000 + 500)).toBe(true);
    expect(new FeedBudget().waitMs(0)).toBe(0);

    budget.pause('adsb.lol', 0);
    expect(budget.isPaused('adsb.lol', 14 * 60 * 1000)).toBe(true);
    expect(budget.isPaused('adsb.lol', 15 * 60 * 1000)).toBe(false);
    expect(budget.isPaused('adsb.fi', 0)).toBe(false);
  });
});

describe('FlightLiveFeedService', () => {
  it('FLFEED-002: asks adsb.lol for the callsign alone and reads the aircraft it answers', async () => {
    const fetcher = vi.fn(async () => answer({ ac: [AIRCRAFT], now: 1_700_000_000_000, total: 1 }));
    vi.stubGlobal('fetch', fetcher);
    const result = await feeds.lookup('DLH716', now);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.adsb.lol/v2/callsign/DLH716');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init).not.toHaveProperty('body');
    expect(result).toEqual({
      ok: true,
      source: 'adsb.lol',
      now: 1_700_000_000_000,
      aircraft: [
        {
          hex: '3c6444',
          flight: 'DLH716',
          registration: 'D-AIXA',
          type: 'A359',
          alt_baro: 36000,
          alt_geom: 36500,
          gs: 480.2,
          track: 51.3,
          baro_rate: 0,
          geom_rate: 64,
          lat: 55.1,
          lon: 60.2,
          seen: 0.4,
          seen_pos: 1.1,
        },
      ],
    });
    expect(feeds.attribution()).toBe('Live positions: adsb.lol (ODbL)');
  });

  it('FLFEED-003: keeps only the aircraft flying the callsign, and an answer without any is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(answer({ ac: [AIRCRAFT, { ...AIRCRAFT, hex: 'x', flight: 'DLH7160' }], now: 1 }))
        .mockResolvedValueOnce(answer({ now: 2 })),
    );
    const first = await feeds.lookup('DLH716', now);
    expect(first).toMatchObject({ ok: true, aircraft: [expect.objectContaining({ hex: '3c6444' })] });
    expect((first as { aircraft: unknown[] }).aircraft).toHaveLength(1);
    clock += 2000;
    expect(await feeds.lookup('DLH716', now)).toEqual({ ok: true, source: 'adsb.lol', now: 2, aircraft: [] });
  });

  it('FLFEED-004: falls back to adsb.fi on a self-hosted install when adsb.lol fails', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(answer('not json at all'))
      .mockResolvedValueOnce(answer({ ac: [AIRCRAFT], now: 5 }));
    vi.stubGlobal('fetch', fetcher);
    let calls = 0;
    const result = await feeds.lookup('DLH716', () => clock + 1000 * calls++);
    expect(result).toMatchObject({ ok: true, source: 'adsb.fi' });
    expect(fetcher.mock.calls[1]?.[0]).toBe('https://opendata.adsb.fi/api/v2/callsign/DLH716');
  });

  it('FLFEED-005: a managed install never asks adsb.fi', async () => {
    vi.stubEnv('TREK_MANAGED', 'true');
    const fetcher = vi.fn(async () => answer({ unexpected: true }));
    vi.stubGlobal('fetch', fetcher);
    let calls = 0;
    expect(await feeds.lookup('DLH716', () => clock + 1000 * calls++)).toEqual({ ok: false, reason: 'unavailable' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(feeds.sources()).toEqual(['adsb.lol']);
  });

  it('FLFEED-006: an oversized body, a timeout and a bad shape are failures, never data', async () => {
    vi.stubEnv('TREK_MANAGED', 'true');
    const huge = 'x'.repeat(300 * 1024);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(answer(huge))
        .mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'))
        .mockResolvedValueOnce(answer({ ac: [{ hex: 1 }], now: 1 })),
    );
    const failure = { ok: false, reason: 'unavailable' };
    clock += 2000;
    expect(await feeds.lookup('DLH716', now)).toEqual(failure);
    clock += 2000;
    expect(await feeds.lookup('DLH716', now)).toEqual(failure);
    clock += 2000;
    expect(await feeds.lookup('DLH716', now)).toEqual(failure);
    // Three failures in a row pause adsb.lol: nothing is asked and nothing is spent.
    clock += 2000;
    expect(await feeds.lookup('DLH716', now)).toEqual({ ok: false, reason: 'budget' });
  });

  it('FLFEED-007: a 429 pauses the source at once and its body is let go', async () => {
    vi.stubEnv('TREK_MANAGED', 'true');
    const cancel = vi.fn(async () => undefined);
    const limited = { ok: false, status: 429, body: { cancel } } as unknown as Response;
    const fetcher = vi.fn(async () => limited);
    vi.stubGlobal('fetch', fetcher);
    expect(await feeds.lookup('DLH716', now)).toEqual({ ok: false, reason: 'unavailable' });
    expect(cancel).toHaveBeenCalled();
    clock += 5 * 60 * 1000;
    expect(await feeds.lookup('DLH716', now)).toEqual({ ok: false, reason: 'budget' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    clock += 11 * 60 * 1000;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => answer({ ac: [], now: 9 })),
    );
    expect(await feeds.lookup('DLH716', now)).toMatchObject({ ok: true, source: 'adsb.lol' });
  });

  it('FLFEED-008: the spacing between requests is held, and a malformed callsign never leaves', async () => {
    const fetcher = vi.fn(async () => answer({ ac: [], now: 1 }));
    vi.stubGlobal('fetch', fetcher);
    expect(feeds.canAsk(clock)).toBe(true);
    await feeds.lookup('DLH716', now);
    expect(feeds.canAsk(clock)).toBe(false);
    expect(feeds.waitMs(clock)).toBe(1000);
    expect(await feeds.lookup('DLH716', now)).toEqual({ ok: false, reason: 'budget' });
    clock += 1000;
    expect(await feeds.lookup('DLH716/../x', now)).toEqual({ ok: false, reason: 'unavailable' });
    expect(await feeds.lookup('dlh716', now)).toEqual({ ok: false, reason: 'unavailable' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
