import { storedTrekCardSchema, trekCardSchema } from './index';
import { tripChatCardSchema } from './trip-chat.card';

import { describe, expect, it } from 'vitest';

const card = {
  kind: 'tripChat',
  trip: { id: 5, title: 'Tokyo 2026', startDate: '2026-11-02', endDate: '2026-11-12', phase: 'next', placeCount: 34 },
  question: 'What is still missing on day 3?',
} as const;

describe('tripChatCardSchema', () => {
  it('TRIPCHAT-001: is part of the card union and reads as itself', () => {
    expect(trekCardSchema.parse(card)).toEqual(card);
    expect(storedTrekCardSchema.parse(card)).toEqual(card);
  });

  it('TRIPCHAT-002: takes a trip without dates, places or a question', () => {
    const bare = {
      kind: 'tripChat',
      trip: { id: 9, title: 'Someday', startDate: null, endDate: null, phase: 'undated', placeCount: null },
      question: null,
    };
    expect(tripChatCardSchema.parse(bare)).toEqual(bare);
  });

  it('TRIPCHAT-003: refuses an unknown phase, a bad date, an empty title or an overlong question', () => {
    expect(tripChatCardSchema.safeParse({ ...card, trip: { ...card.trip, phase: 'soon' } }).success).toBe(false);
    expect(tripChatCardSchema.safeParse({ ...card, trip: { ...card.trip, startDate: '2.11.2026' } }).success).toBe(
      false,
    );
    expect(tripChatCardSchema.safeParse({ ...card, trip: { ...card.trip, title: '' } }).success).toBe(false);
    expect(tripChatCardSchema.safeParse({ ...card, question: 'x'.repeat(501) }).success).toBe(false);
  });

  it('TRIPCHAT-004: a stored card with a broken trip is left out, not the message around it', () => {
    expect(storedTrekCardSchema.parse({ ...card, trip: { id: 0 } })).toBeNull();
  });
});
