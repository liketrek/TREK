// FE-OAUTH-SCOPES-001 to FE-OAUTH-SCOPES-015
import { CORE_CLIENT_SCOPES, ALL_SCOPES as SHARED_SCOPES } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  ALL_SCOPES,
  getScopesByGroup,
  PRESET_OPT_IN_ONLY,
  PRESET_SCOPES_DEFAULT,
  PRESET_SCOPES_READONLY,
  SCOPE_GROUP_NAMES,
  SCOPE_GROUPS,
} from './oauthScopes';

// The consent page reads the catalogue the server checks (@trek/shared), so
// compare against that list directly.
function readServerScopes(): string[] {
  return [...SHARED_SCOPES];
}

describe('SCOPE_GROUPS', () => {
  it('FE-OAUTH-SCOPES-001: contains all expected scope keys', () => {
    const expected = [
      'trips:read',
      'trips:write',
      'trips:delete',
      'trips:share',
      'places:read',
      'places:write',
      'collections:read',
      'collections:write',
      'atlas:read',
      'atlas:write',
      'packing:read',
      'packing:write',
      'todos:read',
      'todos:write',
      'budget:read',
      'budget:write',
      'reservations:read',
      'reservations:write',
      'collab:read',
      'collab:write',
      'notifications:read',
      'notifications:write',
      'vacay:read',
      'vacay:write',
      'geo:read',
      'weather:read',
      'journey:read',
      'journey:write',
      'journey:share',
      'tours:read',
      'tours:write',
      'roadtrip:read',
      'roadtrip:write',
      'studio:read',
      'studio:write',
      'plugins:use',
    ];
    for (const scope of expected) {
      expect(SCOPE_GROUPS).toHaveProperty(scope);
    }
  });

  it('FE-OAUTH-SCOPES-002: each scope entry has labelKey, descriptionKey, groupKey', () => {
    for (const [scope, keys] of Object.entries(SCOPE_GROUPS)) {
      expect(keys.labelKey, `${scope} missing labelKey`).toBeTruthy();
      expect(keys.descriptionKey, `${scope} missing descriptionKey`).toBeTruthy();
      expect(keys.groupKey, `${scope} missing groupKey`).toBeTruthy();
    }
  });
});

describe('ALL_SCOPES', () => {
  it('FE-OAUTH-SCOPES-003: contains exactly as many scopes as the server defines', () => {
    expect(ALL_SCOPES).toHaveLength(readServerScopes().length);
  });

  it('FE-OAUTH-SCOPES-011: matches the catalogue in @trek/shared exactly', () => {
    const serverScopes = readServerScopes();
    // Guards the parse itself: a moved file or a reformatted list must fail
    // here rather than quietly compare two empty sets.
    expect(serverScopes.length).toBeGreaterThan(0);
    expect(new Set(ALL_SCOPES)).toEqual(new Set(serverScopes));
  });

  it('FE-OAUTH-SCOPES-004: matches Object.keys(SCOPE_GROUPS)', () => {
    expect(ALL_SCOPES).toEqual(Object.keys(SCOPE_GROUPS));
  });
});

describe('SCOPE_GROUP_NAMES', () => {
  it('FE-OAUTH-SCOPES-005: contains no duplicate group names', () => {
    expect(SCOPE_GROUP_NAMES).toHaveLength(new Set(SCOPE_GROUP_NAMES).size);
  });

  it('FE-OAUTH-SCOPES-006: contains expected groups', () => {
    const expected = [
      'oauth.scope.group.trips',
      'oauth.scope.group.places',
      'oauth.scope.group.packing',
      'oauth.scope.group.budget',
    ];
    for (const g of expected) {
      expect(SCOPE_GROUP_NAMES).toContain(g);
    }
  });
});

describe('getScopesByGroup', () => {
  const identity = (key: string) => key;

  it('FE-OAUTH-SCOPES-007: groups all scopes under the correct group key', () => {
    const groups = getScopesByGroup(identity);
    // Every scope must appear exactly once across all groups
    const allScopesInGroups = Object.values(groups)
      .flat()
      .map((s) => s.scope);
    expect(allScopesInGroups).toHaveLength(ALL_SCOPES.length);
    for (const scope of ALL_SCOPES) {
      expect(allScopesInGroups).toContain(scope);
    }
  });

  it('FE-OAUTH-SCOPES-008: each item has scope, label, description, group', () => {
    const groups = getScopesByGroup(identity);
    for (const items of Object.values(groups)) {
      for (const item of items) {
        expect(item.scope).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.description).toBeTruthy();
        expect(item.group).toBeTruthy();
      }
    }
  });

  it('FE-OAUTH-SCOPES-009: trips group contains trips:read and trips:write', () => {
    const groups = getScopesByGroup(identity);
    const tripsGroup = groups['oauth.scope.group.trips'];
    expect(tripsGroup).toBeDefined();
    const scopeNames = tripsGroup.map((s) => s.scope);
    expect(scopeNames).toContain('trips:read');
    expect(scopeNames).toContain('trips:write');
  });

  it('FE-OAUTH-SCOPES-010: uses translated group name as key', () => {
    const t = (key: string) => (key === 'oauth.scope.group.trips' ? 'Trips' : key);
    const groups = getScopesByGroup(t);
    expect(groups['Trips']).toBeDefined();
    expect(groups['oauth.scope.group.trips']).toBeUndefined();
  });
});

describe('client presets', () => {
  // The presets tick the core set; a scope that runs third-party code must
  // never be among them, so the exclusion gets a test.
  it('FE-OAUTH-SCOPES-012: never offers an opt-in-only scope by default', () => {
    expect(PRESET_OPT_IN_ONLY.size).toBeGreaterThan(0);
    for (const scope of PRESET_OPT_IN_ONLY) {
      expect(PRESET_SCOPES_DEFAULT).not.toContain(scope);
      expect(PRESET_SCOPES_READONLY).not.toContain(scope);
    }
  });

  it('FE-OAUTH-SCOPES-013: ticks the core set, never a delete, and leaves the heavier groups one tick away', () => {
    expect(PRESET_SCOPES_DEFAULT).toEqual([...CORE_CLIENT_SCOPES]);
    expect(PRESET_SCOPES_DEFAULT).toContain('trips:write');
    expect(PRESET_SCOPES_DEFAULT.some((s) => s.includes(':delete'))).toBe(false);
    for (const optIn of ['tours:write', 'roadtrip:write', 'studio:write', 'journey:read', 'collections:read']) {
      expect(PRESET_SCOPES_DEFAULT).not.toContain(optIn);
      expect(ALL_SCOPES).toContain(optIn);
    }
  });

  it('FE-OAUTH-SCOPES-015: derives the i18n keys from the scope and its group', () => {
    expect(SCOPE_GROUPS['roadtrip:write']).toEqual({
      labelKey: 'oauth.scope.roadtrip:write.label',
      descriptionKey: 'oauth.scope.roadtrip:write.description',
      groupKey: 'oauth.scope.group.roadtrip',
    });
  });

  it('FE-OAUTH-SCOPES-014: the read-only preset stays read-only', () => {
    expect(PRESET_SCOPES_READONLY.every((s) => s.endsWith(':read'))).toBe(true);
  });
});
