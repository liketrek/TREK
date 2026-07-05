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
  'trips.getById',
  'trips.getPlaces',
  'trips.getReservations',
  'costs.getByTrip',
  'costs.listMine',
  'costs.create',
  'users.getById',
  'ws.broadcastToTrip',
  'ws.broadcastToUser',
] as const;
export type KnownMethod = (typeof KNOWN_METHODS)[number];

/** Which permission unlocks which method(s). The single source for the router. */
export const METHOD_PERMISSION: Record<KnownMethod, string> = {
  'db.exec': 'db:own',
  'db.query': 'db:own',
  'db.migrate': 'db:own',
  'trips.getById': 'db:read:trips',
  'trips.getPlaces': 'db:read:trips',
  'trips.getReservations': 'db:read:trips',
  'costs.getByTrip': 'db:read:costs',
  'costs.listMine': 'db:read:costs',
  'costs.create': 'db:write:costs',
  'users.getById': 'db:read:users',
  'ws.broadcastToTrip': 'ws:broadcast:trip',
  'ws.broadcastToUser': 'ws:broadcast:user',
};

/** All permission strings the host understands (unknown ones are rejected at activation). */
export const KNOWN_PERMISSIONS = [
  'db:own',
  'db:read:trips',
  'db:read:users',
  'db:read:costs',
  'db:write:costs',
  'ws:broadcast:trip',
  'ws:broadcast:user',
  'hook:photo-provider',
  'hook:calendar-source',
  'http:outbound',
] as const;

export function isKnownPermission(p: string): boolean {
  return (KNOWN_PERMISSIONS as readonly string[]).includes(p) || p.startsWith('http:outbound:');
}
