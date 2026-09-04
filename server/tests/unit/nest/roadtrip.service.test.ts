import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { RoadtripService } from '../../../src/nest/roadtrip/roadtrip.service';

/**
 * Via points, against a real SQLite. The table is tiny and the interesting parts are the
 * ordering and the day scoping, both of which are SQL — mocking the DB would test the mock.
 */
function makeService() {
  const raw = new Database(':memory:');
  raw.exec(`
    CREATE TABLE days (id INTEGER PRIMARY KEY, trip_id INTEGER NOT NULL);
    CREATE TABLE roadtrip_vias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
      after_order_index INTEGER NOT NULL,
      sequence INTEGER NOT NULL DEFAULT 0,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO days (id, trip_id) VALUES (1, 7), (2, 7), (3, 99);
  `);
  const db = {
    get: <T>(sql: string, ...params: unknown[]) => raw.prepare(sql).get(...params as never[]) as T | undefined,
    all: <T>(sql: string, ...params: unknown[]) => raw.prepare(sql).all(...params as never[]) as T[],
    run: (sql: string, ...params: unknown[]) => raw.prepare(sql).run(...params as never[]),
    transaction: <T>(fn: (conn: unknown) => T) => raw.transaction(() => fn(raw))(),
  };
  return new RoadtripService(db as never);
}

describe('RoadtripService', () => {
  let service: RoadtripService;
  beforeEach(() => { service = makeService(); });

  it('ROADTRIP-SVC-001: a day of another trip is not this trip’s day', () => {
    // The trip guard proves access to the trip; this is what stops a valid day id from
    // someone else’s trip being edited through one the caller can reach.
    expect(service.dayExists(1, 7)).toBe(true);
    expect(service.dayExists(3, 7)).toBe(false);
  });

  it('ROADTRIP-SVC-002: vias appended after the same stop keep the order they were added in', () => {
    const first = service.create(1, { after_order_index: 0, lat: 53, lng: 10 });
    const second = service.create(1, { after_order_index: 0, lat: 53.5, lng: 10.5 });

    expect(first.sequence).toBe(0);
    expect(second.sequence).toBe(1);
    expect(service.listForDay(1).map(v => v.id)).toEqual([first.id, second.id]);
  });

  it('ROADTRIP-SVC-003: the list is ordered by stop first, then by sequence', () => {
    const late = service.create(1, { after_order_index: 2, lat: 51, lng: 12 });
    const early = service.create(1, { after_order_index: 0, lat: 53, lng: 10 });

    expect(service.listForDay(1).map(v => v.id)).toEqual([early.id, late.id]);
  });

  it('ROADTRIP-SVC-004: the trip listing spans its days and stops at the trip boundary', () => {
    service.create(1, { after_order_index: 0, lat: 53, lng: 10 });
    service.create(2, { after_order_index: 0, lat: 52, lng: 11 });
    service.create(3, { after_order_index: 0, lat: 50, lng: 14 });

    // Day 3 belongs to trip 99 and must not appear in trip 7.
    expect(service.listForTrip(7).map(v => v.day_id)).toEqual([1, 2]);
  });

  it('ROADTRIP-SVC-005: moving a via changes where it is, not where it sits in the chain', () => {
    const via = service.create(1, { after_order_index: 1, lat: 53, lng: 10 });

    const moved = service.move(via.id, 1, 52.5, 11.5);

    expect(moved).toMatchObject({ lat: 52.5, lng: 11.5, after_order_index: 1, sequence: via.sequence });
  });

  it('ROADTRIP-SVC-006: a via cannot be moved or removed through the wrong day', () => {
    const via = service.create(1, { after_order_index: 0, lat: 53, lng: 10 });

    expect(service.move(via.id, 2, 0, 0)).toBeNull();
    expect(service.remove(via.id, 2)).toBe(false);
    // Still where it was.
    expect(service.listForDay(1)).toHaveLength(1);
  });

  it('ROADTRIP-SVC-008: re-anchoring moves the vias it names and leaves the rest alone', () => {
    const a = service.create(1, { after_order_index: 0, lat: 53, lng: 10 });
    const b = service.create(1, { after_order_index: 1, lat: 54, lng: 11 });
    const c = service.create(1, { after_order_index: 2, lat: 55, lng: 12 });

    const after = service.reanchor(1, { vias: [{ id: b.id, after_order_index: 2 }, { id: c.id, after_order_index: 3 }] });

    const byId = new Map(after.map(v => [v.id, v.after_order_index]));
    expect(byId.get(a.id)).toBe(0);
    expect(byId.get(b.id)).toBe(2);
    expect(byId.get(c.id)).toBe(3);
    // Where a via sits is untouched — only which leg it belongs to changed.
    expect(after.find(v => v.id === b.id)?.lat).toBe(54);
  });

  it('ROADTRIP-SVC-009: re-anchoring deletes the vias whose leg stopped existing', () => {
    const gone = service.create(1, { after_order_index: 0, lat: 53, lng: 10 });
    const kept = service.create(1, { after_order_index: 2, lat: 54, lng: 11 });

    const after = service.reanchor(1, {
      vias: [{ id: kept.id, after_order_index: 1 }],
      remove: [gone.id],
    });

    expect(after.map(v => v.id)).toEqual([kept.id]);
    expect(after[0].after_order_index).toBe(1);
  });

  it('ROADTRIP-SVC-010: a via of another day cannot be renumbered through this one', () => {
    // The batch is trusted to name ids, so `AND day_id = ?` is the only thing standing
    // between a day the caller can reach and every via of the trip.
    const other = service.create(2, { after_order_index: 0, lat: 53, lng: 10 });

    service.reanchor(1, { vias: [{ id: other.id, after_order_index: 9 }], remove: [other.id] });

    const untouched = service.listForDay(2);
    expect(untouched.map(v => v.id)).toEqual([other.id]);
    expect(untouched[0].after_order_index).toBe(0);
  });

  it('ROADTRIP-SVC-011: an id that is gone does not fail the rest of the batch', () => {
    // The caller computed the batch from a snapshot; a via somebody else deleted in the
    // meantime must not leave the remaining ones mis-pinned.
    const kept = service.create(1, { after_order_index: 0, lat: 53, lng: 10 });

    const after = service.reanchor(1, {
      vias: [{ id: 9999, after_order_index: 4 }, { id: kept.id, after_order_index: 1 }],
    });

    expect(after.map(v => v.after_order_index)).toEqual([1]);
  });

  it('ROADTRIP-SVC-012: a chain lands in the order it was sent, per leg', () => {
    const vias = service.createMany(1, { vias: [
      { after_order_index: 0, lat: 53.0, lng: 10.0 },
      { after_order_index: 0, lat: 53.1, lng: 10.1 },
      { after_order_index: 1, lat: 53.2, lng: 10.2 },
    ] });

    expect(vias.map(v => [v.after_order_index, v.sequence])).toEqual([[0, 0], [0, 1], [1, 0]]);
    expect(vias.map(v => v.lat)).toEqual([53.0, 53.1, 53.2]);
  });

  it('ROADTRIP-SVC-013: a chain appends to what a leg already has', () => {
    service.create(1, { after_order_index: 0, lat: 53, lng: 10 });
    const vias = service.createMany(1, { vias: [{ after_order_index: 0, lat: 54, lng: 11 }] });

    expect(vias.map(v => v.sequence)).toEqual([0, 1]);
  });

  it('ROADTRIP-SVC-014: replace_legs clears only the legs it names', () => {
    // The point of naming legs rather than taking a flag for the day: a hand-placed
    // detour on another leg is not something adopting a track on this one asked to lose.
    const keep = service.create(1, { after_order_index: 5, lat: 50, lng: 8 });
    service.create(1, { after_order_index: 0, lat: 53, lng: 10 });

    const vias = service.createMany(1, {
      vias: [{ after_order_index: 0, lat: 54, lng: 11 }],
      replace_legs: [0],
    });

    expect(vias.map(v => v.id)).toEqual([vias[0].id, keep.id]);
    expect(vias.find(v => v.after_order_index === 0)?.lat).toBe(54);
  });

  it('ROADTRIP-SVC-015: clearing a leg without adding anything is a legal batch', () => {
    service.create(1, { after_order_index: 0, lat: 53, lng: 10 });

    expect(service.createMany(1, { vias: [], replace_legs: [0] })).toEqual([]);
  });

  it('ROADTRIP-SVC-016: a chain cannot be laid on a day it was not addressed to', () => {
    service.createMany(2, { vias: [{ after_order_index: 0, lat: 53, lng: 10 }] });

    expect(service.listForDay(1)).toEqual([]);
    expect(service.listForDay(2)).toHaveLength(1);
  });

  it('ROADTRIP-SVC-007: removing one reports whether there was anything to remove', () => {
    const via = service.create(1, { after_order_index: 0, lat: 53, lng: 10 });

    expect(service.remove(via.id, 1)).toBe(true);
    expect(service.remove(via.id, 1)).toBe(false);
    expect(service.listForDay(1)).toEqual([]);
  });
});
