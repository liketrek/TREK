import { db as testDb } from '../../../src/db/database';
import { VacayHolidayCalendars } from '../../../src/db/entities/VacayHolidayCalendars.entity';
import { VacayPlans } from '../../../src/db/entities/VacayPlans.entity';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { asLegacyResult } from '../../helpers/domain-error';
import { createUser } from '../../helpers/factories';
import { insertRow, updateRows } from '../../helpers/factories/rows';
import { notificationsStub } from '../../helpers/notifications';
import {
  createTestVacayHolidayCalendarsRepo,
  createTestSchoolHolidayRegionsRepo,
} from '../../helpers/school-holidays-repos';
import { resetTestDb } from '../../helpers/test-db';
import { createTestUnitOfWork, sharedTestOrm } from '../../helpers/test-uow';
import {
  createTestVacayPlansRepo,
  createTestVacayPlanMembersRepo,
  createTestVacayYearsRepo,
  createTestVacayUserYearsRepo,
  createTestVacayUserColorsRepo,
  createTestVacayEntriesRepo,
  createTestVacayCompanyHolidaysRepo,
  createTestVacaySharesRepo,
  createTestVacayUserSettingsRepo,
} from '../../helpers/vacay-repos';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db, closeDb: () => {}, reinitialize: () => {} };
});

const orm = () => sharedTestOrm(testDb);
let svc: VacayService;

async function buildVacayService() {
  const plans = await createTestVacayPlansRepo(testDb);
  return new VacayService(
    plans,
    await createTestVacayPlanMembersRepo(testDb),
    await createTestVacayYearsRepo(testDb),
    await createTestVacayUserYearsRepo(testDb),
    await createTestVacayUserColorsRepo(testDb),
    await createTestVacayEntriesRepo(testDb),
    await createTestVacayCompanyHolidaysRepo(testDb),
    await createTestVacayHolidayCalendarsRepo(testDb),
    await createTestVacaySharesRepo(testDb),
    await createTestVacayUserSettingsRepo(testDb),
    await createTestSchoolHolidayRegionsRepo(testDb),
    new RealtimeService(),
    notificationsStub(),
    await createTestUnitOfWork(testDb),
  );
}

async function setupUserWithPlan() {
  const { user } = createUser(testDb);
  return { user, plan: await svc.getOwnPlan(user.id) };
}

beforeAll(async () => {
  svc = await buildVacayService();
});

beforeEach(() => {
  resetTestDb(testDb);
  (svc as unknown as { holidayCache: Map<string, unknown> }).holidayCache.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

afterAll(() => {
  vi.unstubAllGlobals();
  testDb.close();
});

describe('Vacay holiday provider', () => {
  it('VACAY-SVC-070: reports an upstream non-2xx and does not cache the error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    expect(await asLegacyResult(fresh.getCountries())).toEqual({ error: 'Failed to fetch countries', status: 502 });
    expect(await asLegacyResult(fresh.getCountries())).toEqual({ error: 'Failed to fetch countries', status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://nagerholidays.com/api/v4/Countries/Available',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('VACAY-SVC-070e: maps Nager v4 holidays and caches by year and country', async () => {
    const holidays = [
      {
        date: '2026-01-01',
        name: "New Year's Day",
        countryCode: 'US',
        nationalHoliday: true,
        subdivisionCodes: null,
        holidayTypes: ['Public'],
      },
      {
        date: '2026-02-16',
        name: 'Washington’s Birthday',
        countryCode: 'US',
        nationalHoliday: false,
        subdivisionCodes: ['US-CA'],
        holidayTypes: ['Public'],
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => holidays });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    const expected = [
      { date: '2026-01-01', name: "New Year's Day", localName: "New Year's Day", global: true, counties: null },
      {
        date: '2026-02-16',
        name: 'Washington’s Birthday',
        localName: 'Washington’s Birthday',
        global: false,
        counties: ['US-CA'],
      },
    ];
    expect((await fresh.getHolidays('2026', 'US')).data).toEqual(expected);
    expect((await fresh.getHolidays('2026', 'US')).data).toEqual(expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://nagerholidays.com/api/v4/Holidays/US/2026',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('VACAY-SVC-070f: passes through v4 country records and caches them', async () => {
    const countries = [
      { countryCode: 'US', name: 'United States' },
      { countryCode: 'CN', name: 'China' },
    ];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => countries });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    expect((await fresh.getCountries()).data).toEqual(countries);
    expect((await fresh.getCountries()).data).toEqual(countries);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://nagerholidays.com/api/v4/Countries/Available',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('VACAY-SVC-070g: rejects an invalid v4 payload without caching it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ date: '2026-01-01', name: 'New Year' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    expect(await asLegacyResult(fresh.getHolidays('2026', 'CN'))).toEqual({
      error: 'Failed to fetch holidays',
      status: 502,
    });
    expect((await fresh.getHolidays('2026', 'CN')).data).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('VACAY-SVC-070a: refuses malformed holiday URL segments', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    for (const [year, country] of [
      ['../../..', 'DE'],
      ['2026', 'DE/../../x'],
      ['20xx', 'DE'],
      ['2026', 'DEU'],
    ]) {
      expect(await asLegacyResult(fresh.getHolidays(year, country))).toEqual({
        error: 'Failed to fetch holidays',
        status: 502,
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('VACAY-SVC-070b: refuses a malformed school holiday country code', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    expect(await asLegacyResult(fresh.getSchoolHolidayRegions('DE&countryIsoCode=FR'))).toEqual({
      error: 'Failed to fetch school holiday regions',
      status: 502,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('VACAY-SVC-070c: rejects a provider body over the declared size cap', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (h: string) => (h === 'content-length' ? String(50 * 1024 * 1024) : null) },
      json: async () => [{ date: '2026-01-01' }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    expect(await asLegacyResult(fresh.getCountries())).toEqual({ error: 'Failed to fetch countries', status: 502 });
    expect(await asLegacyResult(fresh.getHolidays('2026', 'DE'))).toEqual({
      error: 'Failed to fetch holidays',
      status: 502,
    });
  });

  it('VACAY-SVC-070d: rejects a chunked provider body when its stream exceeds the size cap', async () => {
    const payload = `[${'{"date":"2026-01-01"},'.repeat(200_000)}{"date":"2026-12-24"}]`;
    const fetchMock = vi.fn().mockImplementation(async () => {
      let sent = false;
      return {
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: async () =>
              sent ? { done: true } : ((sent = true), { done: false, value: new TextEncoder().encode(payload) }),
            cancel: async () => undefined,
          }),
          cancel: async () => undefined,
        },
        json: async () => JSON.parse(payload),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    expect(await asLegacyResult(fresh.getHolidays('2026', 'DE'))).toEqual({
      error: 'Failed to fetch holidays',
      status: 502,
    });
    expect(await asLegacyResult(fresh.getCountries())).toEqual({ error: 'Failed to fetch countries', status: 502 });
  });

  it('VACAY-SVC-071: uses the holiday cache until its TTL expires', async () => {
    const { plan } = await setupUserWithPlan();
    await updateRows(await orm(), VacayPlans, { id: plan.id }, { holidays_enabled: 1 });
    await insertRow(await orm(), VacayHolidayCalendars, { plan: plan.id, region: 'DE' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await buildVacayService();

    await fresh.applyHolidayCalendars(plan.id);
    const afterFirst = fetchMock.mock.calls.length;
    await fresh.applyHolidayCalendars(plan.id);
    expect(fetchMock.mock.calls.length).toBe(afterFirst);

    vi.useFakeTimers();
    try {
      vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000 + 1);
      await fresh.applyHolidayCalendars(plan.id);
      expect(fetchMock.mock.calls.length).toBeGreaterThan(afterFirst);
    } finally {
      vi.useRealTimers();
    }
  });
});
