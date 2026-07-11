/**
 * The host <-> plugin JSON-RPC wire protocol (#plugins, M1).
 *
 * PURE TYPES ONLY — this file must never import anything with runtime side
 * effects. It is loaded by BOTH the privileged host (parent process) and the
 * isolated plugin child, and the child must not transitively pull in db, config
 * or the websocket server. Keep it dependency-free.
 */

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

/** Which permission unlocks which method(s). The single source for the router. */
export const METHOD_PERMISSION: Record<KnownMethod, string> = {
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
};

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
] as const;

export function isKnownPermission(p: string): boolean {
  return (KNOWN_PERMISSIONS as readonly string[]).includes(p) || p.startsWith('http:outbound:');
}
