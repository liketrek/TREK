import React from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowRight, ArrowRightLeft, Bookmark, Calendar, ChevronDown, ChevronRight,
  Clock, Hotel, LogIn, LogOut, MapPin, Plane, Plus, RefreshCw, Ticket, Utensils, X,
} from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import { useAddonStore } from '../../../store/addonStore'
import { entityGradient } from '../../../utils/gradients'
import { useCurrencyConverter } from '../../../components/Dashboard/useCurrencyConverter'
import { useCollectionLists } from '../../../components/Dashboard/useCollectionLists'
import { shortZone, useDashboardTimezones } from '../../../components/Dashboard/useDashboardTimezones'
import { formatTime, splitReservationDateTime } from '../../../utils/formatters'
import { normalizeAppearance, MOBILE_DASH_TOKENS, type MobileDashToken } from '@trek/shared'
import { MOMENT_LABEL, upcomingKey, type UpcomingReservation } from '../../../pages/dashboard/dashboardModel'

const RES_ICON: Record<string, React.ReactElement> = {
  flight: <Plane size={14} strokeWidth={2} />,
  hotel: <Hotel size={14} strokeWidth={2} />,
  restaurant: <Utensils size={14} strokeWidth={2} />,
  // A stay's two moments (#1934) — the stay itself covers a range and stays out
  // of a list of what happens next; arriving and leaving are points in time.
  checkin: <LogIn size={14} strokeWidth={2} />,
  checkout: <LogOut size={14} strokeWidth={2} />,
}

/**
 * Inline dashboard widget panels (currency, collections, timezones, upcoming
 * reservations) for the mobile dashboard. The blocks are rendered individually
 * by MDashboard so they can be interleaved with the trip list in a user-chosen
 * order; this module owns the widget bodies plus the order/visibility helpers.
 * Visibility follows the per-device appearance widget config; collections is
 * additionally gated by the admin addon.
 */

/** Reconcile a stored mobile-dashboard order: keep known tokens in order, drop
 *  unknown/duplicate ones, and append any missing tokens in their built-in spot. */
export function resolveMobileDashOrder(stored: string[] | undefined): MobileDashToken[] {
  const valid = new Set<string>(MOBILE_DASH_TOKENS)
  const seen = new Set<string>()
  const out: MobileDashToken[] = []
  for (const tok of stored ?? []) {
    if (valid.has(tok) && !seen.has(tok)) { seen.add(tok); out.push(tok as MobileDashToken) }
  }
  for (const tok of MOBILE_DASH_TOKENS) if (!seen.has(tok)) out.push(tok)
  return out
}

/** The resolved mobile-dashboard block order from the appearance blob. */
export function useMobileDashOrder(): MobileDashToken[] {
  const appearance = useSettingsStore(s => s.settings.appearance)
  return resolveMobileDashOrder(normalizeAppearance(appearance).dashboard.mobileOrder)
}

/** Which blocks are currently visible — trips always; widgets per flag (+ addon). */
export function useMobileDashVisibility(): Record<MobileDashToken, boolean> {
  const appearance = useSettingsStore(s => s.settings.appearance)
  const isAddonEnabled = useAddonStore(s => s.isEnabled)
  const w = normalizeAppearance(appearance).dashboard.mobile
  return {
    trips: true,
    currency: w.currency,
    collections: isAddonEnabled('collections') && w.collections,
    timezones: w.timezones,
    upcomingReservations: w.upcomingReservations,
  }
}

/** Render a single mobile dashboard widget block by token (null for 'trips'). */
export function MobileDashWidget({ id, upcoming }: { id: MobileDashToken; upcoming: UpcomingReservation[] }): React.ReactElement | null {
  switch (id) {
    case 'currency': return <MCurrencyWidget />
    case 'collections': return <MCollectionsWidget />
    case 'timezones': return <MTimezonesWidget />
    case 'upcomingReservations': return <MUpcomingWidget items={upcoming} />
    default: return null
  }
}

function WidgetPanel({ icon, title, action, children }: {
  icon: React.ReactElement
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}): React.ReactElement {
  return (
    <section className="mt-3 rounded-[20px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[14px]">
      <div className="flex items-center gap-[7px] font-geist text-[0.625rem] font-bold uppercase tracking-[.14em] text-m-faint">
        {icon}
        {title}
        {action && <span className="ms-auto flex">{action}</span>}
      </div>
      {children}
    </section>
  )
}

// ── Currency converter ───────────────────────────────────────────────────────
function MCurrencyWidget(): React.ReactElement {
  const { t } = useTranslation()
  // The request outlives the widget: this is a third-party endpoint on a mobile
  // screen a user can leave immediately, so a pending one is aborted on the way out.
  const { from, to, setFrom, setTo, amount, setAmount, currencies, rate, converted, swap, fetchRates } = useCurrencyConverter()

  return (
    <WidgetPanel
      icon={<RefreshCw size={12} strokeWidth={2.2} />}
      title={t('dashboard.currency')}
      action={
        <button type="button" aria-label={t('dashboard.aria.refreshRates')} onClick={fetchRates} className="flex text-m-faint">
          <RefreshCw size={13} strokeWidth={2} />
        </button>
      }
    >
      <div className="mt-[11px] flex items-center gap-2">
        <div className="min-w-0 flex-1 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[11px_12px]">
          <div className="font-geist text-[0.5625rem] font-bold uppercase tracking-[.1em] text-m-faint">{t('dashboard.fx.from')}</div>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="decimal"
            aria-label={t('dashboard.fx.from')}
            className="w-full border-none bg-transparent pt-[2px] font-[inherit] text-[1.5rem] font-bold tabular-nums text-m-ink outline-none"
          />
          <CurrencyPicker value={from} currencies={currencies} onChange={setFrom} />
        </div>
        <button
          type="button"
          onClick={swap}
          aria-label={t('dashboard.aria.swapCurrencies')}
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg"
        >
          <ArrowRightLeft size={15} strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[11px_12px]">
          <div className="font-geist text-[0.5625rem] font-bold uppercase tracking-[.1em] text-m-faint">{t('dashboard.fx.to')}</div>
          <div className="truncate pt-[2px] text-[1.5rem] font-bold tabular-nums">{converted != null ? converted.toFixed(2) : '—'}</div>
          <CurrencyPicker value={to} currencies={currencies} onChange={setTo} />
        </div>
      </div>
      <div className="mt-[9px] font-geist text-[0.65625rem] text-m-muted">
        {rate != null ? `1 ${from} = ${rate.toFixed(4)} ${to}` : t('dashboard.fx.unavailable')}
      </div>
    </WidgetPanel>
  )
}

// Picker row styled like the design, backed by an invisible native select so
// phones get their platform currency picker.
function CurrencyPicker({ value, currencies, onChange }: {
  value: string; currencies: string[]; onChange: (v: string) => void
}): React.ReactElement {
  return (
    <span className="relative mt-[9px] flex items-center justify-between gap-[5px] rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)] px-[10px] py-[7px] text-[0.75rem] font-semibold">
      {value}
      <ChevronDown size={12} strokeWidth={2} className="text-m-faint" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={value}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {currencies.includes(value) ? null : <option value={value}>{value}</option>}
        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </span>
  )
}

// ── Collections ──────────────────────────────────────────────────────────────
function MCollectionsWidget(): React.ReactElement {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { lists, loading } = useCollectionLists()

  return (
    <WidgetPanel
      icon={<Bookmark size={12} strokeWidth={2.2} />}
      title={t('collections.widget.title')}
      action={
        <button type="button" aria-label={t('collections.widget.title')} onClick={() => navigate('/collections')} className="flex text-m-faint">
          <ArrowRight size={13} strokeWidth={2} />
        </button>
      }
    >
      {loading ? null : lists.length === 0 ? (
        <div className="mt-[11px] font-geist text-[0.6875rem] text-m-muted">{t('collections.widget.empty')}</div>
      ) : (
        lists.slice(0, 4).map(list => (
          <button
            key={list.id}
            type="button"
            onClick={() => navigate(`/collections/${list.id}`)}
            className="mt-[11px] flex w-full items-center rounded-[14px] p-[15px_14px] text-start text-white"
            style={{ background: list.color || entityGradient(list.id) }}
          >
            <span className="min-w-0 flex-1 truncate text-[0.875rem] font-bold">{list.name}</span>
            <span className="ms-auto flex flex-none items-center gap-1 rounded-full bg-white/[.22] px-[10px] py-[3px] font-geist text-[0.625rem] font-bold">
              <MapPin size={10} strokeWidth={2.4} />
              {list.place_count ?? 0}
            </span>
          </button>
        ))
      )}
    </WidgetPanel>
  )
}

// ── Timezones ────────────────────────────────────────────────────────────────
function MTimezonesWidget(): React.ReactElement {
  const { t, locale } = useTranslation()
  const { zones, adding, setAdding, allZones, addZone, removeZone, timeIn, offsetLabel } = useDashboardTimezones(locale)

  return (
    <WidgetPanel
      icon={<Clock size={12} strokeWidth={2.2} />}
      title={t('dashboard.timezone')}
      action={
        <button type="button" aria-label={t('dashboard.aria.addTimezone')} onClick={() => setAdding(a => !a)} className="flex text-m-faint">
          {adding ? <X size={13} strokeWidth={2.2} /> : <Plus size={13} strokeWidth={2.2} />}
        </button>
      }
    >
      {adding && (
        <select
          value=""
          onChange={e => addZone(e.target.value)}
          aria-label={t('dashboard.aria.addTimezone')}
          className="mt-[11px] w-full rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[10px] py-2 text-[0.75rem] font-semibold text-m-ink outline-none"
        >
          <option value="" disabled>{t('dashboard.tz.searchPlaceholder')}</option>
          {allZones.filter(z => !zones.includes(z)).map(z => (
            <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>
          ))}
        </select>
      )}
      {zones.map(tz => (
        <div key={tz} className="flex items-center gap-[11px] border-b border-[color:var(--m-rowbr)] py-[9px]">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[0.75rem] font-bold">
            {shortZone(tz)[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.84375rem] font-semibold">{shortZone(tz)}</div>
            <div className="font-geist text-[0.625rem] text-m-faint">{offsetLabel(tz)}</div>
          </div>
          <span className="text-[1.25rem] font-bold tabular-nums">{timeIn(tz)}</span>
          {/* Rest state ends with the clock like the design; removing is part of the + edit mode. */}
          {adding && (
            <button
              type="button"
              aria-label={t('dashboard.aria.removeTimezone', { city: shortZone(tz) })}
              onClick={() => removeZone(tz)}
              className="flex flex-none text-m-faint"
            >
              <X size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      ))}
      {zones.length === 0 && (
        <div className="mt-[11px] font-geist text-[0.6875rem] text-m-muted">{t('dashboard.tz.empty')}</div>
      )}
    </WidgetPanel>
  )
}

// ── Upcoming reservations ────────────────────────────────────────────────────
function MUpcomingWidget({ items }: { items: UpcomingReservation[] }): React.ReactElement {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const timeFormat = useSettingsStore(s => s.settings.time_format)

  // Land on the trip's bookings tab — same sessionStorage contract the trip
  // shell and the bottom nav "+" use.
  const openReservation = (tripId: number) => {
    sessionStorage.setItem(`trip-tab-${tripId}`, 'buchungen')
    navigate(`/trips/${tripId}`)
  }

  const subFor = (r: UpcomingReservation): string => {
    const parsed = splitReservationDateTime(r.reservation_time)
    const datePart = parsed.date || r.day_date || null
    const date = datePart ? new Date(datePart + 'T00:00:00Z') : null
    const dateStr = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
      : null
    const timeStr = parsed.time ? formatTime(parsed.time, locale, timeFormat) : null
    const tail = MOMENT_LABEL[r.type] ? t(MOMENT_LABEL[r.type]) : (r.location || r.place_name || r.trip_title || null)
    return [dateStr, timeStr, tail].filter(Boolean).join(' · ')
  }

  return (
    <WidgetPanel icon={<Calendar size={12} strokeWidth={2.2} />} title={t('dashboard.upcoming.title')}>
      {items.length === 0 ? (
        <div className="mt-[11px] font-geist text-[0.6875rem] text-m-muted">{t('dashboard.upcoming.empty')}</div>
      ) : (
        items.map(r => (
          <button
            key={upcomingKey(r)}
            type="button"
            onClick={() => openReservation(r.trip_id)}
            className="flex w-full items-center gap-[11px] border-b border-[color:var(--m-rowbr)] py-[9px] text-start"
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[11px] bg-[color:var(--m-ic)]">
              {RES_ICON[r.type] || <Ticket size={14} strokeWidth={2} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[0.8125rem] font-semibold">{r.title}</span>
                {r.status === 'pending' && (
                  <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-[6px] py-px font-geist text-[0.5625rem] font-bold uppercase tracking-[.08em] text-m-muted">
                    {t('reservations.pending')}
                  </span>
                )}
              </div>
              <div className="truncate font-geist text-[0.625rem] text-m-muted">{subFor(r)}</div>
            </div>
            <ChevronRight size={14} strokeWidth={2} className="flex-none text-m-faint" />
          </button>
        ))
      )}
    </WidgetPanel>
  )
}
