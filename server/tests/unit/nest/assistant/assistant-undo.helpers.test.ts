/**
 * The undo guard: an applied change is taken back only while what it created
 * is as it left it, and, for a place, still only where the change put it.
 */
import {
  unchangedSinceApplied,
  undoSnapshotOf,
  undoTargetsOf,
  type TripSnapshot,
} from '../../../../src/nest/assistant/assistant-undo.helpers';
import { readKey } from '../../../../src/nest/assistant/cards/card-values';
import { ASSISTANT_UNDO_MAP } from '../../../../src/nest/assistant/cards/registry';

import { describe, expect, it, vi } from 'vitest';

const PLACE = { id: 9, name: 'Kinkaku-ji', updated_at: '2026-10-21 10:00:00', lat: 35, lng: 135 };

function snapshot(
  overrides: { places?: unknown[]; days?: unknown[]; summary?: Record<string, unknown> } = {},
): TripSnapshot {
  return {
    places: { places: overrides.places ?? [{ ...PLACE, category: { id: 1 } }] },
    summary: {
      days: overrides.days ?? [
        { id: 31, assignments: [{ id: 301, place_id: 9, day_id: 31 }], notes: [{ id: 41, text: 'Pass' }] },
      ],
      reservations: [],
      accommodations: [],
      budget: { items: [{ id: 71, name: 'Taxi', total_price: 30 }] },
      packing: { items: [{ id: 51, name: 'Socks', updated_at: 'a' }] },
      todos: [{ id: 61, name: 'Book', checked: 0 }],
      ...overrides.summary,
    },
  };
}

describe('unchangedSinceApplied', () => {
  it('ASTUND-001: a place as it was, planned only where the change put it, can be taken back', () => {
    expect(
      unchangedSinceApplied('create_and_assign_place', { place: PLACE, assignment: { id: 301 } }, snapshot()),
    ).toBe(true);
    expect(unchangedSinceApplied('create_place', { place: PLACE }, snapshot({ days: [] }))).toBe(true);
  });

  it('ASTUND-002: an edited, re-planned, booked or deleted place cannot', () => {
    const result = { place: PLACE, assignment: { id: 301 } };
    expect(
      unchangedSinceApplied(
        'create_and_assign_place',
        result,
        snapshot({ places: [{ ...PLACE, updated_at: 'later' }] }),
      ),
    ).toBe(false);
    expect(
      unchangedSinceApplied(
        'create_and_assign_place',
        result,
        snapshot({
          days: [
            {
              id: 32,
              assignments: [
                { id: 301, place_id: 9 },
                { id: 302, place_id: 9 },
              ],
            },
          ],
        }),
      ),
    ).toBe(false);
    expect(
      unchangedSinceApplied(
        'create_place',
        { place: PLACE },
        snapshot({ days: [], summary: { reservations: [{ place_id: 9 }] } }),
      ),
    ).toBe(false);
    expect(unchangedSinceApplied('create_place', { place: PLACE }, snapshot({ places: [] }))).toBe(false);
  });

  it('ASTUND-003: assignments, notes, packing items, to-dos and expenses are compared field by field', () => {
    expect(
      unchangedSinceApplied('assign_place_to_day', { assignment: { id: 301, day_id: 31, place_id: 9 } }, snapshot()),
    ).toBe(true);
    expect(unchangedSinceApplied('assign_place_to_day', { assignment: { id: 301, day_id: 30 } }, snapshot())).toBe(
      false,
    );
    expect(unchangedSinceApplied('create_day_note', { note: { id: 41, text: 'Pass' } }, snapshot())).toBe(true);
    expect(unchangedSinceApplied('create_day_note', { note: { id: 41, text: 'Passport' } }, snapshot())).toBe(false);
    expect(
      unchangedSinceApplied('create_packing_item', { item: { id: 51, name: 'Socks', updated_at: 'a' } }, snapshot()),
    ).toBe(true);
    expect(unchangedSinceApplied('create_todo', { item: { id: 61, name: 'Book', checked: 1 } }, snapshot())).toBe(
      false,
    );
    expect(
      unchangedSinceApplied('create_budget_item', { item: { id: 71, name: 'Taxi', total_price: 30 } }, snapshot()),
    ).toBe(true);
    expect(unchangedSinceApplied('create_budget_item', { item: { id: 72 } }, snapshot())).toBe(false);
  });

  it('ASTUND-004: every undoable tool has a guard, a tool without one never passes', () => {
    for (const name of Object.keys(ASSISTANT_UNDO_MAP)) {
      expect(unchangedSinceApplied(name, {}, snapshot()), name).toBe(false);
    }
    expect(unchangedSinceApplied('update_place', { place: PLACE }, snapshot())).toBe(false);
  });
});

describe('ASSISTANT_UNDO_MAP', () => {
  it('ASTUND-010: builds the counter-call from the change and its answer, or none', () => {
    expect(ASSISTANT_UNDO_MAP.create_place.args({}, { place: { id: 9 } }, null)).toEqual({ placeId: 9 });
    expect(ASSISTANT_UNDO_MAP.create_and_assign_place.args({}, { place: { id: 9 } }, null)).toEqual({ placeId: 9 });
    expect(ASSISTANT_UNDO_MAP.assign_place_to_day.args({ dayId: 31 }, { assignment: { id: 301 } }, null)).toEqual({
      dayId: 31,
      assignmentId: 301,
    });
    expect(ASSISTANT_UNDO_MAP.create_day_note.args({ dayId: 31 }, { note: { id: 41 } }, null)).toEqual({
      dayId: 31,
      noteId: 41,
    });
    expect(ASSISTANT_UNDO_MAP.create_packing_item.args({}, { item: { id: 51 } }, null)).toEqual({ itemId: 51 });
    expect(ASSISTANT_UNDO_MAP.create_todo.args({}, { item: { id: 61 } }, null)).toEqual({ itemId: 61 });
    expect(ASSISTANT_UNDO_MAP.create_budget_item.args({}, { item: { id: 71 } }, null)).toEqual({ itemId: 71 });
    expect(ASSISTANT_UNDO_MAP.create_place.args({}, 'Place not found.', null)).toBeNull();
    expect(ASSISTANT_UNDO_MAP.assign_place_to_day.args({}, { assignment: { id: 301 } }, null)).toBeNull();
    expect(ASSISTANT_UNDO_MAP.create_day_note.args({ dayId: 31 }, { note: { id: 0 } }, null)).toBeNull();
  });
});

describe('a created tour', () => {
  /** A hike as list_places has it: a place with its name and description, stamped once when it was made. */
  const MADE = '2026-10-21 10:00:00';
  const HIKE = {
    id: 64,
    name: 'Herzogstand',
    description: null,
    lat: 47.6,
    lng: 11.3,
    created_at: MADE,
    updated_at: MADE,
  };
  const created = { tour: { place_id: 64, name: 'Herzogstand', description: null }, waypoints: [] };

  it('ASTUND-005: is taken back while it has its name and words and nothing plans, books or pays for it', () => {
    const tours = snapshot({ places: [PLACE, HIKE] });
    for (const tool of ['create_hike', 'create_city_walk']) {
      expect(unchangedSinceApplied(tool, created, tours), tool).toBe(true);
    }
    // A description the tour was created without reads as none on both sides.
    expect(unchangedSinceApplied('create_hike', { tour: { place_id: 64, name: 'Herzogstand' } }, tours)).toBe(true);
  });

  it('ASTUND-006: stays once it was renamed, changed, put on a day, booked or deleted', () => {
    expect(
      unchangedSinceApplied('create_hike', created, snapshot({ places: [PLACE, { ...HIKE, name: 'Heimgarten' }] })),
    ).toBe(false);
    // A new way, limit or planned time (update_tour, the planner's save) leaves name and words as they were.
    const rerouted = { ...HIKE, updated_at: '2026-10-21 10:04:00' };
    for (const tool of ['create_hike', 'create_city_walk']) {
      expect(unchangedSinceApplied(tool, created, snapshot({ places: [PLACE, rerouted] })), tool).toBe(false);
    }
    // A row that does not say when it was made cannot say it is unchanged.
    const { created_at: _made, ...unstamped } = HIKE;
    expect(unchangedSinceApplied('create_hike', created, snapshot({ places: [PLACE, unstamped] }))).toBe(false);
    expect(
      unchangedSinceApplied(
        'create_hike',
        created,
        snapshot({ places: [PLACE, HIKE], days: [{ id: 31, assignments: [{ id: 305, place_id: 64 }] }] }),
      ),
    ).toBe(false);
    expect(
      unchangedSinceApplied(
        'create_city_walk',
        created,
        snapshot({ places: [PLACE, HIKE], summary: { budget: { items: [{ id: 72, place_id: 64 }] } } }),
      ),
    ).toBe(false);
    expect(unchangedSinceApplied('create_hike', created, snapshot())).toBe(false);
  });

  it('ASTUND-011: is taken back by deleting its place, named in the answer', () => {
    for (const tool of ['create_hike', 'create_city_walk']) {
      expect(ASSISTANT_UNDO_MAP[tool].tool).toBe('delete_place');
      expect(ASSISTANT_UNDO_MAP[tool].args({}, created, null)).toEqual({ placeId: 64 });
      expect(ASSISTANT_UNDO_MAP[tool].args({}, { tour: { place_id: 0 } }, null)).toBeNull();
      expect(ASSISTANT_UNDO_MAP[tool].args({}, { tour: 'odd' }, null)).toBeNull();
      expect(ASSISTANT_UNDO_MAP[tool].args({}, 'Tour not found.', null)).toBeNull();
    }
  });
});

describe('the undo session', () => {
  const session = (failing: string[] = []) => ({
    read: vi.fn(async (name: string, args: Record<string, unknown> = {}) =>
      failing.includes(name) ? { ok: false, value: 'Not allowed.' } : { ok: true, value: { name, args } },
    ),
  });

  it('ASTUND-020: holds the removing tool and the trip reads, and reads the trip before the check', async () => {
    expect([...undoTargetsOf('delete_place', 'create_hike', {}, {})]).toEqual([
      'delete_place',
      'get_trip_summary',
      'list_places',
    ]);
    const snap = await undoSnapshotOf(session(), 'create_place', {}, {});
    expect(snap).toEqual({
      summary: { name: 'get_trip_summary', args: {} },
      places: { name: 'list_places', args: {} },
      reads: new Map(),
    });
    expect(await undoSnapshotOf(session(['list_places']), 'create_place', {}, {})).toBeNull();
  });

  it('ASTUND-021: keeps what a package reads by tool and arguments, a failed read as null', async () => {
    const reads = [
      { tool: 'get_vacay_plan', args: { year: 2026 } },
      { tool: 'list_vacay_entries', args: {} },
    ];
    const snap = await undoSnapshotOf(session(['list_vacay_entries']), 'toggle_vacay', {}, {}, { reads });
    expect(snap?.reads.get(readKey('get_vacay_plan', { year: 2026 }))).toEqual({
      name: 'get_vacay_plan',
      args: { year: 2026 },
    });
    expect(snap?.reads.get(readKey('list_vacay_entries'))).toBeNull();
    expect(snap?.reads.size).toBe(2);
  });

  it('ASTUND-022: a Studio undo reads no trip: it holds the removing tool and the book read, the summary stays empty', async () => {
    expect([...undoTargetsOf('delete_book_pages', 'add_book_pages', {}, {}, false)]).toEqual([
      'delete_book_pages',
      'get_book',
    ]);
    const studio = session(['get_trip_summary', 'list_places']);
    const snap = await undoSnapshotOf(studio, 'add_book_pages', {}, {}, { tripReads: false });
    expect(snap).toMatchObject({ summary: null, places: null });
    expect(snap?.reads.get(readKey('get_book'))).toEqual({ name: 'get_book', args: {} });
    expect(studio.read).not.toHaveBeenCalledWith('get_trip_summary');
  });
});
