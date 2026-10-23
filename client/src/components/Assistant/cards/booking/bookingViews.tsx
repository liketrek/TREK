import type { CardView } from '../cardTypes';
import BookingBlock from './BookingBlock';
import { BookingChangeBody, BookingChangeFacts } from './BookingChangeSlots';

/**
 * How the bookings draw in the chat: an answer's bookings as one block, and
 * a change's booking as a card under its row, which names it in place of the
 * row's subject. This file only maps the kind to its view: the components
 * live in sibling files, since a file that exports anything besides
 * components breaks fast refresh, and lint:warnings holds
 * react-refresh/only-export-components at zero for a new file.
 */
export const BOOKING_VIEWS = {
  booking: {
    Block: BookingBlock,
    Body: BookingChangeBody,
    Facts: BookingChangeFacts,
    ownsSubject: true,
  },
} satisfies { [K in 'booking']: CardView<K> };
