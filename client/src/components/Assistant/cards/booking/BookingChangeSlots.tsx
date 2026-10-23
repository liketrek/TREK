import type { TrekCardOf } from '@trek/shared';

import AssistantChangeFields from '../../AssistantChangeFields';
import type { ChangeItem } from '../../assistantParts';
import { BookingList } from './BookingBlock';

/**
 * The booking card inside a change row. The row keeps its choice, its tile
 * and the verb line ("Add accommodation"); the card under it names the
 * booking, so the row's bold subject gives way. An update keeps the before
 * and after pills of its fields on the faint line; a create or a removal shows
 * them in the card alone.
 */

interface SlotProps {
  card: TrekCardOf<'booking'>;
  item: ChangeItem;
}

/** The card under the row; the row itself leads to the booking once it is saved. */
export function BookingChangeBody({ card }: SlotProps) {
  return <BookingList items={card.items} more={card.more} card={card} actions={false} />;
}

/** The faint line's pills: an update's old and new values, nothing beside a card that shows them all. */
export function BookingChangeFacts({ card, item }: SlotProps) {
  if (card.change !== 'update' || !item.preview) return null;
  return <AssistantChangeFields rows={item.preview.rows} />;
}
