/**
 * BudgetItemsMcp: the expense list and the per-person totals over MCP, on the
 * same service calls and the same trip access as GET /api/trips/:tripId/budget
 * and GET …/budget/summary/per-person. The suite takes its subject from the
 * container over a snapshot test db; only the exchange rates are stubbed, so
 * nothing reaches the network. The addon gate is the registry's.
 */
import { ADDON_IDS } from '../../../src/addons';
import { BudgetItemMembers } from '../../../src/db/entities/BudgetItemMembers.entity';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { toolOutputForProvider } from '../../../src/nest/assistant/assistant-output';
import { BudgetItemsMcp } from '../../../src/nest/budget/budget-items.mcp';
import { BudgetModule } from '../../../src/nest/budget/budget.module';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import type { BudgetItem } from '../../../src/types';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addBudgetItemMember, addBudgetItemPayer, makeBudgetItem } from '../../helpers/factories/budget';
import { makePlace } from '../../helpers/factories/places';
import { makeReservation } from '../../helpers/factories/reservations';
import { insertRows } from '../../helpers/factories/rows';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let mcp: BudgetItemsMcp;
/** Today's quote against the trip currency; null is a server that cannot quote. */
const getRates = vi.fn<(base: string) => Promise<Record<string, number> | null>>();

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [BudgetModule],
    overrides: [{ provide: ExchangeRatesService, useValue: { getRates } }],
  });
  mcp = t.get(BudgetItemsMcp);
  orm = await createTestOrm(db);
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  getRates.mockReset();
  getRates.mockResolvedValue(null);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

/**
 * A euro trip of two: a dinner on a place the two split evenly, paid by the
 * owner, of which the guest paid their share back; and a museum booking in
 * dollars at a frozen rate, split unevenly and paid by the guest. A third user
 * cannot open the trip.
 */
async function fixture() {
  const { user: owner } = await makeUser(orm, { username: 'ana' });
  const { user: guest } = await makeUser(orm, { username: 'ben' });
  const { user: outsider } = await makeUser(orm);
  const trip = await makeTrip(orm, owner.id, { title: 'Lisbon', currency: 'EUR' });
  await addTripMember(orm, trip.id, guest.id);
  const place = await makePlace(orm, trip.id, { name: 'Time Out Market' });
  const booking = await makeReservation(orm, trip.id, { title: 'Gulbenkian', type: 'activity' });
  const dinner = await makeBudgetItem(orm, trip.id, {
    name: 'Dinner',
    category: 'food',
    total_price: 90,
    place: place.id,
    expense_date: '2026-05-02',
    note: 'Window table,\n  tip included',
    sort_order: 1,
  });
  await addBudgetItemMember(orm, dinner.id, owner.id, { paid: 1 });
  await addBudgetItemMember(orm, dinner.id, guest.id, { paid: 1 });
  await addBudgetItemPayer(orm, dinner.id, owner.id, 90);
  // 1.25 dollars to the euro, frozen when it was booked: 50 USD is 40 EUR.
  const museum = await makeBudgetItem(orm, trip.id, {
    name: 'Museum',
    category: 'activities',
    total_price: 50,
    currency: 'USD',
    exchange_rate: 1.25,
    reservation: booking.id,
    sort_order: 2,
  });
  await addBudgetItemMember(orm, museum.id, owner.id, { amount: 30 });
  await addBudgetItemMember(orm, museum.id, guest.id, { amount: 20, paid: 1 });
  await addBudgetItemPayer(orm, museum.id, guest.id, 50);
  return { owner, guest, outsider, trip, place, booking, dinner, museum };
}

function toolOptions(method: string) {
  const entry = getEntry(BudgetItemsMcp as unknown as ClassRef, method);
  if (entry?.kind !== 'tool') throw new Error(`${method} is no tool`);
  return entry.options;
}

describe('BudgetItemsMcp surface', () => {
  it.each([
    ['listBudgetItems', 'list_budget_items'],
    ['getBudgetPerPerson', 'get_budget_per_person'],
  ])(
    'BGI-MCP-001: %s is the read-only %s, a budget read under the budget addon, broadcasting nothing',
    async (method, name) => {
      const options = toolOptions(method);
      expect(options.name).toBe(name);
      expect(options.access).toEqual({ group: 'budget', mode: 'read' });
      expect(options.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
      const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled').mockResolvedValue(false);
      expect(await options.when?.(ctx(1), mcp)).toBe(false);
      expect(enabled).toHaveBeenCalledWith(ADDON_IDS.BUDGET);
      enabled.mockResolvedValue(true);
      expect(await options.when?.(ctx(1), mcp)).toBe(true);
    },
  );
});

describe('list_budget_items', () => {
  it('BGI-MCP-010: answers each expense slim, with its links, payers and split, and the totals in the trip currency', async () => {
    const f = await fixture();

    const answer = read(await mcp.listBudgetItems({ tripId: f.trip.id }, ctx(f.guest.id)));

    expect(answer).toEqual({
      currency: 'EUR',
      total: 130,
      by_category: { food: 90, activities: 40 },
      unconverted_item_ids: [],
      item_count: 2,
      offset: 0,
      next_offset: null,
      items: [
        {
          id: f.dinner.id,
          name: 'Dinner',
          category: 'food',
          total_price: 90,
          currency: 'EUR',
          trip_amount: null,
          expense_date: '2026-05-02',
          note: 'Window table, tip included',
          place_id: f.place.id,
          reservation_id: null,
          payers: [{ user_id: f.owner.id, amount: 90 }],
          members: [
            { user_id: f.owner.id, amount: null, paid: true },
            { user_id: f.guest.id, amount: null, paid: true },
          ],
          receipt_count: 0,
        },
        {
          id: f.museum.id,
          name: 'Museum',
          category: 'activities',
          total_price: 50,
          currency: 'USD',
          // 50 USD at the 1.25 frozen when it was booked.
          trip_amount: 40,
          expense_date: null,
          note: null,
          place_id: null,
          reservation_id: f.booking.id,
          payers: [{ user_id: f.guest.id, amount: 50 }],
          members: [
            { user_id: f.owner.id, amount: 30, paid: false },
            { user_id: f.guest.id, amount: 20, paid: true },
          ],
          receipt_count: 0,
        },
      ],
      people: [
        { user_id: f.owner.id, username: 'ana' },
        { user_id: f.guest.id, username: 'ben' },
      ],
    });
    // Both rows carry a rate of their own, so the totals never asked for today's.
    expect(getRates).not.toHaveBeenCalled();
    // No avatars, receipts or itemised tickets: the REST row's bulk stays behind.
    expect(JSON.stringify(answer)).not.toMatch(/avatar|receipts|ticket_json/);
  });

  it('BGI-MCP-011: pages through a long budget while the totals keep covering all of it', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { currency: 'eur' });
    const ids = await insertRows(
      orm,
      BudgetItems,
      [10, 20, 30].map((price, i) => ({ trip: trip.id, name: `Taxi ${i + 1}`, total_price: price, sort_order: i })),
    );

    const first = read(await mcp.listBudgetItems({ tripId: trip.id, limit: 2 }, ctx(user.id)));
    expect(first).toMatchObject({ currency: 'EUR', total: 60, item_count: 3, offset: 0, next_offset: 2 });
    expect(first.items.map((item: { id: number }) => item.id)).toEqual(ids.slice(0, 2));
    // A row without a currency is in the trip's, and says so.
    expect(first.items[0]).toMatchObject({ currency: 'EUR', payers: [], members: [] });
    expect(first.people).toEqual([]);

    const last = read(await mcp.listBudgetItems({ tripId: trip.id, offset: 2, limit: 2 }, ctx(user.id)));
    expect(last).toMatchObject({ total: 60, item_count: 3, offset: 2, next_offset: null });
    expect(last.items.map((item: { id: number }) => item.id)).toEqual([ids[2]]);

    const beyond = read(await mcp.listBudgetItems({ tripId: trip.id, offset: 5 }, ctx(user.id)));
    expect(beyond).toMatchObject({ item_count: 3, offset: 5, next_offset: null, items: [] });
  });

  it('BGI-MCP-012: a default page holds 50 expenses and points at the next one', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await insertRows(
      orm,
      BudgetItems,
      Array.from({ length: 51 }, (_, i) => ({ trip: trip.id, name: `Coffee ${i}`, total_price: 2, sort_order: i })),
    );

    const page = read(await mcp.listBudgetItems({ tripId: trip.id }, ctx(user.id)));
    expect(page.items).toHaveLength(50);
    expect(page).toMatchObject({ item_count: 51, next_offset: 50, total: 102 });
  });

  it('BGI-MCP-013: a foreign expense no rate converts is named and left out of every total', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { currency: 'EUR' });
    await makeBudgetItem(orm, trip.id, { name: 'Hotel', category: 'accommodation', total_price: 200, sort_order: 1 });
    // Rate 1 on a foreign row: never frozen, and the server has no quote today.
    const pho = await makeBudgetItem(orm, trip.id, {
      name: 'Pho',
      category: 'food',
      total_price: 120_000,
      currency: 'VND',
      exchange_rate: 1,
      sort_order: 2,
    });

    const answer = read(await mcp.listBudgetItems({ tripId: trip.id }, ctx(user.id)));
    expect(answer).toMatchObject({ total: 200, by_category: { accommodation: 200 }, unconverted_item_ids: [pho.id] });
    expect(getRates).toHaveBeenCalledWith('EUR');
    // Nothing converts it, so it names no amount in the trip currency either.
    expect(answer.items.find((item: { id: number }) => item.id === pho.id)).toMatchObject({ trip_amount: null });
  });

  it('BGI-MCP-014: someone who cannot open the trip gets the trip refusal and no row', async () => {
    const f = await fixture();
    const list = vi.spyOn(t.get(BudgetService), 'listBudgetItems');

    const refused = read(await mcp.listBudgetItems({ tripId: f.trip.id }, ctx(f.outsider.id)));

    expect(refused).toEqual({ error: 'Trip not found or access denied.' });
    expect(list).not.toHaveBeenCalled();
  });

  it('BGI-MCP-015: an expense handed over without its split or payers reads as shared by nobody', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const bare: BudgetItem = { id: 7, trip_id: trip.id, category: 'other', name: 'Tip', total_price: 5, sort_order: 0 };
    vi.spyOn(t.get(BudgetService), 'listBudgetItems').mockResolvedValue([bare]);

    const answer = read(await mcp.listBudgetItems({ tripId: trip.id }, ctx(user.id)));

    expect(answer.items).toEqual([
      expect.objectContaining({ id: 7, place_id: null, reservation_id: null, payers: [], members: [] }),
    ]);
    expect(answer.people).toEqual([]);
  });

  it('BGI-MCP-019: a foreign expense says what it comes to in the trip currency, and every expense how many receipts it has', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { currency: 'EUR' });
    const receipt = { filename: 'r.pdf', original_name: 'r.pdf', file_size: 1, mime_type: 'application/pdf' };
    const items: BudgetItem[] = [
      {
        id: 8,
        trip_id: trip.id,
        category: 'food',
        name: 'Diner',
        total_price: 30,
        currency: 'USD',
        exchange_rate: 1.2,
        sort_order: 0,
        receipts: [
          { id: 1, url: '/a', ...receipt },
          { id: 2, url: '/b', ...receipt },
        ],
      },
      { id: 9, trip_id: trip.id, category: 'food', name: 'Bakery', total_price: 4, currency: 'eur', sort_order: 1 },
    ];
    vi.spyOn(t.get(BudgetService), 'listBudgetItems').mockResolvedValue(items);

    const answer = read(await mcp.listBudgetItems({ tripId: trip.id }, ctx(user.id)));

    // 30 USD at the 1.2 frozen when it was booked; a lower-case trip currency is the trip's own.
    expect(answer.items).toEqual([
      expect.objectContaining({ id: 8, currency: 'USD', trip_amount: 25, receipt_count: 2 }),
      expect.objectContaining({ id: 9, trip_amount: null, receipt_count: 0 }),
    ]);
    // A count, never the files: no receipt name or link reaches the model.
    expect(JSON.stringify(answer)).not.toMatch(/r\.pdf|receipts/);
  });

  it('BGI-MCP-016: a page of long expenses ends before the assistant cuts the answer, and next_offset starts at the first one it left out', async () => {
    const { user } = await makeUser(orm, { username: 'organiser' });
    const trip = await makeTrip(orm, user.id, { currency: 'EUR' });
    const others = await Promise.all(
      Array.from({ length: 4 }, (_, i) => makeUser(orm, { username: `traveller-${i}` })),
    );
    const travellers = [user.id, ...others.map((other) => other.user.id)];
    const name = (i: number) => `Dinner ${i} ${'at the long table by the harbour, '.repeat(6)}`;
    const ids = await insertRows(
      orm,
      BudgetItems,
      Array.from({ length: 100 }, (_, i) => ({ trip: trip.id, name: name(i), total_price: 50, sort_order: i })),
    );
    await insertRows(
      orm,
      BudgetItemMembers,
      ids.flatMap((id) => travellers.map((traveller) => ({ budgetItem: id, user: traveller, amount: 10 }))),
    );

    /** Every page from `offset` on, each checked as the provider would get it. */
    const pagesFrom = async (offset: number): Promise<number[][]> => {
      const answer = read(await mcp.listBudgetItems({ tripId: trip.id, offset, limit: 100 }, ctx(user.id)));
      // What the provider gets is the page whole: nothing cut, nothing the model would never see.
      expect(toolOutputForProvider('list_budget_items', answer)).toEqual(answer);
      const page: number[] = answer.items.map((item: { id: number }) => item.id);
      if (answer.next_offset === null) return [page];
      expect(answer.next_offset).toBe(offset + page.length);
      return [page, ...(await pagesFrom(answer.next_offset))];
    };
    const pages = await pagesFrom(0);

    // Asked for all hundred at once, the expenses came in more than one page and none was skipped.
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flat()).toEqual(ids);
  });

  it('BGI-MCP-017: one expense longer than a page on its own still makes a page, so the list never stalls', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const ids = await insertRows(orm, BudgetItems, [
      { trip: trip.id, name: 'Charter '.repeat(5_000), total_price: 900, sort_order: 0 },
      { trip: trip.id, name: 'Fuel', total_price: 80, sort_order: 1 },
    ]);

    const first = read(await mcp.listBudgetItems({ tripId: trip.id }, ctx(user.id)));
    expect(first.items.map((item: { id: number }) => item.id)).toEqual([ids[0]]);
    expect(first.next_offset).toBe(1);
    const second = read(await mcp.listBudgetItems({ tripId: trip.id, offset: 1 }, ctx(user.id)));
    expect(second).toMatchObject({ next_offset: null, items: [expect.objectContaining({ id: ids[1] })] });
  });

  it('BGI-MCP-018: a long note keeps its start on one line, and a trip without a currency reads in euros', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { currency: null });
    await makeBudgetItem(orm, trip.id, { name: 'Ferry', total_price: 30, note: `Deck seats\n${'x'.repeat(400)}` });

    const answer = read(await mcp.listBudgetItems({ tripId: trip.id }, ctx(user.id)));

    expect(answer).toMatchObject({ currency: 'EUR', total: 30, items: [{ currency: 'EUR' }] });
    const note: string = answer.items[0].note;
    expect(note).toHaveLength(200);
    expect(note.startsWith('Deck seats xxx')).toBe(true);
    expect(note.endsWith('…')).toBe(true);
  });
});

describe('get_budget_per_person', () => {
  it('BGI-MCP-020: answers the shares in the trip currency, as the REST route does', async () => {
    const f = await fixture();

    const answer = read(await mcp.getBudgetPerPerson({ tripId: f.trip.id }, ctx(f.owner.id)));

    expect(answer).toEqual({ summary: await t.get(BudgetService).perPersonSummary(f.trip.id) });
    // Ana: 45 of the dinner, paid, and 30 USD of the museum at 1.25, not paid.
    // Ben: 45 of the dinner, paid, and 20 USD of the museum at 1.25, paid.
    expect(answer.summary).toEqual([
      expect.objectContaining({
        user_id: f.owner.id,
        total_assigned: 69,
        total_paid: 45,
        items_count: 2,
        currency: 'EUR',
      }),
      expect.objectContaining({
        user_id: f.guest.id,
        total_assigned: 61,
        total_paid: 61,
        items_count: 2,
        currency: 'EUR',
      }),
    ]);
  });

  it('BGI-MCP-021: someone who cannot open the trip gets the trip refusal', async () => {
    const f = await fixture();
    const summary = vi.spyOn(t.get(BudgetService), 'perPersonSummary');

    expect(read(await mcp.getBudgetPerPerson({ tripId: f.trip.id }, ctx(f.outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
    expect(summary).not.toHaveBeenCalled();
  });
});
