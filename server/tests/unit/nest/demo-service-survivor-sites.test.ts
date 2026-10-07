/**
 * Plan 3i Task 3 — named regression tests for 4 of the 5 `isDemoUserId`
 * survivor sites (the 5th, `PluginMcpToolsService`, is MCPTOOLS-014 in
 * `tests/unit/plugins/plugin-mcp-tools.test.ts`, strengthened in this same
 * task to assert the exact refusal body too).
 *
 * Each of `TripInviteMcp`/`FeedsMcp`/`CategoriesMcp`/`BudgetMcp` checks
 * `this.isDemoUser(ctx.userId)` — now `this.demo.isDemoUserId(userId)`,
 * the injected `DemoService` (`common/demo.service.ts`) — as the FIRST
 * statement of the write tool exercised below, before touching any other
 * collaborator, so every other constructor dependency can stay an untyped
 * stub: the mutation this proves (Task 3's report: "mutation proofs for the
 * demo gates — loosen isDemoUserId → red") is that a `DemoService` whose
 * `isDemoUserId` resolves `true` reaches the exact canned `demoDenied()`
 * body byte-for-byte, not a domain-specific string.
 */
import type { McpContext } from '../../../src/nest-mcp';
import { BudgetMcp } from '../../../src/nest/budget/budget.mcp';
import { CategoriesMcp } from '../../../src/nest/categories/categories.mcp';
import { FeedsMcp } from '../../../src/nest/feeds/feeds.mcp';
import { TripInviteMcp } from '../../../src/nest/trip-invite/trip-invite.mcp';

import { describe, expect, it } from 'vitest';

const DEMO_REFUSAL = {
  content: [{ type: 'text', text: 'Write operations are disabled in demo mode.' }],
  isError: true,
};

const ctx = { userId: 5, scopes: null, isStaticToken: false } as McpContext;

/** A DemoService stub whose isDemoUserId always resolves `true`. */
const demoBlocked = { isDemoUserId: () => Promise.resolve(true) } as never;
const stub = {} as never;

describe('Plan 3i Task 3 — isDemoUserId survivor sites: exact refusal body per domain', () => {
  it('DEMO-SURVIVOR-001 (trip-invite.mcp.ts): create_trip_invite_link refuses byte-for-byte in demo mode', async () => {
    const mcp = new TripInviteMcp(stub, stub, stub, stub, demoBlocked);
    const res = await mcp.createTripInviteLink({ tripId: 1, expires_in_days: null }, ctx);
    expect(res).toEqual(DEMO_REFUSAL);
  });

  it('DEMO-SURVIVOR-002 (feeds.mcp.ts): enable_trip_calendar_feed refuses byte-for-byte in demo mode', async () => {
    const mcp = new FeedsMcp(stub, stub, stub, stub, demoBlocked);
    const res = await mcp.enableTripCalendarFeed({ tripId: 1 }, ctx);
    expect(res).toEqual(DEMO_REFUSAL);
  });

  it('DEMO-SURVIVOR-003 (categories.mcp.ts): create_category refuses byte-for-byte in demo mode', async () => {
    const mcp = new CategoriesMcp(stub, stub, stub, demoBlocked);
    const res = await mcp.createCategory({ name: 'Test' }, ctx);
    expect(res).toEqual(DEMO_REFUSAL);
  });

  it('DEMO-SURVIVOR-004 (budget.mcp.ts): create_budget_item refuses byte-for-byte in demo mode', async () => {
    const mcp = new BudgetMcp(stub, stub, stub, stub, stub, stub, stub, stub, stub, demoBlocked, stub);
    const res = await mcp.createBudgetItem({ tripId: 1, name: 'Test', total_price: 10 }, ctx);
    expect(res).toEqual(DEMO_REFUSAL);
  });
});
