import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import { ChevronRight, MoreHorizontal, Plus, Search, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { normalizeAppearance } from '@trek/shared'
import { useNavItems, splitMobileNav } from '../../components/Layout/navItems'
import { isNavItemActive, useCreateAction } from '../../components/Layout/useCreateAction'
import MFab from './MFab'

interface NavItem { to: string; label: string; icon: LucideIcon }

/**
 * Floating glass dock of the mobile shell. Same tab/gating/"+" logic as the
 * legacy BottomNav (addons, ?create= contract), redesigned as the demo's icon
 * dock: 42px circles, active on the --m-act pill, Journey/Collections and page
 * plugins behind the "More" popover, and a context FAB in the middle (search
 * on the atlas, disabled logo slot on settings/admin).
 */
export default function MBottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  // The "+" result is unused on /vacay: that screen draws its own centre FAB, so
  // the dock yields the slot instead (see screenFabSlot below, #1811).
  const create = useCreateAction(true)
  const [moreOpen, setMoreOpen] = useState(false)

  // Close the popover when the route changes underneath it (browser back etc.).
  useEffect(() => setMoreOpen(false), [location.pathname])

  // The dock split + order is user-configurable (Settings → Appearance → Mobile);
  // an un-customised account falls back to the built-in Dashboard + vacay/atlas
  // dock with everything else under "More".
  const navItems = useNavItems()
  const appearance = useSettingsStore(s => s.settings.appearance)
  const split = splitMobileNav(navItems, normalizeAppearance(appearance).mobileNav)

  const dockItems: NavItem[] = split.bar
  const moreItems: NavItem[] = split.more

  const isActive = (to: string) => isNavItemActive(location.pathname, to)
  const moreActive = moreItems.some(item => isActive(item.to))

  // The FAB gives way to a decorative logo slot on screens without an add
  // action (settings/admin, demo Z. 1372/1429).
  const logoSlot = location.pathname.startsWith('/settings') || location.pathname.startsWith('/admin')
  const searchFab = location.pathname.startsWith('/atlas')
  // /vacay owns the centre slot itself: MVacay draws its year/edit toggle into
  // exactly this 56px circle. The dock keeps the geometry but stays empty there,
  // so the generic "+" can never sit underneath as a second, different action:
  // not while the lazy screen chunk loads, and not while its data loads (#1811).
  const screenFabSlot = location.pathname.startsWith('/vacay')

  // Split so the raised centre slot sits dead centre; the More slot always
  // closes the right group.
  const slotCount = dockItems.length + (moreItems.length > 0 ? 1 : 0)
  const splitAt = Math.ceil(slotCount / 2)
  const left = dockItems.slice(0, splitAt)
  const right = dockItems.slice(splitAt)

  const circleCls = (active: boolean) =>
    `flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full ${
      active ? 'bg-m-act text-m-actfg' : 'text-m-muted'
    }`

  const renderItem = ({ to, label, icon: Icon }: NavItem) => {
    const active = isActive(to)
    // Fixed sizes per slot (demo): the dashboard grid is 18/2.1, every other
    // slot 21/1.9 — independent of the active state.
    const dash = to === '/dashboard'
    return (
      <button
        key={to}
        type="button"
        onClick={() => navigate(to)}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={circleCls(active)}
      >
        <Icon size={dash ? 18 : 21} strokeWidth={dash ? 2.1 : 1.9} />
      </button>
    )
  }

  return (
    <>
      {moreOpen && (
        // Invisible scrim (the popover sits on the UI without dimming it).
        <div className="fixed inset-0 z-[60]" role="presentation" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-4 flex flex-col gap-2 rounded-[26px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[10px] shadow-[0_-8px_40px_-14px_rgba(0,0,0,.45)] backdrop-blur-[30px] backdrop-saturate-[1.8] bottom-[calc(env(safe-area-inset-bottom,0px)+86px)]"
            role="presentation"
            onClick={e => e.stopPropagation()}
          >
            {moreItems.map(({ to, label, icon: Icon }) => (
              <button
                key={to}
                type="button"
                onClick={() => { setMoreOpen(false); navigate(to) }}
                className="flex items-center gap-[13px] rounded-[18px] bg-[color:var(--m-ic)] px-4 py-[14px] text-start"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[color:var(--m-ic)] text-m-ink">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="block min-w-0 flex-1 truncate text-[0.9375rem] font-extrabold text-m-ink">{label}</span>
                <ChevronRight size={17} strokeWidth={2} className="flex-none text-m-faint" />
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-4 z-40 flex h-[62px] items-center rounded-[31px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-3 shadow-[0_16px_44px_-14px_rgba(0,0,0,.35)] backdrop-blur-[30px] backdrop-saturate-[1.8] bottom-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <div className="flex min-w-0 flex-1 items-center justify-around">{left.map(renderItem)}</div>

        {logoSlot ? (
          <span aria-hidden="true" className="mx-2 flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] opacity-70">
            <img src="/icons/icon-dark.svg" alt="" className="block h-6 w-6 opacity-75 dark:hidden" />
            <img src="/icons/icon-white.svg" alt="" className="hidden h-6 w-6 opacity-75 dark:block" />
          </span>
        ) : screenFabSlot ? (
          // Same box as MFab (56px, flex-none, mx-2) so both tab groups keep
          // sitting symmetrically around the centre in every dock configuration.
          <span aria-hidden="true" className="mx-2 h-14 w-14 flex-none" />
        ) : (
          <MFab onClick={create.run} ariaLabel={create.label} className="mx-2">
            {searchFab
              ? <Search size={24} strokeWidth={2.4} />
              : create.upload
                ? <Upload size={23} strokeWidth={2.4} />
                : <Plus size={26} strokeWidth={2.4} />}
          </MFab>
        )}

        <div className="flex min-w-0 flex-1 items-center justify-around">
          {right.map(renderItem)}
          {moreItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(v => !v)}
              aria-label={t('mobileNav.more')}
              aria-expanded={moreOpen}
              aria-current={moreActive ? 'page' : undefined}
              className={circleCls(moreActive)}
            >
              <MoreHorizontal size={21} strokeWidth={1.9} />
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
