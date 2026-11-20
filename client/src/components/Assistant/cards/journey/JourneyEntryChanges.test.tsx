/**
 * FE-AI-JOURNEY-020 to FE-AI-JOURNEY-022
 *
 * The parts of a journal entry the chat added later: its tags and how its
 * verdict leans among its marks, an update's tags, verdict and coordinates
 * old to new, and a new order of the entries drawn as the entries that move.
 */
import type { AssistantChangePreview, JourneyEntriesCard, JourneyEntryLook } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { render, screen } from '../../../../../tests/helpers/render';
import AssistantChangeCard from '../../AssistantChangeCard';
import type { ChangeItem } from '../../assistantParts';
import { AssistantViewContext } from '../../assistantViewContext';

const ENTRY: JourneyEntryLook = {
  entryId: 12,
  type: 'entry',
  title: 'Sunset at the Spree',
  date: '2026-10-21',
  time: null,
  place: null,
  point: null,
  countryCode: null,
  story: null,
  mood: null,
  weather: null,
  photoId: null,
  video: false,
  photoCount: 0,
  draft: false,
  fromTripPlace: false,
  dayIndex: null,
  tags: ['river', 'evening'],
  verdict: { pros: ['the light'], cons: ['cold', 'wind'], prosCount: 1, consCount: 2 },
};

function journal(entries: JourneyEntryLook[], change: JourneyEntriesCard['change'], more = 0): JourneyEntriesCard {
  return { kind: 'journeyEntries', journeyId: 3, journalTitle: 'Berlin', tripJournal: false, change, entries, more };
}

function pending(
  card: JourneyEntriesCard,
  verbKey: AssistantChangePreview['verbKey'],
  rows: AssistantChangePreview['rows']
) {
  const preview: AssistantChangePreview = {
    toolCallId: 'e1',
    verbKey,
    subject: 'Berlin',
    rows,
    dayId: null,
    placeIds: [],
    undoable: true,
    domain: 'journey',
    card,
  };
  const item: ChangeItem = { toolCallId: 'e1', preview, applied: null, state: 'pending', card };
  return render(
    <AssistantViewContext.Provider value={{ tripId: -3, variant: 'window' }}>
      <AssistantChangeCard items={[item]} />
    </AssistantViewContext.Provider>
  );
}

describe('the later parts of a journal entry', () => {
  it('FE-AI-JOURNEY-020: a new entry shows its tags and how its verdict leans', () => {
    pending(journal([ENTRY], 'new'), 'addJournalEntry', []);
    expect(screen.getByText('river')).toBeInTheDocument();
    expect(screen.getByText('evening')).toBeInTheDocument();
    expect(screen.getByText('1 good point')).toBeInTheDocument();
    expect(screen.getByText('2 weak points')).toBeInTheDocument();
  });

  it('FE-AI-JOURNEY-021: an update names its tags, each side of its verdict and its coordinates, old to new', () => {
    const rows: AssistantChangePreview['rows'] = [
      { op: 'change', labelKey: 'field', field: 'tags', before: 'river, evening', after: 'river' },
      { op: 'change', labelKey: 'field', field: 'cons', before: null, after: 'cold' },
      { op: 'change', labelKey: 'coordinates', before: null, after: '52.5200, 13.4050' },
    ];
    pending(journal([{ ...ENTRY, tags: [], verdict: null }], 'changed'), 'updateJournalEntry', rows);
    expect(screen.getByText('river, evening')).toHaveClass('line-through');
    expect(screen.getByText('cold')).toBeInTheDocument();
    expect(screen.getByText('52.5200, 13.4050')).toBeInTheDocument();
  });

  it('FE-AI-JOURNEY-022: a new order lists the entries that move in their new places, the rest counted', () => {
    const moved = [
      { ...ENTRY, entryId: 2, title: 'Museum Island', moved: true },
      { ...ENTRY, entryId: 1, title: 'Arrival', moved: true },
    ];
    pending(journal(moved, 'reordered', 3), 'reorderJournalEntries', []);
    expect(screen.getByText('Put the entries in a new order')).toBeInTheDocument();
    const text = document.body.textContent ?? '';
    expect(text.indexOf('Museum Island')).toBeGreaterThan(-1);
    expect(text.indexOf('Museum Island')).toBeLessThan(text.indexOf('Arrival'));
    expect(screen.getByText('3 more')).toBeInTheDocument();
  });
});
