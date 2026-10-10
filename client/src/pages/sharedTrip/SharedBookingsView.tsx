import { Ticket, Train } from 'lucide-react'
import type { Day, Reservation } from '../../types'
import { fs } from '../../components/shared/DialogShell'
import { SoftPill } from '../../components/Planner/planParts'
import { BOX, Block, CountPill, Field, RouteBox, TypeChip, WhenFields, toneColor, toneOf, toneTint } from '../../components/Planner/bookings/bookingParts'
import { bookingFacts } from '../../components/Planner/bookings/bookingFacts'
import { displayTitle } from '../../components/Planner/bookings/bookingsModel'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { TRANSPORT_TYPES } from '../../utils/dayMerge'
import { getFlightLegs, getTrainLegs, usesStationRoute } from '../../utils/flightLegs'
import { EmptySection, SectionTitle } from './SharedChrome'
import { SharedBookingDetails } from './SharedBookingDetails'
import { legFacts } from './sharedTripModel'

interface SharedBookingsViewProps {
  reservations: Reservation[]
  days: Day[]
  tripCurrency?: string | null
}

/**
 * The Bookings tab: the journeys first, then the stays, tables and tickets,
 * each as the booking card of the planner without anything to press. The
 * server has already held back the confirmation codes, the travellers and
 * the prices; the card only lays out what arrived.
 */
export function SharedBookingsView({ reservations, days, tripCurrency }: SharedBookingsViewProps) {
  const { t } = useTranslation()
  if (reservations.length === 0) return <EmptySection icon={<Ticket size={22} />} text={t('shared.emptyBookings')} />
  const transports = reservations.filter(r => TRANSPORT_TYPES.has(r.type))
  const bookings = reservations.filter(r => !TRANSPORT_TYPES.has(r.type))
  return (
    <div className="flex flex-col gap-8">
      {transports.length > 0 && (
        <section>
          <SectionTitle icon={<Train size={16} strokeWidth={2} />} title={t('trip.tabs.transports')}><CountPill>{transports.length}</CountPill></SectionTitle>
          <CardGrid list={transports} days={days} tripCurrency={tripCurrency} />
        </section>
      )}
      {bookings.length > 0 && (
        <section>
          <SectionTitle icon={<Ticket size={16} strokeWidth={2} />} title={t('trip.tabs.reservations')}><CountPill>{bookings.length}</CountPill></SectionTitle>
          <CardGrid list={bookings} days={days} tripCurrency={tripCurrency} />
        </section>
      )}
    </div>
  )
}

function CardGrid({ list, days, tripCurrency }: { list: Reservation[]; days: Day[]; tripCurrency?: string | null }) {
  return (
    <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {list.map(r => <SharedBookingCard key={r.id} r={r} days={days} tripCurrency={tripCurrency} />)}
    </div>
  )
}

function SharedBookingCard({ r, days, tripCurrency }: { r: Reservation; days: Day[]; tripCurrency?: string | null }) {
  const { t, locale } = useTranslation()
  const timeFormat = useSettingsStore(s => s.settings.time_format)
  const facts = bookingFacts(r, { t, locale, timeFormat, days, assignmentLookup: {}, tripCurrency, hasLinkedCost: true })
  const tone = toneOf(r)
  const platform = t('reservations.meta.platform')
  const legs = r.type === 'flight' ? getFlightLegs(r) : usesStationRoute(r.type) ? getTrainLegs(r) : []
  return (
    <article aria-label={displayTitle(r)} className="flex flex-col overflow-hidden rounded-2xl border border-edge-faint bg-surface-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-edge-faint px-3 py-2.5" style={{ background: toneTint(tone) }}>
        <span className="block h-2 w-2 flex-none rounded-full" style={{ background: toneColor(tone) }} />
        <TypeChip type={r.type} />
        <span className="min-w-0 flex-1 truncate font-bold text-content" style={fs(13.5, 'body')}>{displayTitle(r)}</span>
        {tone !== 'transit' && (
          <SoftPill tone={tone === 'confirmed' ? 'success' : 'warning'}>{tone === 'confirmed' ? t('shared.confirmed') : t('shared.pending')}</SoftPill>
        )}
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3 pt-2.5">
        <WhenFields facts={facts} />
        <RouteBox type={r.type} facts={facts} />
        {legs.length > 1 ? (
          // A stopover booking lists each leg with its own carrier, number and route.
          <Block label={t('transit.itinerary')}>
            <div className={`${BOX} flex flex-col gap-1 px-[10px] py-2`}>
              {legs.map((leg, i) => (
                <div key={i} className="font-medium text-content-secondary" style={fs(12, 'body')}>{legFacts(leg, platform).join(' ')}</div>
              ))}
            </div>
          </Block>
        ) : facts.cells.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {facts.cells.map((c, i) => <Field key={i} label={c.label}>{c.value}</Field>)}
          </div>
        )}
        {facts.place && <Field label={t('reservations.locationAddress')}>{facts.place}</Field>}
        <SharedBookingDetails notes={r.notes} url={r.url} />
      </div>
    </article>
  )
}
