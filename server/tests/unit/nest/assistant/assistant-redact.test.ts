/**
 * What tool answers carry to the provider: no contact details or booking
 * codes, no bulky pictures or geometry, the trip summary projected to the
 * plan, and anything too large cut down along its structure, never through
 * the middle of the JSON.
 */
import { fitToSize, toolOutputForProvider } from '../../../../src/nest/assistant/assistant-output';
import { redactForProvider } from '../../../../src/nest/assistant/assistant-redact';

import { describe, expect, it } from 'vitest';

describe('redactForProvider', () => {
  it('ASTRED-001: hides contact details and booking codes, drops pictures and geometry', () => {
    expect(
      redactForProvider({
        place: {
          name: 'Hotel',
          phone: '+81 75 000',
          email: 'desk@hotel.example',
          image_url: 'data:image/png;base64,AAAA',
          route_geometry: '[[1,2]]',
          notes: 'Write to anna@example.test before noon',
        },
        reservations: [{ confirmation_number: 'ABC123', title: 'Dinner' }, { confirmation_number: null }],
      }),
    ).toEqual({
      place: { name: 'Hotel', phone: '[hidden]', email: '[hidden]', notes: 'Write to [hidden] before noon' },
      reservations: [{ confirmation_number: '[hidden]', title: 'Dinner' }, { confirmation_number: null }],
    });
  });

  it('ASTRED-003: masks an address inside a long run of address characters, and reads a run without one quickly', () => {
    expect(redactForProvider('x'.repeat(50) + '.y@mail.example.test!')).toBe('[hidden]!');
    const started = Date.now();
    redactForProvider('a'.repeat(100000));
    redactForProvider('a@'.repeat(50000));
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("ASTRED-002: drops a booked place's picture and the trip's cover, wherever they sit", () => {
    expect(
      redactForProvider({
        reservations: [{ title: 'Ryokan', place_image: '/uploads/places/ryokan.jpg' }],
        trip: { title: 'Kyoto', trip_cover: '/uploads/covers/kyoto.jpg' },
      }),
    ).toEqual({ reservations: [{ title: 'Ryokan' }], trip: { title: 'Kyoto' } });
  });
});

describe('fitToSize', () => {
  it('ASTRED-010: leaves what fits alone', () => {
    const value = { places: [{ id: 1 }] };
    expect(fitToSize(value, 100)).toBe(value);
  });

  it('ASTRED-011: cuts arrays and long strings, says so, and stays valid JSON', () => {
    const value = {
      places: Array.from({ length: 500 }, (_, i) => ({ id: i, name: `Place ${i}`, about: 'x'.repeat(6000) })),
    };
    const fitted = fitToSize(value, 12_000) as { places: Array<{ about: string }>; truncated: boolean };
    expect(fitted.truncated).toBe(true);
    expect(fitted.places.length).toBeLessThan(500);
    // A string stops at 4 000 characters and an ellipsis.
    expect(fitted.places[0].about.length).toBe(4001);
    expect(JSON.stringify(fitted).length).toBeLessThanOrEqual(12_000);
  });

  it('ASTRED-012: an array at the top is wrapped, and what never fits says to ask for less', () => {
    expect(
      fitToSize(
        Array.from({ length: 50 }, (_, i) => i),
        60,
      ),
    ).toEqual({ items: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], truncated: true });
    expect(fitToSize({ blob: 'y'.repeat(5000) }, 50)).toEqual({
      truncated: true,
      note: 'The answer was too large. Ask for less at once.',
    });
  });
});

describe('toolOutputForProvider', () => {
  it('ASTRED-020: the trip summary keeps the plan and leaves out members contacts, budget and shared notes', () => {
    const output = toolOutputForProvider('get_trip_summary', {
      trip: { id: 1, title: 'Kyoto', feed_token: 'secret', cover_image: '/uploads/c.jpg' },
      members: {
        owner: { id: 7, username: 'mia', email: 'mia@example.test' },
        collaborators: [{ id: 8, username: 'jon', email: 'j@x.test' }],
      },
      days: [
        {
          id: 31,
          date: '2026-06-11',
          assignments: [
            {
              id: 301,
              place_id: 12,
              place: { name: 'Market', image_url: 'data:image/png;base64,AA', lat: 1 },
              participants: [{ id: 7 }],
            },
          ],
          notes: [{ id: 41, text: 'Pass' }],
        },
      ],
      reservations: [{ id: 5, title: 'Dinner', confirmation_number: 'ABC', metadata: '{"price":"40"}' }],
      packing: { items: [{ id: 51, name: 'Umbrella', owner_id: 7 }], total: 1 },
      budget: { items: [{ id: 1, total_price: 30 }] },
      collab_notes: [{ id: 2, content: 'private' }],
      todos: [{ id: 61, name: 'Book', reminded_at: 'x' }],
      pollCount: 2,
    });
    expect(output).toEqual({
      trip: { id: 1, title: 'Kyoto' },
      members: [
        { id: 7, username: 'mia' },
        { id: 8, username: 'jon' },
      ],
      days: [
        {
          id: 31,
          date: '2026-06-11',
          assignments: [{ id: 301, place_id: 12, place: { name: 'Market', lat: 1 } }],
          notes: [{ id: 41, text: 'Pass' }],
        },
      ],
      accommodations: [],
      reservations: [{ id: 5, title: 'Dinner' }],
      packing: [{ id: 51, name: 'Umbrella' }],
      todos: [{ id: 61, name: 'Book' }],
    });
  });

  it('ASTRED-021: other tools are only redacted and fitted', () => {
    expect(toolOutputForProvider('search_place', { places: [{ name: 'A', phone: '1' }] })).toEqual({
      places: [{ name: 'A', phone: '[hidden]' }],
    });
    expect(toolOutputForProvider('list_places', 'Trip not found or access denied.')).toBe(
      'Trip not found or access denied.',
    );
  });
});
