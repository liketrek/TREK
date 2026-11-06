import {
  ALL_SCOPES,
  CORE_CLIENT_SCOPES,
  IMPLIED_SCOPE_GROUPS,
  impliedScopes,
  OPT_IN_ONLY_SCOPES,
  READONLY_CLIENT_SCOPES,
  scopeGroup,
  withImpliedScopes,
} from './scopes';

import { describe, expect, it } from 'vitest';

describe('scope catalogue', () => {
  it('names every scope once, as group:mode', () => {
    expect(new Set(ALL_SCOPES).size).toBe(ALL_SCOPES.length);
    for (const scope of ALL_SCOPES) expect(scope).toMatch(/^[a-z]+:[a-z]+$/);
    expect(scopeGroup('roadtrip:write')).toBe('roadtrip');
  });

  it('keeps the presets inside the catalogue and the opt-in-only scopes out of them', () => {
    for (const scope of [...CORE_CLIENT_SCOPES, ...READONLY_CLIENT_SCOPES]) {
      expect(ALL_SCOPES).toContain(scope);
      expect(OPT_IN_ONLY_SCOPES).not.toContain(scope);
    }
    expect(CORE_CLIENT_SCOPES.some((s) => /^(tours|roadtrip|studio):/.test(s))).toBe(false);
  });
});

describe('implied scopes (one release after the split)', () => {
  it('maps trips to tours and road trip, places to road trip, journey to the Studio, mode for mode', () => {
    expect(IMPLIED_SCOPE_GROUPS).toEqual({ trips: ['tours', 'roadtrip'], places: ['roadtrip'], journey: ['studio'] });
    expect(impliedScopes(['trips:read']).sort()).toEqual(['roadtrip:read', 'tours:read']);
    expect(impliedScopes(['trips:write', 'places:read']).sort()).toEqual([
      'roadtrip:read',
      'roadtrip:write',
      'tours:write',
    ]);
    expect(impliedScopes(['journey:write', 'journey:share'])).toEqual(['studio:write']);
  });

  it('implies nothing for a delete or share mode the newer group lacks, or for an unrelated group', () => {
    expect(impliedScopes(['trips:delete', 'trips:share', 'budget:write', 'nonsense'])).toEqual([]);
  });

  it('adds only what the client is allowed, and nothing twice', () => {
    const legacyClient = ['trips:read', 'trips:write', 'tours:read', 'tours:write', 'roadtrip:read'];
    expect(withImpliedScopes(['trips:write'], legacyClient)).toEqual(['trips:write', 'tours:write']);
    expect(withImpliedScopes(['trips:read', 'tours:read'], legacyClient)).toEqual([
      'trips:read',
      'tours:read',
      'roadtrip:read',
    ]);
    expect(withImpliedScopes(['trips:read', 'trips:write'], CORE_CLIENT_SCOPES)).toEqual(['trips:read', 'trips:write']);
  });
});
