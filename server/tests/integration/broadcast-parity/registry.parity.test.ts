import { McpRegistryService } from '../../../src/nest-mcp';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TRANSFER_TOOLS } from '../../helpers/transfer-tools';
import { ALL_NEEDS, NEED_KEYS, openHarness, REST_SOCKET, type ListedTool, type ParityHarness } from './harness';
import { ALL_GROUPS } from './index';
import { PENDING_CEILING } from './pending-ceiling';
import type { Scene } from './types';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Completeness of the broadcast parity groups over the MCP registry (plan
 * section 3.5). It cannot skip a registry tool quietly: the write tools are
 * what an admin session with every addon on lists (annotations as a client
 * sees them, `readOnlyHint !== true`), checked against everything the
 * registry holds, and every one of them must stand in exactly one group as a
 * case, an exemption with its reason, or pending. A new write tool without a
 * row fails here, and so does a row for a tool that is gone or only reads.
 * Pending only shrinks (`PENDING_CEILING`): a new tool gets a case or an
 * exemption.
 *
 * Transfer writes are intentionally silent historical operations and are not
 * exposed to this ordinary admin session. Their real OAuth HTTP/SSE tests in
 * travel-transfer.test.ts cover consent, apply/retry and the absence of broadcasts.
 *
 * Out of its reach on purpose: the tools installed plugins contribute
 * (`dynamicTools`, attached per session from the plugin source, never held by
 * the registry). They are not silent: a plugin's tool writes through the
 * plugin RPC, which sends the trip's events itself (`places.rpc.ts` sends
 * place:created, for one). Those RPC broadcasts stay where they are by
 * decision of this work, so their parity is not checked here.
 */

let h: ParityHarness;
let listed: ListedTool[];

beforeAll(async () => {
  h = await openHarness();
  listed = await h.listTools((await h.scene()).admin.id);
}, 60_000);

afterAll(async () => {
  await h?.close();
});

/** Every row of every group, as `group: kind`, by tool. */
function rowsByTool(): Map<string, string[]> {
  const rows = new Map<string, string[]>();
  const add = (tool: string, where: string) => rows.set(tool, [...(rows.get(tool) ?? []), where]);
  for (const group of ALL_GROUPS) {
    for (const c of group.cases) add(c.tool, `${group.name}: case`);
    for (const e of group.exempt) add(e.tool, `${group.name}: exempt`);
    for (const tool of group.pending ?? []) add(tool, `${group.name}: pending`);
  }
  return rows;
}

const writeTools = () => listed.filter((tool) => !tool.readOnly).map((tool) => tool.name);

describe('broadcast parity: every write tool has a row', () => {
  it('BCP-REG-001: an admin session lists every ordinary tool; transfer tools require separate OAuth consent', () => {
    const registered = h.app
      .get(McpRegistryService)
      .list()
      .filter((entry) => entry.kind === 'tool')
      .map((entry) => entry.name);
    const names = new Set(listed.map((tool) => tool.name));
    expect(
      registered.filter((name) => !names.has(name)).sort(),
      'only the separately consented transfer tools may be absent',
    ).toEqual(TRANSFER_TOOLS);
    expect(
      [...names].filter((name) => !registered.includes(name)),
      'listed, but not in the registry',
    ).toEqual([]);
    expect(writeTools().length).toBeGreaterThan(0);
  });

  it('BCP-REG-002: every write tool stands in exactly one group, once', () => {
    const rows = rowsByTool();
    const missing = writeTools().filter((tool) => !rows.has(tool));
    expect(missing, 'write tools without a case, an exemption or a pending row').toEqual([]);
    const doubled = [...rows]
      .filter(([, where]) => where.length > 1)
      .map(([tool, where]) => `${tool} (${where.join(', ')})`);
    expect(doubled, 'write tools with more than one row').toEqual([]);
  });

  it('BCP-REG-003: no row names a tool that is gone or only reads', () => {
    const writes = new Set(writeTools());
    const stale = [...rowsByTool().keys()].filter((tool) => !writes.has(tool));
    expect(stale, 'rows for unknown or read-only tools').toEqual([]);
  });

  it('BCP-REG-004: every exemption says why the tool sends nothing, in at least 20 characters', () => {
    const thin = ALL_GROUPS.flatMap((group) => group.exempt)
      .filter((e) => e.reason.trim().length < 20)
      .map((e) => e.tool);
    expect(thin).toEqual([]);
  });

  it('BCP-REG-008: pending only shrinks: no tool joins it, and one that got its case leaves the ceiling', () => {
    const pending = ALL_GROUPS.flatMap((group) => group.pending ?? []);
    const ceiling = new Set(PENDING_CEILING);
    expect(
      pending.filter((tool) => !ceiling.has(tool)),
      'pending rows for tools the ceiling does not list: give each a case or an exemption',
    ).toEqual([]);
    const held = new Set(pending);
    expect(
      PENDING_CEILING.filter((tool) => !held.has(tool)),
      'listed in pending-ceiling.ts, but no group holds the tool as pending any more: drop it from the list',
    ).toEqual([]);
  });
});

describe('broadcast parity: the scenes', () => {
  it('BCP-REG-005: a scene builds every need, and every row it names is there', async () => {
    const s = await h.scene(ALL_NEEDS);
    const keys: (keyof Scene)[] = ['owner', 'admin', 'trip', ...Object.values(NEED_KEYS).flat()];
    const without = keys.filter((key) => {
      const row = s[key] as { id?: unknown; place_id?: unknown; code?: unknown };
      return typeof (row.id ?? row.place_id) !== 'number' && typeof row.code !== 'string';
    });
    expect(without, 'scene rows without an id').toEqual([]);
    expect(s.days.map((day) => day.date)).toEqual(['2027-05-03', '2027-05-04', '2027-05-05']);
    expect(s.stay.reservationId).toBeGreaterThan(0);
  });

  it('BCP-REG-006: a row the case did not ask for throws instead of reading as missing', async () => {
    const s = await h.scene(['assignment']);
    expect(s.place.id).toBe(s.assignment.place_id);
    expect(() => s.stay).toThrow("add 'stay' to the case's needs");
  });
});

describe('broadcast parity: the recorder', () => {
  it('BCP-REG-007: marks a send made inside a transaction, and folds a fan-out into one entry', async () => {
    const realtime = h.app.get(RealtimeService);
    const uow = h.app.get(UnitOfWork);
    h.recorder.take();
    await withRequestContext(h.orm, () =>
      uow.transactional(async () => {
        realtime.broadcast(7, 'place:deleted', { placeId: 3 });
      }),
    );
    realtime.broadcast(7, 'packing:updated', { item: { id: 4 } }, REST_SOCKET, 11);
    realtime.broadcast(7, 'packing:updated', { item: { id: 4 } }, REST_SOCKET, 12);
    realtime.broadcastToUser(11, { type: 'tags:changed' });
    realtime.broadcastToUser(12, { type: 'tags:changed' });
    expect(h.recorder.take().map((r) => ({ event: r.event, to: r.to, only: r.onlyUserIds, inTx: r.inTx }))).toEqual([
      { event: 'place:deleted', to: [7], only: undefined, inTx: true },
      { event: 'packing:updated', to: [7], only: [11, 12], inTx: false },
      { event: 'tags:changed', to: [11, 12], only: undefined, inTx: false },
    ]);
  });
});
