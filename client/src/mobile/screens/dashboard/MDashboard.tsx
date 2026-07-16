import React, { useEffect, useState } from 'react'
import {
  Archive, ArchiveRestore, ArrowRight, Bell, CalendarDays, CalendarPlus, Copy,
  LayoutGrid, List, MapPin, Pencil, Plus, RefreshCw, Trash2, Users,
} from 'lucide-react'
import { useTranslation } from '../../../i18n'
import MDancingTrek from '../../components/MDancingTrek'
import { useDashboard } from '../../../pages/dashboard/useDashboard'
import {
  type DashboardTrip, MS_PER_DAY, daysUntil, getTripStatus,
} from '../../../pages/dashboard/dashboardModel'
import { useAuthStore } from '../../../store/authStore'
import { useInAppNotificationStore } from '../../../store/inAppNotificationStore'
import { usePluginStore } from '../../../store/pluginStore'
import { useTripCardBadges } from '../../../components/Plugins/TripCardBadges'
import type { TripCardBadge } from '../../../api/client'
import DemoBanner from '../../../components/Layout/DemoBanner'
import PluginWidgets from '../../../components/Plugins/PluginWidgets'
import { entityGradient } from '../../../utils/gradients'
import MGlassBar from '../../components/MGlassBar'
import MIconBtn from '../../components/MIconBtn'
import MSegmented from '../../components/MSegmented'
import MSheet from '../../components/MSheet'
import MUserMenu from './MUserMenu'
import MDashWidgets from './MDashWidgets'
import MNewTripSheet from './MNewTripSheet'

// Localized short date for the pills; the year only shows when it isn't the
// current one (same rule as the desktop cards).
function fullDate(dateStr: string | null | undefined, locale: string): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00Z')
  if (isNaN(date.getTime())) return null
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' }
  if (date.getUTCFullYear() !== new Date().getUTCFullYear()) opts.year = 'numeric'
  return date.toLocaleDateString(locale, opts)
}

type TripFilter = 'planned' | 'archive' | 'completed'

interface CardAction {
  key: string
  label: string
  icon: React.ReactElement
  onClick: () => void
}

/**
 * Mobile dashboard screen. Pure presentation over the shared useDashboard()
 * data hook — every mutation runs through the same store/hook actions the
 * desktop page uses.
 */
export default function MDashboard(): React.ReactElement {
  const {
    demoMode, locale, t, navigate,
    spotlight, upcoming, gridTrips, isLoading, loadError, retryLoad,
    tripFilter, setTripFilter, viewMode, toggleViewMode,
    showForm, setShowForm, editingTrip, setEditingTrip,
    deleteTrip, setDeleteTrip, copyTrip, setCopyTrip, setTrips,
    handleCreate, handleUpdate, confirmDelete, handleArchive, handleUnarchive, confirmCopy,
  } = useDashboard()

  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const unread = useInAppNotificationStore(s => s.unreadCount)
  const fetchUnreadCount = useInAppNotificationStore(s => s.fetchUnreadCount)
  const [menuOpen, setMenuOpen] = useState(false)

  // Plugin dashboard widgets + trip-card badges, mirroring the desktop page:
  // same slot filter (only true dashboard widgets), one badge fetch for all
  // visible cards, gated on any plugin being active. Fail-safe like desktop.
  const widgetPlugins = usePluginStore(s => s.plugins).filter(p => p.type === 'widget' && p.slot !== 'hero' && p.slot !== 'place-detail' && p.slot !== 'day-detail' && p.slot !== 'reservation-detail')
  const anyPluginActive = usePluginStore(s => s.plugins).length > 0
  const badgesFor = useTripCardBadges(gridTrips.map(trip => trip.id), anyPluginActive)

  useEffect(() => { if (isAuthenticated) fetchUnreadCount() }, [isAuthenticated, fetchUnreadCount])

  const openCreate = () => { setEditingTrip(null); setShowForm(true) }
  const openEdit = (trip: DashboardTrip) => { setEditingTrip(trip); setShowForm(true) }

  const isArchivedFilter = tripFilter === 'archive'

  // Archived cards swap edit/archive for restore + permanent delete (audit);
  // the grid variant leaves archiving to the edit sheet like the design.
  const actionsFor = (trip: DashboardTrip, layout: 'grid' | 'list'): CardAction[] => {
    if (isArchivedFilter) {
      return [
        { key: 'copy', label: t('dashboard.aria.duplicate'), icon: <Copy size={15} strokeWidth={2.1} />, onClick: () => setCopyTrip(trip) },
        { key: 'restore', label: t('dashboard.restore'), icon: <ArchiveRestore size={15} strokeWidth={2.1} />, onClick: () => handleUnarchive(trip.id) },
        { key: 'delete', label: t('common.delete'), icon: <Trash2 size={15} strokeWidth={2.1} />, onClick: () => setDeleteTrip(trip) },
      ]
    }
    const base: CardAction[] = [
      { key: 'edit', label: t('common.edit'), icon: <Pencil size={15} strokeWidth={2.1} />, onClick: () => openEdit(trip) },
      { key: 'copy', label: t('dashboard.aria.duplicate'), icon: <Copy size={15} strokeWidth={2.1} />, onClick: () => setCopyTrip(trip) },
    ]
    if (layout === 'list') {
      base.push({ key: 'archive', label: t('dashboard.archive'), icon: <Archive size={15} strokeWidth={2.1} />, onClick: () => handleArchive(trip.id) })
    }
    base.push({ key: 'delete', label: t('common.delete'), icon: <Trash2 size={15} strokeWidth={2.1} />, onClick: () => setDeleteTrip(trip) })
    return base
  }

  const statusLabel = (trip: DashboardTrip): string => {
    if (trip.is_archived) return t('dashboard.archived')
    const status = getTripStatus(trip)
    const until = daysUntil(trip.start_date)
    return status === 'ongoing' ? t('dashboard.mobile.liveNow')
      : status === 'today' ? t('dashboard.status.today')
      : status === 'tomorrow' ? t('dashboard.status.tomorrow')
      : status === 'future' && until !== null ? (until > 60 ? t('dashboard.mobile.inMonths', { count: Math.round(until / 30) }) : t('dashboard.mobile.inDays', { count: until }))
      : status === 'past' ? t('dashboard.mobile.completed')
      : t('dashboard.card.idea')
  }

  const showEmpty = tripFilter === 'planned' && !spotlight && gridTrips.length === 0 && !isLoading && !loadError

  return (
    <>
      <MGlassBar floating>
        <button
          type="button"
          // Content scrolls in the shell's inner container, not the window.
          onClick={e => { e.currentTarget.closest('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' }) }}
          aria-label="TREK"
          className="flex flex-none items-center gap-[7px]"
        >
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#101013]">{/* theme-lint-disable — brand tile stays black in both themes */}
            <img src="/icons/icon-white.svg" alt="" className="block h-[22px] w-[22px]" />
          </span>
        </button>
        <div className="min-w-0 flex-1" />
        <MIconBtn ariaLabel={t('notifications.title')} onClick={() => navigate('/notifications')}>
          <Bell size={18} strokeWidth={2} />
          {unread > 0 && (
            <span aria-hidden className="absolute right-[9px] top-2 h-[7px] w-[7px] rounded-full bg-m-ink" />
          )}
        </MIconBtn>
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={t('nav.profile')}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full border-2 border-[color:var(--m-avbr)] bg-[image:linear-gradient(135deg,#6A6A74,#1A1A1E)] text-[0.9375rem] font-bold text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,.45)]"
        >
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            : (user?.username || '?')[0].toUpperCase()}
        </button>
      </MGlassBar>

      <MUserMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {demoMode && <DemoBanner />}

      <div className="px-4 pb-[calc(var(--bottom-nav-h,84px)+32px)] pt-[calc(var(--m-safe-top,12px)+82px)]">
        {loadError && (
          <div role="alert" className="mb-3 flex items-center gap-3 rounded-[20px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[14px]">
            <span className="min-w-0 flex-1 text-[0.8125rem] font-medium text-m-ink">{t('dashboard.loadErrorBanner')}</span>
            <button
              type="button"
              onClick={retryLoad}
              className="flex flex-none items-center gap-[6px] rounded-full bg-m-act px-3 py-[7px] text-[0.75rem] font-semibold text-m-actfg"
            >
              <RefreshCw size={13} strokeWidth={2.2} />
              {t('dashboard.retry')}
            </button>
          </div>
        )}

        {spotlight && (
          <MSpotlightCard
            trip={spotlight}
            t={t}
            onOpen={() => navigate(`/trips/${spotlight.id}`)}
            actions={actionsFor(spotlight, 'list')}
          />
        )}

        <div className="mt-[14px] flex items-center gap-[7px]">
          <MSegmented<TripFilter>
            value={tripFilter}
            onChange={setTripFilter}
            variant="intrinsic"
            options={[
              { value: 'planned', label: t('dashboard.filter.planned') },
              { value: 'archive', label: t('dashboard.archived') },
              { value: 'completed', label: t('dashboard.mobile.completed') },
            ]}
          />
          <MIconBtn ariaLabel={t('dashboard.newTrip')} size={36} className="ml-auto" onClick={openCreate}>
            <CalendarPlus size={15} strokeWidth={2} className="text-m-muted" />
          </MIconBtn>
          <button
            type="button"
            onClick={toggleViewMode}
            aria-label={t('dashboard.aria.toggleView')}
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
              viewMode === 'list'
                ? 'bg-m-act text-m-actfg'
                : 'border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] text-m-muted'
            }`}
          >
            {/* Icon shows the layout the tap switches TO, not the current one. */}
            {viewMode === 'grid' ? <List size={15} strokeWidth={2} /> : <LayoutGrid size={15} strokeWidth={2} />}
          </button>
        </div>

        {showEmpty && (
          <div className="mt-[10px] flex flex-col items-center rounded-[20px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-8 text-center">
            <MDancingTrek scene="dashboard" size={96} className="mb-2" />
            <div className="text-[0.9375rem] font-bold">{t('dashboard.emptyTitle')}</div>
            <div className="mt-1 font-geist text-[0.6875rem] text-m-muted">{t('dashboard.emptyText')}</div>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 flex items-center gap-[6px] rounded-full bg-m-act px-4 py-[9px] text-[0.75rem] font-semibold text-m-actfg"
            >
              <Plus size={14} strokeWidth={2.4} />
              {t('dashboard.emptyButton')}
            </button>
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="mt-[10px] flex flex-col gap-3">
            {gridTrips.map(trip => (
              <MTripGridCard
                key={trip.id}
                trip={trip}
                locale={locale}
                badge={statusLabel(trip)}
                pluginBadges={badgesFor(trip.id)}
                actions={actionsFor(trip, 'grid')}
                onOpen={() => navigate(`/trips/${trip.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-[10px] flex flex-col gap-3">
            {gridTrips.map(trip => (
              <MTripListCard
                key={trip.id}
                trip={trip}
                locale={locale}
                t={t}
                badge={statusLabel(trip)}
                pluginBadges={badgesFor(trip.id)}
                actions={actionsFor(trip, 'list')}
                onOpen={() => navigate(`/trips/${trip.id}`)}
              />
            ))}
          </div>
        )}

        <MDashWidgets upcoming={upcoming} />

        {widgetPlugins.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            <PluginWidgets plugins={widgetPlugins} tripId={spotlight ? String(spotlight.id) : null} />
          </div>
        )}
      </div>

      <MNewTripSheet
        open={showForm}
        trip={editingTrip}
        onClose={() => { setShowForm(false); setEditingTrip(null) }}
        onSave={editingTrip ? handleUpdate : handleCreate}
        onCoverUpdate={(tripId, coverUrl) => setTrips(prev => prev.map(tr => tr.id === tripId ? { ...tr, cover_image: coverUrl } : tr))}
        onArchive={editingTrip
          ? () => (editingTrip.is_archived ? handleUnarchive(editingTrip.id) : handleArchive(editingTrip.id))
          : undefined}
      />

      <MConfirmSheet
        open={!!deleteTrip}
        title={t('common.delete')}
        message={deleteTrip ? t('dashboard.confirm.delete', { title: deleteTrip.title }) : ''}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={confirmDelete}
        onClose={() => setDeleteTrip(null)}
      />
      <MConfirmSheet
        open={!!copyTrip}
        title={t('dashboard.confirm.copy.title')}
        message={copyTrip?.title || ''}
        confirmLabel={t('dashboard.confirm.copy.confirm')}
        onConfirm={confirmCopy}
        onClose={() => setCopyTrip(null)}
      />
    </>
  )
}

// ── Spotlight ────────────────────────────────────────────────────────────────
function MSpotlightCard({ trip, t, onOpen, actions }: {
  trip: DashboardTrip
  t: (key: string, params?: Record<string, string | number>) => string
  onOpen: () => void
  actions: CardAction[]
}): React.ReactElement {
  const status = getTripStatus(trip)
  const ongoing = status === 'ongoing'
  const until = daysUntil(trip.start_date)

  // Day-of-trip + total for the ongoing badge and progress bar.
  let dayOfTrip = 0
  let totalDays = trip.day_count ?? 0
  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date + 'T00:00:00'); start.setHours(0, 0, 0, 0)
    const end = new Date(trip.end_date + 'T00:00:00'); end.setHours(0, 0, 0, 0)
    const span = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
    if (!totalDays) totalDays = span
    if (ongoing) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      dayOfTrip = Math.min(span, Math.max(1, Math.round((today.getTime() - start.getTime()) / MS_PER_DAY) + 1))
    }
  }
  const progress = ongoing && totalDays > 0 ? Math.round((dayOfTrip / totalDays) * 100) : 0

  const primaryBadge = ongoing ? t('dashboard.status.ongoing')
    : status === 'past' ? t('dashboard.hero.badgeRecent')
    : t('dashboard.hero.badgeNext')
  const secondaryBadge = ongoing ? t('dashboard.mobile.spotlightDayOf', { day: dayOfTrip, total: totalDays })
    : status === 'today' ? t('dashboard.hero.badgeToday')
    : status === 'tomorrow' ? t('dashboard.hero.badgeTomorrow')
    : status === 'future' && until !== null ? t('dashboard.mobile.inDays', { count: until })
    : null

  const days = trip.day_count ?? totalDays
  const places = trip.place_count ?? 0
  const people = (trip.shared_count ?? 0) + 1

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen() }}
      className="relative h-[300px] cursor-pointer overflow-hidden rounded-[26px] shadow-[0_24px_56px_-22px_rgba(0,0,0,.5)]"
    >
      {trip.cover_image
        ? <img src={trip.cover_image} alt={trip.title} className="absolute inset-0 h-full w-full object-cover" />
        : <div className="absolute inset-0" style={{ backgroundImage: entityGradient(trip.id) }} />}
      <div className="absolute right-[10px] top-[10px] flex gap-[6px]">
        {actions.map(a => <CoverActionBtn key={a.key} action={a} />)}
      </div>
      <div className="absolute bottom-[10px] left-[10px] right-[10px] rounded-[18px] border border-white/[.16] bg-[rgba(14,14,17,.52)] p-[12px_14px] text-white backdrop-blur-[22px] backdrop-saturate-[1.6]">{/* theme-lint-disable — fixed dark glass on the cover photo */}
        <span className="flex gap-[6px]">
          <span className="rounded-full bg-white/[.92] px-2 py-[3px] text-[0.625rem] font-bold uppercase tracking-[.07em] text-[#101013]">{/* theme-lint-disable — fixed on-photo badge */}
            {primaryBadge}
          </span>
          {secondaryBadge && (
            <span className="rounded-full bg-white/[.28] px-2 py-[3px] text-[0.625rem] font-bold uppercase tracking-[.07em] text-white">
              {secondaryBadge}
            </span>
          )}
        </span>
        <div className="mt-[7px] truncate text-[1.4375rem] font-bold">{trip.title}</div>
        {ongoing && (
          <div className="relative mb-2 mt-[9px] h-1 rounded-full bg-white/25">
            <span className="absolute bottom-0 left-0 top-0 rounded-full bg-white" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className={`flex gap-[6px] ${ongoing ? '' : 'mt-[9px]'}`}>
          <SpotlightPill icon={<CalendarDays size={11} strokeWidth={2.2} />} label={days === 1 ? t('dashboard.mobile.spotlightDayOne', { count: days }) : t('dashboard.mobile.spotlightDaysMany', { count: days })} />
          <SpotlightPill icon={<MapPin size={11} strokeWidth={2.2} />} label={places === 1 ? t('dashboard.hero.destinationOne', { count: places }) : t('dashboard.hero.destinationMany', { count: places })} />
          <SpotlightPill icon={<Users size={11} strokeWidth={2.2} />} label={people === 1 ? t('dashboard.hero.travelerOne', { count: people }) : t('dashboard.hero.travelerMany', { count: people })} />
        </div>
      </div>
    </div>
  )
}

function SpotlightPill({ icon, label }: { icon: React.ReactElement; label: string }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-[9px] py-[3px] font-geist text-[0.625rem] font-bold text-white backdrop-blur-[6px]">
      {icon}
      {label}
    </span>
  )
}

// ── Trip cards ───────────────────────────────────────────────────────────────
function CoverActionBtn({ action }: { action: CardAction }): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={action.label}
      onClick={e => { e.stopPropagation(); action.onClick() }}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/30 bg-white/[.22] text-white backdrop-blur-[8px]"
    >
      {action.icon}
    </button>
  )
}

function CoverBadge({ label, offset }: { label: string; offset: 8 | 12 }): React.ReactElement {
  return (
    <span
      className={`absolute box-border inline-flex h-[34px] items-center gap-[6px] rounded-full bg-white/[.22] px-[13px] font-geist text-[0.625rem] font-extrabold uppercase tracking-[.08em] text-white backdrop-blur-[8px] ${
        offset === 8 ? 'left-2 top-2' : 'left-3 top-3'
      }`}
    >
      <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-white" />
      {label}
    </span>
  )
}

// Plugin-contributed chips on a trip card (tripCardProvider hook). Server-bounded
// primitives only — same trust model as the desktop TripCardBadges, restyled for
// the mobile cards since the desktop CSS is scoped to .trek-dash.
const BADGE_TONE: Record<TripCardBadge['tone'], string> = {
  default: 'text-m-ink',
  success: 'text-[color:var(--m-st-confirmed)]',
  warn: 'text-[color:var(--m-st-pending)]',
  danger: 'text-[color:var(--m-st-danger)]',
}

function MTripBadges({ items }: { items: TripCardBadge[] }): React.ReactElement | null {
  if (!items.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-[6px]">
      {items.map(b => {
        const cls = 'inline-flex max-w-full items-center gap-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-2 py-[3px] font-geist text-[0.625rem]'
        const inner = (
          <>
            <span className={`font-semibold ${BADGE_TONE[b.tone]}`}>{b.label}</span>
            {b.value != null && b.value !== '' && <span className="truncate text-m-muted">{b.value}</span>}
          </>
        )
        return b.url
          ? <a key={b.pluginId + b.id} href={b.url} target="_blank" rel="noreferrer noopener" className={cls} onClick={e => e.stopPropagation()}>{inner}</a>
          : <span key={b.pluginId + b.id} className={cls}>{inner}</span>
      })}
    </div>
  )
}

function coverStyle(trip: DashboardTrip): React.CSSProperties {
  return trip.cover_image
    ? { backgroundImage: `url(${trip.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundImage: entityGradient(trip.id) }
}

function MTripGridCard({ trip, locale, badge, pluginBadges, actions, onOpen }: {
  trip: DashboardTrip; locale: string; badge: string; pluginBadges: TripCardBadge[]
  actions: CardAction[]; onOpen: () => void
}): React.ReactElement {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen() }}
      className="min-w-0 cursor-pointer overflow-hidden rounded-[20px] border border-[color:var(--m-cbr)] bg-[color:var(--m-card)]"
    >
      <div className="relative h-[96px]" style={coverStyle(trip)}>
        <div className="absolute inset-0 bg-[image:linear-gradient(180deg,rgba(0,0,0,.32),rgba(0,0,0,0)_60%)]" />
        <CoverBadge label={badge} offset={8} />
        <div className="absolute right-2 top-2 flex gap-[6px]">
          {actions.map(a => <CoverActionBtn key={a.key} action={a} />)}
        </div>
      </div>
      <div className="p-[9px_12px_12px]">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate text-[0.875rem] font-semibold">{trip.title}</div>
          <span className="inline-flex flex-none items-center gap-[6px] rounded-full bg-[color:var(--m-ic)] px-[10px] py-1 font-geist text-[0.6875rem] font-semibold text-m-ink">
            <span>{fullDate(trip.start_date, locale) ?? '—'}</span>
            <ArrowRight size={12} strokeWidth={2.2} className="text-m-faint" />
            <span>{fullDate(trip.end_date, locale) ?? '—'}</span>
          </span>
        </div>
        <MTripBadges items={pluginBadges} />
      </div>
    </div>
  )
}

function MTripListCard({ trip, locale, t, badge, pluginBadges, actions, onOpen }: {
  trip: DashboardTrip; locale: string
  t: (key: string, params?: Record<string, string | number>) => string
  badge: string; pluginBadges: TripCardBadge[]; actions: CardAction[]; onOpen: () => void
}): React.ReactElement {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen() }}
      className="cursor-pointer overflow-hidden rounded-[22px] border border-[color:var(--m-cbr)] bg-[color:var(--m-card)] shadow-[0_12px_30px_-18px_rgba(0,0,0,.35)]"
    >
      <div className="relative h-[188px]" style={coverStyle(trip)}>
        <div className="absolute inset-0 bg-[image:linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,0)_42%,rgba(0,0,0,.55))]" />
        <CoverBadge label={badge} offset={12} />
        <div className="absolute right-3 top-3 flex gap-[7px]">
          {actions.map(a => <CoverActionBtn key={a.key} action={a} />)}
        </div>
        <div className="absolute bottom-[14px] left-4 right-4 truncate text-[1.625rem] font-extrabold text-white [text-shadow:0_2px_12px_rgba(0,0,0,.4)]">
          {trip.title}
        </div>
      </div>
      <div className="p-[14px_16px_16px]">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-[9px] rounded-full bg-[color:var(--m-ic)] px-[15px] py-[7px] text-[0.875rem] font-medium">
            <span>{fullDate(trip.start_date, locale) ?? '—'}</span>
            <ArrowRight size={15} strokeWidth={2.2} className="text-m-faint" />
            <span>{fullDate(trip.end_date, locale) ?? '—'}</span>
          </div>
        </div>
        <div className="my-[13px] h-px bg-[color:var(--m-rowbr)]" />
        <div className="flex text-center">
          <ListStat value={trip.day_count ?? 0} label={t('dashboard.days')} />
          <ListStat value={trip.place_count ?? 0} label={t('dashboard.places')} />
          <ListStat value={trip.shared_count ?? 0} label={trip.shared_count === 1 ? t('dashboard.card.buddyOne') : t('dashboard.members')} />
        </div>
        <MTripBadges items={pluginBadges} />
      </div>
    </div>
  )
}

function ListStat({ value, label }: { value: number; label: string }): React.ReactElement {
  return (
    <div className="flex-1">
      <div className="text-[1.0625rem] font-extrabold tabular-nums">{value}</div>
      <div className="mt-[2px] font-geist text-[0.5rem] font-bold uppercase tracking-[.09em] text-m-faint">{label}</div>
    </div>
  )
}

// ── Confirm sheet (delete / copy) ────────────────────────────────────────────
function MConfirmSheet({ open, title, message, confirmLabel, danger = false, onConfirm, onClose }: {
  open: boolean; title: string; message: string; confirmLabel: string
  danger?: boolean; onConfirm: () => void; onClose: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  return (
    <MSheet open={open} onClose={onClose} variant="card" ariaLabel={title}>
      <div className="p-5">
        <div className="text-[1.0625rem] font-bold">{title}</div>
        <div className="mt-2 text-[0.8125rem] leading-relaxed text-m-muted">{message}</div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-[color:var(--m-ic)] py-[10px] text-[0.8125rem] font-semibold text-m-ink"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full py-[10px] text-[0.8125rem] font-semibold ${
              danger ? 'bg-[color:var(--m-st-danger)] text-white' : 'bg-m-act text-m-actfg'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </MSheet>
  )
}
