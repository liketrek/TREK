import type { BookingCard as BookingCardData, BookingItem } from '@trek/shared';
import { ArrowUpRight, MapPin, type LucideIcon } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { Tooltip } from '../../../shared/Tooltip';
import { useAssistantView } from '../../assistantViewContext';
import type { EntityTarget } from '../cardTypes';
import { BookingFooter, BookingHead, StayBody, TicketBody, VenueBody } from './bookingCardParts';
import { bookingSpotOf, bookingTarget } from './bookingLook';

/**
 * One booking as a whole card, the way the planner's booking cards look: a
 * head band tinted by its status, then the ticket, stay or venue, then its
 * price, reference and travellers. A booking that will be created sits in a
 * dashed frame, one that will be deleted fades with its title struck. One
 * component for the desktop window and the phone.
 */

type Card = Pick<BookingCardData, 'change'>;

const FRAME: Record<Card['change'], string> = {
  none: 'border-edge-faint',
  create: 'border-dashed border-edge',
  update: 'border-edge-faint',
  remove: 'border-edge-faint opacity-60',
};

/** Where the card's "Open" goes: the booking in its tab, a stay without a booking on its check-in day. */
function openTarget(item: BookingItem): EntityTarget | null {
  if (item.reservationId !== null) return bookingTarget(item, item.reservationId);
  const dayId = item.body.shape === 'stay' ? (item.body.checkIn?.day.id ?? null) : null;
  return dayId !== null && item.tripTitle === null ? { kind: 'map', placeId: null, dayId } : null;
}

/** Where "Show on map" goes: a saved route drawn on the plan, a stay's or a venue's place. */
function mapTarget(item: BookingItem): EntityTarget | null {
  const body = item.body;
  if (body.shape === 'ticket') {
    return body.mappable && item.reservationId !== null ? bookingTarget(item, item.reservationId, true) : null;
  }
  const spot = bookingSpotOf(item);
  return spot?.placeId != null ? { kind: 'map', ...spot } : null;
}

interface HeadActionProps {
  label: string;
  onClick: () => void;
  icon: LucideIcon;
  /** A pointing glyph turns with the reading direction; a map pin does not. */
  turns?: boolean;
}

/** A quiet round action on the head band: shown on hover or focus, always on touch screens; tall on the phone. */
function HeadAction({ label, onClick, icon: Icon, turns = false }: HeadActionProps) {
  const { variant } = useAssistantView();
  const size = variant === 'fullscreen' ? 'h-10 w-10' : 'h-[26px] w-[26px]';
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`grid ${size} flex-none place-items-center rounded-full bg-surface-card text-content-muted opacity-60 transition-opacity hover:text-content focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100`}
      >
        <Icon size={14} aria-hidden="true" className={turns ? 'rtl:-scale-x-100' : undefined} />
      </button>
    </Tooltip>
  );
}

/** The ways out of a card: the plan's map, and the booking where it lives. */
function CardActions({ item }: { item: BookingItem }) {
  const { t } = useTranslation();
  const { onOpen } = useAssistantView();
  if (!onOpen) return null;
  const map = mapTarget(item);
  const open = openTarget(item);
  const openKey = item.reservationId !== null ? 'assistant.card.booking.open' : 'assistant.card.booking.openStay';
  return (
    <>
      {map && <HeadAction label={t('assistant.change.showOnMap')} icon={MapPin} onClick={() => onOpen(map)} />}
      {open && <HeadAction label={t(openKey)} icon={ArrowUpRight} turns onClick={() => onOpen(open)} />}
    </>
  );
}

export default function BookingCard({
  item,
  card,
  actions = true,
}: {
  item: BookingItem;
  card: Card;
  /** Off inside a change card, whose row has its own ways to the booking. */
  actions?: boolean;
}) {
  const { t } = useTranslation();
  const body = item.body;
  return (
    <section
      aria-label={item.title}
      className={`trek-assistant-enter group overflow-hidden rounded-xl border bg-surface-card shadow-card ${FRAME[card.change]}`}
    >
      <BookingHead item={item} card={card} actions={actions ? <CardActions item={item} /> : null} />
      <div className="px-3 pb-2.5 pt-2">
        {item.tripTitle && (
          <p className="m-0 mb-1 text-caption text-content-muted">
            {t('assistant.card.booking.inTrip', { trip: item.tripTitle })}
          </p>
        )}
        {body.shape === 'ticket' && <TicketBody item={item} body={body} card={card} />}
        {body.shape === 'stay' && <StayBody item={item} body={body} card={card} />}
        {body.shape === 'venue' && <VenueBody item={item} body={body} card={card} />}
        <BookingFooter item={item} card={card} />
      </div>
    </section>
  );
}
