import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { Tag, Participant } from '../../types';

interface TagRow extends Tag {
  place_id: number;
}

interface ParticipantRow {
  assignment_id: number;
  user_id: number;
  username: string;
  avatar: string | null;
}

export interface PlaceRatingRow {
  user_id: number;
  username: string;
  avatar: string | null;
  rating: number;
}

/**
 * The batch loaders that keep the list endpoints off N+1 queries — one query per
 * collection instead of one per row. Moved 1:1 from services/queryHelpers.ts
 * (same SQL, same indexing) onto the injected connection.
 *
 * Only the loaders live here. The two pure reshaping functions that shipped in
 * the same legacy file touch no database and stayed free functions in
 * common/rowShape.ts.
 */
@Injectable()
export class QueryHelpersService {
  constructor(private readonly db: DatabaseService) {}

  /** Batch-load tags for multiple places in a single query, indexed by place ID. */
  loadTagsByPlaceIds(placeIds: number[], { compact }: { compact?: boolean } = {}): Record<number, Partial<Tag>[]> {
    const tagsByPlaceId: Record<number, Partial<Tag>[]> = {};
    if (placeIds.length > 0) {
      const placeholders = placeIds.map(() => '?').join(',');
      const allTags = this.db.all<TagRow>(`
      SELECT t.*, pt.place_id FROM tags t
      JOIN place_tags pt ON t.id = pt.tag_id
      WHERE pt.place_id IN (${placeholders})
    `, ...placeIds);

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

  /** Batch-load collaborative ratings (#1435) for multiple places in one query, indexed by place ID. */
  loadRatingsByPlaceIds(placeIds: number[]): Record<number, PlaceRatingRow[]> {
    const ratingsByPlaceId: Record<number, PlaceRatingRow[]> = {};
    if (placeIds.length > 0) {
      const rows = this.db.all<PlaceRatingRow & { place_id: number }>(`
      SELECT pr.place_id, pr.user_id, u.username, u.avatar, pr.rating FROM place_ratings pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.place_id IN (${placeIds.map(() => '?').join(',')})
      ORDER BY pr.created_at
    `, ...placeIds);
      for (const { place_id, ...rest } of rows) {
        if (!ratingsByPlaceId[place_id]) ratingsByPlaceId[place_id] = [];
        ratingsByPlaceId[place_id].push(rest);
      }
    }
    return ratingsByPlaceId;
  }

  /** Batch-load participants for multiple day-assignments in a single query, indexed by assignment ID. */
  loadParticipantsByAssignmentIds(assignmentIds: number[]): Record<number, Participant[]> {
    const participantsByAssignment: Record<number, Participant[]> = {};
    if (assignmentIds.length > 0) {
      const allParticipants = this.db.all<ParticipantRow>(
        `SELECT ap.assignment_id, ap.user_id, u.username, u.avatar FROM assignment_participants ap JOIN users u ON ap.user_id = u.id WHERE ap.assignment_id IN (${assignmentIds.map(() => '?').join(',')})`,
        ...assignmentIds,
      );
      for (const p of allParticipants) {
        if (!participantsByAssignment[p.assignment_id]) participantsByAssignment[p.assignment_id] = [];
        participantsByAssignment[p.assignment_id].push({ user_id: p.user_id, username: p.username, avatar: p.avatar });
      }
    }
    return participantsByAssignment;
  }
}
