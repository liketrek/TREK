// A tiny, dependency-free relay so the plugin runtime can receive core trip events
// without the websocket module (which pulls in `ws`) importing the plugins layer —
// and so tests that mock `./websocket` don't accidentally strip the sink. websocket
// calls emitPluginEvent for every CORE broadcast; the plugin runtime registers the
// sink in onModuleInit. Name-only + best-effort by design (see PluginSupervisor).

/** What a subscribed plugin learns about a core event beyond its name: the entity
 * family, WHICH entity changed when known, and — for plugins holding the matching
 * db:read:* grant (filtered per plugin at deliver time, see SNAPSHOT_GRANT) — a
 * whitelisted field snapshot of the changed entity. Never a user: the handler still
 * runs with no acting user, and the snapshot whitelist carries no user ids and no
 * secrets by construction. */
export interface PluginEventMeta {
  entity?: string;
  entityId?: number;
  snapshot?: Record<string, unknown>;
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

// Which db:read:* grant entitles a plugin to an event family's snapshot. The
// supervisor filters PER PLUGIN at deliver time: no grant, no snapshot — the
// plugin then gets exactly the old {entity, entityId} hint.
export const SNAPSHOT_GRANT: Readonly<Record<string, string>> = {
  place: 'db:read:trips',
  day: 'db:read:trips',
  reservation: 'db:read:trips',
  accommodation: 'db:read:trips',
  assignment: 'db:read:trips',
  trip: 'db:read:trips',
  budget: 'db:read:costs',
  packing: 'db:read:packing',
  dayNote: 'db:read:daynotes',
  file: 'db:read:files',
};

// Per-family snapshot whitelist: which payload key holds the changed entity and
// which of its fields may travel. EXPLICIT allowlists, like ENTITY_ID_KEYS — a
// field not named here never surfaces, so user ids (owner_id/paid_by/uploaded_by/
// participants/members), trips.feed_token and whatever a migration adds later stay
// out by construction. Delete events carry no object -> no snapshot, correct.
const ENTITY_SNAPSHOT: Readonly<Record<string, { key: string; fields: readonly string[] }>> = {
  place: { key: 'place', fields: ['id', 'trip_id', 'name', 'description', 'lat', 'lng', 'address', 'category_id', 'price', 'currency', 'place_time', 'end_time', 'duration_minutes', 'notes', 'image_url', 'website', 'phone', 'transport_mode'] },
  day: { key: 'day', fields: ['id', 'trip_id', 'day_number', 'date', 'title', 'notes'] },
  reservation: { key: 'reservation', fields: ['id', 'trip_id', 'day_id', 'end_day_id', 'place_id', 'assignment_id', 'title', 'accommodation_id', 'reservation_time', 'reservation_end_time', 'location', 'confirmation_number', 'notes', 'status', 'type', 'needs_review', 'endpoints'] },
  accommodation: { key: 'accommodation', fields: ['id', 'trip_id', 'place_id', 'start_day_id', 'end_day_id', 'check_in', 'check_in_end', 'check_out', 'confirmation', 'notes'] },
  budget: { key: 'item', fields: ['id', 'trip_id', 'category', 'name', 'total_price', 'persons', 'days', 'note', 'sort_order'] },
  packing: { key: 'item', fields: ['id', 'trip_id', 'name', 'checked', 'category', 'sort_order'] },
  dayNote: { key: 'note', fields: ['id', 'day_id', 'trip_id', 'text', 'time', 'icon', 'sort_order'] },
  file: { key: 'file', fields: ['id', 'trip_id', 'place_id', 'reservation_id', 'original_name', 'file_size', 'mime_type', 'description'] },
  assignment: { key: 'assignment', fields: ['id', 'day_id', 'place_id', 'order_index', 'notes', 'assignment_time', 'assignment_end_time'] },
  trip: { key: 'trip', fields: ['id', 'title', 'description', 'start_date', 'end_date', 'currency', 'cover_image', 'is_archived', 'reminder_days'] },
};

/** Pick the whitelisted fields of an event's entity object, or undefined when the
 * payload carries none (deletes, reorders, bulk ops) — never throws. A PRIVATE
 * packing item (#858) yields no snapshot at all: its core broadcast is scoped to
 * the owner's sockets, and a snapshot would hand it to every subscribed plugin. */
function entitySnapshot(entity: string, payload: Record<string, unknown>): Record<string, unknown> | undefined {
  const spec = ENTITY_SNAPSHOT[entity];
  if (!spec || !payload || typeof payload !== 'object') return undefined;
  const obj = payload[spec.key];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  const row = obj as Record<string, unknown>;
  if (entity === 'packing' && row.is_private) return undefined;
  const out: Record<string, unknown> = {};
  for (const f of spec.fields) {
    if (row[f] !== undefined) out[f] = row[f];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

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
 * PURE + SYNCHRONOUS. Derive the {entity, entityId, snapshot} a core event carries
 * for subscribed plugins. `entity` is the event family (before ':'); `entityId`
 * comes ONLY from the per-family whitelist above, so a non-entity id can never
 * surface; `snapshot` are the whitelisted fields of the changed entity — the
 * supervisor strips it for plugins without the family's db:read:* grant.
 * Must never throw — it runs inside the core broadcast fast-path.
 */
export function pluginEventMeta(eventType: string, payload: Record<string, unknown>): PluginEventMeta | undefined {
  const entity = eventType.split(':')[0];
  if (!entity) return undefined;
  const snapshot = entitySnapshot(entity, payload);
  const keys = ENTITY_ID_KEYS[entity];
  if (keys && payload && typeof payload === 'object') {
    for (const k of keys) {
      const id = toEntityId(readPath(payload, k));
      if (id !== undefined) return snapshot ? { entity, entityId: id, snapshot } : { entity, entityId: id };
    }
  }
  return snapshot ? { entity, snapshot } : { entity };
}
