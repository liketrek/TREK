import type { MailIngestCandidates } from '../entities/MailIngestCandidates.entity';
import type { DB } from '../kysely/db';
import type { DbTimestamp } from '../types';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

import type { Expression, SqlBool } from 'kysely';

/** One `mail_ingest_candidates` row as stored: the JSON columns as text. */
export interface MailIngestCandidateRow {
  id: number;
  message_id: number;
  user_id: number;
  position: number;
  item_json: string | null;
  source: string | null;
  checks_json: string | null;
  uncertain_fields: string | null;
  match_json: string | null;
  suggested_trip_id: number | null;
  dedupe_key: string | null;
  content_hash: string | null;
  resolution: string;
  reason: string | null;
  resolved_trip_id: number | null;
  created_ids_json: string | null;
  attach_error: string | null;
  resolved_by: number | null;
  resolved_at: string | null;
  undo_until: string | null;
  created_at: string;
}

const _mailIngestCandidateRowKeys: AssertRowKeys<MailIngestCandidateRow, MailIngestCandidates> = true;

/** A booking read from a mail, as the pipeline writes it: waiting, or already decided in the same write. */
export interface MailIngestCandidateInsert {
  messageId: number;
  userId: number;
  position: number;
  itemJson: string | null;
  source: string | null;
  checksJson: string | null;
  uncertainFields: string | null;
  matchJson: string | null;
  suggestedTripId: number | null;
  dedupeKey: string | null;
  contentHash: string | null;
  resolution: string;
  reason: string | null;
  createdAt: DbTimestamp;
  /** For an entry decided as it is written: the trip it went to, what it created, until when it can be undone. */
  resolvedTripId?: number | null;
  createdIdsJson?: string | null;
  resolvedAt?: DbTimestamp | null;
  undoUntil?: DbTimestamp | null;
}

/** What deciding an entry writes. */
export interface MailIngestResolutionPatch {
  resolution: string;
  reason: string | null;
  resolvedTripId: number | null;
  createdIdsJson: string | null;
  resolvedBy: number | null;
  resolvedAt: DbTimestamp;
  undoUntil: DbTimestamp | null;
}

/** A trip a booking from a mail may go to, as the import weighs it. */
export interface MailIngestTripRow {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  /** The owner, for the permission check. */
  user_id: number;
  currency: string | null;
}

/** A place of a trip with a position, for naming its destinations and checking a booking lies near them. */
export interface MailIngestTripPlaceRow {
  trip_id: number;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
}

/** The person a mail is for, as the pipeline needs them. */
export interface MailIngestPersonRow {
  id: number;
  username: string;
  email: string;
  role: string;
}

/** What tells one booking from another already in a trip: its type, its start window and its reference. */
export interface MailIngestSimilarProbe {
  type: string;
  startFrom: string | null;
  startTo: string | null;
  confirmation: string | null;
}

type CandidatesKyselyDB = Pick<
  DB,
  | 'mail_ingest_candidates'
  | 'trips'
  | 'trip_members'
  | 'days'
  | 'places'
  | 'users'
  | 'reservations'
  | 'day_assignments'
  | 'day_accommodations'
  | 'budget_item_payers'
>;

/** The most places a trip lends its destinations and its geography to the import. */
const PLACES_PER_LOOKUP = 2000;

/**
 * `mail_ingest_candidates`: the bookings read from forwarded mails, and the
 * reads the import makes of the trips they may go to. Those reads touch the
 * trips, days, places, users and reservations tables directly, by column, so
 * the import weighs a booking without reaching into five other domains for
 * one projection each; every write it makes to a trip goes through the
 * owning services.
 */
export class MailIngestCandidatesRepository extends TrekRepository<MailIngestCandidates> {
  private db() {
    return this.kysely<CandidatesKyselyDB>();
  }

  async insertCandidate(row: MailIngestCandidateInsert): Promise<number> {
    const inserted = await this.db()
      .insertInto('mail_ingest_candidates')
      .values({
        message_id: row.messageId,
        user_id: row.userId,
        position: row.position,
        item_json: row.itemJson,
        source: row.source,
        checks_json: row.checksJson,
        uncertain_fields: row.uncertainFields,
        match_json: row.matchJson,
        suggested_trip_id: row.suggestedTripId,
        dedupe_key: row.dedupeKey,
        content_hash: row.contentHash,
        resolution: row.resolution,
        reason: row.reason,
        created_at: row.createdAt,
        resolved_trip_id: row.resolvedTripId ?? null,
        created_ids_json: row.createdIdsJson ?? null,
        resolved_at: row.resolvedAt ?? null,
        undo_until: row.undoUntil ?? null,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  async findById(id: number): Promise<MailIngestCandidateRow | null> {
    const row = await this.db()
      .selectFrom('mail_ingest_candidates')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }

  /** The entries read from one mail, in the order the mail listed them. */
  async listForMessage(messageId: number): Promise<MailIngestCandidateRow[]> {
    return this.db()
      .selectFrom('mail_ingest_candidates')
      .selectAll()
      .where('message_id', '=', messageId)
      .orderBy('position', 'asc')
      .orderBy('id', 'asc')
      .execute();
  }

  /**
   * Decides an entry, if it is still in one of the `from` states: one
   * conditional update, so of two decisions at once only the first lands.
   */
  async resolve(id: number, from: readonly string[], patch: MailIngestResolutionPatch): Promise<boolean> {
    const result = await this.db()
      .updateTable('mail_ingest_candidates')
      .set({
        resolution: patch.resolution,
        reason: patch.reason,
        resolved_trip_id: patch.resolvedTripId,
        created_ids_json: patch.createdIdsJson,
        resolved_by: patch.resolvedBy,
        resolved_at: patch.resolvedAt,
        undo_until: patch.undoUntil,
      })
      .where('id', '=', id)
      .where('resolution', 'in', [...from])
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /** Records the documents attached after the booking was written, or why that failed. */
  async setAttachments(id: number, createdIdsJson: string, attachError: string | null): Promise<void> {
    await this.db()
      .updateTable('mail_ingest_candidates')
      .set({ created_ids_json: createdIdsJson, attach_error: attachError })
      .where('id', '=', id)
      .execute();
  }

  /** The person's entries waiting in the inbox. */
  async countPending(userId: number): Promise<number> {
    const row = await this.db()
      .selectFrom('mail_ingest_candidates')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('user_id', '=', userId)
      .where('resolution', '=', 'pending')
      .executeTakeFirstOrThrow();
    return Number(row.n);
  }

  /** Whether a booking of this content went into the trip from a mail and was undone: never added again on its own. */
  async wasUndoneInTrip(tripId: number, contentHash: string): Promise<boolean> {
    const row = await this.db()
      .selectFrom('mail_ingest_candidates')
      .select('id')
      .where('resolved_trip_id', '=', tripId)
      .where('content_hash', '=', contentHash)
      .where('resolution', '=', 'undone')
      .executeTakeFirst();
    return row !== undefined;
  }

  /** Retention: deletes the entries decided before `cutoff`; answers how many went. */
  async deleteResolvedBefore(cutoff: DbTimestamp): Promise<number> {
    const result = await this.db()
      .deleteFrom('mail_ingest_candidates')
      .where('resolution', '!=', 'pending')
      .where('resolved_at', '<', cutoff)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  // ── What the import reads of the trips ────────────────────────────────────

  /**
   * The trips the person owns or is a member of, not archived, that end on or
   * after `endCutoff` or have no end date, most recent start first. Whether
   * the person may add bookings to each is the service's check.
   */
  async listOpenTrips(userId: number, endCutoff: string, limit: number): Promise<MailIngestTripRow[]> {
    return this.db()
      .selectFrom('trips as t')
      .select(['t.id', 't.title', 't.start_date', 't.end_date', 't.user_id', 't.currency'])
      .where((eb) =>
        eb.or([
          eb('t.user_id', '=', userId),
          eb.exists(
            eb
              .selectFrom('trip_members as m')
              .select('m.id')
              .whereRef('m.trip_id', '=', 't.id')
              .where('m.user_id', '=', userId),
          ),
        ]),
      )
      .where((eb) => eb.or([eb('t.is_archived', 'is', null), eb('t.is_archived', '=', 0)]))
      .where((eb) => eb.or([eb('t.end_date', 'is', null), eb('t.end_date', '>=', endCutoff)]))
      .orderBy('t.start_date', 'desc')
      .orderBy('t.id', 'desc')
      .limit(limit)
      .execute();
  }

  /** One trip the person owns or is a member of and that is not archived, whatever its dates; null otherwise. */
  async findOpenTrip(userId: number, tripId: number): Promise<MailIngestTripRow | null> {
    const row = await this.db()
      .selectFrom('trips as t')
      .select(['t.id', 't.title', 't.start_date', 't.end_date', 't.user_id', 't.currency'])
      .where('t.id', '=', tripId)
      .where((eb) =>
        eb.or([
          eb('t.user_id', '=', userId),
          eb.exists(
            eb
              .selectFrom('trip_members as m')
              .select('m.id')
              .whereRef('m.trip_id', '=', 't.id')
              .where('m.user_id', '=', userId),
          ),
        ]),
      )
      .where((eb) => eb.or([eb('t.is_archived', 'is', null), eb('t.is_archived', '=', 0)]))
      .executeTakeFirst();
    return row ?? null;
  }

  /** The dated days of these trips, by date. */
  async listDatedDays(tripIds: readonly number[]): Promise<Array<{ id: number; trip_id: number; date: string }>> {
    if (tripIds.length === 0) return [];
    const rows = await this.db()
      .selectFrom('days')
      .select(['id', 'trip_id', 'date'])
      .where('trip_id', 'in', [...tripIds])
      .where('date', 'is not', null)
      .orderBy('trip_id', 'asc')
      .orderBy('date', 'asc')
      .execute();
    return rows.flatMap((row) => (row.date === null ? [] : [{ id: row.id, trip_id: row.trip_id, date: row.date }]));
  }

  /** The places of these trips that have a position, oldest first. */
  async listPlacesWithPosition(tripIds: readonly number[]): Promise<MailIngestTripPlaceRow[]> {
    if (tripIds.length === 0) return [];
    const rows = await this.db()
      .selectFrom('places')
      .select(['trip_id', 'name', 'address', 'lat', 'lng'])
      .where('trip_id', 'in', [...tripIds])
      .where('lat', 'is not', null)
      .where('lng', 'is not', null)
      .orderBy('id', 'asc')
      .limit(PLACES_PER_LOOKUP)
      .execute();
    return rows.flatMap((row) =>
      row.lat === null || row.lng === null ? [] : [{ ...row, lat: row.lat, lng: row.lng }],
    );
  }

  async findPerson(userId: number): Promise<MailIngestPersonRow | null> {
    const row = await this.db()
      .selectFrom('users')
      .select(['id', 'username', 'email', 'role'])
      .where('id', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  /** Whether the trip holds a booking an import stored under one of these sources and this key. */
  async tripHasExternal(tripId: number, sources: readonly string[], externalId: string): Promise<boolean> {
    const row = await this.db()
      .selectFrom('reservations')
      .select('id')
      .where('trip_id', '=', tripId)
      .where('external_source', 'in', [...sources])
      .where('external_id', '=', externalId)
      .executeTakeFirst();
    return row !== undefined;
  }

  /**
   * Whether the trip holds a booking that looks like this one: the same
   * reference, or the same type starting in the same window.
   */
  async tripHasSimilar(tripId: number, probe: MailIngestSimilarProbe): Promise<boolean> {
    const { type, startFrom, startTo, confirmation } = probe;
    const row = await this.db()
      .selectFrom('reservations')
      .select('id')
      .where('trip_id', '=', tripId)
      .where((eb) => {
        const either: Expression<SqlBool>[] = [];
        if (confirmation) either.push(eb('confirmation_number', '=', confirmation));
        if (startFrom && startTo) {
          either.push(
            eb.and([
              eb('type', '=', type),
              eb('reservation_time', '>=', startFrom),
              eb('reservation_time', '<=', startTo),
            ]),
          );
        }
        // An empty list reads as false: a probe with neither names nothing.
        return eb.or(either);
      })
      .executeTakeFirst();
    return row !== undefined;
  }

  /** Whether a booking, a day plan entry or a stay still names the place. */
  async placeInUse(placeId: number): Promise<boolean> {
    const [booking, planned, stay] = await Promise.all([
      this.db().selectFrom('reservations').select('id').where('place_id', '=', placeId).executeTakeFirst(),
      this.db().selectFrom('day_assignments').select('id').where('place_id', '=', placeId).executeTakeFirst(),
      this.db().selectFrom('day_accommodations').select('id').where('place_id', '=', placeId).executeTakeFirst(),
    ]);
    return booking !== undefined || planned !== undefined || stay !== undefined;
  }

  /** How many payers the costs name: a cost someone settled with moves balances. */
  async countPayers(budgetItemIds: readonly number[]): Promise<number> {
    if (budgetItemIds.length === 0) return 0;
    const row = await this.db()
      .selectFrom('budget_item_payers')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('budget_item_id', 'in', [...budgetItemIds])
      .executeTakeFirstOrThrow();
    return Number(row.n);
  }
}
