import { db } from '../db/database';
import { AssignmentRow, Tag, Participant } from '../types';

interface TagRow extends Tag {
  place_id: number;
}

interface ParticipantRow {
  assignment_id: number;
  user_id: number;
  username: string;
  avatar: string | null;
}

/** Batch-load tags for multiple places in a single query, indexed by place ID. */
function loadTagsByPlaceIds(placeIds: number[], { compact }: { compact?: boolean } = {}): Record<number, Partial<Tag>[]> {
  const tagsByPlaceId: Record<number, Partial<Tag>[]> = {};
  if (placeIds.length > 0) {
    const placeholders = placeIds.map(() => '?').join(',');
    const allTags = db.prepare(`
      SELECT t.*, pt.place_id FROM tags t
      JOIN place_tags pt ON t.id = pt.tag_id
      WHERE pt.place_id IN (${placeholders})
    `).all(...placeIds) as TagRow[];

    for (const tag of allTags) {
      const pid = tag.place_id;
      if (!tagsByPlaceId[pid]) tagsByPlaceId[pid] = [];
      if (compact) {
        tagsByPlaceId[pid].push({ id: tag.id, name: tag.name, color: tag.color, created_at: tag.created_at });
      } else {
        const { place_id, ...rest } = tag;
        tagsByPlaceId[pid].push(rest);
      }
    }
  }
  return tagsByPlaceId;
}

export interface PlaceRatingRow {
  user_id: number;
  username: string;
  avatar: string | null;
  rating: number;
}

/** Batch-load collaborative ratings (#1435) for multiple places in one query, indexed by place ID. */
function loadRatingsByPlaceIds(placeIds: number[]): Record<number, PlaceRatingRow[]> {
  const ratingsByPlaceId: Record<number, PlaceRatingRow[]> = {};
  if (placeIds.length > 0) {
    const rows = db.prepare(`
      SELECT pr.place_id, pr.user_id, u.username, u.avatar, pr.rating FROM place_ratings pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.place_id IN (${placeIds.map(() => '?').join(',')})
      ORDER BY pr.created_at
    `).all(...placeIds) as (PlaceRatingRow & { place_id: number })[];
    for (const { place_id, ...rest } of rows) {
      if (!ratingsByPlaceId[place_id]) ratingsByPlaceId[place_id] = [];
      ratingsByPlaceId[place_id].push(rest);
    }
  }
  return ratingsByPlaceId;
}

/** avg/count aggregate for a place's rating rows. */
function ratingAggregate(ratings: PlaceRatingRow[] | undefined) {
  const rows = ratings || [];
  return {
    rating_avg: rows.length > 0 ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : null,
    rating_count: rows.length,
  };
}

/** Batch-load participants for multiple day-assignments in a single query, indexed by assignment ID. */
function loadParticipantsByAssignmentIds(assignmentIds: number[]): Record<number, Participant[]> {
  const participantsByAssignment: Record<number, Participant[]> = {};
  if (assignmentIds.length > 0) {
    const allParticipants = db.prepare(`SELECT ap.assignment_id, ap.user_id, u.username, u.avatar FROM assignment_participants ap JOIN users u ON ap.user_id = u.id WHERE ap.assignment_id IN (${assignmentIds.map(() => '?').join(',')})`)
      .all(...assignmentIds) as ParticipantRow[];
    for (const p of allParticipants) {
      if (!participantsByAssignment[p.assignment_id]) participantsByAssignment[p.assignment_id] = [];
      participantsByAssignment[p.assignment_id].push({ user_id: p.user_id, username: p.username, avatar: p.avatar });
    }
  }
  return participantsByAssignment;
}

/** Reshape a flat assignment+place DB row into the nested API response shape with embedded place, tags, and participants. */
function formatAssignmentWithPlace(a: AssignmentRow, tags: Partial<Tag>[], participants: Participant[]) {
  return {
    id: a.id,
    day_id: a.day_id,
    place_id: a.place_id,
    order_index: a.order_index,
    notes: a.notes,
    assignment_time: a.assignment_time ?? null,
    assignment_end_time: a.assignment_end_time ?? null,
    participants: participants || [],
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
      osm_id: a.osm_id,
      website: a.website,
      phone: a.phone,
      category: a.category_id ? {
        id: a.category_id,
        name: a.category_name,
        color: a.category_color,
        icon: a.category_icon,
      } : null,
      tags: tags || [],
    }
  };
}

export { loadTagsByPlaceIds, loadParticipantsByAssignmentIds, formatAssignmentWithPlace, loadRatingsByPlaceIds, ratingAggregate };
