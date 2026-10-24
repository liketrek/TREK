import { BOOK_GRIDS } from './book-grids';

import { z } from 'zod';

/**
 * The ids a book edit names, as the document has them (`sp-...`, `p-...`):
 * never invented by the model, bounded. Kept apart from book-ops.schema.ts so
 * the element operations' own schema module can use them without a cycle;
 * book-ops.schema.ts re-exports them.
 */
export const bookSpreadIdSchema = z.string().regex(/^[\w-]{1,40}$/);
export const bookElementIdSchema = z.string().regex(/^[\w-]{1,40}$/);

const gridIds = BOOK_GRIDS.map((g) => g.id) as [string, ...string[]];

/** The photo grids, by id. */
export const bookGridIdSchema = z
  .enum(gridIds)
  .describe(
    'A photo grid by id, named for its cells (two-across, grid-6, hero-three, cols-2-1, filmstrip); its frames come empty.',
  );
