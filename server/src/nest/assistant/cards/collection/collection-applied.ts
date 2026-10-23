import type { AppliedFrom, ToolArgs, ToolCards, UndoSnapshot } from '../card-types';
import { argId, clipped, readKey, recordOf, type Row } from '../card-values';
import { rowsOf, same } from '../undo-snapshot';
import { listsCard } from './collection-answers';
import { colorOf, idsIn, listOf, listRowOf, positiveId, savedPlaceOf } from './collection-values';
import type {
  AssistantChangePreview,
  CollectionCardPlace,
  CollectionListsCard,
  CollectionPlacesCard,
  TrekCard,
} from '@trek/shared';

/**
 * What an applied change of the collections shows in place of its preview:
 * the saved place as it is now (its id, its own photo), what a copy or a
 * status set across lists did, the list or label as the tool answered. Each
 * builds on the stored preview card, so it needs no read, and keeps what only
 * the preview knew (the place in the trip, what the change did to it). Also:
 * the ids a receipt names, and the way back from a created list or a saved
 * place while nothing changed it since.
 */

type AppliedInput = { args: ToolArgs; result: unknown; preview: AssistantChangePreview | null };

/** The preview's card, when it is of the kind asked for. */
function previewCard<K extends TrekCard['kind']>(
  preview: AssistantChangePreview | null,
  kind: K,
): Extract<TrekCard, { kind: K }> | null {
  const card = preview?.card ?? null;
  return card?.kind === kind ? (card as Extract<TrekCard, { kind: K }>) : null;
}

/** The saved place a tool answered with, keeping what only the preview knew about it. */
function answeredPlace(result: unknown, before: CollectionCardPlace | undefined): CollectionCardPlace | null {
  const place = savedPlaceOf(recordOf(result).place, null);
  if (!place) return null;
  return {
    ...place,
    inTripPlaceId: before?.inTripPlaceId ?? null,
    savedIn: before?.savedIn ?? [],
    delta: before?.delta ?? null,
  };
}

/** A change of one saved place: the place as it is now, under the preview's list. */
function placeApplied({ result, preview }: AppliedInput): CollectionPlacesCard | null {
  const card = previewCard(preview, 'collectionPlaces');
  const place = answeredPlace(result, card?.places[0]);
  if (!place) return null;
  return {
    kind: 'collectionPlaces',
    list: card?.list ?? null,
    places: [place],
    more: 0,
    labels: card?.labels ?? [],
    outcome: null,
    everyList: false,
    otherTrip: false,
  };
}

function countOf(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? Math.min(value, 1_000_000) : 0;
}

/**
 * A copy (into a trip or into a list): how many went in and which were there
 * already. The outcome names the ones skipped, so the places no longer carry
 * the warning the preview gave.
 */
function copyApplied({ result, preview }: AppliedInput): CollectionPlacesCard | null {
  const card = previewCard(preview, 'collectionPlaces');
  if (!card) return null;
  const places = card.otherTrip ? card.places.map((place) => ({ ...place, inTripPlaceId: null })) : card.places;
  const skipped = rowsOf(recordOf(result).skipped);
  const skippedNames = skipped
    .map((row) => clipped(row.name, 120))
    .filter((name): name is string => name !== null)
    .slice(0, 5);
  return {
    ...card,
    places,
    outcome: { type: 'copied', copied: countOf(recordOf(result).copied), skipped: skipped.length, skippedNames },
  };
}

function savedApplied(input: AppliedInput): CollectionPlacesCard | null {
  const root = recordOf(input.result);
  if (root.duplicate !== true) return placeApplied(input);
  const card = previewCard(input.preview, 'collectionPlaces');
  const name = clipped(recordOf(root.duplicateOf).name, 120) ?? card?.places[0]?.name ?? null;
  return card && name ? { ...card, outcome: { type: 'duplicate', name } } : null;
}

function statusSetApplied({ result, preview }: AppliedInput): CollectionPlacesCard | null {
  const card = previewCard(preview, 'collectionPlaces');
  const root = recordOf(result);
  if (!card) return null;
  return { ...card, outcome: { type: 'statusSet', updated: countOf(root.updated), found: countOf(root.places) } };
}

/** A list the tool created or changed, as it answered; a change keeps what it was before. */
function listApplied(change: 'add' | 'update') {
  return ({ result, preview }: AppliedInput): CollectionListsCard | null => {
    const list = listOf(recordOf(result).collection);
    if (!list) return null;
    const before = previewCard(preview, 'collectionLists')?.lists[0]?.before ?? null;
    return listsCard([listRowOf(list, { change, before: change === 'update' ? before : null })], null);
  };
}

/** A label the tool created or changed, in place of the one the preview named. */
function labelApplied({ result, preview }: AppliedInput): CollectionPlacesCard | null {
  const card = previewCard(preview, 'collectionPlaces');
  const label = recordOf(recordOf(result).label);
  const name = clipped(label.name, 60);
  const shown = card?.labels[0];
  if (!card || !shown || !name) return null;
  const color = colorOf(label.color) ?? shown.color;
  return { ...card, labels: [{ ...shown, id: positiveId(label.id), name, color }] };
}

export const COLLECTION_APPLIED: Readonly<Partial<Record<string, (input: AppliedInput) => TrekCard | null>>> = {
  save_place_to_collection: savedApplied,
  update_collection_place: placeApplied,
  set_collection_place_status: placeApplied,
  rate_collection_place: placeApplied,
  copy_collection_places_to_trip: copyApplied,
  save_trip_places_to_collection: copyApplied,
  set_collection_place_status_from_trip: statusSetApplied,
  create_collection: listApplied('add'),
  update_collection: listApplied('update'),
  create_collection_label: labelApplied,
  update_collection_label: labelApplied,
};

type AppliedIds = (args: ToolArgs, result: unknown, from: AppliedFrom) => number[];

/** The list the held card showed the change in; none for a change across lists or without a card. */
const shownList: AppliedIds = (_args, _result, { preview }) =>
  idsOf(positiveId(previewCard(preview, 'collectionPlaces')?.list?.id));

/** The ids a receipt names where the answer does not name them under the usual keys. */
export const COLLECTION_APPLIED_IDS: Readonly<Partial<Record<string, AppliedIds>>> = {
  create_collection: (_args, result) => idsOf(positiveId(recordOf(recordOf(result).collection).id)),
  update_collection: (args) => idsOf(argId(args, 'collectionId')),
  delete_collection: (args) => idsOf(argId(args, 'collectionId')),
  save_trip_places_to_collection: (args) => idsOf(argId(args, 'collectionId')),
  accept_collection_invite: (args) => idsOf(argId(args, 'collectionId')),
  decline_collection_invite: (args) => idsOf(argId(args, 'collectionId')),
  cancel_collection_invite: (args) => idsOf(argId(args, 'collectionId')),
  create_collection_label: (args) => idsOf(argId(args, 'collection_id')),
  update_collection_label: (_args, result) => idsOf(positiveId(recordOf(recordOf(result).label).collection_id)),
  set_collection_place_status_from_trip: shownList,
  assign_collection_labels: shownList,
  delete_collection_label: shownList,
  // The new places of a copy into the chat's own trip, so "Show on map" opens the first of them; a copy
  // into another trip names none, since the map shows the chat's trip, where those places are not.
  copy_collection_places_to_trip: (args, result, { tripId }) =>
    tripId !== null && argId(args, 'trip_id') === tripId
      ? rowsOf(recordOf(result).created)
          .map((row) => positiveId(row.id))
          .filter((id): id is number => id !== null)
      : [],
};

function idsOf(id: number | null): number[] {
  return id === null ? [] : [id];
}

/** The id of what a create answered with under `key`, as it came (the read is made whatever it is). */
function createdId(result: unknown, key: string): unknown {
  return recordOf(recordOf(result)[key]).id;
}

/** What a read the undo made answered, by its tool and arguments. */
function readOf(snapshot: UndoSnapshot, tool: string, args: Row): Row {
  return recordOf(snapshot.reads.get(readKey(tool, args)));
}

/** A list the change created, still as it was: same name, no places, no labels, nobody else in it. */
function listUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const created = recordOf(recordOf(result).collection);
  const read = readOf(snapshot, 'get_collection', { collectionId: created.id });
  const current = recordOf(read.collection);
  if (positiveId(current.id) === null || current.id !== created.id) return false;
  const others = rowsOf(current.members).filter((member) => member.is_owner !== true);
  const labels = rowsOf(current.labels);
  return (
    same(created, current, ['name', 'color', 'updated_at']) &&
    rowsOf(read.places).length === 0 &&
    others.length === 0 &&
    labels.length === 0
  );
}

/** The fields of a saved place that must read as the save left them for the undo to remove it. */
const SAVED_FIELDS = [
  'name',
  'collection_id',
  'status',
  'updated_at',
  'lat',
  'lng',
  'address',
  'notes',
  'description',
  'category_id',
  'image_url',
] as const;

function sortedLabelIds(row: Row): string {
  const ids = idsIn(row.label_ids, 1000);
  return ids.sort((a, b) => a - b).join(',');
}

/**
 * A saved place the change created, still as it was: same fields, same list,
 * same labels, not rated since, in a list the user may still delete from.
 */
function placeUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const created = recordOf(recordOf(result).place);
  const read = readOf(snapshot, 'get_collection_items', { placeIds: [created.id] });
  const current = rowsOf(read.places).find((row) => row.id === created.id);
  if (!current) return false;
  const list = rowsOf(read.lists).find((row) => row.id === current.collection_id);
  return (
    list?.can_delete === true &&
    same(created, current, SAVED_FIELDS) &&
    rowsOf(current.ratings).length === rowsOf(created.ratings).length &&
    sortedLabelIds(current) === sortedLabelIds(created)
  );
}

/**
 * Whether the user who saved a place may remove it again: only a list's owner
 * or admin deletes, an editor only adds. The answer names who saved it and
 * whose list it is; an admin who is not the owner cannot be told apart from an
 * editor here, so the undo is offered to owners only.
 */
function saverOwnsList(place: Row): boolean {
  const savedBy = positiveId(place.saved_by);
  const owner = positiveId(place.owner_id);
  return savedBy === null || owner === null || savedBy === owner;
}

/** The way back from a created list: deleting it, while nothing was added to it or shared since. */
export const DELETE_CREATED_LIST: NonNullable<ToolCards['undo']> = {
  tool: 'delete_collection',
  args: (_args, result) => {
    const collectionId = positiveId(recordOf(recordOf(result).collection).id);
    return collectionId === null ? null : { collectionId };
  },
  reads: (_args, result) => [{ tool: 'get_collection', args: { collectionId: createdId(result, 'collection') } }],
  unchanged: listUnchanged,
};

/** The way back from a saved place: removing it while nobody changed, rated or labelled it since. */
export const DELETE_SAVED_PLACE: NonNullable<ToolCards['undo']> = {
  tool: 'delete_collection_place',
  args: (_args, result) => {
    const place = recordOf(recordOf(result).place);
    const placeId = positiveId(place.id);
    return placeId === null || !saverOwnsList(place) ? null : { placeId };
  },
  reads: (_args, result) => [{ tool: 'get_collection_items', args: { placeIds: [createdId(result, 'place')] } }],
  unchanged: placeUnchanged,
};
