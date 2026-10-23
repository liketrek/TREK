import {
  ASSISTANT_CHANGE_VERB_KEYS,
  assistantAppliedSchema,
  assistantChangePreviewSchema,
  assistantMessagePartSchema,
  uiStreamChunkSchema,
} from '../assistant.schema';
import { storedTrekCardSchema, trekCardSchema } from './index';
import { JOURNEY_CARD_LIMITS, journeyEntriesCardSchema, type JourneyEntryLook } from './journey-entries.card';

import { describe, expect, it } from 'vitest';

// JRNCARD-001 to JRNCARD-006

function look(over: Partial<JourneyEntryLook> = {}): JourneyEntryLook {
  return {
    entryId: 12,
    type: 'entry',
    title: 'Sunset at the Spree',
    date: '2026-10-21',
    time: '14:30',
    place: 'Berlin',
    point: { lat: 52.52, lng: 13.405 },
    countryCode: 'DE',
    story: 'The light over the river was unreal.',
    mood: 'amazing',
    weather: 'sunny',
    photoId: 7,
    video: false,
    photoCount: 4,
    visibility: 'public',
    draft: false,
    fromTripPlace: false,
    dayIndex: 0,
    ...over,
  };
}

function card(entries: JourneyEntryLook[], over: Record<string, unknown> = {}) {
  return {
    kind: 'journeyEntries',
    journeyId: 3,
    journalTitle: 'Berlin 2026',
    tripJournal: true,
    change: 'none',
    entries,
    more: 0,
    ...over,
  };
}

describe('the journal entries card', () => {
  it('JRNCARD-001: reads a full card through the union, as itself', () => {
    const parsed = trekCardSchema.parse(card([look(), look({ entryId: 13, photoId: null, dayIndex: 1 })]));
    expect(parsed.kind).toBe('journeyEntries');
    expect(journeyEntriesCardSchema.parse(parsed).entries).toHaveLength(2);
  });

  it('JRNCARD-002: holds one to eight entries, a pending entry without an id among them', () => {
    expect(journeyEntriesCardSchema.safeParse(card([])).success).toBe(false);
    const eight = Array.from({ length: JOURNEY_CARD_LIMITS.entries }, (_, i) => look({ entryId: i + 1 }));
    expect(journeyEntriesCardSchema.safeParse(card(eight)).success).toBe(true);
    expect(journeyEntriesCardSchema.safeParse(card([...eight, look({ entryId: 99 })])).success).toBe(false);
    expect(journeyEntriesCardSchema.safeParse(card([look({ entryId: null })], { change: 'new' })).success).toBe(true);
  });

  it('JRNCARD-003: a story past its bound, a bad date, time or country reads as no card at all', () => {
    const bad = [
      look({ story: 'x'.repeat(JOURNEY_CARD_LIMITS.story + 1) }),
      look({ date: '21.10.2026' }),
      look({ time: '9:05' }),
      look({ countryCode: 'de' }),
      look({ mood: 'Very Happy' }),
      look({ point: { lat: 91, lng: 0 } }),
      look({ title: '' }),
    ];
    for (const entry of bad) {
      expect(journeyEntriesCardSchema.safeParse(card([entry])).success).toBe(false);
      expect(storedTrekCardSchema.parse(card([entry]))).toBeNull();
    }
  });

  it('JRNCARD-004: carries no address of a picture, only the photo id', () => {
    const parsed = journeyEntriesCardSchema.parse(
      card([{ ...look(), thumbnail_path: '/uploads/x.jpg', file_path: 'secret' } as JourneyEntryLook]),
    );
    const text = JSON.stringify(parsed);
    expect(text).not.toContain('thumbnail_path');
    expect(text).not.toContain('/uploads/');
    expect(parsed.entries[0]?.photoId).toBe(7);
  });

  it('JRNCARD-005: rides a data-trek-card part and chunk, and a change preview', () => {
    const data = { toolCallId: 'call_1', card: card([look()]) };
    const part = assistantMessagePartSchema.parse({ type: 'data-trek-card', data });
    expect(part.type === 'data-trek-card' && part.data.card?.kind).toBe('journeyEntries');
    const chunk = uiStreamChunkSchema.parse({ type: 'data-trek-card', data });
    expect(chunk.type === 'data-trek-card' && chunk.data.card?.kind).toBe('journeyEntries');
    const preview = assistantChangePreviewSchema.parse({
      toolCallId: 'call_1',
      verbKey: 'addJournalEntry',
      subject: 'Sunset at the Spree',
      rows: [],
      dayId: null,
      placeIds: [],
      undoable: true,
      card: card([look({ entryId: null })], { change: 'new' }),
    });
    expect(preview.verbKey).toBe('addJournalEntry');
    expect(preview.card?.kind).toBe('journeyEntries');
  });

  it('JRNCARD-006: names its verbs and its entity in the shared enums', () => {
    expect(ASSISTANT_CHANGE_VERB_KEYS).toEqual(
      expect.arrayContaining(['addJournalEntry', 'updateJournalEntry', 'removeJournalEntry']),
    );
    const applied = assistantAppliedSchema.parse({
      toolCallId: 'call_1',
      entity: 'journey_entry',
      ids: [12],
      dayId: null,
      undoUntil: null,
    });
    expect(applied.entity).toBe('journey_entry');
  });
});
