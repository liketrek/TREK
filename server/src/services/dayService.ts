import { db } from '../db/database';
import { loadTagsByPlaceIds, loadParticipantsByAssignmentIds, formatAssignmentWithPlace } from './queryHelpers';
import { AssignmentRow, Day, DayNote } from '../types';

export { verifyTripAccess } from './tripAccess';

// ---------------------------------------------------------------------------
// Day assignment helpers
// ---------------------------------------------------------------------------

export function getAssignmentsForDay(dayId: number | string) {
  const assignments = db.prepare(`
    SELECT da.*, p.id as place_id, p.name as place_name, p.description as place_description,
      p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
      COALESCE(da.assignment_time, p.place_time) as place_time,
      COALESCE(da.assignment_end_time, p.end_time) as end_time,
      p.duration_minutes, p.notes as place_notes,
      p.image_url, p.transport_mode, p.google_place_id, p.google_ftid, p.website, p.phone,
      c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM day_assignments da
    JOIN places p ON da.place_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE da.day_id = ?
    ORDER BY da.order_index ASC, da.created_at ASC
  `).all(dayId) as AssignmentRow[];

  return assignments.map(a => {
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN place_tags pt ON t.id = pt.tag_id
      WHERE pt.place_id = ?
    `).all(a.place_id);

    return {
      id: a.id,
      day_id: a.day_id,
      order_index: a.order_index,
      notes: a.notes,
      created_at: a.created_at,
      place: {
        id: a.place_id,
        name: a.place_name,
        description: a.place_description,
        lat: a.lat,
        lng: a.lng,
        address: a.address,
        category_id: a.category_id,
        price: a.price,
        currency: a.place_currency,
        place_time: a.place_time,
        end_time: a.end_time,
        duration_minutes: a.duration_minutes,
        notes: a.place_notes,
        image_url: a.image_url,
        transport_mode: a.transport_mode,
        google_place_id: a.google_place_id,
        google_ftid: a.google_ftid,
        website: a.website,
        phone: a.phone,
        category: a.category_id ? {
          id: a.category_id,
          name: a.category_name,
          color: a.category_color,
          icon: a.category_icon,
        } : null,
        tags,
      }
    };
  });
}

// ---------------------------------------------------------------------------
// Day CRUD
// ---------------------------------------------------------------------------

export function listDays(tripId: string | number) {
  const days = db.prepare('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number ASC').all(tripId) as Day[];

  if (days.length === 0) {
    return { days: [] };
  }

  const dayIds = days.map(d => d.id);
  const dayPlaceholders = dayIds.map(() => '?').join(',');

  const allAssignments = db.prepare(`
    SELECT da.*, p.id as place_id, p.name as place_name, p.description as place_description,
      p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
      COALESCE(da.assignment_time, p.place_time) as place_time,
      COALESCE(da.assignment_end_time, p.end_time) as end_time,
      p.duration_minutes, p.notes as place_notes,
      p.image_url, p.transport_mode, p.google_place_id, p.google_ftid, p.website, p.phone,
      c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM day_assignments da
    JOIN places p ON da.place_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE da.day_id IN (${dayPlaceholders})
    ORDER BY da.order_index ASC, da.created_at ASC
  `).all(...dayIds) as AssignmentRow[];

  const placeIds = [...new Set(allAssignments.map(a => a.place_id))];
  const tagsByPlaceId = loadTagsByPlaceIds(placeIds, { compact: true });

  const allAssignmentIds = allAssignments.map(a => a.id);
  const participantsByAssignment = loadParticipantsByAssignmentIds(allAssignmentIds);

  const assignmentsByDayId: Record<number, ReturnType<typeof formatAssignmentWithPlace>[]> = {};
  for (const a of allAssignments) {
    if (!assignmentsByDayId[a.day_id]) assignmentsByDayId[a.day_id] = [];
    assignmentsByDayId[a.day_id].push(formatAssignmentWithPlace(a, tagsByPlaceId[a.place_id] || [], participantsByAssignment[a.id] || []));
  }

  const allNotes = db.prepare(
    `SELECT * FROM day_notes WHERE day_id IN (${dayPlaceholders}) ORDER BY sort_order ASC, created_at ASC`
  ).all(...dayIds) as DayNote[];
  const notesByDayId: Record<number, DayNote[]> = {};
  for (const note of allNotes) {
    if (!notesByDayId[note.day_id]) notesByDayId[note.day_id] = [];
    notesByDayId[note.day_id].push(note);
  }

  const daysWithAssignments = days.map(day => ({
    ...day,
    assignments: assignmentsByDayId[day.id] || [],
    notes_items: notesByDayId[day.id] || [],
  }));

  return { days: daysWithAssignments };
}

export function createDay(tripId: string | number, date?: string, notes?: string) {
  const maxDay = db.prepare('SELECT MAX(day_number) as max FROM days WHERE trip_id = ?').get(tripId) as { max: number | null };
  const dayNumber = (maxDay.max || 0) + 1;

  const result = db.prepare(
    'INSERT INTO days (trip_id, day_number, date, notes) VALUES (?, ?, ?, ?)'
  ).run(tripId, dayNumber, date || null, notes || null);

  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(result.lastInsertRowid) as Day;
  return { ...day, assignments: [] };
}

export function getDay(id: string | number, tripId: string | number) {
  return db.prepare('SELECT * FROM days WHERE id = ? AND trip_id = ?').get(id, tripId) as Day | undefined;
}

export function updateDay(id: string | number, current: Day, fields: { notes?: string; title?: string | null }) {
  db.prepare('UPDATE days SET notes = ?, title = ? WHERE id = ?').run(
    fields.notes || null,
    'title' in fields ? (fields.title ?? null) : current.title,
    id
  );
  const updatedDay = db.prepare('SELECT * FROM days WHERE id = ?').get(id) as Day;
  return { ...updatedDay, assignments: getAssignmentsForDay(id) };
}

export function deleteDay(id: string | number) {
  db.prepare('DELETE FROM days WHERE id = ?').run(id);
}

// ---------------------------------------------------------------------------
// Day reorder / insert (#589)
//
// Reordering keeps every day ROW stable (so assignments, notes, accommodations,
// photos and multi-day reservation positions ride along by id) and only changes
// each row's day_number — its position. On a dated trip the calendar dates stay
// pinned to their slots (position i keeps the i-th date) and the day's content
// moves across them. Because a booking's day is derived from the date part of
// reservation_time, every booking on a day whose date changed gets that date
// re-stamped onto the day's new date (time-of-day preserved), so day_id stays
// consistent and the booking moves with its day.
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Add `n` days to a YYYY-MM-DD date string, staying entirely in UTC.
 *
 * Deliberately never builds a local-time Date: `new Date('2026-06-07T00:00:00')`
 * parses as *server-local* midnight, so a later .toISOString() round-trips through
 * UTC and lands on the previous day whenever the server sits east of Greenwich.
 */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + n * MS_PER_DAY;
  const dt = new Date(t);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dayDelta(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / MS_PER_DAY);
}

/** Replace the date part of an ISO-ish timestamp, keeping any time suffix. */
function withDatePart(timestamp: string, date: string): string {
  return date + (timestamp.length > 10 ? timestamp.slice(10) : '');
}

/**
 * After day dates have been re-pinned, re-stamp the date of every booking on a
 * moved day so reservation_time/reservation_end_time follow their day's new
 * date (time-of-day preserved). Transport endpoints (flight legs) shift by the
 * same per-booking day delta so multi-leg timing stays internally consistent.
 */
function restampReservationDates(
  tripId: string | number,
  oldDateById: Map<number, string | null>,
  newDateById: Map<number, string | null>,
): void {
  const reservations = db.prepare(
    'SELECT id, day_id, end_day_id, reservation_time, reservation_end_time FROM reservations WHERE trip_id = ?'
  ).all(tripId) as {
    id: number; day_id: number | null; end_day_id: number | null;
    reservation_time: string | null; reservation_end_time: string | null;
  }[];

  const setTime = db.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?');
  const setEndTime = db.prepare('UPDATE reservations SET reservation_end_time = ? WHERE id = ?');
  const endpoints = db.prepare('SELECT id, local_date FROM reservation_endpoints WHERE reservation_id = ?');
  const setEndpointDate = db.prepare('UPDATE reservation_endpoints SET local_date = ? WHERE id = ?');

  for (const r of reservations) {
    if (r.day_id != null && r.reservation_time) {
      const oldDate = oldDateById.get(r.day_id);
      const newDate = newDateById.get(r.day_id);
      if (oldDate && newDate && oldDate !== newDate) {
        setTime.run(withDatePart(r.reservation_time, newDate), r.id);
        // Shift each transport leg's local_date by the same number of days.
        const delta = dayDelta(oldDate, newDate);
        if (delta !== 0) {
          for (const ep of endpoints.all(r.id) as { id: number; local_date: string | null }[]) {
            if (ep.local_date) setEndpointDate.run(addDays(ep.local_date, delta), ep.id);
          }
        }
      }
    }
    if (r.end_day_id != null && r.reservation_end_time) {
      const oldDate = oldDateById.get(r.end_day_id);
      const newDate = newDateById.get(r.end_day_id);
      if (oldDate && newDate && oldDate !== newDate) {
        setEndTime.run(withDatePart(r.reservation_end_time, newDate), r.id);
      }
    }
  }
}

/** A stay must not end before it begins after a reorder/insert. */
function assertNoInvertedAccommodation(tripId: string | number): void {
  const spans = db.prepare(`
    SELECT a.id, s.day_number AS start_no, e.day_number AS end_no
    FROM day_accommodations a
    JOIN days s ON a.start_day_id = s.id
    JOIN days e ON a.end_day_id = e.id
    WHERE a.trip_id = ?
  `).all(tripId) as { id: number; start_no: number; end_no: number }[];
  for (const span of spans) {
    if (span.start_no > span.end_no) {
      throw new DayReorderError('This move would make an accommodation end before it starts.');
    }
  }
}

/** Thrown for invalid reorder/insert requests; mapped to HTTP 400 by the controller. */
export class DayReorderError extends Error {}

/**
 * Reorder whole days. `orderedIds` is the desired full sequence of this trip's
 * day ids (a permutation of the current ids).
 */
export function reorderDays(tripId: string | number, orderedIds: number[]) {
  const rows = db.prepare(
    'SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number'
  ).all(tripId) as { id: number; day_number: number; date: string | null }[];

  const existingIds = new Set(rows.map(r => r.id));
  if (orderedIds.length !== rows.length || !orderedIds.every(id => existingIds.has(id))) {
    throw new DayReorderError('orderedIds must be a permutation of the trip day ids.');
  }

  const oldDateById = new Map(rows.map(r => [r.id, r.date]));
  // Dates stay pinned to slots: position i keeps the i-th date (ascending).
  const sortedDates = rows.map(r => r.date).filter((d): d is string => !!d).sort();
  const isDated = sortedDates.length > 0;

  const setDayNumber = db.prepare('UPDATE days SET day_number = ? WHERE id = ?');
  const setDayNumberAndDate = db.prepare('UPDATE days SET day_number = ?, date = ? WHERE id = ?');

  db.exec('BEGIN');
  try {
    // Two-phase renumber to dodge UNIQUE(trip_id, day_number) collisions.
    orderedIds.forEach((id, i) => setDayNumber.run(-(i + 1), id));
    const newDateById = new Map<number, string | null>();
    orderedIds.forEach((id, i) => {
      const date = isDated ? (sortedDates[i] ?? null) : null;
      setDayNumberAndDate.run(i + 1, date, id);
      newDateById.set(id, date);
    });

    if (isDated) restampReservationDates(tripId, oldDateById, newDateById);
    assertNoInvertedAccommodation(tripId);

    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  return listDays(tripId);
}

/**
 * Insert a new empty day at a 1-based position (default: append at the end).
 * On a dated trip the trip gains one calendar day: dates re-pin so the slots
 * stay contiguous, the trip's end_date extends by one day, and bookings on
 * shifted days have their dates re-stamped (same rules as reorderDays).
 */
export function insertDay(tripId: string | number, position?: number) {
  const rows = db.prepare(
    'SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number'
  ).all(tripId) as { id: number; day_number: number; date: string | null }[];
  const n = rows.length;
  const pos = Math.min(Math.max(position ?? n + 1, 1), n + 1);
  const datedRows = rows.filter(r => r.date) as { id: number; day_number: number; date: string }[];
  const isDated = datedRows.length > 0;

  const setDayNumber = db.prepare('UPDATE days SET day_number = ? WHERE id = ?');

  if (!isDated) {
    db.exec('BEGIN');
    try {
      const toShift = rows.filter(r => r.day_number >= pos);
      toShift.forEach(r => setDayNumber.run(-r.day_number, r.id));
      const result = db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, NULL)').run(tripId, pos);
      toShift.forEach(r => setDayNumber.run(r.day_number + 1, r.id));
      db.exec('COMMIT');
      const day = db.prepare('SELECT * FROM days WHERE id = ?').get(result.lastInsertRowid) as Day;
      return { ...day, assignments: [], notes_items: [] };
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  // Dated trip: rebuild N+1 contiguous dates from the earliest date.
  const start = datedRows.map(r => r.date).sort()[0];
  const dates = Array.from({ length: n + 1 }, (_, i) => addDays(start, i));
  const oldDateById = new Map(rows.map(r => [r.id, r.date]));
  const setDayNumberAndDate = db.prepare('UPDATE days SET day_number = ?, date = ? WHERE id = ?');

  db.exec('BEGIN');
  try {
    rows.forEach((r, i) => setDayNumber.run(-(i + 1), r.id));
    const result = db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)').run(tripId, pos, dates[pos - 1]);
    const newId = Number(result.lastInsertRowid);

    const orderedIds = rows.map(r => r.id);
    orderedIds.splice(pos - 1, 0, newId);
    const newDateById = new Map<number, string | null>();
    orderedIds.forEach((id, i) => {
      setDayNumberAndDate.run(i + 1, dates[i], id);
      newDateById.set(id, dates[i]);
    });

    restampReservationDates(tripId, oldDateById, newDateById);
    assertNoInvertedAccommodation(tripId);
    db.prepare('UPDATE trips SET end_date = ? WHERE id = ?').run(dates[dates.length - 1], tripId);

    db.exec('COMMIT');
    const day = db.prepare('SELECT * FROM days WHERE id = ?').get(newId) as Day;
    return { ...day, assignments: [], notes_items: [] };
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Accommodation helpers
// ---------------------------------------------------------------------------

export interface DayAccommodation {
  id: number;
  trip_id: number;
  place_id: number | null;
  start_day_id: number;
  end_day_id: number;
  check_in: string | null;
  check_in_end: string | null;
  check_out: string | null;
  confirmation: string | null;
  notes: string | null;
}

function getAccommodationWithPlace(id: number | bigint) {
  return db.prepare(`
    SELECT a.*, p.name as place_name, p.address as place_address, p.image_url as place_image, p.lat as place_lat, p.lng as place_lng
    FROM day_accommodations a
    LEFT JOIN places p ON a.place_id = p.id
    WHERE a.id = ?
  `).get(id);
}

// ---------------------------------------------------------------------------
// Accommodation CRUD
// ---------------------------------------------------------------------------

export function listAccommodations(tripId: string | number) {
  return db.prepare(`
    SELECT a.*, p.name as place_name, p.address as place_address, p.image_url as place_image, p.lat as place_lat, p.lng as place_lng,
           r.title as reservation_title
    FROM day_accommodations a
    LEFT JOIN places p ON a.place_id = p.id
    LEFT JOIN reservations r ON r.accommodation_id = a.id
    WHERE a.trip_id = ?
    ORDER BY a.created_at ASC
  `).all(tripId);
}

export function validateAccommodationRefs(tripId: string | number, placeId?: number, startDayId?: number, endDayId?: number) {
  const errors: { field: string; message: string }[] = [];
  if (placeId !== undefined) {
    const place = db.prepare('SELECT id FROM places WHERE id = ? AND trip_id = ?').get(placeId, tripId);
    if (!place) errors.push({ field: 'place_id', message: 'Place not found' });
  }
  if (startDayId !== undefined) {
    const startDay = db.prepare('SELECT id FROM days WHERE id = ? AND trip_id = ?').get(startDayId, tripId);
    if (!startDay) errors.push({ field: 'start_day_id', message: 'Start day not found' });
  }
  if (endDayId !== undefined) {
    const endDay = db.prepare('SELECT id FROM days WHERE id = ? AND trip_id = ?').get(endDayId, tripId);
    if (!endDay) errors.push({ field: 'end_day_id', message: 'End day not found' });
  }
  return errors;
}

interface CreateAccommodationData {
  place_id: number;
  start_day_id: number;
  end_day_id: number;
  check_in?: string;
  check_in_end?: string;
  check_out?: string;
  confirmation?: string;
  notes?: string;
}

export function createAccommodation(tripId: string | number, data: CreateAccommodationData) {
  const { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } = data;

  const result = db.prepare(
    'INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(tripId, place_id, start_day_id, end_day_id, check_in || null, check_in_end || null, check_out || null, confirmation || null, notes || null);

  const accommodationId = result.lastInsertRowid;

  // Auto-create linked reservation for this accommodation
  const placeName = (db.prepare('SELECT name FROM places WHERE id = ?').get(place_id) as { name: string } | undefined)?.name || 'Hotel';
  const startDayDate = (db.prepare('SELECT date FROM days WHERE id = ?').get(start_day_id) as { date: string } | undefined)?.date || null;
  const meta: Record<string, string> = {};
  if (check_in) meta.check_in_time = check_in;
  if (check_in_end) meta.check_in_end_time = check_in_end;
  if (check_out) meta.check_out_time = check_out;
  db.prepare(`
    INSERT INTO reservations (trip_id, day_id, title, reservation_time, location, confirmation_number, notes, status, type, accommodation_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'hotel', ?, ?)
  `).run(
    tripId, start_day_id, placeName, startDayDate || null, null,
    confirmation || null, notes || null, accommodationId,
    Object.keys(meta).length > 0 ? JSON.stringify(meta) : null
  );

  return getAccommodationWithPlace(accommodationId);
}

export function getAccommodation(id: string | number, tripId: string | number) {
  return db.prepare('SELECT * FROM day_accommodations WHERE id = ? AND trip_id = ?').get(id, tripId) as DayAccommodation | undefined;
}

export function updateAccommodation(id: string | number, existing: DayAccommodation, fields: {
  place_id?: number; start_day_id?: number; end_day_id?: number;
  check_in?: string; check_in_end?: string; check_out?: string; confirmation?: string; notes?: string;
}) {
  const newPlaceId = fields.place_id !== undefined ? fields.place_id : existing.place_id;
  const newStartDayId = fields.start_day_id !== undefined ? fields.start_day_id : existing.start_day_id;
  const newEndDayId = fields.end_day_id !== undefined ? fields.end_day_id : existing.end_day_id;
  const newCheckIn = fields.check_in !== undefined ? fields.check_in : existing.check_in;
  const newCheckInEnd = fields.check_in_end !== undefined ? fields.check_in_end : existing.check_in_end;
  const newCheckOut = fields.check_out !== undefined ? fields.check_out : existing.check_out;
  const newConfirmation = fields.confirmation !== undefined ? fields.confirmation : existing.confirmation;
  const newNotes = fields.notes !== undefined ? fields.notes : existing.notes;

  db.prepare(
    'UPDATE day_accommodations SET place_id = ?, start_day_id = ?, end_day_id = ?, check_in = ?, check_in_end = ?, check_out = ?, confirmation = ?, notes = ? WHERE id = ?'
  ).run(newPlaceId, newStartDayId, newEndDayId, newCheckIn, newCheckInEnd, newCheckOut, newConfirmation, newNotes, id);

  // Sync check-in/out/confirmation to linked reservation
  const linkedRes = db.prepare('SELECT id, metadata FROM reservations WHERE accommodation_id = ?').get(Number(id)) as { id: number; metadata: string | null } | undefined;
  if (linkedRes) {
    const meta = linkedRes.metadata ? JSON.parse(linkedRes.metadata) : {};
    if (newCheckIn) meta.check_in_time = newCheckIn;
    if (newCheckInEnd) meta.check_in_end_time = newCheckInEnd;
    if (newCheckOut) meta.check_out_time = newCheckOut;
    db.prepare('UPDATE reservations SET metadata = ?, confirmation_number = COALESCE(?, confirmation_number) WHERE id = ?')
      .run(JSON.stringify(meta), newConfirmation || null, linkedRes.id);
  }

  return getAccommodationWithPlace(Number(id));
}

/** Delete accommodation and its linked reservation (and any linked budget item). */
export function deleteAccommodation(id: string | number): { linkedReservationId: number | null; deletedBudgetItemId: number | null } {
  const linkedRes = db.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(Number(id)) as { id: number } | undefined;
  let deletedBudgetItemId: number | null = null;
  if (linkedRes) {
    const linkedBudget = db.prepare('SELECT id FROM budget_items WHERE reservation_id = ?').get(linkedRes.id) as { id: number } | undefined;
    if (linkedBudget) {
      db.prepare('DELETE FROM budget_items WHERE id = ?').run(linkedBudget.id);
      deletedBudgetItemId = linkedBudget.id;
    }
    db.prepare('DELETE FROM reservations WHERE id = ?').run(linkedRes.id);
  }

  db.prepare('DELETE FROM day_accommodations WHERE id = ?').run(id);
  return { linkedReservationId: linkedRes ? linkedRes.id : null, deletedBudgetItemId };
}
