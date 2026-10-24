import { idSchema } from '../../common/primitives.schema';
import { cardHexColorSchema, cardPersonSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * A packing list in the assistant chat: the trip's, the part a tour points
 * at, or a template about to be added. It is grouped the way the packing
 * list shows it, by category or by bag; a bag overview is the same card with
 * the bags as groups and no item rows. On a change card the rows carry what
 * the change does to them (`change`, and the old value of every field it
 * touches), on an answer `change` is `none`.
 */

const gramsSchema = z.number().int().min(0).max(1_000_000);
const checklistCountSchema = z.number().int().min(0).max(5_000);

/**
 * The index of a category in the order its list first shows it; the client
 * maps it onto the list's own colours, so the chat's dot matches the panel's.
 * Null where the card does not know the category yet (the hash colour then).
 */
export const checklistColorSlotSchema = z.number().int().min(0).max(999);

/** The value a field held before a change, as stored (an ISO date, a colour, grams, a name). */
export const checklistBeforeSchema = z.string().max(120).nullable();

export const PACKING_ROW_CHANGES = ['none', 'add', 'update', 'check', 'uncheck', 'remove', 'share'] as const;
export const PACKING_ITEM_FIELDS = ['name', 'category', 'quantity', 'packed', 'weight', 'bag', 'tier'] as const;
export const PACKING_BAG_FIELDS = ['name', 'color', 'limit', 'owner'] as const;
export const PACKING_TIERS = ['common', 'personal', 'shared'] as const;

/** A bag on the list (`id:12`) or one a pending import creates (`new:0`). */
export const packingBagKeySchema = z.string().regex(/^(id:\d{1,12}|new:\d{1,2})$/);

export const packingCardBagSchema = z.object({
  key: packingBagKeySchema,
  id: idSchema.nullable(),
  name: cardText(100),
  /** Null while a create waits for the server to pick it. */
  color: cardHexColorSchema.nullable(),
  /** What the bag weighs with every member's items in it (#2191). */
  weightGrams: gramsSchema.nullable(),
  limitGrams: gramsSchema.nullable(),
  owner: cardPersonSchema.nullable(),
  members: z.array(cardPersonSchema).max(6),
  membersRemoved: z.array(cardPersonSchema).max(6),
  change: z.enum(['none', 'add', 'update', 'remove', 'members']),
  changed: z.array(z.object({ field: z.enum(PACKING_BAG_FIELDS), before: checklistBeforeSchema })).max(4),
  /** For a bag about to be deleted: the items that land in "Unassigned". */
  movesOut: checklistCountSchema,
});
export type PackingCardBag = z.infer<typeof packingCardBagSchema>;

export const packingCardItemSchema = z.object({
  /** Null while a create waits. */
  id: idSchema.nullable(),
  name: cardText(200),
  quantity: z.number().int().min(1).max(999),
  /** All of it once ticked, the partial count before that (#2296). */
  packed: z.number().int().min(0).max(999),
  checked: z.boolean(),
  /** Unit weight times quantity; null where none is recorded. */
  weightGrams: gramsSchema.nullable(),
  /** One of the card's `bags`; null for an item in no bag. */
  bagKey: packingBagKeySchema.nullable(),
  tier: z.enum(PACKING_TIERS),
  sharedWith: z.array(cardPersonSchema).max(4),
  change: z.enum(PACKING_ROW_CHANGES),
  changed: z.array(z.object({ field: z.enum(PACKING_ITEM_FIELDS), before: checklistBeforeSchema })).max(7),
});
export type PackingCardItem = z.infer<typeof packingCardItemSchema>;

export const packingCardGroupSchema = z.object({
  key: z.discriminatedUnion('by', [
    z.object({
      by: z.literal('category'),
      /** Null: the items without a category, which the list files under its default one. */
      name: cardText(100).nullable(),
      slot: checklistColorSlotSchema.nullable(),
    }),
    /** Null: the pile in no bag. */
    z.object({ by: z.literal('bag'), bagKey: packingBagKeySchema.nullable() }),
  ]),
  /** Who looks after the category. */
  assignees: z.array(cardPersonSchema).max(6),
  /** Who a change of the category's people takes off it. */
  assigneesRemoved: z.array(cardPersonSchema).max(6),
  items: z.array(packingCardItemSchema).max(40),
  /** The group's items on the list, shown or not. */
  count: checklistCountSchema,
  packed: checklistCountSchema,
});
export type PackingCardGroup = z.infer<typeof packingCardGroupSchema>;

export const packingListCardSchema = z.object({
  kind: z.literal('packingList'),
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('trip') }),
    z.object({
      type: z.literal('tour'),
      placeId: idSchema,
      name: cardText(200),
      category: cardText(200).nullable(),
    }),
    z.object({
      type: z.literal('template'),
      templateId: idSchema,
      name: cardText(100),
      itemCount: checklistCountSchema,
    }),
  ]),
  groupBy: z.enum(['category', 'bag']),
  /** How much of the list is packed; answers only. */
  progress: z.object({ packed: checklistCountSchema, total: checklistCountSchema }).nullable(),
  bags: z.array(packingCardBagSchema).max(20),
  groups: z.array(packingCardGroupSchema).max(12),
  /** Groups past the twelve shown. */
  moreGroups: checklistCountSchema,
});
export type PackingListCard = z.infer<typeof packingListCardSchema>;
