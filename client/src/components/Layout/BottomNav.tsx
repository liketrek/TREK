import { useNavigate, useLocation } from 'react-router'
import { useAddonStore } from '../../store/addonStore'
import { usePluginStore } from '../../store/pluginStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import { LayoutGrid, CalendarDays, Globe, Compass, Bookmark, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { resolvePluginIcon } from '../shared/PluginIcon'
import { useAuthStore } from '../../store/authStore'
import { visibleManagedNavItems } from '../../managed'
import { isNavItemActive, useCreateAction } from './useCreateAction'

const ADDON_NAV: Record<string, { icon: LucideIcon; labelKey: string }> = {
  vacay:       { icon: CalendarDays, labelKey: 'admin.addons.catalog.vacay.name' },
  atlas:       { icon: Globe,        labelKey: 'admin.addons.catalog.atlas.name' },
  journey:     { icon: Compass,      labelKey: 'admin.addons.catalog.journey.name' },
  collections: { icon: Bookmark,     labelKey: 'admin.addons.catalog.collections.name' },
}

interface NavItem { to: string; label: string; icon: LucideIcon }

export default function BottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const darkMode = useSettingsStore(s => s.settings.dark_mode)
  const dark = darkMode === true || darkMode === 'dark' || (darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const addons = useAddonStore(s => s.addons)
  const globalAddons = addons.filter(a => a.type === 'global' && a.enabled)
  // Page plugins are reachable from the mobile tab bar too, mirroring the desktop
  // nav pill (Navbar) — otherwise they were only reachable by typing /plugins/:id.
  const pagePlugins = usePluginStore(s => s.plugins).filter(p => p.type === 'page')
  const location = useLocation()
  const create = useCreateAction(false)
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')

  const items: NavItem[] = [
    { to: '/dashboard', label: t('nav.myTrips'), icon: LayoutGrid },
    ...globalAddons.flatMap(addon => {
      const nav = ADDON_NAV[addon.id]
      return nav ? [{ to: `/${addon.id}`, label: t(nav.labelKey), icon: nav.icon }] : []
    }),
    ...pagePlugins.map(p => ({ to: `/plugins/${p.id}`, label: p.name, icon: resolvePluginIcon(p.icon) })),
    // Empty in this repository — see client/src/managed.
    ...visibleManagedNavItems(isAdmin).map(m => ({ to: m.path, label: m.label, icon: m.Icon })),
  ]
  // Split the items so the raised "+" sits dead centre.
  const splitAt = Math.ceil(items.length / 2)
  const left = items.slice(0, splitAt)
  const right = items.slice(splitAt)

  const isActive = (to: string) => isNavItemActive(location.pathname, to)

  const renderItem = ({ to, label, icon: Icon }: NavItem) => {
    const active = isActive(to)
    return (
      <button type="button"
        key={to}
        onClick={() => navigate(to)}
        className="flex flex-col items-center gap-1 py-1 px-1 min-w-0"
        style={{ color: active ? (dark ? '#fff' : 'oklch(0.22 0 0)') : (dark ? 'oklch(0.6 0 0)' : 'oklch(0.62 0.01 65)') }}
      >
        <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
        <span className="text-[10px] font-semibold tracking-tight truncate max-w-full">{label}</span>
      </button>
    )
  }

  return (
    <nav
      className="md:hidden fixed z-[60] flex items-center"
      style={{
        insetInline: 12,
        bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        padding: '8px 8px',
        borderRadius: 24,
        background: dark ? 'oklch(0.2 0 0 / 0.72)' : 'rgba(255,255,255,0.78)',
        backdropFilter: 'saturate(1.7) blur(22px)',
        WebkitBackdropFilter: 'saturate(1.7) blur(22px)',
        border: dark ? '1px solid oklch(1 0 0 / .1)' : '1px solid oklch(0.92 0.008 70 / .6)',
        boxShadow: dark
          ? '0 12px 40px -8px oklch(0 0 0 / .6), inset 0 1px 0 oklch(1 0 0 / .08)'
          : '0 12px 40px -8px oklch(0 0 0 / .22), inset 0 1px 0 oklch(1 0 0 / .8)',
      }}
    >
      <div className="flex flex-1 items-center justify-around min-w-0">{left.map(renderItem)}</div>

      <button type="button"
        onClick={create.run}
        aria-label={create.label}
        className="flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        style={{
          width: 46, height: 46, marginInline: 8,
          borderRadius: '50%',
          background: dark ? '#fff' : 'oklch(0.22 0 0)',
          color: dark ? 'oklch(0.22 0 0)' : '#fff',
          boxShadow: '0 4px 12px oklch(0 0 0 / .22)',
        }}
      >
        <Plus size={24} strokeWidth={2.6} />
      </button>

      <div className="flex flex-1 items-center justify-around min-w-0">{right.map(renderItem)}</div>
    </nav>
  )
}
