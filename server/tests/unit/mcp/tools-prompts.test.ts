/**
 * Unit tests for MCP prompts: token_auth_notice, trip-summary, packing-list, budget-overview.
 *
 * Every prompt is fetched the way a real client fetches it: over an in-memory
 * transport, with the arguments as the strings the protocol carries
 * (GetPromptRequest.arguments is Record<string, string>). The tripId schemas
 * used to be z.number(), which no client could ever satisfy (#2207); these
 * cases used to sidestep that by calling the callbacks directly.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { db as testDb } from '../../../src/db/database';
import { CAN_ACCESS_TRIP_SQL } from '../../helpers/db-mock';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import { ErrorCode } from '@modelcontextprotocol/sdk/types';


vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

const { isAddonEnabledMock } = vi.hoisted(() => {
  const isAddonEnabledMock = vi.fn().mockReturnValue(true);
  return { isAddonEnabledMock };
});
// Was a module mock over addons.bridge. The `when:` gates read the controller's
// injected AddonsService now, so the toggle goes in through the constructor —
// which is the point of the change: the dependency is in the signature instead
// of behind an import path.
const addonsStub = {
  isAddonEnabled: isAddonEnabledMock,
  getCollabFeatures: () => ({ chat: true, notes: true, links: true, polls: true, whatsnext: true }),
} as unknown as AddonsService;

const { mockGetTripSummary } = vi.hoisted(() => ({
  mockGetTripSummary: vi.fn(),
}));
// The prompts read the summary through the injected read model (readModelStub
// below wraps the same controllable mock) — trips.bridge is deleted.

import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember, createPackingItem, createBudgetItem } from '../../helpers/factories';
import { createTestRegistry } from '../../../src/nest-mcp';
import { trekMcpAccessPolicy, trekMcpValidateAccess } from '../../../src/mcp/nest-mcp-policy';
import { TripsMcp } from '../../../src/nest/trips/trips.mcp';
import { TripPromptsMcp } from '../../../src/nest/trips/trip-prompts.mcp';
import { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import { PackingMcp } from '../../../src/nest/packing/packing.mcp';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { BudgetMcp } from '../../../src/nest/budget/budget.mcp';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { AuthMcp } from '../../../src/nest/auth/auth.mcp';
import { DemoService } from '../../../src/nest/common/demo.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import type { AuthService } from '../../../src/nest/auth/auth.service';
import type { TripsService } from '../../../src/nest/trips/trips.service';
import type { TodoService } from '../../../src/nest/todo/todo.service';
import type { CollabService } from '../../../src/nest/collab/collab.service';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { notificationsStub } from '../../helpers/notifications';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestTripsRepo, createTestTripMembersRepo, createTestUsersRepo, sharedTestOrm, createTestPlacesRepo } from '../../helpers/test-uow';
import { budgetRepoArgs } from '../../helpers/budget-repos';
import {
  createTestPackingItemsRepo,
  createTestPackingItemContributorsRepo,
  createTestPackingBagsRepo,
  createTestPackingCategoryAssigneesRepo,
  createTestPackingTemplatesRepo,
  createTestPackingTemplateCategoriesRepo,
  createTestPackingTemplateItemsRepo,
} from '../../helpers/packing-repos';
import type { EntityManager } from '@mikro-orm/core';

// The trip-summary prompt moved to the DI-discovered TripsMcp — its cases below
// exercise it through a hand-built registry over a stub TripsService whose
// getTripSummary is the same controllable mock the legacy path used.
const tripsStub = {
  canAccessTrip: (tripId: number, userId: number) => testDb.prepare(CAN_ACCESS_TRIP_SQL).get(userId, tripId, userId),
  getRaw: async (tripId: number) => testDb.prepare('SELECT * FROM trips WHERE id = ?').get(tripId),
} as unknown as TripsService;
// getTripSummary moved to TripReadModelService with the trip split; the mock is
// the same controllable one, one constructor slot further along.
const readModelStub = {
  getTripSummary: (tripId: number, viewerUserId?: number) => mockGetTripSummary(tripId, viewerUserId),
} as never;



// The three remaining prompts moved to their domains' @McpController classes:
// packing-list, budget-overview and the static-token notice. Built over the same
// in-memory DB so the cases below keep asserting real rows.
//
// Plan 3c Task 0b: `promptEm` is resolved once in the first `beforeAll` below —
// `canAccessTrip`/`isOwner`/`rosterUserIds`/
// `getPlaceWithTags` resolve `TripsRepository`/`TripMembersRepository`/
// `PlacesRepository` through it now, not through `db/database.ts`'s deleted
// free functions this file's `dbMock` used to stand in for.
let promptEm: EntityManager | undefined;
const authStub = { isDemoUser: () => false } as unknown as AuthService;



// The packing-list / budget-overview prompts live here since the trips.bridge
// fold; the summary rides the same readModelStub the trip-summary prompt uses.
let promptGuards: McpToolGuardsService;
let tripsMcp: TripsMcp;
let promptPackingService: PackingService;
let packingMcp: PackingMcp;
let promptBudget: BudgetService;
let budgetMcp: BudgetMcp;
let tripPromptsMcp: TripPromptsMcp;
beforeAll(async () => {
  promptEm = (await sharedTestOrm(testDb)).em;
  promptGuards = new McpToolGuardsService(await createTestTripsRepo(testDb), await createTestUsersRepo(testDb), new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new RealtimeService());
  tripsMcp = new TripsMcp(
  tripsStub,
  { listItems: () => [] } as unknown as TodoService,
  { listPolls: () => [], countMessages: () => 0 } as unknown as CollabService,
  undefined as never,
  undefined as never,
  undefined as never,
  readModelStub,
  addonsStub,
  promptGuards,
);
  promptPackingService = new PackingService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new RealtimeService(),
    notificationsStub(),
    await createTestUnitOfWork(testDb),
    await createTestPackingItemsRepo(testDb),
    await createTestPackingItemContributorsRepo(testDb),
    await createTestPackingBagsRepo(testDb),
    await createTestPackingCategoryAssigneesRepo(testDb),
    await createTestPackingTemplatesRepo(testDb),
    await createTestPackingTemplateCategoriesRepo(testDb),
    await createTestPackingTemplateItemsRepo(testDb),
    await createTestTripsRepo(testDb),
    await createTestTripMembersRepo(testDb),
  );
  packingMcp = new PackingMcp(promptPackingService, authStub, addonsStub, promptGuards);
  promptBudget = new BudgetService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new ExchangeRatesService(), new RealtimeService(), await createTestUnitOfWork(testDb), ...(await budgetRepoArgs(testDb)));
  budgetMcp = new BudgetMcp(
  promptBudget,
  new ExchangeRatesService(),
  new RuntimeEnvService(),
  new TripMembershipService(await createTestTripsRepo(testDb), await createTestTripMembersRepo(testDb)),
  addonsStub,
  promptGuards,
  await createTestUnitOfWork(testDb),
  await createTestPlacesRepo(testDb),
  await createTestTripsRepo(testDb),
  new DemoService(new RuntimeEnvService(), promptEm),
  await createTestTripMembersRepo(testDb),
);
  tripPromptsMcp = new TripPromptsMcp(tripsStub, readModelStub, promptPackingService, addonsStub);
});
const authMcp = new AuthMcp();

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  isAddonEnabledMock.mockReturnValue(true);

  // Default mock: returns a trip-summary-shaped value from the real in-memory DB
  // so the trip title / existence match what tests insert. `budget` mirrors the
  // real getTripSummary object shape ({ items, total, ... }) that prompts.ts reads
  // via budget.items/budget.total; packing stays an array (the packing prompt
  // tolerates it).
  mockGetTripSummary.mockImplementation(async (tripId: any) => {
    const trip = testDb.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as any;
    if (!trip) return null;
    const members = testDb.prepare(`
      SELECT u.id, u.username as name, u.email
      FROM trip_members m JOIN users u ON u.id = m.user_id
      WHERE m.trip_id = ?
    `).all(tripId) as any[];
    const budgetRows = testDb.prepare('SELECT * FROM budget_items WHERE trip_id = ?').all(tripId) as any[];
    const packingRows = testDb.prepare('SELECT * FROM packing_items WHERE trip_id = ?').all(tripId) as any[];
    // The totals come from the same BudgetService.tripTotals the real summary uses.
    const totals = await promptBudget.tripTotals(tripId, trip.currency || 'EUR');
    return {
      trip,
      days: [],
      members,
      budget: {
        items: budgetRows,
        item_count: budgetRows.length,
        total: totals.total,
        by_category: totals.byCategory,
        currency: trip.currency,
        unconverted_item_ids: totals.unconverted,
      },
      packing: packingRows, // array shape; packing prompt tolerates it
      reservations: [],
      collabNotes: [],
    };
  });
});

afterAll(() => {
  testDb.close();
});

const openSessions: Array<{ client: Client; server: McpServer }> = [];

afterEach(async () => {
  for (const { client, server } of openSessions.splice(0)) {
    await client.close();
    await server.close();
  }
});

/** A connected client over a fresh McpServer with the prompts registered for the given userId. */
async function buildServer(userId: number, opts: { isStaticToken?: boolean } = {}): Promise<Client> {
  const server = new McpServer({ name: 'trek-test', version: '1.0.0' });
  // Every prompt is DI-discovered now; attach them the way registerTools does in
  // production, including the isStaticToken flag the notice's `when` gate reads.
  await createTestRegistry([tripsMcp, tripPromptsMcp, packingMcp, budgetMcp, authMcp], { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess })
    .attach(server, { userId, scopes: null, isStaticToken: opts.isStaticToken ?? false });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  openSessions.push({ client, server });
  return client;
}

/** Fetch a prompt over the transport; numeric ids go out as the strings a client sends. */
async function invokePrompt(client: Client, name: string, args: Record<string, string | number> = {}): Promise<string> {
  const wireArgs = Object.fromEntries(Object.entries(args).map(([key, value]) => [key, String(value)]));
  const result = await client.getPrompt({ name, arguments: wireArgs });
  const msg = result.messages[0];
  if (msg?.content?.type === 'text') return msg.content.text;
  return '';
}

/** Prompt names the session advertises. */
async function listRegisteredPrompts(client: Client): Promise<string[]> {
  return (await client.listPrompts()).prompts.map((p) => p.name);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Return only the text of a prompt result, ignoring error shapes. */
async function invokePromptText(client: Client, name: string, args: Record<string, string | number>): Promise<string> {
  return invokePrompt(client, name, args);
}

// ─────────────────────────────────────────────────────────────────────────────
// token_auth_notice
// ─────────────────────────────────────────────────────────────────────────────

describe('Prompt: token_auth_notice', () => {
  it('is registered and returns deprecation notice when isStaticToken=true', async () => {
    const { user } = createUser(testDb);
    const client = await buildServer(user.id, { isStaticToken: true });
    const names = await listRegisteredPrompts(client);
    expect(names).toContain('token_auth_notice');
    const text = await invokePrompt(client, 'token_auth_notice', {});
    expect(text).toContain('static API token');
    expect(text).toContain('deprecated');
  });

  it('answers a request that carries no arguments at all', async () => {
    const { user } = createUser(testDb);
    const client = await buildServer(user.id, { isStaticToken: true });
    // The SDK client sends no `arguments` key when none are given; a prompt
    // without arguments must not demand an empty object.
    const result = await client.getPrompt({ name: 'token_auth_notice' });
    expect(result.messages[0]?.content).toMatchObject({ type: 'text' });
  });

  it('is NOT registered when isStaticToken=false', async () => {
    const { user } = createUser(testDb);
    const client = await buildServer(user.id, { isStaticToken: false });
    const names = await listRegisteredPrompts(client);
    expect(names).not.toContain('token_auth_notice');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Prompt arguments on the wire (#2207)
// ─────────────────────────────────────────────────────────────────────────────

describe('Prompt arguments on the wire', () => {
  it.each(['trip-summary', 'packing-list', 'budget-overview'])('%s takes the trip id as the string every client sends (#2207)', async (name) => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Wire Trip' });
    createPackingItem(testDb, trip.id, { name: 'Charger', category: 'Tech' });

    const client = await buildServer(user.id);
    const result = await client.getPrompt({ name, arguments: { tripId: String(trip.id) } });
    expect(result.description).toContain('Wire Trip');
  });

  it.each(['abc', '0', '-3', '1.5', '', '99999999999999999999'])('rejects the trip id %j as invalid params instead of reaching the handler', async (tripId) => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Untouched' });
    mockGetTripSummary.mockClear();

    const client = await buildServer(user.id);
    await expect(client.getPrompt({ name: 'trip-summary', arguments: { tripId } }))
      .rejects.toMatchObject({ code: ErrorCode.InvalidParams });
    expect(mockGetTripSummary).not.toHaveBeenCalled();
  });

  it('advertises tripId as a required argument of every trip prompt', async () => {
    const { user } = createUser(testDb);
    const client = await buildServer(user.id);
    const { prompts } = await client.listPrompts();
    const byName = Object.fromEntries(prompts.map((p) => [p.name, p.arguments]));
    expect(byName['trip-summary']).toEqual([{ name: 'tripId', description: 'Trip ID to summarize', required: true }]);
    expect(byName['packing-list']).toEqual([{ name: 'tripId', description: 'Trip ID', required: true }]);
    expect(byName['budget-overview']).toEqual([{ name: 'tripId', description: 'Trip ID', required: true }]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// trip-summary
// ─────────────────────────────────────────────────────────────────────────────

describe('Prompt: trip-summary', () => {
  it('is always registered regardless of addons', async () => {
    const { user } = createUser(testDb);
    const client = await buildServer(user.id);
    expect(await listRegisteredPrompts(client)).toContain('trip-summary');
  });

  it('returns access denied message for non-member trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id, { title: 'Private Trip' });

    const client = await buildServer(user.id);
    const text = await invokePrompt(client, 'trip-summary', { tripId: trip.id });
    expect(text.toLowerCase()).toContain('access denied');
  });

  it('includes trip title in output for a valid accessible trip', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip', start_date: '2026-07-01', end_date: '2026-07-03' });
    addTripMember(testDb, trip.id, member.id);

    const client = await buildServer(user.id);
    const text = await invokePrompt(client, 'trip-summary', { tripId: trip.id });
    expect(text).toContain('Paris Trip');
    expect(text).toContain('Dates: 2026-07-01 to 2026-07-03');
  });

  it('returns "Trip not found." when getTripSummary returns null for accessible trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Ghost Trip' });

    // Override mock to return null (covers lines 46-48 in prompts.ts)
    mockGetTripSummary.mockReturnValueOnce(null);

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'trip-summary', { tripId: trip.id });
    expect(text).toContain('Trip not found.');
  });

  it('handles null optional trip fields gracefully (covers || fallbacks)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: '' });

    // Return summary with minimal trip fields (no title, no dates, no description)
    mockGetTripSummary.mockReturnValueOnce({
      trip: { id: trip.id, title: null, description: null, start_date: null, end_date: null, currency: null, user_id: user.id },
      days: [],
      members: [],
      budget: [],
      packing: [],
      reservations: [],
      collabNotes: [],
    });

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'trip-summary', { tripId: trip.id });
    expect(text).toContain('Untitled');
    expect(text).toContain('?');   // start/end date fallback
    expect(text).toContain('EUR'); // currency fallback
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// packing-list
// ─────────────────────────────────────────────────────────────────────────────

describe('Prompt: packing-list', () => {
  it('prompt is NOT registered when packing addon is disabled', async () => {
    isAddonEnabledMock.mockReturnValue(false);
    const { user } = createUser(testDb);
    const client = await buildServer(user.id);
    expect(await listRegisteredPrompts(client)).not.toContain('packing-list');
  });

  it('prompt is registered when packing addon is enabled', async () => {
    // isAddonEnabledMock returns true by default
    const { user } = createUser(testDb);
    const client = await buildServer(user.id);
    expect(await listRegisteredPrompts(client)).toContain('packing-list');
  });

  it('returns access denied for non-member trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    const client = await buildServer(user.id);
    const text = await invokePrompt(client, 'packing-list', { tripId: trip.id });
    expect(text.toLowerCase()).toContain('access denied');
  });

  it('returns "No packing items found" when trip has no packing items', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Empty Trip' });

    const client = await buildServer(user.id);
    const text = await invokePrompt(client, 'packing-list', { tripId: trip.id });
    expect(text).toContain('No packing items found');
  });

  it('returns formatted checklist with category groups when items exist', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Beach Trip' });
    createPackingItem(testDb, trip.id, { name: 'Sunscreen', category: 'Essentials' });
    createPackingItem(testDb, trip.id, { name: 'Passport', category: 'Documents' });

    const client = await buildServer(user.id);
    const text = await invokePrompt(client, 'packing-list', { tripId: trip.id });
    expect(text).toContain('Packing List');
    expect(text).toContain('Sunscreen');
    expect(text).toContain('Passport');
    expect(text).toContain('Essentials');
    expect(text).toContain('Documents');
    // Items should be in checklist format
    expect(text).toMatch(/\[[ x]\]/);
  });

  it('reads the trip title without building the whole trip summary (#2525)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Null Trip' });
    createPackingItem(testDb, trip.id, { name: 'Toothbrush', category: 'Hygiene' });
    mockGetTripSummary.mockClear();

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'packing-list', { tripId: trip.id });
    expect(text).toContain('Toothbrush');
    expect(text).toContain('Packing List: Null Trip');
    // The summary adds the budget up, and that can wait on a rates fetch.
    expect(mockGetTripSummary).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// budget-overview
// ─────────────────────────────────────────────────────────────────────────────

describe('Prompt: budget-overview', () => {
  it('prompt is NOT registered when budget addon is disabled', async () => {
    isAddonEnabledMock.mockReturnValue(false);
    const { user } = createUser(testDb);
    const client = await buildServer(user.id);
    expect(await listRegisteredPrompts(client)).not.toContain('budget-overview');
  });

  it('prompt is registered when budget addon is enabled', async () => {
    const { user } = createUser(testDb);
    const client = await buildServer(user.id);
    expect(await listRegisteredPrompts(client)).toContain('budget-overview');
  });

  it('returns access denied for non-member trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    const client = await buildServer(user.id);
    const text = await invokePrompt(client, 'budget-overview', { tripId: trip.id });
    expect(text.toLowerCase()).toContain('access denied');
  });

  it('produces output for an accessible trip (budget prompt invocation)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Budget Trip' });

    const client = await buildServer(user.id);
    const text = await invokePrompt(client, 'budget-overview', { tripId: trip.id });
    expect(text).toContain('Budget Trip');
  });

  it('produces output for an accessible trip with budget items', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Italy Trip' });
    createBudgetItem(testDb, trip.id, { name: 'Flight', category: 'Transport', total_price: 300 });
    createBudgetItem(testDb, trip.id, { name: 'Hotel', category: 'Accommodation', total_price: 500 });

    const client = await buildServer(user.id);
    const text = await invokePrompt(client, 'budget-overview', { tripId: trip.id });
    expect(text).toContain('Italy Trip');
    expect(text).toContain('Total: 800');
  });

  it('returns "Trip not found." when getTripSummary returns null for accessible trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Ghost Trip' });

    // Override mock to return null (covers lines 116-118 in prompts.ts)
    mockGetTripSummary.mockReturnValueOnce(null);

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'budget-overview', { tripId: trip.id });
    expect(text).toContain('Trip not found.');
  });

  it('renders budget by category with correct totals and per-person calculation', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Budget Trip' });
    addTripMember(testDb, trip.id, member.id);
    createBudgetItem(testDb, trip.id, { name: 'Flight', category: 'Transport', total_price: 200 });
    createBudgetItem(testDb, trip.id, { name: 'Bus', category: 'Transport', total_price: 50 });
    createBudgetItem(testDb, trip.id, { name: 'Hotel', category: 'Accommodation', total_price: 300 });

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'budget-overview', { tripId: trip.id });
    expect(text).toContain('Budget Trip');
    expect(text).toContain('Transport');
    expect(text).toContain('Accommodation');
    expect(text).toContain('550'); // Transport total
    expect(text).toContain('300'); // Accommodation total
  });

  it('prints a foreign-currency bill at the rate it was booked at, not as that many euros (#2525)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Dollar Trip' });
    await promptBudget.createBudgetItem(trip.id, {
      name: 'Aparthotel Silver', category: 'Accommodation', currency: 'USD', exchange_rate: 1.17,
      payers: [{ user_id: user.id, amount: 801.76 }], members: [{ user_id: user.id }],
    });
    createBudgetItem(testDb, trip.id, { name: 'Dinner', category: 'Food', total_price: 100 });

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'budget-overview', { tripId: trip.id });
    // 801.76 USD at 1.17 is 685.26 EUR. Summed as stored it read "Total: 901.76 EUR".
    expect(text).toContain('Total: 785.26 EUR');
    expect(text).toContain('- Accommodation: 685.26 EUR');
    expect(text).toContain('- Food: 100 EUR');
    expect(text).not.toContain('801.76');
  });

  it('says how many expenses no exchange rate could put into the total', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Dong Trip' });
    // Stored with the "not frozen" rate 1, and no rates to convert it with.
    await promptBudget.createBudgetItem(trip.id, {
      name: 'Pho', category: 'Food', currency: 'VND', total_price: 8920000, members: [{ user_id: user.id }],
    });
    createBudgetItem(testDb, trip.id, { name: 'Dinner', category: 'Food', total_price: 100 });

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'budget-overview', { tripId: trip.id });
    expect(text).toContain('Total: 100 EUR');
    expect(text).toContain('1 expense(s) not counted yet: no exchange rate.');
    expect(text).not.toContain('8920000');
  });

  it('adds no such line when every expense converts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Euro Trip' });
    createBudgetItem(testDb, trip.id, { name: 'Dinner', category: 'Food', total_price: 100 });

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'budget-overview', { tripId: trip.id });
    expect(text).not.toContain('not counted yet');
  });

  it('renders "No expenses recorded." when budget array is empty', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Empty Budget' });

    const client = await buildServer(user.id);
    const text = await invokePromptText(client, 'budget-overview', { tripId: trip.id });
    expect(text).toContain('No expenses recorded.');
  });
});
