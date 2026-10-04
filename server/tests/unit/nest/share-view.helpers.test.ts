import { describe, it, expect } from 'vitest';
import { isTravelBooking, travelOnly, withoutImages } from '../../../src/nest/share/share-view.helpers';

const snapshot = () => ({
  assignments: {
    1: [{ accommodation_id: null, place: { id: 10, image_url: 'a.jpg' } }, { accommodation_id: 5, place: { id: 20, image_url: 'b.jpg' } }],
    2: [{ accommodation_id: null, place: { id: 10, image_url: 'a.jpg' } }],
  },
  dayNotes: { 1: [{ id: 1 }] },
  places: [{ id: 10, image_url: 'a.jpg' }, { id: 20, image_url: 'b.jpg' }],
  reservations: [{ type: 'flight' }, { type: 'restaurant' }, { type: 'hotel' }, { type: 'cable_car' }, { type: null }],
});

describe('share view helpers (#1712)', () => {
  it('SHARE-VIEW-001: knows travel bookings from the rest', () => {
    expect(['flight', 'train', 'ferry', 'cable_car', 'hotel'].every(isTravelBooking)).toBe(true);
    expect(['restaurant', 'tour', 'event', 'parking', undefined, 3].some(isTravelBooking)).toBe(false);
  });

  it('SHARE-VIEW-002: travel only keeps the stay stops, the stay places and the travel bookings', () => {
    const out = travelOnly(snapshot(), new Set([20]));
    expect(out.assignments).toEqual({ 1: [{ accommodation_id: 5, place: { id: 20, image_url: 'b.jpg' } }] });
    expect(out.dayNotes).toEqual({});
    expect(out.places.map(p => p.id)).toEqual([20]);
    expect(out.reservations.map(r => r.type)).toEqual(['flight', 'hotel', 'cable_car']);
  });

  it('SHARE-VIEW-003: without images clears every photo and leaves the rest alone', () => {
    const data = snapshot();
    const out = withoutImages(data);
    expect(out.places.every(p => p.image_url === null)).toBe(true);
    expect(Object.values(out.assignments).flat().every(a => a.place?.image_url === null)).toBe(true);
    expect(out.reservations).toBe(data.reservations);
    expect(data.places[0].image_url).toBe('a.jpg');
  });
});
