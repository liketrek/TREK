import { idSchema } from '../../common/primitives.schema';
import { cardDateSchema, cardMoneySchema, cardPersonSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * Expenses of the trip as the Costs page shows them: the name, the amount in
 * the currency it was paid in (and in the trip currency when that differs and
 * a rate is known), the day, the place it belongs to, who paid how much and
 * who shares it. One card serves the expense list (`list_budget_items`) and
 * every change to a single expense: the row of a change carries what it
 * replaces (`before`), the people it is about (`highlight`) and what happens
 * to it (`change`). Amounts are numbers with a currency code; the client
 * writes them the way the Costs page does.
 */

/** Rows one expenses card lists; the rest are counted in `more`. */
export const EXPENSE_ROWS_MAX = 12;
/** Payers or shares one row names; the rest of a split are counted in `moreShares`. */
export const EXPENSE_PEOPLE_MAX = 20;

/** A signed amount: a refund is negative (#2176). */
const cardAmountSchema = z.number().min(-1e9).max(1e9);

/** How an expense is shared: evenly, in amounts of its own per person, or by nobody (planning only). */
export const expenseSplitSchema = z.enum(['equal', 'custom', 'none']);

/** What a change does to a row; an answer's rows are `none`. */
export const expenseChangeSchema = z.enum(['none', 'new', 'changed', 'willDelete']);

/** One person's part of an expense, and whether they have paid it. */
export const cardExpenseShareSchema = z.object({
  person: cardPersonSchema,
  amount: cardAmountSchema,
  paid: z.boolean(),
});

/** Someone who paid for the expense, and how much. */
export const cardExpensePayerSchema = z.object({ person: cardPersonSchema, amount: cardAmountSchema });

/**
 * The values a waiting update replaces, each null where the update leaves it
 * alone: a category or a date that was empty before reads as unchanged.
 */
export const cardExpenseBeforeSchema = z.object({
  name: cardText(120).nullable(),
  amount: cardMoneySchema.nullable(),
  category: z.string().max(60).nullable(),
  date: cardDateSchema.nullable(),
  split: expenseSplitSchema.nullable(),
});

export const cardExpenseSchema = z.object({
  /** Null while a new expense waits for its decision. */
  id: idSchema.nullable(),
  name: cardText(120),
  /** As stored; the client maps it to a Costs category, legacy free text included. */
  category: z.string().max(60).nullable(),
  /** The total in the currency it was entered in (the trip's when it names none). */
  amount: cardMoneySchema,
  /** The total in the trip currency, only when that differs and a rate converts it. */
  tripAmount: cardMoneySchema.nullable(),
  date: cardDateSchema.nullable(),
  place: z.object({ id: idSchema, name: cardText(120) }).nullable(),
  payers: z.array(cardExpensePayerSchema).max(EXPENSE_PEOPLE_MAX),
  split: expenseSplitSchema,
  shares: z.array(cardExpenseShareSchema).max(EXPENSE_PEOPLE_MAX),
  /** Shares of the split past the ones named. */
  moreShares: z.number().int().min(0).max(1000),
  /** A change row's note; list rows leave it out. */
  note: cardText(160).nullable(),
  /** How many receipts are attached; never the files themselves. */
  receipts: z.number().int().min(0).max(999),
  before: cardExpenseBeforeSchema.nullable(),
  /** The people the change is about: a paid tick set, someone joining the split. */
  highlight: z.array(idSchema).max(EXPENSE_PEOPLE_MAX),
  change: expenseChangeSchema,
});

export const expensesCardSchema = z.object({
  kind: z.literal('expenses'),
  rows: z.array(cardExpenseSchema).min(1).max(EXPENSE_ROWS_MAX),
  /**
   * Where in the trip's list the rows start: a later page of the list starts
   * past 0, so two pages read as one list only where they meet. 0 on a change.
   */
  offset: z.number().int().min(0).max(100_000),
  /** Expenses of the trip the card leaves out. */
  more: z.number().int().min(0).max(100_000),
  /** The list's total over every expense, in the trip currency; null on a change. */
  total: cardMoneySchema.nullable(),
  /** Expenses the total leaves out: foreign ones no rate converts yet. */
  unconverted: z.number().int().min(0).max(100_000),
});

export type ExpensesCard = z.infer<typeof expensesCardSchema>;
export type CardExpense = z.infer<typeof cardExpenseSchema>;
export type CardExpenseShare = z.infer<typeof cardExpenseShareSchema>;
export type CardExpensePayer = z.infer<typeof cardExpensePayerSchema>;
export type CardExpenseBefore = z.infer<typeof cardExpenseBeforeSchema>;
export type ExpenseSplit = z.infer<typeof expenseSplitSchema>;
export type ExpenseChange = z.infer<typeof expenseChangeSchema>;
