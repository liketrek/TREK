import type { Described, PreviewContext, ToolArgs } from '../card-types';
import { argId, clipped, recordOf } from '../card-values';
import { Rows } from '../preview-format';
import { rowsOf } from '../undo-snapshot';
import { inviteRowOf, listsCard } from './collection-answers';
import { type CollectionLookup, NO_LOOKUP } from './collection-load';
import {
  carriedLabelIds,
  commonListId,
  emptyDelta,
  foundPlaces,
  itemListOf,
  itemsOf,
  labelIdSet,
  listLabelIds,
  namesOf,
  placeFromArgs,
  placeFromTrip,
  placesCard,
  tripPlaceIds,
  wholeList,
  type WholeList,
} from './collection-parts';
import {
  argText,
  colorOf,
  idsIn,
  labelOf,
  listOf,
  listRowOf,
  positiveId,
  statusArg,
  statusOf,
} from './collection-values';
import {
  COLLECTION_CARD_FIELDS,
  type CollectionCardDelta,
  type CollectionCardList,
  type CollectionCardPlace,
  type CollectionListRow,
  type TrekCard,
} from '@trek/shared';

/**
 * The change cards of the collections' writes: what a held call will do to a
 * list, a saved place or a label, from its arguments and what its lookup read
 * (collection-load.ts). Every describer reads `{}` arguments and a failed
 * lookup too; the card then shows what the arguments say, or nothing. The
 * words of the row stay plain (the subject, the tool's own label); the card
 * carries the facts. Only trip places light up on the map: a saved place's id
 * is never a trip place's.
 */

type Lookup = CollectionLookup | null;

interface CollectionChange {
  describe(ctx: PreviewContext, args: ToolArgs, loaded: Lookup): Described;
  change(ctx: PreviewContext, args: ToolArgs, loaded: Lookup): TrekCard | null;
}

function described(tool: string, subject: string | null, placeIds: number[] = []): Described {
  return { subject: subject ?? '', rows: new Rows(), dayId: null, placeIds, tool, domain: 'collections' };
}

function lookupOf(loaded: Lookup): CollectionLookup {
  return loaded ?? NO_LOOKUP;
}

/** The arguments of a saved place's change that name a field of it, by the card's field names. */
const FIELD_OF: Readonly<Record<string, (typeof COLLECTION_CARD_FIELDS)[number]>> = {
  name: 'name',
  address: 'address',
  lat: 'coordinates',
  lng: 'coordinates',
  description: 'description',
  notes: 'notes',
  category_id: 'category',
  links: 'link',
  image_url: 'photo',
};

function fieldsOf(args: ToolArgs): CollectionCardDelta['fields'] {
  const fields = Object.keys(args).flatMap((key) => (FIELD_OF[key] && args[key] !== undefined ? [FIELD_OF[key]] : []));
  return COLLECTION_CARD_FIELDS.filter((field) => fields.includes(field));
}

/** The lists a membership lookup found the place to save in already, at most three. */
function savedInOf(membership: unknown): CollectionCardPlace['savedIn'] {
  const found: CollectionCardPlace['savedIn'] = [];
  for (const row of rowsOf(recordOf(membership).lists)) {
    const listId = positiveId(row.collection_id);
    const name = clipped(row.name, 120);
    if (listId !== null && name && !found.some((saved) => saved.listId === listId)) {
      found.push({ listId, name, status: statusOf(row.status) });
    }
  }
  return found.slice(0, 3);
}

/** The names of the first trip places a call names, for its subject. */
function tripNames(ctx: PreviewContext, ids: readonly number[]): string {
  return namesOf(ids.slice(0, 3).flatMap((id) => ctx.card.places.get(id) ?? []));
}

/** The one saved place a change names, as its lookup found it. */
function currentPlace(ctx: PreviewContext, args: ToolArgs, loaded: Lookup): CollectionCardPlace | null {
  const placeId = argId(args, 'placeId');
  return placeId === null ? null : (foundPlaces(ctx, lookupOf(loaded), [placeId])[0] ?? null);
}

/**
 * The card of a change to one saved place, under its list; the place carries
 * what changes. `moreLabels` names labels of another list (the one it moves to).
 */
function onePlaceCard(
  loaded: Lookup,
  place: CollectionCardPlace | null,
  delta: CollectionCardPlace['delta'],
  moreLabels: unknown = null,
) {
  if (!place) return null;
  const items = itemsOf(lookupOf(loaded));
  const list = itemListOf(items.lists, place.listId);
  const pool = [...items.lists.flatMap((row) => rowsOf(row.labels)), ...rowsOf(moreLabels)];
  return placesCard(list, [{ ...place, delta }], pool);
}

/** A place change: its subject is the place, the card its list and what happens to it. */
function placeChange(tool: string, deltaOf: (args: ToolArgs, place: CollectionCardPlace) => CollectionCardDelta) {
  return {
    describe: (ctx, args, loaded) => described(tool, currentPlace(ctx, args, loaded)?.name ?? null),
    change: (ctx, args, loaded) => {
      const place = currentPlace(ctx, args, loaded);
      return place ? onePlaceCard(loaded, place, deltaOf(args, place)) : null;
    },
  } satisfies CollectionChange;
}

/** A change over several saved places, by the ids the call names. */
function manyPlaces(ctx: PreviewContext, args: ToolArgs, loaded: Lookup): CollectionCardPlace[] {
  return foundPlaces(ctx, lookupOf(loaded), idsIn(args.place_ids, 50));
}

/** Labels added to (or taken from) each place, as the service applies them: only its own list's, only a real change. */
function labelDeltaOf(ctx: PreviewContext, args: ToolArgs, loaded: Lookup): CollectionCardPlace[] {
  const lists = itemsOf(lookupOf(loaded)).lists;
  const asked = idsIn(args.label_ids, 50);
  const remove = args.remove === true;
  return manyPlaces(ctx, args, loaded).map((place) => {
    const own = listLabelIds(lists, place.listId);
    const carried = carriedLabelIds(lookupOf(loaded), place.id);
    const applicable = asked.filter((id) => own.has(id));
    const changed = remove
      ? applicable.filter((id) => carried.includes(id))
      : applicable.filter((id) => !carried.includes(id));
    const delta = emptyDelta(remove ? { labelsRemoved: changed.slice(0, 10) } : { labelsAdded: changed.slice(0, 10) });
    return { ...place, delta };
  });
}

/** A list row from the list a lookup read whole. */
function currentListRow(loaded: Lookup): WholeList {
  return wholeList(lookupOf(loaded).collection);
}

/** The user's lists as `list_collections` gave them, and the invites waiting. */
function userLists(loaded: Lookup): { own: CollectionCardList[]; invites: CollectionListRow[] } {
  const root = recordOf(lookupOf(loaded).lists);
  return {
    own: rowsOf(root.collections)
      .map((row) => listOf(row))
      .filter((list): list is CollectionCardList => list !== null),
    invites: rowsOf(root.incomingInvites)
      .map((row) => inviteRowOf(row))
      .filter((row): row is CollectionListRow => row !== null),
  };
}

function inviteFor(loaded: Lookup, args: ToolArgs): CollectionListRow | null {
  const id = argId(args, 'collectionId');
  return userLists(loaded).invites.find((row) => row.id === id) ?? null;
}

/** The label a change names, as its lookup found it, with its list read whole. */
function currentLabel(args: ToolArgs, loaded: Lookup) {
  const labelId = argId(args, 'labelId');
  const raw = itemsOf(lookupOf(loaded)).labels.find((label) => positiveId(label.id) === labelId);
  const whole = wholeList(lookupOf(loaded).collection);
  return { label: raw ? labelOf(raw, whole.places) : null, list: whole.list };
}

const LIST_CHANGES: Readonly<Record<string, CollectionChange>> = {
  create_collection: {
    describe: (_ctx, args) => described('create_collection', argText(args.name, 120)),
    change: (_ctx, args) => {
      const name = argText(args.name, 120);
      if (!name) return null;
      const list = { id: null, name, color: colorOf(args.color), placeCount: 0, memberCount: 0, counts: null };
      return listsCard([listRowOf(list, { change: 'add' })], null);
    },
  },
  update_collection: {
    describe: (_ctx, args, loaded) =>
      described('update_collection', argText(args.name, 120) ?? currentListRow(loaded).list?.name ?? null),
    change: (_ctx, args, loaded) => {
      const { list } = currentListRow(loaded);
      if (!list) return null;
      const name = argText(args.name, 120) ?? list.name;
      const color = args.color === undefined ? list.color : colorOf(args.color);
      const renamed = name !== list.name || color !== list.color;
      const before = renamed ? { name: list.name, color: list.color } : null;
      return listsCard([listRowOf({ ...list, name, color }, { change: 'update', before })], null);
    },
  },
  delete_collection: {
    describe: (_ctx, _args, loaded) => described('delete_collection', currentListRow(loaded).list?.name ?? null),
    change: (_ctx, _args, loaded) => {
      const { list } = currentListRow(loaded);
      return list ? listsCard([listRowOf(list, { change: 'remove' })], null) : null;
    },
  },
  reorder_collections: {
    describe: (_ctx, args, loaded) => {
      const { own } = userLists(loaded);
      const order = idsIn(args.orderedIds, 1000).map((id) => own.find((list) => list.id === id));
      return described('reorder_collections', namesOf(order.filter((list) => list !== undefined).slice(0, 3)));
    },
    change: (_ctx, args, loaded) => {
      const { own } = userLists(loaded);
      const rows = idsIn(args.orderedIds, 1000)
        .map((id) => own.find((list) => list.id === id))
        .filter((list): list is CollectionCardList => list !== undefined)
        .map((list) => listRowOf(list, { change: 'order' }));
      return rows.length > 0 ? listsCard(rows, null) : null;
    },
  },
  accept_collection_invite: {
    describe: (_ctx, args, loaded) => described('accept_collection_invite', inviteFor(loaded, args)?.name ?? null),
    change: (_ctx, args, loaded) => {
      const invite = inviteFor(loaded, args);
      return invite ? listsCard([{ ...invite, change: 'join' }], null) : null;
    },
  },
  decline_collection_invite: {
    describe: (_ctx, args, loaded) => described('decline_collection_invite', inviteFor(loaded, args)?.name ?? null),
    change: (_ctx, args, loaded) => {
      const invite = inviteFor(loaded, args);
      return invite ? listsCard([{ ...invite, change: 'decline' }], null) : null;
    },
  },
  cancel_collection_invite: {
    describe: (_ctx, _args, loaded) => described('cancel_collection_invite', currentListRow(loaded).list?.name ?? null),
    change: (_ctx, args, loaded) => {
      const { list, members } = currentListRow(loaded);
      if (!list) return null;
      const userId = argId(args, 'userId');
      const member = members.find((row) => positiveId(row.user_id) === userId);
      const name = clipped(member?.username, 80);
      const person = userId !== null && name ? { id: userId, name, avatarKey: null } : null;
      return listsCard([listRowOf(list, { change: 'withdraw', person })], null);
    },
  },
};

const PLACE_CHANGES: Readonly<Record<string, CollectionChange>> = {
  save_place_to_collection: {
    describe: (_ctx, args) => described('save_place_to_collection', argText(args.name, 120)),
    change: (ctx, args, loaded) => {
      const whole = wholeList(lookupOf(loaded).collection);
      const place = placeFromArgs(ctx, args, whole.list?.id ?? argId(args, 'collection_id'));
      if (!place) return null;
      return placesCard(whole.list, [{ ...place, savedIn: savedInOf(lookupOf(loaded).membership) }], whole.labels);
    },
  },
  save_trip_places_to_collection: {
    describe: (ctx, args) => {
      const ids = tripPlaceIds(ctx, args.placeIds);
      return described('save_trip_places_to_collection', tripNames(ctx, ids), ids);
    },
    change: (ctx, args, loaded) => {
      const whole = wholeList(lookupOf(loaded).collection);
      const ids = tripPlaceIds(ctx, args.placeIds);
      const listId = whole.list?.id ?? argId(args, 'collectionId');
      const places = ids
        .slice(0, 8)
        .map((id) => placeFromTrip(ctx, id, listId, 'idea'))
        .filter((place): place is CollectionCardPlace => place !== null);
      return places.length > 0 ? placesCard(whole.list, places, whole.labels, { total: ids.length }) : null;
    },
  },
  set_collection_place_status_from_trip: {
    describe: (ctx, args) => {
      const ids = tripPlaceIds(ctx, args.place_ids);
      return described('set_collection_place_status_from_trip', tripNames(ctx, ids), ids);
    },
    change: (ctx, args) => {
      const to = statusArg(args.status) ?? 'idea';
      const ids = tripPlaceIds(ctx, args.place_ids);
      const places = ids
        .slice(0, 8)
        .map((id) => placeFromTrip(ctx, id, null, to))
        .filter((place): place is CollectionCardPlace => place !== null)
        .map((place) => ({ ...place, delta: emptyDelta({ status: { from: null, to } }) }));
      return places.length > 0 ? placesCard(null, places, null, { total: ids.length, everyList: true }) : null;
    },
  },
  update_collection_place: {
    describe: (ctx, args, loaded) =>
      described('update_collection_place', argText(args.name, 120) ?? currentPlace(ctx, args, loaded)?.name ?? null),
    change: (ctx, args, loaded) => {
      const place = currentPlace(ctx, args, loaded);
      if (!place) return null;
      const to = statusArg(args.status);
      const moveTo = argId(args, 'collection_id');
      const moving = moveTo !== null && moveTo !== place.listId;
      const target = wholeList(lookupOf(loaded).target);
      // A move takes every label of the old list off; the labels asked for then come from the new list.
      const had = carriedLabelIds(lookupOf(loaded), place.id);
      const carried: number[] = moving ? [] : had;
      const allowed = moving ? labelIdSet(target.labels) : listLabelIds(itemsOf(lookupOf(loaded)).lists, place.listId);
      const wanted = args.label_ids === undefined ? null : idsIn(args.label_ids, 50).filter((id) => allowed.has(id));
      const dropped: number[] = moving ? had : wanted ? had.filter((id) => !wanted.includes(id)) : [];
      const delta = emptyDelta({
        status: to !== null && to !== place.status ? { from: place.status, to } : null,
        labelsAdded: wanted ? wanted.filter((id) => !carried.includes(id)).slice(0, 10) : [],
        labelsRemoved: dropped.slice(0, 10),
        fields: fieldsOf(args),
        movedTo: moving ? target.list : null,
      });
      return onePlaceCard(loaded, place, delta, moving ? target.labels : null);
    },
  },
  set_collection_place_status: placeChange('set_collection_place_status', (args, place) =>
    emptyDelta({ status: { from: place.status, to: statusArg(args.status) ?? 'idea' } }),
  ),
  rate_collection_place: placeChange('rate_collection_place', (args) => {
    const rating = typeof args.rating === 'number' && Number.isInteger(args.rating) ? args.rating : null;
    return emptyDelta({ rating: { to: rating !== null && rating >= 1 && rating <= 5 ? rating : null } });
  }),
  delete_collection_place: placeChange('delete_collection_place', () => emptyDelta({ removed: true })),
  assign_collection_labels: {
    describe: (ctx, args, loaded) =>
      described('assign_collection_labels', namesOf(manyPlaces(ctx, args, loaded).slice(0, 3))),
    change: (ctx, args, loaded) => {
      const places = labelDeltaOf(ctx, args, loaded);
      if (places.length === 0) return null;
      const items = itemsOf(lookupOf(loaded));
      const list = itemListOf(items.lists, commonListId(places));
      const pool = items.lists.flatMap((row) => rowsOf(row.labels));
      return placesCard(list, places, pool, { total: idsIn(args.place_ids, 1000).length });
    },
  },
  copy_collection_places_to_trip: {
    describe: (ctx, args, loaded) =>
      described('copy_collection_places_to_trip', namesOf(manyPlaces(ctx, args, loaded).slice(0, 3))),
    change: (ctx, args, loaded) => {
      const found = manyPlaces(ctx, args, loaded);
      if (found.length === 0) return null;
      const items = itemsOf(lookupOf(loaded));
      const tripId = argId(args, 'trip_id');
      const otherTrip = tripId !== null && tripId !== ctx.card.tripId;
      // Whether another trip has a place already is not known here: the chat's trip says nothing about it.
      const places = otherTrip ? found.map((place) => ({ ...place, inTripPlaceId: null })) : found;
      const pool = items.lists.flatMap((row) => rowsOf(row.labels));
      return placesCard(itemListOf(items.lists, commonListId(places)), places, pool, {
        total: idsIn(args.place_ids, 1000).length,
        otherTrip,
      });
    },
  },
};

const LABEL_CHANGES: Readonly<Record<string, CollectionChange>> = {
  create_collection_label: {
    describe: (_ctx, args) => described('create_collection_label', argText(args.name, 60)),
    change: (_ctx, args, loaded) => {
      const name = argText(args.name, 60);
      if (!name) return null;
      const label = { id: null, name, color: colorOf(args.color), places: 0, change: 'add' as const, before: null };
      return { ...placesCard(wholeList(lookupOf(loaded).collection).list, [], null), labels: [label] };
    },
  },
  update_collection_label: {
    describe: (_ctx, args, loaded) =>
      described('update_collection_label', argText(args.name, 60) ?? currentLabel(args, loaded).label?.name ?? null),
    change: (_ctx, args, loaded) => {
      const { label, list } = currentLabel(args, loaded);
      if (!label) return null;
      const name = argText(args.name, 60) ?? label.name;
      const color = args.color === undefined ? label.color : colorOf(args.color);
      const before = name !== label.name || color !== label.color ? { name: label.name, color: label.color } : null;
      const changed = { ...label, name, color, change: 'rename' as const, before };
      return { ...placesCard(list, [], null), labels: [changed] };
    },
  },
  delete_collection_label: {
    describe: (_ctx, args, loaded) =>
      described('delete_collection_label', currentLabel(args, loaded).label?.name ?? null),
    change: (_ctx, args, loaded) => {
      const { label, list } = currentLabel(args, loaded);
      return label ? { ...placesCard(list, [], null), labels: [{ ...label, change: 'remove' as const }] } : null;
    },
  },
};

/** Every held change of the collections with its card. */
export const COLLECTION_CHANGES: Readonly<Record<string, CollectionChange>> = {
  ...LIST_CHANGES,
  ...PLACE_CHANGES,
  ...LABEL_CHANGES,
};
