import type { AnswerInput } from '../card-types';
import { clipped, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import {
  colorOf,
  listOf,
  listRowOf,
  MAX_LISTS,
  MAX_PLACES,
  positiveId,
  savedPlacesOf,
  statusOf,
  tally,
  usedLabels,
} from './collection-values';
import type { CollectionCardList, CollectionListRow, CollectionListsCard, CollectionPlacesCard } from '@trek/shared';

/**
 * The cards the collections' reads draw beside the answer: a list with its
 * first places (`get_collection`), saved places asked for by id
 * (`get_collection_items`), the user's lists with the invites waiting
 * (`list_collections`) and the lists a place is saved in
 * (`find_place_in_collections`). Who may be invited (`available_collection_users`)
 * stays a sentence: a list of user names says nothing a card would.
 */

/** A places card of `rows`, under `list` when one list holds them all. */
function placesCard(
  list: CollectionCardList | null,
  rows: readonly Row[],
  input: AnswerInput,
  labelPool: unknown,
  whole: readonly Row[] | null,
): CollectionPlacesCard | null {
  const places = savedPlacesOf(rows, input.card);
  if (!list && places.length === 0) return null;
  const shown = places.slice(0, MAX_PLACES);
  return {
    kind: 'collectionPlaces',
    list,
    places: shown,
    more: places.length - shown.length,
    labels: usedLabels(labelPool, shown, whole),
    outcome: null,
    everyList: false,
    otherTrip: false,
  };
}

/** One list read whole: its head with the places per status, its first places, the labels they carry. */
export function collectionAnswer(input: AnswerInput): CollectionPlacesCard | null {
  const root = recordOf(input.value);
  const collection = recordOf(root.collection);
  const places = rowsOf(root.places);
  const list = listOf(collection, tally(places));
  return list ? placesCard(list, places, input, collection.labels, places) : null;
}

/** Saved places asked for by id: under their list when they share one, labels named but not counted. */
export function itemsAnswer(input: AnswerInput): CollectionPlacesCard | null {
  const root = recordOf(input.value);
  const places = rowsOf(root.places);
  const lists = rowsOf(root.lists);
  const listIds = new Set(places.map((place) => positiveId(place.collection_id)));
  const only = listIds.size === 1 ? lists.find((row) => listIds.has(positiveId(row.id))) : undefined;
  const pool = lists.flatMap((row) => rowsOf(row.labels));
  return places.length > 0 ? placesCard(only ? listOf(only) : null, places, input, pool, null) : null;
}

/** The user's lists in their order, then the invites that wait for an answer. */
export function listsAnswer({ value }: AnswerInput): CollectionListsCard | null {
  const root = recordOf(value);
  const own = rowsOf(root.collections)
    .map((row) => listOf(row))
    .filter((list): list is CollectionCardList => list !== null)
    .map((list) => listRowOf(list));
  const invites = rowsOf(root.incomingInvites)
    .map((row) => inviteRowOf(row))
    .filter((row): row is CollectionListRow => row !== null);
  const rows = [...own, ...invites];
  if (rows.length === 0) return null;
  return listsCard(rows, null);
}

/** A lists card of `rows`, the ones past its bound counted. */
export function listsCard(rows: readonly CollectionListRow[], place: string | null): CollectionListsCard {
  const more = Math.max(0, rows.length - MAX_LISTS);
  return { kind: 'collectionLists', lists: rows.slice(0, MAX_LISTS), more, place };
}

/** An invite as a row: the list's name and who sent it; its size is not the invitee's to see. */
export function inviteRowOf(raw: unknown): CollectionListRow | null {
  const row = recordOf(raw);
  const id = positiveId(row.collection_id);
  const name = clipped(row.name, 120);
  if (id === null || !name) return null;
  const from = recordOf(row.from);
  const fromId = positiveId(from.id);
  const fromName = clipped(from.username, 80);
  return listRowOf(
    { id, name, color: null, placeCount: null, memberCount: 0, counts: null },
    { invite: true, person: fromId !== null && fromName ? { id: fromId, name: fromName, avatarKey: null } : null },
  );
}

/** Where a place is saved, with its status in each list; nothing when it is saved nowhere. */
export function membershipAnswer({ args, value }: AnswerInput): CollectionListsCard | null {
  const root = recordOf(value);
  if (root.saved !== true) return null;
  const seen = new Set<number>();
  const rows: CollectionListRow[] = [];
  for (const row of rowsOf(root.lists)) {
    const id = positiveId(row.collection_id);
    const name = clipped(row.name, 120);
    if (id === null || !name || seen.has(id)) continue;
    seen.add(id);
    const list = { id, name, color: colorOf(row.color), placeCount: null, memberCount: 0, counts: null };
    rows.push(listRowOf(list, { status: statusOf(row.status) }));
  }
  return rows.length > 0 ? listsCard(rows, clipped(args.name, 120)) : null;
}
