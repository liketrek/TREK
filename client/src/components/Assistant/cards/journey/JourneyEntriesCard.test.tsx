/**
 * FE-AI-JOURNEY-001 to FE-AI-JOURNEY-010
 *
 * The journal's cards in the chat: one or two entries as rows with their
 * photo, facts and text, three or more as a strip of the journal's own tiles
 * with the rest counted, each entry opening where it is written (the trip's
 * Journal tab or the journal's page), the map pin while resting on one, and
 * a change row of an entry with its photo, text and marks, and every field
 * an update changes, old to new.
 */
import type {
  AssistantApplied,
  AssistantChangePreview,
  AssistantMessage,
  JourneyEntriesCard,
  JourneyEntryLook,
} from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAssistantStore } from '../../../../store/assistantStore';
import { useTripJournalLinkStore } from '../../../../store/tripJournalLinkStore';
import AssistantChangeCard from '../../AssistantChangeCard';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import JourneyEntriesBlock from './JourneyEntriesBlock';

const TRIP = 4;
const ASSISTANT = useAssistantStore.getState();
const LINKS = useTripJournalLinkStore.getState();
const MESSAGE = { id: 'm1', role: 'assistant', parts: [], status: 'complete', createdAt: '' } as AssistantMessage;

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
    mood: null,
    weather: null,
    photoId: 7,
    video: false,
    photoCount: 1,
    visibility: 'private',
    draft: false,
    fromTripPlace: false,
    dayIndex: 0,
    ...over,
  };
}

function card(entries: JourneyEntryLook[], over: Partial<JourneyEntriesCard> = {}): JourneyEntriesCard {
  return {
    kind: 'journeyEntries',
    journeyId: 3,
    journalTitle: 'Berlin 2026',
    tripJournal: false,
    change: 'none',
    entries,
    more: 0,
    ...over,
  };
}

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

function block(cards: JourneyEntriesCard[], view: Partial<AssistantView> = {}) {
  const entries = cards.map((c, i) => ({ toolCallId: `call_${i}`, card: c }));
  return inView(<JourneyEntriesBlock cards={entries} message={MESSAGE} />, view);
}

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useTripJournalLinkStore.setState(LINKS, true);
  vi.restoreAllMocks();
});

describe('the journal entries card', () => {
  it('FE-AI-JOURNEY-001: one entry reads as a row with its photo, facts, marks and text under the journal', () => {
    const { container } = block([card([look({ visibility: 'public', draft: true, photoCount: 4, video: true })])]);
    expect(screen.getByRole('region', { name: 'Journal entries' })).toBeInTheDocument();
    expect(screen.getByText('Sunset at the Spree')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('The light over the river was unreal.')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('4 photos')).toBeInTheDocument();
    expect(screen.getByText('Opens with a video')).toBeInTheDocument();
    expect(screen.getByText('Berlin 2026')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', '/api/photos/7/thumbnail');
  });

  it('FE-AI-JOURNEY-002: an entry without a photo takes the width, and a known mood and weather are named', () => {
    const { container } = block([card([look({ photoId: null, mood: 'amazing', weather: 'cold' })])]);
    expect(container.querySelector('img[src^="/api/photos/"]')).toBeNull();
    expect(screen.getByText('Amazing')).toBeInTheDocument();
    // `cold` is the id the journal stores for snow.
    expect(screen.getByText('Snowy')).toBeInTheDocument();
    block([card([look({ entryId: 20, mood: 'ecstatic', weather: 'Drizzle at noon' })], { journeyId: 8 })]);
    expect(screen.getByText('Drizzle at noon')).toBeInTheDocument();
    expect(screen.queryByText('ecstatic')).toBeNull();
  });

  it('FE-AI-JOURNEY-003: three or more entries run as the journal tiles, the ones left out counted at the end', () => {
    const entries = [
      look({ entryId: 1, title: 'Arrival', dayIndex: 0 }),
      look({ entryId: 2, title: 'Museum Island', dayIndex: 1 }),
      look({ entryId: 3, title: 'Teufelsberg', dayIndex: 1, photoId: null }),
    ];
    block([card(entries, { more: 5 })]);
    expect(screen.getByRole('region', { name: 'Berlin 2026' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Museum Island/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5 more in the journal' })).toBeInTheDocument();
    expect(screen.getByText('8 entries')).toBeInTheDocument();
  });

  it('FE-AI-JOURNEY-004: two reads of one journal draw as one card, each entry once', () => {
    block([card([look({ entryId: 1, title: 'Old title' })]), card([look({ entryId: 1, title: 'New title' })])]);
    expect(screen.getByText('New title')).toBeInTheDocument();
    expect(screen.queryByText('Old title')).toBeNull();
  });

  it("FE-AI-JOURNEY-005: an entry opens in the trip's Journal tab when the trip shows that journal, else on its page", () => {
    const onOpen = vi.fn();
    const first = block([card([look()])], { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Sunset at the Spree' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'page', path: '/journey/3?entry=12' });
    fireEvent.click(screen.getByRole('button', { name: /Open in the journal/ }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'page', path: '/journey/3' });
    first.unmount();

    useTripJournalLinkStore.setState({
      byTrip: {
        [String(TRIP)]: {
          link: {
            journey_id: 3,
            title: 'Berlin 2026',
            subtitle: null,
            cover_image: null,
            owner_id: 1,
            linked_by: 1,
            created_at: 0,
            my_role: 'editor',
            members: null,
          },
          can_link: true,
          can_unlink: true,
          can_edit_members: false,
        },
      },
    });
    block([card([look()])], { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Sunset at the Spree' }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'tab', tab: 'journal', params: { entry: '12' } });
  });

  it('FE-AI-JOURNEY-006: without a shell to open into, the title is no button and the card has no way out', () => {
    block([card([look()])]);
    expect(screen.queryByRole('button', { name: 'Sunset at the Spree' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Open in the journal/ })).toBeNull();
  });

  it('FE-AI-JOURNEY-007: resting on an entry with a place pins it on the map; leaving and going take the pin away', () => {
    const setPreviewPin = vi.fn();
    useAssistantStore.setState({ setPreviewPin });
    const { unmount } = block([card([look(), look({ entryId: 13, title: 'Nowhere', point: null })])]);
    fireEvent.mouseEnter(screen.getByText('Sunset at the Spree').closest('div') as HTMLElement);
    expect(setPreviewPin).toHaveBeenLastCalledWith({
      tripId: TRIP,
      ref: 'journey:3:12',
      lat: 52.52,
      lng: 13.405,
      name: 'Sunset at the Spree',
    });
    fireEvent.mouseLeave(screen.getByText('Sunset at the Spree').closest('div') as HTMLElement);
    expect(setPreviewPin).toHaveBeenLastCalledWith(null);
    unmount();
    expect(setPreviewPin).toHaveBeenLastCalledWith(null);
  });
});

describe('a change row of a journal entry', () => {
  const DELETE_ROWS: AssistantChangePreview['rows'] = [
    { op: 'add', labelKey: 'day', before: null, after: 'Tue, Oct 21' },
    { op: 'add', labelKey: 'location', before: null, after: 'Museum Island' },
    { op: 'add', labelKey: 'text', before: null, after: 'Not a fact' },
  ];

  function item(
    state: ChangeItem['state'],
    held: JourneyEntriesCard,
    over: Partial<AssistantChangePreview> = {}
  ): ChangeItem {
    const preview: AssistantChangePreview = {
      toolCallId: 'w1',
      verbKey: 'removeJournalEntry',
      subject: 'Sunset at the Spree',
      rows: DELETE_ROWS,
      dayId: null,
      placeIds: [],
      undoable: false,
      domain: 'journey',
      card: held,
      ...over,
    };
    const receipt: AssistantApplied = {
      toolCallId: 'w1',
      entity: 'journey_entry',
      ids: [12],
      dayId: null,
      undoUntil: null,
    };
    return { toolCallId: 'w1', preview, applied: state === 'applied' ? receipt : null, state, card: held };
  }

  it('FE-AI-JOURNEY-008: a waiting delete shows the photo, the text and that it goes back to a suggestion; a receipt opens it', () => {
    const entry = look({ fromTripPlace: true, visibility: 'shared' });
    const held = card([entry], { change: 'willDelete', tripJournal: true });
    const onOpen = vi.fn();
    const first = inView(<AssistantChangeCard items={[item('pending', held)]} />, { onOpen });
    expect(screen.getByText('Delete the journal entry')).toBeInTheDocument();
    expect(screen.getByText('The light over the river was unreal.')).toBeInTheDocument();
    expect(screen.getByText('Shared')).toBeInTheDocument();
    expect(screen.getByText('Goes back to a suggestion')).toBeInTheDocument();
    expect(screen.getByText('Tue, Oct 21')).toBeInTheDocument();
    expect(screen.getByText('Museum Island')).toBeInTheDocument();
    expect(screen.queryByText('Not a fact')).toBeNull();
    expect(document.querySelector('img')).toHaveAttribute('src', '/api/photos/7/thumbnail');
    first.unmount();

    const second = inView(<AssistantChangeCard items={[item('applied', held)]} />, { onOpen });
    expect(screen.queryByRole('button', { name: 'Show on map' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open in the journal' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'journal', params: { entry: '12' } });
    second.unmount();

    inView(<AssistantChangeCard items={[item('failed', held)]} />, { onOpen });
    expect(screen.queryByText('Goes back to a suggestion')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
  });

  it('FE-AI-JOURNEY-009: a waiting update names every field it changes old to new, a cleared one as removed', () => {
    const rows: AssistantChangePreview['rows'] = [
      { op: 'change', labelKey: 'name', before: 'Sunset', after: 'Sunset at the Spree' },
      { op: 'change', labelKey: 'time', before: '14:30', after: '' },
      { op: 'change', labelKey: 'text', before: 'Old story', after: 'New story' },
      { op: 'change', labelKey: 'field', field: 'visibility', before: 'private', after: 'public' },
      { op: 'change', labelKey: 'field', field: 'mood', before: 'good', after: '' },
      { op: 'change', labelKey: 'field', field: 'weather', before: 'sunny', after: 'Drizzle' },
      { op: 'change', labelKey: 'field', field: 'is_draft', before: '✓', after: '✗' },
    ];
    const held = card([look({ photoId: null })], { change: 'changed' });
    inView(<AssistantChangeCard items={[item('pending', held, { verbKey: 'updateJournalEntry', rows })]} />);
    expect(screen.getByText('Change the journal entry')).toBeInTheDocument();
    expect(screen.getByText('Sunset')).toHaveClass('line-through');
    expect(screen.getByText('14:30')).toHaveClass('line-through');
    expect(screen.getByText('Old story')).toHaveClass('line-through');
    expect(screen.getByText('New story')).toBeInTheDocument();
    expect(screen.getByText('Private')).toHaveClass('line-through');
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Good')).toHaveClass('line-through');
    expect(screen.getByText('Sunny')).toHaveClass('line-through');
    expect(screen.getByText('Drizzle')).toBeInTheDocument();
    expect(screen.getByText('No longer a draft')).toBeInTheDocument();
    expect(screen.getAllByText('Removed')).toHaveLength(2);
  });

  it('FE-AI-JOURNEY-010: resting on a waiting change shows its entry on the map, and leaving takes the pin away', () => {
    const setPreviewPin = vi.fn();
    useAssistantStore.setState({ setPreviewPin });
    const held = card([look()], { change: 'changed' });
    inView(<AssistantChangeCard items={[item('pending', held, { verbKey: 'updateJournalEntry', rows: [] })]} />);
    const story = screen.getByText('The light over the river was unreal.');
    fireEvent.mouseEnter(story);
    expect(setPreviewPin).toHaveBeenLastCalledWith({
      tripId: TRIP,
      ref: 'journey:3:12',
      lat: 52.52,
      lng: 13.405,
      name: 'Sunset at the Spree',
    });
    fireEvent.mouseLeave(story);
    expect(setPreviewPin).toHaveBeenLastCalledWith(null);
    fireEvent.focus(document.querySelector('img')?.parentElement?.parentElement as HTMLElement);
    expect(setPreviewPin).toHaveBeenLastCalledWith(expect.objectContaining({ ref: 'journey:3:12' }));
  });
});
