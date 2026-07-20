import { useMemo } from 'react'
import { LayoutGrid, CalendarDays, Globe, Compass, Bookmark, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useAddonStore } from '../../store/addonStore'
import { usePluginStore } from '../../store/pluginStore'
import { resolvePluginIcon } from '../shared/PluginIcon'

/**
 * The canonical main-navigation item model, shared by the mobile dock
 * (MBottomNav) and the appearance settings customizer, so ids/labels/icons
 * never drift between them.
 *
 * Stable ids used for persistence: `'dashboard'` (pinned), an enabled global
 * addon's id (vacay|atlas|journey|collections|future), or `'plugin:<id>'` for a
 * page plugin. Dashboard is always first and immovable.
 */
export interface NavItemDef {
  id: string
  to: string
  label: string
  icon: LucideIcon
  pinned?: boolean
}

// Signature glyphs for the four catalog global addons, keyed by id so the known
// nav items keep their icon regardless of the (string) icon the addon row ships;
// any future/unknown global addon resolves through its manifest icon name.
const ADDON_ICONS: Record<string, LucideIcon> = {
  vacay: CalendarDays,
  atlas: Globe,
  journey: Compass,
  collections: Bookmark,
}

/** The bar holds Dashboard + at most this many custom items; the rest go to More.
 * Two keeps the dock at 3 destinations (Dashboard + 2) so the More slot still fits. */
export const MOBILE_NAV_MAX_BAR = 2
/** The built-in dock next to Dashboard for an un-customised account; everything else starts under More. */
export const DEFAULT_DOCK_IDS = ['vacay', 'atlas']

export function buildNavItems(
  globalAddons: { id: string; name: string; icon: string }[],
  pagePlugins: { id: string; name: string; icon: string | null }[],
  t: (key: string) => string,
): NavItemDef[] {
  return [
    { id: 'dashboard', to: '/dashboard', label: t('nav.myTrips'), icon: LayoutGrid, pinned: true },
    ...globalAddons.map((a) => {
      const key = `admin.addons.catalog.${a.id}.name`
      const translated = t(key)
      return {
        id: a.id,
        to: `/${a.id}`,
        label: translated && translated !== key ? translated : a.name || a.id,
        icon: ADDON_ICONS[a.id] ?? resolvePluginIcon(a.icon),
      }
    }),
    ...pagePlugins.map((p) => ({
      id: `plugin:${p.id}`,
      to: `/plugins/${p.id}`,
      label: p.name,
      icon: resolvePluginIcon(p.icon),
    })),
  ]
}

/** Live, ordered nav items from the addon + plugin stores (Dashboard first). */
export function useNavItems(): NavItemDef[] {
  const { t } = useTranslation()
  const addons = useAddonStore((s) => s.addons)
  const plugins = usePluginStore((s) => s.plugins)
  return useMemo(
    () =>
      buildNavItems(
        addons.filter((a) => a.type === 'global' && a.enabled),
        plugins.filter((p) => p.type === 'page'),
        t,
      ),
    [addons, plugins, t],
  )
}

export interface MobileNavSplit {
  /** Items shown directly in the dock, Dashboard first. */
  bar: NavItemDef[]
  /** Items demoted under the "More" overflow popover. */
  more: NavItemDef[]
}

/**
 * Resolve the persisted `{ bar, more }` id split against the live nav items.
 * Dashboard is always pinned first in the bar. An empty/absent config falls back
 * to the built-in dock (Dashboard + Vacay/Atlas where enabled, everything else
 * under More) so an un-customised user sees exactly today's layout. Stored ids
 * that no longer resolve are dropped; newly available items are appended under
 * More.
 */
export function splitMobileNav(
  items: NavItemDef[],
  cfg?: { bar: string[]; more: string[] },
): MobileNavSplit {
  const dashboard = items.find((i) => i.id === 'dashboard')
  const head = dashboard ? [dashboard] : []
  const rest = items.filter((i) => i.id !== 'dashboard')

  if (!cfg || (cfg.bar.length === 0 && cfg.more.length === 0)) {
    return {
      bar: [...head, ...rest.filter((i) => DEFAULT_DOCK_IDS.includes(i.id))],
      more: rest.filter((i) => !DEFAULT_DOCK_IDS.includes(i.id)),
    }
  }

  const byId = new Map(rest.map((i) => [i.id, i]))
  const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((x): x is NavItemDef => !!x)
  const known = new Set([...cfg.bar, ...cfg.more])

  const barPicked = pick(cfg.bar)
  const fresh = rest.filter((i) => !known.has(i.id))

  return {
    bar: [...head, ...barPicked.slice(0, MOBILE_NAV_MAX_BAR)],
    more: [...barPicked.slice(MOBILE_NAV_MAX_BAR), ...pick(cfg.more), ...fresh],
  }
}
