/**
 * The instructions a session's initialize answers with, per reference session
 * (the same four lint:mcp-surface measures, every add-on on), kept as readable
 * files under __instructions__/ so a change to the wording shows in review.
 */
import { ADDON_IDS } from '../../../src/addons';
import { ALL_SCOPES, CORE_CLIENT_SCOPES } from '../../../src/mcp/scopes';
import { buildInstructions } from '../../../src/nest/mcp-transport/mcp-instructions';

import { describe, expect, it } from 'vitest';

const ALL_ADDONS = new Set<string>(Object.values(ADDON_IDS));

const SESSIONS: Record<string, readonly string[] | null> = {
  full: null,
  core: CORE_CLIENT_SCOPES,
  readonly: ALL_SCOPES.filter((s) => s.endsWith(':read')),
  trips: ['trips:read', 'trips:write'],
};

describe('buildInstructions', () => {
  it.each(Object.entries(SESSIONS))('INSTR-001 %s session', async (name, scopes) => {
    const text = buildInstructions({ addons: ALL_ADDONS, scopes, hostSupportsApps: false });
    await expect(text).toMatchFileSnapshot(`__instructions__/${name}.md`);
  });

  it('INSTR-002: a host that renders MCP Apps is told the views are companions', async () => {
    const text = buildInstructions({ addons: ALL_ADDONS, scopes: CORE_CLIENT_SCOPES, hostSupportsApps: true });
    expect(text).toContain('## Interactive views');
    expect(buildInstructions({ addons: ALL_ADDONS, scopes: null, hostSupportsApps: false })).not.toContain(
      'Interactive views',
    );
  });

  it('INSTR-003: names only what the session reaches: an add-on switched on and a scope granted', () => {
    const core = buildInstructions({ addons: ALL_ADDONS, scopes: CORE_CLIENT_SCOPES, hostSupportsApps: false });
    expect(core).toContain('**Budget**');
    expect(core).not.toContain('**Tour**');
    expect(core).not.toContain('**Journey**');
    const offline = buildInstructions({ addons: new Set(), scopes: null, hostSupportsApps: false });
    expect(offline).not.toContain('## Add-on features');
    expect(offline).not.toContain('**Packing item**');
    expect(offline).toContain('**File**');
    const full = buildInstructions({ addons: ALL_ADDONS, scopes: null, hostSupportsApps: false });
    for (const word of ['**Tour**', '**Road trip**', '**Book**', '**Collection**', 'get_help_page']) {
      expect(full).toContain(word);
    }
  });

  it('INSTR-004: is shorter for a core client than for full access', () => {
    const full = buildInstructions({ addons: ALL_ADDONS, scopes: null, hostSupportsApps: false });
    const trips = buildInstructions({ addons: ALL_ADDONS, scopes: SESSIONS.trips, hostSupportsApps: false });
    expect(trips.length).toBeLessThan(full.length);
  });
});
