import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { updateRows } from '../../helpers/factories/rows';
import { addTripMember } from '../../helpers/factories/trips';
import type { CaseGroup, Scene } from './types';
import { MikroORM } from '@mikro-orm/core';

import { vi } from 'vitest';

const TEMPLATES = "packing templates are the admin's global list: no trip room, and no screen shows them live";

const budget = (s: Scene, rest = '') => `/api/trips/${s.trip.id}/budget${rest}`;
const packing = (s: Scene, rest = '') => `/api/trips/${s.trip.id}/packing${rest}`;
const todo = (s: Scene, rest = '') => `/api/trips/${s.trip.id}/todo${rest}`;

/** The weight of every bag may have moved: every socket re-reads the totals, the writing one too. */
const BAG_TOTALS = { event: 'packing:bag-totals', all: true } as const;

/** A settle-up payment from the member to the owner, as both surfaces take it. */
const payment = (s: Scene, amount: number) => ({ from_user_id: s.member.id, to_user_id: s.owner.id, amount });

/** Money and lists: the budget with its settlements, packing and to-dos. */
export const money: CaseGroup = {
  name: 'money',
  prefix: 'BCP-MONEY',
  cases: [
    // ── budget ────────────────────────────────────────────────────────────────
    {
      tool: 'create_budget_item',
      args: (s) => ({ tripId: s.trip.id, name: `Dinner ${s.n}`, total_price: 60 }),
      rest: { method: 'post', path: (s) => budget(s), body: (s) => ({ name: `Dinner ${s.n}`, total_price: 60 }) },
      expect: ['budget:created'],
    },
    {
      tool: 'update_budget_item',
      needs: ['budgetItem'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.budgetItem.id, name: `Lunch ${s.n}` }),
      rest: {
        method: 'put',
        path: (s) => budget(s, `/${s.budgetItem.id}`),
        body: (s) => ({ name: `Lunch ${s.n}` }),
      },
      expect: ['budget:updated'],
    },
    {
      tool: 'delete_budget_item',
      needs: ['budgetItem'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.budgetItem.id }),
      rest: { method: 'delete', path: (s) => budget(s, `/${s.budgetItem.id}`) },
      expect: ['budget:deleted'],
    },
    {
      // The same write as POST /budget with member_ids, through the same use case:
      // the item already carries its split, so no members-updated follows (G18).
      tool: 'create_budget_item_with_members',
      needs: ['member'],
      args: (s) => ({ tripId: s.trip.id, name: `Taxi ${s.n}`, total_price: 40, userIds: [s.owner.id, s.member.id] }),
      rest: {
        method: 'post',
        path: (s) => budget(s),
        body: (s) => ({ name: `Taxi ${s.n}`, total_price: 40, member_ids: [s.owner.id, s.member.id] }),
      },
      expect: ['budget:created'],
    },
    {
      tool: 'set_budget_item_members',
      needs: ['budgetItem'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.budgetItem.id, userIds: [s.owner.id] }),
      rest: {
        method: 'put',
        path: (s) => budget(s, `/${s.budgetItem.id}/members`),
        body: (s) => ({ user_ids: [s.owner.id] }),
      },
      expect: ['budget:members-updated'],
    },
    {
      tool: 'toggle_budget_member_paid',
      needs: ['budgetItem'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.budgetItem.id, memberId: s.member.id, paid: true }),
      rest: {
        method: 'put',
        path: (s) => budget(s, `/${s.budgetItem.id}/members/${s.member.id}/paid`),
        body: () => ({ paid: true }),
      },
      expect: ['budget:member-paid-updated'],
    },
    {
      tool: 'create_settlement',
      needs: ['member'],
      args: (s) => ({ tripId: s.trip.id, ...payment(s, 20) }),
      rest: { method: 'post', path: (s) => budget(s, '/settlements'), body: (s) => payment(s, 20) },
      expect: ['budget:settlement-created'],
    },
    {
      tool: 'update_settlement',
      needs: ['settlement'],
      args: (s) => ({ tripId: s.trip.id, settlementId: s.settlement.id, ...payment(s, 25) }),
      rest: {
        method: 'put',
        path: (s) => budget(s, `/settlements/${s.settlement.id}`),
        body: (s) => payment(s, 25),
      },
      expect: ['budget:settlement-updated'],
    },
    {
      tool: 'delete_settlement',
      needs: ['settlement'],
      args: (s) => ({ tripId: s.trip.id, settlementId: s.settlement.id }),
      rest: { method: 'delete', path: (s) => budget(s, `/settlements/${s.settlement.id}`) },
      expect: ['budget:settlement-deleted'],
    },
    {
      // The expense in dollars has no rate frozen yet (1 reads as unfrozen); the
      // server's quote is stubbed, so freezing it is the one change to announce.
      tool: 'freeze_budget_rates',
      needs: ['budgetItem'],
      setup: async (s, app) => {
        await updateRows(
          app.get(MikroORM),
          BudgetItems,
          { id: s.budgetItem.id },
          { currency: 'USD', exchange_rate: 1 },
        );
      },
      stub: (app) => {
        const rates = vi.spyOn(app.get(ExchangeRatesService), 'getRates').mockResolvedValue({ USD: 1.1 });
        return () => rates.mockRestore();
      },
      args: (s) => ({ tripId: s.trip.id }),
      rest: { method: 'post', path: (s) => budget(s, '/freeze-rates'), body: () => ({}) },
      expect: ['budget:updated'],
    },

    // ── packing ───────────────────────────────────────────────────────────────
    {
      tool: 'create_packing_item',
      args: (s) => ({ tripId: s.trip.id, name: `Socks ${s.n}` }),
      rest: { method: 'post', path: (s) => packing(s), body: (s) => ({ name: `Socks ${s.n}` }) },
      expect: ['packing:created', BAG_TOTALS],
    },
    {
      // Ticking an item off moves no weight, so no bag-totals ping (#2191).
      tool: 'toggle_packing_item',
      needs: ['packingItem'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.packingItem.id, checked: true }),
      rest: { method: 'put', path: (s) => packing(s, `/${s.packingItem.id}`), body: () => ({ checked: true }) },
      expect: ['packing:updated'],
    },
    {
      tool: 'update_packing_item',
      needs: ['packingItem'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.packingItem.id, name: `Wool socks ${s.n}` }),
      rest: {
        method: 'put',
        path: (s) => packing(s, `/${s.packingItem.id}`),
        body: (s) => ({ name: `Wool socks ${s.n}` }),
      },
      expect: ['packing:updated'],
    },
    {
      tool: 'delete_packing_item',
      needs: ['packingItem'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.packingItem.id }),
      rest: { method: 'delete', path: (s) => packing(s, `/${s.packingItem.id}`) },
      expect: ['packing:deleted', BAG_TOTALS],
    },
    {
      // Off the whole room's screens, then back to whoever may see it now: the
      // writer alone for a personal item. Visibility moves no weight, so the
      // bag-totals ping the tool used to add is gone (G18).
      tool: 'set_packing_item_sharing',
      needs: ['packingItem'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.packingItem.id, visibility: 'personal' }),
      rest: {
        method: 'put',
        path: (s) => packing(s, `/${s.packingItem.id}/sharing`),
        body: () => ({ visibility: 'personal' }),
      },
      expect: ['packing:deleted', { event: 'packing:created', only: 'viewers' }],
    },
    {
      // The route used to save the order and tell nobody (G14).
      tool: 'reorder_packing_items',
      needs: ['packingItem'],
      args: (s) => ({ tripId: s.trip.id, orderedIds: [s.packingItem.id] }),
      rest: { method: 'put', path: (s) => packing(s, '/reorder'), body: (s) => ({ orderedIds: [s.packingItem.id] }) },
      expect: ['packing:reordered'],
    },
    {
      tool: 'bulk_import_packing',
      args: (s) => ({ tripId: s.trip.id, items: [{ name: `Tent ${s.n}` }] }),
      rest: { method: 'post', path: (s) => packing(s, '/import'), body: (s) => ({ items: [{ name: `Tent ${s.n}` }] }) },
      expect: ['packing:created', BAG_TOTALS],
    },
    {
      tool: 'create_packing_bag',
      args: (s) => ({ tripId: s.trip.id, name: `Carry-on ${s.n}` }),
      rest: { method: 'post', path: (s) => packing(s, '/bags'), body: (s) => ({ name: `Carry-on ${s.n}` }) },
      expect: ['packing:bag-created'],
    },
    {
      tool: 'update_packing_bag',
      needs: ['bag'],
      args: (s) => ({ tripId: s.trip.id, bagId: s.bag.id, name: `Duffel ${s.n}` }),
      rest: { method: 'put', path: (s) => packing(s, `/bags/${s.bag.id}`), body: (s) => ({ name: `Duffel ${s.n}` }) },
      expect: ['packing:bag-updated'],
    },
    {
      // Its items fall into the unassigned pile, so the totals move too. The G17
      // refusal (a bag from another trip sends nothing) is proven by PACK-LIST-004
      // and the delete_packing_bag test in tools-packing-advanced, not here.
      tool: 'delete_packing_bag',
      needs: ['bag'],
      args: (s) => ({ tripId: s.trip.id, bagId: s.bag.id }),
      rest: { method: 'delete', path: (s) => packing(s, `/bags/${s.bag.id}`) },
      expect: ['packing:bag-deleted', BAG_TOTALS],
    },
    {
      tool: 'set_bag_members',
      needs: ['bag', 'member'],
      args: (s) => ({ tripId: s.trip.id, bagId: s.bag.id, userIds: [s.member.id] }),
      rest: {
        method: 'put',
        path: (s) => packing(s, `/bags/${s.bag.id}/members`),
        body: (s) => ({ user_ids: [s.member.id] }),
      },
      expect: ['packing:bag-members-updated'],
    },
    {
      // The tagged member hears of it on both surfaces; the MCP tool used to tell
      // nobody (G23). The notification is sent without waiting on it, so it is
      // read one macrotask after the write answered.
      tool: 'set_packing_category_assignees',
      needs: ['member'],
      args: (s) => ({ tripId: s.trip.id, categoryName: 'Clothes', userIds: [s.member.id] }),
      rest: {
        method: 'put',
        path: (s) => packing(s, '/category-assignees/Clothes'),
        body: (s) => ({ user_ids: [s.member.id] }),
      },
      settle: true,
      expect: ['packing:assignees', { event: 'notification:new', user: 'others' }],
    },
    {
      // Applied as the writer's own items, which reach the writer alone: the MCP
      // tool takes the visibility the route has taken since #1565 (G9).
      tool: 'apply_packing_template',
      needs: ['template'],
      args: (s) => ({ tripId: s.trip.id, templateId: s.template.id, visibility: 'personal' }),
      rest: {
        method: 'post',
        path: (s) => packing(s, `/apply-template/${s.template.id}`),
        body: () => ({ visibility: 'personal' }),
      },
      expect: [{ event: 'packing:template-applied', only: 'actor' }, BAG_TOTALS],
    },

    // ── to-dos ────────────────────────────────────────────────────────────────
    {
      tool: 'create_todo',
      args: (s) => ({ tripId: s.trip.id, name: `Book museum ${s.n}` }),
      rest: { method: 'post', path: (s) => todo(s), body: (s) => ({ name: `Book museum ${s.n}` }) },
      expect: ['todo:created'],
    },
    {
      tool: 'update_todo',
      needs: ['todo'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.todo.id, name: `Book the Louvre ${s.n}` }),
      rest: {
        method: 'put',
        path: (s) => todo(s, `/${s.todo.id}`),
        body: (s) => ({ name: `Book the Louvre ${s.n}` }),
      },
      expect: ['todo:updated'],
    },
    {
      tool: 'toggle_todo',
      needs: ['todo'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.todo.id, checked: true }),
      rest: { method: 'put', path: (s) => todo(s, `/${s.todo.id}`), body: () => ({ checked: true }) },
      expect: ['todo:updated'],
    },
    {
      tool: 'delete_todo',
      needs: ['todo'],
      args: (s) => ({ tripId: s.trip.id, itemId: s.todo.id }),
      rest: { method: 'delete', path: (s) => todo(s, `/${s.todo.id}`) },
      expect: ['todo:deleted'],
    },
    {
      // Both surfaces used to save the order and tell nobody (G16).
      tool: 'reorder_todos',
      needs: ['todo'],
      args: (s) => ({ tripId: s.trip.id, orderedIds: [s.todo.id] }),
      rest: { method: 'put', path: (s) => todo(s, '/reorder'), body: (s) => ({ orderedIds: [s.todo.id] }) },
      expect: ['todo:reordered'],
    },
    {
      tool: 'set_todo_category_assignees',
      needs: ['member'],
      args: (s) => ({ tripId: s.trip.id, categoryName: 'Booking', userIds: [s.member.id] }),
      rest: {
        method: 'put',
        path: (s) => todo(s, '/category-assignees/Booking'),
        body: (s) => ({ user_ids: [s.member.id] }),
      },
      expect: ['todo:assignees'],
    },
  ],
  exempt: [
    {
      tool: 'save_packing_template',
      reason: TEMPLATES,
      actor: 'admin',
      needs: ['packingItem'],
      // Saving reads a trip's list, so the admin travels along on this one.
      setup: (s, app) => addTripMember(app.get(MikroORM), s.trip.id, s.admin.id, s.owner.id),
      args: (s) => ({ tripId: s.trip.id, templateName: `Beach ${s.n}` }),
    },
    {
      tool: 'delete_packing_template',
      reason: TEMPLATES,
      actor: 'admin',
      needs: ['template'],
      args: (s) => ({ templateId: s.template.id }),
    },
  ],
};
