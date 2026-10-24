import { bookElementIdSchema } from './book-op-ids';
import { BOOK_LAYER_NAME_MAX } from './book.schema';

import { z } from 'zod';

/**
 * The layer operations of a book page: group, ungroup, name and hide. They
 * join the page operations of book-ops.schema.ts beside the element ones, run
 * in the one engine (book-ops-groups.ts) the Studio's layers panel and its
 * Ctrl+G use too.
 */

/** A group's id as the page has it (`g-...`), never invented. */
export const bookGroupIdSchema = z.string().regex(/^[\w-]{1,40}$/);

const layerName = z.string().max(BOOK_LAYER_NAME_MAX);

export const BOOK_GROUP_OP_SCHEMAS = [
  /**
   * Make two or more elements one group, picked, moved, aligned and arranged
   * as one. Elements already in a group leave it for the new one.
   */
  z.strictObject({
    op: z.literal('group'),
    elementIds: z.array(bookElementIdSchema).min(2).max(30),
    name: layerName
      .describe('What the group is called in the layers panel, such as "Title lockup". Optional.')
      .optional(),
  }),
  /** Put a group's members back on their own, where they are. */
  z.strictObject({ op: z.literal('ungroup'), groupId: bookGroupIdSchema }),
  /** Name an element or a group in the layers panel; an empty name clears it. */
  z
    .strictObject({
      op: z.literal('name'),
      elementId: bookElementIdSchema.optional(),
      groupId: bookGroupIdSchema.optional(),
      name: layerName,
    })
    .refine((v) => (v.elementId === undefined) !== (v.groupId === undefined), {
      message: 'name an elementId or a groupId, not both',
    }),
  /** Hide elements (kept on the page's layer list, left out of the page and its print) or show them again. */
  z.strictObject({
    op: z.literal('hide'),
    elementIds: z.array(bookElementIdSchema).min(1).max(30),
    hidden: z.boolean(),
  }),
] as const;
