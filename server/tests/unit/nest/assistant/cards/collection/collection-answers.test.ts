/**
 * ASTCOL-001 to ASTCOL-012: the cards the collections' reads draw beside the
 * answer, built from the tool's raw answer through the guarded registry, so
 * every card here also passed the card union and the size cap.
 */
import { answerCardOf, FOREIGN_ID_GROUPS } from '../../../../../../src/nest/assistant/cards/registry';
import { answerInput, card, collectionValue, itemsValue, savedPlace, TRIP_ID } from './collection-fixtures';
import type { CollectionListsCard, CollectionPlacesCard } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));

const places = (tool: string, args: Record<string, unknown>, value: unknown) =>
  answerCardOf(tool, answerInput(args, value)) as CollectionPlacesCard | null;
const lists = (tool: string, args: Record<string, unknown>, value: unknown) =>
  answerCardOf(tool, answerInput(args, value)) as CollectionListsCard | null;

describe('collection answer cards', () => {
  it('ASTCOL-001: a list read whole heads its card with its size, its people and its places per status', () => {
    const shown = places('get_collection', { collectionId: 12 }, collectionValue());
    expect(shown?.list).toEqual({
      id: 12,
      name: 'Paris food',
      color: '#e11d48',
      placeCount: 10,
      memberCount: 1,
      counts: { idea: 4, want: 1, visited: 5 },
    });
  });

  it('ASTCOL-002: eight places are shown and the rest counted, in the order the list keeps them', () => {
    const shown = places('get_collection', { collectionId: 12 }, collectionValue());
    expect(shown?.places).toHaveLength(8);
    expect(shown?.more).toBe(2);
    expect(shown?.places.map((place) => place.name).slice(0, 3)).toEqual(['Septime', 'Spot 1', 'Spot 2']);
  });

  it('ASTCOL-003: a saved place carries its status, labels, rating, own photo and the trip place it came from', () => {
    const [septime] = places('get_collection', { collectionId: 12 }, collectionValue())?.places ?? [];
    expect(septime).toEqual({
      id: 34,
      listId: 12,
      name: 'Septime',
      address: '80 Rue de Charonne',
      lat: 48.853,
      lng: 2.381,
      category: { name: 'Restaurant', icon: 'Utensils', color: '#f97316' },
      status: 'want',
      labelIds: [51, 52],
      rating: 4.5,
      ratingCount: 3,
      googlePlaceId: null,
      osmId: null,
      imageKey: 'septime.jpg',
      inTripPlaceId: 6,
      savedIn: [],
      delta: null,
    });
  });

  it('ASTCOL-004: only the labels the shown places carry are named, counted over the whole list', () => {
    const shown = places('get_collection', { collectionId: 12 }, collectionValue());
    expect(shown?.labels).toEqual([
      { id: 51, name: 'Dinner', color: '#2563eb', places: 2, change: 'none', before: null },
      { id: 52, name: 'Late', color: null, places: 1, change: 'none', before: null },
    ]);
  });

  it('ASTCOL-005: notes, phone numbers, links and the members addresses never reach the card; e-mails in names are masked', () => {
    const value = collectionValue(1);
    value.places[0] = savedPlace({ name: 'Dinner with anna@example.com' });
    const json = JSON.stringify(places('get_collection', { collectionId: 12 }, value));
    for (const secret of ['Ask for the counter', '+33 1', 'septime.example', 'maya@example.com', 'anna@example.com']) {
      expect(json).not.toContain(secret);
    }
    expect(json).toContain('Dinner with [hidden]');
  });

  it('ASTCOL-006: a photo on another host, a data address or a bad colour is left out; a place without a position has none', () => {
    const value = collectionValue(1);
    value.places[0] = savedPlace({
      image_url: 'https://evil.example/x.jpg',
      lat: null,
      lng: 200,
      category: { id: 9, name: 'Bar', icon: '<svg>', color: 'red' },
    });
    const [place] = places('get_collection', { collectionId: 12 }, value)?.places ?? [];
    const category = { name: 'Bar', icon: null, color: null };
    expect(place).toMatchObject({ imageKey: null, lat: null, lng: null, category });
    value.places[0] = savedPlace({ image_url: 'data:image/png;base64,AAAA' });
    expect(places('get_collection', { collectionId: 12 }, value)?.places[0]?.imageKey).toBeNull();
  });

  it('ASTCOL-007: a saved place is the trip place with the same Google id, or the one it was saved from in this trip', () => {
    const value = collectionValue(1);
    value.places[0] = savedPlace({ google_place_id: 'ChIJlouvre', source_place_id: null });
    expect(places('get_collection', { collectionId: 12 }, value)?.places[0]?.inTripPlaceId).toBe(5);
    value.places[0] = savedPlace({ source_trip_id: TRIP_ID + 1 });
    expect(places('get_collection', { collectionId: 12 }, value)?.places[0]?.inTripPlaceId).toBeNull();
    expect(card.places.has(6)).toBe(true);
  });

  it('ASTCOL-008: saved places asked for by id sit under their list when they share one, else under none', () => {
    const value = itemsValue([savedPlace(), savedPlace({ id: 35, name: 'Le Comptoir', label_ids: [] })]);
    const shown = places('get_collection_items', { placeIds: [34, 35] }, value);
    expect(shown?.list).toMatchObject({ id: 12, name: 'Paris food', counts: null });
    expect(shown?.labels.map((label) => [label.name, label.places])).toEqual([
      ['Dinner', null],
      ['Late', null],
    ]);
    const spread = itemsValue([savedPlace(), savedPlace({ id: 77, collection_id: 13, name: 'Elsewhere' })]);
    expect(places('get_collection_items', { placeIds: [34, 77] }, spread)?.list).toBeNull();
    expect(places('get_collection_items', { placeIds: [1] }, itemsValue([]))).toBeNull();
  });

  it('ASTCOL-009: the lists card holds the lists in order, then each invite with who sent it', () => {
    const value = {
      collections: [{ id: 12, name: 'Paris food', color: '#e11d48', place_count: 3, members: [] }],
      incomingInvites: [{ collection_id: 40, name: 'Rome', from: { id: 4, username: 'maya' } }],
    };
    expect(lists('list_collections', {}, value)?.lists).toEqual([
      {
        id: 12,
        name: 'Paris food',
        color: '#e11d48',
        placeCount: 3,
        memberCount: 0,
        counts: null,
        status: null,
        person: null,
        invite: false,
        change: 'none',
        before: null,
      },
      {
        id: 40,
        name: 'Rome',
        color: null,
        placeCount: null,
        memberCount: 0,
        counts: null,
        status: null,
        person: { id: 4, name: 'maya', avatarKey: null },
        invite: true,
        change: 'none',
        before: null,
      },
    ]);
    const many = { collections: Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `List ${i}` })) };
    expect(lists('list_collections', {}, many)).toMatchObject({ more: 2 });
    expect(lists('list_collections', {}, { collections: [], incomingInvites: [] })).toBeNull();
  });

  it('ASTCOL-010: where a place is saved reads as its lists with its status in each; saved nowhere draws nothing', () => {
    const value = {
      saved: true,
      lists: [
        { collection_id: 12, name: 'Paris food', color: '#e11d48', place_id: 34, status: 'visited', can_edit: true },
        { collection_id: 12, name: 'Paris food', color: '#e11d48', place_id: 35, status: 'idea', can_edit: true },
        { collection_id: 13, name: 'Later', place_id: 36, status: 'want', can_edit: false },
      ],
    };
    const shown = lists('find_place_in_collections', { name: 'Septime', lat: 48.8, lng: 2.3 }, value);
    expect(shown?.place).toBe('Septime');
    expect(shown?.lists.map((row) => [row.id, row.status, row.color])).toEqual([
      [12, 'visited', '#e11d48'],
      [13, 'want', null],
    ]);
    expect(lists('find_place_in_collections', { name: 'Septime' }, { saved: false, lists: [] })).toBeNull();
  });

  it('ASTCOL-011: who may be invited and the tools of other parts draw no collection card', () => {
    const users = { users: [{ id: 2, username: 'maya' }] };
    expect(answerCardOf('available_collection_users', answerInput({ collectionId: 12 }, users))).toBeNull();
    expect(answerCardOf('no_such_tool', answerInput({}, collectionValue()))).toBeNull();
  });

  it('ASTCOL-012: the collections place ids are their own, never a trip place', () => {
    expect(FOREIGN_ID_GROUPS.has('collections')).toBe(true);
  });
});
