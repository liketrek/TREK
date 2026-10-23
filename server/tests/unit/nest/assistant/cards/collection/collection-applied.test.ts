/**
 * ASTCOL-040 to ASTCOL-049: what an applied change of the collections shows
 * in place of its preview, what its receipt names (the new places of a copy
 * only on the chat's own trip, the list a held card showed), and the way back
 * from a created list or a saved place.
 */
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import type { CollectionLookup } from '../../../../../../src/nest/assistant/cards/collection/collection-load';
import { appliedCardOf, ASSISTANT_UNDO_MAP, undoReadsOf } from '../../../../../../src/nest/assistant/cards/registry';
import { appliedChange, describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { collectionValue, ctx, itemsValue, savedPlace, TRIP_ID } from './collection-fixtures';
import type { CollectionListsCard, CollectionPlacesCard } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));

const NONE: CollectionLookup = { collection: null, target: null, items: null, membership: null, lists: null };

function previewOf(tool: string, args: Record<string, unknown>, loaded: Partial<CollectionLookup>) {
  return describeToolCall(tool, 'call_9', args, ctx, { ...NONE, ...loaded });
}

const SAVE = { collection_id: 12, name: 'Musée Rodin', google_place_id: 'ChIJlouvre', lat: 48.86, lng: 2.33 };
const MEMBERSHIP = { saved: true, lists: [{ collection_id: 13, name: 'Later', place_id: 9, status: 'idea' }] };

describe('applied collection cards', () => {
  it('ASTCOL-040: a saved place shows as saved, with its own id, keeping the trip place and the lists from the preview', () => {
    const preview = previewOf('save_place_to_collection', SAVE, {
      collection: collectionValue(),
      membership: MEMBERSHIP,
    });
    const rodin = { id: 77, name: 'Musée Rodin', status: 'idea', label_ids: [], source_place_id: null };
    const result = { place: savedPlace(rodin) };
    const card = appliedCardOf('save_place_to_collection', { args: SAVE, result, preview }) as CollectionPlacesCard;
    expect(card.list).toMatchObject({ id: 12, name: 'Paris food' });
    expect(card.places[0]).toMatchObject({
      id: 77,
      listId: 12,
      name: 'Musée Rodin',
      inTripPlaceId: 5,
      savedIn: [{ listId: 13, name: 'Later', status: 'idea' }],
    });
    expect(card.outcome).toBeNull();
  });

  it('ASTCOL-041: a save the service took for a duplicate keeps the preview and names the place it matched', () => {
    const preview = previewOf('save_place_to_collection', SAVE, { collection: collectionValue() });
    const result = { duplicate: true, duplicateOf: { id: 9, name: 'Rodin museum' } };
    const card = appliedCardOf('save_place_to_collection', { args: SAVE, result, preview }) as CollectionPlacesCard;
    expect(card.outcome).toEqual({ type: 'duplicate', name: 'Rodin museum' });
    expect(card.places[0]?.id).toBeNull();
  });

  it('ASTCOL-042: a changed place shows as it is now and keeps what the change did to it', () => {
    const args = { placeId: 34, status: 'visited' };
    const preview = previewOf('set_collection_place_status', args, { items: itemsValue([savedPlace()]) });
    const result = { place: savedPlace({ status: 'visited', updated_at: '2026-06-01 09:00:00' }) };
    const card = appliedCardOf('set_collection_place_status', { args, result, preview }) as CollectionPlacesCard;
    const delta = { status: { from: 'want', to: 'visited' } };
    expect(card.places[0]).toMatchObject({ id: 34, status: 'visited', delta });
    expect(appliedCardOf('set_collection_place_status', { args, result: { error: 'x' }, preview })).toBeNull();
  });

  it('ASTCOL-043: a copy says how many went in and which were there already; a status set across lists how many changed', () => {
    const args = { trip_id: 7, place_ids: [34, 35] };
    const items = itemsValue([savedPlace(), savedPlace({ id: 35, name: 'Le Comptoir', source_place_id: null })]);
    const preview = previewOf('copy_collection_places_to_trip', args, { items });
    const result = { copied: 1, skipped: [{ id: 34, name: 'Septime' }], created: [{ id: 900, source_id: 35 }] };
    const copied = appliedCardOf('copy_collection_places_to_trip', { args, result, preview }) as CollectionPlacesCard;
    expect(copied.outcome).toEqual({ type: 'copied', copied: 1, skipped: 1, skippedNames: ['Septime'] });
    // A copy into another trip keeps no mark of the chat's trip on its places.
    const elsewhere = { trip_id: 8, place_ids: [34] };
    const otherPreview = previewOf('copy_collection_places_to_trip', elsewhere, { items });
    const other = appliedCardOf('copy_collection_places_to_trip', {
      args: elsewhere,
      result: { copied: 1, skipped: [], created: [{ id: 950, source_id: 34 }] },
      preview: otherPreview,
    }) as CollectionPlacesCard;
    expect(other).toMatchObject({ otherTrip: true, outcome: { type: 'copied', copied: 1 } });
    expect(other.places.map((place) => place.inTripPlaceId)).toEqual([null]);
    const marked = { trip_id: 7, place_ids: [5], status: 'visited' };
    const statusPreview = previewOf('set_collection_place_status_from_trip', marked, {});
    const set = appliedCardOf('set_collection_place_status_from_trip', {
      args: marked,
      result: { updated: 3, places: 1 },
      preview: statusPreview,
    }) as CollectionPlacesCard;
    expect(set.outcome).toEqual({ type: 'statusSet', updated: 3, found: 1 });
  });

  it('ASTCOL-044: a created or renamed list and label show as the tool answered', () => {
    const created = appliedCardOf('create_collection', {
      args: { name: 'Rome' },
      result: { collection: { id: 44, name: 'Rome', color: '#6366f1', place_count: 0, members: [] } },
      preview: null,
    }) as CollectionListsCard;
    expect(created.lists[0]).toMatchObject({ id: 44, name: 'Rome', change: 'add', before: null });
    const rename = { collectionId: 12, name: 'Paris eats' };
    const preview = previewOf('update_collection', rename, { collection: collectionValue() });
    const renamed = appliedCardOf('update_collection', {
      args: rename,
      result: { collection: { id: 12, name: 'Paris eats', color: '#e11d48' } },
      preview,
    }) as CollectionListsCard;
    expect(renamed.lists[0]).toMatchObject({ name: 'Paris eats', change: 'update', before: { name: 'Paris food' } });
    const label = { collection_id: 12, name: 'Brunch' };
    const labelPreview = previewOf('create_collection_label', label, { collection: collectionValue() });
    const made = appliedCardOf('create_collection_label', {
      args: label,
      result: { label: { id: 60, collection_id: 12, name: 'Brunch', color: '#16a34a' } },
      preview: labelPreview,
    }) as CollectionPlacesCard;
    expect(made.labels[0]).toMatchObject({ id: 60, name: 'Brunch', color: '#16a34a', change: 'add' });
  });

  it('ASTCOL-045: a receipt names a list, a saved place, or the new trip places of a copy', () => {
    const receipt = (tool: string, args: Record<string, unknown>, result: unknown) =>
      appliedChange(tool, 'c', args, result, null, null, { preview: null, tripId: TRIP_ID });
    const made = receipt('create_collection', { name: 'Rome' }, { collection: { id: 44 } });
    expect(made).toMatchObject({ entity: 'collection', ids: [44] });
    expect(receipt('save_place_to_collection', SAVE, { place: { id: 77 } })).toMatchObject({
      entity: 'collection_place',
      ids: [77],
    });
    expect(receipt('delete_collection_place', { placeId: 34 }, { success: true })).toMatchObject({
      entity: 'collection_place',
      ids: [34],
    });
    const created = [
      { id: 900, source_id: 34 },
      { id: 901, source_id: 35 },
    ];
    const copy = receipt('copy_collection_places_to_trip', { trip_id: 7, place_ids: [34, 35] }, { copied: 2, created });
    expect(copy).toMatchObject({ entity: 'place', ids: [900, 901] });
    const kept = receipt('save_trip_places_to_collection', { collectionId: 12 }, { copied: 1 });
    expect(kept).toMatchObject({ entity: 'collection', ids: [12] });
  });

  it('ASTCOL-049: a copy into another trip names no places, and a change shown in one list names that list', () => {
    const created = [{ id: 950, source_id: 34 }];
    const copy = (tripId: number | null, into: number) => {
      const args = { trip_id: into, place_ids: [34] };
      const chat = { preview: null, tripId };
      return appliedChange('copy_collection_places_to_trip', 'c', args, { created }, null, null, chat)?.ids;
    };
    expect(copy(TRIP_ID, TRIP_ID)).toEqual([950]);
    // The map shows the chat's trip, where the places of another trip are not; a Studio chat has no trip.
    expect(copy(TRIP_ID, 8)).toEqual([]);
    expect(copy(null, TRIP_ID)).toEqual([]);

    // The held card showed the labels on Septime in list 12: the receipt opens that list.
    const labelled = { label_ids: [53], place_ids: [34] };
    const preview = previewOf('assign_collection_labels', labelled, { items: itemsValue([savedPlace()]) });
    const from = { preview, tripId: TRIP_ID };
    const receipt = appliedChange('assign_collection_labels', 'c', labelled, { success: true }, null, null, from);
    expect(receipt).toMatchObject({ entity: 'collection', ids: [12] });
    // Without the held card, or set across every list, the receipt names no list.
    expect(appliedChange('assign_collection_labels', 'c', labelled, {}, null, null)?.ids).toEqual([]);
    const marked = { trip_id: TRIP_ID, place_ids: [5], status: 'visited' };
    const across = previewOf('set_collection_place_status_from_trip', marked, {});
    const set = appliedChange('set_collection_place_status_from_trip', 'c', marked, {}, null, null, {
      preview: across,
      tripId: TRIP_ID,
    });
    expect(set?.ids).toEqual([]);
  });

  it('ASTCOL-046: a created list is taken back while it is empty, unshared and unchanged', () => {
    const result = { collection: { id: 44, name: 'Rome', color: '#6366f1', updated_at: '2026-06-01 10:00:00' } };
    expect(ASSISTANT_UNDO_MAP.create_collection?.tool).toBe('delete_collection');
    expect(ASSISTANT_UNDO_MAP.create_collection?.args({}, result, null)).toEqual({ collectionId: 44 });
    expect(undoReadsOf('create_collection', {}, result)).toEqual([
      { tool: 'get_collection', args: { collectionId: 44 } },
    ]);
    const owner = { user_id: 1, username: 'me', status: 'accepted', is_owner: true };
    const read = (over: Record<string, unknown>) => ({
      summary: {},
      places: {},
      reads: new Map([[readKey('get_collection', { collectionId: 44 }), { places: [], ...over }]]),
    });
    const same = { collection: { ...result.collection, members: [owner], labels: [] } };
    expect(unchangedSinceApplied('create_collection', result, read(same))).toBe(true);
    expect(unchangedSinceApplied('create_collection', result, read({ ...same, places: [savedPlace()] }))).toBe(false);
    const shared = { collection: { ...same.collection, members: [owner, { user_id: 2, is_owner: false }] } };
    expect(unchangedSinceApplied('create_collection', result, read(shared))).toBe(false);
    const renamed = { collection: { ...same.collection, name: 'Roma' } };
    expect(unchangedSinceApplied('create_collection', result, read(renamed))).toBe(false);
  });

  it('ASTCOL-047: a saved place is taken back while nobody changed, rated or labelled it; a duplicate has no way back', () => {
    const created = savedPlace({ id: 77, label_ids: [], ratings: [] });
    const result = { place: created };
    expect(ASSISTANT_UNDO_MAP.save_place_to_collection?.args(SAVE, result, null)).toEqual({ placeId: 77 });
    expect(ASSISTANT_UNDO_MAP.save_place_to_collection?.args(SAVE, { duplicate: true }, null)).toBeNull();
    const lists = [{ id: 12, can_delete: true }];
    const read = (place: Record<string, unknown>) => ({
      summary: {},
      places: {},
      reads: new Map([[readKey('get_collection_items', { placeIds: [77] }), { places: [place], lists }]]),
    });
    expect(unchangedSinceApplied('save_place_to_collection', result, read(created))).toBe(true);
    const visited = { ...created, status: 'visited' };
    expect(unchangedSinceApplied('save_place_to_collection', result, read(visited))).toBe(false);
    const rated = { ...created, ratings: [{ user_id: 2, rating: 5 }] };
    expect(unchangedSinceApplied('save_place_to_collection', result, read(rated))).toBe(false);
    const labelled = { ...created, label_ids: [51] };
    expect(unchangedSinceApplied('save_place_to_collection', result, read(labelled))).toBe(false);
    // One label swapped for another leaves the count as it was, and still counts as a change.
    const tagged = { place: { ...created, label_ids: [51] } };
    const swapped = { ...created, label_ids: [52] };
    expect(unchangedSinceApplied('save_place_to_collection', tagged, read(swapped))).toBe(false);
    const full = { place: { ...created, description: null, category_id: 9 } };
    expect(unchangedSinceApplied('save_place_to_collection', full, read(full.place))).toBe(true);
    for (const edit of [{ description: 'Sculptures' }, { category_id: 4 }, { image_url: '/uploads/places/x.jpg' }]) {
      expect(unchangedSinceApplied('save_place_to_collection', full, read({ ...full.place, ...edit }))).toBe(false);
    }
  });

  it('ASTCOL-048: an editor who saved a place to a list somebody else owns gets no way back, since only an admin removes', () => {
    const editorsSave = { place: savedPlace({ id: 78, owner_id: 2, saved_by: 1, label_ids: [], ratings: [] }) };
    expect(ASSISTANT_UNDO_MAP.save_place_to_collection?.args(SAVE, editorsSave, null)).toBeNull();
    const ownSave = { place: savedPlace({ id: 79, owner_id: 1, saved_by: 1, label_ids: [], ratings: [] }) };
    expect(ASSISTANT_UNDO_MAP.save_place_to_collection?.args(SAVE, ownSave, null)).toEqual({ placeId: 79 });
    // Should the right to remove have gone since, the check refuses before the delete would.
    const read = (canDelete: boolean) => ({
      summary: {},
      places: {},
      reads: new Map([
        [
          readKey('get_collection_items', { placeIds: [79] }),
          { places: [ownSave.place], lists: [{ id: 12, can_delete: canDelete }] },
        ],
      ]),
    });
    expect(unchangedSinceApplied('save_place_to_collection', ownSave, read(true))).toBe(true);
    expect(unchangedSinceApplied('save_place_to_collection', ownSave, read(false))).toBe(false);
  });
});
