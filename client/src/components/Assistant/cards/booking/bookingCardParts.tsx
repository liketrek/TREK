import type {
  BookingCard as BookingCardData,
  BookingItem,
  BookingLeg,
  BookingStay,
  BookingTicket,
  BookingVenue,
} from '@trek/shared';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Route,
  Ticket,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useRef, type ReactNode } from 'react';

import { useTranslation } from '../../../../i18n';
import { ReviewPill, toneColor, toneTint, TypeTile } from '../../../Planner/bookings/bookingParts';
import { typeInfo } from '../../../Planner/bookings/bookingsModel';
import { SoftPill, TimePill, type PillTone } from '../../../Planner/planParts';
import { Tooltip } from '../../../shared/Tooltip';
import { useAssistantView } from '../../assistantViewContext';
import { useFoundPlacePhoto } from '../../useFoundPlacePhoto';
import { CardFacts } from '../parts/CardFacts';
import { PeopleStack } from '../parts/CardPeople';
import { daysLater, isChanged, layoversOf, STATUS_LABEL, stopsOf, toneOfItem } from './bookingCardModel';
import { useBookingFormat } from './useBookingFormat';

/**
 * The pieces of a booking card, in the planner's own booking language: the
 * head band tinted by the status, the type tile, the review mark, white soft
 * pills for the facts, the travellers' faces at the end. A ticket shows its
 * route with times and codes, a stay its nights and check-in window, a venue
 * its place and time. Codes and times never truncate; names do, with their
 * whole text in a tooltip.
 */

type Card = Pick<BookingCardData, 'change'>;

/** The arrow of a range (a check-in window, Monday to Sunday), turned for right-to-left. */
export function RangeArrow() {
  return <ArrowRight size={9} aria-hidden="true" className="flex-none text-content-faint rtl:-scale-x-100" />;
}

/** The small accent dot of a fact an update changes. */
function ChangedDot() {
  const { t } = useTranslation();
  const label = t('assistant.card.common.changed');
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent"
    />
  );
}

/**
 * The status dot in the planner's tones (its `toneOf`), its word in the
 * tooltip; a transit hop has the dot without a word, a stay no booking names
 * neither.
 */
export function StatusMark({ item }: { item: BookingItem }) {
  const { t } = useTranslation();
  const tone = toneOfItem(item);
  if (!tone) return null;
  const dot = <span className="block h-2 w-2 rounded-full" style={{ background: toneColor(tone) }} />;
  if (!item.status) return <span className="grid h-[22px] w-[22px] flex-none place-items-center">{dot}</span>;
  const label = t(STATUS_LABEL[item.status].labelKey);
  return (
    <Tooltip label={label}>
      <span role="img" aria-label={label} className="grid h-[22px] w-[22px] flex-none place-items-center">
        {dot}
      </span>
    </Tooltip>
  );
}

/** A stay's picture through TREK's photo proxy, else its type tile at `tile`. */
function StayPhoto({ item, body, size, tile }: { item: BookingItem; body: BookingStay; size: number; tile: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const photo = useFoundPlacePhoto({ photoKey: body.photoKey, lat: body.lat, lng: body.lng, name: item.title }, ref);
  return (
    <span ref={ref} className="flex flex-none">
      {photo ? (
        <img src={photo} alt="" className="rounded-lg object-cover" style={{ width: size, height: size }} />
      ) : (
        <TypeTile type={item.type} size={tile} />
      )}
    </span>
  );
}

/** The lead of the head band: a stay's photo (56, 44 when compact), else the type tile. */
function HeadLead({ item }: { item: BookingItem }) {
  const { density } = useAssistantView();
  const compact = density === 'compact';
  if (item.body.shape === 'stay') {
    return <StayPhoto item={item} body={item.body} size={compact ? 44 : 56} tile={compact ? 32 : 40} />;
  }
  return <TypeTile type={item.type} size={compact ? 24 : 28} />;
}

/**
 * The head band: the type tile (a stay's photo with its address under the
 * title), the title, the review mark, the status dot and the card's actions,
 * on the tint of the status as on the planner's booking cards.
 */
export function BookingHead({ item, card, actions }: { item: BookingItem; card: Card; actions?: ReactNode }) {
  const { t } = useTranslation();
  const tone = toneOfItem(item);
  const removed = card.change === 'remove';
  const address = item.body.shape === 'stay' ? item.body.address : null;
  return (
    <div
      className="flex items-center gap-2 border-b border-edge-faint px-3 py-2"
      style={{ background: tone ? toneTint(tone) : undefined }}
    >
      <HeadLead item={item} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <bdi
            title={item.title}
            className={`line-clamp-2 text-body font-semibold leading-tight text-content ${removed ? 'line-through' : ''}`}
          >
            {item.title}
          </bdi>
          {item.needsReview && <ReviewPill />}
          {isChanged(card, item, 'title') && <ChangedDot />}
          {removed && <span className="sr-only">{t('assistant.card.common.willDelete')}</span>}
        </span>
        {address && (
          <bdi title={address} className="line-clamp-2 text-caption text-content-muted">
            {address}
          </bdi>
        )}
      </span>
      <StatusMark item={item} />
      {isChanged(card, item, 'status') && <ChangedDot />}
      {actions}
    </div>
  );
}

/** A fact as a white soft pill with its glyph, the accent dot when an update changes it. */
function Pill({
  icon: Icon,
  tone = 'neutral',
  changed = false,
  label,
  children,
}: {
  icon: LucideIcon;
  tone?: PillTone;
  changed?: boolean;
  label?: string;
  children: ReactNode;
}) {
  return (
    <SoftPill
      tone={tone}
      className="max-w-full tabular-nums"
      icon={<Icon size={10} strokeWidth={2.2} aria-hidden="true" className="flex-none" />}
    >
      {label && <span className="sr-only">{label}</span>}
      <span className="flex min-w-0 items-center gap-1" aria-hidden={label ? true : undefined}>
        {children}
      </span>
      {changed && <ChangedDot />}
    </SoftPill>
  );
}

/** The day a booking falls on: its date, and its number in the trip beside it. */
function DayPills({ day, changed }: { day: BookingLeg['departsDay']; changed: boolean }) {
  const format = useBookingFormat();
  const date = format.day(day);
  const number = format.dayNumber(day);
  if (!date) return null;
  return (
    <>
      <Pill icon={CalendarDays} changed={changed}>
        <bdi className="truncate">{date}</bdi>
      </Pill>
      {number && <SoftPill>{number}</SoftPill>}
    </>
  );
}

/** What every booking ends with: its price, that a reference is kept, and who travels. */
export function BookingFooter({ item, card }: { item: BookingItem; card: Card }) {
  const { t } = useTranslation();
  const format = useBookingFormat();
  if (!item.price && !item.hasReference && item.travelers.length === 0) return null;
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <CardFacts>
        {item.price && (
          <Pill icon={Wallet} changed={isChanged(card, item, 'price')}>
            {format.money(item.price)}
          </Pill>
        )}
        {item.hasReference && (
          <Tooltip label={t('assistant.card.booking.referenceHint')}>
            <span className="inline-flex">
              <Pill icon={BadgeCheck} tone="success" changed={isChanged(card, item, 'reference')}>
                {t('assistant.card.booking.reference')}
              </Pill>
            </span>
          </Tooltip>
        )}
      </CardFacts>
      <span className="ms-auto flex flex-none items-center gap-1">
        <PeopleStack people={item.travelers} />
        {item.moreTravelers > 0 && (
          <span className="text-caption font-semibold tabular-nums text-content-faint">+{item.moreTravelers}</span>
        )}
        {isChanged(card, item, 'travelers') && <ChangedDot />}
      </span>
    </div>
  );
}

/** "08:15 → 11:05 +1" for a ticket without a route (a hire car, a taxi). */
function TimesPill({ leg, later }: { leg: BookingLeg; later: number | null }) {
  const format = useBookingFormat();
  if (!leg.departs && !leg.arrives) return null;
  return (
    <TimePill>
      <span>{format.clock(leg.departs)}</span>
      {leg.departs && leg.arrives && <RangeArrow />}
      <span>{format.clock(leg.arrives)}</span>
      {later !== null && <Later count={later} />}
    </TimePill>
  );
}

/** "+1" after an arrival on a later day, the day count in words in its tooltip. */
function Later({ count }: { count: number }) {
  const { t } = useTranslation();
  const label = t('assistant.card.booking.arrivesLater', { count });
  return (
    <Tooltip label={label}>
      <sup aria-label={label} className="ms-0.5 text-caption font-semibold text-content-muted">
        +{count}
      </sup>
    </Tooltip>
  );
}

/** The route of a ticket as the planner draws it: times above, codes on a dashed line, names below. */
function RouteLine({ item, body, later }: { item: BookingItem; body: BookingTicket; later: number | null }) {
  const format = useBookingFormat();
  const { density } = useAssistantView();
  const first = body.stops[0];
  const last = body.stops[body.stops.length - 1];
  const leg = body.legs[0] as BookingLeg;
  const end = body.legs[body.legs.length - 1] as BookingLeg;
  const info = typeInfo(item.type);
  const time = `font-semibold tabular-nums text-content ${density === 'compact' ? 'text-body' : 'text-subtitle'}`;
  if (!first || !last) return null;
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5">
      <span className={time}>{format.clock(leg.departs)}</span>
      <span className="truncate text-center text-caption text-content-muted">{format.minutes(body.minutes)}</span>
      <span className={`${time} text-end`}>
        {format.clock(end.arrives)}
        {later !== null && <Later count={later} />}
      </span>
      <span className="text-caption font-bold text-content">{first.code ?? ''}</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="h-px flex-1 border-t border-dashed border-edge" />
        <info.Icon size={13} strokeWidth={2.2} className="flex-none rtl:-scale-x-100" style={{ color: info.color }} />
        <span className="h-px flex-1 border-t border-dashed border-edge" />
      </span>
      <span className="text-end text-caption font-bold text-content">{last.code ?? ''}</span>
      <bdi title={first.name} className="truncate text-caption text-content-faint">
        {first.name}
      </bdi>
      <span />
      <bdi title={last.name} className="truncate text-end text-caption text-content-faint">
        {last.name}
      </bdi>
    </div>
  );
}

/** Who flies a leg and where one sits: "Lufthansa LH 101", then "Seat 12A". */
function LegCarrier({ leg }: { leg: BookingLeg }) {
  const { t } = useTranslation();
  const carrier = [leg.carrier, leg.number].filter(Boolean).join(' ');
  if (!carrier && !leg.seat) return null;
  return (
    <span className="ms-auto flex min-w-0 items-center gap-2 text-content-muted">
      {carrier && (
        <bdi title={carrier} className="truncate">
          {carrier}
        </bdi>
      )}
      {leg.seat && <span className="flex-none">{t('assistant.card.booking.seat', { seat: leg.seat })}</span>}
    </span>
  );
}

/** A stopover booking leg by leg, the time between two legs as a quiet pill. */
function LegRows({ body }: { body: BookingTicket }) {
  const { t } = useTranslation();
  const format = useBookingFormat();
  const layovers = layoversOf(body);
  if (layovers.length === 0) return null;
  return (
    <ol className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
      {body.legs.map((leg, i) => {
        const from = body.stops[i];
        const to = body.stops[i + 1];
        const stop = layovers[i];
        return (
          <li key={i} className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-x-2 text-caption tabular-nums text-content-secondary">
              <span className="font-semibold">{from?.code ?? from?.name}</span>
              <span>{format.clock(leg.departs)}</span>
              <RangeArrow />
              <span className="font-semibold">{to?.code ?? to?.name}</span>
              <span>{format.clock(leg.arrives)}</span>
              <LegCarrier leg={leg} />
            </span>
            {stop && (
              <span className="self-center rounded-full bg-surface-secondary px-2 text-caption text-content-muted">
                {stop.minutes
                  ? t('assistant.card.booking.layoverAt', { duration: format.minutes(stop.minutes), place: stop.place })
                  : stop.place}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface TicketFactsProps {
  item: BookingItem;
  body: BookingTicket;
  card: Card;
  later: number | null;
}

/** The facts under a ticket: its times without a route, its day, carrier, seat, platform and stops. */
function TicketFacts({ item, body, card, later }: TicketFactsProps) {
  const { t } = useTranslation();
  const first = body.legs[0] as BookingLeg;
  const single = body.legs.length === 1 ? first : null;
  const stops = stopsOf(body);
  const carrier = single ? [single.carrier, single.number].filter(Boolean).join(' ') : '';
  return (
    <CardFacts>
      {body.stops.length < 2 && <TimesPill leg={first} later={later} />}
      <DayPills day={first.departsDay} changed={isChanged(card, item, 'day') || isChanged(card, item, 'time')} />
      {carrier && (
        <Pill icon={Ticket}>
          <bdi className="truncate">{carrier}</bdi>
        </Pill>
      )}
      {single?.seat && <SoftPill>{t('assistant.card.booking.seat', { seat: single.seat })}</SoftPill>}
      {single?.platform && <SoftPill>{t('assistant.card.booking.platform', { platform: single.platform })}</SoftPill>}
      {stops !== null && (
        <Pill icon={Route} changed={isChanged(card, item, 'route')}>
          {stops === 0 ? t('assistant.card.booking.direct') : t('assistant.card.booking.stops', { count: stops })}
        </Pill>
      )}
    </CardFacts>
  );
}

/** A flight, a train, a hire car: its route with times and codes, its legs, then its facts. */
export function TicketBody({ item, body, card }: { item: BookingItem; body: BookingTicket; card: Card }) {
  const first = body.legs[0] as BookingLeg;
  const last = body.legs[body.legs.length - 1] as BookingLeg;
  const later = daysLater(first.departsDay, last.arrivesDay);
  return (
    <>
      {body.stops.length >= 2 && <RouteLine item={item} body={body} later={later} />}
      <LegRows body={body} />
      <TicketFacts item={item} body={body} card={card} later={later} />
    </>
  );
}

/** Where a venue is, on two lines at most, the whole text in its tooltip. */
function PlaceLine({ text, changed }: { text: string | null; changed: boolean }) {
  if (!text) return null;
  return (
    <p className="m-0 flex items-start gap-1 text-caption text-content-muted">
      <MapPin size={11} aria-hidden="true" className="mt-0.5 flex-none" />
      <bdi title={text} className="line-clamp-2">
        {text}
      </bdi>
      {changed && <ChangedDot />}
    </p>
  );
}

/** The nights of a stay as a range of days, the trip's day numbers in its tooltip. */
function StayRange({ item, body, card }: { item: BookingItem; body: BookingStay; card: Card }) {
  const { t } = useTranslation();
  const format = useBookingFormat();
  const start = body.checkIn ? body.checkIn.day : null;
  const end = body.checkOut ? body.checkOut.day : null;
  const from = format.day(start);
  const to = format.day(end);
  if (!from && !to) return null;
  const range = from && to ? t('assistant.card.booking.range', { from, to }) : from || to;
  const numbers = [format.dayNumber(start), format.dayNumber(end)].filter(Boolean).join(' → ');
  return (
    <Tooltip label={numbers || range}>
      <span className="inline-flex">
        <Pill icon={CalendarDays} changed={isChanged(card, item, 'stay')} label={range}>
          <bdi className="truncate">{from}</bdi>
          {from && to && <RangeArrow />}
          <bdi className="truncate">{to}</bdi>
        </Pill>
      </span>
    </Tooltip>
  );
}

/** Check-in from (to the end of its window) in green, check-out by in red, as the planner's day heads. */
function StayTimes({ item, body, card }: { item: BookingItem; body: BookingStay; card: Card }) {
  const { t } = useTranslation();
  const format = useBookingFormat();
  const checkIn = body.checkIn && body.checkIn.from ? body.checkIn : null;
  const checkOut = body.checkOut && body.checkOut.by ? body.checkOut.by : null;
  return (
    <>
      {checkIn && (
        <Pill icon={LogIn} tone="success" changed={isChanged(card, item, 'checkIn')}>
          {t('assistant.card.booking.checkInAt', { time: format.clock(checkIn.from) })}
          {checkIn.until && <RangeArrow />}
          {checkIn.until && <span>{format.clock(checkIn.until)}</span>}
        </Pill>
      )}
      {checkOut && (
        <Pill icon={LogOut} tone="danger" changed={isChanged(card, item, 'checkOut')}>
          {t('assistant.card.booking.checkOutAt', { time: format.clock(checkOut) })}
        </Pill>
      )}
    </>
  );
}

/** A hotel or any stay: its nights, the check-in window and check-out (its address sits in the head). */
export function StayBody({ item, body, card }: { item: BookingItem; body: BookingStay; card: Card }) {
  const { t } = useTranslation();
  return (
    <>
      <CardFacts>
        <StayRange item={item} body={body} card={card} />
        {body.nights !== null && body.nights > 0 && (
          <Pill icon={Moon}>{t('assistant.card.booking.nights', { count: body.nights })}</Pill>
        )}
        <StayTimes item={item} body={body} card={card} />
      </CardFacts>
    </>
  );
}

/** A table, a show, a tour: where it is, its day and its time. */
export function VenueBody({ item, body, card }: { item: BookingItem; body: BookingVenue; card: Card }) {
  const format = useBookingFormat();
  return (
    <>
      <PlaceLine text={body.location} changed={isChanged(card, item, 'location')} />
      <CardFacts>
        <DayPills day={body.day} changed={isChanged(card, item, 'day')} />
        {body.starts && (
          <Pill icon={Clock} changed={isChanged(card, item, 'time')}>
            <span>{format.clock(body.starts)}</span>
            {body.ends && <RangeArrow />}
            {body.ends && <span>{format.clock(body.ends)}</span>}
          </Pill>
        )}
      </CardFacts>
    </>
  );
}
