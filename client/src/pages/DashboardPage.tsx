import React, { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'
import Navbar from '../components/Layout/Navbar'
import DemoBanner from '../components/Layout/DemoBanner'
import TripFormModal from '../components/Trips/TripFormModal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import CopyTripDialog from '../components/shared/CopyTripDialog'
import CustomSelect from '../components/shared/CustomSelect'
import PlaceAvatar from '../components/shared/PlaceAvatar'
import MobileTopBar from '../components/Layout/MobileTopBar'
import { useDashboard } from './dashboard/useDashboard'
import {
  type DashboardTrip, type HeroBundle, type TravelStats, type UpcomingReservation,
  MS_PER_DAY, daysUntil, getTripStatus,
} from './dashboard/dashboardModel'
import {
  Plus, Edit2, Trash2, Archive, Copy, ArrowRight, MapPin,
  Plane, Hotel, Utensils, Clock, RefreshCw, ArrowRightLeft, Calendar,
  LayoutGrid, List, Ticket, X, CalendarPlus,
} from 'lucide-react'
import { IcsSubscribeModal } from '../components/Planner/IcsSubscribeModal'
import CollectionsWidget from '../components/Dashboard/CollectionsWidget'
import PluginWidgets from '../components/Plugins/PluginWidgets'
import PluginFrame from '../components/Plugins/PluginFrame'
import { usePluginStore } from '../store/pluginStore'
import { formatTime, splitReservationDateTime } from '../utils/formatters'
import { convertDistance, getDistanceUnitLabel } from '../utils/units'
import { useSettingsStore } from '../store/settingsStore'
import { useAddonStore } from '../store/addonStore'
import { normalizeAppearance } from '@trek/shared'
import '../styles/dashboard.css'

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
]
function tripGradient(id: number): string { return GRADIENTS[id % GRADIENTS.length] }

// Day + short month for the boarding pass / cards, plus the year — but only
// when it isn't the current year (this year's trips stay clutter-free), e.g.
// { d: '10', m: 'Sep', y: '' } now vs { …, y: '2024' } for an older trip.
function splitDate(dateStr: string | null | undefined, locale: string): { d: string; m: string; y: string } | null {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00Z')
  if (isNaN(date.getTime())) return null // malformed date — render a dash, never crash
  const otherYear = date.getUTCFullYear() !== new Date().getUTCFullYear()
  return {
    d: date.toLocaleDateString(locale, { day: 'numeric', timeZone: 'UTC' }),
    m: date.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' }),
    y: otherYear ? date.toLocaleDateString(locale, { year: 'numeric', timeZone: 'UTC' }) : '',
  }
}

// Localized date for the cards. The year is included only when it isn't the
// current year, and order/punctuation follow the locale (EN "Sep 10, 2026",
// DE "10. Sep 2026" — vs a plain "Sep 10" this year), never a hard-coded layout.
function fullDate(dateStr: string | null | undefined, locale: string): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00Z')
  if (isNaN(date.getTime())) return null
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' }
  if (date.getUTCFullYear() !== new Date().getUTCFullYear()) opts.year = 'numeric'
  return date.toLocaleDateString(locale, opts)
}

function buddyColor(seed: number): string {
  const pairs = [
    ['#6366f1', '#8b5cf6'], ['#10b981', '#059669'], ['#f59e0b', '#d97706'],
    ['#ec4899', '#be185d'], ['#0ea5e9', '#2563eb'], ['#14b8a6', '#0d9488'],
  ]
  const [a, b] = pairs[seed % pairs.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const RES_ICON: Record<string, React.ReactElement> = {
  flight: <Plane size={16} />, hotel: <Hotel size={16} />, restaurant: <Utensils size={16} />,
}
const RES_TYPE_CLASS: Record<string, string> = { flight: 'flight', hotel: 'hotel', restaurant: 'food' }

// Mobile gets a different boarding-pass treatment (separate card under the hero).
function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

export default function DashboardPage(): React.ReactElement {
  // Page = wiring container: all state, data loading and mutations live in the
  // useDashboard data hook; this component only renders what it returns.
  const {
    demoMode, locale, t, navigate,
    spotlight, heroBundle, stats, upcoming, gridTrips, isLoading,
    loadError, retryLoad,
    tripFilter, setTripFilter, viewMode, toggleViewMode,
    showForm, setShowForm, editingTrip, setEditingTrip,
    deleteTrip, setDeleteTrip, copyTrip, setCopyTrip, setTrips,
    handleCreate, handleUpdate, confirmDelete, handleArchive, handleUnarchive, confirmCopy,
    allSubOpen, setAllSubOpen,
  } = useDashboard()

  // Per-device dashboard widget visibility (from the appearance config).
  const isMobile = useIsMobile()
  const appearanceCfg = useSettingsStore(s => s.settings.appearance)
  const dashCfg = normalizeAppearance(appearanceCfg).dashboard
  const sideWidgets = isMobile ? dashCfg.mobile : dashCfg.desktop
  const showCurrency = sideWidgets.currency
  const showTimezones = sideWidgets.timezones
  const showUpcoming = sideWidgets.upcomingReservations
  // Collections is double-gated: the admin addon AND the per-user widget flag.
  const isAddonEnabled = useAddonStore(s => s.isEnabled)
  const showCollections = isAddonEnabled('collections') && sideWidgets.collections
  // Desktop has a master toggle for the whole right column; off → centered layout.
  const widgetPlugins = usePluginStore(s => s.plugins).filter(p => p.type === 'widget' && p.slot !== 'hero')
  const sidebarVisible = (isMobile || dashCfg.desktop.sidebar) && (showCurrency || showCollections || showTimezones || showUpcoming || widgetPlugins.length > 0)

  return (
    <>
      {/* Navbar lives outside .trek-dash so it keeps the app-wide font + button
          styling instead of inheriting the dashboard scope's font and the
          `.trek-dash button` reset (which shifted the bell icon + menu items). */}
      <Navbar />
      <div className="trek-dash trek-dash-shell">
      {demoMode && <DemoBanner />}
      <div className="trek-dash-scroll">
        <MobileTopBar />
        <main className="page" data-no-sidebar={sidebarVisible ? undefined : 'true'}>
          <div className="page-main">
            {loadError && (
              <div className="dash-error" role="alert">
                <span className="dash-error-txt">{t('dashboard.loadErrorBanner')}</span>
                <button className="dash-error-retry" onClick={retryLoad}>
                  <RefreshCw size={15} />
                  {t('dashboard.retry')}
                </button>
              </div>
            )}
            {spotlight && (
              <BoardingPassHero
                trip={spotlight}
                bundle={heroBundle}
                locale={locale}
                onOpen={() => navigate(`/trips/${spotlight.id}`)}
                onEdit={() => { setEditingTrip(spotlight); setShowForm(true) }}
                onCopy={() => setCopyTrip(spotlight)}
                onArchive={() => spotlight.is_archived ? handleUnarchive(spotlight.id) : handleArchive(spotlight.id)}
                onDelete={() => setDeleteTrip(spotlight)}
              />
            )}

            <AtlasStats stats={stats} />

            <section>
              <div className="sec-head">
                <h3 className="sec-title">{t('dashboard.title')}</h3>
                <div className="sec-tools">
                  <div className="seg">
                    <button className={tripFilter === 'planned' ? 'on' : ''} onClick={() => setTripFilter('planned')}>{t('dashboard.filter.planned')}</button>
                    <button className={tripFilter === 'archive' ? 'on' : ''} onClick={() => setTripFilter('archive')}>{t('dashboard.archived')}</button>
                    <button className={tripFilter === 'completed' ? 'on' : ''} onClick={() => setTripFilter('completed')}>{t('dashboard.mobile.completed')}</button>
                  </div>
                  <button
                    className="tool-action"
                    aria-label="Subscribe to all trips calendar"
                    title="Subscribe to all trips"
                    onClick={() => setAllSubOpen(true)}
                    style={{ width: 38, height: 38, borderRadius: 11 }}
                  >
                    <CalendarPlus size={17} />
                  </button>
                  <button className="tool-action" aria-label={t('dashboard.aria.toggleView')} onClick={toggleViewMode} style={{ width: 38, height: 38, borderRadius: 11 }}>
                    {viewMode === 'grid' ? <List size={17} /> : <LayoutGrid size={17} />}
                  </button>
                </div>
              </div>
              {allSubOpen && (
                <IcsSubscribeModal
                  endpoint="/api/feed/user"
                  title="Subscribe to all trips"
                  description="One calendar feed for all your active trips, kept in sync automatically. Excludes archived trips and trips that ended more than 90 days ago."
                  onClose={() => setAllSubOpen(false)}
                />
              )}

              {gridTrips.length === 0 && tripFilter === 'planned' && !isLoading && !loadError && (
                <div className="trips-empty">
                  <h4>{t('dashboard.emptyTitle')}</h4>
                  <p>{t('dashboard.emptyText')}</p>
                </div>
              )}

              <div className={`trips${viewMode === 'list' ? ' list-view' : ''}`}>
                {gridTrips.map(trip => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    locale={locale}
                    onOpen={() => navigate(`/trips/${trip.id}`)}
                    onEdit={() => { setEditingTrip(trip); setShowForm(true) }}
                    onCopy={() => setCopyTrip(trip)}
                    onArchive={() => trip.is_archived ? handleUnarchive(trip.id) : handleArchive(trip.id)}
                    onDelete={() => setDeleteTrip(trip)}
                  />
                ))}
                {tripFilter === 'planned' && !isLoading && (
                  <button className="add-trip-card" onClick={() => { setEditingTrip(null); setShowForm(true) }}>
                    <div>
                      <div className="circ"><Plus size={20} /></div>
                      <div className="ttl">{t('dashboard.newTrip')}</div>
                      <div className="sub">{t('dashboard.newTripSub')}</div>
                    </div>
                  </button>
                )}
              </div>
            </section>
          </div>

          {sidebarVisible && (
            <aside className="page-sidebar">
              {showCurrency && <CurrencyTool />}
              {showCollections && <CollectionsWidget onOpen={() => navigate('/collections')} />}
              {showTimezones && <TimezoneTool locale={locale} />}
              {showUpcoming && <UpcomingTool items={upcoming} locale={locale} onOpen={(tripId) => navigate(`/trips/${tripId}`)} />}
              <PluginWidgets plugins={widgetPlugins} tripId={spotlight ? String(spotlight.id) : null} />
            </aside>
          )}
        </main>
      </div>

      <button
        className="fab-new-trip"
        onClick={() => { setEditingTrip(null); setShowForm(true) }}
        aria-label={t('dashboard.newTrip')}
        title={t('dashboard.newTrip')}
      >
        <Plus size={22} strokeWidth={2.4} />
        <span className="fab-label">{t('dashboard.newTrip')}</span>
      </button>

      {showForm && (
        <TripFormModal
          isOpen={showForm}
          trip={editingTrip}
          onClose={() => { setShowForm(false); setEditingTrip(null) }}
          onSave={editingTrip ? handleUpdate : handleCreate}
          onCoverUpdate={(tripId, coverUrl) => setTrips(prev => prev.map(t => t.id === tripId ? { ...t, cover_image: coverUrl } : t))}
        />
      )}
      {deleteTrip && (
        <ConfirmDialog
          isOpen={!!deleteTrip}
          title={t('common.delete')}
          message={t('dashboard.confirm.delete', { title: deleteTrip.title })}
          confirmLabel={t('common.delete')}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTrip(null)}
          danger
        />
      )}
      {copyTrip && (
        <CopyTripDialog
          isOpen={!!copyTrip}
          tripTitle={copyTrip.title}
          onConfirm={confirmCopy}
          onClose={() => setCopyTrip(null)}
        />
      )}
      </div>
    </>
  )
}

// ── Boarding-pass hero ───────────────────────────────────────────────────────
function BoardingPassHero({ trip, bundle, locale, onOpen, onEdit, onCopy, onArchive, onDelete }: {
  trip: DashboardTrip; bundle: HeroBundle | null; locale: string; onOpen: () => void
  onEdit: () => void; onCopy: () => void; onArchive: () => void; onDelete: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const mobile = useIsMobile()
  const heroPlugins = usePluginStore(s => s.plugins).filter(p => p.type === 'widget' && p.slot === 'hero')
  const stop = (e: React.MouseEvent, fn: () => void) => { e.stopPropagation(); fn() }
  const status = getTripStatus(trip)
  const start = splitDate(trip.start_date, locale)
  const end = splitDate(trip.end_date, locale)

  // Countdown cell — plain text in the same style as the trip-dates cell:
  // days remaining while the trip runs, days until departure before it starts.
  const until = daysUntil(trip.start_date)
  const ongoing = status === 'ongoing'
  let countdownTop = ''
  let countdownNumber = ''
  let countdownLabel = ''
  if (ongoing && trip.end_date) {
    const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0)
    const endMid = new Date(trip.end_date + 'T00:00:00')
    const daysLeft = Math.max(0, Math.round((endMid.getTime() - todayMid.getTime()) / MS_PER_DAY))
    countdownTop = t('dashboard.status.ongoing')
    countdownNumber = String(daysLeft)
    countdownLabel = daysLeft === 0 ? t('dashboard.hero.lastDay') : daysLeft === 1 ? t('dashboard.hero.dayLeft') : t('dashboard.hero.daysLeft')
  } else if (until !== null && until >= 0) {
    countdownTop = t('dashboard.hero.startsIn')
    countdownNumber = String(until)
    countdownLabel = until === 1 ? t('dashboard.hero.dayUnitOne') : t('dashboard.hero.dayUnitMany')
  }

  const members = bundle?.members || []
  const places = bundle?.places || []
  const buddyCount = trip.shared_count != null ? trip.shared_count + 1 : members.length
  const placeCount = trip.place_count || places.length

  const badge = status === 'ongoing' ? t('dashboard.hero.badgeLive')
    : status === 'today' ? t('dashboard.hero.badgeToday')
    : status === 'tomorrow' ? t('dashboard.hero.badgeTomorrow')
    : status === 'future' ? t('dashboard.hero.badgeNext')
    : t('dashboard.hero.badgeRecent')

  const passCells = (
    <>
      <div className="pass-cell buddies">
        <div className="pass-label">{t('dashboard.members')}</div>
        <div className="buddies-avatars">
          {members.slice(0, 4).map((m, i) => (
            m.avatar_url
              ? <img key={m.id} className="buddy-avatar" src={m.avatar_url} alt={m.username} style={{ objectFit: 'cover' }} />
              : <div key={m.id} className="buddy-avatar" style={{ background: buddyColor(i) }}>{initials(m.username)}</div>
          ))}
          {members.length > 4 && <div className="buddy-more">+{members.length - 4}</div>}
          {members.length === 0 && <div className="buddy-avatar" style={{ background: buddyColor(0) }}>{initials(trip.owner_username)}</div>}
        </div>
        <div className="date-month">{buddyCount === 1 ? t('dashboard.hero.travelerOne', { count: buddyCount }) : t('dashboard.hero.travelerMany', { count: buddyCount })}</div>
      </div>

      <div className="pass-cell dates-combined">
        <div className="pass-label">{t('dashboard.hero.tripDates')}</div>
        <div className="dates-row">
          {start ? <div className="date-block"><div className="date-num mono">{start.d}</div><div className="date-month">{start.m}{start.y ? ` ${start.y}` : ''}</div></div>
            : <div className="date-block"><div className="date-num">—</div></div>}
          <div className="date-arrow"><ArrowRight /></div>
          {end ? <div className="date-block"><div className="date-num mono">{end.d}</div><div className="date-month">{end.m}{end.y ? ` ${end.y}` : ''}</div></div>
            : <div className="date-block"><div className="date-num">—</div></div>}
        </div>
      </div>

      <div className="pass-cell countdown">
        {countdownNumber && (
          <>
            <div className="pass-label">{countdownTop}</div>
            <div className="date-num mono">{countdownNumber}</div>
            <div className="date-month">{countdownLabel}</div>
          </>
        )}
      </div>

      <div className="pass-cell places">
        <div className="pass-label">{t('dashboard.places')}</div>
        <div className="places-preview">
          {places.slice(0, 3).map(p => (
            <div key={p.id} className="place-av">
              <PlaceAvatar place={p} size={mobile ? 24 : 32} category={{ color: p.category_color ?? undefined, icon: p.category_icon ?? undefined }} />
            </div>
          ))}
          {places.length === 0 && <div className="place-more"><MapPin size={15} /></div>}
          {places.length > 3 && <div className="place-more">+{places.length - 3}</div>}
        </div>
        <div className="date-month">{placeCount === 1 ? t('dashboard.hero.destinationOne', { count: placeCount }) : t('dashboard.hero.destinationMany', { count: placeCount })}</div>
      </div>
    </>
  )

  return (
    <>
    <section className="hero-trip" onClick={onOpen}>
      {trip.cover_image
        ? <img className="bg" src={trip.cover_image} alt={trip.title} />
        : <div className="bg" style={{ background: tripGradient(trip.id) }} />}
      <div className="scrim" />
      <div className="hero-content">
        <div className="hero-top">
          <div className="hero-badge">
            {status === 'ongoing' && <span className="pulse" />}
            {badge}
          </div>
          <div className="hero-tools">
            <button className="hero-tool" aria-label={t('common.edit')} onClick={(e) => stop(e, onEdit)}><Edit2 size={16} /></button>
            <button className="hero-tool" aria-label={t('dashboard.aria.duplicate')} onClick={(e) => stop(e, onCopy)}><Copy size={16} /></button>
            <button className="hero-tool" aria-label={trip.is_archived ? t('dashboard.restore') : t('dashboard.archive')} onClick={(e) => stop(e, onArchive)}><Archive size={16} /></button>
            <button className="hero-tool" aria-label={t('common.delete')} onClick={(e) => stop(e, onDelete)}><Trash2 size={16} /></button>
          </div>
        </div>

        <div className="hero-title-block">
          <h2 className="hero-title">{trip.title}</h2>
        </div>

        {!mobile && (
          <div className="hero-pass-wrap">
            {heroPlugins.length > 0 && (
              <div className="hero-pass-overlay" aria-hidden="true">
                {heroPlugins.map(p => (
                  <PluginFrame key={p.id} pluginId={p.id} tripId={String(trip.id)} title={p.name} className="hero-overlay-frame" />
                ))}
              </div>
            )}
            <div className="hero-pass" onClick={(e) => { e.stopPropagation(); onOpen() }}>{passCells}</div>
          </div>
        )}
      </div>
    </section>
    {mobile && <section className="pass-card" onClick={onOpen}>{passCells}</section>}
    </>
  )
}

// ── Atlas / stats row ────────────────────────────────────────────────────────
function formatCompactDistance(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  // String() keeps a '.' decimal regardless of locale (no "1,5k" in non-English UIs).
  if (safeValue >= 1000) {
    return `${String(Math.round(safeValue / 100) / 10)}k`
  }
  const rounded = Math.round(safeValue * 10) / 10
  if (safeValue > 0 && rounded === 0) return '<0.1'
  return String(rounded)
}

function AtlasStats({ stats }: { stats: TravelStats | null }): React.ReactElement | null {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit) || 'metric'
  const appearance = useSettingsStore(s => s.settings.appearance)
  const isMobile = useIsMobile()
  const dash = normalizeAppearance(appearance).dashboard

  // Per-device widget visibility. Atlas + distance are desktop-only tiles.
  const showAtlas = !isMobile && dash.desktop.atlas
  const showTrips = isMobile ? dash.mobile.tripsTotal : dash.desktop.tripsTotal
  const showDays = isMobile ? dash.mobile.daysTraveled : dash.desktop.daysTraveled
  const showDistance = !isMobile && dash.desktop.distanceFlown
  if (!showAtlas && !showTrips && !showDays && !showDistance) return null

  // Reflow: the grid spreads the visible tiles to full width (the passport stays
  // proportionally wider). Set as CSS vars so the responsive media queries still win.
  const atlasTemplate =
    [dash.desktop.atlas && '1.5fr', dash.desktop.tripsTotal && '1fr', dash.desktop.daysTraveled && '1fr', dash.desktop.distanceFlown && '1fr']
      .filter(Boolean).join(' ') || '1fr'
  const atlasTemplateM =
    [dash.mobile.tripsTotal && '1fr', dash.mobile.daysTraveled && '1fr'].filter(Boolean).join(' ') || '1fr'

  const countries = stats?.countries || []
  const distanceKm = stats?.totalDistanceKm || 0
  const distance = convertDistance(distanceKm, distanceUnit)
  const distanceText = formatCompactDistance(distance)
  const equatorDistance = convertDistance(40075, distanceUnit)
  const equatorTimes = (distance / equatorDistance).toFixed(2)
  const distanceLabel = getDistanceUnitLabel(distanceUnit)

  return (
    <section className="atlas" style={{ '--atlas-template': atlasTemplate, '--atlas-template-m': atlasTemplateM } as React.CSSProperties}>
      {showAtlas && (
        <div className="atlas-card passport">
          <div className="label">{t('dashboard.atlas.countriesVisited')}</div>
          <div className="value mono">{countries.length} <span className="unit text-[oklch(1_0_0_/_.55)]">{t('dashboard.atlas.ofTotal', { total: 195 })}</span></div>
          <div className="passport-flags">
            {countries.slice(0, 5).map((c, i) => (
              <span key={i} className="flag" title={c}>
                <img src={`https://flagcdn.com/w40/${c.toLowerCase()}.png`} alt={c} loading="lazy" />
              </span>
            ))}
            {countries.length > 5 && <span className="flag more">+{countries.length - 5}</span>}
          </div>
          <div className="delta" />
        </div>
      )}

      {showTrips && (
        <div className="atlas-card">
          <div className="label">{t('dashboard.atlas.tripsTotal')}</div>
          <div className="value mono">{stats?.totalTrips ?? 0}</div>
          <div className="delta">{t('dashboard.atlas.placesMapped', { count: stats?.totalPlaces ?? 0 })}</div>
          <svg className="spark" width="80" height="36" viewBox="0 0 80 36">
            <polyline points="0,30 12,26 22,28 32,18 44,22 56,10 68,14 80,4" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {showDays && (
        <div className="atlas-card">
          <div className="label">{t('dashboard.atlas.daysTraveled')}</div>
          <div className="value mono">{stats?.totalDays ?? 0} <span className="unit">{t('dashboard.atlas.daysUnit')}</span></div>
          <div className="delta">{t('dashboard.atlas.acrossAllTrips')}</div>
          <svg className="spark" width="80" height="36" viewBox="0 0 80 36">
            <path d="M0 30 Q10 24 20 26 T40 20 T60 14 T80 10" fill="none" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {showDistance && (
        <div className="atlas-card">
          <div className="label">{t('dashboard.atlas.distanceFlown')}</div>
          <div className="value mono">{distanceText} <span className="unit">{distanceLabel}</span></div>
          <div className="delta">{t('dashboard.atlas.aroundEquator', { count: equatorTimes })}</div>
          <svg className="spark" width="80" height="36" viewBox="0 0 80 36">
            <circle cx="40" cy="18" r="14" fill="none" stroke="oklch(0.88 0.01 70)" strokeWidth="2" />
            <circle cx="40" cy="18" r="14" fill="none" strokeWidth="2" strokeDasharray="58 88" strokeLinecap="round" transform="rotate(-90 40 18)" />
          </svg>
        </div>
      )}
    </section>
  )
}

// ── Trip card ────────────────────────────────────────────────────────────────
function TripCard({ trip, locale, onOpen, onEdit, onCopy, onArchive, onDelete }: {
  trip: DashboardTrip; locale: string; onOpen: () => void
  onEdit: () => void; onCopy: () => void; onArchive: () => void; onDelete: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const status = getTripStatus(trip)
  const start = splitDate(trip.start_date, locale)
  const end = splitDate(trip.end_date, locale)
  const until = daysUntil(trip.start_date)

  const statusClass = status === 'ongoing' ? '' : status === 'past' ? 'completed' : status === 'future' || status === 'today' || status === 'tomorrow' ? 'upcoming' : 'idea'
  const statusLabel = status === 'ongoing' ? t('dashboard.mobile.liveNow')
    : status === 'today' ? t('dashboard.status.today')
    : status === 'tomorrow' ? t('dashboard.status.tomorrow')
    : status === 'future' && until !== null ? (until > 60 ? t('dashboard.mobile.inMonths', { count: Math.round(until / 30) }) : t('dashboard.mobile.inDays', { count: until }))
    : status === 'past' ? t('dashboard.mobile.completed')
    : t('dashboard.card.idea')

  const stop = (e: React.MouseEvent, fn: () => void) => { e.stopPropagation(); fn() }

  return (
    <article className="trip-card" onClick={onOpen}>
      <div className="trip-cover">
        {trip.cover_image
          ? <img src={trip.cover_image} alt={trip.title} />
          : <div style={{ width: '100%', height: '100%', background: tripGradient(trip.id) }} />}
        <div className={`trip-status ${statusClass}`}><span className="indicator" /> {statusLabel}</div>
        <div className="trip-actions">
          <button className="trip-action-btn" aria-label={t('common.edit')} onClick={(e) => stop(e, onEdit)}><Edit2 size={16} /></button>
          <button className="trip-action-btn" aria-label={t('dashboard.aria.duplicate')} onClick={(e) => stop(e, onCopy)}><Copy size={16} /></button>
          <button className="trip-action-btn" aria-label={trip.is_archived ? t('dashboard.restore') : t('dashboard.archive')} onClick={(e) => stop(e, onArchive)}><Archive size={16} /></button>
          <button className="trip-action-btn" aria-label={t('common.delete')} onClick={(e) => stop(e, onDelete)}><Trash2 size={16} /></button>
        </div>
        <div className="trip-cover-content">
          <h3 className="trip-name">{trip.title}</h3>
        </div>
      </div>
      <div className="trip-body">
        <div className="trip-dates">
          {start && end ? (
            <>
              <span className="date-num">{fullDate(trip.start_date, locale)}</span>
              <span className="date-arrow"><ArrowRight size={11} /></span>
              <span className="date-num">{fullDate(trip.end_date, locale)}</span>
            </>
          ) : <span>{t('dashboard.hero.noDates')}</span>}
        </div>
        <div className="trip-meta" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div><span className="n mono">{trip.day_count ?? 0}</span><span className="k">{t('dashboard.days')}</span></div>
          <div><span className="n mono">{trip.place_count ?? 0}</span><span className="k">{t('dashboard.places')}</span></div>
          <div><span className="n mono">{trip.shared_count ?? 0}</span><span className="k">{trip.shared_count === 1 ? t('dashboard.card.buddyOne') : t('dashboard.members')}</span></div>
        </div>
      </div>
    </article>
  )
}

// ── Currency tool (self-contained, mirrors the design's fx widget) ───────────
const FX_FALLBACK = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'CNY', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'TRY', 'THB', 'INR', 'BRL', 'MXN', 'ZAR']

function CurrencyTool(): React.ReactElement {
  const { t } = useTranslation()
  const isLoaded = useSettingsStore(s => s.isLoaded)
  const updateSetting = useSettingsStore(s => s.updateSetting)
  const from = useSettingsStore(s => s.settings.dashboard_fx_from) || 'EUR'
  const to = useSettingsStore(s => s.settings.dashboard_fx_to) || 'USD'
  const setFrom = (v: string) => { updateSetting('dashboard_fx_from', v).catch(() => {}) }
  const setTo = (v: string) => { updateSetting('dashboard_fx_to', v).catch(() => {}) }
  const [amount, setAmount] = useState('100')
  const [rates, setRates] = useState<Record<string, number> | null>(null)

  const fetchRate = React.useCallback(() => {
    fetch(`https://api.frankfurter.dev/v2/rates?base=${from}`)
      .then(r => r.json())
      .then((d: Array<{ quote: string; rate: number }>) => {
        if (!Array.isArray(d)) { setRates(null); return }
        // Frankfurter omits the base's own self-rate; seed it so `from` stays selectable.
        const map: Record<string, number> = { [from]: 1 }
        for (const r of d) map[r.quote] = r.rate
        setRates(map)
      })
      .catch(() => setRates(null))
  }, [from])

  useEffect(() => { fetchRate() }, [fetchRate])
  // One-time migration of the pre-3.1.3 localStorage values into the user's settings,
  // so a (docker) upgrade no longer resets the widget (#1311).
  useEffect(() => {
    if (!isLoaded) return
    const lf = localStorage.getItem('trek_fx_from')
    const lt = localStorage.getItem('trek_fx_to')
    if (!lf && !lt) return
    const writes: Promise<void>[] = []
    if (lf) writes.push(updateSetting('dashboard_fx_from', lf))
    if (lt) writes.push(updateSetting('dashboard_fx_to', lt))
    // Only drop the localStorage source once the server has durably stored the values, so a
    // failed write during a (docker) upgrade can't destroy the only copy (#1311). Retry next load.
    Promise.all(writes).then(() => {
      localStorage.removeItem('trek_fx_from')
      localStorage.removeItem('trek_fx_to')
    }).catch(() => { /* keep localStorage; retry on next load */ })
  }, [isLoaded, updateSetting])

  const currencies = rates ? Object.keys(rates).sort() : FX_FALLBACK
  const ccyOptions = currencies.map(c => ({ value: c, label: c }))
  const rate = rates?.[to] ?? null
  const converted = rate != null ? (parseFloat(amount.replace(',', '.')) || 0) * rate : null

  const swap = () => { setFrom(to); setTo(from) }

  return (
    <div className="tool">
      <div className="tool-head">
        <div className="tool-title"><RefreshCw size={14} /> {t('dashboard.currency')}</div>
        <button className="tool-action" aria-label={t('dashboard.aria.refreshRates')} onClick={fetchRate}><RefreshCw size={14} /></button>
      </div>
      <div className="fx-input">
        <div className="fx-field">
          <div className="lbl">{t('dashboard.fx.from')}</div>
          <input className="amt mono" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" />
          <CustomSelect value={from} onChange={v => setFrom(String(v))} options={ccyOptions} searchable size="sm" style={{ marginTop: 6 }} />
        </div>
        <button className="fx-swap" aria-label={t('dashboard.aria.swapCurrencies')} onClick={swap}><ArrowRightLeft size={14} /></button>
        <div className="fx-field">
          <div className="lbl">{t('dashboard.fx.to')}</div>
          <input className="amt mono" value={converted != null ? converted.toFixed(2) : '—'} readOnly />
          <CustomSelect value={to} onChange={v => setTo(String(v))} options={ccyOptions} searchable size="sm" style={{ marginTop: 6 }} />
        </div>
      </div>
      <div className="fx-rate">
        <span>{rate != null ? `1 ${from} = ${rate.toFixed(4)} ${to}` : t('dashboard.fx.unavailable')}</span>
      </div>
    </div>
  )
}

// ── Timezone tool ────────────────────────────────────────────────────────────
const DEFAULT_ZONES = ['Europe/London', 'Asia/Tokyo']

// Fallback for the rare browser without Intl.supportedValuesOf.
const FALLBACK_ZONES = [
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Moscow',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Singapore',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
]

function shortZone(tz: string): string {
  const city = tz.split('/').pop() || tz
  return city.replace(/_/g, ' ')
}

function TimezoneTool({ locale }: { locale: string }): React.ReactElement {
  const { t } = useTranslation()
  const home = Intl.DateTimeFormat().resolvedOptions().timeZone
  const [now, setNow] = useState(() => new Date())
  const isLoaded = useSettingsStore(s => s.isLoaded)
  const updateSetting = useSettingsStore(s => s.updateSetting)
  const stored = useSettingsStore(s => s.settings.dashboard_timezones)
  // Unset (never chosen) falls back to home + defaults; an explicit list is honoured.
  const zones = stored ?? [home, ...DEFAULT_ZONES]
  const setZones = (next: string[]) => { updateSetting('dashboard_timezones', next).catch(() => {}) }
  const [adding, setAdding] = useState(false)

  // A minute's resolution is plenty for clocks and keeps re-renders cheap.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  // One-time migration of the pre-3.1.3 localStorage value into the user's settings,
  // so a (docker) upgrade no longer resets the widget (#1311).
  useEffect(() => {
    if (!isLoaded) return
    const raw = localStorage.getItem('trek_dashboard_tz')
    if (!raw) return
    let parsed: unknown
    // A malformed/non-array value can never be written, so drop it now to avoid retrying forever.
    try { parsed = JSON.parse(raw) } catch { localStorage.removeItem('trek_dashboard_tz'); return }
    if (!Array.isArray(parsed)) { localStorage.removeItem('trek_dashboard_tz'); return }
    // Only drop the localStorage source once the server has durably stored the value, so a failed
    // write during a (docker) upgrade can't destroy the only copy (#1311). Retry next load.
    updateSetting('dashboard_timezones', parsed)
      .then(() => { localStorage.removeItem('trek_dashboard_tz') })
      .catch(() => { /* keep localStorage; retry on next load */ })
  }, [isLoaded, updateSetting])

  const allZones = React.useMemo<string[]>(() => {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
    try { return supported ? supported('timeZone') : FALLBACK_ZONES } catch { return FALLBACK_ZONES }
  }, [])

  const tzOptions = allZones
    .filter(z => !zones.includes(z))
    .map(z => ({ value: z, label: z.replace(/_/g, ' '), searchLabel: z }))

  const addZone = (tz: string) => { if (tz && !zones.includes(tz)) setZones([...zones, tz]); setAdding(false) }
  const removeZone = (tz: string) => setZones(zones.filter(z => z !== tz))

  const timeIn = (tz: string) => now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
  const offsetLabel = (tz: string) => {
    const part = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: 'short' }).formatToParts(now).find(p => p.type === 'timeZoneName')
    return part?.value || ''
  }

  return (
    <div className="tool">
      <div className="tool-head">
        <div className="tool-title"><Clock size={14} /> {t('dashboard.timezone')}</div>
        <button className="tool-action" aria-label={t('dashboard.aria.addTimezone')} onClick={() => setAdding(a => !a)}>
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>
      {adding && (
        <div style={{ marginBottom: 14 }}>
          <CustomSelect value="" onChange={addZone} options={tzOptions} searchable size="sm" placeholder={t('dashboard.tz.searchPlaceholder')} />
        </div>
      )}
      <div className="tz-list">
        {zones.map(tz => (
          <div className="tz-row" key={tz}>
            <div className="tz-dot">{shortZone(tz)[0]?.toUpperCase()}</div>
            <div>
              <div className="tz-city">{shortZone(tz)}</div>
              <div className="tz-sub">{offsetLabel(tz)}</div>
            </div>
            <div className="tz-time mono">{timeIn(tz)}</div>
            <button className="tz-del" aria-label={t('dashboard.aria.removeTimezone', { city: shortZone(tz) })} onClick={() => removeZone(tz)}><X size={13} /></button>
          </div>
        ))}
        {zones.length === 0 && (
          <div className="tz-empty">{t('dashboard.tz.empty')}</div>
        )}
      </div>
    </div>
  )
}

// ── Upcoming reservations tool ───────────────────────────────────────────────
function UpcomingTool({ items, locale, onOpen }: {
  items: UpcomingReservation[]; locale: string; onOpen: (tripId: number) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const timeFormat = useSettingsStore(s => s.settings.time_format)
  return (
    <div className="tool">
      <div className="tool-head">
        <div className="tool-title"><Calendar size={14} /> {t('dashboard.upcoming.title')}</div>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--ink-3)' }}>{t('dashboard.upcoming.empty')}</div>
      ) : (
        <div className="upc-list">
          {items.map(r => {
            // Read the date/time straight from the stored string parts. Going through
            // new Date(...).toISOString() reinterprets the naive local time as UTC and
            // can roll the displayed day forward/back in non-UTC timezones.
            const parsed = splitReservationDateTime(r.reservation_time)
            const datePart = parsed.date || r.day_date || null
            const dateStr = datePart ? splitDate(datePart, locale) : null
            const timeStr = parsed.time ? formatTime(parsed.time, locale, timeFormat) : null
            const typeClass = RES_TYPE_CLASS[r.type] || 'other'
            return (
              <div className="upc-item" key={r.id} onClick={() => onOpen(r.trip_id)}>
                <div className="upc-date"><div className="d mono">{dateStr?.d ?? '–'}</div><div className="m">{dateStr?.m ?? ''}</div></div>
                <div className="upc-info">
                  <div className="t">{r.title}</div>
                  <div className="s">
                    {timeStr && <><Clock size={11} /> {timeStr} · </>}
                    {r.location || r.place_name || r.trip_title}
                  </div>
                </div>
                <div className={`upc-type ${typeClass}`}>{RES_ICON[r.type] || <Ticket size={16} />}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
