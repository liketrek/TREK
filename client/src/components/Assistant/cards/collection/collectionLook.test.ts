/**
 * FE-AI-COLL-001 to FE-AI-COLL-006
 *
 * The pure look of the collections in the chat: each write named by its
 * own action, what an applied change opens (a list, a saved place selected
 * in it, the trip place of a copy on the map), the reading steps, the
 * follow-ups only an editor is offered, and how cards of several reads lay
 * out as one.
 */
import type { AssistantApplied } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import {
  emptyDelta,
  LIST,
  listRow,
  listsCard,
  placesCard,
  savedPlace,
} from '../../../../../tests/helpers/collectionCards';
import { CARD_LOOKS, ENTITY_LOOK, STEP_LOOKS, TOOL_LABELS } from '../cardLooks';
import { avatarPlace, mergeListRows, mergePlacesCards, rowsShown } from './collectionCardModel';

const applied = (entity: AssistantApplied['entity'], ids: number[]): AssistantApplied => ({
  toolCallId: 'c1',
  entity,
  ids,
  dayId: null,
  undoUntil: null,
});

const WRITES = [
  'create_collection',
  'update_collection',
  'delete_collection',
  'reorder_collections',
  'save_place_to_collection',
  'save_trip_places_to_collection',
  'update_collection_place',
  'set_collection_place_status',
  'set_collection_place_status_from_trip',
  'rate_collection_place',
  'delete_collection_place',
  'copy_collection_places_to_trip',
  'create_collection_label',
  'update_collection_label',
  'delete_collection_label',
  'assign_collection_labels',
  'accept_collection_invite',
  'decline_collection_invite',
  'cancel_collection_invite',
];

describe('collection look', () => {
  it('FE-AI-COLL-001: every write of the collections is named by its own action', () => {
    for (const tool of WRITES) expect(TOOL_LABELS[tool]?.labelKey).toBe(`assistant.tool.${tool}`);
    expect(STEP_LOOKS.get_collection?.stepKey).toBe('assistant.step.readingList');
    expect(STEP_LOOKS.list_collections?.stepKey).toBe('assistant.step.lookingAtLists');
    expect(STEP_LOOKS.find_place_in_collections?.stepKey).toBe('assistant.step.checkingLists');
  });

  it('FE-AI-COLL-002: an applied list opens in Collections, unless the change deleted it or declined its invite', () => {
    const look = ENTITY_LOOK.collection;
    expect(look.openLabelKey).toBe('assistant.card.collection.openList');
    expect(look.open?.(applied('collection', [12]), null)).toEqual({ kind: 'page', path: '/collections/12' });
    const card = listsCard({ lists: [listRow({ id: 13 })] });
    expect(look.open?.(applied('collection', []), card)).toEqual({ kind: 'page', path: '/collections/13' });
    for (const change of ['remove', 'decline'] as const) {
      expect(look.open?.(applied('collection', [12]), listsCard({ lists: [listRow({ change })] }))).toBeNull();
    }
    expect(look.open?.(applied('collection', []), null)).toBeNull();
  });

  it('FE-AI-COLL-003: an applied saved place opens selected in its list; a removed one opens the list', () => {
    const look = ENTITY_LOOK.collection_place;
    const card = placesCard();
    expect(look.open?.(applied('collection_place', [34]), card)).toEqual({
      kind: 'page',
      path: '/collections/12?place=34',
    });
    const removed = placesCard({ places: [savedPlace({ delta: emptyDelta({ removed: true }) })] });
    expect(look.open?.(applied('collection_place', [34]), removed)).toEqual({ kind: 'page', path: '/collections/12' });
    expect(look.open?.(applied('collection_place', [34]), null)).toBeNull();
  });

  it('FE-AI-COLL-004: a saved place that is in the trip shows its trip place on the map; one that is not, nothing', () => {
    const look = ENTITY_LOOK.collection_place;
    const inTrip = placesCard({ places: [savedPlace({ inTripPlaceId: 6 })] });
    expect(look.onMap?.(applied('collection_place', [34]), inTrip)).toEqual({ placeId: 6, dayId: null });
    expect(look.onMap?.(applied('collection_place', [34]), placesCard())).toBeNull();
  });

  it('FE-AI-COLL-005: a list of saved places offers to plan with it, to editors only', () => {
    const followUps = CARD_LOOKS.collectionPlaces.followUps ?? [];
    expect(followUps.map((followUp) => [followUp.labelKey, followUp.edits])).toEqual([
      ['assistant.followUp.collectionToTrip', true],
      ['assistant.followUp.collectionDay', true],
    ]);
    expect(CARD_LOOKS.collectionLists.followUps).toBeUndefined();
  });

  it('FE-AI-COLL-006: a list read twice shows once, as read last; lists cards merge their rows by id', () => {
    const first = placesCard({ places: [savedPlace({ name: 'Old' })] });
    const other = placesCard({ list: { ...LIST, id: 13, name: 'Rome' } });
    const again = placesCard({ places: [savedPlace({ name: 'New' })] });
    const spread = placesCard({ list: null });
    const merged = mergePlacesCards([first, other, again, spread, spread]);
    expect(merged.map((card) => [card.list?.id ?? null, card.places[0]?.name])).toEqual([
      [12, 'New'],
      [13, 'Septime'],
      [null, 'Septime'],
      [null, 'Septime'],
    ]);
    const rows = mergeListRows([
      listsCard({ lists: [listRow({ id: 1, name: 'A' }), listRow({ id: 2, name: 'B' })], more: 2 }),
      listsCard({ lists: [listRow({ id: 2, name: 'B2' }), listRow({ id: 3, name: 'C' })], more: 1 }),
    ]);
    expect(rows.rows.map((row) => row.name)).toEqual(['A', 'B2', 'C']);
    expect(rows.more).toBe(3);
    expect([rowsShown('compact'), rowsShown('roomy'), rowsShown(undefined)]).toEqual([5, 8, 5]);
    expect(avatarPlace(savedPlace({ id: null, imageKey: 'a.jpg' }), -2)).toMatchObject({
      id: -2,
      image_url: '/uploads/places/a.jpg',
    });
  });
});
