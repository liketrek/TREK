/**
 * Budget module e2e — exercises the migrated /api/trips/:tripId/budget endpoints
 * through the real JwtAuthGuard against a temp SQLite db carrying the full real
 * schema (createTables + runMigrations), so the folded BudgetService runs its
 * real SQL. Only the db singleton (trip access) and the WebSocket broadcast are
 * mocked; the permission check is a spy on the container's PermissionsService.
 * ReservationsModule is mounted beside it because an expense can be linked to a
 * booking (#2084), and deleting that booking has to take the expense with it.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  return { db: tmp };
});
const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));

vi.mock('../../src/db/database', () => ({
  db,
  closeDb: () => {},
  reinitialize: () => {},
  canAccessTrip,
  getPlaceWithTags: () => null,
  isOwner: () => false,
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { BudgetModule } from '../../src/nest/budget/budget.module';
import { ReservationsModule } from '../../src/nest/reservations/reservations.module';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { ExchangeRatesService } from '../../src/nest/budget/exchange-rates.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Budget e2e (real auth guard + temp SQLite, real budget SQL)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, BudgetModule, ReservationsModule] })
      // The settlement read awaits live FX rates; the trip here is all-EUR, so a
      // null result is the identity — and the test never touches the network.
      .overrideProvider(ExchangeRatesService)
      .useValue({ getRates: async () => null })
      // A booking delete notifies the trip; nothing here is listening.
      .overrideProvider(NotificationsService)
      .useValue({ send: vi.fn().mockResolvedValue(undefined) })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    createTables(db);
    runMigrations(db);
    // The temp db carries the real schema (password_hash NOT NULL), so seed the
    // auth users directly instead of via the trimmed-DDL seedUser helper.
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)",
    ).run();
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (2, 'e2e-peer', 'peer@example.test', 'x', 'user', 0)",
    ).run();
    tripId = Number(db.prepare("INSERT INTO trips (user_id, title, currency) VALUES (1, 'E2E Trip', 'EUR')").run().lastInsertRowid);
    // The peer settles up with the owner below, so they have to be on the trip:
    // a settlement between people who do not share one is refused.
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, 2)').run(tripId);
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ id: tripId, user_id: 1, currency: 'EUR' });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get(`/api/trips/${tripId}/budget`);
    expect(res.status).toBe(401);
  });

  it('404 when the trip is not accessible', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get(`/api/trips/${tripId}/budget`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 on create with permission, then 200 list returns the stored row', async () => {
    const created = await request(server)
      .post(`/api/trips/${tripId}/budget`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Hotel', total_price: 200 });
    expect(created.status).toBe(201);
    expect(created.body.item).toMatchObject({ name: 'Hotel', total_price: 200, category: 'other', members: [], payers: [] });

    const row = db.prepare('SELECT name, total_price FROM budget_items WHERE id = ?').get(created.body.item.id);
    expect(row).toEqual({ name: 'Hotel', total_price: 200 });

    const list = await request(server).get(`/api/trips/${tripId}/budget`).set('Cookie', sessionCookie(1));
    expect(list.status).toBe(200);
    expect(list.body.items.map((i: { id: number }) => i.id)).toContain(created.body.item.id);
  });

  it('403 on create without permission', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server)
      .post(`/api/trips/${tripId}/budget`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Hotel' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
  });

  it('400 on member update with a non-array user_ids (Zod pipe envelope)', async () => {
    const res = await request(server)
      .put(`/api/trips/${tripId}/budget/9/members`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: 'no' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('user_ids');
  });

  it('400 on create without a name (Zod pipe envelope)', async () => {
    const res = await request(server)
      .post(`/api/trips/${tripId}/budget`)
      .set('Cookie', sessionCookie(1))
      .send({ total_price: 10 });
    expect(res.status).toBe(400);
    expect(res.body.error.toLowerCase()).toContain('name');
  });

  it('201 on a negative expense (partial reimbursement) and the settlement nets it out (#2176)', async () => {
    // The dinner: user 1 fronts 90, split with user 2 → user 2 owes 45.
    const dinner = await request(server)
      .post(`/api/trips/${tripId}/budget`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Dinner', payers: [{ user_id: 1, amount: 90 }], member_ids: [1, 2] });
    expect(dinner.status).toBe(201);

    // The refund: -30 lands with user 1, shared with user 2 → user 2's debt
    // drops by 15. The write path used to null this to a payer-less 0 € row.
    const refund = await request(server)
      .post(`/api/trips/${tripId}/budget`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Hotel partial refund', total_price: -30, payers: [{ user_id: 1, amount: -30 }], member_ids: [1, 2] });
    expect(refund.status).toBe(201);
    expect(refund.body.item).toMatchObject({ total_price: -30 });
    expect(refund.body.item.payers).toEqual([expect.objectContaining({ user_id: 1, amount: -30 })]);
    const row = db.prepare('SELECT total_price FROM budget_items WHERE id = ?').get(refund.body.item.id) as { total_price: number };
    expect(row.total_price).toBe(-30);

    const settlement = await request(server)
      .get(`/api/trips/${tripId}/budget/settlement`)
      .set('Cookie', sessionCookie(1));
    expect(settlement.status).toBe(200);
    const balances = settlement.body.balances as { user_id: number; balance: number }[];
    const balance = (uid: number) => balances.find(b => b.user_id === uid)!.balance;
    // 45 owed from the dinner minus the 15 refund share = 30, and Σ balances = 0.
    expect(balance(2)).toBe(-30);
    expect(balance(1)).toBe(30);
    expect(balances.reduce((a, b) => a + Math.round(b.balance * 100), 0)).toBe(0);

    // Clean up so the ledger tests below start from an empty trip.
    for (const id of [dinner.body.item.id, refund.body.item.id]) {
      const del = await request(server).delete(`/api/trips/${tripId}/budget/${id}`).set('Cookie', sessionCookie(1));
      expect(del.status).toBe(200);
    }
  });

  it('an expense with no payer creates no debt and no flow (#2225)', async () => {
    // The shape from the report: one bill user 1 fronted for both, plus a row
    // saved with "No one paid yet" that only user 2 is on. The taxi used to be
    // debited with no credit behind it and its whole 60 offered to user 1.
    const dinner = await request(server)
      .post(`/api/trips/${tripId}/budget`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Dinner', payers: [{ user_id: 1, amount: 100 }], member_ids: [1, 2] });
    expect(dinner.status).toBe(201);

    const unpaid = await request(server)
      .post(`/api/trips/${tripId}/budget`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Taxi', total_price: 60, payers: [], member_ids: [2] });
    expect(unpaid.status).toBe(201);
    expect(unpaid.body.item).toMatchObject({ total_price: 60, payers: [] });

    const settlement = await request(server)
      .get(`/api/trips/${tripId}/budget/settlement`)
      .set('Cookie', sessionCookie(1));
    expect(settlement.status).toBe(200);
    const balances = settlement.body.balances as { user_id: number; balance: number }[];
    const balance = (uid: number) => balances.find(b => b.user_id === uid)!.balance;
    // Only the dinner settles: user 2 owes half of it and not a cent of the taxi.
    expect(balance(1)).toBe(50);
    expect(balance(2)).toBe(-50);
    expect(balances.reduce((a, b) => a + Math.round(b.balance * 100), 0)).toBe(0);
    expect(settlement.body.flows).toEqual([
      expect.objectContaining({ amount: 50, from: expect.objectContaining({ user_id: 2 }), to: expect.objectContaining({ user_id: 1 }) }),
    ]);

    // Clean up so the ledger tests below start from an empty trip.
    for (const id of [dinner.body.item.id, unpaid.body.item.id]) {
      const del = await request(server).delete(`/api/trips/${tripId}/budget/${id}`).set('Cookie', sessionCookie(1));
      expect(del.status).toBe(200);
    }
  });

  it('GET /summary/per-person reads a dollar bill on a euro trip at its booked rate (#2525)', async () => {
    const hotel = await request(server)
      .post(`/api/trips/${tripId}/budget`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Aparthotel Silver', currency: 'USD', exchange_rate: 1.17, payers: [{ user_id: 1, amount: 801.76 }], member_ids: [1, 2] });
    expect(hotel.status).toBe(201);

    const res = await request(server)
      .get(`/api/trips/${tripId}/budget/summary/per-person`)
      .set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    // 801.76 USD at 1.17 is 685.26 EUR, half of it each. The summary used to put
    // 400.88 on both and leave the reader to guess the currency.
    const row = (uid: number) => res.body.summary.find((r: { user_id: number }) => r.user_id === uid);
    expect(row(1)).toMatchObject({ total_assigned: 342.63, total_paid: 0, items_count: 1, currency: 'EUR' });
    expect(row(2)).toMatchObject({ total_assigned: 342.63, total_paid: 0, items_count: 1, currency: 'EUR' });

    const del = await request(server).delete(`/api/trips/${tripId}/budget/${hotel.body.item.id}`).set('Cookie', sessionCookie(1));
    expect(del.status).toBe(200);
  });

  it('200 on settlement update with permission, persisting the new amount and day', async () => {
    const created = await request(server)
      .post(`/api/trips/${tripId}/budget/settlements`)
      .set('Cookie', sessionCookie(1))
      .send({ from_user_id: 2, to_user_id: 1, amount: 10, settled_at: '2026-01-05' });
    expect(created.status).toBe(201);
    expect(created.body.settlement.settled_at).toBe('2026-01-05');

    const res = await request(server)
      .put(`/api/trips/${tripId}/budget/settlements/${created.body.settlement.id}`)
      .set('Cookie', sessionCookie(1))
      .send({ from_user_id: 2, to_user_id: 1, amount: 15, settled_at: '2026-01-09' });
    expect(res.status).toBe(200);
    expect(res.body.settlement).toMatchObject({ id: created.body.settlement.id, from_user_id: 2, to_user_id: 1, amount: 15, settled_at: '2026-01-09' });

    const row = db.prepare('SELECT amount, settled_at FROM budget_settlements WHERE id = ?').get(created.body.settlement.id);
    expect(row).toEqual({ amount: 15, settled_at: '2026-01-09' });
  });

  it('200 on settlement update that clears the day, leaving NULL in the column', async () => {
    const created = await request(server)
      .post(`/api/trips/${tripId}/budget/settlements`)
      .set('Cookie', sessionCookie(1))
      .send({ from_user_id: 2, to_user_id: 1, amount: 10, settled_at: '2026-01-05' });
    expect(created.status).toBe(201);

    const res = await request(server)
      .put(`/api/trips/${tripId}/budget/settlements/${created.body.settlement.id}`)
      .set('Cookie', sessionCookie(1))
      .send({ from_user_id: 2, to_user_id: 1, amount: 10, settled_at: null });
    expect(res.status).toBe(200);
    expect(res.body.settlement.settled_at).toBeNull();

    const row = db.prepare('SELECT settled_at FROM budget_settlements WHERE id = ?').get(created.body.settlement.id);
    expect(row).toEqual({ settled_at: null });
  });

  it('404 on settlement update when it does not exist', async () => {
    const res = await request(server)
      .put(`/api/trips/${tripId}/budget/settlements/424242`)
      .set('Cookie', sessionCookie(1))
      .send({ from_user_id: 2, to_user_id: 1, amount: 15 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Settlement not found' });
  });

  // #2084: an expense that already exists can be linked to a booking of its trip
  // (several per booking), let go of again, and goes with the booking it is on.
  describe('linking expenses to bookings (#2084)', () => {
    let bookingId: number;
    let foreignBookingId: number;
    let foreignPlaceId: number;
    let fareId: number;
    let luggageId: number;
    let seatId: number;

    const metadataOf = (id: number) => {
      const row = db.prepare('SELECT metadata FROM reservations WHERE id = ?').get(id) as { metadata: string | null };
      return row.metadata ? JSON.parse(row.metadata) : null;
    };
    const linkOf = (id: number) =>
      db.prepare('SELECT reservation_id FROM budget_items WHERE id = ?').get(id) as { reservation_id: number | null } | undefined;
    const put = (id: number, body: Record<string, unknown>) =>
      request(server).put(`/api/trips/${tripId}/budget/${id}`).set('Cookie', sessionCookie(1)).send(body);
    const create = (body: Record<string, unknown>) =>
      request(server).post(`/api/trips/${tripId}/budget`).set('Cookie', sessionCookie(1)).send(body);

    beforeAll(async () => {
      bookingId = Number(db.prepare(
        "INSERT INTO reservations (trip_id, title, type, metadata) VALUES (?, 'Flight', 'flight', ?)",
      ).run(tripId, JSON.stringify({ seat: '12A' })).lastInsertRowid);
      const otherTripId = Number(db.prepare("INSERT INTO trips (user_id, title, currency) VALUES (1, 'Other Trip', 'EUR')").run().lastInsertRowid);
      foreignBookingId = Number(db.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Elsewhere', 'flight')").run(otherTripId).lastInsertRowid);
      foreignPlaceId = Number(db.prepare("INSERT INTO places (trip_id, name) VALUES (?, 'Elsewhere')").run(otherTripId).lastInsertRowid);
    });

    it('200 on linking two expenses to one booking, which then mirrors their sum', async () => {
      const fare = await create({ name: 'Fare', total_price: 120 });
      const luggage = await create({ name: 'Luggage', total_price: 30.5 });
      expect(fare.status).toBe(201);
      expect(luggage.status).toBe(201);
      fareId = fare.body.item.id;
      luggageId = luggage.body.item.id;

      const first = await put(fareId, { reservation_id: bookingId });
      expect(first.status).toBe(200);
      expect(first.body.item).toMatchObject({ id: fareId, reservation_id: bookingId, total_price: 120 });
      expect(metadataOf(bookingId)).toEqual({ seat: '12A', price: '120' });

      const second = await put(luggageId, { reservation_id: bookingId });
      expect(second.status).toBe(200);
      expect(metadataOf(bookingId)).toEqual({ seat: '12A', price: '150.5' });

      const list = await request(server).get(`/api/trips/${tripId}/budget`).set('Cookie', sessionCookie(1));
      const linked = (list.body.items as { id: number; reservation_id: number | null }[])
        .filter(i => i.reservation_id === bookingId).map(i => i.id);
      expect(linked).toEqual([fareId, luggageId]);
    });

    it('400 on a booking or a place from another trip, on update and on create, writing nothing', async () => {
      const relink = await put(fareId, { reservation_id: foreignBookingId, name: 'Hijacked' });
      expect(relink.status).toBe(400);
      expect(relink.body).toEqual({ error: 'reservation_id does not belong to this trip.' });
      expect(linkOf(fareId)).toEqual({ reservation_id: bookingId });
      expect(db.prepare('SELECT name FROM budget_items WHERE id = ?').get(fareId)).toEqual({ name: 'Fare' });
      expect(metadataOf(foreignBookingId)).toBeNull();

      const place = await put(fareId, { place_id: foreignPlaceId });
      expect(place.status).toBe(400);
      expect(place.body).toEqual({ error: 'place_id does not belong to this trip.' });

      const before = (db.prepare('SELECT COUNT(*) AS n FROM budget_items').get() as { n: number }).n;
      const created = await create({ name: 'Smuggled', total_price: 5, reservation_id: foreignBookingId });
      expect(created.status).toBe(400);
      expect(created.body).toEqual({ error: 'reservation_id does not belong to this trip.' });
      expect((db.prepare('SELECT COUNT(*) AS n FROM budget_items').get() as { n: number }).n).toBe(before);
    });

    it('400 on a reservation_id that is not a positive integer (Zod pipe envelope)', async () => {
      const res = await put(fareId, { reservation_id: 0 });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('reservation_id');
      expect(linkOf(fareId)).toEqual({ reservation_id: bookingId });
    });

    it('200 on unlinking: the expense stays and the booking price is worked out again', async () => {
      const res = await put(luggageId, { reservation_id: null });
      expect(res.status).toBe(200);
      expect(res.body.item).toMatchObject({ id: luggageId, reservation_id: null, total_price: 30.5 });
      expect(linkOf(luggageId)).toEqual({ reservation_id: null });
      expect(metadataOf(bookingId)).toEqual({ seat: '12A', price: '120' });
    });

    it('201 on a second expense created straight onto the booking, which raises its price to the sum', async () => {
      const seat = await create({ name: 'Seat', total_price: 15, reservation_id: bookingId });
      expect(seat.status).toBe(201);
      expect(seat.body.item.reservation_id).toBe(bookingId);
      seatId = seat.body.item.id;
      expect(metadataOf(bookingId)).toEqual({ seat: '12A', price: '135' });
    });

    it('200 on new payers for a linked expense, whose derived total the booking price follows', async () => {
      const res = await request(server)
        .put(`/api/trips/${tripId}/budget/${seatId}/payers`)
        .set('Cookie', sessionCookie(1))
        .send({ payers: [{ user_id: 1, amount: 12 }, { user_id: 2, amount: 6 }] });
      expect(res.status).toBe(200);
      expect(res.body.item).toMatchObject({ id: seatId, total_price: 18 });
      expect(metadataOf(bookingId)).toEqual({ seat: '12A', price: '138' });
    });

    it('200 on a currency-only change of a linked expense, which re-names the booking price', async () => {
      const trainId = Number(db.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Train', 'train')").run(tripId).lastInsertRowid);
      const ticket = await create({ name: 'Ticket', total_price: 60, reservation_id: trainId });
      expect(ticket.status).toBe(201);
      // In the trip currency, so the price carries no currency of its own.
      expect(metadataOf(trainId)).toEqual({ price: '60' });

      const chf = await put(ticket.body.item.id, { currency: 'CHF' });
      expect(chf.status).toBe(200);
      expect(chf.body.item).toMatchObject({ currency: 'CHF', total_price: 60 });
      expect(metadataOf(trainId)).toEqual({ price: '60', priceCurrency: 'CHF' });

      const back = await put(ticket.body.item.id, { currency: null });
      expect(back.status).toBe(200);
      expect(metadataOf(trainId)).toEqual({ price: '60' });

      // An expense with no currency and one naming the trip's own (EUR, in any
      // case) are in the same money, so the booking shows their sum.
      const bike = await create({ name: 'Bike ticket', total_price: 9.5, currency: 'eur', reservation_id: trainId });
      expect(bike.status).toBe(201);
      expect(metadataOf(trainId)).toEqual({ price: '69.5', priceCurrency: 'EUR' });
    });

    it('deleting the booking removes every expense linked to it, and only those', async () => {
      const unlinkedId = luggageId;

      const res = await request(server)
        .delete(`/api/trips/${tripId}/reservations/${bookingId}`)
        .set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });

      expect(db.prepare('SELECT id FROM reservations WHERE id = ?').get(bookingId)).toBeUndefined();
      expect(linkOf(fareId)).toBeUndefined();
      expect(linkOf(seatId)).toBeUndefined();
      expect(linkOf(unlinkedId)).toEqual({ reservation_id: null });

      const list = await request(server).get(`/api/trips/${tripId}/budget`).set('Cookie', sessionCookie(1));
      const ids = (list.body.items as { id: number }[]).map(i => i.id);
      expect(ids).not.toContain(fareId);
      expect(ids).not.toContain(seatId);
      expect(ids).toContain(unlinkedId);
    });
  });

  // The VND/AUD report. The rates override above answers null for every base, which is
  // exactly that server: it never reached the rates provider, so the only rates there
  // are the ones the browser lends.
  describe('rows no rate can convert', () => {
    /** A fresh AUD trip the owner shares with user 2, so these cases never meet the ledger above. */
    function audTrip(): number {
      const id = Number(db.prepare("INSERT INTO trips (user_id, title, currency) VALUES (1, 'AUD Trip', 'AUD')").run().lastInsertRowid);
      db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, 2)').run(id);
      canAccessTrip.mockReturnValue({ id, user_id: 1, currency: 'AUD' });
      return id;
    }
    const balanceOf = (body: { balances: { user_id: number; balance: number }[] }, uid: number) =>
      body.balances.find(b => b.user_id === uid)!.balance;

    it('VND/AUD regression: unfrozen VND bill is listed as unconverted, freeze-rates heals it from the browser quote, settlement nets 489.00, second freeze heals nothing', async () => {
      const trip = audTrip();
      const bill = await request(server)
        .post(`/api/trips/${trip}/budget`)
        .set('Cookie', sessionCookie(1))
        .send({ name: 'Pho', currency: 'VND', payers: [{ user_id: 1, amount: 8920000 }], member_ids: [1, 2] });
      expect(bill.status).toBe(201);
      expect(bill.body.item.exchange_rate).toBe(1);

      // Left out whole before anything is written: no balance in VND's order of magnitude.
      const before = await request(server).get(`/api/trips/${trip}/budget/settlement`).set('Cookie', sessionCookie(1));
      expect(before.status).toBe(200);
      expect(before.body.currency).toBe('AUD');
      expect(before.body.unconverted).toEqual({ item_ids: [bill.body.item.id], settlement_ids: [], currencies: ['VND'] });
      expect(before.body.balances).toEqual([]);

      const fallback_fx = { base: 'AUD', rates: { VND: 18241.3, EUR: 0.61 } };
      const healed = await request(server)
        .post(`/api/trips/${trip}/budget/freeze-rates`)
        .set('Cookie', sessionCookie(1))
        .send({ fallback_fx });
      expect(healed.status).toBe(200);
      expect(healed.body.items.map((i: { id: number; exchange_rate: number }) => [i.id, i.exchange_rate])).toEqual([[bill.body.item.id, 18241.3]]);
      expect(healed.body).toMatchObject({ settlements: [], unresolved: [] });

      const after = await request(server).get(`/api/trips/${trip}/budget/settlement`).set('Cookie', sessionCookie(1));
      expect(after.body.unconverted).toEqual({ item_ids: [], settlement_ids: [], currencies: [] });
      // 8,920,000 VND at 18,241.3 per dollar is 489.00 AUD, half of it user 2's.
      expect(after.body.finalBudgets.find((f: { user_id: number }) => f.user_id === 1).expenses).toBe(489);
      expect(balanceOf(after.body, 1)).toBe(244.5);
      expect(balanceOf(after.body, 2)).toBe(-244.5);

      const again = await request(server)
        .post(`/api/trips/${trip}/budget/freeze-rates`)
        .set('Cookie', sessionCookie(1))
        .send({ fallback_fx: { base: 'AUD', rates: { VND: 25000 } } });
      expect(again.status).toBe(200);
      expect(again.body).toEqual({ items: [], settlements: [], unresolved: [] });
      expect((db.prepare('SELECT exchange_rate FROM budget_items WHERE id = ?').get(bill.body.item.id) as { exchange_rate: number }).exchange_rate).toBe(18241.3);
    });

    it('POST with fallback_fx freezes at entry', async () => {
      const trip = audTrip();
      const res = await request(server)
        .post(`/api/trips/${trip}/budget`)
        .set('Cookie', sessionCookie(1))
        .send({ name: 'Pho', currency: 'VND', total_price: 100000, fallback_fx: { base: 'AUD', rates: { VND: 18241.3 } } });
      expect(res.status).toBe(201);
      expect(res.body.item.exchange_rate).toBe(18241.3);
      expect(res.body.item).not.toHaveProperty('fallback_fx');
    });

    it('POST /settlements in EUR with fallback_fx freezes the transfer', async () => {
      const trip = audTrip();
      const res = await request(server)
        .post(`/api/trips/${trip}/budget/settlements`)
        .set('Cookie', sessionCookie(1))
        .send({ from_user_id: 2, to_user_id: 1, amount: 30.5, currency: 'EUR', fallback_fx: { base: 'AUD', rates: { EUR: 0.61 } } });
      expect(res.status).toBe(201);
      expect(res.body.settlement).toMatchObject({ currency: 'EUR', exchange_rate: 0.61 });

      // Read back in euros at the same browser quote, the transfer is what was typed.
      const s = await request(server).get(`/api/trips/${trip}/budget/settlement?base=EUR&base_rate=0.61`).set('Cookie', sessionCookie(1));
      expect(s.body.currency).toBe('EUR');
      expect(s.body.unconverted.settlement_ids).toEqual([]);
      expect(balanceOf(s.body, 2)).toBe(30.5);
      expect(balanceOf(s.body, 1)).toBe(-30.5);
    });

    it('GET /settlement?base=EUR answers in AUD without base_rate and in EUR with it', async () => {
      const trip = audTrip();
      const dinner = await request(server)
        .post(`/api/trips/${trip}/budget`)
        .set('Cookie', sessionCookie(1))
        .send({ name: 'Dinner', payers: [{ user_id: 1, amount: 100 }], member_ids: [1, 2] });
      expect(dinner.status).toBe(201);

      const plain = await request(server).get(`/api/trips/${trip}/budget/settlement?base=EUR`).set('Cookie', sessionCookie(1));
      expect(plain.status).toBe(200);
      // Trip dollars, labelled as such rather than printed as euros.
      expect(plain.body.currency).toBe('AUD');
      expect(balanceOf(plain.body, 2)).toBe(-50);

      const quoted = await request(server).get(`/api/trips/${trip}/budget/settlement?base=EUR&base_rate=0.61`).set('Cookie', sessionCookie(1));
      expect(quoted.status).toBe(200);
      expect(quoted.body.currency).toBe('EUR');
      expect(balanceOf(quoted.body, 2)).toBe(-30.5);
    });

    it('PUT currency change to VND without a rate stores 1 instead of the USD rate', async () => {
      const trip = audTrip();
      const created = await request(server)
        .post(`/api/trips/${trip}/budget`)
        .set('Cookie', sessionCookie(1))
        .send({ name: 'Taxi', currency: 'USD', exchange_rate: 0.65, total_price: 20 });
      expect(created.body.item.exchange_rate).toBe(0.65);

      const res = await request(server)
        .put(`/api/trips/${trip}/budget/${created.body.item.id}`)
        .set('Cookie', sessionCookie(1))
        .send({ currency: 'VND' });
      expect(res.status).toBe(200);
      expect(res.body.item).toMatchObject({ currency: 'VND', exchange_rate: 1 });
      expect(db.prepare('SELECT currency, exchange_rate FROM budget_items WHERE id = ?').get(created.body.item.id))
        .toEqual({ currency: 'VND', exchange_rate: 1 });
    });

    it('freeze-rates 403 without budget_edit, 400 on malformed fallback_fx, other base heals nothing (unresolved VND)', async () => {
      const trip = audTrip();
      const bill = await request(server)
        .post(`/api/trips/${trip}/budget`)
        .set('Cookie', sessionCookie(1))
        .send({ name: 'Pho', currency: 'VND', total_price: 100000 });
      expect(bill.status).toBe(201);
      const freeze = (body: object) => request(server).post(`/api/trips/${trip}/budget/freeze-rates`).set('Cookie', sessionCookie(1)).send(body);

      checkPermission.mockReturnValue(false);
      const denied = await freeze({ fallback_fx: { base: 'AUD', rates: { VND: 18241.3 } } });
      expect(denied.status).toBe(403);
      expect(denied.body).toEqual({ error: 'No permission' });
      checkPermission.mockReturnValue(true);

      for (const fallback_fx of [{ base: 'aud', rates: { VND: 18241.3 } }, { base: 'AUD', rates: { VND: 0 } }, { base: 'AUD', rates: {} }]) {
        const malformed = await freeze({ fallback_fx });
        expect(malformed.status).toBe(400);
        expect(malformed.body.error).toContain('fallback_fx');
      }

      // A table against euros would freeze the bill against the wrong currency.
      const otherBase = await freeze({ fallback_fx: { base: 'EUR', rates: { VND: 27000 } } });
      expect(otherBase.status).toBe(200);
      expect(otherBase.body).toEqual({ items: [], settlements: [], unresolved: ['VND'] });
      expect((db.prepare('SELECT exchange_rate FROM budget_items WHERE id = ?').get(bill.body.item.id) as { exchange_rate: number }).exchange_rate).toBe(1);
    });

    it('400 on base_rate=abc', async () => {
      const res = await request(server).get(`/api/trips/${tripId}/budget/settlement?base=EUR&base_rate=abc`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('base_rate');
    });
  });
});
