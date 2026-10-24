/**
 * FE-AI-JOURNEY-MODEL-001 to FE-AI-JOURNEY-MODEL-009
 *
 * The pure side of the journal's cards: where an entry opens, how the cards
 * of one answer about one journal merge, how an entry reads to the journal's
 * own tile, the mood and weather names, and the journal's look in the chat:
 * its verbs, tools, steps, what an applied entry opens, its grouping and the
 * lookup that gives way to the change it served.
 */
import type { AssistantApplied, JourneyEntriesCard, JourneyEntryLook, TrekCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { CARD_RULES, ENTITY_LOOK, STEP_LOOKS, TOOL_LABELS, VERB_LOOK } from '../cardLooks';
import { coverEntryOf, journalTarget, mergeJournalCards } from './journeyCardModel';
import { JOURNEY_LOOK } from './journeyLook';
import { flagOf, moodOf, stateOf, weatherOf } from './journeyTones';

function look(over: Partial<JourneyEntryLook> = {}): JourneyEntryLook {
  return {
    entryId: 12,
    type: 'entry',
    title: 'Sunset',
    date: '2026-10-21',
    time: null,
    place: 'Berlin',
    point: null,
    countryCode: 'DE',
    story: null,
    mood: null,
    weather: null,
    photoId: null,
    video: false,
    photoCount: 0,
    visibility: 'private',
    draft: false,
    fromTripPlace: false,
    dayIndex: null,
    ...over,
  };
}

function card(entries: JourneyEntryLook[], over: Partial<JourneyEntriesCard> = {}): JourneyEntriesCard {
  return {
    kind: 'journeyEntries',
    journeyId: 3,
    journalTitle: null,
    tripJournal: false,
    change: 'none',
    entries,
    more: 0,
    ...over,
  };
}

describe('journeyCardModel', () => {
  it('FE-AI-JOURNEY-MODEL-001: an entry opens in the Journal tab of the trip that shows it, else on the journal page', () => {
    expect(journalTarget(3, 12, true)).toEqual({ kind: 'tab', tab: 'journal', params: { entry: '12' } });
    expect(journalTarget(3, null, true)).toEqual({ kind: 'tab', tab: 'journal' });
    expect(journalTarget(3, 12, false)).toEqual({ kind: 'page', path: '/journey/3?entry=12' });
    expect(journalTarget(3, null, false)).toEqual({ kind: 'page', path: '/journey/3' });
  });

  it('FE-AI-JOURNEY-MODEL-002: the reads of one journal merge: each entry once, the later read winning, by day', () => {
    const later = look({ entryId: 2, date: '2026-10-22', title: 'Later' });
    const merged = mergeJournalCards([
      { toolCallId: 'a', card: card([look({ entryId: 2, date: '2026-10-22' }), look({ entryId: 1 })], { more: 4 }) },
      { toolCallId: 'b', card: card([later], { journalTitle: 'B' }) },
      { toolCallId: 'c', card: card([look({ entryId: null, date: '2026-10-20' })], { tripJournal: true }) },
    ]);
    expect(merged?.entries.map((e) => e.entryId)).toEqual([null, 1, 2]);
    expect(merged?.entries[2]?.title).toBe('Later');
    expect(merged).toMatchObject({ journeyId: 3, journalTitle: 'B', tripJournal: true, more: 4 });
    expect(mergeJournalCards([{ toolCallId: 'x', card: { kind: 'tourList' } as TrekCard }])).toBeNull();
  });

  it("FE-AI-JOURNEY-MODEL-003: an entry reads to the journal's tile with its photo, never one without a picture", () => {
    expect(coverEntryOf(look({ photoId: 7, video: true }))).toMatchObject({
      id: 12,
      entry_date: '2026-10-21',
      location_name: 'Berlin',
      country_code: 'DE',
      photos: [{ photo_id: 7, media_type: 'video' }],
    });
    expect(coverEntryOf(look({ entryId: null })).photos).toEqual([]);
  });

  it('FE-AI-JOURNEY-MODEL-004: moods and weathers read as the journal draws them, anything else as nothing', () => {
    expect(moodOf('amazing')).toMatchObject({ labelKey: 'journey.mood.amazing', color: 'var(--mood-amazing)' });
    // Neither journal editor writes "tired"; the journal shows no mood for it.
    expect(moodOf('tired')).toBeNull();
    // `cold` is the id the journal stores for snow.
    expect(weatherOf('cold')?.labelKey).toBe('journey.weather.cold');
    expect(weatherOf('sunny')?.labelKey).toBe('journey.weather.sunny');
    expect(weatherOf('drizzle at noon')).toBeNull();
    expect(moodOf('toString')).toBeNull();
    expect(moodOf(null)).toBeNull();
  });

  it('FE-AI-JOURNEY-MODEL-009: the states an update sets are named by field, flags by on and off', () => {
    expect(stateOf('visibility', 'public')?.labelKey).toBe('journey.visibility.public');
    expect(stateOf('type', 'skeleton')?.labelKey).toBe('journey.entry.suggestion');
    expect(stateOf('mood', 'good')?.labelKey).toBe('journey.mood.good');
    expect(stateOf('weather', 'cold')?.labelKey).toBe('journey.weather.cold');
    expect(stateOf('weather', 'Drizzle')).toBeNull();
    expect(stateOf('visibility', 'toString')).toBeNull();
    expect(stateOf(undefined, 'public')).toBeNull();
    expect(flagOf('is_draft', '✓')?.labelKey).toBe('journey.entry.draft');
    expect(flagOf('is_draft', '✗')?.labelKey).toBe('assistant.card.journey.notDraft');
    expect(flagOf('dismissed', '✗')?.labelKey).toBe('assistant.card.journey.restored');
    expect(flagOf('stats_excluded', '✓')?.labelKey).toBe('journey.editor.statsExcluded');
    expect(flagOf('visibility', '✓')).toBeNull();
  });

  it('FE-AI-JOURNEY-MODEL-005: the journal names its verbs, tools and reading steps in the merged look', () => {
    expect(VERB_LOOK.addJournalEntry.labelKey).toBe('assistant.change.verb.addJournalEntry');
    expect(VERB_LOOK.removeJournalEntry.tone).toBe('danger');
    expect(TOOL_LABELS.link_trip_journal?.labelKey).toBe('assistant.tool.link_trip_journal');
    expect(STEP_LOOKS.list_journey_entries?.stepKey).toBe('assistant.step.readingJournal');
    expect(JOURNEY_LOOK.cards.journeyEntries.followUps.find((f) => f.edits)?.id).toBe('journalToday');
  });

  it('FE-AI-JOURNEY-MODEL-006: an applied entry opens where its card says; reads group per journal and yield to its change', () => {
    const applied: AssistantApplied = {
      toolCallId: 'w',
      entity: 'journey_entry',
      ids: [40],
      dayId: null,
      undoUntil: null,
    };
    const entity = ENTITY_LOOK.journey_entry;
    expect(entity.onMap).toBeUndefined();
    expect(entity.open?.(applied, card([look()], { tripJournal: true }))).toEqual({
      kind: 'tab',
      tab: 'journal',
      params: { entry: '40' },
    });
    const fromCard = entity.open?.({ ...applied, ids: [] }, card([look()]));
    expect(fromCard).toEqual({ kind: 'page', path: '/journey/3?entry=12' });
    expect(entity.open?.(applied, null)).toBeNull();

    const read = card([look()]);
    expect(CARD_RULES.group(read)).toBe('journey:3');
    expect(CARD_RULES.yieldsToChange(read, card([look()], { change: 'changed' }))).toBe(true);
    expect(CARD_RULES.yieldsToChange(read, card([look()], { journeyId: 9, change: 'changed' }))).toBe(false);
    expect(CARD_RULES.yieldsToChange(read, { kind: 'tourList' } as TrekCard)).toBe(false);
  });

  it('FE-AI-JOURNEY-MODEL-007: a list answer stays beside a change that touches only part of it, or writes a new entry', () => {
    const list = card([look({ entryId: 1 }), look({ entryId: 2, date: '2026-10-22' })]);
    expect(CARD_RULES.yieldsToChange(list, card([look({ entryId: null })], { change: 'new' }))).toBe(false);
    expect(CARD_RULES.yieldsToChange(list, card([look({ entryId: 2 })], { change: 'changed' }))).toBe(false);
    const lookup = card([look({ entryId: 2 })]);
    expect(CARD_RULES.yieldsToChange(lookup, card([look({ entryId: 2 })], { change: 'willDelete' }))).toBe(true);
    expect(CARD_RULES.yieldsToChange(card([]), card([look()], { change: 'changed' }))).toBe(false);
  });

  it('FE-AI-JOURNEY-MODEL-008: merged reads count their days over the whole card, a lone entry read included', () => {
    const merged = mergeJournalCards([
      {
        toolCallId: 'a',
        card: card([
          look({ entryId: 1, date: '2026-10-20', dayIndex: 0 }),
          look({ entryId: 2, date: '2026-10-22', dayIndex: 1 }),
        ]),
      },
      { toolCallId: 'b', card: card([look({ entryId: 2, date: '2026-10-22', dayIndex: null })]) },
      { toolCallId: 'c', card: card([look({ entryId: 3, date: '2026-10-21', dayIndex: 0 })]) },
    ]);
    expect(merged?.entries.map((e) => [e.entryId, e.dayIndex])).toEqual([
      [1, 0],
      [3, 1],
      [2, 2],
    ]);
  });
});
