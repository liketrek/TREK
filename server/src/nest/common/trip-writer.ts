import { DomainError } from './domain-error';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';

/**
 * How a trip write's realtime events leave on the surface that made it.
 *
 * A use case decides WHICH events a write sends and with WHAT payload, once for
 * every surface. The sink decides how they travel: REST skips the socket that
 * sent the request, MCP tags `_source: 'mcp'` and never lets a failed broadcast
 * fail the tool.
 */
export interface TripEventSink {
  /** An event the originating client already applied. `onlyUserIds` limits delivery to those users (a restricted item). */
  emit<E extends TrekWsTripEventName>(
    event: E,
    payload: TrekWsPayload<E>,
    onlyUserIds?: readonly number[] | null,
  ): void;
  /** An event every socket needs, the sender's included (the day-plan side of a booking). */
  emitAll<E extends TrekWsTripEventName>(event: E, payload: TrekWsPayload<E>): void;
}

/**
 * Who makes a trip write, from where. `surface` exists for the few payloads and
 * routings that have always differed between the two (each use is commented);
 * everything else a use case does is the same for both.
 */
export interface TripWriter {
  userId: number;
  /** The global role, for the permission check (`admin` passes every action). */
  role: string;
  /** REST's X-Socket-Id, handed on to follow-up writes that broadcast themselves. */
  socketId?: string;
  surface: 'rest' | 'mcp';
  events: TripEventSink;
}

/** The trip broadcast as RealtimeService implements it, without importing that domain. */
export type TripBroadcast = (
  tripId: number | string,
  event: string,
  payload: Record<string, unknown>,
  excludeSid?: number | string,
  onlyUserId?: number,
) => void;

/** REST's sink: skips the sender's socket, the call shapes the controllers always used. */
export function restTripEvents(
  broadcast: TripBroadcast,
  tripId: number | string,
  socketId: string | undefined,
): TripEventSink {
  return {
    emit(event, payload, onlyUserIds) {
      if (onlyUserIds == null) {
        broadcast(tripId, event, payload as Record<string, unknown>, socketId);
        return;
      }
      for (const uid of new Set(onlyUserIds)) {
        if (uid != null) broadcast(tripId, event, payload as Record<string, unknown>, socketId, uid);
      }
    },
    emitAll(event, payload) {
      broadcast(tripId, event, payload as Record<string, unknown>, undefined);
    },
  };
}

/**
 * A REST caller as a trip use case takes it. `realtime` is RealtimeService; its
 * overloads are typed per event, so it is taken here by its runtime shape and
 * called with exactly the arguments each emit passes (test doubles record arity).
 */
export function restTripWriter(
  realtime: { broadcast: unknown },
  tripId: number | string,
  user: { id: number; role: string },
  socketId: string | undefined,
): TripWriter {
  const broadcast = (realtime.broadcast as TripBroadcast).bind(realtime);
  return {
    userId: user.id,
    role: user.role,
    socketId,
    surface: 'rest',
    events: restTripEvents(broadcast, tripId, socketId),
  };
}

/** The trip a user cannot reach. REST's guard answers it first; MCP keeps its own wording. */
export const tripNotFound = () =>
  new DomainError(404, 'Trip not found', { mcpMessage: 'Trip not found or access denied.' });

/** The permission a user lacks on a trip they can see. */
export const tripPermissionDenied = () =>
  new DomainError(403, 'No permission', {
    mcpMessage: 'You do not have permission to perform this action on this trip.',
  });

/** What the trip gate needs, structurally, so the shared kernel imports no domain. */
interface TripGate {
  access: { findAccessible(tripId: number | string, userId: number): Promise<{ user_id: number } | undefined | null> };
  permissions: {
    checkPermission(
      action: string,
      role: string,
      tripUserId: number | null,
      userId: number,
      isMember: boolean,
    ): Promise<boolean>;
  };
}

/**
 * The trip-scoped write gate every surface shares: the trip must be visible to
 * the writer (404) and the writer must hold `action` on it (403). REST's
 * TripAccessGuard runs the same two checks before the handler, so on that
 * surface this never refuses; it is what MCP used to repeat in every tool.
 * The id goes to the lookup as given: a domain that coerced it before still does.
 */
export async function requireTripWrite(gate: TripGate, action: string, tripId: number | string, writer: TripWriter) {
  const trip = await gate.access.findAccessible(tripId, writer.userId);
  if (!trip) throw tripNotFound();
  const shared = trip.user_id !== writer.userId;
  if (!(await gate.permissions.checkPermission(action, writer.role, trip.user_id, writer.userId, shared))) {
    throw tripPermissionDenied();
  }
  return trip;
}
