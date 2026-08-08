import { useNavItems, splitMobileNav, MOBILE_NAV_MAX_BAR, type NavItemDef } from '../Layout/navItems'

export interface MobileNavValue {
  bar: string[]
  more: string[]
}

export type NavZone = 'bar' | 'more'

export interface MobileNavEditor {
  /** The pinned Dashboard item (always first in the bar, never editable). */
  dashboard: NavItemDef | undefined
  /** Editable bar items (Dashboard excluded). */
  barItems: NavItemDef[]
  /** Items under the "More" overflow. */
  moreItems: NavItemDef[]
  /** Dashboard + bar items — exactly what the dock renders. */
  previewBar: NavItemDef[]
  hasMore: boolean
  barFull: boolean
  /** Move an item within a zone from one index to another (drag or arrows). */
  move: (zone: NavZone, from: number, to: number) => void
  /** Demote a bar item under "More". */
  toMore: (id: string) => void
  /** Promote a "More" item into the bar (no-op when the bar is full). */
  toBar: (id: string) => void
}

/**
 * Editor logic for the mobile bottom-nav customizer, shared by the desktop and
 * mobile presentational shells. It derives the current split from the persisted
 * `{ bar, more }` id lists via splitMobileNav and returns operations that emit
 * the next value (ids only) — the caller persists it through the appearance blob.
 */
export function useMobileNavEditor(
  value: MobileNavValue,
  onChange: (next: MobileNavValue) => void,
): MobileNavEditor {
  const items = useNavItems()
  const split = splitMobileNav(items, value)
  const dashboard = split.bar.find((i) => i.id === 'dashboard')
  const barItems = split.bar.filter((i) => i.id !== 'dashboard')
  const moreItems = split.more

  const emit = (bar: NavItemDef[], more: NavItemDef[]) =>
    onChange({ bar: bar.map((i) => i.id), more: more.map((i) => i.id) })

  const reorder = (list: NavItemDef[], from: number, to: number): NavItemDef[] => {
    if (to < 0 || to >= list.length || from === to) return list
    const next = [...list]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
  }

  const move = (zone: NavZone, from: number, to: number) => {
    if (zone === 'bar') emit(reorder(barItems, from, to), moreItems)
    else emit(barItems, reorder(moreItems, from, to))
  }

  const toMore = (id: string) => {
    const item = barItems.find((i) => i.id === id)
    if (!item) return
    emit(
      barItems.filter((i) => i.id !== id),
      [...moreItems, item],
    )
  }

  const toBar = (id: string) => {
    if (barItems.length >= MOBILE_NAV_MAX_BAR) return
    const item = moreItems.find((i) => i.id === id)
    if (!item) return
    emit(
      [...barItems, item],
      moreItems.filter((i) => i.id !== id),
    )
  }

  return {
    dashboard,
    barItems,
    moreItems,
    previewBar: split.bar,
    hasMore: moreItems.length > 0,
    barFull: barItems.length >= MOBILE_NAV_MAX_BAR,
    move,
    toMore,
    toBar,
  }
}
