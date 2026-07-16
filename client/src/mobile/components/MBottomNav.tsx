import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useMatch } from 'react-router-dom'
import { useAddonStore } from '../../store/addonStore'
import { usePluginStore } from '../../store/pluginStore'
import { useTranslation } from '../../i18n'
import {
  LayoutGrid, CalendarDays, Globe, Compass, Bookmark, ChevronRight, MoreHorizontal, Plus, Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { resolvePluginIcon } from '../../components/shared/PluginIcon'
import MFab from './MFab'

// Only Vacay and Atlas own a dock slot (next to Dashboard). Everything else —
// Journey, Collections, future global addons, page plugins — lives in the
// "More" popover, keeping the demo's 2 + FAB + 2 dock geometry.
const DOCK_ADDONS: Record<string, { icon: LucideIcon; labelKey: string }> = {
  vacay: { icon: CalendarDays, labelKey: 'admin.addons.catalog.vacay.name' },
  atlas: { icon: Globe, labelKey: 'admin.addons.catalog.atlas.name' },
}

// Popover rows carry the demo's addon brand tints on their 40px icon tiles.
const MORE_ROWS: Record<string, { icon: LucideIcon; labelKey: string; subKey: string; tileCls: string }> = {
  journey: {
    icon: Compass,
    labelKey: 'admin.addons.catalog.journey.name',
    subKey: 'mobileNav.journeySub',
    tileCls: 'bg-[rgba(74,125,219,.16)] text-[#4A7DDB]', // theme-lint-disable — fixed addon brand tint
  },
  collections: {
    icon: Bookmark,
    labelKey: 'admin.addons.catalog.collections.name',
    subKey: 'mobileNav.collectionsSub',
    tileCls: 'bg-[rgba(236,72,153,.16)] text-[#EC4899]', // theme-lint-disable — fixed addon brand tint
  },
}

interface NavItem { to: string; label: string; icon: LucideIcon }
interface MoreItem extends NavItem { sub?: string; tileCls: string }

// The centre "+" means something different per context: inside a trip it adds a
// place, on the journey list it starts a journey (deliberate deviation from the
// demo, which reserves the FAB for entries — the list has no journey to add
// into yet), inside a journey it adds an entry, on the atlas it opens the
// country search, on collections it adds a place to the active list —
// everywhere else it creates a new trip. Pages pick the intent up from the
// query params.
function useCreateAction(): { label: string; run: () => void } {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const inTrip = useMatch('/trips/:id')
  const inJourney = useMatch('/journey/:id')
  const onJourneyList = useMatch('/journey')
  const onAtlas = useMatch('/atlas')
  const onCollections = useMatch('/collections')

  if (inTrip) {
    // The "+" is context-aware per active tab: Bookings → reservation,
    // Transports → transport, Costs → expense. Tabs without a create modal
    // (lists / files / collab) fall through to adding a place. #1349
    const id = inTrip.params.id
    const tripTab = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`trip-tab-${id}`) : null
    if (tripTab === 'finanzplan') return { label: t('costs.addExpense'), run: () => navigate(`/trips/${id}?create=expense`) }
    if (tripTab === 'buchungen') return { label: t('reservations.addManual'), run: () => navigate(`/trips/${id}?create=reservation`) }
    if (tripTab === 'transports') return { label: t('transport.addManual'), run: () => navigate(`/trips/${id}?create=transport`) }
    return { label: t('places.addPlace'), run: () => navigate(`/trips/${id}?create=place`) }
  }
  if (inJourney) {
    return { label: t('journey.detail.addEntry'), run: () => navigate(`/journey/${inJourney.params.id}?create=entry`) }
  }
  if (onJourneyList) {
    return { label: t('journey.new'), run: () => navigate('/journey?create=1') }
  }
  if (onAtlas) {
    return { label: t('atlas.searchCountry'), run: () => navigate('/atlas?search=1') }
  }
  if (onCollections) {
    return { label: t('collections.addPlace'), run: () => navigate('/collections?create=place') }
  }
  return { label: t('dashboard.newTrip'), run: () => navigate('/dashboard?create=1') }
}

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
  const addons = useAddonStore(s => s.addons)
  const globalAddons = addons.filter(a => a.type === 'global' && a.enabled)
  // Page plugins are reachable from the mobile tab bar too, mirroring the desktop
  // nav pill (Navbar) — otherwise they were only reachable by typing /plugins/:id.
  const pagePlugins = usePluginStore(s => s.plugins).filter(p => p.type === 'page')
  const location = useLocation()
  const create = useCreateAction()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close the popover when the route changes underneath it (browser back etc.).
  useEffect(() => setMoreOpen(false), [location.pathname])

  const dockItems: NavItem[] = [
    { to: '/dashboard', label: t('nav.myTrips'), icon: LayoutGrid },
    ...Object.keys(DOCK_ADDONS)
      .filter(id => globalAddons.some(a => a.id === id))
      .map(id => ({ to: `/${id}`, label: t(DOCK_ADDONS[id].labelKey), icon: DOCK_ADDONS[id].icon })),
  ]

  const moreItems: MoreItem[] = [
    ...globalAddons
      .filter(a => !DOCK_ADDONS[a.id])
      .map(a => {
        const row = MORE_ROWS[a.id]
        return row
          ? { to: `/${a.id}`, label: t(row.labelKey), sub: t(row.subKey), icon: row.icon, tileCls: row.tileCls }
          : { to: `/${a.id}`, label: a.name || a.id, icon: Globe, tileCls: 'bg-[color:var(--m-ic)] text-m-ink' }
      }),
    ...pagePlugins.map(p => ({
      to: `/plugins/${p.id}`,
      label: p.name,
      icon: resolvePluginIcon(p.icon),
      tileCls: 'bg-[color:var(--m-ic)] text-m-ink',
    })),
  ]

  const isActive = (to: string) =>
    to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(to)
  const moreActive = moreItems.some(item => isActive(item.to))

  // The FAB gives way to a decorative logo slot on screens without an add
  // action (settings/admin, demo Z. 1372/1429).
  const logoSlot = location.pathname.startsWith('/settings') || location.pathname.startsWith('/admin')
  const searchFab = location.pathname.startsWith('/atlas')

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
        <div className="fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute left-4 right-4 flex flex-col gap-2 rounded-[26px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[10px] shadow-[0_-8px_40px_-14px_rgba(0,0,0,.45)] backdrop-blur-[30px] backdrop-saturate-[1.8] bottom-[calc(env(safe-area-inset-bottom,0px)+86px)]"
            onClick={e => e.stopPropagation()}
          >
            {moreItems.map(({ to, label, sub, icon: Icon, tileCls }) => (
              <button
                key={to}
                type="button"
                onClick={() => { setMoreOpen(false); navigate(to) }}
                className="flex items-center gap-[13px] rounded-[18px] bg-[color:var(--m-ic)] px-4 py-[14px] text-left"
              >
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${tileCls}`}>
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] font-extrabold text-m-ink">{label}</span>
                  {sub && <span className="mt-[1px] block truncate font-geist text-[0.6875rem] text-m-muted">{sub}</span>}
                </span>
                <ChevronRight size={17} strokeWidth={2} className="flex-none text-m-faint" />
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed left-4 right-4 z-40 flex h-[62px] items-center rounded-[31px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-3 shadow-[0_16px_44px_-14px_rgba(0,0,0,.35)] backdrop-blur-[30px] backdrop-saturate-[1.8] bottom-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <div className="flex min-w-0 flex-1 items-center justify-around">{left.map(renderItem)}</div>

        {logoSlot ? (
          <span aria-hidden="true" className="mx-2 flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] opacity-70">
            <img src="/icons/icon-dark.svg" alt="" className="block h-6 w-6 opacity-75 dark:hidden" />
            <img src="/icons/icon-white.svg" alt="" className="hidden h-6 w-6 opacity-75 dark:block" />
          </span>
        ) : (
          <MFab onClick={create.run} ariaLabel={create.label} className="mx-2">
            {searchFab ? <Search size={24} strokeWidth={2.4} /> : <Plus size={26} strokeWidth={2.4} />}
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
