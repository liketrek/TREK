/**
 * The roles the words of a lockup play (book-lockups.ts). On their own so the
 * operation schema that names them (book-text-ops.schema.ts) imports a list,
 * not the engine that sets a lockup, which reaches the findings and through
 * them the operation schemas again.
 */
export const BOOK_LOCKUP_ROLES = [
  'title',
  'subtitle',
  'kicker',
  'overlay',
  'year',
  'place',
  'dates',
  'quote',
  'caption',
  'number',
  'label',
  'coords',
] as const;
export type BookLockupRole = (typeof BOOK_LOCKUP_ROLES)[number];
