/**
 * The demo-mode write block, held for every registered MCP tool at once.
 *
 * The block used to be the first line of each write tool; it now runs in the
 * registry (trekDemoToolGate, wired into McpModule.forRoot and into the MCP test
 * registry). This suite attaches the real registry to a capturing server and
 * calls every write tool as the demo account: each one has to answer with the
 * canned refusal before its handler runs. Every read-only tool has to pass the
 * gate. Besides that it pins the two markers the gate relies on to each other,
 * so a tool declared `mode: 'write'` but annotated read-only (or the reverse)
 * fails here instead of slipping past the gate.
 */
import { ADDON_IDS } from '../../../src/addons';
import { db as testDb } from '../../../src/db/database';
import { isDemoGatedTool, trekDemoToolGate } from '../../../src/mcp/nest-mcp-policy';
import type { McpContext, McpRegistry, McpRegistryListing } from '../../../src/nest-mcp';
import { createUser } from '../../helpers/factories';
import { createMcpTestRegistry } from '../../helpers/mcp-test-controllers';
import { resetTestDb, setAddonEnabled } from '../../helpers/test-db';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

const DEMO_REFUSAL = {
  content: [{ type: 'text', text: 'Write operations are disabled in demo mode.' }],
  isError: true,
};

interface CapturedTool {
  annotations?: Record<string, unknown>;
  call: (args?: Record<string, unknown>) => Promise<unknown>;
}

/** Attaches the registry to a stand-in server that keeps every tool callback instead of serving it. */
async function captureTools(registry: McpRegistry, ctx: McpContext): Promise<Map<string, CapturedTool>> {
  const tools = new Map<string, CapturedTool>();
  const server = {
    registerTool: (
      name: string,
      config: { annotations?: Record<string, unknown> },
      cb: (...a: unknown[]) => unknown,
    ) => {
      // Arguments as a client would send nothing: the gate answers before
      // the handler ever reads them.
      tools.set(name, { annotations: config.annotations, call: async (args = {}) => cb(args, {}) });
    },
    registerResource: () => undefined,
    registerPrompt: () => undefined,
  } as unknown as McpServer;
  await registry.attach(server, ctx);
  return tools;
}

let registry: McpRegistry;
let toolListings: McpRegistryListing[];

beforeAll(async () => {
  registry = await createMcpTestRegistry();
  toolListings = registry.list().filter((entry) => entry.kind === 'tool');
});

beforeEach(() => {
  resetTestDb(testDb);
  for (const id of Object.values(ADDON_IDS)) setAddonEnabled(testDb, id, true);
});

afterEach(() => {
  delete process.env.DEMO_MODE;
});

afterAll(() => {
  testDb.close();
});

describe('demo tool gate over the whole registry', () => {
  it('DEMOGATE-001: every write tool refuses the demo account with the canned body, before its handler', async () => {
    process.env.DEMO_MODE = 'true';
    const { user: demo } = createUser(testDb, { email: 'demo@trek.app' });
    const tools = await captureTools(registry, { userId: demo.id, scopes: null, isStaticToken: false });

    const writes = [...tools].filter(([, t]) => t.annotations?.readOnlyHint !== true);
    expect(writes.length).toBeGreaterThan(150);
    const answers = await Promise.all(writes.map(async ([name, tool]) => ({ name, result: await tool.call() })));
    expect(answers).toEqual(writes.map(([name]) => ({ name, result: DEMO_REFUSAL })));
  });

  it('DEMOGATE-002: no read-only tool is held back for the demo account', async () => {
    process.env.DEMO_MODE = 'true';
    const { user: demo } = createUser(testDb, { email: 'demo@trek.app' });
    const ctx: McpContext = { userId: demo.id, scopes: null, isStaticToken: false };
    const gate = trekDemoToolGate(async () => true);
    const tools = await captureTools(registry, ctx);

    const reads = [...tools].filter(([, t]) => t.annotations?.readOnlyHint === true);
    expect(reads.length).toBeGreaterThan(80);
    const refusals = await Promise.all(
      reads.map(async ([name, tool]) => ({ name, refusal: await gate({ name, annotations: tool.annotations }, ctx) })),
    );
    expect(refusals).toEqual(reads.map(([name]) => ({ name, refusal: undefined })));
  });

  it('DEMOGATE-003: an ordinary account reaches the write handlers in demo mode', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'alice@example.com' });
    const tools = await captureTools(registry, { userId: user.id, scopes: null, isStaticToken: false });
    // create_tag has no trip to check and no addon gate: it writes and answers.
    const result = (await tools.get('create_tag')?.call({ name: 'Mine' })) as {
      isError?: boolean;
      content: { text: string }[];
    };
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Mine');
  });

  it('DEMOGATE-004: outside demo mode the demo account is an ordinary account', async () => {
    const { user: demo } = createUser(testDb, { email: 'demo@trek.app' });
    const tools = await captureTools(registry, { userId: demo.id, scopes: null, isStaticToken: false });
    const result = (await tools.get('create_tag')?.call({ name: 'Mine' })) as { isError?: boolean };
    expect(result.isError).toBeUndefined();
  });

  it('DEMOGATE-005: with every addon on, only the photo-library tools stay detached, so the sweep above covers the rest', async () => {
    const { user } = createUser(testDb);
    const tools = await captureTools(registry, { userId: user.id, scopes: null, isStaticToken: false });
    const missing = toolListings.map((t) => t.name).filter((name) => !tools.has(name));
    // These three wait for a connected Immich or Synology provider
    // (anyPhotoProviderEnabled), and all three are reads.
    expect(missing.sort()).toEqual(['list_provider_album_photos', 'list_provider_albums', 'search_provider_photos']);
  });

  it('DEMOGATE-006: the scope mode and the read-only annotation agree on every declarative tool', async () => {
    const { user } = createUser(testDb);
    const tools = await captureTools(registry, { userId: user.id, scopes: null, isStaticToken: false });
    const mismatched: string[] = [];
    for (const listing of toolListings) {
      const access = listing.access;
      if (access === undefined || typeof access === 'function') continue;
      const tool = tools.get(listing.name);
      if (!tool) continue; // the detached photo-library reads of DEMOGATE-005
      const readOnly = tool.annotations?.readOnlyHint === true;
      if (access.mode === 'read' && !readOnly) mismatched.push(`${listing.name}: mode read, not annotated read-only`);
      if ((access.mode === 'write' || access.mode === 'delete') && readOnly) {
        mismatched.push(`${listing.name}: mode ${access.mode}, annotated read-only`);
      }
    }
    expect(mismatched).toEqual([]);
  });
});

describe('trekDemoToolGate', () => {
  const ctx: McpContext = { userId: 7, scopes: null, isStaticToken: false };

  it('DEMOGATE-010: refuses a write tool for a demo account and asks with the caller id', async () => {
    const isDemo = vi.fn(async () => true);
    expect(await trekDemoToolGate(isDemo)({ name: 'w', annotations: { readOnlyHint: false } }, ctx)).toEqual(
      DEMO_REFUSAL,
    );
    expect(isDemo).toHaveBeenCalledWith(7);
  });

  it('DEMOGATE-011: lets a write tool through for any other account', async () => {
    expect(await trekDemoToolGate(async () => false)({ name: 'w' }, ctx)).toBeUndefined();
  });

  it('DEMOGATE-012: never asks about the caller for a read-only tool', async () => {
    const isDemo = vi.fn(async () => true);
    expect(await trekDemoToolGate(isDemo)({ name: 'r', annotations: { readOnlyHint: true } }, ctx)).toBeUndefined();
    expect(isDemo).not.toHaveBeenCalled();
  });

  it('DEMOGATE-013: a tool without annotations counts as a write', () => {
    expect(isDemoGatedTool({ name: 'x' })).toBe(true);
    expect(isDemoGatedTool({ name: 'x', annotations: { readOnlyHint: true } })).toBe(false);
  });
});
