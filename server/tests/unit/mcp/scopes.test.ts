/**
 * Unit tests for MCP scope helper functions in server/src/mcp/scopes.ts.
 * No DB or mocks needed — pure functions only.
 */
import { describe, it, expect } from 'vitest';
import {
  validateScopes,
  canReadTrips,
  canWrite,
  canRead,
  canDeleteTrips,
  canShareTrips,
  ALL_SCOPES,
  SCOPE_INFO,
} from '../../../src/mcp/scopes';

// ---------------------------------------------------------------------------
// ALL_SCOPES
// ---------------------------------------------------------------------------

describe('ALL_SCOPES', () => {
  it('contains expected scope strings', () => {
    expect(ALL_SCOPES).toContain('trips:read');
    expect(ALL_SCOPES).toContain('trips:write');
    expect(ALL_SCOPES).toContain('trips:delete');
    expect(ALL_SCOPES).toContain('trips:share');
    expect(ALL_SCOPES).toContain('places:read');
    expect(ALL_SCOPES).toContain('places:write');
    expect(ALL_SCOPES).toContain('atlas:read');
    expect(ALL_SCOPES).toContain('atlas:write');
    expect(ALL_SCOPES).toContain('budget:read');
    expect(ALL_SCOPES).toContain('budget:write');
    expect(ALL_SCOPES).toContain('packing:read');
    expect(ALL_SCOPES).toContain('packing:write');
    expect(ALL_SCOPES).toContain('todos:read');
    expect(ALL_SCOPES).toContain('todos:write');
    expect(ALL_SCOPES).toContain('collab:read');
    expect(ALL_SCOPES).toContain('collab:write');
    expect(ALL_SCOPES).toContain('geo:read');
    expect(ALL_SCOPES).toContain('weather:read');
    expect(ALL_SCOPES).not.toContain('media:read');
  });

  it('is a non-empty array', () => {
    expect(Array.isArray(ALL_SCOPES)).toBe(true);
    expect(ALL_SCOPES.length).toBeGreaterThan(0);
  });

  it('derives exactly the 14 known scope groups (ScopeGroup lockstep)', () => {
    // The runtime half of the ScopeGroup lockstep — the type half is
    // MCP_ACCESS_GROUPS_MATCH_SCOPE_GROUPS in src/mcp/nest-mcp-policy.ts,
    // covered by `npm run typecheck`. If this list changes, the MCP
    // access-group union and boot gate change with it — update deliberately.
    const groups = [...new Set(ALL_SCOPES.map((s) => s.split(':')[0]))].sort();
    expect(groups).toEqual([
      'atlas',
      'budget',
      'collab',
      'collections',
      'geo',
      'journey',
      'notifications',
      'packing',
      'places',
      'reservations',
      'todos',
      'trips',
      'vacay',
      'weather',
    ]);
  });

  it('has no :write scope for the read-only geo and weather groups', () => {
    expect(ALL_SCOPES).not.toContain('geo:write');
    expect(ALL_SCOPES).not.toContain('weather:write');
    expect(ALL_SCOPES).toContain('geo:read');
    expect(ALL_SCOPES).toContain('weather:read');
  });
});

// ---------------------------------------------------------------------------
// SCOPE_INFO
// ---------------------------------------------------------------------------

describe('SCOPE_INFO', () => {
  it('has label, description, and group for trips:read', () => {
    const info = SCOPE_INFO['trips:read'];
    expect(typeof info.label).toBe('string');
    expect(typeof info.description).toBe('string');
    expect(typeof info.group).toBe('string');
    expect(info.group).toBe('Trips');
  });

  it('has label, description, and group for budget:write', () => {
    const info = SCOPE_INFO['budget:write'];
    expect(typeof info.label).toBe('string');
    expect(typeof info.description).toBe('string');
    expect(info.group).toBe('Budget');
  });

  it('has label, description, and group for packing:read', () => {
    const info = SCOPE_INFO['packing:read'];
    expect(info.group).toBe('Packing');
  });

  it('has an entry for every scope in ALL_SCOPES', () => {
    for (const scope of ALL_SCOPES) {
      expect(SCOPE_INFO[scope]).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// validateScopes
// ---------------------------------------------------------------------------

describe('validateScopes', () => {
  it('returns valid=true and empty invalid array for all valid scopes', () => {
    const result = validateScopes(['trips:read', 'budget:write']);
    expect(result.valid).toBe(true);
    expect(result.invalid).toEqual([]);
  });

  it('returns valid=false and lists invalid scopes', () => {
    const result = validateScopes(['trips:read', 'invalid:scope']);
    expect(result.valid).toBe(false);
    expect(result.invalid).toContain('invalid:scope');
    expect(result.invalid).not.toContain('trips:read');
  });

  it('returns valid=false for completely unknown scopes', () => {
    const result = validateScopes(['foo:bar', 'baz:qux']);
    expect(result.valid).toBe(false);
    expect(result.invalid).toEqual(['foo:bar', 'baz:qux']);
  });

  it('returns valid=true for empty array', () => {
    const result = validateScopes([]);
    expect(result.valid).toBe(true);
    expect(result.invalid).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// canReadTrips
// ---------------------------------------------------------------------------

describe('canReadTrips', () => {
  it('returns true when scopes is null (full access)', () => {
    expect(canReadTrips(null)).toBe(true);
  });

  it('returns true when trips:read is present', () => {
    expect(canReadTrips(['trips:read'])).toBe(true);
  });

  it('returns true when trips:write is present', () => {
    expect(canReadTrips(['trips:write'])).toBe(true);
  });

  it('returns true when trips:delete is present', () => {
    expect(canReadTrips(['trips:delete'])).toBe(true);
  });

  it('returns true when trips:share is present', () => {
    expect(canReadTrips(['trips:share'])).toBe(true);
  });

  it('returns false when only unrelated scopes are present', () => {
    expect(canReadTrips(['budget:read', 'packing:write'])).toBe(false);
  });

  it('returns false for empty scopes array', () => {
    expect(canReadTrips([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canWrite
// ---------------------------------------------------------------------------

describe('canWrite', () => {
  it('returns true when scopes is null', () => {
    expect(canWrite(null, 'trips')).toBe(true);
  });

  it('returns true when group:write is present', () => {
    expect(canWrite(['trips:write'], 'trips')).toBe(true);
    expect(canWrite(['budget:write'], 'budget')).toBe(true);
    expect(canWrite(['packing:write'], 'packing')).toBe(true);
  });

  it('returns false when only group:read is present', () => {
    expect(canWrite(['trips:read'], 'trips')).toBe(false);
  });

  it('returns false when a different group write is present', () => {
    expect(canWrite(['budget:write'], 'trips')).toBe(false);
  });

  it('returns false for empty scopes array', () => {
    expect(canWrite([], 'trips')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canRead
// ---------------------------------------------------------------------------

describe('canRead', () => {
  it('returns true when scopes is null', () => {
    expect(canRead(null, 'budget')).toBe(true);
  });

  it('returns true when group:read is present', () => {
    expect(canRead(['budget:read'], 'budget')).toBe(true);
  });

  it('returns true when group:write is present (write implies read)', () => {
    expect(canRead(['budget:write'], 'budget')).toBe(true);
  });

  it('returns false when neither read nor write for group is present', () => {
    expect(canRead(['trips:read', 'packing:write'], 'budget')).toBe(false);
  });

  it('returns false for empty scopes array', () => {
    expect(canRead([], 'collab')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canDeleteTrips
// ---------------------------------------------------------------------------

describe('canDeleteTrips', () => {
  it('returns true when scopes is null', () => {
    expect(canDeleteTrips(null)).toBe(true);
  });

  it('returns true when trips:delete is present', () => {
    expect(canDeleteTrips(['trips:delete'])).toBe(true);
  });

  it('returns false when only trips:write is present', () => {
    expect(canDeleteTrips(['trips:write'])).toBe(false);
  });

  it('returns false when only trips:read is present', () => {
    expect(canDeleteTrips(['trips:read'])).toBe(false);
  });

  it('returns false for unrelated scopes', () => {
    expect(canDeleteTrips(['budget:write', 'packing:read'])).toBe(false);
  });

  it('returns false for empty scopes array', () => {
    expect(canDeleteTrips([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canShareTrips
// ---------------------------------------------------------------------------

describe('canShareTrips', () => {
  it('returns true when scopes is null (full access)', () => {
    expect(canShareTrips(null)).toBe(true);
  });

  it('returns true when trips:share is present', () => {
    expect(canShareTrips(['trips:share'])).toBe(true);
  });

  it('returns false when only trips:read is present', () => {
    expect(canShareTrips(['trips:read'])).toBe(false);
  });

  it('returns false when only trips:write is present', () => {
    expect(canShareTrips(['trips:write'])).toBe(false);
  });

  it('returns false when only trips:delete is present', () => {
    expect(canShareTrips(['trips:delete'])).toBe(false);
  });

  it('returns false for unrelated scopes', () => {
    expect(canShareTrips(['budget:write', 'packing:read'])).toBe(false);
  });

  it('returns false for empty scopes array', () => {
    expect(canShareTrips([])).toBe(false);
  });
});
