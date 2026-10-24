import { buildTripCard, type TripCard } from './assistant-context';
import type { AssistantToolSession, AssistantToolsService } from './assistant-tools.service';
import type { AssistantFocus, AssistantMention } from '@trek/shared';

/**
 * What only a trip conversation has: the trip card, read through the trip
 * tools with the user's rights. A Studio conversation reads its journey
 * instead (assistant-book-context.ts).
 */

/** The reads the trip card is built from. */
const TRIP_CARD_READS: ReadonlySet<string> = new Set(['get_trip_summary', 'list_places']);

/** The trip card for a turn, read through the turn's session. */
export async function tripCardFrom(
  session: Pick<AssistantToolSession, 'read'>,
  tripId: number,
  userId: number,
  focus: AssistantFocus | null,
  mentions: readonly AssistantMention[] = [],
): Promise<TripCard> {
  const summary = await session.read('get_trip_summary');
  const places = await session.read('list_places');
  const [found, listed] = [summary.ok ? summary.value : null, places.ok ? places.value : null];
  return buildTripCard(tripId, userId, found, listed, focus, mentions);
}

/**
 * The trip card outside a turn's session (the labels of what a message
 * mentions, the day a booking from a file names), on a session holding only
 * its two reads.
 */
export async function readTripCard(tools: AssistantToolsService, userId: number, tripId: number): Promise<TripCard> {
  const session = await tools.open(userId, tripId, TRIP_CARD_READS);
  try {
    return await tripCardFrom(session, tripId, userId, null);
  } finally {
    await session.close();
  }
}
