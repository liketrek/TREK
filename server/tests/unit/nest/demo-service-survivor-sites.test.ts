/**
 * The demo refusal for the four write tools that used to ask DemoService
 * themselves (trip invites, calendar feeds, categories, budget). The check now
 * sits in the registry's tool gate (trekDemoToolGate), so each tool is called
 * the way a session reaches it, through tests/helpers/mcp-gate.ts, with every
 * other collaborator a bare stub: a refusal that reached any of them would
 * throw instead. The fifth site, PluginMcpToolsService, keeps its own gate and
 * is MCPTOOLS-014 in tests/unit/plugins/plugin-mcp-tools.test.ts.
 */
import { describe, expect, it } from 'vitest';
import type { McpContext } from '../../../src/nest-mcp';
import { callGatedTool } from '../../helpers/mcp-gate';
import { TripInviteMcp } from '../../../src/nest/trip-invite/trip-invite.mcp';
import { FeedsMcp } from '../../../src/nest/feeds/feeds.mcp';
import { CategoriesMcp } from '../../../src/nest/categories/categories.mcp';
import { BudgetMcp } from '../../../src/nest/budget/budget.mcp';

const DEMO_REFUSAL = { content: [{ type: 'text', text: 'Write operations are disabled in demo mode.' }], isError: true };

const ctx = { userId: 5, scopes: null, isStaticToken: false } as McpContext;

/** The demo check, answering yes for everyone. */
const demoBlocked = () => Promise.resolve(true);
const stub = {} as never;

describe('demo refusal at the former survivor sites: exact refusal body per domain', () => {
  it('DEMO-SURVIVOR-001 (trip-invite.mcp.ts): create_trip_invite_link refuses byte-for-byte in demo mode', async () => {
    const mcp = new TripInviteMcp(stub, stub, stub, stub);
    const res = await callGatedTool(mcp, 'createTripInviteLink', { tripId: 1, expires_in_days: null }, ctx, demoBlocked);
    expect(res).toEqual(DEMO_REFUSAL);
  });

  it('DEMO-SURVIVOR-002 (feeds.mcp.ts): enable_trip_calendar_feed refuses byte-for-byte in demo mode', async () => {
    const mcp = new FeedsMcp(stub, stub, stub, stub);
    const res = await callGatedTool(mcp, 'enableTripCalendarFeed', { tripId: 1 }, ctx, demoBlocked);
    expect(res).toEqual(DEMO_REFUSAL);
  });

  it('DEMO-SURVIVOR-003 (categories.mcp.ts): create_category refuses byte-for-byte in demo mode', async () => {
    const mcp = new CategoriesMcp(stub, stub, stub);
    const res = await callGatedTool(mcp, 'createCategory', { name: 'Test' }, ctx, demoBlocked);
    expect(res).toEqual(DEMO_REFUSAL);
  });

  it('DEMO-SURVIVOR-004 (budget.mcp.ts): create_budget_item refuses byte-for-byte in demo mode', async () => {
    const mcp = new BudgetMcp(stub, stub, stub, stub, stub, stub, stub, stub, stub, stub);
    const res = await callGatedTool(mcp, 'createBudgetItem', { tripId: 1, name: 'Test', total_price: 10 }, ctx, demoBlocked);
    expect(res).toEqual(DEMO_REFUSAL);
  });
});
