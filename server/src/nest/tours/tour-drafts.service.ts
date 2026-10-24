import { TourDrafts } from '../../db/entities/TourDrafts.entity';
import type { TourDraftsRepository } from '../../db/repositories/TourDrafts.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { TourDraftPutRequest, TourDraftResponse } from '@trek/shared';

/**
 * The Tours planner's unsaved draft on the account: one per user and trip,
 * so a draft started on one device opens on the next. The draft is personal
 * UI state: nobody else reads it, nothing is broadcast, and the latest write
 * replaces what was kept before. Its content is the planner's own, checked
 * as a JSON object within its size cap by the contract and by the planner
 * when it takes the draft back.
 */
@Injectable()
export class TourDraftsService {
  constructor(@InjectRepository(TourDrafts) private readonly drafts: TourDraftsRepository) {}

  /** The user's draft in the trip, null while there is none. */
  async read(tripId: number, userId: number): Promise<TourDraftResponse> {
    return { draft: (await this.drafts.findFor(tripId, userId)) ?? null };
  }

  /** Keeps the draft in place of the one before; answers it as stored. */
  async keep(tripId: number, userId: number, body: TourDraftPutRequest): Promise<TourDraftResponse> {
    return { draft: await this.drafts.put(tripId, userId, body.payload) };
  }

  /** Forgets the user's draft in the trip; a draft already gone is no error. */
  async forget(tripId: number, userId: number): Promise<{ success: true }> {
    await this.drafts.remove(tripId, userId);
    return { success: true };
  }
}
