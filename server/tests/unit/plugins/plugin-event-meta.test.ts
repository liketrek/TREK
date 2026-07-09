/**
 * pluginEventMeta (#plugins, event enrichment): derives the { entity, entityId } a
 * core event carries for subscribed plugins. entity = the family; entityId comes
 * ONLY from a per-family whitelist, so a non-entity id (e.g. a userId) can never
 * leak, and reorder/bulk/sub-entity payloads yield no id.
 */
import { describe, it, expect } from 'vitest';
import { pluginEventMeta } from '../../../src/plugin-event-sink';

describe('pluginEventMeta', () => {
  it('reads the nested object id and the flat *Id key per family', () => {
    expect(pluginEventMeta('place:created', { place: { id: 7 } })).toEqual({ entity: 'place', entityId: 7 });
    expect(pluginEventMeta('place:deleted', { placeId: 12 })).toEqual({ entity: 'place', entityId: 12 });
    expect(pluginEventMeta('reservation:updated', { reservation: { id: 40 } })).toEqual({ entity: 'reservation', entityId: 40 });
    expect(pluginEventMeta('reservation:deleted', { reservationId: 40 })).toEqual({ entity: 'reservation', entityId: 40 });
    expect(pluginEventMeta('day:updated', { day: { id: 3 } })).toEqual({ entity: 'day', entityId: 3 });
    expect(pluginEventMeta('accommodation:deleted', { accommodationId: 9 })).toEqual({ entity: 'accommodation', entityId: 9 });
    expect(pluginEventMeta('file:created', { file: { id: 5 } })).toEqual({ entity: 'file', entityId: 5 });
    expect(pluginEventMeta('assignment:created', { assignment: { id: 30 } })).toEqual({ entity: 'assignment', entityId: 30 });
    expect(pluginEventMeta('packing:deleted', { itemId: 2 })).toEqual({ entity: 'packing', entityId: 2 });
    expect(pluginEventMeta('budget:updated', { item: { id: 8 } })).toEqual({ entity: 'budget', entityId: 8 });
  });

  it('picks the ENTITY id, not a parent id and never a non-entity id', () => {
    // A day-note's own id is the note, not its parent day.
    expect(pluginEventMeta('dayNote:created', { dayId: 3, note: { id: 50 } })).toEqual({ entity: 'dayNote', entityId: 50 });
    expect(pluginEventMeta('dayNote:deleted', { noteId: 50, dayId: 3 })).toEqual({ entity: 'dayNote', entityId: 50 });
    // THE LEAK TEST: this event carries a userId — the mapper must surface itemId, NEVER userId.
    expect(pluginEventMeta('budget:member-paid-updated', { itemId: 8, userId: 99, paid: 1 })).toEqual({ entity: 'budget', entityId: 8 });
  });

  it('reads trip via `id` / `trip.id`', () => {
    expect(pluginEventMeta('trip:deleted', { id: 1 })).toEqual({ entity: 'trip', entityId: 1 });
    expect(pluginEventMeta('trip:updated', { trip: { id: 1 } })).toEqual({ entity: 'trip', entityId: 1 });
  });

  it('yields the family only (no entityId) for bare, reorder, bulk and sub-entity payloads', () => {
    expect(pluginEventMeta('reservation:created', {})).toEqual({ entity: 'reservation' }); // bare sibling (accommodation create)
    expect(pluginEventMeta('day:reordered', { orderedIds: [1, 2, 3] })).toEqual({ entity: 'day' });
    expect(pluginEventMeta('budget:reordered', { orderedCategories: ['a'] })).toEqual({ entity: 'budget' });
    expect(pluginEventMeta('reservation:positions', { positions: [], day_id: 3 })).toEqual({ entity: 'reservation' });
    expect(pluginEventMeta('budget:settlement-created', { settlement: { id: 2 } })).toEqual({ entity: 'budget' }); // sub-entity, not surfaced
    expect(pluginEventMeta('packing:bag-deleted', { bagId: 4 })).toEqual({ entity: 'packing' });
  });

  it('is pure + defensive: unknown family, empty/odd payloads never throw', () => {
    expect(pluginEventMeta('mystery:thing', { id: 5 })).toEqual({ entity: 'mystery' }); // family not whitelisted -> no id even if present
    expect(pluginEventMeta('place:created', {})).toEqual({ entity: 'place' });
    expect(pluginEventMeta('place:created', { place: null } as never)).toEqual({ entity: 'place' });
    expect(pluginEventMeta('place:created', { placeId: 'not-a-number' })).toEqual({ entity: 'place' });
    expect(pluginEventMeta('place:created', { placeId: '15' })).toEqual({ entity: 'place', entityId: 15 }); // numeric string coerced
    expect(pluginEventMeta('', {})).toBeUndefined();
  });
});
