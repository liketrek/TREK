import { idSchema } from '../../common/primitives.schema';
import { cardCurrencySchema, cardDateSchema, cardPersonSchema, cardText } from './card-parts';
import { expenseChangeSchema } from './expenses.card';

import { z } from 'zod';

/**
 * Settle-up payments between the travellers, as the Costs page lists them
 * under its payment history: who paid whom, how much, on which day, with the
 * note it carries. One card serves the list (`list_settlements`) and every
 * change to one payment; a waiting change names what it replaces in `before`.
 */

/** Payments one card lists; the rest are counted in `more`. */
export const PAYMENT_ROWS_MAX = 12;

/** What one payment moved: always more than nothing. */
export const cardPaymentMoneySchema = z.object({
  amount: z.number().positive().max(1e9),
  currency: cardCurrencySchema,
});

/** The values a waiting update of a payment replaces, each null where it stays. */
export const cardPaymentBeforeSchema = z.object({
  from: cardPersonSchema.nullable(),
  to: cardPersonSchema.nullable(),
  amount: cardPaymentMoneySchema.nullable(),
});

export const cardPaymentSchema = z.object({
  /** Null while a new payment waits for its decision. */
  id: idSchema.nullable(),
  from: cardPersonSchema,
  to: cardPersonSchema,
  amount: cardPaymentMoneySchema,
  /** The day it was paid, else the day it was recorded. */
  date: cardDateSchema.nullable(),
  note: cardText(120).nullable(),
  before: cardPaymentBeforeSchema.nullable(),
  change: expenseChangeSchema,
});

export const paymentsCardSchema = z.object({
  kind: z.literal('payments'),
  rows: z.array(cardPaymentSchema).min(1).max(PAYMENT_ROWS_MAX),
  more: z.number().int().min(0).max(100_000),
});

export type PaymentsCard = z.infer<typeof paymentsCardSchema>;
export type CardPayment = z.infer<typeof cardPaymentSchema>;
export type CardPaymentMoney = z.infer<typeof cardPaymentMoneySchema>;
