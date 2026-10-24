/**
 * ASTCARD-JRN-001 to ASTCARD-JRN-015
 *
 * The travel journal's cards in the assistant chat: the entries a read shows
 * beside its answer, the entry a held write will write, change or delete,
 * the entry as it was stored once applied, the words of the change row, and
 * the way back from a created entry. Every card is checked against the
 * shared union through the registry's guard, as the turn checks it.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import type { CardReader, PreviewContext, UndoSnapshot } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import { JOURNEY_CARDS } from '../../../../../../src/nest/assistant/cards/journey';
import { loadJournal, type JournalLoaded } from '../../../../../../src/nest/assistant/cards/journey/journey-change';
import { lookOf } from '../../../../../../src/nest/assistant/cards/journey/journey-look';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  changeCardOf,
  undoReadsOf,
} from '../../../../../../src/nest/assistant/cards/registry';
import { appliedChange, describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import {
  journeyEntriesCardSchema,
  trekCardSchema,
  type AssistantChangePreview,
  type JourneyEntriesCard,
} from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

const trip = buildTripCard(1, 7, { trip: { title: 'Berlin' } }, null, null);
const ctx: PreviewContext = {
  card: trip,
  categories: new Map(),
  locale: 'en',
  today: '2026-10-22',
  airport: () => null,
};
const answerInput = (args: Record<string, unknown>, value: unknown) => ({
  toolCallId: 'call_read',
  args,
  value,
  card: trip,
  today: '2026-10-22',
});

function entry(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 12,
    journey_id: 3,
    type: 'entry',
    title: 'Sunset at the Spree',
    story: 'The light over the river was **unreal**.',
    entry_date: '2026-10-21',
    entry_time: '14:30',
    location_name: 'Berlin, Germany',
    location_lat: 52.52,
    location_lng: 13.405,
    country_code: 'de',
    mood: 'amazing',
    weather: 'sunny',
    visibility: 'public',
    sort_order: 0,
    is_draft: false,
    dismissed: false,
    source_place_id: null,
    updated_at: 1_000,
    photos: [],
    ...over,
  };
}

function cardOf(value: unknown): JourneyEntriesCard {
  return journeyEntriesCardSchema.parse(trekCardSchema.parse(value));
}

/** A reader over fixed answers, counting what it was asked. */
function readerOf(answers: Record<string, unknown>): { read: CardReader; asked: string[] } {
  const asked: string[] = [];
  const read: CardReader = (tool, args = {}) => {
    asked.push(readKey(tool, args));
    return Promise.resolve(answers[readKey(tool, args)] ?? answers[tool] ?? null);
  };
  return { read, asked };
}

const LINKED = { link: { journey_id: 3, title: 'Berlin 2026' } };

describe('the answer cards', () => {
  it('ASTCARD-JRN-001: a list reads in the journal order, without dismissed ones, each day with its colour index', () => {
    const value = {
      journey: { id: 3, title: 'Berlin 2026' },
      entries: [
        entry({ id: 3, entry_date: '2026-10-22', sort_order: 0, title: 'Third' }),
        entry({ id: 2, entry_date: '2026-10-21', sort_order: 1, title: 'Second' }),
        entry({ id: 1, entry_date: '2026-10-21', sort_order: 0, title: 'First' }),
        entry({ id: 4, entry_date: '2026-10-20', dismissed: true, title: 'Gone' }),
        entry({ id: 5, entry_date: '2026-10-19', type: 'skeleton', title: 'Suggestion' }),
      ],
    };
    const card = cardOf(answerCardOf('list_journey_entries', answerInput({ journeyId: 3 }, value)));
    expect(card.journalTitle).toBe('Berlin 2026');
    expect(card.change).toBe('none');
    expect(card.tripJournal).toBe(false);
    expect(card.entries.map((e) => e.title)).toEqual(['First', 'Second', 'Third']);
    expect(card.entries.map((e) => e.dayIndex)).toEqual([0, 0, 1]);
    expect(card.more).toBe(0);
  });

  it('ASTCARD-JRN-002: only suggestions show while nothing is written, and past eight the latest eight show', () => {
    const skeletons = [
      entry({ id: 1, type: 'skeleton' }),
      entry({ id: 2, type: 'skeleton', entry_date: '2026-10-22' }),
    ];
    const onlySuggestions = cardOf(
      answerCardOf('list_journey_entries', answerInput({ journeyId: 3 }, { journey: {}, entries: skeletons })),
    );
    expect(onlySuggestions.entries.map((e) => e.type)).toEqual(['skeleton', 'skeleton']);
    expect(onlySuggestions.journalTitle).toBeNull();

    const many = Array.from({ length: 11 }, (_, i) => entry({ id: i + 1, entry_date: `2026-10-${String(i + 10)}` }));
    const card = cardOf(answerCardOf('list_journey_entries', answerInput({ journeyId: 3 }, { entries: many })));
    expect(card.entries).toHaveLength(8);
    expect(card.entries[0]?.entryId).toBe(4);
    expect(card.entries[7]?.entryId).toBe(11);
    expect(card.entries[0]?.dayIndex).toBe(3);
    expect(card.more).toBe(3);
  });

  it('ASTCARD-JRN-003: no entry, no journal or a broken answer give no card', () => {
    expect(answerCardOf('list_journey_entries', answerInput({ journeyId: 3 }, { entries: [] }))).toBeNull();
    expect(answerCardOf('list_journey_entries', answerInput({}, { entries: [entry()] }))).toBeNull();
    expect(answerCardOf('list_journey_entries', answerInput({ journeyId: 3 }, 'Journey not found'))).toBeNull();
    expect(answerCardOf('list_journey_entries', answerInput({ journeyId: 3 }, { entries: [{ id: 1 }] }))).toBeNull();
  });

  it('ASTCARD-JRN-004: one entry read alone and a whole journal each draw their card', () => {
    const read = { entry: entry(), journey: { id: 3, title: 'B' } };
    const one = cardOf(answerCardOf('get_journey_entry', answerInput({ entryId: 12 }, read)));
    expect(one.journeyId).toBe(3);
    expect(one.entries).toHaveLength(1);
    expect(one.entries[0]?.dayIndex).toBeNull();

    const journey = { id: 3, title: 'Berlin 2026', entries: [entry(), entry({ id: 13, entry_date: '2026-10-22' })] };
    const whole = cardOf(answerCardOf('get_journey', answerInput({ journeyId: 3 }, { journey })));
    expect(whole.entries.map((e) => e.entryId)).toEqual([12, 13]);
    expect(whole.journalTitle).toBe('Berlin 2026');
  });

  it('ASTCARD-JRN-016: a Studio read, whose journey id the server pins and hides, takes the journey from the answer', () => {
    const value = { journey: { id: 3, title: 'Berlin 2026' }, entries: [entry()] };
    const card = cardOf(answerCardOf('list_journey_entries', answerInput({}, value)));
    expect(card.journeyId).toBe(3);
    expect(card.journalTitle).toBe('Berlin 2026');
    expect(card.entries.map((e) => e.entryId)).toEqual([12]);
  });
});

describe('an entry as a card shows it', () => {
  it('ASTCARD-JRN-005: the story loses its markdown and is cut to its start; an e-mail address is masked', () => {
    const look = lookOf(
      entry({ story: `# Day one\n\n**${'word '.repeat(80)}**`, title: 'Met anna@example.com at the pier' }),
    );
    expect(look?.story?.startsWith('Day one word word')).toBe(true);
    expect(look?.story).toHaveLength(240);
    expect(look?.story?.endsWith('…')).toBe(true);
    expect(look?.title).toBe('Met [hidden] at the pier');
  });

  it('ASTCARD-JRN-006: a time reads as HH:MM, coordinates come as a pair, and the rest is tidied', () => {
    expect(lookOf(entry({ entry_time: '9:05' }))?.time).toBe('09:05');
    expect(lookOf(entry({ entry_time: 'noon' }))?.time).toBeNull();
    expect(lookOf(entry({ location_lng: null }))?.point).toBeNull();
    expect(lookOf(entry())?.point).toEqual({ lat: 52.52, lng: 13.405 });
    const tidy = lookOf(entry({ country_code: 'xyz', mood: 'Very happy', visibility: 'friends', type: 'diary' }));
    expect(tidy).toMatchObject({ countryCode: null, mood: null, visibility: 'private', type: 'entry' });
    expect(lookOf(entry())?.countryCode).toBe('DE');
    expect(lookOf(entry({ entry_date: '21.10.2026' }))).toBeNull();
  });

  it('ASTCARD-JRN-007: the cover skips a clip without a poster and carries no address of a picture', () => {
    const photos = [
      { photo_id: 31, sort_order: 0, media_type: 'video', provider: 'local', thumbnail_path: null, file_path: 'a.mp4' },
      { photo_id: 32, sort_order: 1, media_type: 'video', provider: 'immich', thumbnail_path: null },
      { photo_id: 33, sort_order: 2, media_type: 'image', provider: 'local', thumbnail_path: '/uploads/t.jpg' },
    ];
    const look = lookOf(entry({ photos }));
    expect(look).toMatchObject({ photoId: 32, video: true, photoCount: 3 });
    const text = JSON.stringify(
      answerCardOf('list_journey_entries', answerInput({ journeyId: 3 }, { entries: [entry({ photos })] })),
    );
    for (const leak of ['http', '/api/', '/uploads/', 'file_path', 'thumbnail_path']) expect(text).not.toContain(leak);
  });

  it('ASTCARD-JRN-008: a suggestion made from a trip place goes back to one when deleted, a draft says so', () => {
    expect(lookOf(entry({ source_place_id: 9 }))?.fromTripPlace).toBe(true);
    expect(lookOf(entry({ source_place_id: 9, type: 'skeleton' }))?.fromTripPlace).toBe(false);
    expect(lookOf(entry({ is_draft: 1 }))?.draft).toBe(true);
  });
});

describe('the change cards', () => {
  it('ASTCARD-JRN-009: a new entry is drawn from its arguments, in the trip journal or a journal of the list', async () => {
    const args = {
      journeyId: 3,
      entry_date: '2026-10-22',
      title: 'Write to me at bo@example.com',
      story: '_Calm_ day',
    };
    const linked = readerOf({ get_trip_journal: LINKED });
    const loaded = await loadJournal('create_journey_entry', args, linked.read);
    expect(loaded).toEqual({ entry: null, journeyId: 3, title: 'Berlin 2026', tripJournal: true });
    expect(linked.asked).toEqual([readKey('get_trip_journal')]);
    const card = cardOf(changeCardOf('create_journey_entry', ctx, args, loaded));
    expect(card).toMatchObject({ change: 'new', journalTitle: 'Berlin 2026', tripJournal: true, more: 0 });
    expect(card.entries[0]).toMatchObject({
      entryId: null,
      visibility: 'private',
      photoId: null,
      photoCount: 0,
      title: 'Write to me at bo@example.com',
      story: 'Calm day',
      dayIndex: null,
    });

    const other = readerOf({
      get_trip_journal: { link: null },
      list_journeys: { journeys: [{ id: 3, title: 'Japan' }] },
    });
    const fromList = await loadJournal('create_journey_entry', args, other.read);
    expect(fromList).toMatchObject({ title: 'Japan', tripJournal: false });
    expect(await loadJournal('create_journey_entry', {}, other.read)).toBeNull();
  });

  it('ASTCARD-JRN-010: a change merges its arguments over the entry: a named key wins, null clears, the rest stays', async () => {
    const { read, asked } = readerOf({
      get_trip_journal: { link: { journey_id: 8, title: 'Other' } },
      get_journey_entry: { entry: entry({ weather: 'rainy' }), journey: { id: 3, title: 'Berlin 2026' } },
    });
    const args = { entryId: 12, title: 'Evening at the Spree', location_name: null };
    const loaded = await loadJournal('update_journey_entry', args, read);
    expect(asked).toContain(readKey('get_journey_entry', { entryId: 12 }));
    expect(loaded?.tripJournal).toBe(false);
    const card = cardOf(changeCardOf('update_journey_entry', ctx, args, loaded));
    expect(card.change).toBe('changed');
    expect(card.entries[0]).toMatchObject({
      entryId: 12,
      title: 'Evening at the Spree',
      place: null,
      weather: 'rainy',
    });
  });

  it('ASTCARD-JRN-011: a delete shows the entry it removes; a failed lookup leaves the row without a card', async () => {
    const loaded: JournalLoaded = { entry: entry({ source_place_id: 9 }), journeyId: 3, title: 'B', tripJournal: true };
    const card = cardOf(changeCardOf('delete_journey_entry', ctx, { entryId: 12 }, loaded));
    expect(card.change).toBe('willDelete');
    expect(card.entries[0]?.fromTripPlace).toBe(true);

    const failing = readerOf({});
    expect(await loadJournal('delete_journey_entry', { entryId: 12 }, failing.read)).toBeNull();
    expect(changeCardOf('delete_journey_entry', ctx, { entryId: 12 }, null)).toBeNull();
    expect(changeCardOf('update_journey_entry', ctx, { entryId: 12 }, null)).toBeNull();
  });

  it('ASTCARD-JRN-012: the change row names the entry, its day, time, place, text and states, before and after', () => {
    const created = describeToolCall('create_journey_entry', 'c1', { journeyId: 3, entry_date: '2026-10-22' }, ctx);
    expect(created).toMatchObject({
      verbKey: 'addJournalEntry',
      domain: 'journey',
      undoable: true,
      subject: 'Thu, Oct 22',
    });
    expect(describeToolCall('create_journey_entry', 'c0', {}, ctx).verbKey).toBe('addJournalEntry');

    const withPlace = describeToolCall(
      'create_journey_entry',
      'c2',
      { journeyId: 3, entry_date: '2026-10-22', entry_time: '14:30', location_name: 'Museum Island', story: '**Hi**' },
      ctx,
    );
    expect(withPlace.subject).toBe('Museum Island');
    expect(withPlace.rows.map((r) => [r.labelKey, r.after])).toEqual([
      ['day', 'Thu, Oct 22'],
      ['time', '14:30'],
      ['location', 'Museum Island'],
      ['text', 'Hi'],
    ]);

    const loaded: JournalLoaded = { entry: entry(), journeyId: 3, title: 'B', tripJournal: false };
    const updated = describeToolCall('update_journey_entry', 'c3', { entryId: 12, entry_time: '18:00' }, ctx, loaded);
    expect(updated).toMatchObject({ verbKey: 'updateJournalEntry', subject: 'Sunset at the Spree', undoable: false });
    expect(updated.rows).toEqual([{ op: 'change', labelKey: 'time', before: '14:30', after: '18:00' }]);
    expect(describeToolCall('update_journey_entry', 'c4', {}, ctx).rows).toEqual([]);

    // Who sees it, its mood and whether it is a draft each get a row; a state set to what it holds gets none.
    const states = { entryId: 12, visibility: 'private', mood: null, weather: 'sunny', is_draft: true };
    expect(describeToolCall('update_journey_entry', 'c6', states, ctx, loaded).rows).toEqual([
      { op: 'change', labelKey: 'field', field: 'visibility', before: 'public', after: 'private' },
      { op: 'change', labelKey: 'field', field: 'mood', before: 'amazing', after: '' },
      { op: 'change', labelKey: 'field', field: 'is_draft', before: '✗', after: '✓' },
    ]);
    // A suggestion brought back is not found by the read, so its row has no before.
    expect(describeToolCall('update_journey_entry', 'c7', { entryId: 12, dismissed: false }, ctx).rows).toEqual([
      { op: 'change', labelKey: 'field', field: 'dismissed', before: null, after: '✗' },
    ]);

    const removed = describeToolCall('delete_journey_entry', 'c5', { entryId: 12 }, ctx, loaded);
    expect(removed).toMatchObject({ verbKey: 'removeJournalEntry', subject: 'Sunset at the Spree' });
    expect(removed.card?.kind).toBe('journeyEntries');
  });
});

describe('the applied change', () => {
  it('ASTCARD-JRN-013: the receipt card is the entry as stored, beside the journal the held card named', () => {
    const loaded: JournalLoaded = { entry: null, journeyId: 3, title: 'Berlin 2026', tripJournal: true };
    const args = { journeyId: 3, entry_date: '2026-10-22' };
    const held = cardOf(changeCardOf('create_journey_entry', ctx, args, loaded));
    const preview = { card: held } as unknown as AssistantChangePreview;
    const stored = entry({ id: 40, photos: [{ photo_id: 9, media_type: 'image', provider: 'local' }] });
    const card = cardOf(appliedCardOf('create_journey_entry', { args: {}, result: { entry: stored }, preview }));
    expect(card).toMatchObject({ journeyId: 3, journalTitle: 'Berlin 2026', tripJournal: true, change: 'new' });
    expect(card.entries[0]).toMatchObject({ entryId: 40, photoId: 9, countryCode: 'DE' });
    const deleted = { args: { entryId: 12 }, result: { success: true }, preview };
    expect(appliedCardOf('delete_journey_entry', deleted)).toBeNull();

    expect(appliedChange('create_journey_entry', 'c1', {}, { entry: stored }, null, null)).toMatchObject({
      entity: 'journey_entry',
      ids: [40],
    });
    const removed = appliedChange('delete_journey_entry', 'c2', { entryId: 12 }, { success: true }, null, null);
    expect(removed?.ids).toEqual([12]);
  });

  it('ASTCARD-JRN-014: a created entry is taken back while nothing was written to it and no photo was added', () => {
    const undo = ASSISTANT_UNDO_MAP.create_journey_entry;
    const created = { entry: entry({ id: 40, updated_at: 5 }) };
    expect(undo?.tool).toBe('delete_journey_entry');
    expect(undo?.args({}, created, null)).toEqual({ entryId: 40 });
    expect(undo?.args({}, {}, null)).toBeNull();
    const reads = undoReadsOf('create_journey_entry', {}, created);
    expect(reads).toEqual([{ tool: 'get_journey_entry', args: { entryId: 40 } }]);
    expect(undoReadsOf('create_journey_entry', {}, {}).map((r) => r.tool)).toEqual(['get_journey_entry']);

    const check = JOURNEY_CARDS.tools.create_journey_entry?.undo;
    const snapshot = (current: unknown): UndoSnapshot => ({
      summary: {},
      places: {},
      reads: new Map([[readKey('get_journey_entry', { entryId: 40 }), current]]),
    });
    expect(check?.unchanged(created, snapshot({ entry: entry({ id: 40, updated_at: 5 }) }))).toBe(true);
    expect(check?.unchanged(created, snapshot({ entry: entry({ id: 40, updated_at: 6 }) }))).toBe(false);
    const withPhoto = entry({ id: 40, updated_at: 5, photos: [{ photo_id: 1 }] });
    expect(check?.unchanged(created, snapshot({ entry: withPhoto }))).toBe(false);
    expect(check?.unchanged(created, snapshot(null))).toBe(false);
  });

  it('ASTCARD-JRN-015: the journal brings its verbs, its undo and two prompt lines to the registry', () => {
    expect(ASSISTANT_WRITE_TOOLS.create_journey_entry).toEqual({ verbKey: 'addJournalEntry', entity: 'journey_entry' });
    expect(ASSISTANT_WRITE_TOOLS.update_journey_entry?.verbKey).toBe('updateJournalEntry');
    expect(ASSISTANT_WRITE_TOOLS.delete_journey_entry?.verbKey).toBe('removeJournalEntry');
    expect(ASSISTANT_UNDO_MAP.update_journey_entry).toBeUndefined();
    expect(CARD_PROMPT_LINES).toEqual(expect.arrayContaining([...(JOURNEY_CARDS.prompt ?? [])]));
    expect(JOURNEY_CARDS.prompt).toHaveLength(2);
    // A trip chat sends a book request to the Studio instead of trying it.
    expect(JOURNEY_CARDS.prompt?.[1]).toContain('open Studio from the journey');
  });
});
