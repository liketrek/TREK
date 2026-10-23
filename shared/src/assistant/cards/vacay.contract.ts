import { vacayCardSchema } from './vacay.card';

export * from './vacay.card';

/**
 * What the vacation planner brings to the assistant chat: the kinds of card it draws,
 * the verbs of its change cards and what an applied change of its
 * touches, beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else.
 */
export const VACAY_CARD_SCHEMAS = [vacayCardSchema] as const;
/** A day off taken, given back or changed, a company holiday set, the allowance changed. */
export const VACAY_VERB_KEYS = [
  'addVacationDay',
  'removeVacationDay',
  'changeVacationDay',
  'setCompanyHoliday',
  'setVacationAllowance',
] as const;
/** A day or the allowance of the vacation plan: the receipt opens the vacation planner. */
export const VACAY_APPLIED_ENTITIES = ['vacay'] as const;
