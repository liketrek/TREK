import { useId, type ReactNode } from 'react'
import { CalendarDays, Clock, ExternalLink, FileText, Pencil } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { markdownLinkComponents } from '../shared/markdownLink'
import { BlurredCode } from '../shared/BookingCode'
import { DialogButton, DialogFooter, DialogSection, DialogShell, FooterSpacer, PILL } from '../shared/DialogShell'
import { useTripStore } from '../../store/tripStore'
import { formatTime, splitReservationDateTime } from '../../utils/formatters'
import { parseReservationMetadata } from '../../utils/flightLegs'
import { BookingDialogHeader } from './bookings/BookingDialogShell'
import { BOX, Eyebrow, Field, fs, toneColor, toneOf } from './bookings/bookingParts'
import { filesFor } from '../../utils/reservationFiles'
import { bookingDayLabel, segmentCodeLabel } from './transportDetailModel'
import { TransitLegs, transitSummary } from './bookings/transitParts'
import type { Reservation } from '../../types'

type Translate = (key: string, params?: Record<string, string | number>) => string

interface DayPlanSidebarTransportDetailModalProps {
  transportDetail: Reservation | null
  setTransportDetail: (v: Reservation | null) => void
  onNavigateToFiles?: () => void
  /** Opens the edit form for this reservation (shown as a footer action). */
  onEdit?: (res: Reservation) => void
  t: Translate
  locale: string
  timeFormat: string
}

/** One labelled value of the grid; a booking code is drawn through the blur preference. */
interface DetailCell {
  label: string
  value: string
  code?: boolean
}

/**
 * The booking a rental pill, a transit row or a map endpoint opens from the
 * plan: the head band tinted by its status like the booking dialogs, the
 * booking's facts one labelled field each, a transit journey leg by leg, the
 * notes and the files, and the edit in the bar at the foot.
 */
export function DayPlanSidebarTransportDetailModal({ transportDetail, ...rest }: DayPlanSidebarTransportDetailModalProps) {
  if (!transportDetail) return null
  return <TransportDetailDialog res={transportDetail} {...rest} />
}

function TransportDetailDialog({ res, setTransportDetail, onNavigateToFiles, onEdit, t, locale, timeFormat }: Omit<DayPlanSidebarTransportDetailModalProps, 'transportDetail'> & { res: Reservation }) {
  const titleId = useId()
  const allFiles = useTripStore(s => s.files)
  const close = () => setTransportDetail(null)
  const meta = parseReservationMetadata(res)
  const transit = transitSummary(meta)
  const files = filesFor(res, allFiles || [])
  const when = whenOf(res, locale, timeFormat)
  const cells = detailCells(res, meta, t)
  const confirmed = res.status === 'confirmed'

  const stats: { value: string; label: string }[] = []
  if (transit && transit.legs.length > 0) {
    if (transit.duration) stats.push({ value: durationText(transit.duration, t), label: t('transit.durationLabel') })
    stats.push({ value: transit.transfers > 0 ? String(transit.transfers) : t('transit.direct'), label: t('transit.transfersLabel') })
    // Under a minute of walking is not worth a tile.
    if (transit.walk > 59) stats.push({ value: t('transit.min', { count: Math.round(transit.walk / 60) }), label: t('transit.walkLabel') })
  }

  const header = (
    <BookingDialogHeader
      tone={toneOf(res)}
      type={res.type}
      labelId={titleId}
      onClose={close}
      title={res.title}
      pills={(
        <>
          <span className={PILL}>
            <span className="h-2 w-2 flex-none rounded-full" style={{ background: toneColor(confirmed ? 'confirmed' : 'pending') }} />
            {confirmed ? t('planner.resConfirmed') : t('planner.resPending')}
          </span>
          {(when.day || when.time) && (
            <span className={PILL}>
              {when.day
                ? <CalendarDays size={13} strokeWidth={2.2} className="text-content-faint" />
                : <Clock size={13} strokeWidth={2.2} className="text-content-faint" />}
              {when.day}
              {when.time && <span className={when.day ? 'font-medium text-content-muted' : ''}>{when.time}</span>}
            </span>
          )}
        </>
      )}
    />
  )

  const footer = (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={close}>{t('common.close')}</DialogButton>
      {onEdit && (
        <DialogButton variant="primary" onClick={() => onEdit(res)} icon={<Pencil size={14} strokeWidth={2} />}>{t('common.edit')}</DialogButton>
      )}
    </DialogFooter>
  )

  return (
    <DialogShell onClose={close} labelledBy={titleId} header={header} footer={footer}>
      {cells.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          {cells.map((c, i) => (
            <Field key={i} label={c.label}>
              {c.code ? <BlurredCode className="font-geist tabular-nums">{c.value}</BlurredCode> : c.value}
            </Field>
          ))}
        </div>
      )}

      {res.location && <DetailField label={t('reservations.locationAddress')}>{res.location}</DetailField>}

      {stats.length > 0 && (
        <div className="flex gap-2">
          {stats.map(s => (
            <div key={s.label} className="min-w-0 flex-1 rounded-[12px] bg-surface-tertiary px-3 py-2.5 text-center">
              <div className="truncate font-bold tabular-nums tracking-[-0.01em] text-content" style={fs(18, 'subtitle')}>{s.value}</div>
              <div className="mt-0.5 truncate font-geist text-content-faint" style={fs(10.5)}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Public-transit itinerary (#1065): the legs the transit search stored. */}
      {transit && transit.legs.length > 0 && (
        <DialogSection label={t('transit.itinerary')}>
          <TransitLegs legs={transit.legs} />
        </DialogSection>
      )}

      {res.notes && (
        <DialogSection label={t('reservations.notes')}>
          <div className={`${BOX} collab-note-md px-3.5 py-3 text-content-secondary`} style={{ ...fs(13, 'body'), wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>{res.notes}</Markdown>
          </div>
        </DialogSection>
      )}

      {files.length > 0 && (
        <DialogSection label={t('files.title')}>
          <div className="flex flex-col gap-1.5">
            {files.map(f => (
              <button key={f.id} type="button" onClick={() => { close(); onNavigateToFiles?.() }}
                className={`${BOX} flex items-center gap-2.5 px-3.5 py-2.5 text-start hover:bg-surface-hover`}>
                <FileText size={14} strokeWidth={2} className="flex-none text-content-muted" />
                <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(13, 'body')}>{f.original_name}</span>
                <ExternalLink size={12} strokeWidth={2} className="flex-none text-content-faint" />
              </button>
            ))}
          </div>
        </DialogSection>
      )}
    </DialogShell>
  )
}

/** The facts of a flight or a train, the booking code and the code of each segment. */
function detailCells(res: Reservation, meta: Record<string, unknown>, t: Translate): DetailCell[] {
  const cells: DetailCell[] = []
  const add = (label: string, value: unknown, code = false) => {
    if (value) cells.push({ label, value: String(value), code })
  }
  if (res.type === 'flight') {
    add(t('reservations.meta.airline'), meta.airline)
    add(t('reservations.meta.flightNumber'), meta.flight_number)
    add(t('reservations.meta.from'), meta.departure_airport)
    add(t('reservations.meta.to'), meta.arrival_airport)
    add(t('reservations.meta.seat'), meta.seat)
  } else if (res.type === 'train') {
    add(t('reservations.meta.trainNumber'), meta.train_number)
    add(t('reservations.meta.platform'), meta.platform)
    add(t('reservations.meta.seat'), meta.seat)
  }
  add(t('reservations.confirmationCode'), res.confirmation_number, true)
  // A stopover booking can carry its own reference per segment (#1943); the
  // flat fields above only ever describe the first leg. Drawn as codes, so the
  // blur preference covers them like the booking's own.
  const legs = Array.isArray(meta.legs) ? meta.legs as { from?: string; to?: string; confirmation_number?: string }[] : []
  if (legs.length > 1) {
    for (const leg of legs) {
      if (!leg?.confirmation_number) continue
      add(segmentCodeLabel(leg, t), leg.confirmation_number, true)
    }
  }
  return cells
}

/** The booking's day and its time or time range, each empty when the booking has none. */
function whenOf(res: Reservation, locale: string, timeFormat: string): { day: string; time: string } {
  const { date, time } = splitReservationDateTime(res.reservation_time)
  const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
  const day = date ? bookingDayLabel(date, locale) : ''
  const start = time ? formatTime(time, locale, timeFormat) : ''
  const end = endTime ? formatTime(endTime, locale, timeFormat) : ''
  return { day, time: start && end ? `${start} → ${end}` : start }
}

/** A journey's length in the reader's language: minutes up to an hour, then hours and minutes. */
function durationText(seconds: number, t: Translate): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return t('transit.min', { count: mins })
  const hours = Math.floor(mins / 60)
  const minutes = mins % 60
  return minutes > 0 ? t('dawarich.duration.hoursMinutes', { hours, minutes }) : t('dawarich.duration.hours', { hours })
}

/** A labelled value too long for a grid cell, such as an address. */
function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Eyebrow className="mb-[3px]">{label}</Eyebrow>
      <div className={`${BOX} break-words px-3.5 py-2.5 font-medium text-content`} style={fs(13, 'body')}>{children}</div>
    </div>
  )
}
