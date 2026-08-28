/**
 * Grant classification behind readOnlyHint — MCPANN-001 to MCPANN-005.
 *
 * readOnlyHint is what MCP clients gate auto-approval on, so getting this wrong
 * means a tool that writes runs without asking. The classification therefore
 * fails closed, and this file pins every permission in the catalog so a new one
 * shows up here rather than as a wrong hint in production.
 *
 * An earlier denylist spelled out `db:write:` and missed `db:create:trips`.
 */
import { KNOWN_PERMISSIONS } from '../../../src/nest/plugins/protocol/envelope';
import { clampToolAnnotations } from '../../../src/nest/plugins/mcp-tool-schema';

import { describe, expect, it } from 'vitest';

/** Holding only this grant, may a tool still call itself read-only? */
const readOnly = (grant: string): boolean =>
  clampToolAnnotations({ readOnlyHint: true }, new Set([grant])).readOnlyHint;

/**
 * The permissions that leave a tool read-only. Everything else in the catalog
 * must cost the hint. Spelled out rather than derived, so this file disagrees
 * out loud with the implementation when either one moves.
 */
const EXPECTED_READ_ONLY = new Set<string>([
  'db:own',
  'events:subscribe',
  'geolocation:read',
  'rates:read',
  'weather:read',
  ...KNOWN_PERMISSIONS.filter((p) => p.startsWith('db:read:')),
  ...KNOWN_PERMISSIONS.filter((p) => p.startsWith('hook:')),
]);

describe('grant classification', () => {
  it('MCPANN-001: every permission in the catalog is classified deliberately', () => {
    const wrong = KNOWN_PERMISSIONS.filter((p) => readOnly(p) !== EXPECTED_READ_ONLY.has(p));
    expect(wrong).toEqual([]);
  });

  it('MCPANN-002: db:create:trips costs the read-only hint', () => {
    // The specific miss that motivated the flip to an allowlist.
    expect(KNOWN_PERMISSIONS).toContain('db:create:trips');
    expect(readOnly('db:create:trips')).toBe(false);
  });

  it('MCPANN-003: every write and create grant costs the hint', () => {
    const mutating = KNOWN_PERMISSIONS.filter((p) => p.startsWith('db:write:') || p.startsWith('db:create:'));
    expect(mutating.length).toBeGreaterThan(0);
    for (const p of mutating) expect(readOnly(p), p).toBe(false);
  });

  it('MCPANN-004: an unknown permission family fails closed', () => {
    // The point of the allowlist: something nobody classified must not be
    // silently treated as harmless.
    expect(readOnly('db:destroy:everything')).toBe(false);
    expect(readOnly('some:future:grant')).toBe(false);
  });

  it('MCPANN-005: a per-host egress grant is a side effect and forces openWorldHint', () => {
    const out = clampToolAnnotations({ readOnlyHint: true, openWorldHint: false }, new Set(['http:outbound:api.example.com']));
    expect(out.readOnlyHint).toBe(false);
    expect(out.openWorldHint).toBe(true);
  });
});
