import { db } from '../db/database';
import { loadTagsByPlaceIds, loadParticipantsByAssignmentIds, formatAssignmentWithPlace } from './queryHelpers';
import { AssignmentRow, DayAssignment } from '../types';

export function getAssignmentWithPlace(assignmentId: number | bigint) {
  const a = db.prepare(`
    SELECT da.id, da.day_id, da.place_id, da.order_index, da.notes,
      da.assignment_time, da.assignment_end_time,
      COALESCE(da.margin_before_minutes, 0) as margin_before_minutes,
      COALESCE(da.margin_after_minutes, 0) as margin_after_minutes,
      da.created_at,
      p.name as place_name, p.description as place_description,
      p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
      NULL as place_time,
      NULL as end_time,
      COALESCE(da.duration_minutes, p.duration_minutes, 60) as duration_minutes, p.notes as place_notes,
      p.image_url, p.transport_mode, p.google_place_id, p.website, p.phone,
      c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM day_assignments da
    JOIN places p ON da.place_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE da.id = ?
  `).get(assignmentId) as AssignmentRow | undefined;

  if (!a) return null;

  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN place_tags pt ON t.id = pt.tag_id
    WHERE pt.place_id = ?
  `).all(a.place_id);

  const participants = db.prepare(`
    SELECT ap.user_id, u.username, u.avatar
    FROM assignment_participants ap
    JOIN users u ON ap.user_id = u.id
    WHERE ap.assignment_id = ?
  `).all(a.id);

  return {
    id: a.id,
    day_id: a.day_id,
    place_id: a.place_id,
    order_index: a.order_index,
    notes: a.notes,
    duration_minutes: a.duration_minutes,
    margin_before_minutes: a.margin_before_minutes ?? 0,
    margin_after_minutes: a.margin_after_minutes ?? 0,
    assignment_time: null,
    assignment_end_time: null,
    participants,
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
      place_time: null,
      end_time: null,
      duration_minutes: a.duration_minutes,
      notes: a.place_notes,
      image_url: a.image_url,
      transport_mode: a.transport_mode,
      google_place_id: a.google_place_id,
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
}

export function listDayAssignments(dayId: string | number) {
  const assignments = db.prepare(`
    SELECT da.id, da.day_id, da.place_id, da.order_index, da.notes,
      da.assignment_time, da.assignment_end_time,
      COALESCE(da.margin_before_minutes, 0) as margin_before_minutes,
      COALESCE(da.margin_after_minutes, 0) as margin_after_minutes,
      da.created_at,
      p.name as place_name, p.description as place_description,
      p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
      NULL as place_time,
      NULL as end_time,
      COALESCE(da.duration_minutes, p.duration_minutes, 60) as duration_minutes, p.notes as place_notes,
      p.image_url, p.transport_mode, p.google_place_id, p.website, p.phone,
      c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM day_assignments da
    JOIN places p ON da.place_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE da.day_id = ?
    ORDER BY da.order_index ASC, da.created_at ASC
  `).all(dayId) as AssignmentRow[];

  const placeIds = [...new Set(assignments.map(a => a.place_id))];
  const tagsByPlaceId = loadTagsByPlaceIds(placeIds, { compact: true });

  const assignmentIds = assignments.map(a => a.id);
  const participantsByAssignment = loadParticipantsByAssignmentIds(assignmentIds);

  return assignments.map(a => {
    return formatAssignmentWithPlace(a, tagsByPlaceId[a.place_id] || [], participantsByAssignment[a.id] || []);
  });
}

export function dayExists(dayId: string | number, tripId: string | number) {
  return !!db.prepare('SELECT id FROM days WHERE id = ? AND trip_id = ?').get(dayId, tripId);
}

export function placeExists(placeId: string | number, tripId: string | number) {
  return !!db.prepare('SELECT id FROM places WHERE id = ? AND trip_id = ?').get(placeId, tripId);
}

export function createAssignment(dayId: string | number, placeId: string | number, notes: string | null) {
  const maxOrder = db.prepare('SELECT MAX(order_index) as max FROM day_assignments WHERE day_id = ?').get(dayId) as { max: number | null };
  const orderIndex = (maxOrder.max !== null ? maxOrder.max : -1) + 1;
  const placeDuration = db.prepare('SELECT duration_minutes FROM places WHERE id = ?').get(placeId) as
    | { duration_minutes: number | null }
    | undefined;

  const result = db.prepare(
    'INSERT INTO day_assignments (day_id, place_id, order_index, notes, duration_minutes) VALUES (?, ?, ?, ?, ?)'
  ).run(dayId, placeId, orderIndex, notes || null, placeDuration?.duration_minutes ?? 60);

  return getAssignmentWithPlace(result.lastInsertRowid);
}

export function assignmentExistsInDay(id: string | number, dayId: string | number, tripId: string | number) {
  return !!db.prepare(
    'SELECT da.id FROM day_assignments da JOIN days d ON da.day_id = d.id WHERE da.id = ? AND da.day_id = ? AND d.trip_id = ?'
  ).get(id, dayId, tripId);
}

export function deleteAssignment(id: string | number) {
  db.prepare('DELETE FROM day_assignments WHERE id = ?').run(id);
}

export function reorderAssignments(dayId: string | number, orderedIds: number[]) {
  const update = db.prepare('UPDATE day_assignments SET order_index = ? WHERE id = ? AND day_id = ?');
  db.exec('BEGIN');
  try {
    orderedIds.forEach((id: number, index: number) => {
      update.run(index, id, dayId);
    });
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function getAssignmentForTrip(id: string | number, tripId: string | number) {
  return db.prepare(`
    SELECT da.* FROM day_assignments da
    JOIN days d ON da.day_id = d.id
    WHERE da.id = ? AND d.trip_id = ?
  `).get(id, tripId) as DayAssignment | undefined;
}

export function moveAssignment(id: string | number, newDayId: string | number, orderIndex: number, oldDayId: number) {
  db.prepare('UPDATE day_assignments SET day_id = ?, order_index = ? WHERE id = ?').run(newDayId, orderIndex || 0, id);
  const updated = getAssignmentWithPlace(Number(id));
  return { assignment: updated, oldDayId };
}

export function getParticipants(assignmentId: string | number) {
  return db.prepare(`
    SELECT ap.user_id, u.username, u.avatar
    FROM assignment_participants ap
    JOIN users u ON ap.user_id = u.id
    WHERE ap.assignment_id = ?
  `).all(assignmentId);
}

function normalizeDurationMinutes(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

function normalizeMarginMinutes(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}

export function updateTime(
  id: string | number,
  durationMinutes?: number | null,
  marginBeforeMinutes?: number | null,
  marginAfterMinutes?: number | null,
) {
  const current = db.prepare('SELECT duration_minutes, margin_before_minutes, margin_after_minutes FROM day_assignments WHERE id = ?').get(id) as
    | { duration_minutes: number | null; margin_before_minutes: number | null; margin_after_minutes: number | null }
    | undefined;
  const nextDuration = normalizeDurationMinutes(durationMinutes) ?? current?.duration_minutes ?? 60;
  const nextMarginBefore = normalizeMarginMinutes(marginBeforeMinutes) ?? current?.margin_before_minutes ?? 0;
  const nextMarginAfter = normalizeMarginMinutes(marginAfterMinutes) ?? current?.margin_after_minutes ?? 0;
  db.prepare(`
    UPDATE day_assignments
    SET assignment_time = NULL,
        assignment_end_time = NULL,
        duration_minutes = ?,
        margin_before_minutes = ?,
        margin_after_minutes = ?
    WHERE id = ?
  `).run(nextDuration, nextMarginBefore, nextMarginAfter, id);

  return getAssignmentWithPlace(Number(id));
}

export function setParticipants(assignmentId: string | number, userIds: number[]) {
  db.prepare('DELETE FROM assignment_participants WHERE assignment_id = ?').run(assignmentId);
  if (userIds.length > 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO assignment_participants (assignment_id, user_id) VALUES (?, ?)');
    for (const userId of userIds) insert.run(assignmentId, userId);
  }

  return db.prepare(`
    SELECT ap.user_id, u.username, u.avatar
    FROM assignment_participants ap
    JOIN users u ON ap.user_id = u.id
    WHERE ap.assignment_id = ?
  `).all(assignmentId);
}
