/**
 * The sandbox origin the view resources name for Claude: only for a Claude
 * client, and only while APP_URL is the https address the MCP server answers
 * at, since Claude derives the origin from that exact URL.
 */
import { claudeUiDomain } from '../../../../src/nest-mcp/ui-meta';
import { sandboxDomain } from '../../../../src/nest/mcp-apps/mcp-apps.mcp';

import { afterEach, describe, expect, it } from 'vitest';

const ctx = (client: string | null) => ({ userId: 1, scopes: null, isStaticToken: false, client: () => client });

afterEach(() => {
  delete process.env.APP_URL;
});

describe('sandboxDomain', () => {
  it('SANDBOX-001: names Claude’s domain for the server’s /mcp URL', () => {
    process.env.APP_URL = 'https://trek.example/';
    expect(sandboxDomain(ctx('claude-ai'))).toBe(claudeUiDomain('https://trek.example/mcp'));
  });

  it('SANDBOX-002: names none for another host, before the handshake, or outside a session', () => {
    process.env.APP_URL = 'https://trek.example';
    expect(sandboxDomain(ctx('chatgpt'))).toBeUndefined();
    expect(sandboxDomain(ctx(null))).toBeUndefined();
    expect(sandboxDomain({ userId: 1, scopes: null, isStaticToken: false })).toBeUndefined();
  });

  it('SANDBOX-003: names none while APP_URL is not an https address the MCP server answers at', () => {
    process.env.APP_URL = 'http://trek.lan:3001';
    expect(sandboxDomain(ctx('claude-ai'))).toBeUndefined();
    process.env.APP_URL = 'http://localhost:3001';
    expect(sandboxDomain(ctx('claude-ai'))).toBeUndefined();
  });
});
