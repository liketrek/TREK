import { costPerPersonCardSchema } from './cost-per-person.card';
import { expensesCardSchema } from './expenses.card';
import { paymentsCardSchema } from './payments.card';
import { settlementCardSchema } from './settlement.card';

export * from './cost-per-person.card';
export * from './expenses.card';
export * from './payments.card';
export * from './settlement.card';

/**
 * What the budget brings to the assistant chat: the kinds of card it draws,
 * the verbs of its change cards and what an applied change of its
 * touches, beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else.
 */
export const BUDGET_CARD_SCHEMAS = [
  expensesCardSchema,
  paymentsCardSchema,
  settlementCardSchema,
  costPerPersonCardSchema,
] as const;
/** A settle-up payment recorded or changed; removing one is a plain removal. */
export const BUDGET_VERB_KEYS = ['addPayment', 'updatePayment'] as const;
/** A settle-up payment: the receipt opens the Costs tab, where the payments are listed. */
export const BUDGET_APPLIED_ENTITIES = ['settlement'] as const;
