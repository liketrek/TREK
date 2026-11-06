/**
 * The widget `_meta` TREK writes by hand, checked against what the extension's
 * own server helpers write, so a host that reads the standard keys finds them
 * where the reference SDK puts them.
 */
import {
  appCallable,
  claudeUiDomain,
  isClaudeClient,
  MCP_APP_EXTENSION_ID,
  MCP_APP_MIME_TYPE,
  uiResource,
  uiTool,
  withoutUiMeta,
} from '../../../src/nest-mcp/ui-meta';
import {
  EXTENSION_ID,
  RESOURCE_MIME_TYPE,
  RESOURCE_URI_META_KEY,
  registerAppResource,
  registerAppTool,
} from '@modelcontextprotocol/ext-apps/server';

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const URI = 'ui://trek/trip-list.html';

/** A stand-in server that keeps what the helpers hand to registerTool/registerResource. */
function recordingServer() {
  const seen: { tool?: Record<string, unknown>; resource?: Record<string, unknown> } = {};
  const server = {
    registerTool: (_name: string, config: Record<string, unknown>) => {
      seen.tool = config;
    },
    registerResource: (_name: string, _uri: string, config: Record<string, unknown>) => {
      seen.resource = config;
    },
  };
  return { server, seen };
}

describe('ui-meta parity with @modelcontextprotocol/ext-apps', () => {
  it('UIMETA-001: names the same MIME type, extension id and legacy key', () => {
    expect(MCP_APP_MIME_TYPE).toBe(RESOURCE_MIME_TYPE);
    expect(MCP_APP_EXTENSION_ID).toBe(EXTENSION_ID);
    expect(Object.keys(uiTool(URI))).toContain(RESOURCE_URI_META_KEY);
  });

  it('UIMETA-002: a tool carries the standard keys registerAppTool writes', () => {
    const { server, seen } = recordingServer();
    registerAppTool(
      server as unknown as Parameters<typeof registerAppTool>[0],
      'list_trips',
      { description: 'x', _meta: { ui: { resourceUri: URI, visibility: ['model', 'app'] } } },
      () => ({ content: [] }),
    );
    const mine = uiTool(URI, { visibility: ['model', 'app'] });
    const reference = seen.tool?._meta as Record<string, unknown>;
    expect(mine.ui).toEqual(reference.ui);
    expect(mine[RESOURCE_URI_META_KEY]).toBe(reference[RESOURCE_URI_META_KEY]);
  });

  it('UIMETA-003: a resource carries the MIME type and the ui object registerAppResource writes', () => {
    const { server, seen } = recordingServer();
    const csp = { connectDomains: [], resourceDomains: ['https://trek.example'] };
    registerAppResource(
      server as unknown as Parameters<typeof registerAppResource>[0],
      'trip-list',
      URI,
      { _meta: { ui: { csp, prefersBorder: true } } },
      () => ({ contents: [] }),
    );
    expect(seen.resource?.mimeType).toBe(MCP_APP_MIME_TYPE);
    expect(uiResource({ csp, prefersBorder: true }).ui).toEqual((seen.resource?._meta as { ui: unknown }).ui);
  });
});

describe('uiTool', () => {
  it('UIMETA-004: also writes the ChatGPT keys, and only the ones asked for', () => {
    expect(uiTool(URI)).toEqual({ ui: { resourceUri: URI }, 'ui/resourceUri': URI, 'openai/outputTemplate': URI });
    expect(uiTool(URI, { invoking: 'Reading', invoked: 'Read', visibility: ['app'] })).toMatchObject({
      'openai/toolInvocation/invoking': 'Reading',
      'openai/toolInvocation/invoked': 'Read',
      'openai/widgetAccessible': true,
    });
  });
});

describe('uiResource', () => {
  it('UIMETA-005: mirrors the CSP, border and domain under the ChatGPT keys', () => {
    expect(uiResource()).toEqual({ ui: {}, 'openai/widgetCSP': { connect_domains: [], resource_domains: [] } });
    expect(
      uiResource({ csp: { resourceDomains: ['https://a.example'] }, prefersBorder: false, domain: 'abc.example' }),
    ).toEqual({
      ui: { csp: { resourceDomains: ['https://a.example'] }, prefersBorder: false, domain: 'abc.example' },
      'openai/widgetCSP': { connect_domains: [], resource_domains: ['https://a.example'] },
      'openai/widgetPrefersBorder': false,
      'openai/widgetDomain': 'abc.example',
    });
  });
});

describe('withoutUiMeta', () => {
  it('UIMETA-006: drops every widget key and keeps the rest', () => {
    expect(withoutUiMeta(undefined)).toBeUndefined();
    expect(withoutUiMeta(uiTool(URI, { invoking: 'x' }))).toBeUndefined();
    expect(withoutUiMeta({ ...uiTool(URI), 'trek/other': 1 })).toEqual({ 'trek/other': 1 });
  });
});

describe('host polish', () => {
  it('UIMETA-007: lets a widget call a tool without pointing the tool at a view', () => {
    expect(appCallable()).toEqual({ ui: { visibility: ['model', 'app'] }, 'openai/widgetAccessible': true });
    expect(withoutUiMeta(appCallable())).toBeUndefined();
  });

  it('UIMETA-008: derives Claude’s sandbox domain from the exact server URL', () => {
    const url = 'https://trek.example/mcp';
    const hash = createHash('sha256').update(url).digest('hex');
    expect(claudeUiDomain(url)).toBe(`${hash.slice(0, 32)}.claudemcpcontent.com`);
    expect(claudeUiDomain(url)).toMatch(/^[0-9a-f]{32}\.claudemcpcontent\.com$/);
    expect(claudeUiDomain('https://trek.example/mcp/')).not.toBe(claudeUiDomain(url));
  });

  it('UIMETA-009: knows Claude’s clients by name', () => {
    expect(isClaudeClient('claude-ai')).toBe(true);
    expect(isClaudeClient('Claude Desktop')).toBe(true);
    expect(isClaudeClient('chatgpt')).toBe(false);
    expect(isClaudeClient(null)).toBe(false);
  });
});
