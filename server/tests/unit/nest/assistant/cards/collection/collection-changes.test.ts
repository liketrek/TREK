/**
 * ASTCOL-020 to ASTCOL-035: the change cards of the collections' writes, as
 * describeToolCall writes them (the card through the guarded registry, so it
 * passed the union), and the lookups they read first.
 */
import { loadFor, memoisedReader } from '../../../../../../src/nest/assistant/cards/card-context';
import { COLLECTION_CARDS } from '../../../../../../src/nest/assistant/cards/collection';
import type { CollectionLookup } from '../../../../../../src/nest/assistant/cards/collection/collection-load';
import { ASSISTANT_WRITE_TOOLS, TOOL_CARDS } from '../../../../../../src/nest/assistant/cards/registry';
import { describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { collectionValue, ctx, itemsValue, LABELS, savedPlace } from './collection-fixtures';
import {
  assistantChangePreviewSchema,
  type CollectionListsCard,
  type CollectionPlacesCard,
  type TrekCard,
} from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));

const NONE: CollectionLookup = { collection: null, target: null, items: null, membership: null, lists: null };

function preview(tool: string, args: Record<string, unknown>, loaded: Partial<CollectionLookup> | null = null) {
  return describeToolCall(tool, 'call_9', args, ctx, loaded ? { ...NONE, ...loaded } : null);
}

const placesOf = (card: TrekCard | null | undefined) => card as CollectionPlacesCard;
const listsOf = (card: TrekCard | null | undefined) => card as CollectionListsCard;

const COLLECTION_WRITES = Object.keys(COLLECTION_CARDS.tools).filter((tool) => COLLECTION_CARDS.tools[tool]?.write);

describe('collection change cards', () => {
  it('ASTCOL-020: every write of the collections describes empty arguments and a failed lookup in its own words', () => {
    const some = ['save_place_to_collection', 'copy_collection_places_to_trip', 'cancel_collection_invite'];
    expect(COLLECTION_WRITES).toEqual(expect.arrayContaining(some));
    expect(COLLECTION_WRITES.length).toBeGreaterThanOrEqual(19);
    for (const tool of COLLECTION_WRITES) {
      for (const loaded of [null, NONE]) {
        const shown = preview(tool, {}, loaded);
        expect(assistantChangePreviewSchema.safeParse(shown).success, tool).toBe(true);
        expect(shown).toMatchObject({ tool, domain: 'collections', placeIds: [], rows: [], dayId: null });
        expect(shown.verbKey).toBe(ASSISTANT_WRITE_TOOLS[tool]?.verbKey);
      }
    }
  });

  it('ASTCOL-021: a place to save shows its list, the status it gets, its category and the lists that hold it already', () => {
    const args = {
      collection_id: 12,
      name: 'Musée Rodin',
      google_place_id: 'ChIJlouvre',
      lat: 48.86,
      lng: 2.33,
      category_id: 3,
      status: 'want',
    };
    const membership = { saved: true, lists: [{ collection_id: 13, name: 'Later', place_id: 9, status: 'idea' }] };
    const shown = preview('save_place_to_collection', args, { collection: collectionValue(), membership });
    expect(shown.subject).toBe('Musée Rodin');
    const card = placesOf(shown.card);
    expect(card.list).toMatchObject({ id: 12, name: 'Paris food', counts: { idea: 4, want: 1, visited: 5 } });
    expect(card.places[0]).toEqual({
      id: null,
      listId: 12,
      name: 'Musée Rodin',
      address: null,
      lat: 48.86,
      lng: 2.33,
      category: { name: 'Sights', icon: null, color: null },
      status: 'want',
      labelIds: [],
      rating: null,
      ratingCount: 0,
      googlePlaceId: 'ChIJlouvre',
      osmId: null,
      imageKey: null,
      inTripPlaceId: 5,
      savedIn: [{ listId: 13, name: 'Later', status: 'idea' }],
      delta: null,
    });
    // Without the lookup the arguments still describe the place; it is an idea by default.
    const bare = placesOf(preview('save_place_to_collection', { collection_id: 12, name: 'Musée Rodin' }).card);
    expect(bare).toMatchObject({ list: null, places: [{ listId: 12, status: 'idea', savedIn: [] }] });
  });

  it('ASTCOL-022: a status change reads from the old status to the new one; a vote names the stars or that it goes', () => {
    const items = itemsValue([savedPlace()]);
    const status = placesOf(preview('set_collection_place_status', { placeId: 34, status: 'visited' }, { items }).card);
    expect(status.places[0]?.delta?.status).toEqual({ from: 'want', to: 'visited' });
    expect(status.list).toMatchObject({ id: 12, counts: null });
    const rated = placesOf(preview('rate_collection_place', { placeId: 34, rating: 4 }, { items }).card);
    expect(rated.places[0]?.delta?.rating).toEqual({ to: 4 });
    const cleared = placesOf(preview('rate_collection_place', { placeId: 34, rating: null }, { items }).card);
    expect(cleared.places[0]?.delta?.rating).toEqual({ to: null });
    const removed = preview('delete_collection_place', { placeId: 34 }, { items });
    expect(removed).toMatchObject({ subject: 'Septime', verbKey: 'genericRemove' });
    expect(placesOf(removed.card).places[0]?.delta?.removed).toBe(true);
  });

  it('ASTCOL-023: a change of a saved place names its fields, its labels as its own list allows them and the list it moves to', () => {
    const items = itemsValue([savedPlace()]);
    // In its own list: the labels asked for replace the ones it carries.
    const relabel = { placeId: 34, label_ids: [51, 53, 99] };
    const kept = placesOf(preview('update_collection_place', relabel, { items }).card);
    expect(kept.places[0]?.delta).toMatchObject({ labelsAdded: [53], labelsRemoved: [52], movedTo: null });
    // A move takes every label of the old list off and applies the new list's.
    const args = {
      placeId: 34,
      name: 'Septime Cave',
      notes: 'Wine bar next door',
      lat: 48.85,
      lng: 2.38,
      status: 'visited',
      label_ids: [51, 61, 99],
      collection_id: 13,
    };
    const brunch = { id: 61, collection_id: 13, name: 'Brunch', color: '#f59e0b' };
    const target = { collection: { id: 13, name: 'Later', members: [], labels: [brunch] }, places: [] };
    const shown = preview('update_collection_place', args, { items, target });
    expect(shown.subject).toBe('Septime Cave');
    const card = placesOf(shown.card);
    expect(card.places[0]?.delta).toEqual({
      status: { from: 'want', to: 'visited' },
      rating: null,
      labelsAdded: [61],
      labelsRemoved: [51, 52],
      fields: ['name', 'coordinates', 'notes'],
      movedTo: {
        id: 13,
        name: 'Later',
        color: null,
        placeCount: null,
        memberCount: 0,
        counts: { idea: 0, want: 0, visited: 0 },
      },
      removed: false,
    });
    expect(card.labels.map((label) => label.name)).toEqual(['Dinner', 'Late', 'Brunch']);
    // A move without labels still takes the old ones off.
    const bare = { placeId: 34, collection_id: 13 };
    const moved = placesOf(preview('update_collection_place', bare, { items, target }).card);
    expect(moved.places[0]?.delta).toMatchObject({ labelsAdded: [], labelsRemoved: [51, 52] });
  });

  it('ASTCOL-024: labels added or taken away are exactly the ones the service applies: its own list, a real change', () => {
    const items = itemsValue([savedPlace(), savedPlace({ id: 35, name: 'Le Comptoir', label_ids: [] })]);
    const add = { label_ids: [51, 53, 99], place_ids: [34, 35] };
    const added = placesOf(preview('assign_collection_labels', add, { items }).card);
    expect(added.places.map((place) => place.delta?.labelsAdded)).toEqual([[53], [51, 53]]);
    const args = { label_ids: [51, 53, 99], place_ids: [34, 35], remove: true };
    const taken = placesOf(preview('assign_collection_labels', args, { items }).card);
    expect(taken.places.map((place) => place.delta?.labelsRemoved)).toEqual([[51], []]);
    expect(taken.list).toMatchObject({ id: 12 });
    // A place with more labels than its card names: the change is worked out on all of them.
    const crowded = { items: itemsValue([savedPlace({ label_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 51] })]) };
    const removeArgs = { label_ids: [51], place_ids: [34], remove: true };
    const off = placesOf(preview('assign_collection_labels', removeArgs, crowded).card);
    expect(off.places[0]?.delta?.labelsRemoved).toEqual([51]);
    const on = placesOf(preview('assign_collection_labels', { label_ids: [51], place_ids: [34] }, crowded).card);
    expect(on.places[0]?.delta?.labelsAdded).toEqual([]);
  });

  it('ASTCOL-025: a copy into the trip marks the places the trip has already and flags another trip', () => {
    const items = itemsValue([savedPlace(), savedPlace({ id: 35, name: 'Le Comptoir', source_place_id: null })]);
    const shown = preview('copy_collection_places_to_trip', { trip_id: 7, place_ids: [34, 35, 36] }, { items });
    expect(shown).toMatchObject({ subject: 'Septime, Le Comptoir', placeIds: [] });
    const card = placesOf(shown.card);
    expect(card.places.map((place) => place.inTripPlaceId)).toEqual([6, null]);
    expect(card).toMatchObject({ more: 1, otherTrip: false });
    // Into another trip: what the chat's trip holds says nothing about that one.
    const other = { trip_id: 8, place_ids: [34] };
    const elsewhere = placesOf(preview('copy_collection_places_to_trip', other, { items }).card);
    expect(elsewhere.otherTrip).toBe(true);
    expect(elsewhere.places.map((place) => place.inTripPlaceId)).toEqual([null]);
  });

  it('ASTCOL-026: a list change shows the list: new, renamed with what it was, deleted with what goes, reordered', () => {
    const collection = collectionValue();
    const created = listsOf(preview('create_collection', { name: 'Rome', color: '#abc' }).card);
    expect(created.lists[0]).toMatchObject({ id: null, name: 'Rome', color: '#aabbcc', placeCount: 0, change: 'add' });
    const rename = { collectionId: 12, name: 'Paris eats' };
    const renamed = listsOf(preview('update_collection', rename, { collection }).card);
    expect(renamed.lists[0]).toMatchObject({
      name: 'Paris eats',
      change: 'update',
      before: { name: 'Paris food', color: '#e11d48' },
    });
    const deleted = preview('delete_collection', { collectionId: 12 }, { collection });
    expect(deleted).toMatchObject({ subject: 'Paris food', verbKey: 'genericRemove' });
    expect(listsOf(deleted.card).lists[0]).toMatchObject({ placeCount: 10, memberCount: 1, change: 'remove' });
    const lists = {
      collections: [
        { id: 12, name: 'A' },
        { id: 13, name: 'B' },
      ],
    };
    const order = preview('reorder_collections', { orderedIds: [13, 12] }, { lists });
    expect(order.subject).toBe('B, A');
    expect(listsOf(order.card).lists.map((row) => [row.name, row.change])).toEqual([
      ['B', 'order'],
      ['A', 'order'],
    ]);
  });

  it('ASTCOL-027: an invite joined, declined or withdrawn names the list and the person', () => {
    const invite = { collection_id: 40, name: 'Rome', from: { id: 4, username: 'maya' } };
    const lists = { collections: [], incomingInvites: [invite] };
    const joined = listsOf(preview('accept_collection_invite', { collectionId: 40 }, { lists }).card);
    expect(joined.lists[0]).toMatchObject({ id: 40, invite: true, change: 'join', person: { id: 4, name: 'maya' } });
    const declined = listsOf(preview('decline_collection_invite', { collectionId: 40 }, { lists }).card);
    expect(declined.lists[0]?.change).toBe('decline');
    const withdraw = { collectionId: 12, userId: 3 };
    const withdrawn = preview('cancel_collection_invite', withdraw, { collection: collectionValue() });
    const person = { id: 3, name: 'tom', avatarKey: null };
    expect(listsOf(withdrawn.card).lists[0]).toMatchObject({ change: 'withdraw', person });
  });

  it('ASTCOL-028: trip places saved to a list or marked across lists light their pins and show as the trip has them', () => {
    const args = { collectionId: 12, tripId: 7, placeIds: [5, 6, 99] };
    const saved = preview('save_trip_places_to_collection', args, { collection: collectionValue() });
    expect(saved).toMatchObject({ subject: 'Louvre, Septime (trip)', placeIds: [5, 6] });
    const shown = placesOf(saved.card).places.map((place) => [
      place.inTripPlaceId,
      place.imageKey,
      place.category?.name,
    ]);
    expect(shown).toEqual([
      [5, null, 'Sights'],
      [6, 'septime.jpg', undefined],
    ]);
    const marked = preview('set_collection_place_status_from_trip', { trip_id: 7, place_ids: [5], status: 'visited' });
    expect(marked.placeIds).toEqual([5]);
    const card = placesOf(marked.card);
    expect(card).toMatchObject({ list: null, everyList: true });
    expect(card.places[0]).toMatchObject({ status: 'visited', delta: { status: { from: null, to: 'visited' } } });
  });

  it('ASTCOL-029: a label created, renamed or deleted shows with its list and how many places carry it', () => {
    const collection = collectionValue();
    const items = { lists: [], places: [], labels: [LABELS[0]] };
    const brunch = { collection_id: 12, name: 'Brunch', color: '#ff0000' };
    const created = placesOf(preview('create_collection_label', brunch, { collection }).card);
    expect(created).toMatchObject({ list: { id: 12 }, places: [] });
    expect(created.labels).toEqual([
      { id: null, name: 'Brunch', color: '#ff0000', places: 0, change: 'add', before: null },
    ]);
    const supper = { labelId: 51, name: 'Supper' };
    const renamed = placesOf(preview('update_collection_label', supper, { collection, items }).card);
    expect(renamed.labels[0]).toEqual({
      id: 51,
      name: 'Supper',
      color: '#2563eb',
      places: 2,
      change: 'rename',
      before: { name: 'Dinner', color: '#2563eb' },
    });
    const removed = preview('delete_collection_label', { labelId: 51 }, { collection, items });
    expect(removed.subject).toBe('Dinner');
    expect(placesOf(removed.card).labels[0]).toMatchObject({ change: 'remove', places: 2 });
  });

  it('ASTCOL-035: a short colour the forms accept reads as that colour, never as one taken away', () => {
    const collection = collectionValue();
    const recolour = listsOf(preview('update_collection', { collectionId: 12, color: '#e1d' }, { collection }).card);
    expect(recolour.lists[0]).toMatchObject({ color: '#ee11dd', before: { color: '#e11d48' } });
    const same = listsOf(preview('update_collection', { collectionId: 12, name: 'Paris food' }, { collection }).card);
    expect(same.lists[0]).toMatchObject({ color: '#e11d48', before: null });
    const brunch = { collection_id: 12, name: 'Brunch', color: '#0f0' };
    const label = placesOf(preview('create_collection_label', brunch, { collection }).card);
    expect(label.labels[0]?.color).toBe('#00ff00');
  });

  it('ASTCOL-030: a saved place 5 is never the trip place 5: the subject is the saved place, no pin lights up', () => {
    const items = itemsValue([savedPlace({ id: 5, name: 'Septime' })]);
    const shown = preview('update_collection_place', { placeId: 5, status: 'visited' }, { items });
    expect(shown).toMatchObject({ subject: 'Septime', placeIds: [] });
    expect(preview('set_collection_place_status', { placeId: 5, status: 'visited' })).toMatchObject({
      subject: '',
      placeIds: [],
    });
    expect(ctx.card.places.get(5)?.name).toBe('Louvre');
  });
});

describe('collection lookups', () => {
  function reader() {
    const read = vi.fn(async (name: string, args: Record<string, unknown> = {}) => ({
      ok: true,
      value: { name, args },
    }));
    return { read, memo: memoisedReader({ read }) };
  }

  it('ASTCOL-031: a place to save reads its list and where it is saved; without an id or a position only its list', async () => {
    const { read, memo } = reader();
    const args = { collection_id: 12, name: 'Rodin', google_place_id: 'ChIJx', lat: 1, lng: 2 };
    const loaded = (await loadFor('save_place_to_collection', args, memo)) as CollectionLookup;
    expect(loaded.collection).toEqual({ name: 'get_collection', args: { collectionId: 12 } });
    expect(loaded.membership).toEqual({
      name: 'find_place_in_collections',
      args: { google_place_id: 'ChIJx', lat: 1, lng: 2 },
    });
    await loadFor('save_place_to_collection', { collection_id: 12, name: 'Rodin' }, memo);
    // The list is read once per turn, however many changes ask for it.
    expect(read.mock.calls.map(([name]) => name)).toEqual(['get_collection', 'find_place_in_collections']);
  });

  it('ASTCOL-032: a change of saved places reads them by id, a move its target, a label its list after the label', async () => {
    const { read, memo } = reader();
    await loadFor('update_collection_place', { placeId: 34, collection_id: 13 }, memo);
    const sixty = Array.from({ length: 60 }, (_, i) => i + 1);
    await loadFor('copy_collection_places_to_trip', { trip_id: 7, place_ids: sixty }, memo);
    await loadFor('reorder_collections', { orderedIds: [1] }, memo);
    expect(read.mock.calls).toEqual([
      ['get_collection_items', { placeIds: [34] }],
      ['get_collection', { collectionId: 13 }],
      ['get_collection_items', { placeIds: sixty.slice(0, 50) }],
      ['list_collections', {}],
    ]);
    const labelRead = vi.fn(async (name: string) =>
      name === 'get_collection_items' ? { labels: [{ id: 51, collection_id: 12 }] } : { collection: { id: 12 } },
    );
    const label = (await loadFor('delete_collection_label', { labelId: 51 }, labelRead)) as CollectionLookup;
    expect(labelRead.mock.calls).toEqual([
      ['get_collection_items', { labelIds: [51] }],
      ['get_collection', { collectionId: 12 }],
    ]);
    expect(label.collection).toEqual({ collection: { id: 12 } });
  });

  it('ASTCOL-033: a write with nothing to look up reads nothing', async () => {
    const { read, memo } = reader();
    expect(await loadFor('create_collection', { name: 'Rome' }, memo)).toBeNull();
    expect(await loadFor('set_collection_place_status_from_trip', { trip_id: 7, place_ids: [5] }, memo)).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });

  it('ASTCOL-034: a place photo the model chose is never sent: the image argument is taken away on save and change', () => {
    for (const tool of ['save_place_to_collection', 'update_collection_place']) {
      expect(TOOL_CARDS[tool]?.argPolicy?.stripped).toEqual(['image_url']);
    }
  });
});
