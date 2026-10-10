/**
 * What a plugin receives back from the host, per RPC method.
 *
 * Before this table the entity reads handed plugins whatever the query produced,
 * mostly `SELECT t.*`, with credentials stripped by a denylist (`withoutFeedToken`).
 * Every column a migration added reached every plugin holding the read grant, and a
 * column rename became an unversioned break of a published API. The entity results
 * now go through an allowlist instead: the fields below are exactly what plugins
 * received when the contract was drawn, minus the credentials, and a new column stays
 * on the host until someone adds it here on purpose.
 *
 * The allowlist reaches into the rows a result carries as well. A derived key that
 * holds rows of another table (a day's `notes_items`, a reservation's `endpoints`)
 * names that child's entity in PLUGIN_ENTITY_NESTED, and the child is cut down to its
 * own field list the same way, however deep it sits. A derived key without an entry
 * there holds a value the host builds field by field (a count, `{ user_id, username }`
 * pairs, an id list), which cannot pick up a new column on its own.
 *
 * The plugin SDK publishes the same lists (`PLUGIN_ENTITY_FIELDS`,
 * `PLUGIN_ENTITY_NESTED`), generated from this file by
 * `server/scripts/gen-plugin-facts.ts`, and type-checks its own entity interfaces
 * against them. `tests/unit/plugins/output-contract.schema.test.ts` holds the column
 * lists to the migrated schema, so a new column fails CI until it is classified as
 * published or withheld.
 *
 * Pure data and one pure function, like envelope.ts: no imports with side effects.
 */
import type { KnownMethod, UnconditionalMethod } from './envelope';

export interface PluginEntityContract {
  /**
   * The table the rows are read from, or null for an envelope: an object the host
   * assembles around rows (`{ collections, incomingInvites }`), whose keys are all
   * `derived`.
   */
  readonly table: string | null;
  /** The table's columns a plugin receives, in the order the row carries them. */
  readonly columns: readonly string[];
  /** Columns a plugin never receives: credentials, whichever read path carries them. */
  readonly withheld: readonly string[];
  /**
   * True when the reads select the whole row (`t.*`), so every column of `table` has
   * to be listed in `columns` or `withheld` and the schema test enforces it. False
   * when every read names its columns, which keeps the rest out by construction.
   */
  readonly wholeRow: boolean;
  /** Keys the host adds on top of the row: joined names, counts, hydrated children. */
  readonly derived: readonly string[];
}

export const PLUGIN_ENTITY_CONTRACT = {
  trip: {
    table: 'trips',
    columns: [
      'id',
      'user_id',
      'title',
      'description',
      'start_date',
      'end_date',
      'currency',
      'cover_image',
      'is_archived',
      'reminder_days',
      'created_at',
      'updated_at',
      'reminder_sent_for',
    ],
    // The sole credential of the anonymous calendar feed.
    withheld: ['feed_token'],
    wholeRow: true,
    derived: ['day_count', 'place_count', 'is_owner', 'owner_username', 'shared_count'],
  },
  place: {
    table: 'places',
    columns: [
      'id',
      'trip_id',
      'name',
      'description',
      'lat',
      'lng',
      'address',
      'category_id',
      'price',
      'currency',
      'reservation_status',
      'reservation_notes',
      'reservation_datetime',
      'place_time',
      'end_time',
      'duration_minutes',
      'notes',
      'image_url',
      'google_place_id',
      'google_ftid',
      'website',
      'phone',
      'transport_mode',
      'created_at',
      'updated_at',
      'osm_id',
      'route_geometry',
      'route_color',
      'stop_type',
      'fill_percent',
      'amap_poi_id',
      'source',
      'email',
      'opening_hours',
    ],
    withheld: [],
    wholeRow: true,
    derived: [
      'category_name',
      'category_color',
      'category_icon',
      'tour_place_id',
      'category',
      'tags',
      'ratings',
      'rating_avg',
      'rating_count',
    ],
  },
  day: {
    table: 'days',
    columns: ['id', 'trip_id', 'day_number', 'date', 'notes', 'title', 'default_transport_mode'],
    withheld: [],
    wholeRow: true,
    derived: ['assignments', 'notes_items'],
  },
  reservation: {
    table: 'reservations',
    columns: [
      'id',
      'trip_id',
      'day_id',
      'end_day_id',
      'place_id',
      'assignment_id',
      'title',
      'accommodation_id',
      'reservation_time',
      'reservation_end_time',
      'location',
      'confirmation_number',
      'notes',
      'status',
      'type',
      'created_at',
      'metadata',
      'day_plan_position',
      'needs_review',
      'external_source',
      'external_id',
      'external_owner_user_id',
      'external_synced_at',
      'sync_enabled',
      'external_hash',
      'url',
      'ingest_state',
    ],
    withheld: [],
    wholeRow: true,
    derived: [
      'day_number',
      'place_name',
      'accommodation_place_id',
      'accommodation_name',
      'accommodation_start_day_id',
      'accommodation_end_day_id',
      'day_positions',
      'endpoints',
      'travelers',
    ],
  },
  packingItem: {
    table: 'packing_items',
    columns: [
      'id',
      'trip_id',
      'name',
      'checked',
      'category',
      'sort_order',
      'created_at',
      'weight_grams',
      'bag_id',
      'quantity',
      'updated_at',
      'is_private',
      'owner_id',
      'packed_quantity',
    ],
    withheld: [],
    wholeRow: true,
    derived: ['owner_username', 'recipients', 'contributors'],
  },
  tripFile: {
    table: 'trip_files',
    columns: [
      'id',
      'trip_id',
      'place_id',
      'reservation_id',
      'filename',
      'original_name',
      'file_size',
      'mime_type',
      'description',
      'created_at',
      'note_id',
      'uploaded_by',
      'starred',
      'deleted_at',
      'message_id',
    ],
    withheld: [],
    wholeRow: true,
    derived: [
      'reservation_title',
      'uploaded_by_name',
      'uploaded_by_avatar',
      'url',
      'linked_reservation_ids',
      'linked_place_ids',
      'linked_budget_item_ids',
    ],
  },
  budgetItem: {
    table: 'budget_items',
    columns: [
      'id',
      'trip_id',
      'category',
      'name',
      'total_price',
      'persons',
      'days',
      'note',
      'sort_order',
      'created_at',
      'paid_by_user_id',
      'expense_date',
      'reservation_id',
      'currency',
      'exchange_rate',
      'ticket_json',
      'place_id',
    ],
    withheld: [],
    wholeRow: true,
    derived: ['members', 'payers', 'receipts'],
  },
  assignment: {
    table: 'day_assignments',
    columns: [
      'id',
      'day_id',
      'place_id',
      'order_index',
      'notes',
      'assignment_time',
      'assignment_end_time',
      'end_day',
      'leg_transport_mode',
      'incoming_leg_transport_mode',
      'route_excluded',
      'accommodation_id',
      'created_at',
    ],
    withheld: [],
    // The assignment read model names its fields one by one, its `place` included.
    wholeRow: false,
    derived: ['participants', 'tour_place_id', 'tour_route_geometry', 'place'],
  },
  user: {
    table: 'users',
    columns: ['id', 'username', 'display_name', 'avatar'],
    // Everything else on the users table is account data or a credential, and the
    // two reads that return users (users.getById, trips.members) name these four.
    withheld: [],
    wholeRow: false,
    derived: [],
  },
  // A day's `notes_items` and the daynotes.* results.
  dayNote: {
    table: 'day_notes',
    columns: ['id', 'day_id', 'trip_id', 'text', 'time', 'icon', 'sort_order', 'created_at', 'color'],
    withheld: [],
    wholeRow: true,
    derived: [],
  },
  // A reservation's `endpoints`: the stops of a flight, train or car booking.
  reservationEndpoint: {
    table: 'reservation_endpoints',
    columns: [
      'id',
      'reservation_id',
      'role',
      'sequence',
      'name',
      'code',
      'lat',
      'lng',
      'timezone',
      'local_time',
      'local_date',
      'created_at',
    ],
    withheld: [],
    wholeRow: true,
    derived: [],
  },
  // The tags.* results and a place's `tags` (whose read names its columns, without
  // `user_id` on the compact projection).
  tag: {
    table: 'tags',
    columns: ['id', 'user_id', 'name', 'color', 'created_at'],
    withheld: [],
    wholeRow: true,
    derived: [],
  },
  todo: {
    table: 'todo_items',
    columns: [
      'id',
      'trip_id',
      'name',
      'checked',
      'category',
      'sort_order',
      'due_date',
      'description',
      'assigned_user_id',
      'priority',
      'created_at',
      'reminded_at',
    ],
    withheld: [],
    wholeRow: true,
    derived: [],
  },
  // trips.getAccommodations and accommodations.create/update.
  accommodation: {
    table: 'day_accommodations',
    columns: [
      'id',
      'trip_id',
      'place_id',
      'start_day_id',
      'end_day_id',
      'check_in',
      'check_in_end',
      'check_out',
      'confirmation',
      'notes',
      'created_at',
    ],
    withheld: [],
    wholeRow: true,
    derived: ['place_name', 'place_address', 'place_image', 'place_lat', 'place_lng', 'reservation_title'],
  },
  packingBag: {
    table: 'packing_bags',
    columns: ['id', 'trip_id', 'name', 'color', 'weight_limit_grams', 'sort_order', 'created_at', 'user_id'],
    withheld: [],
    wholeRow: true,
    derived: ['assigned_username', 'members', 'total_weight_grams'],
  },
  // files.createLink: the file's links after the new one was added.
  fileLink: {
    table: 'file_links',
    columns: ['id', 'file_id', 'reservation_id', 'assignment_id', 'place_id', 'created_at', 'budget_item_id'],
    withheld: [],
    wholeRow: true,
    derived: [],
  },
  collabNote: {
    table: 'collab_notes',
    columns: [
      'id',
      'trip_id',
      'user_id',
      'category',
      'title',
      'content',
      'color',
      'pinned',
      'created_at',
      'updated_at',
      'website',
    ],
    withheld: [],
    wholeRow: true,
    derived: ['username', 'avatar', 'avatar_url', 'attachments'],
  },
  // `options` is the column, delivered decoded with each option's voters.
  collabPoll: {
    table: 'collab_polls',
    columns: ['id', 'trip_id', 'user_id', 'question', 'options', 'multiple', 'closed', 'deadline', 'created_at'],
    withheld: [],
    wholeRow: true,
    derived: ['username', 'avatar', 'avatar_url', 'is_closed', 'multiple_choice'],
  },
  collabMessage: {
    table: 'collab_messages',
    columns: ['id', 'trip_id', 'user_id', 'text', 'reply_to', 'created_at', 'deleted'],
    withheld: [],
    wholeRow: true,
    derived: [
      'username',
      'avatar',
      'reply_text',
      'reply_username',
      'user_avatar',
      'avatar_url',
      'reactions',
      'attachments',
    ],
  },
  journey: {
    table: 'journeys',
    columns: [
      'id',
      'user_id',
      'title',
      'subtitle',
      'cover_gradient',
      'status',
      'created_at',
      'updated_at',
      'cover_image',
      'show_trip_tracks',
      'show_verdict',
      'show_mood',
      'show_weather',
      'status_override',
      'photo_location',
    ],
    withheld: [],
    wholeRow: true,
    derived: ['entry_count', 'photo_count', 'place_count', 'trip_date_min', 'trip_date_max'],
  },
  // `tags` and `pros_cons` are the columns, delivered decoded from their JSON.
  journalEntry: {
    table: 'journey_entries',
    columns: [
      'id',
      'journey_id',
      'source_trip_id',
      'source_place_id',
      'author_id',
      'type',
      'title',
      'story',
      'entry_date',
      'entry_time',
      'location_name',
      'location_lat',
      'location_lng',
      'mood',
      'weather',
      'tags',
      'visibility',
      'sort_order',
      'created_at',
      'updated_at',
      'pros_cons',
      'stats_excluded',
      'dismissed',
      'country_code',
      'source_assignment_id',
      'is_draft',
    ],
    withheld: [],
    wholeRow: true,
    derived: ['photos', 'source_trip_name'],
  },
  category: {
    table: 'categories',
    columns: ['id', 'name', 'color', 'icon', 'user_id', 'created_at'],
    withheld: [],
    wholeRow: true,
    derived: [],
  },
  bucketItem: {
    table: 'bucket_list',
    columns: [
      'id',
      'user_id',
      'name',
      'lat',
      'lng',
      'country_code',
      'notes',
      'created_at',
      'target_date',
      'visited_at',
      'visited_source',
      'region_code',
    ],
    withheld: [],
    wholeRow: true,
    derived: [],
  },
  // `links` is the column, delivered decoded.
  collection: {
    table: 'collections',
    columns: [
      'id',
      'owner_id',
      'name',
      'description',
      'color',
      'icon',
      'cover_image',
      'links',
      'sort_order',
      'created_at',
      'updated_at',
    ],
    withheld: [],
    wholeRow: true,
    derived: ['place_count', 'members', 'is_owner', 'labels'],
  },
  // collections.listMine. The invites are built field by field.
  collectionListing: {
    table: null,
    columns: [],
    withheld: [],
    wholeRow: false,
    derived: ['collections', 'incomingInvites'],
  },
  // collections.get. The saved places name their columns one by one.
  collectionDetail: {
    table: null,
    columns: [],
    withheld: [],
    wholeRow: false,
    derived: ['collection', 'places'],
  },
  vacayPlan: {
    table: 'vacay_plans',
    columns: [
      'id',
      'owner_id',
      'block_weekends',
      'holidays_enabled',
      'holidays_region',
      'school_holidays_enabled',
      'company_holidays_enabled',
      'carry_over_enabled',
      'created_at',
      'weekend_days',
      'week_start',
    ],
    withheld: [],
    wholeRow: true,
    derived: ['holiday_calendars'],
  },
  vacayHolidayCalendar: {
    table: 'vacay_holiday_calendars',
    columns: ['id', 'plan_id', 'type', 'region', 'label', 'color', 'sort_order'],
    withheld: [],
    wholeRow: true,
    derived: [],
  },
  // vacay.mine. The users and the invites are built from named columns.
  vacayPlanData: {
    table: null,
    columns: [],
    withheld: [],
    wholeRow: false,
    derived: ['plan', 'users', 'pendingInvites', 'incomingInvites', 'isOwner', 'isFused'],
  },
} as const satisfies Record<string, PluginEntityContract>;

export type PluginEntityName = keyof typeof PLUGIN_ENTITY_CONTRACT;

/**
 * The derived keys that hold rows of another entity, per entity: the value (one row or
 * a list of rows) is cut down to that entity's own fields, recursively. Every key here
 * is one of the entity's `derived` keys (a unit test holds that).
 */
export const PLUGIN_ENTITY_NESTED: { readonly [E in PluginEntityName]?: Readonly<Record<string, PluginEntityName>> } = {
  place: { tags: 'tag' },
  day: { assignments: 'assignment', notes_items: 'dayNote' },
  reservation: { endpoints: 'reservationEndpoint' },
  collectionListing: { collections: 'collection' },
  collectionDetail: { collection: 'collection' },
  vacayPlan: { holiday_calendars: 'vacayHolidayCalendar' },
  vacayPlanData: { plan: 'vacayPlan' },
};

/**
 * The output of one RPC method.
 *
 * - `entity`: rows of a published entity, allowlisted field by field.
 * - `host`: a value the host assembles itself (an acknowledgement, a model answer,
 *   a token) or data the plugin owns (its own database, its metadata, a peer's
 *   answer). There is no stored row behind it to leak.
 * - `readModel`: a domain read model shared with the REST route, passed through as
 *   the app returns it. Each one is built field by field from named columns (see the
 *   comments on the entries below), so no stored row passes through whole and a new
 *   column cannot reach it by itself. The SDK types these results as `unknown`.
 */
export type PluginMethodOutput =
  | { readonly kind: 'entity'; readonly entity: PluginEntityName; readonly many: boolean }
  | { readonly kind: 'host' }
  | { readonly kind: 'readModel' };

const row = (entity: PluginEntityName): PluginMethodOutput => ({ kind: 'entity', entity, many: false });
const rows = (entity: PluginEntityName): PluginMethodOutput => ({ kind: 'entity', entity, many: true });
const HOST: PluginMethodOutput = { kind: 'host' };
const READ_MODEL: PluginMethodOutput = { kind: 'readModel' };

/** One entry per wire method; the `satisfies` makes a method without an entry a compile error. */
export const PLUGIN_METHOD_OUTPUT = {
  'db.exec': HOST,
  'db.query': HOST,
  'db.migrate': HOST,
  'db.tx': HOST,
  'trips.getById': row('trip'),
  'trips.getPlaces': rows('place'),
  'trips.getReservations': rows('reservation'),
  'trips.getDays': rows('day'),
  'trips.getAccommodations': rows('accommodation'),
  'trips.listMine': rows('trip'),
  'reservations.listMine': rows('reservation'),
  'reservations.create': row('reservation'),
  'reservations.update': row('reservation'),
  'reservations.delete': HOST,
  'accommodations.create': row('accommodation'),
  'accommodations.update': row('accommodation'),
  'accommodations.delete': HOST,
  'packing.list': rows('packingItem'),
  'packing.create': row('packingItem'),
  'packing.update': row('packingItem'),
  'packing.delete': HOST,
  'packing.listBags': rows('packingBag'),
  'packing.createBag': row('packingBag'),
  'packing.updateBag': row('packingBag'),
  'packing.deleteBag': HOST,
  // The bag's members: user_id, username and avatar, selected by name.
  'packing.setBagMembers': READ_MODEL,
  'files.list': rows('tripFile'),
  'files.getContent': HOST,
  'files.create': row('tripFile'),
  'files.createLink': rows('fileLink'),
  'files.update': row('tripFile'),
  'files.softDelete': HOST,
  'collab.listNotes': rows('collabNote'),
  'collab.listPolls': rows('collabPoll'),
  'collab.listMessages': rows('collabMessage'),
  'collab.createNote': row('collabNote'),
  'collab.createPoll': row('collabPoll'),
  'collab.votePoll': row('collabPoll'),
  'collab.createMessage': row('collabMessage'),
  'trips.addMember': HOST,
  'trips.removeMember': HOST,
  'trips.create': row('trip'),
  'journal.listMine': rows('journey'),
  'journal.getEntries': rows('journalEntry'),
  // { countries, regions }: country and region codes selected by name.
  'atlas.visited': READ_MODEL,
  'atlas.bucketList': rows('bucketItem'),
  'rates.get': HOST,
  'vacay.mine': row('vacayPlanData'),
  'daynotes.list': rows('dayNote'),
  'daynotes.create': row('dayNote'),
  'daynotes.update': row('dayNote'),
  'daynotes.delete': HOST,
  'collections.listMine': row('collectionListing'),
  'collections.get': row('collectionDetail'),
  'collections.create': row('collection'),
  'collections.update': row('collection'),
  // { place } with the saved place's named columns, or { duplicate, duplicateOf: { id, name } }.
  'collections.savePlace': READ_MODEL,
  // { copied, skipped: [{ id, name }] }.
  'collections.copyToTrip': READ_MODEL,
  'collections.deletePlace': HOST,
  'atlas.markCountry': HOST,
  'atlas.unmarkCountry': HOST,
  'atlas.markRegion': HOST,
  'atlas.unmarkRegion': HOST,
  'atlas.createBucketItem': row('bucketItem'),
  'atlas.deleteBucketItem': HOST,
  // { action, fraction, kind }: what the toggle did.
  'vacay.toggleEntry': READ_MODEL,
  // { action, fraction }: what the toggle did.
  'vacay.toggleCompanyHoliday': READ_MODEL,
  'journal.createEntry': row('journalEntry'),
  // The gallery photo as linked to the entry, its columns selected by name.
  'journal.addEntryPhoto': READ_MODEL,
  'journal.updateEntry': row('journalEntry'),
  'journal.deleteEntry': HOST,
  'journal.createJourney': row('journey'),
  'journal.deleteJourney': HOST,
  'weather.get': HOST,
  'categories.list': rows('category'),
  'tags.list': rows('tag'),
  'tags.create': row('tag'),
  'tags.update': row('tag'),
  'tags.delete': HOST,
  'trips.members': rows('user'),
  'todos.list': rows('todo'),
  'todos.create': row('todo'),
  'todos.update': row('todo'),
  'todos.delete': HOST,
  'costs.getByTrip': rows('budgetItem'),
  'costs.listMine': rows('budgetItem'),
  'costs.create': row('budgetItem'),
  'costs.update': row('budgetItem'),
  'costs.delete': HOST,
  'places.create': row('place'),
  'places.update': row('place'),
  'places.delete': HOST,
  'days.create': row('day'),
  'days.update': row('day'),
  'days.delete': HOST,
  'itinerary.assign': row('assignment'),
  'itinerary.unassign': HOST,
  'trips.update': row('trip'),
  'meta.get': HOST,
  'meta.set': HOST,
  'meta.list': HOST,
  'meta.delete': HOST,
  'users.getById': row('user'),
  'ws.broadcastToTrip': HOST,
  'ws.broadcastToUser': HOST,
  'notify.send': HOST,
  'ai.complete': HOST,
  'ai.extract': HOST,
  'oauth.getToken': HOST,
  'scheduler.set': HOST,
  'scheduler.cancel': HOST,
  'plugins.call': HOST,
  'events.emit': HOST,
  'settings.get': HOST,
} as const satisfies Record<KnownMethod | UnconditionalMethod, PluginMethodOutput>;

/** The fields a plugin receives for `entity`: its published columns, then the derived keys. */
export function pluginEntityFields(entity: PluginEntityName): readonly string[] {
  const contract: PluginEntityContract = PLUGIN_ENTITY_CONTRACT[entity];
  return [...contract.columns, ...contract.derived];
}

const fieldSets = new Map<PluginEntityName, ReadonlySet<string>>();

function fieldSetOf(entity: PluginEntityName): ReadonlySet<string> {
  let fields = fieldSets.get(entity);
  if (!fields) {
    fields = new Set(pluginEntityFields(entity));
    fieldSets.set(entity, fields);
  }
  return fields;
}

/**
 * A copy of `value` holding only the published fields of `entity`, in the row's own
 * key order. A field that holds rows of another entity is cut down the same way;
 * every other value is passed on untouched. Anything that is not a plain row (null,
 * undefined, a primitive, an array) passes through as it is, so "not found" keeps its
 * wire form.
 */
function pickFields(value: unknown, entity: PluginEntityName): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  const fields = fieldSetOf(entity);
  const nested = PLUGIN_ENTITY_NESTED[entity];
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(value as Record<string, unknown>)) {
    if (!fields.has(key)) continue;
    const child = nested?.[key];
    out[key] = child ? shapeRows(field, child) : field;
  }
  return out;
}

/** A child value: one row or a list of rows of `entity`, each cut down to its fields. */
function shapeRows(value: unknown, entity: PluginEntityName): unknown {
  return Array.isArray(value) ? value.map((item) => pickFields(item, entity)) : pickFields(value, entity);
}

function outputOf(method: string): PluginMethodOutput | undefined {
  return (PLUGIN_METHOD_OUTPUT as Readonly<Record<string, PluginMethodOutput | undefined>>)[method];
}

/** Whether `method` returns published entity rows, i.e. whether its result is shaped. */
export function returnsEntity(method: string): boolean {
  return outputOf(method)?.kind === 'entity';
}

/** Applies the method's output contract to a handler's result. Unlisted methods pass through. */
export function shapePluginOutput(method: string, result: unknown): unknown {
  const output = outputOf(method);
  if (output?.kind !== 'entity') return result;
  if (output.many) return Array.isArray(result) ? result.map((item) => pickFields(item, output.entity)) : result;
  return pickFields(result, output.entity);
}
