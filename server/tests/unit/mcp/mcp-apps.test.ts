/**
 * The interactive views (MCP Apps): every widget a tool points at is served as
 * a `ui://` resource with the MCP Apps MIME type and a sandbox policy, the
 * admin's switch takes them away, and a tool's text stays what a host without
 * views reads.
 */
import { ADDON_IDS } from '../../../src/addons';
import { MCP_APP_MIME_TYPE } from '../../../src/nest-mcp';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { McpAppsService } from '../../../src/nest/mcp-apps/mcp-apps.service';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createMcpHarness, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';
import { MCP_APP_WIDGETS, mcpAppUri } from '@trek/shared';

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const HTML = '<!doctype html><title>widget</title>';

let app: Awaited<ReturnType<typeof bootTestApp>>;
let orm: MikroORM;
let userId: number;
let harness: McpHarness | null = null;

/** The admin switch, flipped the way the admin route does, inside a request context of its own. */
const setApps = (enabled: boolean) => withRequestContext(orm, () => app.get(AddonsService).updateMcpApps(enabled));
const offered = () => withRequestContext(orm, () => app.get(McpAppsService).offeredToSessions());

beforeAll(async () => {
  app = await bootTestApp();
  orm = app.get(MikroORM);
  await setAddonEnabled(orm, ADDON_IDS.MCP, true);
  userId = (await makeUser(orm)).user.id;
});

beforeEach(() => {
  // The widget documents come from the mcp-apps build, which the server suite does not run.
  vi.spyOn(app.get(McpAppsService), 'html').mockReturnValue(HTML);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await setApps(true);
  await harness?.cleanup();
  harness = null;
});

type ListedTool = Awaited<ReturnType<McpHarness['client']['listTools']>>['tools'][number];

describe('MCP Apps resources', () => {
  it('MCPAPPS-RES-001: serves every widget with the MCP Apps MIME type and a sandbox policy', async () => {
    const session = await createMcpHarness({ userId });
    harness = session;
    const listed = (await session.client.listResources()).resources;
    const reads = await Promise.all(
      MCP_APP_WIDGETS.map((widget) => session.client.readResource({ uri: mcpAppUri(widget) })),
    );
    for (const [i, widget] of MCP_APP_WIDGETS.entries()) {
      expect(listed.find((r) => r.uri === mcpAppUri(widget))?.mimeType).toBe(MCP_APP_MIME_TYPE);
      const [content] = reads[i].contents;
      expect(content).toMatchObject({ mimeType: MCP_APP_MIME_TYPE, text: HTML });
      expect(content._meta).toMatchObject({
        ui: { prefersBorder: true, csp: { resourceDomains: expect.arrayContaining([expect.any(String)]) } },
      });
    }
  });

  it('MCPAPPS-RES-002: every view a tool points at is a resource the session serves', async () => {
    harness = await createMcpHarness({ userId });
    const uris = new Set((await harness.client.listResources()).resources.map((r) => r.uri));
    const tools: ListedTool[] = (await harness.client.listTools()).tools;
    const pointed = tools
      .map((tool) => (tool._meta?.ui as { resourceUri?: string } | undefined)?.resourceUri)
      .filter((uri): uri is string => !!uri);
    expect(pointed.length).toBeGreaterThan(0);
    for (const uri of pointed) expect(uris.has(uri), uri).toBe(true);
  });

  it('MCPAPPS-RES-003: the admin switch and a missing build take the views away', async () => {
    expect(await offered()).toBe(true);
    await setApps(false);
    expect(await offered()).toBe(false);
    harness = await createMcpHarness({ userId });
    const uris = (await harness.client.listResources()).resources.map((r) => r.uri);
    expect(uris).not.toContain(mcpAppUri('trip-list'));
    await setApps(true);
    vi.mocked(app.get(McpAppsService).html).mockReturnValue(null);
    expect(await offered()).toBe(false);
  });
});

describe('Tool: list_trips view', () => {
  it('MCPAPPS-TRIPS-001: points at the trip list and carries the TREK address outside the text', async () => {
    await makeTrip(orm, userId, { title: 'Azores' });
    harness = await createMcpHarness({ userId });
    const listTrips = (await harness.client.listTools()).tools.find((t) => t.name === 'list_trips');
    expect(listTrips?._meta).toMatchObject({ ui: { resourceUri: mcpAppUri('trip-list') } });
    const result = await harness.client.callTool({ name: 'list_trips', arguments: {} });
    expect(result._meta).toEqual({ 'trek/appUrl': expect.stringMatching(/^https?:\/\//) });
    const text = (result.content as Array<{ text: string }>)[0].text;
    expect(JSON.parse(text)).toEqual(result.structuredContent);
  });
});
