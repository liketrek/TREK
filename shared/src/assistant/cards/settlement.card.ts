import { cardCurrencySchema, cardPersonSchema } from './card-parts';

import { z } from 'zod';

/**
 * Settle up as the Costs page shows it: the payments that would square the
 * trip (who pays whom), each traveller's balance (positive is owed money,
 * negative owes it), how many payments were already recorded, and the
 * entries no exchange rate converts yet, which count in no figure. Every
 * amount is in `currency`.
 */

/** Suggested payments one card names; the rest are counted in `moreFlows`. */
export const SETTLEMENT_FLOWS_MAX = 12;
/** Balances one card names; the rest are counted in `moreBalances`. */
export const SETTLEMENT_BALANCES_MAX = 20;

export const settlementCardSchema = z.object({
  kind: z.literal('settlement'),
  currency: cardCurrencySchema,
  flows: z
    .array(z.object({ from: cardPersonSchema, to: cardPersonSchema, amount: z.number().positive().max(1e9) }))
    .max(SETTLEMENT_FLOWS_MAX),
  moreFlows: z.number().int().min(0).max(1000),
  balances: z
    .array(z.object({ person: cardPersonSchema, balance: z.number().min(-1e9).max(1e9) }))
    .max(SETTLEMENT_BALANCES_MAX),
  moreBalances: z.number().int().min(0).max(1000),
  /** Payments already recorded. */
  recorded: z.number().int().min(0).max(100_000),
  unconverted: z.object({
    entries: z.number().int().min(0).max(100_000),
    currencies: z.array(cardCurrencySchema).max(6),
  }),
});
export type SettlementCard = z.infer<typeof settlementCardSchema>;
