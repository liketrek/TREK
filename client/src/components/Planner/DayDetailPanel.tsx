import React, { useEffect, useRef, useId, type ReactNode } from 'react'
import { X, CloudRain, Wind, Droplets, Sunrise, Sunset, Hotel, Calendar, MapPin, LogIn, LogOut, Pencil, ChevronsDown, ChevronsUp, ArrowRight, Check, Moon, type LucideIcon } from 'lucide-react'
import type { WeatherResult } from '@trek/shared'
import { usePluginViewContributions, PluginCardFooter } from '../Plugins/PluginContributions'
import { usePluginStore } from '../../store/pluginStore'
import PluginFrame from '../Plugins/PluginFrame'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import CustomSelect from '../shared/CustomSelect'
import CustomTimePicker from '../shared/CustomTimePicker'
import { BlurredCode, BookingCodeInput } from '../shared/BookingCode'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { dayHeadingParts } from '../../utils/dayLabel'
import { stayDayTimes } from './stayDayTimes'
import { useToast } from '../shared/Toast'
import { getLocaleForLanguage, useTranslation } from '../../i18n'
import type { Day, Place, Category, Reservation, AssignmentsMap, Accommodation } from '../../types'
import { formatClockTime, splitReservationDateTime } from '../../utils/formatters'
import { useDayDetail, useDayRename, type HotelDayRange, type HotelForm, type HotelPickerMode } from './useDayDetail'
import { dayBookings, stayDayLabel, toDisplayTemp } from './dayDetailModel'
import { stayDayOptions, stayFormFrom, stayPlaceChoices, stayRangeFromEnd, stayRangeFromStart } from './stayFormModel'
import { DialogShell, DialogHeader, DialogSection, DialogFooter, DialogButton, FooterSpacer, NEUTRAL_TINT, PILL, fs } from '../shared/DialogShell'
import { INPUT, PANEL, EditorField, AddRowButton, PillSelect } from '../shared/dialogParts'
import { BOX, Eyebrow, Field, RoundAction, TypeTile, toneOf, toneColor, toneTint } from './bookings/bookingParts'
import { SoftPill, TimePill, tintOf } from './planParts'
import { typeInfo } from './bookings/bookingsModel'
import { weatherIconFor } from '../Weather/weatherIcons'

function WIcon({ main, size = 14 }: { main: string; size?: number }) {
  const Icon = weatherIconFor(main)
  return <Icon size={size} strokeWidth={1.8} />
}

/** What the server said when it refused a write, or the generic line. */
function apiErrorMessage(err: unknown): string | undefined {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error
}

interface DayDetailPanelProps {
  day: Day
  days: Day[]
  places: Place[]
  categories?: Category[]
  tripId: number
  assignments: AssignmentsMap
  reservations?: Reservation[]
  lat: number | null
  lng: number | null
  onClose: () => void
  onAccommodationChange: () => void
  leftWidth?: number
  rightWidth?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobile?: boolean
  /** Rename the day from here — the sidebar pencil moved to the transit search (#1065). */
  onUpdateDayTitle?: (dayId: number, title: string) => void
  /** Name of the place the day's weather is anchored to — captioned above the forecast (#2167). */
  weatherPlaceName?: string | null
  /** Open the stay editor for a new accommodation as soon as the panel is up (the day's "+"). */
  openStayPicker?: boolean
  /** Called once the stay editor is open, so the request is not taken twice. */
  onStayPickerOpened?: () => void
  /** Shows a booking's detail. Given, the day's bookings and a stay's booking open it on a click. */
  onOpenBooking?: (reservation: Reservation) => void
}

/**
 * The card a selected day opens over the map: its name and date in a tinted
 * head band that folds the card away, then the weather, the bookings of the
 * day and where the night is spent, each under its own label.
 */
export default function DayDetailPanel({ day, days, places, categories = [], tripId, assignments, reservations = [], lat, lng, onClose, onAccommodationChange, leftWidth = 0, rightWidth = 0, collapsed: collapsedProp = false, onToggleCollapse, mobile = false, onUpdateDayTitle, weatherPlaceName = null, openStayPicker = false, onStayPickerOpened, onOpenBooking }: DayDetailPanelProps) {
  const { t, language } = useTranslation()
  const can = useCanDo()
  const toast = useToast()
  const tripObj = useTripStore((s) => s.trip)
  const canEditDays = can('day_edit', tripObj)
  const isFahrenheit = useSettingsStore(s => s.settings.temperature_unit) === 'fahrenheit'
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const dateFirst = useSettingsStore(s => s.settings.day_date_first === true)
  const collapsed = collapsedProp
  const toggleCollapse = () => onToggleCollapse?.()

  // Inline day rename (#1065) — took over from the sidebar's pencil, which the
  // transit search button replaced.
  const { editingTitle, setEditingTitle, titleDraft, setTitleDraft, titleInputRef, startRename: openRename, commitRename } = useDayRename(title => {
    if (day && onUpdateDayTitle) onUpdateDayTitle(day.id, title)
  })
  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    openRename(day?.title || '')
  }
  const {
    weather, loading, accommodation, setAccommodation, dayAccommodations,
    showHotelPicker, setShowHotelPicker,
    hotelDayRange, setHotelDayRange, hotelCategoryFilter, setHotelCategoryFilter,
    hotelForm, setHotelForm, handleSelectPlace, handleSaveAccommodation, handleUpdateAccommodation,
    handleRemoveAccommodation,
  } = useDayDetail(day, days, tripId, lat, lng, language, onAccommodationChange)
  // The day's "+" asked for a new stay: open the editor once and hand the request back.
  useEffect(() => {
    if (!openStayPicker) return
    if (canEditDays) setShowHotelPicker(true)
    onStayPickerOpened?.()
  }, [openStayPicker, canEditDays, setShowHotelPicker, onStayPickerOpened])
  // Plugin-contributed columns/actions for the day view, keyed by day id (#plugins).
  // day can be null (panel closed) and hooks must run before the early return, so guard it.
  const dayContributions = usePluginViewContributions('day', tripId)(day?.id ?? -1)
  // Plugins that declared a day-detail slot mount at the bottom of this panel,
  // scoped to the open day. Inline-filter like the place-detail site.
  const dayDetailPlugins = usePluginStore((s) => s.plugins).filter((p) => p.type === 'widget' && p.slot === 'day-detail')

  // Publish the panel's live height as a root CSS var so the map's mobile GPS
  // button can sit just above the panel instead of being hidden behind it (#1348).
  // The card grows/shrinks (collapse, content, ≤60vh), so track it live.
  const cardRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const root = document.documentElement
    const publish = () => root.style.setProperty('--day-panel-h', `${el.offsetHeight}px`)
    publish()
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(publish)
      ro.observe(el)
    }
    return () => {
      ro?.disconnect()
      root.style.setProperty('--day-panel-h', '0px')
    }
  }, [])

  if (!day) return null

  const formattedDate = day.date ? new Date(day.date + 'T00:00:00Z').toLocaleDateString(
    getLocaleForLanguage(language),
    { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }
  ) : null
  const heading = dayHeadingParts(day.title || t('planner.dayN', { n: (days.indexOf(day) + 1) || '?' }), formattedDate, dateFirst)
  const showError = (err: unknown) => toast.error(apiErrorMessage(err) || t('common.unknownError'))

  // Saving the picker: a new stay or the one being edited. Both say what went
  // wrong when the write fails, otherwise the picker just sits there with the
  // Save button doing nothing; it stays open so nothing typed is lost.
  const saveHotelPicker = async () => {
    try {
      if (showHotelPicker === 'edit' && accommodation) await handleUpdateAccommodation()
      else await handleSaveAccommodation()
    } catch (err: unknown) {
      showError(err)
    }
  }
  const editAccommodation = (acc: Accommodation) => {
    setAccommodation(acc)
    setHotelForm(stayFormFrom(acc, null))
    setHotelDayRange({ start: acc.start_day_id, end: acc.end_day_id })
    setShowHotelPicker('edit')
  }
  const removeAccommodation = (acc: Accommodation) => { handleRemoveAccommodation(acc).catch(showError) }

  return (
    <div className="fixed z-50" style={{ bottom: 'calc(var(--bottom-nav-h) + 20px)', left: `calc(${leftWidth}px + (100vw - ${leftWidth}px - ${rightWidth}px) / 2)`, transform: 'translateX(-50%)', width: `min(800px, calc(100vw - ${leftWidth}px - ${rightWidth}px - 32px))`, ...(mobile ? { zIndex: 10000 } : null), fontFamily: 'var(--font-system)' }}>
      <div ref={cardRef}
        className="flex flex-col overflow-hidden rounded-[20px] border border-edge-faint bg-surface-elevated shadow-popover backdrop-blur-[40px] backdrop-saturate-[1.8]"
        style={{ maxHeight: collapsed ? 'none' : '60vh' }}>
        {/* Head band. Clicking it folds the card, but that is a mouse shortcut for
            the chevron button, a real button with a name that does the same thing.
            So the band declares itself presentational instead of becoming a second,
            unlabelled tab stop wrapped around the rename input and the buttons. */}
        <div role="presentation" onClick={() => toggleCollapse()}
          className={`flex flex-none cursor-pointer items-center gap-3 px-4 ${collapsed ? 'py-2.5' : 'border-b border-edge-faint py-3.5'}`}
          style={{ background: NEUTRAL_TINT }}>
          <span className={`grid flex-none place-items-center rounded-[14px] bg-surface-card text-content shadow-sm transition-all ${collapsed ? 'h-9 w-9' : 'h-[46px] w-[46px]'}`}>
            <Calendar size={collapsed ? 16 : 20} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onClick={e => e.stopPropagation()}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingTitle(false) }}
                placeholder={t('planner.dayN', { n: (days.indexOf(day) + 1) || '?' })}
                className="w-full border-0 border-b-[1.5px] border-content bg-transparent p-0 font-bold text-content outline-none placeholder:text-content-faint"
                style={fs(17, 'subtitle')}
              />
            ) : collapsed ? (
              <div className="truncate font-bold text-content" style={fs(13.5, 'body')}>
                {heading.primary}
                {heading.secondary && <span className="ms-2 font-medium text-content-muted">{heading.secondary}</span>}
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-1">
                <span className="truncate font-bold tracking-[-0.01em] text-content" style={fs(17, 'subtitle')}>{heading.primary}</span>
                {canEditDays && onUpdateDayTitle && (
                  <Tooltip label={t('common.edit')}>
                    <button type="button" onClick={startRename} aria-label={t('common.edit')}
                      className="grid h-6 w-6 flex-none place-items-center rounded-full text-content-faint hover:bg-surface-card hover:text-content">
                      <Pencil size={12} strokeWidth={2} />
                    </button>
                  </Tooltip>
                )}
              </div>
            )}
            {!collapsed && heading.secondary && <div className="mt-0.5 truncate font-geist text-content-muted" style={fs(12.5)}>{heading.secondary}</div>}
          </div>
          <HeadButton label={collapsed ? t('common.expand') : t('common.collapse')} expanded={!collapsed}
            onClick={() => toggleCollapse()}>
            {collapsed ? <ChevronsUp size={15} strokeWidth={2} /> : <ChevronsDown size={15} strokeWidth={2} />}
          </HeadButton>
          <HeadButton label={t('common.close')} onClick={onClose}>
            <X size={15} strokeWidth={2.2} />
          </HeadButton>
        </div>

        {/* The body stays mounted while folded, so the weather and the picker keep their state. */}
        <div data-testid="day-detail-scroll"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4 pt-3.5"
          style={collapsed ? { display: 'none' } : undefined}>

          {!!(day.date && lat && lng) && (
            <DayWeather weather={weather} loading={loading} isFahrenheit={isFahrenheit} placeName={weatherPlaceName} />
          )}

          {dayContributions.length > 0 && <PluginCardFooter items={dayContributions} tripId={tripId} />}

          <DayReservations day={day} assignments={assignments} reservations={reservations} is12h={is12h} onOpen={onOpenBooking} />

          <DialogSection label={t('day.accommodation')}>
            <div className="flex flex-col gap-2">
              {dayAccommodations.map(acc => (
                <AccommodationCard key={acc.id} acc={acc} day={day}
                  linked={reservations.find(r => r.accommodation_id === acc.id)}
                  canEdit={canEditDays}
                  onEdit={() => editAccommodation(acc)}
                  onRemove={() => removeAccommodation(acc)}
                  onOpenBooking={onOpenBooking} />
              ))}
              {canEditDays && (
                <AddRowButton onClick={() => setShowHotelPicker(true)}>{t('day.addAccommodation')}</AddRowButton>
              )}
            </div>
          </DialogSection>

          {/* Day-detail plugin slots: sandboxed, scoped to this day. */}
          {dayDetailPlugins.length > 0 && (
            <div className="flex flex-col gap-2">
              {dayDetailPlugins.map((p) => (
                <div key={p.id} className={`${BOX} overflow-hidden`}>
                  <PluginFrame pluginId={p.id} tripId={String(tripId)} dayId={String(day.id)} title={p.name} surface="detail-slot" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <HotelPickerModal mode={showHotelPicker} onClose={() => setShowHotelPicker(false)} onSave={() => { void saveHotelPicker() }}
        days={days} categories={categories} places={places}
        hotelDayRange={hotelDayRange} setHotelDayRange={setHotelDayRange}
        hotelForm={hotelForm} setHotelForm={setHotelForm}
        hotelCategoryFilter={hotelCategoryFilter} setHotelCategoryFilter={setHotelCategoryFilter}
        onSelectPlace={handleSelectPlace} />
    </div>
  )
}

/** A round button on the head band. It keeps its click from folding the card. */
function HeadButton({ label, onClick, expanded, children }: { label: string; onClick: () => void; expanded?: boolean; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <button type="button" aria-label={label} aria-expanded={expanded}
        onClick={e => { e.stopPropagation(); onClick() }}
        className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm transition-colors hover:text-content">
        {children}
      </button>
    </Tooltip>
  )
}

/** A weather fact as a pill: the icon and the value, the label in its tooltip and for screen readers. */
function WeatherChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Tooltip label={label}>
      <span className="inline-flex">
        <SoftPill icon={<Icon size={11} strokeWidth={2} className="flex-none text-content-faint" />}>
          <span className="sr-only">{label}: </span>{value}
        </SoftPill>
      </span>
    </Tooltip>
  )
}

function DayWeather({ weather, loading, isFahrenheit, placeName }: { weather: WeatherResult | null; loading: boolean; isFahrenheit: boolean; placeName: string | null }) {
  const { t } = useTranslation()
  if (loading) {
    return (
      <div role="status" aria-label={t('common.loading')} className="flex justify-center py-3">
        <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-edge border-t-content" />
      </div>
    )
  }
  if (!weather) return <p className="m-0 py-1 text-center text-content-faint" style={fs(12, 'body')}>{t('day.noWeather')}</p>

  const unit = isFahrenheit ? '°F' : '°C'
  const hours = (weather.hourly || []).filter((_, i) => i % 2 === 0)
  return (
    <section className="flex flex-col gap-2.5">
      {/* Which place the forecast is for — on a roadtrip "the day's weather"
          is ambiguous without it (#2167). */}
      {placeName && <Eyebrow>{t('day.weatherFor', { name: placeName })}</Eyebrow>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-surface-card text-content shadow-sm">
          <WIcon main={weather.main} size={20} />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-bold leading-none tabular-nums tracking-[-0.01em] text-content" style={fs(22, 'subtitle')}>
            {weather.type === 'climate' ? 'Ø ' : ''}{toDisplayTemp(weather.temp, isFahrenheit)}{unit}
          </span>
          {weather.temp_max != null && (
            <span className="tabular-nums text-content-faint" style={fs(12, 'body')}>
              {toDisplayTemp(weather.temp_min, isFahrenheit)}° / {toDisplayTemp(weather.temp_max, isFahrenheit)}°
            </span>
          )}
          {weather.description && <span className="capitalize text-content-muted" style={fs(12.5, 'body')}>{weather.description}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {weather.precipitation_probability_max != null && (
            <WeatherChip icon={Droplets} label={t('day.precipProb')} value={`${weather.precipitation_probability_max}%`} />
          )}
          {(weather.precipitation_sum ?? 0) > 0 && (
            <WeatherChip icon={CloudRain} label={t('day.precipitation')} value={`${(weather.precipitation_sum ?? 0).toFixed(1)} mm`} />
          )}
          {weather.wind_max != null && (
            <WeatherChip icon={Wind} label={t('day.wind')} value={isFahrenheit ? `${Math.round(weather.wind_max * 0.621371)} mph` : `${Math.round(weather.wind_max)} km/h`} />
          )}
          {weather.sunrise && <WeatherChip icon={Sunrise} label={t('day.sunrise')} value={weather.sunrise} />}
          {weather.sunset && <WeatherChip icon={Sunset} label={t('day.sunset')} value={weather.sunset} />}
        </div>
      </div>

      {hours.length > 0 && (
        <div className="min-w-0">
          <Eyebrow className="mb-[3px]">{t('day.hourlyForecast')}</Eyebrow>
          <div className={`${BOX} overflow-x-auto p-1`}>
            <div className="inline-flex gap-0.5">
              {hours.map(h => (
                <div key={h.hour} className={`flex w-11 flex-none flex-col items-center gap-[3px] rounded-[8px] px-0.5 py-[5px] text-content ${h.precipitation_probability > 50 ? 'bg-info-soft' : ''}`}>
                  <span className="font-geist font-medium tabular-nums text-content-faint" style={fs(9)}>{String(h.hour).padStart(2, '0')}</span>
                  <WIcon main={h.main} size={12} />
                  <span className="font-semibold tabular-nums text-content" style={fs(10.5)}>{toDisplayTemp(h.temp, isFahrenheit)}°</span>
                  {h.precipitation_probability > 0 && (
                    <span className="font-medium tabular-nums text-info" style={fs(8.5)}>{h.precipitation_probability}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {weather.type === 'climate' && <p className="m-0 italic text-content-faint" style={fs(10.5)}>{t('day.climateHint')}</p>}
    </section>
  )
}

/** A row or box that opens a booking: the hover lift and focus ring of the inspector's booking cards. */
const OPENS_BOOKING = 'w-full cursor-pointer text-start transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--text-primary)]'

/** The bookings of the day, hotels aside (they have their own block). With `onOpen` each row opens its booking. */
function DayReservations({ day, assignments, reservations, is12h, onOpen }: { day: Day; assignments: AssignmentsMap; reservations: Reservation[]; is12h: boolean; onOpen?: (r: Reservation) => void }) {
  const { t } = useTranslation()
  const dayAssignments = assignments[String(day.id)] || []
  const dayReservations = dayBookings(day.id, dayAssignments, reservations)
  if (dayReservations.length === 0) return null
  return (
    <DialogSection label={t('day.reservations')}>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {dayReservations.map(r => {
          const linkedAssignment = dayAssignments.find(a => a.id === r.assignment_id)
          const tone = toneOf(r)
          const status = tone === 'transit' ? null : tone === 'confirmed' ? t('reservations.confirmed') : t('reservations.pending')
          const { time: startTime } = splitReservationDateTime(r.reservation_time)
          const { time: endTime } = splitReservationDateTime(r.reservation_end_time)
          const row = 'flex min-w-0 items-center gap-2.5 rounded-[10px] border border-edge-faint px-2 py-1.5'
          const content = (
            <>
              <TypeTile type={r.type} size={26} />
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate font-semibold text-content" style={fs(12.5, 'body')}>{r.title}</span>
                {linkedAssignment?.place && <span className="truncate text-content-faint" style={fs(11)}>{linkedAssignment.place.name}</span>}
              </span>
              {(startTime || endTime) && (
                <TimePill>
                  {startTime ? formatClockTime(startTime, is12h) : ''}
                  {endTime ? ` – ${formatClockTime(endTime, is12h)}` : ''}
                </TimePill>
              )}
              {status && (
                <Tooltip label={status}>
                  <span role="img" aria-label={status} className="mx-1 h-2 w-2 flex-none rounded-full" style={{ background: toneColor(tone) }} />
                </Tooltip>
              )}
            </>
          )
          if (!onOpen) return <li key={r.id} className={row} style={{ background: toneTint(tone) }}>{content}</li>
          return (
            <li key={r.id}>
              <button type="button" onClick={() => onOpen(r)} className={`${row} ${OPENS_BOOKING}`} style={{ background: toneTint(tone) }}>{content}</button>
            </li>
          )
        })}
      </ul>
    </DialogSection>
  )
}

function AccommodationCard({ acc, day, linked, canEdit, onEdit, onRemove, onOpenBooking }: {
  acc: Accommodation
  day: Day
  linked: Reservation | undefined
  canEdit: boolean
  onEdit: () => void
  onRemove: () => void
  /** Given, the stay's booking box opens that booking. */
  onOpenBooking?: (reservation: Reservation) => void
}) {
  const { t, locale } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const fmtTime = (v: string) => {
    if (v.includes('T')) return new Date(v).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: is12h })
    return formatClockTime(v, is12h)
  }
  const isCheckInDay = acc.start_day_id === day.id
  const isCheckOutDay = acc.end_day_id === day.id
  const dayLabel = stayDayLabel(acc, day.id, t)
  const leaving = isCheckOutDay && !isCheckInDay
  const tint = isCheckInDay ? tintOf('var(--success)') : isCheckOutDay ? tintOf('var(--danger)') : NEUTRAL_TINT
  const cells: { label: string; value: ReactNode }[] = []
  const times = stayDayTimes(acc, day.id)
  if (times.checkIn && acc.check_in) cells.push({ label: t('day.checkIn'), value: `${fmtTime(acc.check_in)}${acc.check_in_end ? ` – ${fmtTime(acc.check_in_end)}` : ''}` })
  if (times.checkOut && acc.check_out) cells.push({ label: t('day.checkOut'), value: fmtTime(acc.check_out) })
  if (acc.confirmation) cells.push({ label: t('day.confirmation'), value: <BlurredCode className="font-geist">{acc.confirmation}</BlurredCode> })
  const confirmed = linked?.status === 'confirmed'

  return (
    <article className="group overflow-hidden rounded-2xl border border-edge-faint bg-surface-secondary">
      <div className="flex items-center gap-2.5 px-3 py-2" style={{ background: tint }}>
        <span className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-[10px] bg-surface-card text-content-muted shadow-sm">
          {acc.place_image
            ? <img src={acc.place_image} alt="" className="h-full w-full object-cover" />
            : <Hotel size={16} strokeWidth={1.9} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-content" style={fs(13.5, 'body')}>{acc.place_name}</div>
          {acc.place_address && <div className="truncate text-content-faint" style={fs(11)}>{acc.place_address}</div>}
        </div>
        {dayLabel && (
          <SoftPill tone={leaving ? 'danger' : 'success'} caps
            icon={leaving ? <LogOut size={10} strokeWidth={2.2} /> : <LogIn size={10} strokeWidth={2.2} />}>
            {dayLabel}
          </SoftPill>
        )}
        {canEdit && <RoundAction label={t('day.editAccommodation')} onClick={onEdit}><Pencil size={12} strokeWidth={2} /></RoundAction>}
        {canEdit && <RoundAction label={t('inspector.remove')} onClick={onRemove} danger><X size={13} strokeWidth={2.2} /></RoundAction>}
      </div>
      {(cells.length > 0 || linked) && (
        <div className="flex flex-col gap-2 border-t border-edge-faint px-3 pb-3 pt-2.5">
          {cells.length > 0 && (
            <div className="flex gap-2">
              {cells.map(c => <Field key={c.label} label={c.label} className="flex-1" tabular>{c.value}</Field>)}
            </div>
          )}
          {linked && (
            <div className="min-w-0">
              <Eyebrow className="mb-[3px]">{t('places.formReservation')}</Eyebrow>
              {(() => {
                const box = `${BOX} flex min-w-0 items-center gap-2 px-2.5 py-1.5`
                // A box that opens the booking is a button itself, so the code in it is
                // no second button and stays out of the button's name; the booking it
                // opens shows the code and reveals it.
                const content = (
                  <>
                    <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(12, 'body')}>{linked.title}</span>
                    <SoftPill tone={confirmed ? 'success' : 'warning'}>{confirmed ? t('reservations.confirmed') : t('reservations.pending')}</SoftPill>
                    {linked.confirmation_number && (
                      <span aria-hidden={onOpenBooking ? true : undefined} className="flex-none font-geist tabular-nums text-content-muted" style={fs(11)}>
                        <BlurredCode interactive={!onOpenBooking}>#{linked.confirmation_number}</BlurredCode>
                      </span>
                    )}
                  </>
                )
                if (!onOpenBooking) return <div className={box}>{content}</div>
                return (
                  <button type="button" data-no-press onClick={() => onOpenBooking(linked)} className={`${box} ${OPENS_BOOKING}`}>
                    {content}
                  </button>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

interface HotelPickerModalProps {
  mode: HotelPickerMode
  onClose: () => void
  onSave: () => void
  days: Day[]
  categories: Category[]
  places: Place[]
  hotelDayRange: HotelDayRange
  setHotelDayRange: React.Dispatch<React.SetStateAction<HotelDayRange>>
  hotelForm: HotelForm
  setHotelForm: React.Dispatch<React.SetStateAction<HotelForm>>
  hotelCategoryFilter: number | ''
  setHotelCategoryFilter: (id: number | '') => void
  onSelectPlace: (placeId: number) => void
}

/** The stay editor: which days, the times, the code, and the place to sleep at. */
function HotelPickerModal({ mode, onClose, onSave, days, categories, places, hotelDayRange, setHotelDayRange,
  hotelForm, setHotelForm, hotelCategoryFilter, setHotelCategoryFilter, onSelectPlace }: HotelPickerModalProps) {
  const { t, locale } = useTranslation()
  const titleId = useId()
  const codeId = useId()
  const startId = useId()
  const endId = useId()
  if (!mode) return null

  const dayLabel = (d: Day, i: number) => d.title || t('planner.dayN', { n: i + 1 })
  const dayOptions = stayDayOptions(days, t, locale)
  const position = (id: number | undefined) => days.findIndex(d => d.id === id)
  const allDays = hotelDayRange.start === days[0]?.id && hotelDayRange.end === days[days.length - 1]?.id
  const filtered = stayPlaceChoices<Place>(places, hotelForm.place_id, hotelCategoryFilter || null)
  const setTime = (field: 'check_in' | 'check_in_end' | 'check_out') => (v: string) => setHotelForm(f => ({ ...f, [field]: v }))
  const picked = places.find(p => p.id === hotelForm.place_id) ?? null
  const startAt = position(hotelDayRange.start)
  const endAt = position(hotelDayRange.end)
  const nights = startAt >= 0 && endAt > startAt ? endAt - startAt : 0
  const categoryOptions = [
    { value: '', label: t('places.allCategories') },
    ...categories.map(c => ({
      value: String(c.id),
      label: c.name,
      icon: <span className="h-2 w-2 flex-none rounded-full" style={{ background: c.color || 'var(--text-faint)' }} />,
    })),
  ]

  return (
    <DialogShell onClose={onClose} labelledBy={titleId} width="wide"
      header={(
        <DialogHeader
          tile={<TypeTile type="hotel" size={46} raised />}
          tint={tintOf(typeInfo('hotel').color, 11)}
          labelId={titleId}
          onClose={onClose}
          eyebrow={mode === 'edit' ? t('day.editAccommodation') : t('day.addAccommodation')}
          // The stay is named by where it sleeps; until one is picked the title asks for it.
          title={picked ? picked.name : <span className="text-content-faint">{t('reservations.meta.pickHotel')}</span>}
          sub={picked?.address || undefined}
          pills={startAt >= 0 ? (
            <>
              <span className={PILL}>
                <Calendar size={13} strokeWidth={2.2} className="text-content-faint" />
                {dayLabel(days[startAt], startAt)}
                {endAt > startAt && <><ArrowRight size={12} strokeWidth={2.2} className="text-content-faint" />{dayLabel(days[endAt], endAt)}</>}
              </span>
              {/* The moon says "nights"; the word stays in the tooltip, since "5 Nights" has no plural rule behind it. */}
              {nights > 0 && (
                <Tooltip label={`${t('reservations.nights')}: ${nights}`}>
                  <span className={PILL} aria-label={`${t('reservations.nights')}: ${nights}`} role="img">
                    <Moon size={13} strokeWidth={2.2} className="text-content-faint" />
                    <span className="tabular-nums">{nights}</span>
                  </span>
                </Tooltip>
              )}
            </>
          ) : undefined}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={onSave} disabled={!hotelForm.place_id}>{t('common.save')}</DialogButton>
        </DialogFooter>
      )}
    >
      <DialogSection label={t('day.hotelDayRange')}>
        <div className={PANEL}>
          <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2 max-sm:grid-cols-1">
            <EditorField label={t('reservations.start')} htmlFor={startId}>
              <CustomSelect
                id={startId}
                value={hotelDayRange.start ?? ''}
                onChange={v => { const id = Number(v); setHotelDayRange(prev => stayRangeFromStart(days, prev, id)) }}
                options={dayOptions}
                size="sm"
              />
            </EditorField>
            <ArrowRight size={14} strokeWidth={2} className="mb-3 flex-none text-content-faint max-sm:hidden" aria-hidden />
            <EditorField label={t('reservations.end')} htmlFor={endId}>
              <CustomSelect
                id={endId}
                value={hotelDayRange.end ?? ''}
                onChange={v => { const id = Number(v); setHotelDayRange(prev => stayRangeFromEnd(days, prev, id)) }}
                options={dayOptions}
                size="sm"
              />
            </EditorField>
            <DialogButton aria-pressed={allDays} active={allDays}
              onClick={() => setHotelDayRange({ start: days[0]?.id, end: days[days.length - 1]?.id })}>
              {t('day.allDays')}
            </DialogButton>
          </div>
          <div className="grid grid-cols-3 items-start gap-3 max-sm:grid-cols-1">
            <EditorField label={t('day.checkIn')}>
              <CustomTimePicker value={hotelForm.check_in} onChange={setTime('check_in')} placeholder="14:00" aria-label={t('day.checkIn')} />
            </EditorField>
            <EditorField label={t('day.checkInUntil')}>
              <CustomTimePicker value={hotelForm.check_in_end} onChange={setTime('check_in_end')} placeholder="22:00" aria-label={t('day.checkInUntil')} />
            </EditorField>
            <EditorField label={t('day.checkOut')}>
              <CustomTimePicker value={hotelForm.check_out} onChange={setTime('check_out')} placeholder="11:00" aria-label={t('day.checkOut')} />
            </EditorField>
          </div>
          <EditorField label={t('day.confirmation')} htmlFor={codeId}>
            <BookingCodeInput id={codeId} value={hotelForm.confirmation} onChange={e => setHotelForm(f => ({ ...f, confirmation: e.target.value }))}
              placeholder="ABC-12345" className={INPUT} />
          </EditorField>
        </div>
      </DialogSection>

      <DialogSection label={t('reservations.meta.pickHotel')}
        action={categories.length > 0 ? (
          <PillSelect<string>
            value={hotelCategoryFilter ? String(hotelCategoryFilter) : ''}
            options={categoryOptions}
            onChange={v => setHotelCategoryFilter(v ? Number(v) : '')}
            label={t('places.formCategory')}
            quiet
          />
        ) : undefined}>
        {filtered.length === 0 ? (
          <p className="m-0 rounded-[14px] border border-dashed border-edge px-4 py-6 text-center text-content-faint" style={fs(12, 'body')}>{t('day.noPlacesForHotel')}</p>
        ) : (
          <div className="flex max-h-[300px] flex-col gap-1 overflow-y-auto rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
            {filtered.map(p => {
              const on = hotelForm.place_id === p.id
              const cat = categories.find(c => c.id === p.category_id)
              return (
                <button type="button" key={p.id} aria-pressed={on} onClick={() => onSelectPlace(p.id)}
                  className={`flex w-full flex-none items-center gap-3 rounded-[11px] px-2.5 py-2 text-start transition-colors ${on ? 'bg-surface-card shadow-sm ring-2 ring-accent' : 'hover:bg-surface-card'}`}>
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-10 w-10 flex-none rounded-[10px] bg-surface-tertiary object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px]"
                      style={{ background: cat?.color ? tintOf(cat.color, 14) : 'var(--bg-tertiary)' }}>
                      <MapPin size={15} strokeWidth={2} style={{ color: cat?.color || 'var(--text-faint)' }} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>{p.name}</span>
                    {p.address && <span className="block truncate text-content-faint" style={fs(11)}>{p.address}</span>}
                  </span>
                  <span className={`grid h-6 w-6 flex-none place-items-center rounded-full transition-colors ${on ? 'bg-accent text-accent-text' : 'text-transparent ring-1 ring-edge'}`}>
                    <Check size={13} strokeWidth={2.6} aria-hidden />
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </DialogSection>
    </DialogShell>
  )
}
