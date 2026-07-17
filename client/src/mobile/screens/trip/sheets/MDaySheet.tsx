import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays, Car, Footprints, Hotel, Pencil, Plus, RotateCcw,
  Route as RouteIcon, TramFront,
} from 'lucide-react'
import type { WeatherResult } from '@trek/shared'
import MSheet from '../../../components/MSheet'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation } from '../../../../i18n'
import { weatherApi } from '../../../../api/client'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useDayNotes } from '../../../../hooks/useDayNotes'
import { RES_ICONS, getNoteIcon } from '../../../../components/Planner/DayPlanSidebar.constants'
import { getDayBookendHotels, isDayInAccommodationRange } from '../../../../utils/dayOrder'
import { splitReservationDateTime } from '../../../../utils/formatters'
import { dayGoogleMapsUrl, optimizeDayOrder } from '../lib/dayRoute'
import { splitNoteTime } from '../lib/dayNotes'
import { weatherIconFor } from '../plan/planTimelineModel'
import type { Assignment, DayNote, Reservation } from '../../../../types'
import { Eyebrow, INNER_CLS, StatBox, TileHeader, displayTime } from './MTripSheetUi'

interface DaySheetPayload {
  dayId?: number
}

/**
 * Day-detail sheet ('day', glass card): 16-day weather (Open-Meteo via the
 * weather service, climate fallback), the day's bookings and notes, the
 * accommodation block and the day actions (rename, route on/off + profile,
 * optimize, transit search, Google-Maps export).
 */
export default function MDaySheet({ planner, shell }: MTripSheetsProps) {
  const { t, locale } = useTranslation()
  const open = shell.sheet?.id === 'day'
  const payload = (shell.sheet?.payload ?? {}) as DaySheetPayload
  const dayId = payload.dayId ?? planner.selectedDayId

  const day = planner.days.find(d => d.id === dayId) ?? null
  const dayIndex = day ? planner.days.indexOf(day) : -1
  const canEditDays = planner.can('day_edit', planner.trip)
  const canEditReservations = planner.can('reservation_edit', planner.trip)
  const tripHasDates = Boolean(planner.trip?.start_date && planner.trip?.end_date)

  const isFahrenheit = useSettingsStore(s => s.settings.temperature_unit) === 'fahrenheit'
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const blurCodes = useSettingsStore(s => s.settings.blur_booking_codes)
  const optimizeFromAccommodation = useSettingsStore(s => s.settings.optimize_from_accommodation)

  const dayAssignments = useMemo<Assignment[]>(() => {
    if (!day) return []
    return [...(planner.assignments[String(day.id)] || [])].sort((a, b) => a.order_index - b.order_index)
  }, [day, planner.assignments])

  // Weather anchor: the first assigned place with coordinates, else any trip place.
  const geoPlace = dayAssignments.find(a => a.place?.lat && a.place?.lng)?.place
    || planner.places.find(p => p.lat && p.lng)
  const lat = geoPlace?.lat ?? null
  const lng = geoPlace?.lng ?? null

  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  useEffect(() => {
    if (!open || !day?.date || lat == null || lng == null) { setWeather(null); return }
    let cancelled = false
    setWeatherLoading(true)
    weatherApi.getDetailed(lat, lng, day.date, planner.language)
      .then(data => { if (!cancelled) setWeather(data.error ? null : data) })
      .catch(() => { if (!cancelled) setWeather(null) })
      .finally(() => { if (!cancelled) setWeatherLoading(false) })
    return () => { cancelled = true }
  }, [open, day?.date, lat, lng, planner.language])

  // Inline rename — the day sheet owns the pencil on mobile (#1065 parity).
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => { if (editingTitle) titleInputRef.current?.focus() }, [editingTitle])
  useEffect(() => { if (!open) setEditingTitle(false) }, [open])
  const commitRename = () => {
    setEditingTitle(false)
    if (day) planner.handleUpdateDayTitle(day.id, titleDraft.trim())
  }

  const notes = useDayNotes(planner.tripId)
  const dayNotes: DayNote[] = day
    ? [...(notes.dayNotes[String(day.id)] || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : []

  const dayReservations = useMemo(() => {
    if (!day) return []
    return planner.reservations.filter(r => {
      if (r.type === 'hotel') return false
      if (r.assignment_id && dayAssignments.some(a => a.id === r.assignment_id)) return true
      return r.day_id === day.id
    })
  }, [day, planner.reservations, dayAssignments])

  const dayAccommodations = useMemo(() => {
    if (!day) return []
    return planner.tripAccommodations.filter(a =>
      isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, planner.days),
    )
  }, [day, planner.tripAccommodations, planner.days])

  const routedStops = dayAssignments.filter(a => a.place?.lat != null && a.place?.lng != null)
  const bookends = day && optimizeFromAccommodation !== false
    ? getDayBookendHotels(day, planner.days, planner.tripAccommodations)
    : null
  const routable = routedStops.length >= 2 || (routedStops.length >= 1 && !!bookends?.morning)
  const routeActive = planner.routeShown && planner.selectedDayId === day?.id

  const toggleRoute = () => {
    if (!day) return
    if (planner.selectedDayId === day.id) {
      planner.setRouteShown(v => !v)
    } else {
      planner.handleSelectDay(day.id, true)
      if (!planner.routeShown) planner.setRouteShown(true)
    }
  }

  const openReservation = (r: Reservation) => {
    const isTransport = planner.TRANSPORT_TYPES.has(r.type)
    if (isTransport && canEditDays) {
      planner.setEditingTransport(r)
      planner.setTransportModalDayId(r.day_id ?? null)
      planner.setShowTransportModal(true)
    } else if (!isTransport && canEditReservations) {
      planner.setEditingReservation(r)
      planner.setShowReservationModal(true)
    } else {
      return
    }
    shell.closeSheet()
  }

  const planTransit = () => {
    if (!day) return
    planner.setTransportModalDayId(day.id)
    planner.setEditingTransport(null)
    planner.setTransitPrefill(null)
    planner.setTransportModalAutomated(true)
    planner.setShowTransportModal(true)
    shell.closeSheet()
  }

  // Same optimizer as the desktop day plan: timed places stay anchored, the
  // rest is rerouted (optionally hotel-bookended); handleReorder owns the undo.
  const optimizeDay = () => {
    if (!day || dayAssignments.length < 3) return
    const result = optimizeDayOrder(
      day, planner.days, dayAssignments, planner.tripAccommodations, optimizeFromAccommodation !== false,
    )
    if (!result) return
    planner.handleReorder(day.id, result.order.map(a => a.id))
    planner.toast.success(result.usedHotel
      ? t('dayplan.toast.routeOptimizedFromHotel')
      : t('dayplan.toast.routeOptimized'))
  }

  // Google-Maps export of the day's stops, hotel-bookended like the drawn route (#1372/#1465).
  const openInGoogleMaps = () => {
    if (!day) return
    const url = dayGoogleMapsUrl(
      day, planner.days, dayAssignments, planner.tripAccommodations, optimizeFromAccommodation !== false,
    )
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const addAccommodation = () => {
    if (!day) return
    shell.openSheet('accommodation', { dayId: day.id })
  }

  const cTemp = (c: number) => Math.round(isFahrenheit ? c * 9 / 5 + 32 : c)
  const formattedDate = day?.date
    ? new Date(`${day.date.slice(0, 10)}T00:00:00Z`).toLocaleDateString(locale, {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
      })
    : null
  const dayLabel = day?.title || t('planner.dayN', { n: (day?.day_number ?? dayIndex + 1) || '?' })
  const WeatherIcon = weatherIconFor(weather?.main)

  const stayBadge = (acc: (typeof dayAccommodations)[number]) => {
    const isIn = acc.start_day_id === day?.id
    const isOut = acc.end_day_id === day?.id
    if (isIn && isOut) return { label: `${t('day.checkIn')} & ${t('day.checkOut')}`, cls: 'border-[color:var(--m-st-confirmed)] text-[color:var(--m-st-confirmed)]' }
    if (isIn) return { label: t('day.checkIn'), cls: 'border-[color:var(--m-st-confirmed)] text-[color:var(--m-st-confirmed)]' }
    if (isOut) return { label: t('day.checkOut'), cls: 'border-[color:var(--m-st-danger)] text-[color:var(--m-st-danger)]' }
    return { label: t('mobileTrip.stay'), cls: 'border-[color:var(--m-faint)] text-m-muted' }
  }

  return (
    <MSheet open={open && !!day} onClose={shell.closeSheet} variant="card" material="glass" ariaLabel={dayLabel}>
      {day && (
        <>
          <div className="flex-none px-[18px] pt-4">
            <TileHeader
              icon={<CalendarDays size={19} strokeWidth={1.8} />}
              title={editingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingTitle(false) }}
                  placeholder={t('planner.dayN', { n: dayIndex + 1 })}
                  className="w-full border-b-[1.5px] border-[color:var(--m-ink)] bg-transparent p-0 font-[inherit] text-[1.0625rem] font-bold outline-none"
                />
              ) : (
                <>
                  <span className="truncate">{dayLabel}</span>
                  {canEditDays && (
                    <button
                      type="button"
                      onClick={() => { setTitleDraft(day.title || ''); setEditingTitle(true) }}
                      aria-label={t('mobileTrip.renameDay')}
                      className="flex flex-none p-[3px] text-m-faint"
                    >
                      <Pencil size={12} strokeWidth={1.8} />
                    </button>
                  )}
                </>
              )}
              sub={formattedDate}
              onClose={shell.closeSheet}
              closeLabel={t('common.close')}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
            {/* ── Weather (16-day forecast, climate fallback) ── */}
            {day.date && lat != null && lng != null && (
              weatherLoading ? (
                <div className="mt-[14px] flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-[10px] bg-[color:var(--m-ic)]" />
                  <div className="h-6 w-24 animate-pulse rounded-[8px] bg-[color:var(--m-ic)]" />
                </div>
              ) : weather ? (
                <div className="mt-[14px]">
                  <div className="flex items-center gap-3">
                    <WeatherIcon size={32} strokeWidth={1.6} />
                    <span className="text-[2rem] font-bold leading-none">
                      {weather.type === 'climate' ? 'Ø ' : ''}{cTemp(weather.temp)}°
                    </span>
                    <span className="min-w-0 font-geist text-[0.75rem] text-m-muted">
                      {weather.temp_max != null && weather.temp_min != null && (
                        <>{cTemp(weather.temp_max)}° / {cTemp(weather.temp_min)}° · </>
                      )}
                      <span className="capitalize">{weather.description}</span>
                    </span>
                  </div>
                  {weather.type === 'climate' && (
                    <div className="mt-[6px] font-geist text-[0.625rem] italic text-m-faint">{t('day.climateHint')}</div>
                  )}
                </div>
              ) : (
                <div className="mt-[14px] font-geist text-[0.75rem] text-m-faint">{t('day.noWeather')}</div>
              )
            )}

            {/* ── Day actions: route / Google Maps / optimize / profile / transit ── */}
            {(routable || canEditDays) && (
              <div className="mt-[14px] flex flex-wrap items-center gap-[7px]">
                {routable && (
                  <button
                    type="button"
                    onClick={toggleRoute}
                    aria-pressed={routeActive}
                    className={`flex items-center gap-[5px] rounded-full px-3 py-[7px] text-[0.75rem] font-semibold ${
                      routeActive ? 'bg-m-act text-m-actfg' : `${INNER_CLS} text-m-ink`
                    }`}
                  >
                    <RouteIcon size={13} strokeWidth={2} />
                    {t('dayplan.route')}
                  </button>
                )}
                {routable && (
                  <div className={`flex overflow-hidden rounded-full ${INNER_CLS}`}>
                    {(['driving', 'walking'] as const).map(p => {
                      const ProfileIcon = p === 'driving' ? Car : Footprints
                      const active = planner.routeProfile === p
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => planner.setRouteProfile(p)}
                          aria-label={p === 'driving' ? t('mobileTrip.profileDriving') : t('mobileTrip.profileWalking')}
                          aria-pressed={active}
                          className={`flex items-center px-[10px] py-[7px] ${active ? 'bg-m-act text-m-actfg' : 'text-m-muted'}`}
                        >
                          <ProfileIcon size={13} strokeWidth={2} />
                        </button>
                      )
                    })}
                  </div>
                )}
                {routable && (
                  <button
                    type="button"
                    onClick={openInGoogleMaps}
                    className={`flex items-center gap-[5px] rounded-full px-3 py-[7px] text-[0.75rem] font-semibold text-m-ink ${INNER_CLS}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
                      <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    {t('planner.openGoogleMaps')}
                  </button>
                )}
                {canEditDays && dayAssignments.length >= 3 && (
                  <button
                    type="button"
                    onClick={optimizeDay}
                    className={`flex items-center gap-[5px] rounded-full px-3 py-[7px] text-[0.75rem] font-semibold text-m-ink ${INNER_CLS}`}
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    {t('dayplan.optimize')}
                  </button>
                )}
                {canEditDays && tripHasDates && (
                  <button
                    type="button"
                    onClick={planTransit}
                    className={`flex items-center gap-[5px] rounded-full px-3 py-[7px] text-[0.75rem] font-semibold text-m-ink ${INNER_CLS}`}
                  >
                    <TramFront size={13} strokeWidth={2} />
                    {t('transit.title')}
                  </button>
                )}
              </div>
            )}

            {/* ── Bookings of the day ── */}
            {dayReservations.length > 0 && (
              <>
                <Eyebrow className="mb-[6px] mt-[14px]">{t('day.reservations')}</Eyebrow>
                <div className="flex flex-col gap-[6px]">
                  {dayReservations.map(r => {
                    const ResIcon = RES_ICONS[r.type as keyof typeof RES_ICONS] || RES_ICONS.other
                    const { time: startTime } = splitReservationDateTime(r.reservation_time)
                    const { time: endTime } = splitReservationDateTime(r.reservation_end_time)
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => openReservation(r)}
                        className={`flex w-full items-center gap-[10px] rounded-[13px] px-[11px] py-[9px] text-left ${INNER_CLS}`}
                      >
                        <ResIcon size={15} strokeWidth={2} className="flex-none text-m-muted" />
                        <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold">{r.title}</span>
                        {(startTime || endTime) && (
                          <span className="flex-none font-geist text-[0.6875rem] tabular-nums text-m-muted">
                            {startTime ? displayTime(startTime, locale, timeFormat) : ''}
                            {endTime ? ` – ${displayTime(endTime, locale, timeFormat)}` : ''}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* ── Day notes ── */}
            {(dayNotes.length > 0 || canEditDays) && (
              <>
                <div className="mb-[6px] mt-[14px] flex items-center">
                  <Eyebrow>{t('mobileTrip.notes')}</Eyebrow>
                  {canEditDays && (
                    <button
                      type="button"
                      onClick={() => shell.openSheet('note', { dayId: day.id })}
                      aria-label={t('dayplan.addNote')}
                      className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
                    >
                      <Plus size={12} strokeWidth={2.2} />
                    </button>
                  )}
                </div>
                {dayNotes.length > 0 && (
                  <div className="flex flex-col gap-[6px]">
                    {dayNotes.map(note => {
                      const NoteIcon = getNoteIcon(note.icon)
                      // The time column is a free detail line; only a leading
                      // HH:MM renders as an actual time (desktop semantics).
                      const { time: noteTime, detail } = splitNoteTime(note.time)
                      return (
                        <button
                          key={note.id}
                          type="button"
                          onClick={() => { if (canEditDays) shell.openSheet('note', { dayId: day.id, note }) }}
                          className={`flex w-full items-center gap-[10px] rounded-[13px] px-[11px] py-[9px] text-left ${INNER_CLS}`}
                        >
                          <NoteIcon size={15} strokeWidth={1.8} className="flex-none text-m-muted" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[0.8125rem] font-semibold">{note.text}</span>
                            {detail && (
                              <span className="block truncate font-geist text-[0.65625rem] text-m-muted">{detail}</span>
                            )}
                          </span>
                          {noteTime && (
                            <span className="flex-none font-geist text-[0.6875rem] tabular-nums text-m-muted">
                              {displayTime(noteTime, locale, timeFormat)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── Accommodation ── */}
            <Eyebrow className="mb-[6px] mt-[14px]">{t('day.accommodation')}</Eyebrow>
            {dayAccommodations.length > 0 && (
              <div className="flex flex-col gap-2">
                {dayAccommodations.map(acc => {
                  const badge = stayBadge(acc)
                  const linked = planner.reservations.find(r => String(r.accommodation_id ?? '') === String(acc.id))
                  return (
                    <div key={acc.id} className={`rounded-[16px] px-3 py-[11px] ${INNER_CLS}`}>
                      <div
                        className="flex items-center gap-[10px]"
                        onClick={() => { if (acc.place_id) { shell.closeSheet(); planner.handlePlaceClick(acc.place_id) } }}
                      >
                        {acc.place_image ? (
                          <div
                            className="h-10 w-10 flex-none rounded-[12px] bg-cover bg-center"
                            style={{ backgroundImage: `url('${acc.place_image}')` }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-[color:var(--m-ic)]">
                            <Hotel size={17} strokeWidth={1.8} className="text-m-muted" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[0.875rem] font-semibold">{acc.place_name}</div>
                          {acc.place_address && (
                            <div className="truncate font-geist text-[0.65625rem] text-m-muted">{acc.place_address}</div>
                          )}
                        </div>
                        <span className={`flex-none rounded-full border px-[7px] py-[2px] text-[0.5625rem] font-bold uppercase tracking-[.05em] ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      {(acc.check_in || acc.check_out || acc.confirmation) && (
                        <div className="mt-[10px] flex gap-[6px]">
                          {acc.check_in && (
                            <StatBox
                              value={`${displayTime(acc.check_in, locale, timeFormat)}${acc.check_in_end ? ` – ${displayTime(acc.check_in_end, locale, timeFormat)}` : ''}`}
                              label={t('day.checkIn')}
                            />
                          )}
                          {acc.check_out && (
                            <StatBox value={displayTime(acc.check_out, locale, timeFormat)} label={t('day.checkOut')} />
                          )}
                          {acc.confirmation && (
                            <StatBox value={acc.confirmation} label={t('day.confirmation')} blurred={blurCodes} />
                          )}
                        </div>
                      )}
                      {linked && (
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className="h-2 w-2 flex-none rounded-full"
                            style={{ background: linked.status === 'confirmed' ? 'var(--m-st-confirmed)' : 'var(--m-st-pending)' }}
                          />
                          <span className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] text-m-muted">
                            {linked.status === 'confirmed' ? t('reservations.confirmed') : t('reservations.pending')}
                            {linked.confirmation_number ? ` · #${linked.confirmation_number}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {canEditDays && (
              <button
                type="button"
                onClick={addAccommodation}
                className="mt-[10px] flex w-full items-center justify-center gap-[6px] rounded-[13px] border-[1.5px] border-dashed border-[color:var(--m-faint)] py-[9px] text-[0.75rem] font-semibold text-m-muted"
              >
                <Plus size={13} strokeWidth={2.2} />
                {t('day.addAccommodation')}
              </button>
            )}
          </div>
        </>
      )}
    </MSheet>
  )
}
