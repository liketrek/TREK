/**
 * MCP-GATE-PARITY-001..002 — the list of MCP-gated addons against the gates.
 *
 * `MCP_GATED_ADDON_IDS` decides whether switching an addon off tears down the
 * live MCP sessions. A `when:` gate is evaluated once per session, at attach
 * time, so a client that connected while the addon was on keeps its tools
 * registered and callable afterwards — while the REST half answers 404 for the
 * same user in the same moment. An addon missing from the list is that hole.
 *
 * It was a hand-kept list and it had drifted: airtrail and collections gate
 * tools and were not on it. Read out of the source rather than out of the
 * module registry on purpose — a runtime set would only contain the gates whose
 * modules the caller happened to import, so it would pass in a suite that
 * imports none, which is exactly the shape of test that hid this.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { ADDON_IDS, MCP_GATED_ADDON_IDS } from '../../../src/addons';

const SRC = join(__dirname, '../../../src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

/** Every addon id named by an addonGate(...) or collabFeatureGate(...) call. */
function gatedInSource(): { ids: Set<string>; where: Map<string, string[]> } {
  const ids = new Set<string>();
  const where = new Map<string, string[]>();
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\baddonGate\(\s*ADDON_IDS\.([A-Z_]+)\s*\)/g)) {
      const id = (ADDON_IDS as Record<string, string>)[m[1]];
      if (!id) continue;
      ids.add(id);
      where.set(id, [...(where.get(id) ?? []), file]);
    }
    // Collab's sub-features ride the collab addon on top of their own flag.
    if (/\bcollabFeatureGate\(/.test(text) && !file.endsWith('addon-gate.ts')) {
      ids.add(ADDON_IDS.COLLAB);
      where.set(ADDON_IDS.COLLAB, [...(where.get(ADDON_IDS.COLLAB) ?? []), file]);
    }
  }
  return { ids, where };
}

describe('MCP-gated addons', () => {
  it('MCP-GATE-PARITY-001: every addon that gates a tool is on the list', () => {
    const { ids, where } = gatedInSource();
    const listed = new Set<string>(MCP_GATED_ADDON_IDS);

    const missing = [...ids].filter(id => !listed.has(id)).sort();
    expect(
      missing,
      missing.length
        ? `gated but not listed: ${missing.map(id => `${id} (${where.get(id)?.[0]})`).join(', ')}`
        : '',
    ).toEqual([]);
  });

  it('MCP-GATE-PARITY-002: nothing on the list is there for no reason', () => {
    // The other direction, so a removed gate does not leave an entry behind that
    // tears down every session for nothing. `mcp` is the exception: it gates the
    // whole surface rather than any single tool, so it appears in no gate call.
    const { ids } = gatedInSource();
    const spurious = MCP_GATED_ADDON_IDS.filter(id => id !== ADDON_IDS.MCP && !ids.has(id)).sort();
    expect(spurious, spurious.length ? `listed but nothing gates on it: ${spurious.join(', ')}` : '').toEqual([]);
  });

  it('MCP-GATE-PARITY-003: the source scan finds gates at all', () => {
    // Guards the guard: a regex that matched nothing would make both cases pass
    // on an empty set and quietly stop testing anything.
    const { ids } = gatedInSource();
    expect(ids.size).toBeGreaterThanOrEqual(5);
    expect(ids.has(ADDON_IDS.ROADTRIP)).toBe(true);
  });
});
