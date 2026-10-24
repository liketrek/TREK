import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import type { AnswerInput, PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';

/**
 * A trip for the packing and to-do card tests. Maya (1) is the user; Ana (2)
 * and Ben (3) travel with her, Ben with a picture on another host. The list:
 * Clothes and an empty category on the common list, Toiletries, Clothes and
 * Personal on Maya's own, two bags; the to-dos: Bookings, Documents and one
 * on no list, one of them overdue on 2026-06-11.
 */

export const TODAY = '2026-06-11';

export const PACKING_ITEMS = [
  { id: 11, name: 'Rain jacket', category: 'Clothes', quantity: 1, checked: 1, weight_grams: 480, bag_id: 5 },
  {
    id: 12,
    name: 'Hiking socks',
    category: 'Clothes',
    quantity: 3,
    checked: 0,
    packed_quantity: 1,
    weight_grams: 70,
    bag_id: 6,
  },
  { id: 13, name: '...', category: 'Empty', quantity: 1, checked: 0 },
  {
    id: 14,
    name: 'Sunscreen',
    category: 'Toiletries',
    quantity: 1,
    checked: 0,
    is_private: 1,
    owner_id: 1,
    recipients: [{ user_id: 2, username: 'Ana' }],
  },
  { id: 15, name: 'Sun hat', category: 'Clothes', quantity: 1, checked: 0, is_private: 1, owner_id: 1, recipients: [] },
  { id: 16, name: 'Diary', category: 'Personal', quantity: 1, checked: 0, is_private: 1, owner_id: 1 },
];

export const BAGS = [
  {
    id: 5,
    name: 'Carry-on',
    color: '#6366f1',
    total_weight_grams: 6200,
    weight_limit_grams: 8000,
    user_id: 1,
    members: [{ user_id: 1 }, { user_id: 2 }],
  },
  { id: 6, name: 'Daypack', color: '#ec4899', total_weight_grams: 900, weight_limit_grams: null, members: [] },
];

export const TODOS = [
  { id: 21, name: 'Book the ferry', category: 'Bookings', due_date: '2026-06-12', priority: 1, assigned_user_id: 2 },
  { id: 22, name: 'Travel insurance', category: 'Documents', due_date: '2026-06-10', checked: 0, priority: 0 },
  {
    id: 23,
    name: 'Passport copies',
    category: null,
    checked: 1,
    description: '\n  Scan both pages\nand mail them to me@example.com',
  },
  { id: 24, name: 'Car seat', category: 'Bookings', checked: 0 },
];

const SUMMARY = {
  trip: { title: 'Lisbon', start_date: '2026-06-12', end_date: '2026-06-14' },
  members: {
    owner: { id: 1, username: 'Maya', avatar_url: '/uploads/avatars/maya.png' },
    collaborators: [
      { id: 2, username: 'Ana', avatar_url: null },
      { id: 3, username: 'Ben', avatar_url: 'https://pics.example.com/ben.png' },
    ],
  },
  days: [
    { id: 31, day_number: 1, date: '2026-06-12', assignments: [], notes: [] },
    { id: 32, day_number: 2, date: '2026-06-13', assignments: [], notes: [] },
  ],
};

const PLACES = { places: [{ id: 70, name: 'Ridge walk' }] };

export const card = buildTripCard(4, 1, { ...SUMMARY, packing: { items: PACKING_ITEMS }, todos: TODOS }, PLACES, null);

export const ctx: PreviewContext = { card, categories: new Map(), locale: 'en', today: TODAY, airport: () => null };

/** The same trip holding other packing items and to-dos, for a case the lists above do not show. */
export function ctxWith(items: unknown[], todos: unknown[] = []): PreviewContext {
  return { ...ctx, card: buildTripCard(4, 1, { ...SUMMARY, packing: { items }, todos }, PLACES, null) };
}

export function answerInput(args: Record<string, unknown>, value: unknown): AnswerInput {
  return { toolCallId: 'call_1', args, value, card, today: TODAY };
}

export const MAYA = { id: 1, name: 'Maya', avatarKey: 'maya.png' };
export const ANA = { id: 2, name: 'Ana', avatarKey: null };
export const BEN = { id: 3, name: 'Ben', avatarKey: null };
