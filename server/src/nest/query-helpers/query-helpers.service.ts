import { AssignmentParticipants } from '../../db/entities/AssignmentParticipants.entity';
import { PlaceRatings } from '../../db/entities/PlaceRatings.entity';
import { Tags } from '../../db/entities/Tags.entity';
import type { AssignmentParticipantsRepository } from '../../db/repositories/AssignmentParticipants.repository';
import type { PlaceRatingsRepository } from '../../db/repositories/PlaceRatings.repository';
import type { TagsRepository, TagForPlaceRow } from '../../db/repositories/Tags.repository';
import type { Tag, Participant } from '../../types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

export interface PlaceRatingRow {
  user_id: number;
  username: string;
  avatar: string | null;
  rating: number;
}

/**
 * The batch loaders that keep the list endpoints off N+1 queries — one query per
 * collection instead of one per row. Plan 3c Task 1: onto `TagsRepository`
 * (QH1), `PlaceRatingsRepository` (QH2, a Plan 3c-owned table per the
 * inventory §14.6) and `AssignmentParticipantsRepository` (QH3) — this
 * service's own first repository test file, since it had none before
 * (inventory §15c).
 *
 * Only the loaders live here. The two pure reshaping functions that shipped in
 * the same legacy file touch no database and stayed free functions in
 * common/rowShape.ts.
 */
@Injectable()
export class QueryHelpersService {
  constructor(
    @InjectRepository(Tags) private readonly tags: TagsRepository,
    @InjectRepository(PlaceRatings) private readonly placeRatings: PlaceRatingsRepository,
    @InjectRepository(AssignmentParticipants) private readonly assignmentParticipants: AssignmentParticipantsRepository,
  ) {}

  /** Batch-load tags for multiple places in a single query, indexed by place ID. */
  async loadTagsByPlaceIds(
    placeIds: number[],
    { compact }: { compact?: boolean } = {},
  ): Promise<Record<number, Partial<Tag>[]>> {
    const tagsByPlaceId: Record<number, Partial<Tag>[]> = {};
    const rows = await this.tags.listForPlaces(placeIds, { compact });
    for (const tag of rows as TagForPlaceRow[]) {
      const pid = tag.place_id;
      if (!tagsByPlaceId[pid]) tagsByPlaceId[pid] = [];
      const { place_id, ...rest } = tag;
      tagsByPlaceId[pid].push(rest);
    }
    return tagsByPlaceId;
  }

  /** Batch-load collaborative ratings (#1435) for multiple places in one query, indexed by place ID. */
  async loadRatingsByPlaceIds(placeIds: number[]): Promise<Record<number, PlaceRatingRow[]>> {
    const ratingsByPlaceId: Record<number, PlaceRatingRow[]> = {};
    const rows = await this.placeRatings.listForPlaces(placeIds);
    for (const { place_id, ...rest } of rows) {
      if (!ratingsByPlaceId[place_id]) ratingsByPlaceId[place_id] = [];
      ratingsByPlaceId[place_id].push(rest);
    }
    return ratingsByPlaceId;
  }

  /** Batch-load participants for multiple day-assignments in a single query, indexed by assignment ID. */
  async loadParticipantsByAssignmentIds(assignmentIds: number[]): Promise<Record<number, Participant[]>> {
    const participantsByAssignment: Record<number, Participant[]> = {};
    const rows = await this.assignmentParticipants.listForAssignments(assignmentIds);
    for (const p of rows) {
      if (!participantsByAssignment[p.assignment_id]) participantsByAssignment[p.assignment_id] = [];
      participantsByAssignment[p.assignment_id].push({ user_id: p.user_id, username: p.username, avatar: p.avatar });
    }
    return participantsByAssignment;
  }
}
