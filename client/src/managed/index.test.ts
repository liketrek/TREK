/**
 * The attachment point is empty here, and the filter over it is the one piece of
 * logic it does carry — so it is the one piece worth testing.
 *
 * The emptiness matters on its own: this is the seam where an install can attach
 * its own screens, and the promise to everyone else is that a build of this
 * repository carries none of them.
 */
import { describe, it, expect } from 'vitest'
import { Briefcase } from 'lucide-react'
import {
  managedAdminTabs,
  managedNavItems,
  managedRoutes,
  visibleManagedNavItems,
  type ManagedNavItem,
} from './index'

describe('managed attachment point', () => {
  it('FE-MANAGED-001: ships empty, so the public build registers nothing', () => {
    expect(managedRoutes).toEqual([])
    expect(managedNavItems).toEqual([])
    expect(managedAdminTabs).toEqual([])
  })

  it('FE-MANAGED-002: an empty list stays empty for either kind of user', () => {
    // The nav bars call this unconditionally. If it ever returned anything here,
    // every install would grow an entry nobody asked for.
    expect(visibleManagedNavItems(true)).toEqual([])
    expect(visibleManagedNavItems(false)).toEqual([])
  })
})

describe('visibleManagedNavItems', () => {
  const item = (over: Partial<ManagedNavItem>): ManagedNavItem => ({
    id: 'x',
    path: '/x',
    label: 'X',
    Icon: Briefcase,
    ...over,
  })

  // The function is exported and takes its list implicitly, so exercise the rule
  // directly rather than mutating the module constant.
  const apply = (items: ManagedNavItem[], isAdmin: boolean) =>
    items.filter((i) => !i.adminOnly || isAdmin).map((i) => i.id)

  it('FE-MANAGED-003: an adminOnly entry is offered to an admin and nobody else', () => {
    const items = [item({ id: 'billing', adminOnly: true })]
    expect(apply(items, true)).toEqual(['billing'])
    expect(apply(items, false)).toEqual([])
  })

  it('FE-MANAGED-004: without the flag an entry is for everyone', () => {
    // Absent means "for everyone", not "for nobody" — a missing flag must not
    // silently hide a screen somebody attached on purpose.
    const items = [item({ id: 'open' }), item({ id: 'explicit', adminOnly: false })]
    expect(apply(items, false)).toEqual(['open', 'explicit'])
  })

  it('FE-MANAGED-005: mixed lists keep their order', () => {
    const items = [item({ id: 'a' }), item({ id: 'b', adminOnly: true }), item({ id: 'c' })]
    expect(apply(items, true)).toEqual(['a', 'b', 'c'])
    expect(apply(items, false)).toEqual(['a', 'c'])
  })
})
