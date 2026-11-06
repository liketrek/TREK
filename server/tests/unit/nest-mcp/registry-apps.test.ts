/**
 * The `apps` attach option: a session with the interactive apps switched off
 * advertises no widget, while the rest of a tool's `_meta` stays.
 */
import { createTestRegistry, McpController, Tool, uiTool } from '../../../src/nest-mcp';
import { createAttachHarness, type AttachHarness } from './harness';

import { afterEach, describe, expect, it } from 'vitest';

const URI = 'ui://trek/fixture.html';

@McpController()
class AppsFixtureMcp {
  @Tool({ name: 'widget_tool', title: 'Widget', inputSchema: {}, _meta: { ...uiTool(URI), 'trek/kept': true } })
  async widget() {
    return { content: [{ type: 'text', text: 'ok' }] };
  }
}

const registry = createTestRegistry([new AppsFixtureMcp()]);
let harness: AttachHarness | null = null;

afterEach(async () => {
  await harness?.cleanup();
  harness = null;
});

const metaOf = async (h: AttachHarness) => (await h.client.listTools()).tools[0]._meta;

describe('McpRegistry.attach apps', () => {
  it('MCPAPPS-001: advertises the widget by default', async () => {
    harness = await createAttachHarness(registry, { userId: 1 });
    expect(await metaOf(harness)).toMatchObject({ ui: { resourceUri: URI }, 'openai/outputTemplate': URI });
  });

  it('MCPAPPS-002: strips the widget keys when the session has apps off', async () => {
    harness = await createAttachHarness(registry, { userId: 1 }, { apps: false });
    expect(await metaOf(harness)).toEqual({ 'trek/kept': true });
  });
});
