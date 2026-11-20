import {
  categoriesInUse,
  publicBudgetItem,
  publicCollabMessage,
  publicDay,
  publicDayNote,
  publicPackingItem,
} from '../../../src/nest/share/share-public.helpers';

import { describe, it, expect } from 'vitest';

describe('share public rows', () => {
  it('SHARE-PUB-001: a day keeps its number, date and title, never its notes', () => {
    const row = {
      id: 3,
      trip_id: 9,
      day_number: 2,
      date: '2026-09-01',
      title: 'Paris',
      notes: 'private',
      default_transport_mode: 'car',
    };
    expect(publicDay(row)).toEqual({ id: 3, day_number: 2, date: '2026-09-01', title: 'Paris' });
    expect(publicDay({ id: 4, day_number: 3 } as Parameters<typeof publicDay>[0])).toEqual({
      id: 4,
      day_number: 3,
      date: null,
      title: null,
    });
  });

  it('SHARE-PUB-002: a day note keeps what the page draws and sorts by', () => {
    const row = {
      id: 1,
      day_id: 3,
      trip_id: 9,
      text: 'Meet',
      time: '12:00',
      icon: 'pin',
      sort_order: 2,
      created_at: 'x',
      color: 'blue',
    };
    expect(publicDayNote(row)).toEqual({
      id: 1,
      day_id: 3,
      text: 'Meet',
      time: '12:00',
      icon: 'pin',
      color: 'blue',
      sort_order: 2,
    });
    expect(publicDayNote({ id: 2, day_id: 3, text: 'Bare' } as Parameters<typeof publicDayNote>[0])).toEqual({
      id: 2,
      day_id: 3,
      text: 'Bare',
      time: null,
      icon: null,
      color: null,
      sort_order: null,
    });
  });

  it('SHARE-PUB-003: packing, budget and chat rows lose the owner, the note, the ticket and the author id', () => {
    const packing = {
      id: 1,
      trip_id: 9,
      name: 'Socks',
      checked: 1,
      category: null,
      sort_order: 0,
      created_at: 'x',
      weight_grams: 50,
      bag_id: 4,
      quantity: 2,
      updated_at: 'x',
      is_private: 0,
      owner_id: 7,
      packed_quantity: 1,
    };
    expect(publicPackingItem(packing)).toEqual({
      id: 1,
      name: 'Socks',
      category: null,
      checked: 1,
      quantity: 2,
      sort_order: 0,
    });

    const budget = {
      id: 2,
      trip_id: 9,
      category: 'food',
      name: 'Dinner',
      total_price: 40,
      persons: 2,
      days: null,
      note: 'card 4242',
      sort_order: 0,
      created_at: 'x',
      paid_by_user_id: 7,
      expense_date: null,
      reservation_id: 5,
      currency: null,
      exchange_rate: 1,
      ticket_json: '{"seat":"1A"}',
      place_id: null,
    };
    expect(publicBudgetItem(budget)).toEqual({
      id: 2,
      name: 'Dinner',
      category: 'food',
      total_price: 40,
      currency: null,
      exchange_rate: 1,
    });

    const message = {
      id: 3,
      trip_id: 9,
      user_id: 7,
      text: 'Hi',
      reply_to: null,
      created_at: '2026-01-01 10:00:00',
      deleted: 0,
      origin: null,
      username: 'ada',
      avatar: null,
    };
    expect(publicCollabMessage(message)).toEqual({
      id: 3,
      text: 'Hi',
      created_at: '2026-01-01 10:00:00',
      username: 'ada',
      avatar: null,
    });
    expect(
      publicCollabMessage({ id: 4, text: 'x', username: 'b' } as Parameters<typeof publicCollabMessage>[0]),
    ).toEqual({
      id: 4,
      text: 'x',
      created_at: null,
      username: 'b',
      avatar: null,
    });
  });

  it('SHARE-PUB-004: categories come from the shared places and stops, once each, ordered by id', () => {
    const places = [
      { category_id: 5, category_name: 'Food', category_color: '#f00', category_icon: 'fork' },
      { category_id: 2, category_name: 'Museum', category_color: null, category_icon: null },
      { category_id: 5, category_name: 'Food', category_color: '#f00', category_icon: 'fork' },
      { category_id: null, category_name: null },
      // A dangling id, the category row gone: nothing to draw.
      { category_id: 8, category_name: null },
    ];
    const assignments = {
      1: [
        { place: { category: { id: 9, name: 'Hotel', color: '#0f0', icon: 'bed' } } },
        { place: { category: null } },
        {},
      ],
    };
    expect(categoriesInUse(places, assignments)).toEqual([
      { id: 2, name: 'Museum', color: null, icon: null },
      { id: 5, name: 'Food', color: '#f00', icon: 'fork' },
      { id: 9, name: 'Hotel', color: '#0f0', icon: 'bed' },
    ]);
    expect(categoriesInUse([], {})).toEqual([]);
  });
});
