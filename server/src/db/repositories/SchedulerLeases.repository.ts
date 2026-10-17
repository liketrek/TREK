import type { SchedulerLeases } from '../entities/SchedulerLeases.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `scheduler_leases`: which process may run a cron job's tick, and until when
 * (`CronRegistrarService`). A lease is free when no row exists yet, when its
 * `expires_at` has passed, or when the asking process already holds it.
 */
export class SchedulerLeasesRepository extends TrekRepository<SchedulerLeases> {
  /**
   * Take (or renew) the lease on `name` for `owner` until `until`, if it is
   * free at `now`. One statement: the insert takes a lease nobody has held
   * yet, and on a conflict the update only applies while the lease has run out
   * or already belongs to `owner`. Of two processes asking at the same moment
   * exactly one gets a row written. True when `owner` holds the lease afterwards.
   */
  async acquire(name: string, owner: string, now: number, until: number): Promise<boolean> {
    const result = await this.kysely<Pick<DB, 'scheduler_leases'>>()
      .insertInto('scheduler_leases')
      .values({ name, owner, expires_at: until })
      .onConflict((oc) =>
        oc
          .column('name')
          .doUpdateSet({ owner, expires_at: until })
          .where((eb) =>
            eb.or([eb('scheduler_leases.expires_at', '<=', now), eb('scheduler_leases.owner', '=', owner)]),
          ),
      )
      .executeTakeFirst();
    return (result.numInsertedOrUpdatedRows ?? 0n) > 0n;
  }

  /** Move the expiry of a lease `owner` still holds; false when somebody else has it now. */
  async extend(name: string, owner: string, until: number): Promise<boolean> {
    const changed = await this.nativeUpdate({ name, owner }, { expires_at: until });
    return changed > 0;
  }

  /** The current holder and expiry, for diagnostics and tests. */
  async holder(name: string): Promise<{ owner: string; expires_at: number } | null> {
    const row = await this.findOne({ name }, { fields: ['owner', 'expires_at'] });
    return row ? { owner: row.owner, expires_at: row.expires_at } : null;
  }
}
