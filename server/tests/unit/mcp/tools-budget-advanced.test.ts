/**
 * Unit tests for MCP budget advanced tools:
 * set_budget_item_members, toggle_budget_member_paid.
 * Resources: trek://trips/{tripId}/budget/per-person, trek://trips/{tripId}/budget/settlement.
 */
import { BudgetItemMembers } from '../../../src/db/entities/BudgetItemMembers.entity';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { BudgetSettlements } from '../../../src/db/entities/BudgetSettlements.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import type { TripAccess } from '../../../src/db/repositories/Trips.repository';
import { BudgetController } from '../../../src/nest/budget/budget.controller';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { withRequestContext } from '../../../src/nest/database/request-context';
import type { User } from '../../../src/types';
import { makeBudgetItem, addBudgetItemMember, addBudgetItemPayer } from '../../helpers/factories/budget';
import { countRows, updateRows } from '../../helpers/factories/rows';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetDatabase } from '../../helpers/reset-database';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;

beforeEach(async () => {
  await resetDatabase(orm);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
  // get_settlement_summary calls getRates(), which is a real fetch to
  // api.frankfurter.dev with a 10 s abort. One case used to stub this inline;
  // hoisted so a second settlement case cannot quietly reintroduce the call.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('offline');
    }),
  );
});

// The booted container's own ORM, the one the tools write through.
let orm: MikroORM;

beforeAll(async () => {
  orm = (await bootTestApp(realtime)).get(MikroORM);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await (await bootTestApp(realtime)).close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

async function withResourceHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: true });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

describe('booked FX through MCP', () => {
  it('persists a manual 1:1 rate and actor provenance on an expense and a payment', async () => {
    const { user } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await addTripMember(orm, trip.id, member.id);
    await withHarness(user.id, async (h) => {
      const rate = { currency: 'CAD', exchange_rate: 1, exchange_rate_note: 'Agreed rate' };
      const expense = parseToolResult(
        await h.client.callTool({
          name: 'create_budget_item',
          arguments: { tripId: trip.id, name: 'CAD expense', total_price: 30, ...rate },
        }),
      );
      const payment = parseToolResult(
        await h.client.callTool({
          name: 'create_settlement',
          arguments: { tripId: trip.id, from_user_id: user.id, to_user_id: member.id, amount: 10, ...rate },
        }),
      );
      const provenance = {
        ...rate,
        exchange_rate_source: 'explicit',
        exchange_rate_set_by_user_id: user.id,
      };
      expect(expense).toMatchObject({ item: provenance });
      expect(payment).toMatchObject({ settlement: provenance });
    });
  });
});

// ---------------------------------------------------------------------------
// set_budget_item_members
// ---------------------------------------------------------------------------

describe('Tool: set_budget_item_members', () => {
  it('sets members and returns a hydrated item with members/payers', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id, { name: 'Flights', total_price: 500 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_budget_item_members',
        arguments: { tripId: trip.id, itemId: item.id, userIds: [user.id] },
      });
      const data = parseToolResult(result) as any;
      // Regression: returns a hydrated item, not the raw row from updateMembers.
      expect(data.item.members.map((m: any) => m.user_id)).toEqual([user.id]);
      expect(Array.isArray(data.item.payers)).toBe(true);
      // Quirk fix: the broadcast carries the REST payload shape (the legacy
      // MCP-specific { item } shape was a silent no-op in the client handler).
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'budget:members-updated',
        expect.objectContaining({
          itemId: item.id,
          members: expect.arrayContaining([expect.objectContaining({ user_id: user.id })]),
          persons: 1,
        }),
      );
    });
  });

  it('returns an error for an item not in the trip', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_budget_item_members',
        arguments: { tripId: trip.id, itemId: 99999, userIds: [user.id] },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('empty array clears members', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id);
    await addBudgetItemMember(orm, item.id, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_budget_item_members',
        arguments: { tripId: trip.id, itemId: item.id, userIds: [] },
      });
      const data = parseToolResult(result) as any;
      expect(data.item).toBeDefined();
      expect(await countRows(orm, BudgetItemMembers, { budgetItem: item.id })).toBe(0);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const item = await makeBudgetItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_budget_item_members',
        arguments: { tripId: trip.id, itemId: item.id, userIds: [] },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = await makeUser(orm, { email: 'demo@nomad.app' });
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_budget_item_members',
        arguments: { tripId: trip.id, itemId: item.id, userIds: [] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// create_budget_item_with_members
// ---------------------------------------------------------------------------

describe('Tool: create_budget_item_with_members', () => {
  it('assigns the given members and returns a hydrated item', async () => {
    const { user } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await addTripMember(orm, trip.id, member.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item_with_members',
        arguments: { tripId: trip.id, name: 'Villa', total_price: 800, userIds: [user.id, member.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.members.map((m: any) => m.user_id).sort()).toEqual([user.id, member.id].sort());
      expect(data.item.persons).toBe(2);
      // What POST /budget sends for the same write: budget:created alone, its item
      // already carrying the split (the members-updated that followed is gone).
      expect(broadcastMock.mock.calls).toEqual([[trip.id, 'budget:created', { item: data.item, _source: 'mcp' }]]);
    });
  });

  it('refuses a trip the caller cannot see with the trip gate, and sends nothing', async () => {
    const { user } = await makeUser(orm);
    const { user: owner } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item_with_members',
        arguments: { tripId: trip.id, name: 'Villa', total_price: 800 },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toBe('Trip not found or access denied.');
      expect(broadcastMock).not.toHaveBeenCalled();
    });
  });

  // Regression: omitting userIds previously produced an empty-member (unsaveable) entity.
  it('defaults to all trip members when userIds omitted', async () => {
    const { user } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await addTripMember(orm, trip.id, member.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item_with_members',
        arguments: { tripId: trip.id, name: 'Shared cab', total_price: 50 },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.members.map((m: any) => m.user_id).sort()).toEqual([user.id, member.id].sort());
      expect(data.item.members.length).toBeGreaterThan(0);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = await makeUser(orm, { email: 'demo@nomad.app' });
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item_with_members',
        arguments: { tripId: trip.id, name: 'X', total_price: 1 },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// toggle_budget_member_paid
// ---------------------------------------------------------------------------

describe('Tool: toggle_budget_member_paid', () => {
  it('flips paid flag and broadcasts', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const item = await makeBudgetItem(orm, trip.id, { total_price: 200 });
    // Add member first
    await addBudgetItemMember(orm, item.id, user.id, { paid: 0 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_budget_member_paid',
        arguments: { tripId: trip.id, itemId: item.id, memberId: user.id, paid: true },
      });
      const data = parseToolResult(result) as any;
      expect(data.member).toBeDefined();
      // Quirk fix: the broadcast carries the REST payload shape (the legacy
      // MCP-specific { itemId, member } shape was a silent no-op in the client).
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'budget:member-paid-updated',
        expect.objectContaining({ itemId: item.id, userId: user.id, paid: 1 }),
      );
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const item = await makeBudgetItem(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_budget_member_paid',
        arguments: { tripId: trip.id, itemId: item.id, memberId: user.id, paid: true },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Settlements (settle-up payments)
// ---------------------------------------------------------------------------

describe('Settlement tools', () => {
  async function tripWithTwo() {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await addTripMember(orm, trip.id, other.id);
    return { user, other, trip };
  }

  /**
   * The REST side of the parity cases below: the container's controller behind
   * GET /budget/settlement, called in a request context of its own as a request
   * would be.
   */
  async function restSettlement(...args: Parameters<BudgetController['settlement']>) {
    const controller = (await bootTestApp(realtime)).get(BudgetController);
    return withRequestContext(orm, () => controller.settlement(...args));
  }

  it('create_settlement records a payment, broadcasts, and is listed', async () => {
    const { user, other, trip } = await tripWithTwo();
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_settlement',
        arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: user.id, amount: 42.5 },
      });
      const cData = parseToolResult(created) as any;
      expect(cData.settlement.from_user_id).toBe(other.id);
      expect(cData.settlement.to_user_id).toBe(user.id);
      expect(cData.settlement.amount).toBe(42.5);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'budget:settlement-created', expect.any(Object));

      const listed = await h.client.callTool({ name: 'list_settlements', arguments: { tripId: trip.id } });
      const lData = parseToolResult(listed) as any;
      expect(lData.settlements).toHaveLength(1);
      expect(lData.settlements[0].id).toBe(cData.settlement.id);
    });
  });

  it('update_settlement changes the amount; delete_settlement removes it', async () => {
    const { user, other, trip } = await tripWithTwo();
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(
        await h.client.callTool({
          name: 'create_settlement',
          arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: user.id, amount: 10 },
        }),
      ) as any;
      const id = created.settlement.id;

      const updated = parseToolResult(
        await h.client.callTool({
          name: 'update_settlement',
          arguments: { tripId: trip.id, settlementId: id, from_user_id: other.id, to_user_id: user.id, amount: 25 },
        }),
      ) as any;
      expect(updated.settlement.amount).toBe(25);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'budget:settlement-updated', expect.any(Object));

      const deleted = parseToolResult(
        await h.client.callTool({
          name: 'delete_settlement',
          arguments: { tripId: trip.id, settlementId: id },
        }),
      ) as any;
      expect(deleted.success).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'budget:settlement-deleted', expect.any(Object));

      expect(await countRows(orm, BudgetSettlements, { trip: trip.id })).toBe(0);
    });
  });

  it('update_settlement returns an error when the settlement is missing', async () => {
    const { user, other, trip } = await tripWithTwo();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_settlement',
        arguments: { tripId: trip.id, settlementId: 99999, from_user_id: other.id, to_user_id: user.id, amount: 5 },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('create_settlement is denied for a non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_settlement',
        arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: other.id, amount: 5 },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('get_settlement_summary agrees with GET /budget/settlement, unpaid expense included (#2225)', async () => {
    // The two surfaces resolve the trip currency and the rates separately before
    // calling calculateSettlement, so the parity that matters is on the payload.
    // The fixture carries the row the fix is about: a total nobody has paid.
    const { user, other, trip } = await tripWithTwo();
    const paid = await makeBudgetItem(orm, trip.id, { total_price: 100 });
    await addBudgetItemMember(orm, paid.id, user.id, { paid: 0 });
    await addBudgetItemMember(orm, paid.id, other.id, { paid: 0 });
    await addBudgetItemPayer(orm, paid.id, user.id, 100);
    const unpaid = await makeBudgetItem(orm, trip.id, { total_price: 40 });
    await addBudgetItemMember(orm, unpaid.id, other.id, { paid: 0 });

    const rest = await restSettlement(
      { id: user.id } as User,
      { id: trip.id, user_id: user.id } as TripAccess,
      String(trip.id),
      {},
    );

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_settlement_summary', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as { summary: typeof rest };
      expect(data.summary.balances).toEqual(rest.balances);
      expect(data.summary.flows).toEqual(rest.flows);
      // Only the paid 100 settles; the 40 nobody paid is outstanding, not owed.
      expect(rest.balances.map((b) => b.balance)).toEqual([50, -50]);
    });
  });

  it("get_settlement_summary reads a same-day bill in the viewer's currency to the cent, like REST (#2525)", async () => {
    // Frankfurter's two quotes for the pair, each rounded, so not exact inverses. The entry
    // rate is frozen from the euro's, and converting back with the dollar's read the
    // 12,345.67 dollars as 12,346.06.
    const quotes: Record<string, Record<string, number>> = {
      EUR: { EUR: 1, USD: 1.1398 },
      USD: { USD: 1, EUR: 0.87732 },
    };
    const spy = vi
      .spyOn(ExchangeRatesService.prototype, 'getRates')
      .mockImplementation(async (b: string) => quotes[b] ?? null);
    try {
      const { user, other, trip } = await tripWithTwo();
      await updateRows(orm, Trips, { id: trip.id }, { currency: 'EUR' });
      const item = await makeBudgetItem(orm, trip.id, { total_price: 12345.67 });
      await updateRows(orm, BudgetItems, { id: item.id }, { currency: 'USD', exchange_rate: 1.1398 });
      await addBudgetItemMember(orm, item.id, user.id, { paid: 0 });
      await addBudgetItemMember(orm, item.id, other.id, { paid: 0 });
      await addBudgetItemPayer(orm, item.id, user.id, 12345.67);

      const rest = await restSettlement(
        { id: user.id } as User,
        { id: trip.id, user_id: user.id, currency: 'EUR' } as TripAccess,
        String(trip.id),
        { base: 'USD' },
      );
      await withHarness(user.id, async (h) => {
        const result = await h.client.callTool({
          name: 'get_settlement_summary',
          arguments: { tripId: trip.id, base: 'USD' },
        });
        const data = parseToolResult(result) as { summary: typeof rest };
        expect(data.summary).toEqual(rest);
        const mine = data.summary.finalBudgets.find((f) => f.user_id === user.id)!;
        expect(mine.expenses).toBe(12345.67);
        expect(mine.sources.fronted).toEqual([{ item_id: item.id, cents: 1234567 }]);
        expect(data.summary.flows).toHaveLength(1);
        expect([6172.83, 6172.84]).toContain(data.summary.flows[0].amount);
      });
    } finally {
      spy.mockRestore();
    }
  });

  it('get_settlement_summary hands out whole won on a won trip, like REST (#2604)', async () => {
    // ₩10,001 for two is 5,000.50 each. A whole won is the smallest amount that can
    // change hands, so that is what both surfaces offer, and an agent booking the
    // flow it was given squares the trip.
    const { user, other, trip } = await tripWithTwo();
    await updateRows(orm, Trips, { id: trip.id }, { currency: 'KRW' });
    const item = await makeBudgetItem(orm, trip.id, { total_price: 10001 });
    await updateRows(orm, BudgetItems, { id: item.id }, { currency: 'KRW' });
    await addBudgetItemMember(orm, item.id, user.id, { paid: 0 });
    await addBudgetItemMember(orm, item.id, other.id, { paid: 0 });
    await addBudgetItemPayer(orm, item.id, user.id, 10001);

    const access = { id: trip.id, user_id: user.id, currency: 'KRW' } as TripAccess;
    const rest = await restSettlement({ id: user.id } as User, access, String(trip.id), {});

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_settlement_summary', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as { summary: typeof rest };
      expect(data.summary).toEqual(rest);
      expect(data.summary.balances.map((b) => b.balance)).toEqual([5001, -5001]);
      expect(data.summary.flows.map((f) => f.amount)).toEqual([5001]);

      await h.client.callTool({
        name: 'create_settlement',
        arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: user.id, amount: 5001, currency: 'KRW' },
      });
      const after = parseToolResult(
        await h.client.callTool({ name: 'get_settlement_summary', arguments: { tripId: trip.id } }),
      ) as { summary: typeof rest };
      expect(after.summary.balances.map((b) => b.balance)).toEqual([0, 0]);
      expect(after.summary.flows).toEqual([]);
    });
  });

  it.each([
    { name: 'trip default', tripRate: 0.02, globalRate: 0.04, expenses: [['JPY', 5000, 1, 'identity']], repayment: 50, basis: 0.02 },
    { name: 'global fallback', tripRate: null, globalRate: 0.02, expenses: [['JPY', 5000, 1, 'identity']], repayment: 50, basis: 0.02 },
    { name: 'different saved rates', tripRate: 0.04, globalRate: 0.05, expenses: [
      ['HKD', 100, 0.02, 'explicit'], ['HKD', 200, 0.04, 'explicit'], ['JPY', 5000, 1, 'identity'],
    ], repayment: 250, basis: 1 / 30 },
  ] as const)('books the selected-currency quote unchanged using $name', async ({
    name, tripRate, globalRate, expenses, repayment, basis,
  }) => {
    const { user, other, trip } = await tripWithTwo();
    await updateRows(orm, Trips, { id: trip.id }, { currency: 'JPY' });
    const rates = (await bootTestApp(realtime)).get(ExchangeRatesService);
    if (tripRate !== null) {
      await withRequestContext(orm, () => rates.setTripExchangeRate(trip.id, 'HKD', tripRate, user.id));
    }
    const global = vi.spyOn(ExchangeRatesService.prototype, 'getRates').mockResolvedValue({ JPY: 1, HKD: globalRate });
    try {
      for (const [currency, amount, exchange_rate, exchange_rate_source] of expenses) {
        const item = await makeBudgetItem(orm, trip.id, { total_price: amount });
        await updateRows(orm, BudgetItems, { id: item.id }, { currency, exchange_rate, exchange_rate_source });
        await addBudgetItemMember(orm, item.id, user.id, { paid: 0 });
        await addBudgetItemMember(orm, item.id, other.id, { paid: 0 });
        await addBudgetItemPayer(orm, item.id, user.id, amount);
      }
      const access = { id: trip.id, user_id: user.id, currency: 'JPY' } as TripAccess;
      const actor = { id: user.id } as User;
      const read = (base: string) => restSettlement(actor, access, String(trip.id), { base });
      const quote = await read('HKD');
      expect(quote.currency).toBe('HKD');
      expect(quote.flows).toHaveLength(1);
      expect(quote.flows[0].amount).toBe(repayment);
      expect(quote.flows[0].exchange_rate).toBeCloseTo(basis);
      expect((await read('JPY')).flows[0].amount).toBeCloseTo(repayment / basis);

      const controller = (await bootTestApp(realtime)).get(BudgetController);
      const refetch = vi.spyOn(ExchangeRatesService.prototype, 'getGlobalRateSnapshot');
      try {
        const save = (amount: number) => withRequestContext(orm, () => controller.createSettlement(actor, String(trip.id), {
          from_user_id: other.id, to_user_id: user.id, amount,
          currency: quote.currency, exchange_rate: quote.flows[0].exchange_rate, rate_base_currency: quote.trip_currency,
        }));
        let remaining = quote.flows[0].amount;
        if (name === 'different saved rates') {
          const partial = await save(100);
          expect(partial.settlement).toMatchObject({ amount: 100, currency: 'HKD' });
          remaining = (await read('HKD')).flows[0].amount;
          expect(remaining).toBe(150);
          expect((await read('JPY')).flows[0].amount).toBe(4500);
        }
        const payment = await save(remaining);
        expect(payment.settlement).toMatchObject({
          amount: remaining, currency: 'HKD', exchange_rate: quote.flows[0].exchange_rate,
        });
        expect(refetch).not.toHaveBeenCalled();
      } finally {
        refetch.mockRestore();
      }
      expect((await read('HKD')).flows).toEqual([]);
      expect((await read('JPY')).flows).toEqual([]);
    } finally {
      global.mockRestore();
    }
  });

  it('refuses a repayment quote from before the trip changed currency', async () => {
    const { user, other, trip } = await tripWithTwo();
    await updateRows(orm, Trips, { id: trip.id }, { currency: 'JPY' });
    const controller = (await bootTestApp(realtime)).get(BudgetController);
    const save = () => controller.createSettlement({ id: user.id } as User, String(trip.id), {
      from_user_id: other.id, to_user_id: user.id, amount: 50,
      currency: 'HKD', exchange_rate: 0.02, rate_base_currency: 'CNY',
    });
    await expect(withRequestContext(orm, save)).rejects.toMatchObject({ status: 409 });
    expect(await countRows(orm, BudgetSettlements, { trip: trip.id })).toBe(0);
  });

  it('get_settlement_summary returns balances and flows', async () => {
    try {
      const { user, other, trip } = await tripWithTwo();
      // user paid 100 for an item split between both → other owes user 50.
      const item = await makeBudgetItem(orm, trip.id, { total_price: 100 });
      await addBudgetItemMember(orm, item.id, user.id, { paid: 0 });
      await addBudgetItemMember(orm, item.id, other.id, { paid: 0 });
      await addBudgetItemPayer(orm, item.id, user.id, 100);
      await withHarness(user.id, async (h) => {
        const result = await h.client.callTool({ name: 'get_settlement_summary', arguments: { tripId: trip.id } });
        const data = parseToolResult(result) as any;
        expect(data.summary).toBeDefined();
        expect(Array.isArray(data.summary.balances)).toBe(true);
        expect(Array.isArray(data.summary.flows)).toBe(true);
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

// ---------------------------------------------------------------------------
// Per-person resource
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/budget/per-person', () => {
  it('returns array for trip with no items', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/budget/per-person` });
      const data = parseResourceResult(result);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/budget/per-person` });
      const data = parseResourceResult(result) as { error?: string };
      expect(data.error).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Settlement resource
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/budget/settlement', () => {
  it('returns settlement object for trip with no items', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/budget/settlement` });
      // The resource may answer with a summary object or a bare array, and the
      // assertion below accepts either, so keep the balances field optional.
      const data = parseResourceResult(result) as { balances?: unknown };
      expect(data).toBeDefined();
      expect(Array.isArray(data.balances) || Array.isArray(data)).toBe(true);
    });
  });
});
