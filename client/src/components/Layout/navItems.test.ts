import { describe, it, expect } from 'vitest'
import { LayoutGrid } from 'lucide-react'
import { buildNavItems, splitMobileNav, type NavItemDef } from './navItems'

const item = (id: string): NavItemDef => ({ id, to: `/${id}`, label: id, icon: LayoutGrid })
const ids = (xs: NavItemDef[]) => xs.map((x) => x.id)

// Dashboard + four global addons in store order.
const items = [item('dashboard'), item('vacay'), item('atlas'), item('journey'), item('collections')]

describe('buildNavItems', () => {
  const t = (k: string) => k // untranslated → falls back to the addon/plugin name

  it('puts Dashboard first, then addons, then page plugins as plugin:<id>', () => {
    const out = buildNavItems(
      [{ id: 'vacay', name: 'Vacay', icon: 'CalendarDays' }],
      [{ id: 'foo', name: 'My Plugin', icon: null }],
      t,
    )
    expect(ids(out)).toEqual(['dashboard', 'vacay', 'plugin:foo'])
    expect(out[0].pinned).toBe(true)
    expect(out[2].to).toBe('/plugins/foo')
    expect(out[2].label).toBe('My Plugin')
  })
})

describe('splitMobileNav', () => {
  it('falls back to Dashboard + first two in the bar when there is no config', () => {
    for (const cfg of [undefined, { bar: [], more: [] }]) {
      const s = splitMobileNav(items, cfg)
      expect(ids(s.bar)).toEqual(['dashboard', 'vacay', 'atlas'])
      expect(ids(s.more)).toEqual(['journey', 'collections'])
    }
  })

  it('honours a custom split and order, Dashboard still first', () => {
    const s = splitMobileNav(items, { bar: ['journey'], more: ['collections', 'vacay', 'atlas'] })
    expect(ids(s.bar)).toEqual(['dashboard', 'journey'])
    expect(ids(s.more)).toEqual(['collections', 'vacay', 'atlas'])
  })

  it('drops stored ids that no longer exist and appends newly available ones under More', () => {
    const s = splitMobileNav(items, { bar: ['ghost', 'vacay'], more: ['journey'] })
    expect(ids(s.bar)).toEqual(['dashboard', 'vacay'])
    // atlas + collections are new since the config was saved → appended to More
    expect(ids(s.more)).toEqual(['journey', 'atlas', 'collections'])
  })

  it('caps the bar and overflows the excess into More', () => {
    const s = splitMobileNav(items, { bar: ['vacay', 'atlas', 'journey', 'collections'], more: [] })
    expect(ids(s.bar)).toEqual(['dashboard', 'vacay', 'atlas']) // Dashboard + 2
    expect(ids(s.more)).toEqual(['journey', 'collections'])
  })

  it('never lets a stored dashboard id take a bar slot from the pinned one', () => {
    const s = splitMobileNav(items, { bar: ['dashboard', 'vacay'], more: [] })
    expect(ids(s.bar)).toEqual(['dashboard', 'vacay'])
  })
})
