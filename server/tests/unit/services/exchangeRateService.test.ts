import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTestDb } from '../../helpers/test-db';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';

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

import {
  ExchangeRateConflictError,
  InvalidExchangeRateError,
  applyTripExchangeRateUpdate,
  freezeRateForWrite,
  getGlobalRateSnapshot,
  previewTripExchangeRateUpdate,
  resolveExchangeRate,
  setTripExchangeRate,
} from '../../../src/services/exchangeRateService';

describe('exchangeRateService layered defaults', () => {
  let userId: number;
  let tripId: number;

  beforeEach(() => {
    resetTestDb(testDb);
    vi.restoreAllMocks();
    userId = Number(testDb.prepare("INSERT INTO users (username, email, password_hash) VALUES ('fx', 'fx@example.com', 'x')").run().lastInsertRowid);
    tripId = Number(testDb.prepare("INSERT INTO trips (user_id, title, currency) VALUES (?, 'FX trip', 'EUR')").run(userId).lastInsertRowid);
  });

  afterAll(() => testDb.close());

  it('uses identity, then trip, then the durable global snapshot', async () => {
    const identity = await resolveExchangeRate(tripId, 'EUR');
    expect(identity).toMatchObject({ exchange_rate: 1, source: 'identity' });

    setTripExchangeRate(tripId, 'USD', 1.25, userId);
    const trip = await resolveExchangeRate(tripId, 'USD');
    expect(trip).toMatchObject({ exchange_rate: 1.25, source: 'trip' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: '2026-08-07', base: 'EUR', quote: 'JPY', rate: 170 }],
    }));
    const global = await resolveExchangeRate(tripId, 'JPY');
    expect(global).toMatchObject({ exchange_rate: 170, source: 'global', effective_date: '2026-08-07' });
  });

  it('keeps and marks the last successful snapshot stale after a provider failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: '2026-08-07', base: 'EUR', quote: 'USD', rate: 1.2 }],
    }));
    await getGlobalRateSnapshot('EUR');
    testDb.prepare("UPDATE global_exchange_rate_snapshots SET fetched_at = '2020-01-01T00:00:00.000Z'").run();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const stale = await getGlobalRateSnapshot('EUR');
    expect(stale).toMatchObject({ stale: true, rates: { EUR: 1, USD: 1.2 } });
  });

  it('forces identity and rejects non-positive manual values', async () => {
    const identity = { currency: 'EUR', exchange_rate: 9 };
    await freezeRateForWrite(tripId, identity, userId);
    expect(identity).toMatchObject({ exchange_rate: 1, exchange_rate_source: 'identity' });

    await expect(freezeRateForWrite(tripId, { currency: 'USD', exchange_rate: 0 }, userId))
      .rejects.toBeInstanceOf(InvalidExchangeRateError);
  });

  it('validates immutable quotes against the target trip and currency', async () => {
    setTripExchangeRate(tripId, 'USD', 1.25, userId);
    const quote = await resolveExchangeRate(tripId, 'USD');
    expect(quote?.quote_id).toBeTruthy();

    const otherTripId = Number(testDb.prepare("INSERT INTO trips (user_id, title, currency) VALUES (?, 'Other', 'EUR')").run(userId).lastInsertRowid);
    await expect(freezeRateForWrite(otherTripId, { currency: 'USD', quote_id: quote?.quote_id }, userId))
      .rejects.toBeInstanceOf(InvalidExchangeRateError);
    await expect(freezeRateForWrite(tripId, { currency: 'JPY', quote_id: quote?.quote_id }, userId))
      .rejects.toBeInstanceOf(InvalidExchangeRateError);
  });

  it('preserves an existing frozen rate on unrelated edits', async () => {
    const update = { currency: 'USD' };
    await freezeRateForWrite(tripId, update, userId, { currency: 'USD', exchange_rate: 1.18 });
    expect(update).toEqual({ currency: 'USD' });
  });

  it('never auto-selects manual or legacy rows and rejects a changed preview', () => {
    const insert = testDb.prepare(`
      INSERT INTO budget_items
        (trip_id, category, name, total_price, currency, exchange_rate, exchange_rate_source)
      VALUES (?, 'food', ?, 120, 'USD', ?, ?)
    `);
    insert.run(tripId, 'Global', 1.2, 'global');
    insert.run(tripId, 'Manual', 1.1, 'manual');
    insert.run(tripId, 'Legacy', 1, 'legacy');

    const preview = previewTripExchangeRateUpdate(tripId, 'USD', 1.25, userId);
    expect(preview.rows.map(row => [row.source, row.selected])).toEqual([
      ['global', true], ['manual', false], ['legacy', false],
    ]);

    testDb.prepare("UPDATE budget_items SET total_price = 121 WHERE name = 'Global'").run();
    expect(() => applyTripExchangeRateUpdate(tripId, preview.preview_id, [], userId))
      .toThrow(ExchangeRateConflictError);
  });

  it('applies a selected batch to expenses and settlements with frozen trip provenance', () => {
    const otherUserId = Number(testDb.prepare("INSERT INTO users (username, email, password_hash) VALUES ('fx2', 'fx2@example.com', 'x')").run().lastInsertRowid);
    const expenseId = Number(testDb.prepare(`
      INSERT INTO budget_items
        (trip_id, category, name, total_price, currency, exchange_rate, exchange_rate_source)
      VALUES (?, 'food', 'Dinner', 120, 'USD', 1.2, 'global')
    `).run(tripId).lastInsertRowid);
    const settlementId = Number(testDb.prepare(`
      INSERT INTO budget_settlements
        (trip_id, from_user_id, to_user_id, amount, currency, exchange_rate, exchange_rate_source)
      VALUES (?, ?, ?, 60, 'USD', 1.1, 'trip')
    `).run(tripId, userId, otherUserId).lastInsertRowid);

    const preview = previewTripExchangeRateUpdate(tripId, 'USD', 1.25, userId, 'Summer rate');
    expect(preview.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'expense', id: expenseId, selected: true }),
      expect.objectContaining({ type: 'settlement', id: settlementId, selected: true }),
    ]));

    const selected = [
      { type: 'expense' as const, id: expenseId },
      { type: 'settlement' as const, id: settlementId },
    ];
    const result = applyTripExchangeRateUpdate(tripId, preview.preview_id, selected, userId, 'usd');
    expect(result.updated).toEqual(selected);
    expect(result.rate).toMatchObject({ currency: 'USD', exchange_rate: 1.25, note: 'Summer rate' });

    for (const [table, id] of [['budget_items', expenseId], ['budget_settlements', settlementId]] as const) {
      expect(testDb.prepare(`
        SELECT exchange_rate, exchange_rate_source, exchange_rate_source_version,
               exchange_rate_set_by_user_id, exchange_rate_note, exchange_rate_reset_at
        FROM ${table} WHERE id = ?
      `).get(id)).toMatchObject({
        exchange_rate: 1.25,
        exchange_rate_source: 'trip',
        exchange_rate_set_by_user_id: userId,
        exchange_rate_note: 'Summer rate',
      });
    }
  });
});
