import type { PaddleRegionRequests, TPaddleRegionRequestsReason } from '../entities/PaddleRegionRequests.entity';
import type { DB } from '../kysely/db';
import { dbNow } from '../types';
import { TrekRepository } from './_shared/trek-repository';

/** A region a paddler's planning asked for, as stored. */
export interface PaddleRegionRequestRow {
  region_id: string;
  name: string;
  reason: TPaddleRegionRequestsReason;
  bytes: number | null;
  requested_by: string | null;
  requested_at: string;
  declined_at: string | null;
}

/** `reason` narrowed to the three values the column's CHECK constraint allows. */
type RequestsDB = {
  paddle_region_requests: Omit<DB['paddle_region_requests'], 'reason'> & { reason: TPaddleRegionRequestsReason };
};

const COLUMNS = ['region_id', 'name', 'reason', 'bytes', 'requested_by', 'requested_at', 'declined_at'] as const;

/** `paddle_region_requests`: regions that wait for an admin before TREK loads them (PAD-11C). */
export class PaddleRegionRequestsRepository extends TrekRepository<PaddleRegionRequests> {
  private db() {
    return this.kysely<RequestsDB>();
  }

  /** Every request, the newest first. */
  async list(): Promise<PaddleRegionRequestRow[]> {
    return await this.db()
      .selectFrom('paddle_region_requests')
      .select(COLUMNS)
      .orderBy('requested_at', 'desc')
      .orderBy('region_id', 'asc')
      .execute();
  }

  async findByRegion(regionId: string): Promise<PaddleRegionRequestRow | undefined> {
    return await this.db()
      .selectFrom('paddle_region_requests')
      .select(COLUMNS)
      .where('region_id', '=', regionId)
      .executeTakeFirst();
  }

  /** Files a request; one already there, declined or not, stays as it is. */
  async file(row: {
    region_id: string;
    name: string;
    reason: TPaddleRegionRequestsReason;
    bytes: number | null;
    requested_by: string;
  }): Promise<boolean> {
    const result = await this.db()
      .insertInto('paddle_region_requests')
      .values({ ...row, requested_at: dbNow() })
      .onConflict((oc) => oc.column('region_id').doNothing())
      .executeTakeFirst();
    return Number(result.numInsertedOrUpdatedRows ?? 0) > 0;
  }

  async decline(regionId: string): Promise<boolean> {
    const result = await this.db()
      .updateTable('paddle_region_requests')
      .set({ declined_at: dbNow() })
      .where('region_id', '=', regionId)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
  }

  async remove(regionId: string): Promise<boolean> {
    const result = await this.db()
      .deleteFrom('paddle_region_requests')
      .where('region_id', '=', regionId)
      .executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
