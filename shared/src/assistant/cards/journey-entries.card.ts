import { idSchema } from '../../common/primitives.schema';
import { journeyEntryTypeSchema } from '../../journey/journey.schema';
import { cardClockSchema, cardCountSchema, cardDateSchema, cardLatSchema, cardLngSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * Entries of one travel journal as the assistant chat shows them: what a
 * read of the journal found (one entry or several), what a held change will
 * write, and what it wrote once applied. One kind for all three, so the
 * answer, the change row and the receipt read one shape.
 */

/** How much of a journal a card carries; the server clips to the same numbers. */
export const JOURNEY_CARD_LIMITS = {
  entries: 8,
  title: 100,
  place: 80,
  story: 240,
  journal: 80,
  weather: 40,
  tags: 6,
  tag: 40,
  points: 3,
  point: 80,
} as const;

/** The verdict on a place as a card shows it: the first points on each side, and how many each side holds. */
export const journeyEntryVerdictSchema = z.object({
  pros: z.array(cardText(JOURNEY_CARD_LIMITS.point)).max(JOURNEY_CARD_LIMITS.points),
  cons: z.array(cardText(JOURNEY_CARD_LIMITS.point)).max(JOURNEY_CARD_LIMITS.points),
  prosCount: cardCountSchema,
  consCount: cardCountSchema,
});
export type JourneyEntryVerdict = z.infer<typeof journeyEntryVerdictSchema>;

/**
 * One entry as a card shows it. Its texts are plain and on one line (the story
 * without its markdown, cut to its start), masked like a provider answer when
 * they come from a result; a photo travels as its id, never as a path.
 */
export const journeyEntryLookSchema = z.object({
  /** Null for an entry a held change has not written yet. */
  entryId: idSchema.nullable(),
  type: journeyEntryTypeSchema,
  title: cardText(JOURNEY_CARD_LIMITS.title).nullable(),
  date: cardDateSchema,
  time: cardClockSchema.nullable(),
  /** The place as the entry names it; the client shortens it as the journal does. */
  place: cardText(JOURNEY_CARD_LIMITS.place).nullable(),
  point: z.object({ lat: cardLatSchema, lng: cardLngSchema }).nullable(),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
  story: cardText(JOURNEY_CARD_LIMITS.story).nullable(),
  /** A mood id; the client draws the ones it knows and leaves the rest out. */
  mood: z
    .string()
    .regex(/^[a-z]{1,20}$/)
    .nullable(),
  /** A weather id the journal knows, or the words the traveller wrote. */
  weather: cardText(JOURNEY_CARD_LIMITS.weather).nullable(),
  /** The TREK photo the entry opens with (its thumbnail), the first one that has a picture. */
  photoId: idSchema.nullable(),
  /** That photo is the poster of a clip. */
  video: z.boolean(),
  photoCount: cardCountSchema,
  draft: z.boolean(),
  /** Made from a place of a trip: deleting it turns it back into a suggestion. */
  fromTripPlace: z.boolean(),
  /** Which day of the journal it falls on, counted from 0, for the day's colour; null when unknown. */
  dayIndex: z.number().int().min(0).max(9_999).nullable(),
  /** Its first tags. Optional, like the two below: cards stored before they existed leave them out. */
  tags: z.array(cardText(JOURNEY_CARD_LIMITS.tag)).max(JOURNEY_CARD_LIMITS.tags).optional(),
  verdict: journeyEntryVerdictSchema.nullable().optional(),
  /** In a new order of the journal's entries, this one changed its place. */
  moved: z.boolean().optional(),
});
export type JourneyEntryLook = z.infer<typeof journeyEntryLookSchema>;

/** What a change card's entries go through: nothing on an answer, else what the change does to them. */
export const JOURNEY_CARD_CHANGES = ['none', 'new', 'changed', 'willDelete', 'reordered'] as const;

export const journeyEntriesCardSchema = z.object({
  kind: z.literal('journeyEntries'),
  journeyId: idSchema,
  journalTitle: cardText(JOURNEY_CARD_LIMITS.journal).nullable(),
  /** The journal is the one the open trip shows in its Journal tab, as read when the card was made. */
  tripJournal: z.boolean(),
  change: z.enum(JOURNEY_CARD_CHANGES),
  entries: z.array(journeyEntryLookSchema).min(1).max(JOURNEY_CARD_LIMITS.entries),
  /** Entries the read found that the card does not carry. */
  more: cardCountSchema,
});
export type JourneyEntriesCard = z.infer<typeof journeyEntriesCardSchema>;
