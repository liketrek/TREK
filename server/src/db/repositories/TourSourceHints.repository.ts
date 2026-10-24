import type {
  TourSourceHints,
  TTourSourceHintsReason,
  TTourSourceHintsState,
} from '../entities/TourSourceHints.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type HintsDB = Pick<
  DB,
  'tour_source_hints' | 'tour_sources' | 'places' | 'trips' | 'trip_members' | 'wanderer_connections'
>;

const PROVIDER = 'wanderer';

/** A snapshot the watch may look at, with what was last seen of its source. */
export interface WatchedSourceRow {
  place_id: number;
  external_id: string;
  /** The content as the import delivered it, `name.description.route`. */
  content_hash: string;
  /** The trail's change time at the import. */
  external_updated: string | null;
  /** The content and change time the user last saw in a manual check; null before one. */
  seen_hash: string | null;
  seen_updated: string | null;
  /** What the last look found; null when it found nothing to say or never looked. */
  state: TTourSourceHintsState | null;
}

/** What a look found about one source, written for the user it belongs to. */
interface TourSourceHintWrite {
  place_id: number;
  user_id: number;
  state: TTourSourceHintsState | null;
  /** The changed parts as a JSON array, null when none. */
  changes: string | null;
  reason: TTourSourceHintsReason | null;
  external_updated: string | null;
  checked_at: string;
}

export interface TourSourceHintRow {
  place_id: number;
  state: TTourSourceHintsState;
  changes: string | null;
  reason: TTourSourceHintsReason | null;
  external_updated: string | null;
  checked_at: string | null;
}

export interface TourSourceHintListRow extends TourSourceHintRow {
  trip_id: number;
  trip_title: string;
  tour_name: string;
}

/**
 * `tour_source_hints` (WAN-02): what the background watch over a user's own
 * wanderer snapshots found, one row per snapshot, for the user who imported
 * it. Nothing here reads or writes a tour; a hint goes with its snapshot and
 * with its user. Only snapshots in trips the user can still open count, and a
 * hint shows only while the user's connection points at the instance it came
 * from, so a removed connection leaves the rows unread rather than deleted.
 */
export class TourSourceHintsRepository extends TrekRepository<TourSourceHints> {
  private db() {
    return this.kysely<HintsDB>();
  }

  /**
   * The user's snapshots of one instance that are due for a look: never looked
   * at, or last looked at before `checkedBefore`. Longest waiting first, at
   * most `limit`, so every run stays within its budget and all get their turn.
   */
  async listDue(userId: number, instance: string, checkedBefore: string, limit: number): Promise<WatchedSourceRow[]> {
    return await this.db()
      .selectFrom('tour_sources as s')
      .innerJoin('places as p', 'p.id', 's.place_id')
      .leftJoin('tour_source_hints as h', 'h.place_id', 's.place_id')
      .select([
        's.place_id',
        's.external_id',
        's.content_hash',
        's.external_updated',
        'h.seen_hash',
        'h.seen_updated',
        'h.state',
      ])
      .where('s.provider', '=', PROVIDER)
      .where('s.instance', '=', instance)
      .where('s.imported_by', '=', userId)
      .where('p.trip_id', 'in', this.reachableTripIds(userId))
      .where((eb) => eb.or([eb('h.checked_at', 'is', null), eb('h.checked_at', '<', checkedBefore)]))
      .orderBy((eb) => eb.fn.coalesce('h.checked_at', eb.val('')))
      .orderBy('s.place_id')
      .limit(limit)
      .execute()
      .then((rows) => rows.map((row) => ({ ...row, state: (row.state as TTourSourceHintsState | null) ?? null })));
  }

  /** Writes what one look found; what the user last saw in a manual check stays as it is. */
  async record(rows: readonly TourSourceHintWrite[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db()
      .insertInto('tour_source_hints')
      .values([...rows])
      .onConflict((oc) =>
        oc.column('place_id').doUpdateSet((eb) => ({
          state: eb.ref('excluded.state'),
          changes: eb.ref('excluded.changes'),
          reason: eb.ref('excluded.reason'),
          external_updated: eb.ref('excluded.external_updated'),
          checked_at: eb.ref('excluded.checked_at'),
        })),
      )
      .execute();
  }

  /**
   * A manual check read the source: its answer is what the user has seen now,
   * so the open hint goes and later looks compare against this. Only for the
   * user who imported the snapshot; anyone else's check leaves the row alone.
   */
  async markSeen(
    placeId: number,
    userId: number,
    seen: { contentHash: string; externalUpdated: string | null; checkedAt: string },
  ): Promise<void> {
    const source = await this.db()
      .selectFrom('tour_sources')
      .select('imported_by')
      .where('place_id', '=', placeId)
      .where('provider', '=', PROVIDER)
      .executeTakeFirst();
    if (!source || source.imported_by !== userId) return;
    await this.db()
      .insertInto('tour_source_hints')
      .values({
        place_id: placeId,
        user_id: userId,
        state: null,
        changes: null,
        reason: null,
        external_updated: seen.externalUpdated,
        seen_hash: seen.contentHash,
        seen_updated: seen.externalUpdated,
        checked_at: seen.checkedAt,
      })
      .onConflict((oc) =>
        oc.column('place_id').doUpdateSet((eb) => ({
          state: null,
          changes: null,
          reason: null,
          external_updated: eb.ref('excluded.external_updated'),
          seen_hash: eb.ref('excluded.seen_hash'),
          seen_updated: eb.ref('excluded.seen_updated'),
          checked_at: eb.ref('excluded.checked_at'),
        })),
      )
      .execute();
  }

  /** The user's open hints, newest look first. */
  async listOpen(userId: number): Promise<TourSourceHintListRow[]> {
    return await this.openHints(userId).orderBy('h.checked_at', 'desc').orderBy('h.place_id', 'desc').execute();
  }

  /** The user's open hint on one snapshot of a trip; undefined when there is none. */
  async findOpen(userId: number, tripId: number, placeId: number): Promise<TourSourceHintListRow | undefined> {
    return await this.openHints(userId)
      .where('p.trip_id', '=', tripId)
      .where('h.place_id', '=', placeId)
      .executeTakeFirst();
  }

  private openHints(userId: number) {
    return this.db()
      .selectFrom('tour_source_hints as h')
      .innerJoin('tour_sources as s', 's.place_id', 'h.place_id')
      .innerJoin('places as p', 'p.id', 'h.place_id')
      .innerJoin('trips as t', 't.id', 'p.trip_id')
      .innerJoin('wanderer_connections as c', 'c.user_id', 'h.user_id')
      .select([
        'h.place_id',
        'h.state',
        'h.changes',
        'h.reason',
        'h.external_updated',
        'h.checked_at',
        'p.trip_id',
        't.title as trip_title',
        'p.name as tour_name',
      ])
      .where('h.user_id', '=', userId)
      .where('h.state', 'is not', null)
      .whereRef('c.url', '=', 's.instance')
      .where('p.trip_id', 'in', this.reachableTripIds(userId))
      .$narrowType<{ state: TTourSourceHintsState; reason: TTourSourceHintsReason | null }>();
  }

  /** The trips the user can still open: their own and those they are a member of. */
  private reachableTripIds(userId: number) {
    return this.db()
      .selectFrom('trips')
      .select('id')
      .where('user_id', '=', userId)
      .union(this.db().selectFrom('trip_members').select('trip_id as id').where('user_id', '=', userId));
  }
}
