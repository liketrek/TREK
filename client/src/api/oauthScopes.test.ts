// FE-OAUTH-SCOPES-001 to FE-OAUTH-SCOPES-010
import { describe, it, expect } from 'vitest'
import { SCOPE_GROUPS, ALL_SCOPES, SCOPE_GROUP_NAMES, getScopesByGroup } from './oauthScopes'

describe('SCOPE_GROUPS', () => {
  it('FE-OAUTH-SCOPES-001: contains all expected scope keys', () => {
    const expected = [
      'trips:read', 'trips:write', 'trips:delete', 'trips:share',
      'places:read', 'places:write',
      'collections:read', 'collections:write',
      'atlas:read', 'atlas:write',
      'packing:read', 'packing:write',
      'todos:read', 'todos:write',
      'budget:read', 'budget:write',
      'reservations:read', 'reservations:write',
      'collab:read', 'collab:write',
      'notifications:read', 'notifications:write',
      'vacay:read', 'vacay:write',
      'geo:read', 'weather:read',
      'journey:read', 'journey:write', 'journey:share',
    ]
    for (const scope of expected) {
      expect(SCOPE_GROUPS).toHaveProperty(scope)
    }
  })

  it('FE-OAUTH-SCOPES-002: each scope entry has labelKey, descriptionKey, groupKey', () => {
    for (const [scope, keys] of Object.entries(SCOPE_GROUPS)) {
      expect(keys.labelKey, `${scope} missing labelKey`).toBeTruthy()
      expect(keys.descriptionKey, `${scope} missing descriptionKey`).toBeTruthy()
      expect(keys.groupKey, `${scope} missing groupKey`).toBeTruthy()
    }
  })
})

describe('ALL_SCOPES', () => {
  it('FE-OAUTH-SCOPES-003: contains exactly 29 scopes', () => {
    expect(ALL_SCOPES).toHaveLength(29)
  })

  it('FE-OAUTH-SCOPES-004: matches Object.keys(SCOPE_GROUPS)', () => {
    expect(ALL_SCOPES).toEqual(Object.keys(SCOPE_GROUPS))
  })
})

describe('SCOPE_GROUP_NAMES', () => {
  it('FE-OAUTH-SCOPES-005: contains no duplicate group names', () => {
    expect(SCOPE_GROUP_NAMES).toHaveLength(new Set(SCOPE_GROUP_NAMES).size)
  })

  it('FE-OAUTH-SCOPES-006: contains expected groups', () => {
    const expected = [
      'oauth.scope.group.trips',
      'oauth.scope.group.places',
      'oauth.scope.group.packing',
      'oauth.scope.group.budget',
    ]
    for (const g of expected) {
      expect(SCOPE_GROUP_NAMES).toContain(g)
    }
  })
})

describe('getScopesByGroup', () => {
  const identity = (key: string) => key

  it('FE-OAUTH-SCOPES-007: groups all scopes under the correct group key', () => {
    const groups = getScopesByGroup(identity)
    // Every scope must appear exactly once across all groups
    const allScopesInGroups = Object.values(groups).flat().map(s => s.scope)
    expect(allScopesInGroups).toHaveLength(ALL_SCOPES.length)
    for (const scope of ALL_SCOPES) {
      expect(allScopesInGroups).toContain(scope)
    }
  })

  it('FE-OAUTH-SCOPES-008: each item has scope, label, description, group', () => {
    const groups = getScopesByGroup(identity)
    for (const items of Object.values(groups)) {
      for (const item of items) {
        expect(item.scope).toBeTruthy()
        expect(item.label).toBeTruthy()
        expect(item.description).toBeTruthy()
        expect(item.group).toBeTruthy()
      }
    }
  })

  it('FE-OAUTH-SCOPES-009: trips group contains trips:read and trips:write', () => {
    const groups = getScopesByGroup(identity)
    const tripsGroup = groups['oauth.scope.group.trips']
    expect(tripsGroup).toBeDefined()
    const scopeNames = tripsGroup.map(s => s.scope)
    expect(scopeNames).toContain('trips:read')
    expect(scopeNames).toContain('trips:write')
  })

  it('FE-OAUTH-SCOPES-010: uses translated group name as key', () => {
    const t = (key: string) => key === 'oauth.scope.group.trips' ? 'Trips' : key
    const groups = getScopesByGroup(t)
    expect(groups['Trips']).toBeDefined()
    expect(groups['oauth.scope.group.trips']).toBeUndefined()
  })
})
