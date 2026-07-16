import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Footprints, Paperclip, Pencil, Route as RouteIcon, Trash2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation } from '../../../../i18n'
import { useSettingsStore } from '../../../../store/settingsStore'
import { RES_ICONS } from '../../../../components/Planner/DayPlanSidebar.constants'
import { splitReservationDateTime } from '../../../../utils/formatters'
import { openFile } from '../../../../utils/fileDownload'
import type { Reservation } from '../../../../types'
import { Eyebrow, INNER_CLS, StatBox, TileHeader, displayTime } from './MTripSheetUi'

interface TransportSheetPayload {
  reservationId?: number
}

interface TransitLeg {
  mode?: string
  line?: string | null
  line_color?: string | null
  line_text_color?: string | null
  headsign?: string | null
  duration?: number
  stops?: number
  from?: { name?: string; time?: string | null }
  to?: { name?: string; time?: string | null }
}

interface TransportMeta {
  airline?: string
  flight_number?: string
  train_number?: string
  seat?: string
  platform?: string
  transit?: { legs?: TransitLeg[] }
}

function parseMetadata(res: Reservation): TransportMeta {
  try {
    return (typeof res.metadata === 'string' ? JSON.parse(res.metadata || '{}') : (res.metadata || {})) as TransportMeta
  } catch {
    return {}
  }
}

/**
 * Transport detail sheet ('transport', payload { reservationId }): endpoints +
 * times, per-type meta (seat/platform/flight number), transit itinerary legs,
 * status + booking code (blurrable), notes, attached files and the
 * on-map/edit/delete actions.
 */
export default function MTransportSheet({ planner, shell }: MTripSheetsProps) {
  const { t, locale } = useTranslation()
  const open = shell.sheet?.id === 'transport'
  const payload = (shell.sheet?.payload ?? {}) as TransportSheetPayload
  const liveRes = planner.reservations.find(r => r.id === payload.reservationId) ?? null

  const canEditDays = planner.can('day_edit', planner.trip)
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const blurCodes = useSettingsStore(s => s.settings.blur_booking_codes)
  const [codeRevealed, setCodeRevealed] = useState(false)
  useEffect(() => { if (!open) setCodeRevealed(false) }, [open])

  // Hold the last reservation so the card content survives the exit animation.
  const heldRef = useRef<Reservation | null>(null)
  if (liveRes) heldRef.current = liveRes
  const res = liveRes ?? heldRef.current

  if (!res) {
    return <MSheet open={false} onClose={shell.closeSheet} variant="card" material="glass" />
  }

  const meta = parseMetadata(res)
  const ResIcon = RES_ICONS[res.type as keyof typeof RES_ICONS] || RES_ICONS.other

  const from = (res.endpoints || []).find(e => e.role === 'from')
  const to = (res.endpoints || []).find(e => e.role === 'to')
  const { date, time: startTime } = splitReservationDateTime(res.reservation_time)
  const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
  const depTime = from?.local_time || startTime
  const arrTime = to?.local_time || endTime

  const subParts: string[] = []
  if (meta.airline) subParts.push(meta.airline)
  if (meta.flight_number) subParts.push(meta.flight_number)
  if (meta.train_number) subParts.push(meta.train_number)
  if (from?.name && to?.name) subParts.push(`${from.name} → ${to.name}`)
  else if (date) {
    subParts.push(new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
    }))
  }

  const seat = meta.seat
  const platform = meta.platform
  const transitLegs: TransitLeg[] = Array.isArray(meta.transit?.legs) ? meta.transit.legs : []

  const resFiles = (planner.files || []).filter(f =>
    !f.deleted_at && (f.reservation_id === res.id || (f.linked_reservation_ids || []).includes(res.id)),
  )

  const confirmed = res.status === 'confirmed'
  const codeBlurred = blurCodes && !codeRevealed
  const onMap = planner.visibleConnections.includes(res.id)

  // First tap draws the overlay and jumps to the map; while drawn, the same
  // button hides it again (per-booking overlay toggle, desktop parity).
  const showOnMap = () => {
    if (onMap) {
      planner.toggleConnection(res.id)
      return
    }
    planner.toggleConnection(res.id)
    shell.closeSheet()
    if (shell.trTab !== 'plan') shell.setTrTab('plan')
    if (shell.view !== 'map') shell.toggleView()
  }

  const editTransport = () => {
    planner.setEditingTransport(res)
    planner.setTransportModalDayId(res.day_id ?? null)
    planner.setShowTransportModal(true)
    shell.closeSheet()
  }

  const deleteTransport = () => {
    planner.handleDeleteReservation(res.id)
    shell.closeSheet()
  }

  return (
    <MSheet open={open && !!liveRes} onClose={shell.closeSheet} variant="card" material="glass" ariaLabel={res.title}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<ResIcon size={19} strokeWidth={1.8} />}
          title={<span className="truncate text-[1rem]">{res.title}</span>}
          sub={subParts.length > 0 ? subParts.join(' · ') : undefined}
          onClose={shell.closeSheet}
          closeLabel={t('common.close')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
        {/* ── Times / seat stats ── */}
        {(depTime || arrTime || seat || platform) && (
          <div className="mt-[14px] flex gap-[6px]">
            {depTime && (
              <StatBox value={displayTime(depTime, locale, timeFormat)} label={from?.name || t('reservations.time')} />
            )}
            {arrTime && (
              <StatBox value={displayTime(arrTime, locale, timeFormat)} label={to?.name || t('reservations.time')} />
            )}
            {platform && <StatBox value={platform} label={t('reservations.meta.platform')} />}
            {seat && <StatBox value={seat} label={t('reservations.meta.seat')} />}
          </div>
        )}

        {/* ── Transit itinerary (#1065): one row per leg ── */}
        {transitLegs.length > 0 && (
          <div className={`mt-3 flex flex-col gap-2 rounded-[14px] px-3 py-[10px] ${INNER_CLS}`}>
            {transitLegs.map((leg, i) => {
              const isWalk = leg.mode === 'WALK'
              const mins = leg.duration ? Math.round(leg.duration / 60) : null
              return (
                <div key={i} className="flex items-start gap-2">
                  {isWalk ? (
                    <Footprints size={12} strokeWidth={2} className="mt-[2px] flex-none text-m-faint" />
                  ) : (
                    <span
                      className="flex-none rounded-[5px] px-[6px] py-px text-[0.625rem] font-bold"
                      style={{
                        background: leg.line_color || 'var(--m-ic)',
                        color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--m-ink)',
                      }}
                    >
                      {leg.line || leg.mode}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1 text-[0.71875rem] font-medium">
                      {isWalk ? (
                        <span className="text-m-muted">{t('transit.walkTo', { name: leg.to?.name || '' })}</span>
                      ) : (
                        <>
                          <span className="truncate">{leg.from?.name}</span>
                          <ArrowRight size={10} strokeWidth={2} className="flex-none text-m-faint" />
                          <span className="truncate">{leg.to?.name}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-px font-geist text-[0.625rem] text-m-faint">
                      {[
                        leg.from?.time && !isWalk ? `${leg.from.time}${leg.to?.time ? ` – ${leg.to.time}` : ''}` : null,
                        mins ? t('transit.min', { count: mins }) : null,
                        !isWalk && leg.stops ? t('transit.stops', { count: leg.stops }) : null,
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Status + booking code ── */}
        <div className={`mt-3 flex items-center gap-2 rounded-[13px] px-3 py-[9px] ${INNER_CLS}`}>
          <span
            className="h-2 w-2 flex-none rounded-full"
            style={{ background: confirmed ? 'var(--m-st-confirmed)' : 'var(--m-st-pending)' }}
          />
          <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold">
            {confirmed ? t('reservations.confirmed') : t('reservations.pending')}
          </span>
          {res.confirmation_number && (
            <span
              onClick={() => { if (blurCodes) setCodeRevealed(v => !v) }}
              className={`flex-none font-geist text-[0.71875rem] tabular-nums text-m-muted ${codeBlurred ? 'blur-[4px] select-none' : ''}`}
            >
              #{res.confirmation_number}
            </span>
          )}
        </div>

        {/* ── Notes ── */}
        {res.notes && (
          <>
            <Eyebrow className="mb-[6px] mt-3">{t('reservations.notes')}</Eyebrow>
            <div className={`rounded-[14px] px-3 py-[10px] ${INNER_CLS}`}>
              <div className="whitespace-pre-wrap font-geist text-[0.75rem] leading-[1.5] text-m-muted">{res.notes}</div>
            </div>
          </>
        )}

        {/* ── Actions ── */}
        <div className="mt-3 flex flex-wrap items-center gap-[7px]">
          <button
            type="button"
            onClick={showOnMap}
            aria-pressed={onMap}
            className={`flex items-center gap-[5px] rounded-full px-3 py-[7px] text-[0.75rem] font-semibold ${
              onMap ? 'bg-m-act text-m-actfg' : INNER_CLS
            }`}
          >
            <RouteIcon size={13} strokeWidth={2} />
            {t('mobileTrip.onMap')}
          </button>
          {resFiles.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => openFile(f.url, f.original_name)}
              className={`flex max-w-[150px] items-center gap-[5px] rounded-full px-3 py-[7px] text-[0.75rem] font-semibold ${INNER_CLS}`}
            >
              <Paperclip size={13} strokeWidth={2} className="flex-none" />
              <span className="truncate">{f.original_name}</span>
            </button>
          ))}
          {canEditDays && (
            <button
              type="button"
              onClick={editTransport}
              className="ml-auto flex items-center gap-[5px] rounded-full bg-m-act px-3 py-[7px] text-[0.75rem] font-semibold text-m-actfg"
            >
              <Pencil size={13} strokeWidth={2} />
              {t('common.edit')}
            </button>
          )}
          {canEditDays && (
            <button
              type="button"
              onClick={deleteTransport}
              aria-label={t('common.delete')}
              className={`flex items-center rounded-full px-3 py-[7px] text-[color:var(--m-st-danger)] ${INNER_CLS}`}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </MSheet>
  )
}
