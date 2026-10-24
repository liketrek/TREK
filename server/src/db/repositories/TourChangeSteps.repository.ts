import { currentTimestampKysely } from '../dialect/kysely-functions';
import type { TourChangeSteps } from '../entities/TourChangeSteps.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type StepsDB = Pick<DB, 'tour_change_steps'>;

/** What a save of a confirmed change records; `changes` and `before_state` are their JSON text. */
export interface TourChangeStepWrite {
  place_id: number;
  proposal_id: string;
  base_revision: number;
  revision: number;
  changes: string;
  before_state: string;
  saved_by: number | null;
}

/** A recorded step as it is read back, with whether and when it was taken back (MCP-T04). */
export interface TourChangeStepRow {
  id: number;
  base_revision: number;
  revision: number;
  changes: string;
  before_state: string;
  saved_at: string;
  undone_revision: number | null;
  undone_at: string | null;
}

/** Taking a step back: the revision that raised the tour to and who confirmed it. */
export interface TourChangeStepUndo {
  undone_revision: number;
  undone_by: number | null;
}

const STEP_COLUMNS = [
  'id',
  'base_revision',
  'revision',
  'changes',
  'before_state',
  'saved_at',
  'undone_revision',
  'undone_at',
] as const;

/**
 * `tour_change_steps` (MCP-T03): the changes to a tour saved from a proposal
 * the traveller confirmed, one step per revision they raised the tour to,
 * each with the tour as it was before, so a step can be followed and taken
 * back (MCP-T04). A step goes with its tour.
 */
export class TourChangeStepsRepository extends TrekRepository<TourChangeSteps> {
  private db() {
    return this.kysely<StepsDB>();
  }

  /** Records one saved step and answers its id; the caller holds the transaction of the save. */
  async record(step: TourChangeStepWrite): Promise<number> {
    const inserted = await this.db()
      .insertInto('tour_change_steps')
      .values(step)
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** The steps of a tour, the latest first, at most `limit` of them. */
  async listForPlace(place_id: number, limit: number): Promise<TourChangeStepRow[]> {
    return await this.db()
      .selectFrom('tour_change_steps')
      .select(STEP_COLUMNS)
      .where('place_id', '=', place_id)
      .orderBy('revision', 'desc')
      .limit(limit)
      .execute();
  }

  /** One step of this tour; undefined for a step of another tour or none. */
  async findForPlace(place_id: number, id: number): Promise<TourChangeStepRow | undefined> {
    return await this.db()
      .selectFrom('tour_change_steps')
      .select(STEP_COLUMNS)
      .where('place_id', '=', place_id)
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * The step a proposal of this tour was saved as, from the revision it was
   * prepared on; undefined while it is not saved. A proposal is saved once, so
   * a save sent again finds the step its first one recorded.
   */
  async findSavedProposal(
    place_id: number,
    proposal_id: string,
    base_revision: number,
  ): Promise<TourChangeStepRow | undefined> {
    return await this.db()
      .selectFrom('tour_change_steps')
      .select(STEP_COLUMNS)
      .where('place_id', '=', place_id)
      .where('proposal_id', '=', proposal_id)
      .where('base_revision', '=', base_revision)
      .executeTakeFirst();
  }

  /**
   * Marks a step taken back, inside the caller's transaction. Only a step that
   * still stands is marked, so it is taken back once: false when it was already.
   */
  async markUndone(id: number, { undone_revision, undone_by }: TourChangeStepUndo): Promise<boolean> {
    const platform = this.getEntityManager().getPlatform();
    const result = await this.db()
      .updateTable('tour_change_steps')
      .set({ undone_revision, undone_by, undone_at: currentTimestampKysely(platform) })
      .where('id', '=', id)
      .where('undone_revision', 'is', null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) === 1;
  }
}
