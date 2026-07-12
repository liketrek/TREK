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
    // nested-object payloads additionally yield a snapshot (covered below)
    expect(pluginEventMeta('place:created', { place: { id: 7 } })).toMatchObject({ entity: 'place', entityId: 7 });
    expect(pluginEventMeta('place:deleted', { placeId: 12 })).toEqual({ entity: 'place', entityId: 12 });
    expect(pluginEventMeta('reservation:updated', { reservation: { id: 40 } })).toMatchObject({ entity: 'reservation', entityId: 40 });
    expect(pluginEventMeta('reservation:deleted', { reservationId: 40 })).toEqual({ entity: 'reservation', entityId: 40 });
    expect(pluginEventMeta('day:updated', { day: { id: 3 } })).toMatchObject({ entity: 'day', entityId: 3 });
    expect(pluginEventMeta('accommodation:deleted', { accommodationId: 9 })).toEqual({ entity: 'accommodation', entityId: 9 });
    expect(pluginEventMeta('file:created', { file: { id: 5 } })).toMatchObject({ entity: 'file', entityId: 5 });
    expect(pluginEventMeta('assignment:created', { assignment: { id: 30 } })).toMatchObject({ entity: 'assignment', entityId: 30 });
    expect(pluginEventMeta('packing:deleted', { itemId: 2 })).toEqual({ entity: 'packing', entityId: 2 });
    expect(pluginEventMeta('budget:updated', { item: { id: 8 } })).toMatchObject({ entity: 'budget', entityId: 8 });
  });

  it('picks the ENTITY id, not a parent id and never a non-entity id', () => {
    // A day-note's own id is the note, not its parent day.
    expect(pluginEventMeta('dayNote:created', { dayId: 3, note: { id: 50 } })).toMatchObject({ entity: 'dayNote', entityId: 50 });
    expect(pluginEventMeta('dayNote:deleted', { noteId: 50, dayId: 3 })).toEqual({ entity: 'dayNote', entityId: 50 });
    // THE LEAK TEST: this event carries a userId — the mapper must surface itemId, NEVER userId.
    expect(pluginEventMeta('budget:member-paid-updated', { itemId: 8, userId: 99, paid: 1 })).toEqual({ entity: 'budget', entityId: 8 });
  });

  it('reads trip via `id` / `trip.id`', () => {
    expect(pluginEventMeta('trip:deleted', { id: 1 })).toEqual({ entity: 'trip', entityId: 1 });
    expect(pluginEventMeta('trip:updated', { trip: { id: 1 } })).toMatchObject({ entity: 'trip', entityId: 1 });
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

  describe('snapshot (wave 9)', () => {
    it('whitelists the entity fields of created/updated payloads', () => {
      const m = pluginEventMeta('day:updated', { day: { id: 3, trip_id: 7, day_number: 1, date: '2027-01-01', title: 'Kyoto', notes: 'x' } });
      expect(m?.snapshot).toEqual({ id: 3, trip_id: 7, day_number: 1, date: '2027-01-01', title: 'Kyoto', notes: 'x' });
      // reservations keep their endpoints (transport legs carry no user data)
      const r = pluginEventMeta('reservation:created', { reservation: { id: 40, title: 'Flight', endpoints: [{ role: 'from', name: 'HND' }] } });
      expect(r?.snapshot).toMatchObject({ id: 40, title: 'Flight', endpoints: [{ role: 'from', name: 'HND' }] });
    });

    it('never surfaces a user id, a foreign whitelist field or trips.feed_token', () => {
      // budget rows may arrive hydrated (paid_by/members/payers) — none of it travels
      const b = pluginEventMeta('budget:created', { item: { id: 8, name: 'Hotel', total_price: 100, paid_by: 99, members: [{ user_id: 99 }], payers: [99] } });
      expect(b?.snapshot).toEqual({ id: 8, name: 'Hotel', total_price: 100 });
      // the trip owner + the secret calendar feed token stay host-side
      const t = pluginEventMeta('trip:updated', { trip: { id: 1, title: 'Japan', user_id: 5, feed_token: 'sekret' } });
      expect(t?.snapshot).toEqual({ id: 1, title: 'Japan' });
      // files: uploaded_by / disk filename are not in the whitelist
      const f = pluginEventMeta('file:created', { file: { id: 5, original_name: 'visa.pdf', filename: 'ab12.pdf', uploaded_by: 9 } });
      expect(f?.snapshot).toEqual({ id: 5, original_name: 'visa.pdf' });
      // assignments: participants (user ids) never travel
      const a = pluginEventMeta('assignment:created', { assignment: { id: 30, day_id: 3, place_id: 7, participants: [{ user_id: 9 }] } });
      expect(a?.snapshot).toEqual({ id: 30, day_id: 3, place_id: 7 });
    });

    it('yields NO snapshot for a private packing item (#858) but keeps the id hint', () => {
      const priv = pluginEventMeta('packing:created', { item: { id: 70, name: 'Meds', is_private: 1, owner_id: 5 } });
      expect(priv).toEqual({ entity: 'packing', entityId: 70 });
      const pub = pluginEventMeta('packing:created', { item: { id: 71, name: 'Socks', is_private: 0 } });
      expect(pub?.snapshot).toEqual({ id: 71, name: 'Socks' }); // is_private itself isn't whitelisted either
    });

    it('yields no snapshot for deletes, reorders and unknown families', () => {
      expect(pluginEventMeta('place:deleted', { placeId: 12 })?.snapshot).toBeUndefined();
      expect(pluginEventMeta('day:reordered', { orderedIds: [1, 2] })?.snapshot).toBeUndefined();
      expect(pluginEventMeta('mystery:thing', { mystery: { id: 5 } })?.snapshot).toBeUndefined();
      // an array at the entity key is not an entity object
      expect(pluginEventMeta('place:created', { place: [1, 2] } as never)?.snapshot).toBeUndefined();
    });
  });
});
