import { useState } from 'react'
import { FileText, MapPin, Pencil, Trash2 } from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { RES_ICONS } from '../../../../components/Planner/DayPlanSidebar.constants'
import { splitReservationDateTime, formatTime } from '../../../../utils/formatters'
import { openFile } from '../../../../utils/fileDownload'
import { useTranslation } from '../../../../i18n'
import type { Reservation } from '../../../../types'
import MConfirmSheet from '../../settings/MConfirmSheet'
import { CountPill, Field, SectionHeader, StatusDot, TabScroller } from './tabChrome'
import { STATUS_COLOR, type MTabScreenProps } from './tabModel'
import { groupTransports, orderedEndpoints, parseTransportMeta } from './transportsModel'
import { BOOKING_TYPE_COLOR } from './bookingsModel'

/**
 * Tab 2 — Buchungen. Real `planner.reservations` filtered to the non-transport
 * types (hotel / restaurant / event / tour / other), grouped Confirmed /
 * Pending. Shares the sort + metadata helpers with the transports tab. There is
 * no dedicated booking detail sheet yet, so a row (and the edit action) opens
 * the reservation edit modal — the convention MDaySheet already follows. Add /
 * import live in the shell header; edit + delete are gated on `reservation_edit`.
 */
export default function MBookingsTab({ planner, shell }: MTabScreenProps) {
  const { t, reservations, days } = planner
  const bookings = reservations.filter(r => !planner.TRANSPORT_TYPES.has(r.type))
  const groups = groupTransports(bookings, days)
  const canEdit = planner.can('reservation_edit', planner.trip)

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const sections = [
    { id: 'confirmed', label: t('reservations.confirmed'), rows: groups.confirmed },
    { id: 'pending', label: t('reservations.pending'), rows: groups.pending },
  ].filter(s => s.rows.length > 0)

  if (sections.length === 0) {
    return (
      <TabScroller>
        <div className="flex flex-col items-center px-8 pt-16 text-center">
          <MDancingTrek scene="bookings" className="mb-2" />
          <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('mobileTrip.bookingsEmpty')}</p>
        </div>
      </TabScroller>
    )
  }

  return (
    <TabScroller>
      {sections.map(section => (
        <div key={section.id}>
          <SectionHeader
            label={section.label}
            count={<CountPill>{section.rows.length}</CountPill>}
            open={!collapsed[section.id]}
            onToggle={() => toggle(section.id)}
          />
          {!collapsed[section.id] &&
            section.rows.map(res => (
              <BookingCard
                key={res.id}
                res={res}
                planner={planner}
                canEdit={canEdit}
                compact={shell.bookingsCompact}
              />
            ))}
        </div>
      ))}
    </TabScroller>
  )
}

function BookingCard({ res, planner, canEdit, compact }: {
  res: Reservation
  planner: MTabScreenProps['planner']
  canEdit: boolean
  compact: boolean
}) {
  const { t, days } = planner
  const { locale } = useTranslation()
  const timeFormat = planner.settings.time_format || '24h'
  const blurCodes = planner.settings.blur_booking_codes
  const [codeRevealed, setCodeRevealed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const meta = parseTransportMeta(res)
  const TypeIcon = RES_ICONS[res.type as keyof typeof RES_ICONS] || RES_ICONS.other
  const typeColor = BOOKING_TYPE_COLOR[res.type] || '#6b7280'
  const confirmed = res.status === 'confirmed'
  const dotColor = confirmed ? STATUS_COLOR.confirmed : STATUS_COLOR.pending
  const tint = confirmed ? 'rgba(47,163,122,.10)' : 'rgba(232,161,58,.12)'

  const isHotel = res.type === 'hotel'
  const startDay = isHotel && res.accommodation_start_day_id
    ? days.find(d => d.id === res.accommodation_start_day_id)
    : res.day_id != null ? days.find(d => d.id === res.day_id) : undefined
  const endDay = isHotel && res.accommodation_end_day_id
    ? days.find(d => d.id === res.accommodation_end_day_id)
    : res.end_day_id != null ? days.find(d => d.id === res.end_day_id) : undefined

  const startDt = splitReservationDateTime(res.reservation_time)
  const endDt = splitReservationDateTime(res.reservation_end_time)
  const fmtDate = (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const dayLabel = (day: NonNullable<typeof startDay>) => day.title || t('dayplan.dayN', { n: day.day_number })

  const eps = orderedEndpoints(res)
  const hasEndpoints = eps.some(e => e.role === 'from') && eps.some(e => e.role === 'to')

  const metaCells: { label: string; value: string }[] = []
  if (!hasEndpoints && meta.departure_airport) metaCells.push({ label: t('reservations.meta.from'), value: meta.departure_airport })
  if (!hasEndpoints && meta.arrival_airport) metaCells.push({ label: t('reservations.meta.to'), value: meta.arrival_airport })
  if (meta.platform) metaCells.push({ label: t('reservations.meta.platform'), value: meta.platform })
  if (meta.seat) metaCells.push({ label: t('reservations.meta.seat'), value: meta.seat + (meta.class ? ` · ${meta.class}` : '') })
  if (meta.price != null && meta.price !== '') {
    metaCells.push({ label: t('reservations.price'), value: `${meta.price}${meta.priceCurrency ? ` ${meta.priceCurrency}` : ''}` })
  }
  if (meta.check_in_time) {
    metaCells.push({
      label: t('reservations.meta.checkIn'),
      value: formatTime(meta.check_in_time, locale, timeFormat) + (meta.check_in_end_time ? ` – ${formatTime(meta.check_in_end_time, locale, timeFormat)}` : ''),
    })
  }
  if (meta.check_out_time) metaCells.push({ label: t('reservations.meta.checkOut'), value: formatTime(meta.check_out_time, locale, timeFormat) })

  const files = (planner.files || []).filter(
    f => !f.deleted_at && (f.reservation_id === res.id || (f.linked_reservation_ids || []).includes(res.id)),
  )

  const openEdit = () => {
    if (!canEdit) return
    planner.setEditingReservation(res)
    planner.setShowReservationModal(true)
  }

  const timeValue = startDt.time
    ? `${formatTime(startDt.time, locale, timeFormat)}${endDt.time ? ` – ${formatTime(endDt.time, locale, timeFormat)}` : ''}`
    : '—'
  const dayValue = startDay
    ? `${dayLabel(startDay)}${endDay && endDay.id !== startDay.id ? ` – ${dayLabel(endDay)}` : ''}`
    : startDt.date
      ? fmtDate(startDt.date)
      : '—'

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
      {/* Header */}
      <div className="flex items-center gap-[7px] border-b border-[color:var(--m-rowbr)] px-3 py-[10px]" style={{ background: tint }}>
        <StatusDot color={dotColor} />
        <button type="button" onClick={openEdit} className="flex min-w-0 flex-1 items-center gap-[7px] text-left">
          <span className="inline-flex flex-none items-center gap-1 rounded-full border border-[color:var(--m-rowbr)] bg-m-card px-2 py-[2px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.06em] text-m-muted">
            <TypeIcon size={10} strokeWidth={2.2} style={{ color: typeColor }} />
            {t(`reservations.type.${res.type}`)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-bold text-m-ink">{res.title}</span>
          {!!res.needs_review && (
            <span className="flex-none rounded-full bg-[rgba(232,161,58,.16)] px-2 py-[2px] font-geist text-[0.5rem] font-bold uppercase tracking-[.03em] text-[color:var(--m-st-pending)]">
              {t('reservations.needsReview')}
            </span>
          )}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={openEdit}
            aria-label={t('common.edit')}
            className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
          >
            <Pencil size={12} strokeWidth={2} />
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label={t('common.delete')}
            className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
          >
            <Trash2 size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Body */}
      {!compact && (
        <button type="button" onClick={openEdit} className="block w-full px-3 pb-3 pt-[9px] text-left">
          <div className="flex gap-2">
            <Field label={t('reservations.date')} className="flex-[1.4]">{dayValue}</Field>
            <Field label={t('reservations.time')} className="flex-1" tabular>{timeValue}</Field>
          </div>

          {res.confirmation_number && (
            <div className="mt-2">
              <div className="mb-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.08em] text-m-faint">
                {t('reservations.confirmationCode')}
              </div>
              <div
                onClick={e => { if (blurCodes) { e.stopPropagation(); setCodeRevealed(v => !v) } }}
                className={`overflow-hidden text-ellipsis whitespace-nowrap rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-[7px] text-center font-geist text-[0.71875rem] font-semibold tabular-nums text-m-ink ${
                  blurCodes && !codeRevealed ? 'blur-[4px] select-none' : ''
                }`}
              >
                {res.confirmation_number}
              </div>
            </div>
          )}

          {metaCells.length > 0 && (
            <div className="mt-2 flex gap-2">
              {metaCells.slice(0, 3).map((c, i) => (
                <Field key={i} label={c.label} className="flex-1">{c.value}</Field>
              ))}
            </div>
          )}

          {res.location && (
            <div className="mt-2 flex items-center gap-[6px] rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-[7px]">
              <MapPin size={12} strokeWidth={2} className="flex-none text-m-muted" />
              <span className="truncate text-[0.71875rem] font-semibold text-m-ink">{res.location}</span>
            </div>
          )}

          {res.notes && (
            <div className="mt-2 rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-2">
              <p className="whitespace-pre-wrap font-geist text-[0.6875rem] leading-[1.5] text-m-muted">{res.notes}</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-2">
              <div className="mb-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.08em] text-m-faint">
                {t('files.title')}
              </div>
              <div className="flex flex-col gap-1">
                {files.map(f => (
                  <span
                    key={f.id}
                    onClick={e => { e.stopPropagation(); openFile(f.url, f.original_name) }}
                    className="flex items-center gap-[6px] rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-[7px]"
                  >
                    <FileText size={12} strokeWidth={2} className="flex-none text-m-muted" />
                    <span className="truncate font-geist text-[0.65625rem] font-semibold text-m-muted">{f.original_name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </button>
      )}

      <MConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('reservations.confirm.deleteTitle')}
        message={t('reservations.confirm.deleteBody', { name: res.title })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          setConfirmDelete(false)
          Promise.resolve(planner.handleDeleteReservation(res.id)).catch(() =>
            planner.toast.error(t('reservations.toast.deleteError')),
          )
        }}
      />
    </div>
  )
}
