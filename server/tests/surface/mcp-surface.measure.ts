/**
 * Measures what `tools/list` costs a client, for `npm run lint:mcp-surface`
 * (scripts/mcp-surface.mjs). Not part of the test suite: vitest.surface.config.ts
 * is the only config that picks up `*.measure.ts`, and the script runs it with
 * TREK_MCP_SURFACE_OUT naming the JSON file to write.
 *
 * The whole container is booted (tests/helpers/test-app.ts) on the test-mode
 * database, every addon is switched on, and one session per reference scope set
 * attaches the real registry and lists its tools over an in-memory transport,
 * the way a client sees them.
 */
import { ADDON_IDS } from '../../src/addons';
import { ALL_SCOPES, CORE_CLIENT_SCOPES } from '../../src/mcp/scopes';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { createMcpHarness } from '../helpers/mcp-harness';
import { bootTestApp } from '../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { writeFileSync } from 'node:fs';
import { it } from 'vitest';

/**
 * The reference sessions. `full` is a static token or a web session (no scopes);
 * `core` is what the OAuth presets and Dynamic Client Registration hand out;
 * `readonly` every read scope; `trips` a client that asked for trips alone.
 */
const MCP_SURFACE_SESSIONS: Record<string, string[] | null> = {
  full: null,
  core: [...CORE_CLIENT_SCOPES],
  readonly: ALL_SCOPES.filter((s) => s.endsWith(':read')),
  trips: ['trips:read', 'trips:write'],
};

/**
 * What a tool costs, as held by the ratchet: its listing without `outputSchema`
 * and `_meta`. Both are contracts for the host and the widget rather than words
 * the model chooses a tool by, and adding them to existing read tools is the
 * point of the structured-output work, so they are measured apart
 * (`outputs`, capped per tool) instead of counting as growth.
 */
function inputBytes(tool: Record<string, unknown>): number {
  const { outputSchema: _output, _meta: _ignored, ...rest } = tool;
  return Buffer.byteLength(JSON.stringify(rest));
}

interface SessionMeasure {
  tools: number;
  bytes: number;
  names: string[];
}

type ListedTool = Awaited<
  ReturnType<Awaited<ReturnType<typeof createMcpHarness>>['client']['listTools']>
>['tools'][number];

/** What one session's client sees in tools/list. */
async function listFor(userId: number, scopes: string[] | null): Promise<ListedTool[]> {
  const harness = await createMcpHarness({ userId, scopes });
  try {
    return (await harness.client.listTools()).tools;
  } finally {
    await harness.cleanup();
  }
}

it('measures tools/list for every reference session', { timeout: 120_000 }, async () => {
  const out = process.env.TREK_MCP_SURFACE_OUT;
  if (!out) throw new Error('TREK_MCP_SURFACE_OUT names the file the measurement is written to');
  const orm = (await bootTestApp()).get(MikroORM);
  await Promise.all(Object.values(ADDON_IDS).map((id) => setAddonEnabled(orm, id, true)));
  const { user } = await makeUser(orm);

  const entries = Object.entries(MCP_SURFACE_SESSIONS);
  const lists = await Promise.all(entries.map(([, scopes]) => listFor(user.id, scopes)));
  const sessions: Record<string, SessionMeasure> = {};
  const tools: Record<string, number> = {};
  const outputs: Record<string, number> = {};
  entries.forEach(([name], i) => {
    const listed = lists[i] ?? [];
    sessions[name] = {
      tools: listed.length,
      bytes: listed.reduce((sum, t) => sum + inputBytes(t), 0),
      names: listed.map((t) => t.name).sort(),
    };
    for (const tool of listed) {
      tools[tool.name] = inputBytes(tool);
      if (tool.outputSchema) outputs[tool.name] = Buffer.byteLength(JSON.stringify(tool.outputSchema));
    }
    if (name === 'full' && process.env.TREK_MCP_SURFACE_DUMP)
      writeFileSync(process.env.TREK_MCP_SURFACE_DUMP, JSON.stringify(listed));
  });
  writeFileSync(out, JSON.stringify({ sessions, tools, outputs }, null, 2));
});
