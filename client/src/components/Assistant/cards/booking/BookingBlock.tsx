import type {
  AssistantMessage,
  BookingCard as BookingCardData,
  BookingItem,
  BookingLeg,
  BookingStay,
  BookingTicket,
} from '@trek/shared';

import { useTranslation } from '../../../../i18n';
import { TypeTile } from '../../../Planner/bookings/bookingParts';
import { WhiteBadge } from '../../../Planner/planParts';
import { useAssistantView } from '../../assistantViewContext';
import type { CardEntry, EntityTarget } from '../cardTypes';
import { CardMore, CardRow, CardRows } from '../parts/CardRows';
import BookingCard from './BookingCard';
import { FULL_CARDS, itemsOf } from './bookingCardModel';
import { RangeArrow, StatusMark } from './bookingCardParts';
import { bookingTabOf, bookingTarget } from './bookingLook';
import { useBookingFormat } from './useBookingFormat';

/**
 * The bookings of one answer, or of one change, as one block: up to two whole
 * cards stacked, from three on one framed list in the plan sidebar's look, so
 * a file with five bookings stays short and nothing folds away. What the
 * answer left out is counted as a way to the bookings tab.
 */

type Card = Pick<BookingCardData, 'change'>;

/** When a ticket goes: its day, departure and arrival. */
function TicketWhen({ body }: { body: BookingTicket }) {
  const format = useBookingFormat();
  const leg = body.legs[0] as BookingLeg;
  const end = body.legs[body.legs.length - 1] as BookingLeg;
  return (
    <>
      <span>{format.day(leg.departsDay)}</span>
      <span>{format.clock(leg.departs)}</span>
      {leg.departs && end.arrives && <RangeArrow />}
      <span>{format.clock(end.arrives)}</span>
    </>
  );
}

/** When a stay is: check-in day to check-out day, and its nights. */
function StayWhen({ body }: { body: BookingStay }) {
  const { t } = useTranslation();
  const format = useBookingFormat();
  const start = body.checkIn ? body.checkIn.day : null;
  const end = body.checkOut ? body.checkOut.day : null;
  return (
    <>
      <span>{format.day(start)}</span>
      {start && end && <RangeArrow />}
      <span>{format.day(end)}</span>
      {body.nights ? <span>{t('assistant.card.booking.nights', { count: body.nights })}</span> : null}
    </>
  );
}

/** The second line of a row: when, in a few words, and another trip's name. */
function RowFacts({ item }: { item: BookingItem }) {
  const { t } = useTranslation();
  const format = useBookingFormat();
  const body = item.body;
  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-caption tabular-nums text-content-faint">
      {body.shape === 'ticket' && <TicketWhen body={body} />}
      {body.shape === 'stay' && <StayWhen body={body} />}
      {body.shape === 'venue' && (
        <>
          <span>{format.day(body.day)}</span>
          <span>{format.clock(body.starts)}</span>
        </>
      )}
      {item.tripTitle && <span>{t('assistant.card.booking.inTrip', { trip: item.tripTitle })}</span>}
    </span>
  );
}

/** One booking as a row of the list: its type, its title and status, when it is. */
function BookingRow({ item, card }: { item: BookingItem; card: Card }) {
  const { onOpen } = useAssistantView();
  const target = item.reservationId !== null ? bookingTarget(item, item.reservationId) : null;
  return (
    <CardRow
      lead={<TypeTile type={item.type} size={24} />}
      title={
        <span className="flex min-w-0 items-center gap-1.5">
          <bdi title={item.title} className={`line-clamp-1 ${card.change === 'remove' ? 'line-through' : ''}`}>
            {item.title}
          </bdi>
          <StatusMark item={item} />
        </span>
      }
      facts={<RowFacts item={item} />}
      onActivate={onOpen && target ? () => onOpen(target) : undefined}
    />
  );
}

/**
 * Where "N more" leads: the tab of the bookings it left out, the transports
 * when all shown are; a list spanning other trips (the upcoming bookings) leads
 * to the dashboard, which lists every trip.
 */
function moreTarget(items: readonly BookingItem[]): EntityTarget {
  if (items.some((item) => item.tripTitle !== null)) return { kind: 'page', path: '/dashboard' };
  const tab = items.every((item) => bookingTabOf(item.type) === 'transports') ? 'transports' : 'buchungen';
  return { kind: 'tab', tab };
}

/** Bookings as whole cards (two at most) or as a framed list. */
export function BookingList({
  items,
  more,
  card,
  actions,
}: {
  items: readonly BookingItem[];
  more: number;
  card: Card;
  actions: boolean;
}) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  if (items.length <= FULL_CARDS) {
    return (
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <BookingCard key={`${item.reservationId ?? 'new'}-${i}`} item={item} card={card} actions={actions} />
        ))}
        <CardMore count={more} labelKey="assistant.card.booking.more" target={moreTarget(items)} />
      </div>
    );
  }
  return (
    <section
      aria-label={t('assistant.card.booking.list')}
      className={`trek-assistant-enter rounded-xl border bg-surface-card px-3 pb-2 pt-2.5 shadow-card ${
        card.change === 'create' ? 'border-dashed border-edge' : 'border-edge-faint'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-caption font-semibold text-content-secondary">{t('assistant.card.booking.list')}</span>
        <WhiteBadge>{items.length + more}</WhiteBadge>
      </div>
      <CardRows>
        {items.map((item, i) => (
          <BookingRow key={`${item.reservationId ?? 'new'}-${i}`} item={item} card={card} />
        ))}
      </CardRows>
      <CardMore count={more} labelKey="assistant.card.booking.more" target={moreTarget(items)} />
    </section>
  );
}

/** The answer block: every booking card of the group read as one list. */
export default function BookingBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  const { items, more } = itemsOf(cards);
  return <BookingList items={items} more={more} card={{ change: 'none' }} actions />;
}
