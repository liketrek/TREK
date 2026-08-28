/**
 * The host <-> plugin JSON-RPC wire protocol (#plugins, M1).
 *
 * PURE TYPES ONLY — this file must never import anything with runtime side
 * effects. It is loaded by BOTH the privileged host (parent process) and the
 * isolated plugin child, and the child must not transitively pull in db, config
 * or the websocket server. Keep it dependency-free.
 */

/**
 * The plugin-API surface version (#plugins, M4) — bumped on any breaking change to the
 * ctx methods / manifest shape a plugin author can rely on. Mirrored into every
 * manifest as `apiVersion`; the install and activation gates refuse a plugin declaring
 * a version newer than this one.
 */
export const PLUGIN_API_VERSION = 1;

export type PluginErrCode =
  | 'PERMISSION_DENIED' // a real method the plugin was not granted
  | 'UNKNOWN_METHOD' // not a method the host exposes at all
  | 'BAD_PARAMS' // params failed validation
  | 'RESOURCE_FORBIDDEN' // granted, but the acting user can't touch this resource
  | 'TIMEOUT'
  | 'PLUGIN_ERROR'
  | 'HOST_ERROR';

export interface RpcRequest {
  k: 'req';
  id: string;
  method: string;
  params: unknown;
}
export interface RpcResponse {
  k: 'res';
  id: string;
  ok: true;
  result: unknown;
}
export interface RpcError {
  k: 'res';
  id: string;
  ok: false;
  error: { code: PluginErrCode; message: string };
}
export interface RpcEvent {
  k: 'evt';
  topic: string;
  data: unknown;
}
export type Envelope = RpcRequest | RpcResponse | RpcError | RpcEvent;

/**
 * Every method the host CAN expose. The capability router registers only the
 * subset a plugin was granted; anything here but ungranted resolves to
 * PERMISSION_DENIED, anything not here at all resolves to UNKNOWN_METHOD.
 */
export const KNOWN_METHODS = [
  'db.exec',
  'db.query',
  'db.migrate',
  'db.tx',
  'trips.getById',
  'trips.getPlaces',
  'trips.getReservations',
  'trips.getDays',
  'trips.getAccommodations',
  'trips.listMine',
  'reservations.listMine',
  'reservations.create',
  'reservations.update',
  'reservations.delete',
  'accommodations.create',
  'accommodations.update',
  'accommodations.delete',
  'packing.list',
  'packing.create',
  'packing.update',
  'packing.delete',
  'packing.listBags',
  'packing.createBag',
  'packing.updateBag',
  'packing.deleteBag',
  'packing.setBagMembers',
  'files.list',
  'files.getContent',
  'files.create',
  'files.createLink',
  'files.update',
  'files.softDelete',
  'collab.listNotes',
  'collab.listPolls',
  'collab.listMessages',
  'collab.createNote',
  'collab.createPoll',
  'collab.votePoll',
  'collab.createMessage',
  'trips.addMember',
  'trips.removeMember',
  'trips.create',
  'journal.listMine',
  'journal.getEntries',
  'atlas.visited',
  'atlas.bucketList',
  'rates.get',
  'vacay.mine',
  'daynotes.list',
  'daynotes.create',
  'daynotes.update',
  'daynotes.delete',
  'collections.listMine',
  'collections.get',
  'collections.create',
  'collections.update',
  'collections.savePlace',
  'collections.copyToTrip',
  'collections.deletePlace',
  'atlas.markCountry',
  'atlas.unmarkCountry',
  'atlas.markRegion',
  'atlas.unmarkRegion',
  'atlas.createBucketItem',
  'atlas.deleteBucketItem',
  'vacay.toggleEntry',
  'vacay.toggleCompanyHoliday',
  'journal.createEntry',
  'journal.updateEntry',
  'journal.deleteEntry',
  'journal.createJourney',
  'journal.addEntryPhoto',
  'journal.deleteJourney',
  'weather.get',
  'categories.list',
  'tags.list',
  'tags.create',
  'tags.update',
  'tags.delete',
  'trips.members',
  'todos.list',
  'todos.create',
  'todos.update',
  'todos.delete',
  'costs.getByTrip',
  'costs.listMine',
  'costs.create',
  'costs.update',
  'costs.delete',
  'places.create',
  'places.update',
  'places.delete',
  'days.create',
  'days.update',
  'days.delete',
  'itinerary.assign',
  'itinerary.unassign',
  'trips.update',
  'meta.get',
  'meta.set',
  'meta.list',
  'meta.delete',
  'users.getById',
  'ws.broadcastToTrip',
  'ws.broadcastToUser',
  'notify.send',
  'ai.complete',
  'ai.extract',
  'oauth.getToken',
  'scheduler.set',
  'scheduler.cancel',
] as const;
export type KnownMethod = (typeof KNOWN_METHODS)[number];

/**
 * The three methods the router registers UNCONDITIONALLY (see rpc-host.ts, the block
 * after the last `if (has(...))`). `plugins.call` and `events.emit` are authorized by
 * the router's declared-dependency-edge check instead of by a grant, and `settings.get`
 * only ever returns THIS plugin's config for the acting user, so it needs none.
 *
 * They MUST stay disjoint from KNOWN_METHODS. Putting them there would give each one a
 * METHOD_PERMISSION row, and that table is what isAuditable (plugin-audit.ts) reads;
 * settings.get is deliberately the one unconditional method that is NOT audited. It
 * would also change the UNKNOWN_METHOD/PERMISSION_DENIED split documented above.
 */
export const UNCONDITIONAL_METHODS = ['plugins.call', 'events.emit', 'settings.get'] as const;
export type UnconditionalMethod = (typeof UNCONDITIONAL_METHODS)[number];

/** `true` only when the two unions share no member; otherwise `never`, which fails to compile. */
type AssertDisjoint<A extends string, B extends string> = [Extract<A, B>] extends [never] ? true : never;
/** Compile-time proof of the invariant the comment above states. */
export const UNCONDITIONAL_METHODS_ARE_DISJOINT: AssertDisjoint<UnconditionalMethod, KnownMethod> = true;

/** Which permission unlocks which method(s). The single source for the router. */
export const METHOD_PERMISSION = {
  'db.exec': 'db:own',
  'db.query': 'db:own',
  'db.migrate': 'db:own',
  'db.tx': 'db:own',
  'trips.getById': 'db:read:trips',
  'trips.getPlaces': 'db:read:trips',
  'trips.getReservations': 'db:read:trips',
  'trips.getDays': 'db:read:trips',
  'trips.getAccommodations': 'db:read:trips',
  'trips.listMine': 'db:read:trips',
  'reservations.listMine': 'db:read:trips',
  'reservations.create': 'db:write:reservations',
  'reservations.update': 'db:write:reservations',
  'reservations.delete': 'db:write:reservations',
  'accommodations.create': 'db:write:accommodations',
  'accommodations.update': 'db:write:accommodations',
  'accommodations.delete': 'db:write:accommodations',
  'packing.list': 'db:read:packing',
  'packing.create': 'db:write:packing',
  'packing.update': 'db:write:packing',
  'packing.delete': 'db:write:packing',
  // Intentional: bags are the write-side organizational structure of packing —
  // a read-only consumer uses packing.list; only bag-managing (write) plugins
  // need the bag tree. Moving this to db:read:packing would strip access from
  // every installed write-only plugin and force consent re-prompts.
  'packing.listBags': 'db:write:packing',
  'packing.createBag': 'db:write:packing',
  'packing.updateBag': 'db:write:packing',
  'packing.deleteBag': 'db:write:packing',
  'packing.setBagMembers': 'db:write:packing',
  'files.list': 'db:read:files',
  'files.getContent': 'db:read:files:content',
  'files.create': 'db:write:files',
  'files.createLink': 'db:write:files',
  'files.update': 'db:write:files',
  'files.softDelete': 'db:write:files',
  'collab.listNotes': 'db:read:collab',
  'collab.listPolls': 'db:read:collab',
  'collab.listMessages': 'db:read:collab',
  'collab.createNote': 'db:write:collab',
  'collab.createPoll': 'db:write:collab',
  'collab.votePoll': 'db:write:collab',
  'collab.createMessage': 'db:write:collab',
  'trips.addMember': 'db:write:members',
  'trips.removeMember': 'db:write:members',
  'trips.create': 'db:create:trips',
  'journal.listMine': 'db:read:journal',
  'journal.getEntries': 'db:read:journal',
  'atlas.visited': 'db:read:atlas',
  'atlas.bucketList': 'db:read:atlas',
  'rates.get': 'rates:read',
  'vacay.mine': 'db:read:vacay',
  'daynotes.list': 'db:read:daynotes',
  'daynotes.create': 'db:write:daynotes',
  'daynotes.update': 'db:write:daynotes',
  'daynotes.delete': 'db:write:daynotes',
  'collections.listMine': 'db:read:collections',
  'collections.get': 'db:read:collections',
  'collections.create': 'db:write:collections',
  'collections.update': 'db:write:collections',
  'collections.savePlace': 'db:write:collections',
  'collections.copyToTrip': 'db:write:collections',
  'collections.deletePlace': 'db:write:collections',
  'atlas.markCountry': 'db:write:atlas',
  'atlas.unmarkCountry': 'db:write:atlas',
  'atlas.markRegion': 'db:write:atlas',
  'atlas.unmarkRegion': 'db:write:atlas',
  'atlas.createBucketItem': 'db:write:atlas',
  'atlas.deleteBucketItem': 'db:write:atlas',
  'vacay.toggleEntry': 'db:write:vacay',
  'vacay.toggleCompanyHoliday': 'db:write:vacay',
  'journal.createEntry': 'db:write:journal',
  'journal.addEntryPhoto': 'db:write:journal',
  'journal.updateEntry': 'db:write:journal',
  'journal.deleteEntry': 'db:write:journal',
  'journal.createJourney': 'db:write:journal',
  'journal.deleteJourney': 'db:write:journal',
  'weather.get': 'weather:read',
  'categories.list': 'db:read:categories',
  'tags.list': 'db:read:tags',
  'tags.create': 'db:write:tags',
  'tags.update': 'db:write:tags',
  'tags.delete': 'db:write:tags',
  'trips.members': 'db:read:trips',
  'todos.list': 'db:read:todos',
  'todos.create': 'db:write:todos',
  'todos.update': 'db:write:todos',
  'todos.delete': 'db:write:todos',
  'costs.getByTrip': 'db:read:costs',
  'costs.listMine': 'db:read:costs',
  'costs.create': 'db:write:costs',
  'costs.update': 'db:write:costs',
  'costs.delete': 'db:write:costs',
  'places.create': 'db:write:places',
  'places.update': 'db:write:places',
  'places.delete': 'db:write:places',
  'days.create': 'db:write:days',
  'days.update': 'db:write:days',
  'days.delete': 'db:write:days',
  'itinerary.assign': 'db:write:itinerary',
  'itinerary.unassign': 'db:write:itinerary',
  'trips.update': 'db:write:trips',
  'meta.get': 'db:meta',
  'meta.set': 'db:meta',
  'meta.list': 'db:meta',
  'meta.delete': 'db:meta',
  'users.getById': 'db:read:users',
  'ws.broadcastToTrip': 'ws:broadcast:trip',
  'ws.broadcastToUser': 'ws:broadcast:user',
  'notify.send': 'notify:send',
  'ai.complete': 'ai:invoke',
  'ai.extract': 'ai:invoke',
  'oauth.getToken': 'oauth:client',
  // Scheduling a userless future callback is the same risk class as a cron job, so
  // it rides on the existing jobs:run grant (no new permission, no re-consent).
  'scheduler.set': 'jobs:run',
  'scheduler.cancel': 'jobs:run',
} as const satisfies Record<KnownMethod, KnownPermission>;

/** The permission METHOD_PERMISSION assigns to `M` — the data-source binding a
 *  @PluginMethod decorator argument is checked against. */
export type MethodPermission<M extends KnownMethod> = (typeof METHOD_PERMISSION)[M];

/** All permission strings the host understands (unknown ones are rejected at activation). */
export const KNOWN_PERMISSIONS = [
  'db:own',
  'db:read:trips',
  'db:read:users',
  'db:read:costs',
  'db:read:packing',
  'db:write:packing',
  'db:read:files',
  'db:read:files:content',
  'db:write:files',
  'db:read:collab',
  'db:write:collab',
  'db:write:members',
  'db:create:trips',
  'db:read:journal',
  'db:read:atlas',
  'rates:read',
  'db:read:vacay',
  'db:read:daynotes',
  'db:read:collections',
  'db:write:collections',
  'db:write:atlas',
  'db:write:vacay',
  'db:write:journal',
  'db:read:categories',
  'db:read:tags',
  'db:write:tags',
  'db:read:todos',
  'db:write:todos',
  'weather:read',
  'db:write:daynotes',
  'db:write:costs',
  'db:write:places',
  'db:write:days',
  'db:write:itinerary',
  'db:write:trips',
  'db:write:reservations',
  'db:write:accommodations',
  'db:meta',
  'ws:broadcast:trip',
  'ws:broadcast:user',
  'hook:photo-provider',
  'hook:calendar-source',
  'hook:place-detail-provider',
  'hook:trip-warning-provider',
  'hook:table-contributor',
  'hook:map-marker-provider',
  'hook:map-layer-provider',
  'hook:route-provider',
  'hook:day-schedule-provider',
  'hook:day-tint-provider',
  'hook:pdf-section-provider',
  'hook:atlas-layer-provider',
  'hook:journal-entry-provider',
  'hook:trip-card-provider',
  'hook:notification-channel',
  // Data-subject-rights hook: the host calls the plugin's deleteUserData /
  // exportUserData when a TREK account is erased or its data is exported. Userless
  // (the plugin only receives a userId and acts on its OWN db), so it grants no
  // read into core data — it exists so a plugin can honour GDPR erasure/portability.
  'hook:user-data',
  'events:subscribe',
  'jobs:run',
  'http:outbound',
  'notify:send',
  'ai:invoke',
  'oauth:client',
  // Bridge-level permission (no RPC method): the plugin's sandboxed frames may ask
  // the HOST for the browser's geolocation over postMessage. The host reads the
  // position and posts plain data into the frame — the sandbox itself never gains
  // the geolocation API, and the browser's own site permission prompt still
  // applies. Nothing is sent to the server; the plugin's server code never sees a
  // position unless its own client ships it through one of its routes.
  'geolocation:read',
  // Lets the plugin publish tools on TREK's own MCP server, so an assistant can
  // call into it as the requesting user. Modelled on the hook:* family rather
  // than on geolocation:read above: the host dispatches INTO the child for
  // every call, so it needs the active-and-holds-the-grant check and the
  // acting-user binding that HOOK_PERMISSION gives it. The name has no hook:
  // prefix because the surface it opens is MCP, not a TREK render slot, and
  // nothing keys off that prefix.
  //
  // This is the real boundary on plugin tools. The user-facing plugins:use
  // OAuth scope only decides whether they are advertised to a client at all.
  'mcp:tools',
] as const;

/**
 * The union every permission-shaped value must live in. This closes an asymmetry:
 * KnownMethod was derived, this was not, so METHOD_PERMISSION's value side was a bare
 * `string` — 'db:read:trps' compiled fine and made the method unreachable forever.
 *
 * NOT usable for `http:outbound:<host>`: that family is open-ended by design and is
 * only ever checked through isKnownPermission below.
 */
export type KnownPermission = (typeof KNOWN_PERMISSIONS)[number];

/**
 * hooks.<key> -> the permission that must ALSO be granted for the host to ever call it.
 *
 * A plugin may only act as a provider for a hook it BOTH implements (reported by the
 * child at load) AND was granted the matching hook:* permission for. The child reports
 * Object.keys(def.hooks) with no knowledge of grants, so the grant check must happen
 * host-side.
 *
 * Moved here verbatim from supervisor/plugin-supervisor.ts, which had a byte-identical
 * copy, as did plugin-sdk/src/permissions.ts. The three were in sync, but a hook whose
 * permission is missing on one side fails SILENTLY in production - the plugin installs,
 * activates and then simply never gets called - so the duplication was a quiet outage
 * waiting to happen. `satisfies` is new enforcement on top: 'hook:typo-provider' used to
 * compile and leave the hook dead forever.
 */
export const HOOK_PERMISSION = {
  photoProvider: 'hook:photo-provider',
  calendarSource: 'hook:calendar-source',
  placeDetailProvider: 'hook:place-detail-provider',
  warningProvider: 'hook:trip-warning-provider',
  tableContributor: 'hook:table-contributor',
  mapMarkerProvider: 'hook:map-marker-provider',
  mapLayerProvider: 'hook:map-layer-provider',
  routeProvider: 'hook:route-provider',
  dayScheduleProvider: 'hook:day-schedule-provider',
  dayTintProvider: 'hook:day-tint-provider',
  pdfSectionProvider: 'hook:pdf-section-provider',
  atlasLayerProvider: 'hook:atlas-layer-provider',
  journalEntryProvider: 'hook:journal-entry-provider',
  tripCardProvider: 'hook:trip-card-provider',
  notificationChannel: 'hook:notification-channel',
  // The one entry whose permission is not hook:*-shaped; see mcp:tools in
  // KNOWN_PERMISSIONS. Being here is what buys it providersOf()'s grant check
  // and requireTotalCoverage's boot assertion.
  mcpToolProvider: 'mcp:tools',
} as const satisfies Record<string, KnownPermission>;

export type HookKey = keyof typeof HOOK_PERMISSION;
/** The hook:* permission HOOK_PERMISSION assigns to `H`. */
export type HookPermission<H extends HookKey> = (typeof HOOK_PERMISSION)[H];

/** Gates the GDPR handlers (deleteUserData / exportUserData). Not a hooks.* key. */
export const USER_DATA_PERMISSION = 'hook:user-data' satisfies KnownPermission;
/** Gates event subscriptions - without it the host delivers the plugin nothing. */
export const EVENTS_PERMISSION = 'events:subscribe' satisfies KnownPermission;
/** Gates jobs, and the ctx.scheduler timers that fire `scheduled`. */
export const JOBS_PERMISSION = 'jobs:run' satisfies KnownPermission;
/** Prefix of the host-scoped egress family. Deliberately NOT a KnownPermission -
 *  the host half is open-ended, so it is only ever checked by isKnownPermission. */
export const HTTP_OUTBOUND_PREFIX = 'http:outbound:';

export function isKnownPermission(p: string): boolean {
  return (KNOWN_PERMISSIONS as readonly string[]).includes(p) || p.startsWith('http:outbound:');
}
