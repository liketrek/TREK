/**
 * Who reaches the interactive views (MCP Apps) and the writes they drive. A
 * view's `ui://` resource is read only by a session that may read what it
 * shows; the admin switch takes the views away and leaves the tools as text;
 * and the tools a view calls on the host's session (toggle_todo,
 * toggle_packing_item, vote_collab_poll) refuse what the REST routes refuse.
 */
import { ADDON_IDS } from '../../../src/addons';
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { CollabPollVotes } from '../../../src/db/entities/CollabPollVotes.entity';
import { CollabPolls } from '../../../src/db/entities/CollabPolls.entity';
import { PackingItems } from '../../../src/db/entities/PackingItems.entity';
import { TodoItems } from '../../../src/db/entities/TodoItems.entity';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { McpAppsService } from '../../../src/nest/mcp-apps/mcp-apps.service';
import { invalidatePermissionsCache } from '../../../src/nest/permissions/permissions-cache';
import { makePackingItem } from '../../helpers/factories/packing';
import { countRows, deleteRows, findRow, insertRow } from '../../helpers/factories/rows';
import { setAddonEnabled, setAppSetting } from '../../helpers/factories/settings';
import { makeTodoItem } from '../../helpers/factories/todos';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';
import { MCP_APP_WIDGETS, mcpAppUri, type McpAppWidget } from '@trek/shared';

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const HTML = '<!doctype html><title>widget</title>';

let app: Awaited<ReturnType<typeof bootTestApp>>;
let orm: MikroORM;
let ownerId: number;
let memberId: number;

const setApps = (enabled: boolean) => withRequestContext(orm, () => app.get(AddonsService).updateMcpApps(enabled));
/** What the transport hands registerTools for a new session: whether its tools may point at views. */
const offered = () => withRequestContext(orm, () => app.get(McpAppsService).offeredToSessions());

/** Opens a session, runs the body, and closes the session whatever happens. */
async function withSession<T>(
  options: { userId: number; scopes?: string[] | null; apps?: boolean },
  body: (session: McpHarness) => Promise<T>,
): Promise<T> {
  const session = await createMcpHarness(options);
  try {
    return await body(session);
  } finally {
    await session.cleanup();
  }
}

beforeAll(async () => {
  app = await bootTestApp();
  orm = app.get(MikroORM);
  await Promise.all(
    [ADDON_IDS.MCP, ADDON_IDS.PACKING, ADDON_IDS.COLLAB].map((addon) => setAddonEnabled(orm, addon, true)),
  );
  ownerId = (await makeUser(orm)).user.id;
  memberId = (await makeUser(orm)).user.id;
});

beforeEach(() => {
  // The widget documents come from the mcp-apps build, which the server suite does not run.
  vi.spyOn(app.get(McpAppsService), 'html').mockReturnValue(HTML);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await setApps(true);
});

describe('MCP Apps resources and scopes', () => {
  /** The views whose data a trips-only session may read: the trip list, the overview and a day. */
  const TRIPS_VIEWS: McpAppWidget[] = ['trip-list', 'trip-overview', 'day-plan'];

  it('MCPAPPS-ACCESS-001: a session lists and reads only the views of the groups it was granted', async () => {
    await withSession({ userId: ownerId, scopes: ['trips:read'] }, async (session) => {
      const listed = new Set((await session.client.listResources()).resources.map((r) => r.uri));
      const reads = await Promise.allSettled(
        MCP_APP_WIDGETS.map((widget) => session.client.readResource({ uri: mcpAppUri(widget) })),
      );
      for (const [i, widget] of MCP_APP_WIDGETS.entries()) {
        const reachable = TRIPS_VIEWS.includes(widget);
        expect(listed.has(mcpAppUri(widget)), widget).toBe(reachable);
        expect(reads[i].status, widget).toBe(reachable ? 'fulfilled' : 'rejected');
      }
    });
  });

  it('MCPAPPS-ACCESS-002: a view tool outside the granted groups is neither listed nor callable', async () => {
    const trip = await makeTrip(orm, ownerId);
    await withSession({ userId: ownerId, scopes: ['trips:read'] }, async (session) => {
      const names = (await session.client.listTools()).tools.map((t) => t.name);
      expect(names).toContain('get_trip_overview');
      expect(names).not.toContain('get_trip_map');
      const map = await session.client.callTool({ name: 'get_trip_map', arguments: { tripId: trip.id } });
      expect(map.isError).toBe(true);
    });
  });
});

describe('MCP Apps switched off', () => {
  it('MCPAPPS-ACCESS-003: no tool points at a view, no view is read, and the tools still answer in full', async () => {
    await makeTrip(orm, ownerId, { title: 'Faroe' });
    const before = await withSession({ userId: ownerId }, async (session) =>
      parseToolResult(await session.client.callTool({ name: 'list_trips', arguments: {} })),
    );
    await setApps(false);
    await withSession({ userId: ownerId, apps: await offered() }, async (session) => {
      const tools = (await session.client.listTools()).tools;
      expect(tools.filter((tool) => tool._meta?.ui !== undefined).map((t) => t.name)).toEqual([]);
      expect(tools.filter((tool) => tool._meta?.['openai/outputTemplate'] !== undefined)).toEqual([]);
      await expect(session.client.readResource({ uri: mcpAppUri('trip-list') })).rejects.toThrow();
      const result = await session.client.callTool({ name: 'list_trips', arguments: {} });
      expect(result.isError).toBeFalsy();
      expect(parseToolResult(result)).toEqual(before);
      expect(result.structuredContent).toEqual(before);
    });
  });
});

describe('the writes a view drives', () => {
  /** A trip the owner shares with the member, holding one of each thing a view ticks or votes on. */
  async function sharedTrip() {
    const trip = await makeTrip(orm, ownerId);
    await addTripMember(orm, trip.id, memberId, ownerId);
    const todo = await makeTodoItem(orm, trip.id, { name: 'Book ferry', checked: 0 });
    const item = await makePackingItem(orm, trip.id, { name: 'Raincoat', checked: 0 });
    const pollId = Number(
      await insertRow(orm, CollabPolls, {
        trip: trip.id,
        user: ownerId,
        question: 'Which island?',
        options: JSON.stringify(['Madeira', 'Azores']),
      }),
    );
    return { trip, todo, item, pollId };
  }

  type WriteTool = 'toggle_todo' | 'toggle_packing_item' | 'vote_collab_poll';
  const WRITES: WriteTool[] = ['toggle_todo', 'toggle_packing_item', 'vote_collab_poll'];

  /** One write on a fresh shared trip: its arguments, and how to tell it left nothing behind. */
  async function writeOf(tool: WriteTool) {
    const { trip, todo, item, pollId } = await sharedTrip();
    const writes = {
      toggle_todo: {
        args: { tripId: trip.id, itemId: todo.id, checked: true },
        unchanged: async () => (await findRow(orm, TodoItems, { id: todo.id }))?.checked === 0,
      },
      toggle_packing_item: {
        args: { tripId: trip.id, itemId: item.id, checked: true },
        unchanged: async () => (await findRow(orm, PackingItems, { id: item.id }))?.checked === 0,
      },
      vote_collab_poll: {
        args: { tripId: trip.id, pollId, optionIndex: 0 },
        unchanged: async () => (await countRows(orm, CollabPollVotes, { poll: pollId })) === 0,
      },
    };
    return writes[tool];
  }

  /** Writes and polls are kept to the trip owner, the way the admin permission panel does it. */
  const keepWritesToOwner = async (kept: boolean) => {
    const keys = ['perm_packing_edit', 'perm_collab_edit'];
    if (kept) await Promise.all(keys.map((key) => setAppSetting(orm, key, 'trip_owner')));
    else await Promise.all(keys.map((key) => deleteRows(orm, AppSettings, { key })));
    await invalidatePermissionsCache();
  };

  it.each(WRITES)('MCPAPPS-ACCESS-004: %s refuses a member the trip permissions keep to reading', async (tool) => {
    const write = await writeOf(tool);
    await keepWritesToOwner(true);
    try {
      await withSession({ userId: memberId }, async (session) => {
        expect((await session.client.callTool({ name: tool, arguments: write.args })).isError).toBe(true);
      });
      expect(await write.unchanged()).toBe(true);
    } finally {
      await keepWritesToOwner(false);
    }
  });

  it.each(WRITES)(
    'MCPAPPS-ACCESS-005: %s is out of reach of a read-only client, even on its own trip',
    async (tool) => {
      const write = await writeOf(tool);
      await withSession(
        { userId: ownerId, scopes: ['trips:read', 'todos:read', 'packing:read', 'collab:read'] },
        async (session) => {
          expect((await session.client.listTools()).tools.map((t) => t.name)).not.toContain(tool);
          expect((await session.client.callTool({ name: tool, arguments: write.args })).isError).toBe(true);
        },
      );
      expect(await write.unchanged()).toBe(true);
    },
  );

  it.each(WRITES)('MCPAPPS-ACCESS-006: %s goes through for a member the permissions let in', async (tool) => {
    const write = await writeOf(tool);
    await withSession({ userId: memberId }, async (session) => {
      expect((await session.client.callTool({ name: tool, arguments: write.args })).isError).toBeFalsy();
    });
    expect(await write.unchanged()).toBe(false);
  });
});
