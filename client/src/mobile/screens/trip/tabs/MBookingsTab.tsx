import { MapPin } from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { RES_ICONS } from '../../../../components/Planner/DayPlanSidebar.constants'
import { formatTime, formatPriceText } from '../../../../utils/formatters'
import { useTranslation } from '../../../../i18n'
import type { Reservation } from '../../../../types'
import { CardActions, CardDeleteSheet, CardFiles, CardTitleButton, CardWhenAndCode } from './MReservationCardParts'
import { Field, ReservationPluginSlots, SectionHeader, StatusDot, TabScroller, TravelerAvatars, TravelerFilterRow } from './tabChrome'
import { STATUS_COLOR, type MTabScreenProps } from './tabModel'
import { cardWhen, parseTransportMeta } from './transportsModel'
import { BOOKING_TYPE_COLOR } from '../../../../components/Planner/bookings/bookingsModel'
import { useReservationListFilter } from '../../../../components/Planner/bookings/useReservationListFilter'
import { useReservationCard } from '../../../../components/Planner/bookings/useReservationCard'
import { orderedEndpoints } from '../../../../utils/flightLegs'
import { filesFor } from '../../../../utils/reservationFiles'

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
  const allBookings = reservations.filter(r => !planner.TRANSPORT_TYPES.has(r.type))
  const {
    travelerFilter, groups, showTravelerFilter, toggleTravelerFilter, clearTravelerFilter, collapsed, toggleSection: toggle,
  } = useReservationListFilter(allBookings, days, planner.tripMembers.length)
  const canEdit = planner.can('reservation_edit', planner.trip)

  const sections = [
    { id: 'confirmed', label: t('reservations.confirmed'), rows: groups.confirmed },
    { id: 'pending', label: t('reservations.pending'), rows: groups.pending },
  ].filter(s => s.rows.length > 0)

  return (
    <TabScroller>
      {showTravelerFilter && (
        <TravelerFilterRow
          members={planner.tripMembers}
          active={travelerFilter}
          onToggle={toggleTravelerFilter}
          onClear={clearTravelerFilter}
          label={t('reservations.travelers.label')}
          allLabel={t('common.all')}
        />
      )}
      {sections.length === 0 ? (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center px-8 py-10 text-center">
          <MDancingTrek scene="bookings" className="mb-2" />
          <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('mobileTrip.bookingsEmpty')}</p>
        </div>
      ) : sections.map(section => (
        <div key={section.id}>
          <SectionHeader
            label={section.label}
            count={section.rows.length}
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
  const card = useReservationCard(res, planner)

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

  const eps = orderedEndpoints(res)
  const hasEndpoints = eps.some(e => e.role === 'from') && eps.some(e => e.role === 'to')

  const metaCells: { label: string; value: string }[] = []
  if (!hasEndpoints && meta.departure_airport) metaCells.push({ label: t('reservations.meta.from'), value: meta.departure_airport })
  if (!hasEndpoints && meta.arrival_airport) metaCells.push({ label: t('reservations.meta.to'), value: meta.arrival_airport })
  if (meta.platform) metaCells.push({ label: t('reservations.meta.platform'), value: meta.platform })
  if (meta.seat) metaCells.push({ label: t('reservations.meta.seat'), value: meta.seat + (meta.class ? ` · ${meta.class}` : '') })
  if (meta.price != null && meta.price !== '') {
    metaCells.push({ label: t('reservations.price'), value: formatPriceText(meta.price, meta.priceCurrency, planner.trip?.currency, locale) })
  }
  if (meta.check_in_time) {
    metaCells.push({
      label: t('reservations.meta.checkIn'),
      value: formatTime(meta.check_in_time, locale, timeFormat) + (meta.check_in_end_time ? ` – ${formatTime(meta.check_in_end_time, locale, timeFormat)}` : ''),
    })
  }
  if (meta.check_out_time) metaCells.push({ label: t('reservations.meta.checkOut'), value: formatTime(meta.check_out_time, locale, timeFormat) })

  const files = filesFor(res, planner.files || [])

  const openEdit = () => {
    if (!canEdit) return
    planner.setEditingReservation(res)
    planner.setShowReservationModal(true)
  }

  const { dayValue, timeValue } = cardWhen(res, startDay, endDay, t, locale, timeFormat)

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
      {/* Header */}
      <div className="flex items-center gap-[7px] border-b border-[color:var(--m-rowbr)] px-3 py-[10px]" style={{ background: tint }}>
        <StatusDot color={dotColor} />
        <CardTitleButton res={res} TypeIcon={TypeIcon} typeColor={typeColor} onOpen={openEdit} t={t} />
        {canEdit && <CardActions onEdit={openEdit} onDelete={card.askDelete} t={t} />}
      </div>

      {/* Body — split around the booking code so the reveal can be its own
          control instead of a click handler buried inside the card button. */}
      {!compact && (
        <div className="px-3 pb-3 pt-[9px]">
          <CardWhenAndCode
            dayValue={dayValue}
            timeValue={timeValue}
            code={res.confirmation_number}
            card={card}
            onOpen={openEdit}
            t={t}
          />

          <button type="button" onClick={openEdit} className="block w-full text-start">
            {metaCells.length > 0 && (
              <div className="mt-2 flex gap-2">
                {metaCells.slice(0, 3).map((c, i) => (
                  <Field key={i} label={c.label} className="flex-1">{c.value}</Field>
                ))}
              </div>
            )}

            <TravelerAvatars travelers={res.travelers || []} label={t('reservations.travelers.label')} />

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

            <CardFiles files={files} card={card} t={t} />
          </button>
        </div>
      )}
      {!compact && <ReservationPluginSlots tripId={planner.tripId} reservationId={res.id} />}

      <CardDeleteSheet title={res.title} card={card} t={t} />
    </div>
  )
}
