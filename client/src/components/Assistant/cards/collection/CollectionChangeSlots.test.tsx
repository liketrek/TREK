/**
 * FE-AI-COLL-020 to FE-AI-COLL-031
 *
 * The collections inside the change card: a held save with its list, its
 * status and the lists that hold the place already; a change of status, of
 * labels and of fields; an applied save opened in Collections, a duplicate
 * named, a copy into the trip with its map pin and its count; a list deleted
 * with what goes; a label renamed; the facts past four counted; trip places
 * saved to a list without a warning; and a new order of the lists.
 */
import type { AssistantApplied, AssistantChangePreview, TrekCard } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyDelta, listRow, listsCard, placesCard, savedPlace } from '../../../../../tests/helpers/collectionCards';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import AssistantChangeCard from '../../AssistantChangeCard';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';

const TRIP = 4;
const INITIAL = useAssistantStore.getState();

type Verb = AssistantChangePreview['verbKey'];

function preview(tool: string, subject: string, verbKey: Verb = 'genericCreate'): AssistantChangePreview {
  return { toolCallId: 'c1', verbKey, subject, rows: [], dayId: null, placeIds: [], undoable: false, tool };
}

function pending(tool: string, subject: string, card: TrekCard, verbKey?: Verb): ChangeItem {
  return { toolCallId: 'c1', preview: preview(tool, subject, verbKey), applied: null, state: 'pending', card };
}

function applied(item: ChangeItem, entity: AssistantApplied['entity'], ids: number[]): ChangeItem {
  return { ...item, state: 'applied', applied: { toolCallId: 'c1', entity, ids, dayId: null, undoUntil: null } };
}

function draw(items: ChangeItem[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', onOpen: vi.fn(), ...view };
  render(
    <AssistantViewContext.Provider value={value}>
      <AssistantChangeCard items={items} />
    </AssistantViewContext.Provider>
  );
  return value;
}

beforeEach(() => {
  useAssistantStore.setState({
    decide: vi.fn(async () => {}),
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId: 1 } },
  });
});

afterEach(() => {
  useAssistantStore.setState(INITIAL, true);
  vi.clearAllMocks();
});

const SAVE = placesCard({
  places: [savedPlace({ id: null, labelIds: [], savedIn: [{ listId: 13, name: 'Later', status: 'idea' }] })],
  labels: [],
});

describe('collection change cards', () => {
  it('FE-AI-COLL-020: a held save names its list, the status it gets and the list that holds the place already', () => {
    draw([pending('save_place_to_collection', 'Septime', SAVE)]);
    expect(screen.getByText('Septime')).toBeInTheDocument();
    expect(screen.getByText('Save to a list')).toBeInTheDocument();
    expect(screen.getByText('Paris food')).toBeInTheDocument();
    expect(screen.getByText('Want to go')).toBeInTheDocument();
    expect(screen.getByText('Already in Later')).toBeInTheDocument();
  });

  it('FE-AI-COLL-021: a change reads its status from old to new, labels added and taken away, and the fields it touches', () => {
    const delta = emptyDelta({
      status: { from: 'idea', to: 'visited' },
      labelsAdded: [53],
      labelsRemoved: [52],
      fields: ['photo'],
    });
    const card = placesCard({ list: null, places: [savedPlace({ labelIds: [51, 52], delta })] });
    draw([pending('update_collection_place', 'Septime', card, 'genericUpdate')]);
    expect(screen.getByText('Change the saved place')).toBeInTheDocument();
    expect(screen.getByText('Idea')).toHaveClass('line-through');
    expect(screen.getByText('Visited')).toBeInTheDocument();
    expect(screen.getByText('Terrace')).not.toHaveClass('line-through');
    expect(screen.getByText('Late')).toHaveClass('line-through');
    expect(screen.getByText('Photo')).toBeInTheDocument();
  });

  it('FE-AI-COLL-022: an applied save opens the saved place in its list', () => {
    const card = placesCard({ places: [savedPlace({ id: 77 })] });
    const view = draw([applied(pending('save_place_to_collection', 'Septime', card), 'collection_place', [77])]);
    expect(screen.queryByRole('button', { name: 'Show on map' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open in Collections' }));
    expect(view.onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/collections/12?place=77' });
  });

  it('FE-AI-COLL-023: a save the place matched already says where it is saved', () => {
    const card = { ...SAVE, outcome: { type: 'duplicate' as const, name: 'Rodin museum' } };
    draw([applied(pending('save_place_to_collection', 'Septime', card), 'collection_place', [])]);
    expect(screen.getByText('Already in Rodin museum')).toBeInTheDocument();
  });

  it('FE-AI-COLL-024: a copy into the trip shows its new trip place on the map and says how many went in', () => {
    const card = placesCard({
      places: [savedPlace(), savedPlace({ id: 35, name: 'Le Comptoir', inTripPlaceId: 6 })],
      outcome: { type: 'copied', copied: 1, skipped: 1, skippedNames: ['Le Comptoir'] },
    });
    const copy = pending('copy_collection_places_to_trip', 'Septime, Le Comptoir', card);
    const view = draw([applied(copy, 'place', [900])]);
    expect(screen.getByText('1 added')).toBeInTheDocument();
    expect(screen.getByText('1 already there')).toBeInTheDocument();
    // The held copy's warning gives way to what the copy did.
    expect(screen.queryByText('1 already in the trip')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(view.onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 900, dayId: null });
  });

  it('FE-AI-COLL-025: a held copy warns of the places the trip has, and a copy into another trip says so', () => {
    const card = placesCard({
      places: [savedPlace(), savedPlace({ id: 35, name: 'Le Comptoir', inTripPlaceId: 6 })],
    });
    draw([pending('copy_collection_places_to_trip', 'Septime, Le Comptoir', card)]);
    expect(screen.getByText('2 places')).toBeInTheDocument();
    expect(screen.getByText('1 already in the trip')).toBeInTheDocument();
    expect(screen.queryByText('Into another trip')).toBeNull();
  });

  it('FE-AI-COLL-031: a copy into another trip carries no mark of this trip, only the flag', () => {
    const card = placesCard({ places: [savedPlace(), savedPlace({ id: 35, name: 'Le Comptoir' })], otherTrip: true });
    draw([pending('copy_collection_places_to_trip', 'Septime, Le Comptoir', card)]);
    expect(screen.getByText('Into another trip')).toBeInTheDocument();
    expect(screen.queryByText(/already in the trip/)).toBeNull();
  });

  it('FE-AI-COLL-026: a list to delete shows what goes; a renamed label reads from its old name to its new one', () => {
    const removal = listsCard({ lists: [listRow({ placeCount: 12, memberCount: 2, change: 'remove' })] });
    draw([pending('delete_collection', 'Paris food', removal, 'genericRemove')]);
    expect(screen.getByText('Will be deleted')).toBeInTheDocument();
    expect(screen.getByText('12 places')).toBeInTheDocument();
    expect(screen.getByText('2 members')).toBeInTheDocument();
  });

  it('FE-AI-COLL-027: a renamed label reads from its old name to its new one with the places that carry it', () => {
    const label = {
      id: 51,
      name: 'Supper',
      color: '#2563eb',
      places: 3,
      change: 'rename' as const,
      before: { name: 'Dinner', color: '#2563eb' },
    };
    draw([pending('update_collection_label', 'Supper', placesCard({ places: [], labels: [label] }), 'genericUpdate')]);
    expect(screen.getByText('Dinner')).toHaveClass('line-through');
    expect(screen.getAllByText('Supper').length).toBeGreaterThan(0);
    expect(screen.getByText('On 3 places')).toBeInTheDocument();
  });

  it('FE-AI-COLL-028: past four facts the rest is counted', () => {
    const delta = emptyDelta({ fields: ['name', 'address', 'notes', 'link', 'photo'] });
    const card = placesCard({ places: [savedPlace({ delta })] });
    draw([pending('update_collection_place', 'Septime', card, 'genericUpdate')]);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('FE-AI-COLL-029: trip places saved to a list are trip places by nature, so no warning is given', () => {
    const louvre = savedPlace({ id: null, name: 'Louvre', inTripPlaceId: 6 });
    const card = placesCard({ places: [savedPlace({ id: null, inTripPlaceId: 5 }), louvre] });
    draw([pending('save_trip_places_to_collection', 'Septime, Louvre', card)]);
    expect(screen.getByText('2 places')).toBeInTheDocument();
    expect(screen.queryByText(/already in the trip/)).toBeNull();
  });

  it('FE-AI-COLL-030: a new order of the lists numbers them in turn', () => {
    const rome = listRow({ id: 13, name: 'Rome', change: 'order' });
    const order = listsCard({ lists: [rome, listRow({ id: 12, name: 'Paris food', change: 'order' })] });
    draw([pending('reorder_collections', 'Rome, Paris food', order, 'genericUpdate')]);
    expect(screen.getByText('1 Rome')).toBeInTheDocument();
    expect(screen.getByText('2 Paris food')).toBeInTheDocument();
  });
});
