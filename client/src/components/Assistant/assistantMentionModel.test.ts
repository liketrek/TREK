/**
 * FE-AI-MENTION-MODEL-001 to FE-AI-MENTION-MODEL-008
 *
 * What `@` offers and writes, without React: the entries per kind, the search
 * across them, the mention behind a pick, and the text that carries it.
 */
import type { TriggerItem } from '@assistant-ui/react';
import { describe, expect, it } from 'vitest';

import { buildDay, buildPlace, buildReservation } from '../../../tests/helpers/factories';
import {
  mentionGroups,
  mentionLabel,
  mentionOf,
  searchMentions,
  splitMentions,
  withMention,
} from './assistantMentionModel';

function t(key: string, params?: Record<string, string | number>): string {
  return key === 'dayplan.dayN' ? `Day ${params?.n}` : key;
}

const SOURCES = {
  days: [buildDay({ id: 1, title: 'Arrival', date: '2026-11-02' }), buildDay({ id: 2, title: null, date: null })],
  places: [
    buildPlace({ id: 10, name: 'Louvre' }),
    buildPlace({ id: 11, name: 'Musée du Louvre shop' }),
    buildPlace({ id: 12, name: 'Bouillon Pigalle' }),
    buildPlace({ id: 13, name: '   ' }),
  ],
  reservations: [buildReservation({ id: 20, title: 'Louvre tickets', day_id: 1 })],
};

describe('assistantMentionModel', () => {
  it('FE-AI-MENTION-MODEL-001: lists days by their day-list name, places by name, bookings with their day', () => {
    const groups = mentionGroups(SOURCES, t, 'en');
    expect(groups.day.map((i) => i.label)).toEqual(['Arrival', 'Day 2']);
    // A titled day adds its date; an untitled one says nothing more.
    expect(groups.day[0].description).toBeTruthy();
    expect(groups.day[1].description).toBeUndefined();
    // A place without a name has nothing to write into the text and is left out.
    expect(groups.place.map((i) => i.id)).toEqual(['place:10', 'place:11', 'place:12']);
    expect(groups.reservation[0]).toMatchObject({
      label: 'Louvre tickets',
      description: 'Arrival',
      type: 'reservation',
    });
  });

  it('FE-AI-MENTION-MODEL-002: search ranks a label that starts with the query before a word inside one', () => {
    const groups = mentionGroups(SOURCES, t, 'en');
    expect(searchMentions(groups, 'louv').map((i) => i.label)).toEqual([
      'Louvre',
      'Louvre tickets',
      'Musée du Louvre shop',
    ]);
    expect(searchMentions(groups, 'llon').map((i) => i.label)).toEqual(['Bouillon Pigalle']);
    expect(searchMentions(groups, 'zzz')).toEqual([]);
  });

  it('FE-AI-MENTION-MODEL-003: search shows at most eight hits', () => {
    const places = Array.from({ length: 12 }, (_, i) => buildPlace({ id: 100 + i, name: `Café ${i}` }));
    expect(searchMentions(mentionGroups({ ...SOURCES, places }, t, 'en'), 'caf')).toHaveLength(8);
  });

  it('FE-AI-MENTION-MODEL-004: a pick reads back as its mention, anything else as nothing', () => {
    const [louvre] = mentionGroups(SOURCES, t, 'en').place;
    expect(mentionOf(louvre)).toEqual({ kind: 'place', id: 10, label: 'Louvre' });
    const foreign: TriggerItem = { id: 'x', type: 'command', label: 'Run' };
    expect(mentionOf(foreign)).toBeNull();
    expect(mentionOf({ ...louvre, metadata: { id: 'ten' } })).toBeNull();
  });

  it('FE-AI-MENTION-MODEL-005: labels are one trimmed line the server keeps whole', () => {
    expect(mentionLabel('  Le  Train\nBleu ')).toBe('Le Train Bleu');
    expect(mentionLabel('x'.repeat(200))).toHaveLength(120);
  });

  it('FE-AI-MENTION-MODEL-006: writing @label keeps the rest of the text, once', () => {
    expect(withMention('', 'Louvre')).toBe('@Louvre ');
    expect(withMention('Lunch near', 'Louvre')).toBe('Lunch near @Louvre ');
    expect(withMention('Lunch near ', 'Louvre')).toBe('Lunch near @Louvre ');
    expect(withMention('Near @Louvre ', 'Louvre')).toBe('Near @Louvre ');
    // A longer label that starts the same is another mention.
    expect(withMention('@Romeo ', 'Rome')).toBe('@Romeo @Rome ');
  });

  it('FE-AI-MENTION-MODEL-008: a sent question splits into text and its mentions, the longest label first', () => {
    expect(splitMentions('Is @Louvre tickets still valid at @Louvre?', ['Louvre', 'Louvre tickets'])).toEqual([
      { text: 'Is ', at: 0, mention: false },
      { text: '@Louvre tickets', at: 3, mention: true },
      { text: ' still valid at ', at: 18, mention: false },
      { text: '@Louvre', at: 34, mention: true },
      { text: '?', at: 41, mention: false },
    ]);
    expect(splitMentions('mail me @ home @Lou', ['Louvre'])).toEqual([
      { text: 'mail me @ home @Lou', at: 0, mention: false },
    ]);
  });
});
