import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import {
  ExchangeRateConflictError,
  ExchangeRatePreviewExpiredError,
  InvalidExchangeRateError,
  applyTripExchangeRateUpdate,
  cleanupExpiredExchangeRatePreviews,
  effectiveTripValue,
  freezeRateForWrite,
  getGlobalRateSnapshot,
  previewTripExchangeRateUpdate,
  refreshGlobalRates,
  refreshStoredRateBases,
  resetExchangeRateProviderStateForTests,
  resolveExchangeRate,
  setTripExchangeRate,
} from '../../../src/services/exchangeRateService';
import { resetTestDb } from '../../helpers/test-db';

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { testDb } = await vi.hoisted(async () => {
  const { default: Database } = await import('better-sqlite3');
  return { testDb: new Database(':memory:') };
});
vi.mock('../../../src/db/database', () => ({
  db: testDb,
  closeDb: () => {},
  reinitialize: () => {},
}));

createTables(testDb);
runMigrations(testDb);

describe('exchangeRateService layered defaults', () => {
  let userId: number;
  let tripId: number;

  beforeEach(() => {
    resetTestDb(testDb);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetExchangeRateProviderStateForTests();
    userId = Number(
      testDb.prepare("INSERT INTO users (username, email, password_hash) VALUES ('fx', 'fx@example.com', 'x')").run()
        .lastInsertRowid,
    );
    tripId = Number(
      testDb.prepare("INSERT INTO trips (user_id, title, currency) VALUES (?, 'FX trip', 'EUR')").run(userId)
        .lastInsertRowid,
    );
  });

  afterAll(() => testDb.close());

  it('uses identity, then trip, then the durable global snapshot', async () => {
    const identity = await resolveExchangeRate(tripId, 'EUR');
    expect(identity).toMatchObject({ exchange_rate: 1, source: 'identity' });

    setTripExchangeRate(tripId, 'USD', 1.25, userId);
    const trip = await resolveExchangeRate(tripId, 'USD');
    expect(trip).toMatchObject({ exchange_rate: 1.25, source: 'trip' });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ date: '2026-08-07', base: 'EUR', quote: 'JPY', rate: 170 }],
      }),
    );
    const global = await resolveExchangeRate(tripId, 'JPY');
    expect(global).toMatchObject({ exchange_rate: 170, source: 'global', effective_date: '2026-08-07' });
    expect(global).not.toHaveProperty('quote_id');
    expect(
      testDb.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'exchange_rate_quotes'").get(),
    ).toBeUndefined();
  });

  it('keeps and marks the last successful snapshot stale after a provider failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ date: '2026-08-07', base: 'EUR', quote: 'USD', rate: 1.2 }],
      }),
    );
    await getGlobalRateSnapshot('EUR');
    testDb.prepare("UPDATE global_exchange_rate_snapshots SET fetched_at = '2020-01-01T00:00:00.000Z'").run();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const stale = await getGlobalRateSnapshot('EUR');
    expect(stale).toMatchObject({ stale: true, rates: { EUR: 1, USD: 1.2 } });
  });

  it('forces identity and records caller-provided rates as explicit', async () => {
    const identity = { currency: 'EUR', exchange_rate: 9 };
    await freezeRateForWrite(tripId, identity, userId);
    expect(identity).toMatchObject({ exchange_rate: 1, exchange_rate_source: 'identity' });

    const explicit = { currency: 'USD', exchange_rate: 1.2 };
    await freezeRateForWrite(tripId, explicit, userId);
    expect(explicit).toMatchObject({
      exchange_rate: 1.2,
      exchange_rate_source: 'explicit',
      exchange_rate_set_by_user_id: userId,
    });

    await expect(freezeRateForWrite(tripId, { currency: 'USD', exchange_rate: 0 }, userId)).rejects.toBeInstanceOf(
      InvalidExchangeRateError,
    );
  });

  it('does not persist resolutions and derives omitted rates on every write', async () => {
    setTripExchangeRate(tripId, 'USD', 1.25, userId);
    await resolveExchangeRate(tripId, 'USD');
    await resolveExchangeRate(tripId, 'USD');
    const write = { currency: 'USD' };
    await freezeRateForWrite(tripId, write, userId);
    expect(write).toMatchObject({ exchange_rate: 1.25, exchange_rate_source: 'trip' });
  });

  it('strips forged provenance while preserving an unchanged frozen row', async () => {
    const update: Record<string, unknown> = {
      currency: 'USD',
      exchange_rate_source: 'global',
      exchange_rate_source_version: 'forged',
      exchange_rate_set_by_user_id: 999,
      exchange_rate_reset_at: 'forged',
    };
    await freezeRateForWrite(tripId, update, userId, { currency: 'USD', exchange_rate: 1.18 });
    expect(update).toEqual({ currency: 'USD' });

    Object.assign(update, { exchange_rate: 1.3, exchange_rate_source: 'trip' });
    await freezeRateForWrite(tripId, update, userId, { currency: 'USD', exchange_rate: 1.18 });
    expect(update).toMatchObject({ exchange_rate_source: 'explicit', exchange_rate_set_by_user_id: userId });
  });

  it('preserves an existing frozen rate on unrelated edits', async () => {
    const update = { currency: 'USD' };
    await freezeRateForWrite(tripId, update, userId, { currency: 'USD', exchange_rate: 1.18 });
    expect(update).toEqual({ currency: 'USD' });
  });

  it('never auto-selects explicit or legacy rows and rejects a changed preview', async () => {
    const insert = testDb.prepare(`
      INSERT INTO budget_items
        (trip_id, category, name, total_price, currency, exchange_rate, exchange_rate_source)
      VALUES (?, 'food', ?, 120, 'USD', ?, ?)
    `);
    insert.run(tripId, 'Global', 1.2, 'global');
    insert.run(tripId, 'Explicit', 1.1, 'explicit');
    insert.run(tripId, 'Legacy', 1, 'legacy');

    const preview = await previewTripExchangeRateUpdate(tripId, 'USD', 1.25, userId);
    expect(preview.rows.map((row) => [row.source, row.selected])).toEqual([
      ['global', true],
      ['explicit', false],
      ['legacy', false],
    ]);

    testDb.prepare("UPDATE budget_items SET total_price = 121 WHERE name = 'Global'").run();
    expect(() => applyTripExchangeRateUpdate(tripId, preview.preview_id, [], userId)).toThrow(
      ExchangeRateConflictError,
    );
  });

  it('applies a selected batch to expenses and settlements with frozen trip provenance', async () => {
    const otherUserId = Number(
      testDb.prepare("INSERT INTO users (username, email, password_hash) VALUES ('fx2', 'fx2@example.com', 'x')").run()
        .lastInsertRowid,
    );
    const expenseId = Number(
      testDb
        .prepare(
          `
      INSERT INTO budget_items
        (trip_id, category, name, total_price, currency, exchange_rate, exchange_rate_source)
      VALUES (?, 'food', 'Dinner', 120, 'USD', 1.2, 'global')
    `,
        )
        .run(tripId).lastInsertRowid,
    );
    const settlementId = Number(
      testDb
        .prepare(
          `
      INSERT INTO budget_settlements
        (trip_id, from_user_id, to_user_id, amount, currency, exchange_rate, exchange_rate_source)
      VALUES (?, ?, ?, 60, 'USD', 1.1, 'trip')
    `,
        )
        .run(tripId, userId, otherUserId).lastInsertRowid,
    );

    const preview = await previewTripExchangeRateUpdate(tripId, 'USD', 1.25, userId, 'Summer rate');
    expect(preview.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'expense', id: expenseId, selected: true }),
        expect.objectContaining({ type: 'settlement', id: settlementId, selected: true }),
      ]),
    );

    const selected = [
      { type: 'expense' as const, id: expenseId },
      { type: 'settlement' as const, id: settlementId },
    ];
    const result = applyTripExchangeRateUpdate(tripId, preview.preview_id, selected, userId, 'usd');
    expect(result.updated).toEqual(selected);
    expect(result.rate).toMatchObject({ currency: 'USD', exchange_rate: 1.25, note: 'Summer rate' });

    for (const [table, id] of [
      ['budget_items', expenseId],
      ['budget_settlements', settlementId],
    ] as const) {
      expect(
        testDb
          .prepare(
            `
        SELECT exchange_rate, exchange_rate_source, exchange_rate_source_version,
               exchange_rate_set_by_user_id, exchange_rate_note, exchange_rate_reset_at
        FROM ${table} WHERE id = ?
      `,
          )
          .get(id),
      ).toMatchObject({
        exchange_rate: 1.25,
        exchange_rate_source: 'trip',
        exchange_rate_set_by_user_id: userId,
        exchange_rate_note: 'Summer rate',
      });
    }
  });

  it('uses the same snapshot conversion for legacy preview values and settlement math', async () => {
    testDb
      .prepare(
        `
      INSERT INTO global_exchange_rate_snapshots
        (base_currency, rates_json, source_version, effective_date, fetched_at)
      VALUES ('EUR', '{"EUR":1,"USD":1.25}', 'seed', '2026-08-08', ?)
    `,
      )
      .run(new Date().toISOString());
    testDb
      .prepare(
        `
      INSERT INTO budget_items
        (trip_id, category, name, total_price, currency, exchange_rate, exchange_rate_source)
      VALUES (?, 'food', 'Legacy', 125, 'USD', 1, 'legacy')
    `,
      )
      .run(tripId);

    const preview = await previewTripExchangeRateUpdate(tripId, 'USD', 1.3, userId);
    expect(preview.rows[0].old_trip_value).toBe(100);
    expect(effectiveTripValue(125, 'USD', 'EUR', 1, 'legacy', { EUR: 1, USD: 1.25 })).toBe(100);
    expect(effectiveTripValue(125, 'USD', 'EUR', 1, 'legacy', null)).toBe(125);
  });

  it('expires previews after one hour and cleanup preserves fresh rows', async () => {
    const old = await previewTripExchangeRateUpdate(tripId, 'USD', 1.2, userId);
    const fresh = await previewTripExchangeRateUpdate(tripId, 'JPY', 150, userId);
    testDb
      .prepare("UPDATE exchange_rate_batch_previews SET created_at = '2020-01-01 00:00:00' WHERE id = ?")
      .run(old.preview_id);

    expect(() => applyTripExchangeRateUpdate(tripId, old.preview_id, [], userId)).toThrow(
      ExchangeRatePreviewExpiredError,
    );
    expect(
      testDb.prepare('SELECT id FROM exchange_rate_batch_previews WHERE id = ?').get(fresh.preview_id),
    ).toBeTruthy();
    expect(cleanupExpiredExchangeRatePreviews()).toBe(0);
  });

  it('does not call Frankfurter for unsupported bases and negative-caches failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);

    await expect(refreshGlobalRates('BGN')).resolves.toBeNull();
    await expect(refreshGlobalRates('NOK')).resolves.toBeNull();
    await expect(refreshGlobalRates('NOK')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('base=NOK');
  });

  it('caps provider requests at four concurrent bases', async () => {
    const resolvers: Array<(value: unknown) => void> = [];
    const fetchMock = vi.fn(() => new Promise((resolve) => resolvers.push(resolve)));
    vi.stubGlobal('fetch', fetchMock);
    const pending = ['USD', 'GBP', 'JPY', 'AUD', 'CAD'].map((base) => refreshGlobalRates(base));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    resolvers.shift()!({ ok: true, json: async () => [{ date: '2026-08-08', quote: 'EUR', rate: 0.8 }] });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    for (const resolve of resolvers.splice(0)) {
      resolve({ ok: true, json: async () => [{ date: '2026-08-08', quote: 'EUR', rate: 0.8 }] });
    }
    await Promise.all(pending);
  });

  it('aborts provider requests after ten seconds', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url: string, init: { signal: AbortSignal }) =>
            new Promise((_resolve, reject) =>
              init.signal.addEventListener('abort', () => reject(new Error('aborted'))),
            ),
        ),
      );
      const pending = refreshGlobalRates('CHF');
      await vi.advanceTimersByTimeAsync(10_000);
      await expect(pending).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('scheduled refresh ignores stored bases outside the provider allowlist', async () => {
    const insert = testDb.prepare(`
      INSERT INTO global_exchange_rate_snapshots
        (base_currency, rates_json, source_version, effective_date, fetched_at)
      VALUES (?, '{}', 'old', NULL, '2020-01-01T00:00:00.000Z')
    `);
    insert.run('BGN');
    insert.run('USD');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: '2026-08-08', quote: 'EUR', rate: 0.8 }],
    });
    vi.stubGlobal('fetch', fetchMock);

    await refreshStoredRateBases();
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes('base=BGN'))).toBe(false);
    expect(urls.some((url) => url.includes('base=EUR'))).toBe(true);
    expect(urls.some((url) => url.includes('base=USD'))).toBe(true);
  });
});
