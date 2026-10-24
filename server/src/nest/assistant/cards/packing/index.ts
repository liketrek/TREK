import type { DomainCards } from '../card-types';
import { PACKING_TOOLS } from './packing-tools';
import { TODO_TOOLS } from './todo-cards';

/**
 * The packing lists and to-dos in the assistant chat: the lists a read shows
 * as cards, the card every change to an item, a bag, a category's people or a
 * to-do shows inside its change card, and the receipts that say which part of
 * the list a change touched.
 */
export const PACKING_CARDS: DomainCards = {
  id: 'packing',
  tools: { ...PACKING_TOOLS, ...TODO_TOOLS },
  prompt: [
    'Packing lists, bags and to-dos you read show as cards under your answer: do not list their items again.',
    'To add several packing items, make one bulk_import_packing call instead of many create_packing_item calls.',
  ],
};
