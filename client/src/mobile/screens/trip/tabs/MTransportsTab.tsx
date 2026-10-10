import MDancingTrek from '../../../components/MDancingTrek'
import { RES_ICONS } from '../../../../components/Planner/DayPlanSidebar.constants'
import { formatPriceText } from '../../../../utils/formatters'
import { useTranslation } from '../../../../i18n'
import type { Reservation } from '../../../../types'
import { CardActions, CardDeleteSheet, CardFiles, CardTitleButton, CardWhenAndCode } from './MReservationCardParts'
import { Field, ReservationPluginSlots, SectionHeader, StatusDot, TabScroller, TravelerAvatars, TravelerFilterRow } from './tabChrome'
import { STATUS_COLOR, type MTabScreenProps } from './tabModel'
import { cardWhen, parseTransportMeta } from './transportsModel'
import { TRANSPORT_TYPE_COLOR } from '../../../../components/Planner/bookings/bookingsModel'
import { useReservationListFilter } from '../../../../components/Planner/bookings/useReservationListFilter'
import { useReservationCard } from '../../../../components/Planner/bookings/useReservationCard'
import { orderedEndpoints } from '../../../../utils/flightLegs'
import { filesFor } from '../../../../utils/reservationFiles'

/**
 * Tab 1 — Transporte. Real `planner.reservations` filtered to the 10 transport
 * types, grouped Confirmed / Pending / Automated-Transit like the desktop
 * panel. The shell owns the header (Add transport / import / AirTrail / compact
 * toggle); this panel is the list. A row tap opens the existing transport
 * detail sheet; the status dot, edit and delete are gated on `day_edit` (the
 * convention MTransportSheet / MDaySheet already use for transports).
 */
export default function MTransportsTab({ planner, shell }: MTabScreenProps) {
  const { t, reservations, days } = planner
  const allTransports = reservations.filter(r => planner.TRANSPORT_TYPES.has(r.type))
  const {
    travelerFilter, groups, showTravelerFilter, toggleTravelerFilter, clearTravelerFilter, collapsed, toggleSection: toggle,
  } = useReservationListFilter(allTransports, days, planner.tripMembers.length)
  const canEdit = planner.can('day_edit', planner.trip)

  const sections = [
    { id: 'confirmed', label: t('reservations.confirmed'), rows: groups.confirmed },
    { id: 'pending', label: t('reservations.pending'), rows: groups.pending },
    { id: 'transit', label: t('reservations.type.transit'), rows: groups.transit },
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
        <div className="flex min-h-full flex-col items-center justify-center px-8 py-10 text-center">
          <MDancingTrek scene="transport" className="mb-2" />
          <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('mobileTrip.transportsEmpty')}</p>
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
              <TransportCard
                key={res.id}
                res={res}
                planner={planner}
                shell={shell}
                canEdit={canEdit}
                compact={shell.transportsCompact}
              />
            ))}
        </div>
      ))}
    </TabScroller>
  )
}

function TransportCard({ res, planner, shell, canEdit, compact }: {
  res: Reservation
  planner: MTabScreenProps['planner']
  shell: MTabScreenProps['shell']
  canEdit: boolean
  compact: boolean
}) {
  const { t, days } = planner
  const { locale } = useTranslation()
  const timeFormat = planner.settings.time_format || '24h'
  const card = useReservationCard(res, planner)

  const meta = parseTransportMeta(res)
  const TypeIcon = RES_ICONS[res.type as keyof typeof RES_ICONS] || RES_ICONS.other
  const typeColor = TRANSPORT_TYPE_COLOR[res.type] || '#6b7280'
  const isTransit = res.type === 'transit'
  const confirmed = res.status === 'confirmed'
  const dotColor = isTransit ? STATUS_COLOR.info : confirmed ? STATUS_COLOR.confirmed : STATUS_COLOR.pending
  const tint = isTransit ? 'rgba(74,125,219,.10)' : confirmed ? 'rgba(47,163,122,.10)' : 'rgba(232,161,58,.12)'

  const startDay = res.day_id != null ? days.find(d => d.id === res.day_id) : undefined
  const endDay = res.end_day_id != null ? days.find(d => d.id === res.end_day_id) : undefined
  const eps = orderedEndpoints(res)
  const hasEndpoints = eps.some(e => e.role === 'from') && eps.some(e => e.role === 'to')

  const metaCells: { label: string; value: string }[] = []
  if (meta.airline) metaCells.push({ label: t('reservations.meta.airline'), value: meta.airline })
  if (meta.flight_number) metaCells.push({ label: t('reservations.meta.flightNumber'), value: meta.flight_number })
  if (!hasEndpoints && meta.departure_airport) metaCells.push({ label: t('reservations.meta.from'), value: meta.departure_airport })
  if (!hasEndpoints && meta.arrival_airport) metaCells.push({ label: t('reservations.meta.to'), value: meta.arrival_airport })
  if (meta.train_number) metaCells.push({ label: t('reservations.meta.trainNumber'), value: meta.train_number })
  if (meta.platform) metaCells.push({ label: t('reservations.meta.platform'), value: meta.platform })
  if (meta.seat) metaCells.push({ label: t('reservations.meta.seat'), value: meta.seat + (meta.class ? ` · ${meta.class}` : '') })
  if (meta.price != null && meta.price !== '') {
    metaCells.push({ label: t('reservations.price'), value: formatPriceText(meta.price, meta.priceCurrency, planner.trip?.currency, locale) })
  }

  const files = filesFor(res, planner.files || [])

  const openDetail = () => shell.openSheet('transport', { reservationId: res.id })
  const toggleStatus = async () => {
    try {
      await planner.tripActions.toggleReservationStatus(planner.tripId, res.id)
    } catch {
      planner.toast.error(t('reservations.toast.updateError'))
    }
  }
  const editTransport = () => {
    planner.setEditingTransport(res)
    planner.setTransportModalDayId(res.day_id ?? null)
    planner.setShowTransportModal(true)
  }

  const { dayValue, timeValue } = cardWhen(res, startDay, endDay, t, locale, timeFormat)

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
      {/* Header */}
      <div className="flex items-center gap-[7px] border-b border-[color:var(--m-rowbr)] px-3 py-[10px]" style={{ background: tint }}>
        {canEdit ? (
          <button
            type="button"
            onClick={toggleStatus}
            aria-label={confirmed ? t('reservations.pending') : t('reservations.confirmed')}
            className="-m-1 flex-none p-1"
          >
            <StatusDot color={dotColor} />
          </button>
        ) : (
          <StatusDot color={dotColor} />
        )}
        <CardTitleButton res={res} TypeIcon={TypeIcon} typeColor={typeColor} onOpen={openDetail} t={t} />
        {canEdit && <CardActions onEdit={editTransport} onDelete={card.askDelete} t={t} />}
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
            onOpen={openDetail}
            t={t}
          />

          <button type="button" onClick={openDetail} className="block w-full text-start">
            {eps.length >= 2 && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-2 text-[0.71875rem] font-semibold text-m-ink">
                {eps.map((ep, i) => (
                  <span key={i} className="inline-flex min-w-0 items-center gap-2">
                    {i > 0 && <TypeIcon size={12} strokeWidth={2.2} className="flex-none" style={{ color: typeColor }} />}
                    <span className="truncate">{ep.name}</span>
                  </span>
                ))}
              </div>
            )}

            {metaCells.length > 0 && (
              <div className="mt-2 flex gap-2">
                {metaCells.slice(0, 3).map((c, i) => (
                  <Field key={i} label={c.label} className="flex-1">{c.value}</Field>
                ))}
              </div>
            )}

            <TravelerAvatars travelers={res.travelers || []} label={t('reservations.travelers.label')} />

            <CardFiles files={files} card={card} t={t} />
          </button>
        </div>
      )}
      {!compact && <ReservationPluginSlots tripId={planner.tripId} reservationId={res.id} />}

      <CardDeleteSheet title={res.title} card={card} t={t} />
    </div>
  )
}
