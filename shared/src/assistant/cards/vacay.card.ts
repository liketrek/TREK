import { idSchema } from '../../common/primitives.schema';
import { cardDateSchema, cardHexColorSchema, cardPersonSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * Vacation days on a month calendar, with the days left. An answer card shows
 * what a read found (the days off of a year, the days left, the public
 * holidays); a change card shows the one day a held write would take or give
 * back, on its month, with the leave before it. The people are the vacation
 * plan's, which need not be the trip's: a fused plan holds partners too.
 */

const fractionSchema = z.union([z.literal(0.5), z.literal(1)]);
const yearSchema = z.number().int().min(2000).max(2100);
/** Days are counted in halves, so a count is a multiple of 0.5. */
const daysSchema = z.number().min(0).max(1000);

/** What a day off is: leave that counts, a comp day that does not, or a holiday the company gives everyone. */
export const VACAY_DAY_KINDS = ['vacation', 'comp', 'company'] as const;

/** What a held toggle would do to its day. */
export const VACAY_PROPOSAL_OUTCOMES = ['add', 'remove', 'convert', 'blocked'] as const;

/** What a held toggle should know about its day before it is applied. */
export const VACAY_PROPOSAL_NOTES = [
  'weekendBlocked',
  'weekend',
  'publicHoliday',
  'companyHoliday',
  'companyHalf',
  'notInPlan',
  'companyOff',
] as const;

/** Someone of the vacation plan: their own colour colours their days. */
export const vacayCardPersonSchema = cardPersonSchema.extend({ color: cardHexColorSchema.nullable() });

/** A logged day off of one person. */
export const vacayCardDaySchema = z.object({
  date: cardDateSchema,
  personId: idSchema,
  fraction: fractionSchema,
  kind: z.enum(['vacation', 'comp']),
});

/** A public holiday, in its calendar's colour when the plan has one. */
export const vacayCardHolidaySchema = z.object({
  date: cardDateSchema,
  name: cardText(80),
  color: cardHexColorSchema.nullable(),
});

/** The day a held write would change, and what that does to the days left. */
export const vacayCardProposalSchema = z.object({
  date: cardDateSchema,
  /** Null for a company holiday, which is the whole plan's. */
  personId: idSchema.nullable(),
  kind: z.enum(VACAY_DAY_KINDS),
  fraction: fractionSchema,
  outcome: z.enum(VACAY_PROPOSAL_OUTCOMES),
  /** What the day was before, when it was logged already. */
  before: z.object({ fraction: fractionSchema, kind: z.enum(VACAY_DAY_KINDS) }).nullable(),
  /** The leave year the day counts in, which runs from the person's own start day. */
  periodYear: yearSchema.nullable(),
  notes: z.array(z.enum(VACAY_PROPOSAL_NOTES)).max(VACAY_PROPOSAL_NOTES.length),
  /** The change to each person's used days in a leave year; a company holiday can give several people days back. */
  deltas: z.array(z.object({ personId: idSchema, year: yearSchema, days: z.number().min(-1).max(1) })).max(8),
});

/** One person's leave in one leave year, as it stands before the change. */
export const vacayCardBalanceSchema = z.object({
  personId: idSchema,
  year: yearSchema,
  /** The allowance with what was carried over. */
  total: daysSchema,
  /** What was carried over into the year, so the allowance alone is `total - carried`; absent on older cards. */
  carried: daysSchema.optional(),
  used: daysSchema,
  comp: daysSchema,
  /** The new total a change of the allowance would give; null for anything else. */
  totalAfter: daysSchema.nullable(),
  windowStart: cardDateSchema,
  windowEnd: cardDateSchema,
});

/**
 * The bounds keep the heaviest card (three busy months of a plan of eight)
 * under MAX_CARD_CHARS; the server keeps the days of the months it shows
 * first and drops the rest.
 */
export const VACAY_CARD_MAX_DAYS = 150;
export const VACAY_CARD_MAX_HOLIDAYS = 30;
/** Every date of the three months a card shows at most: the trip days and the company holidays. */
export const VACAY_CARD_MAX_DATES = 93;

export const vacayCardSchema = z.object({
  kind: z.literal('vacay'),
  /** The months the calendar shows, in order; none for a card of days left only. */
  months: z.array(z.object({ year: yearSchema, month: z.number().int().min(1).max(12) })).max(3),
  /** The first column: 0 for Sunday, 1 for Monday. */
  weekStart: z.union([z.literal(0), z.literal(1)]),
  /** The weekdays that count as weekend, 0 for Sunday. */
  weekendDays: z.array(z.number().int().min(0).max(6)).max(7),
  people: z.array(vacayCardPersonSchema).max(8),
  /** The logged days inside `months`. */
  days: z.array(vacayCardDaySchema).max(VACAY_CARD_MAX_DAYS),
  company: z.array(z.object({ date: cardDateSchema, fraction: fractionSchema })).max(VACAY_CARD_MAX_DATES),
  holidays: z.array(vacayCardHolidaySchema).max(VACAY_CARD_MAX_HOLIDAYS),
  /** The dated days of this trip inside `months`. */
  tripDates: z.array(cardDateSchema).max(VACAY_CARD_MAX_DATES),
  /** A change card's one day; null on an answer. */
  proposal: vacayCardProposalSchema.nullable(),
  balances: z.array(vacayCardBalanceSchema).max(8),
  /** The days off of the signed-in user in the year outside `months`. */
  otherDays: daysSchema,
  /** The leave year a read of the days off asked for, which Vacay opens on; absent elsewhere. */
  year: yearSchema.optional(),
});

export type VacayCard = z.infer<typeof vacayCardSchema>;
export type VacayCardPerson = z.infer<typeof vacayCardPersonSchema>;
export type VacayCardDay = z.infer<typeof vacayCardDaySchema>;
export type VacayCardHoliday = z.infer<typeof vacayCardHolidaySchema>;
export type VacayCardProposal = z.infer<typeof vacayCardProposalSchema>;
export type VacayCardBalance = z.infer<typeof vacayCardBalanceSchema>;
export type VacayProposalNote = (typeof VACAY_PROPOSAL_NOTES)[number];
export type VacayProposalOutcome = (typeof VACAY_PROPOSAL_OUTCOMES)[number];
export type VacayDayKind = (typeof VACAY_DAY_KINDS)[number];
