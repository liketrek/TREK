/**
 * Budget Planner integration tests.
 * Covers BUDGET-001 to BUDGET-010.
 */
import { buildApp } from '../../src/bootstrap';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { BudgetSettlements } from '../../src/db/entities/BudgetSettlements.entity';
import { GlobalExchangeRateSnapshots } from '../../src/db/entities/GlobalExchangeRateSnapshots.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { authCookie } from '../helpers/auth';
import { makeBudgetItem } from '../helpers/factories/budget';
import { makeReservation } from '../helpers/factories/reservations';
import { deleteRows, findRow, insertRow } from '../helpers/factories/rows';
import { setAppSetting } from '../helpers/factories/settings';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

/** A hotel expense linked to the booking. */
function seedBookedExpense(tripId: number, reservationId: number, totalPrice: number): Promise<number> {
  return insertRow(orm, BudgetItems, {
    trip: tripId,
    name: 'Hotel Cost',
    category: 'Accommodation',
    total_price: totalPrice,
    reservation: reservationId,
  });
}

beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
  // GET /budget/settlement reaches ExchangeRatesService.getRates unconditionally
  // (budget.service.ts settlement()), and that is a real fetch to
  // api.frankfurter.dev with a 10 s abort. Without this stub the suite talks to
  // the internet: slow, offline-dependent, and it makes the run take minutes
  // longer on a machine that cannot reach it. Fail closed — every assertion here
  // is single-currency, so rates never enter the arithmetic.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('offline');
    }),
  );
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await nestApp.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Create budget item
// ─────────────────────────────────────────────────────────────────────────────

describe('Create budget item', () => {
  it('BUDGET-001 — POST creates budget item', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/budget`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Flights', category: 'Transport', total_price: 500, currency: 'EUR' });
    expect(res.status).toBe(201);
    expect(res.body.item.name).toBe('Flights');
    expect(res.body.item.total_price).toBe(500);
  });

  it('BUDGET-001 — POST without name returns 400', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/budget`)
      .set('Cookie', authCookie(user.id))
      .send({ category: 'Transport', total_price: 200 });
    expect(res.status).toBe(400);
  });

  it('BUDGET-010 — non-member cannot create budget item', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/budget`)
      .set('Cookie', authCookie(other.id))
      .send({ name: 'Hotels', total_price: 300 });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// List budget items
// ─────────────────────────────────────────────────────────────────────────────

describe('List budget items', () => {
  it('BUDGET-002 — GET /api/trips/:tripId/budget returns all items', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makeBudgetItem(orm, trip.id, { name: 'Flight', total_price: 300 });
    await makeBudgetItem(orm, trip.id, { name: 'Hotel', total_price: 500 });

    const res = await request(app).get(`/api/trips/${trip.id}/budget`).set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
  });

  it('BUDGET-002 — member can list budget items', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);
    await addTripMember(orm, trip.id, member.id);
    await makeBudgetItem(orm, trip.id, { name: 'Rental', total_price: 200 });

    const res = await request(app).get(`/api/trips/${trip.id}/budget`).set('Cookie', authCookie(member.id));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Update budget item
// ─────────────────────────────────────────────────────────────────────────────

describe('Update budget item', () => {
  it('BUDGET-003 — PUT updates budget item fields', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id, { name: 'Old Name', total_price: 100 });

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'New Name', total_price: 250 });
    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe('New Name');
    expect(res.body.item.total_price).toBe(250);
  });

  it('BUDGET-003 — PUT non-existent item returns 404', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/99999`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Updated' });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete budget item
// ─────────────────────────────────────────────────────────────────────────────

describe('Delete budget item', () => {
  it('BUDGET-004 — DELETE removes item', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id);

    const del = await request(app).delete(`/api/trips/${trip.id}/budget/${item.id}`).set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const list = await request(app).get(`/api/trips/${trip.id}/budget`).set('Cookie', authCookie(user.id));
    expect(list.body.items).toHaveLength(0);
  });

  it('BUDGET-004b — DELETE budget item does NOT delete its linked reservation', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const reservation = await makeReservation(orm, trip.id, { title: 'Hotel Booking', type: 'hotel' });

    const itemId = await seedBookedExpense(trip.id, reservation.id, 250);

    const del = await request(app).delete(`/api/trips/${trip.id}/budget/${itemId}`).set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);

    const reservationAfter = await findRow(orm, Reservations, { id: reservation.id });
    expect(reservationAfter).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Members
// ─────────────────────────────────────────────────────────────────────────────

describe('Budget item members', () => {
  it('BUDGET-005 — PUT /members assigns members to budget item', async () => {
    const { user } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await addTripMember(orm, trip.id, member.id);
    const item = await makeBudgetItem(orm, trip.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id, member.id] });
    expect(res.status).toBe(200);
    expect(res.body.members).toBeDefined();

    // After assigning members, list items should include them (covers loadBudgetItems member loop)
    const listRes = await request(app).get(`/api/trips/${trip.id}/budget`).set('Cookie', authCookie(user.id));
    expect(listRes.status).toBe(200);
    const foundItem = (listRes.body.items as any[]).find((i: any) => i.id === item.id);
    expect(foundItem).toBeDefined();
    expect(foundItem.members).toHaveLength(2);
  });

  it('BUDGET-005b — PUT /members with empty user_ids clears members', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id);

    // First assign a member
    await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id] });

    // Then clear members with empty array
    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [] });
    expect(res.status).toBe(200);
    expect(res.body.members).toHaveLength(0);
  });

  it('BUDGET-005 — PUT /members with non-array user_ids returns 400', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  it('BUDGET-006 — PUT /members/:userId/paid toggles paid status', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id);

    // Assign user as member first
    await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id] });

    // Toggle to paid=true
    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members/${user.id}/paid`)
      .set('Cookie', authCookie(user.id))
      .send({ paid: true });
    expect(res.status).toBe(200);
    expect(res.body.member).toBeDefined();
    expect(res.body.member.paid).toBe(1); // SQLite stores as integer

    // Toggle back to paid=false
    const res2 = await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members/${user.id}/paid`)
      .set('Cookie', authCookie(user.id))
      .send({ paid: false });
    expect(res2.status).toBe(200);
    expect(res2.body.member.paid).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary & Settlement
// ─────────────────────────────────────────────────────────────────────────────

describe('Budget summary and settlement', () => {
  it('BUDGET-007 — GET /summary/per-person returns per-person breakdown', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id, { name: 'Dinner', total_price: 60 });

    await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id] });
    await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members/${user.id}/paid`)
      .set('Cookie', authCookie(user.id))
      .send({ paid: true });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/budget/summary/per-person`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.summary).toHaveLength(1);
    const entry = res.body.summary[0];
    expect(entry.user_id).toBe(user.id);
    expect(typeof entry.total_paid).toBe('number');
    expect(entry.total_paid).toBeGreaterThan(0);
  });

  it('BUDGET-008 — GET /settlement returns settlement transactions', async () => {
    const { user } = await makeUser(orm);
    const { user: user2 } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await addTripMember(orm, trip.id, user2.id);
    const item = await makeBudgetItem(orm, trip.id, { name: 'Dinner', total_price: 60 });

    await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id, user2.id] });
    // New model: who actually paid is recorded as an explicit payer (amount in
    // the expense currency), not a per-member "paid" toggle.
    await request(app)
      .put(`/api/trips/${trip.id}/budget/${item.id}/payers`)
      .set('Cookie', authCookie(user.id))
      .send({ payers: [{ user_id: user.id, amount: 60 }] });

    const res = await request(app).get(`/api/trips/${trip.id}/budget/settlement`).set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.balances)).toBe(true);
    expect(Array.isArray(res.body.flows)).toBe(true);

    const payerBalance = res.body.balances.find((b: any) => b.user_id === user.id);
    const nonPayerBalance = res.body.balances.find((b: any) => b.user_id === user2.id);
    expect(payerBalance.balance).toBeCloseTo(30);
    expect(nonPayerBalance.balance).toBeCloseTo(-30);

    expect(res.body.flows).toHaveLength(1);
    expect(res.body.flows[0].from.user_id).toBe(user2.id);
    expect(res.body.flows[0].to.user_id).toBe(user.id);
    expect(res.body.flows[0].amount).toBeCloseTo(30);
  });

  it('BUDGET-009 — settlement with no payers returns empty transactions', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makeBudgetItem(orm, trip.id, { name: 'Train', total_price: 40 });

    const res = await request(app).get(`/api/trips/${trip.id}/budget/settlement`).set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.balances).toEqual([]);
    expect(res.body.flows).toEqual([]);
    // Additive since the VND/AUD report: what the amounts are in, and what was left out.
    expect(res.body.currency).toBe('EUR');
    expect(res.body.unconverted).toEqual({ item_ids: [], settlement_ids: [], currencies: [] });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reorder items
// ─────────────────────────────────────────────────────────────────────────────

describe('Reorder budget items', () => {
  it('BUDGET-011 — non-member gets 404 on PUT /reorder/items', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);
    const item = await makeBudgetItem(orm, trip.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/reorder/items`)
      .set('Cookie', authCookie(other.id))
      .send({ orderedIds: [item.id] });
    expect(res.status).toBe(404);
  });

  it('BUDGET-012 — member without permission gets 403 on PUT /reorder/items', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);
    await addTripMember(orm, trip.id, member.id);
    const item = await makeBudgetItem(orm, trip.id);

    // Restrict budget_edit to trip_owner only
    await setAppSetting(orm, 'perm_budget_edit', 'trip_owner');
    const { invalidatePermissionsCache } = await import('../../src/nest/permissions/permissions-cache');
    await invalidatePermissionsCache();

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/reorder/items`)
      .set('Cookie', authCookie(member.id))
      .send({ orderedIds: [item.id] });
    expect(res.status).toBe(403);

    // Restore default
    await deleteRows(orm, AppSettings, { key: 'perm_budget_edit' });
    await invalidatePermissionsCache();
  });

  it('BUDGET-013 — owner can reorder budget items — returns 200', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item1 = await makeBudgetItem(orm, trip.id, { name: 'First' });
    const item2 = await makeBudgetItem(orm, trip.id, { name: 'Second' });

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/reorder/items`)
      .set('Cookie', authCookie(user.id))
      .send({ orderedIds: [item2.id, item1.id] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reorder categories
// ─────────────────────────────────────────────────────────────────────────────

describe('Reorder budget categories', () => {
  it('BUDGET-014 — non-member gets 404 on PUT /reorder/categories', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/reorder/categories`)
      .set('Cookie', authCookie(other.id))
      .send({ orderedCategories: ['Transport'] });
    expect(res.status).toBe(404);
  });

  it('BUDGET-015 — owner can reorder categories — returns 200', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makeBudgetItem(orm, trip.id, { name: 'Flight', category: 'Transport' });
    await makeBudgetItem(orm, trip.id, { name: 'Hotel', category: 'Accommodation' });

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/reorder/categories`)
      .set('Cookie', authCookie(user.id))
      .send({ orderedCategories: ['Accommodation', 'Transport'] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reservation price sync
// ─────────────────────────────────────────────────────────────────────────────

describe('Reservation price sync on budget item update', () => {
  it('BUDGET-016 — updating total_price syncs to linked reservation metadata', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const reservation = await makeReservation(orm, trip.id, { title: 'Hotel Booking', type: 'hotel' });

    // Create a budget item linked to the reservation
    const itemId = await seedBookedExpense(trip.id, reservation.id, 200);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/${itemId}`)
      .set('Cookie', authCookie(user.id))
      .send({ total_price: 350 });
    expect(res.status).toBe(200);
    expect(res.body.item.total_price).toBe(350);

    // Verify reservation metadata was synced
    const updatedReservation = await findRow(orm, Reservations, { id: reservation.id });
    expect(updatedReservation).not.toBeNull();
    const meta = JSON.parse(updatedReservation!.metadata || '{}');
    expect(meta.price).toBe('350');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Permission check — non-owner member trying to edit (when locked to trip_owner)
// ─────────────────────────────────────────────────────────────────────────────

describe('Budget edit permission enforcement', () => {
  it('BUDGET-017 — member cannot create item when budget_edit is restricted to trip_owner', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);
    await addTripMember(orm, trip.id, member.id);

    const { invalidatePermissionsCache } = await import('../../src/nest/permissions/permissions-cache');
    await setAppSetting(orm, 'perm_budget_edit', 'trip_owner');
    await invalidatePermissionsCache();

    const res = await request(app)
      .post(`/api/trips/${trip.id}/budget`)
      .set('Cookie', authCookie(member.id))
      .send({ name: 'Sneaky Expense', total_price: 100 });
    expect(res.status).toBe(403);

    await deleteRows(orm, AppSettings, { key: 'perm_budget_edit' });
    await invalidatePermissionsCache();
  });

  it('BUDGET-018 — member cannot reorder categories when budget_edit is restricted to trip_owner', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);
    await addTripMember(orm, trip.id, member.id);
    await makeBudgetItem(orm, trip.id, { name: 'Item', category: 'Transport' });

    const { invalidatePermissionsCache } = await import('../../src/nest/permissions/permissions-cache');
    await setAppSetting(orm, 'perm_budget_edit', 'trip_owner');
    await invalidatePermissionsCache();

    const res = await request(app)
      .put(`/api/trips/${trip.id}/budget/reorder/categories`)
      .set('Cookie', authCookie(member.id))
      .send({ orderedCategories: ['Transport'] });
    expect(res.status).toBe(403);

    await deleteRows(orm, AppSettings, { key: 'perm_budget_edit' });
    await invalidatePermissionsCache();
  });
});

describe('fork exchange rates over REST', () => {
  it('persists intentional 1:1, ignores untrusted provenance, and applies a stored preview once', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cookie = authCookie(user.id);
    const costs = `/api/trips/${trip.id}/budget`;
    const rates = `/api/trips/${trip.id}/exchange-rates/CAD`;
    const created = await request(app).post(costs).set('Cookie', cookie).send({
      name: 'Explicit 1:1',
      currency: 'CAD',
      total_price: 30,
      exchange_rate: 1,
      exchange_rate_source: 'global',
      exchange_rate_set_by_user_id: 99,
    });
    expect(created.status).toBe(201);
    expect(created.body.item).toMatchObject({
      exchange_rate: 1,
      exchange_rate_source: 'explicit',
      exchange_rate_set_by_user_id: user.id,
    });
    const id = created.body.item.id;
    const legacyId = await insertRow(orm, BudgetItems, {
      trip: trip.id,
      name: 'Legacy 1',
      total_price: 10,
      currency: 'CAD',
    });
    await insertRow(orm, GlobalExchangeRateSnapshots, {
      base_currency: 'EUR',
      rates_json: '{"EUR":1,"CAD":1.5}',
      source_version: 'fixture',
      effective_date: '2026-01-01',
      fetched_at: new Date().toISOString(),
    });

    const summary = await request(app).get(`${costs}/settlement`).set('Cookie', cookie);
    expect(summary.status).toBe(200);
    expect(summary.body.unconverted.item_ids).toEqual([legacyId]);
    expect((await findRow(orm, BudgetItems, { id: legacyId }))?.exchange_rate_source).toBe('legacy');

    const preview = async () => request(app).post(`${rates}/preview`).set('Cookie', cookie).send({ exchange_rate: 2 });
    const stale = await preview();
    expect(stale.status).toBe(201);
    expect(stale.body.rows).toEqual([
      expect.objectContaining({ id, old_trip_value: 30, source: 'explicit', selected: false }),
      expect.objectContaining({ id: legacyId, old_trip_value: null, trip_value_delta: null, source: 'legacy' }),
    ]);
    const edited = await request(app).put(`${costs}/${id}`).set('Cookie', cookie).send({ total_price: 34 });
    expect(edited.body.item.exchange_rate_source_version).toBe(created.body.item.exchange_rate_source_version);
    const apply = async (preview_id: string) =>
      request(app)
        .post(`${rates}/apply`)
        .set('Cookie', cookie)
        .send({ preview_id, selected: [{ type: 'expense', id: legacyId }] });
    expect((await apply(stale.body.preview_id)).status).toBe(409);

    const current = await preview();
    const applied = await apply(current.body.preview_id);
    expect(applied.status).toBe(201);
    expect(applied.body).toMatchObject({ rate: { exchange_rate: 2 }, updated: [{ type: 'expense', id: legacyId }] });
    expect((await apply(current.body.preview_id)).status).toBe(400);
    const read = await request(app).get(costs).set('Cookie', cookie);
    expect(read.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id, exchange_rate: 1, exchange_rate_source: 'explicit' }),
        expect.objectContaining({ id: legacyId, exchange_rate: 2, exchange_rate_source: 'trip' }),
      ]),
    );
  });

  it('rejects an unquoted foreign expense and books reservation prices at the trip default', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cookie = authCookie(user.id);
    const base = `/api/trips/${trip.id}`;
    const missing = await request(app).post(`${base}/budget`).set('Cookie', cookie).send({
      name: 'No foreign quote',
      currency: 'ZZZ',
      total_price: 42,
    });
    expect(missing.status).toBe(400);
    const set = await request(app)
      .put(`${base}/exchange-rates/ZZZ`)
      .set('Cookie', cookie)
      .send({ exchange_rate: 1, note: 'Booked rate' });
    expect(set.status).toBe(200);

    const booking = await request(app)
      .post(`${base}/reservations`)
      .set('Cookie', cookie)
      .send({
        title: 'Booked in another currency',
        create_budget_entry: { currency: 'ZZZ', total_price: 42 },
      });
    expect(booking.status).toBe(201);
    const row = await findRow(orm, BudgetItems, { trip: trip.id });
    expect(row).toMatchObject({
      currency: 'ZZZ',
      exchange_rate: 1,
      exchange_rate_source: 'trip',
      exchange_rate_set_by_user_id: user.id,
    });
  });

  it('keeps historical currencyless payments in the display base and records new payments in the trip base', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, member.id);
    const cookie = authCookie(user.id);
    const costs = `/api/trips/${trip.id}/budget`;
    const legacyId = await insertRow(orm, BudgetSettlements, {
      trip: trip.id,
      fromUser: member.id,
      toUser: user.id,
      amount: 10,
      currency: null,
      exchange_rate_source: 'identity',
    });
    const input = { from_user_id: member.id, to_user_id: user.id, amount: 10 };
    const payment = await request(app).post(`${costs}/settlements`).set('Cookie', cookie).send(input);
    expect(payment.status).toBe(201);
    expect(payment.body.settlement.currency).toBe('EUR');

    const edit = await request(app)
      .put(`${costs}/settlements/${legacyId}`)
      .set('Cookie', cookie)
      .send({ ...input, note: 'Historical payment' });
    expect(edit.status).toBe(200);
    expect(edit.body.settlement.currency).toBeNull();

    const summary = await request(app).get(`${costs}/settlement?base=USD&base_rate=2`).set('Cookie', cookie);
    expect(summary.status).toBe(200);
    expect(summary.body.currency).toBe('USD');
    expect(summary.body.finalBudgets.find((row: { user_id: number }) => row.user_id === user.id).sources.moved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ settlement_id: legacyId, cents: 1000 }),
        expect.objectContaining({ settlement_id: payment.body.settlement.id, cents: 2000 }),
      ]),
    );
  });

  it('rebases booked expenses, transfers and defaults together using the outgoing-currency bridge', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, member.id);
    const cookie = authCookie(user.id);
    const base = `/api/trips/${trip.id}`;
    const costs = `${base}/budget`;
    const rates = `${base}/exchange-rates`;
    await insertRow(orm, GlobalExchangeRateSnapshots, {
      base_currency: 'USD',
      rates_json: '{"USD":1,"EUR":0.8}',
      source_version: 'test-bridge',
      fetched_at: new Date().toISOString(),
    });
    const change = (currency: string) => request(app).put(base).set('Cookie', cookie).send({ currency });
    const set = await request(app).put(`${rates}/CAD`).set('Cookie', cookie).send({ exchange_rate: 1.25 });
    expect(set.status).toBe(200);
    const expense = await request(app)
      .post(costs)
      .set('Cookie', cookie)
      .send({ name: 'Implicit euros', total_price: 100 });
    expect(expense.status).toBe(201);
    const payment = await request(app).post(`${costs}/settlements`).set('Cookie', cookie).send({
      from_user_id: user.id,
      to_user_id: member.id,
      currency: 'CAD',
      exchange_rate: 1,
      amount: 24,
    });
    expect(payment.status).toBe(201);
    expect((await change('ZZZ')).status).toBe(400);
    expect((await findRow(orm, BudgetSettlements, { id: payment.body.settlement.id }))?.exchange_rate).toBe(1);

    expect((await change('USD')).status).toBe(200);
    expect(await findRow(orm, BudgetItems, { id: expense.body.item.id })).toMatchObject({
      currency: 'EUR',
      exchange_rate: 0.8,
      total_price: 100,
    });
    expect(await findRow(orm, BudgetSettlements, { id: payment.body.settlement.id })).toMatchObject({
      currency: 'CAD',
      exchange_rate: 0.8,
      amount: 24,
      exchange_rate_source: 'explicit',
    });
    const defaults = await request(app).get(rates).set('Cookie', cookie);
    expect(defaults.body.rates).toEqual([expect.objectContaining({ currency: 'CAD', exchange_rate: 1 })]);
  });
});
