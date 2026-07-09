// A tiny, dependency-free relay so the plugin runtime can receive core trip events
// without the websocket module (which pulls in `ws`) importing the plugins layer —
// and so tests that mock `./websocket` don't accidentally strip the sink. websocket
// calls emitPluginEvent for every CORE broadcast; the plugin runtime registers the
// sink in onModuleInit. Name-only + best-effort by design (see PluginSupervisor).

/** What a subscribed plugin learns about a core event beyond its name: the entity
 * family and, when known, WHICH entity changed. Never a user or the content — the
 * event handler still runs with no acting user, so the id is not dereferenceable. */
export interface PluginEventMeta {
  entity?: string;
  entityId?: number;
}

let sink: ((tripId: number, event: string, meta?: PluginEventMeta) => void) | null = null;

export function setPluginEventSink(fn: ((tripId: number, event: string, meta?: PluginEventMeta) => void) | null): void {
  sink = fn;
}

export function emitPluginEvent(tripId: number, event: string, meta?: PluginEventMeta): void {
  if (!sink) return;
  try {
    sink(tripId, event, meta);
  } catch {
    /* a plugin sink must never break a core broadcast */
  }
}

// The entity id lives at DIFFERENT payload keys per event family, so we key an
// EXPLICIT whitelist by family (`place:created` -> 'place') and try only its known
// id paths — never a "first id-looking field". This is what keeps a non-entity id
// from leaking: e.g. `budget:member-paid-updated` carries { itemId, userId } and we
// deliberately only read itemId, never userId. Families not listed (settlement/bag
// sub-entities, reorders, bulk position updates) yield no entityId, which is correct.
const ENTITY_ID_KEYS: Readonly<Record<string, readonly string[]>> = {
  place: ['placeId', 'place.id'],
  day: ['dayId', 'day.id'],
  reservation: ['reservationId', 'reservation.id'],
  accommodation: ['accommodationId', 'accommodation.id'],
  budget: ['itemId', 'item.id'],
  packing: ['itemId', 'item.id'],
  dayNote: ['noteId', 'note.id'],
  file: ['fileId', 'file.id'],
  assignment: ['assignmentId', 'assignment.id'],
  trip: ['id', 'trip.id'], // trip:deleted carries { id }, trip:updated carries { trip }
};

function readPath(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes('.')) return obj[path];
  const [head, tail] = path.split('.');
  const sub = obj[head];
  return sub && typeof sub === 'object' ? (sub as Record<string, unknown>)[tail] : undefined;
}

function toEntityId(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * PURE + SYNCHRONOUS. Derive the {entity, entityId} a core event carries for
 * subscribed plugins. `entity` is the event family (before ':'); `entityId` comes
 * ONLY from the per-family whitelist above, so a non-entity id can never surface.
 * Must never throw — it runs inside the core broadcast fast-path.
 */
export function pluginEventMeta(eventType: string, payload: Record<string, unknown>): PluginEventMeta | undefined {
  const entity = eventType.split(':')[0];
  if (!entity) return undefined;
  const keys = ENTITY_ID_KEYS[entity];
  if (keys && payload && typeof payload === 'object') {
    for (const k of keys) {
      const id = toEntityId(readPath(payload, k));
      if (id !== undefined) return { entity, entityId: id };
    }
  }
  return { entity };
}
