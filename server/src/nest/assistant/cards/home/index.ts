import { OPEN_TRIP_CHAT_TOOL, phaseOf } from '../../assistant-home';
import type { AnswerInput, DomainCards } from '../card-types';
import { tripChatCardSchema, type TrekCard } from '@trek/shared';

/**
 * The home chat's own card: the way into a trip's chat its step offers,
 * built from what the step answered (a trip of the user's, read from their
 * own trips) and checked against the card's schema. Where the trip stands is
 * read again in the user's time zone; "next" stays only for a trip still to
 * come.
 */
export function tripChatAnswer(input: AnswerInput): TrekCard | null {
  const value = (input.value ?? {}) as { trip?: Record<string, unknown>; question?: unknown };
  const trip = value.trip;
  if (!trip) return null;
  const startDate = typeof trip.startDate === 'string' ? trip.startDate : null;
  const endDate = typeof trip.endDate === 'string' ? trip.endDate : null;
  const phase = phaseOf(startDate, endDate, input.today);
  const parsed = tripChatCardSchema.safeParse({
    kind: 'tripChat',
    trip: {
      id: trip.id,
      title: trip.title,
      startDate,
      endDate,
      phase: phase === 'upcoming' && trip.phase === 'next' ? 'next' : phase,
      placeCount: trip.placeCount ?? null,
    },
    question: typeof value.question === 'string' && value.question ? value.question : null,
  });
  return parsed.success ? parsed.data : null;
}

export const HOME_CARDS: DomainCards = {
  id: 'home',
  tools: { [OPEN_TRIP_CHAT_TOOL]: { answer: tripChatAnswer } },
};
