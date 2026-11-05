import type { PlaceContribOutbox } from '../entities/PlaceContribOutbox.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type OutboxKyselyDB = Pick<DB, 'place_contrib_outbox' | 'place_field_origin' | 'places'>;

/** One queued value as the sender reads it. */
export interface OutboxRow {
  id: number;
  contrib_key: string;
  field: string;
  value: string;
  place_id: number;
  place_name: string;
  lat: number | null;
  lng: number | null;
  country: string | null;
  cid: string;
  attempts: number;
  created_at: string;
}

/** A place with values a user typed, and the hash each of those values had when it was typed. */
export interface PlaceTypedRow {
  place: {
    id: number;
    name: string;
    lat: number | null;
    lng: number | null;
    osm_id: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    opening_hours: string | null;
    description: string | null;
    image_url: string | null;
  };
  typed: { field: string; value_hash: string }[];
}

/**
 * A value the sender read: its settle writes touch the row only while it still
 * holds that value, since a newer one keeps the row's id but brings a new cid.
 */
export type OutboxSent = Pick<OutboxRow, 'id' | 'cid'>;

const ids = (sent: OutboxSent[]): number[] => sent.map((row) => row.id);
const cids = (sent: OutboxSent[]): string[] => sent.map((row) => row.cid);

/** A value to queue: the newest one for its key and field replaces what waits there. */
interface OutboxWrite {
  contrib_key: string;
  field: string;
  value: string;
  place_id: number;
  place_name: string;
  lat: number | null;
  lng: number | null;
  country: string | null;
  cid: string;
  eligible_at: string;
  next_attempt_at: string;
}

/** What the place and its origin row say about a queued value right now. */
export interface OutboxCurrentRow {
  id: number;
  origin: string | null;
  value_hash: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  description: string | null;
  image_url: string | null;
}

const OUTBOX_COLUMNS = [
  'id',
  'contrib_key',
  'field',
  'value',
  'place_id',
  'place_name',
  'lat',
  'lng',
  'country',
  'cid',
  'attempts',
  'created_at',
] as const;

/**
 * `place_contrib_outbox`: the values waiting to be sent to the TREK Places
 * API, one per contribution key and field. A new value replaces the queued one
 * (and its attempts); the sender takes what is due, oldest first.
 */
export class PlaceContribOutboxRepository extends TrekRepository<PlaceContribOutbox> {
  private db() {
    return this.kysely<OutboxKyselyDB>();
  }

  /** Queues a value, replacing whatever waited for the same key and field, attempts and age included. */
  async upsertEntry(row: OutboxWrite): Promise<void> {
    await this.db()
      .insertInto('place_contrib_outbox')
      .values({ ...row, attempts: 0 })
      .onConflict((oc) =>
        oc.columns(['contrib_key', 'field']).doUpdateSet({
          value: (eb) => eb.ref('excluded.value'),
          place_id: (eb) => eb.ref('excluded.place_id'),
          place_name: (eb) => eb.ref('excluded.place_name'),
          lat: (eb) => eb.ref('excluded.lat'),
          lng: (eb) => eb.ref('excluded.lng'),
          country: (eb) => eb.ref('excluded.country'),
          cid: (eb) => eb.ref('excluded.cid'),
          attempts: 0,
          created_at: (eb) => eb.ref('excluded.created_at'),
          eligible_at: (eb) => eb.ref('excluded.eligible_at'),
          next_attempt_at: (eb) => eb.ref('excluded.next_attempt_at'),
        }),
      )
      .execute();
  }

  /** Whether a value waits for this key and field. */
  async hasEntry(contribKey: string, field: string): Promise<boolean> {
    const row = await this.db()
      .selectFrom('place_contrib_outbox')
      .select('id')
      .where('contrib_key', '=', contribKey)
      .where('field', '=', field)
      .executeTakeFirst();
    return row !== undefined;
  }

  /** Drops the queued values of these fields of one place. */
  async deleteForPlace(placeId: number, fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    const result = await this.db()
      .deleteFrom('place_contrib_outbox')
      .where('place_id', '=', placeId)
      .where('field', 'in', fields)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /** Drops every queued value of these fields, for a field an admin switched off. */
  async deleteFields(fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    const result = await this.db().deleteFrom('place_contrib_outbox').where('field', 'in', fields).executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /** Drops the values the sender settled; a row that took a newer value since stays queued. */
  async deleteSent(sent: OutboxSent[]): Promise<number> {
    if (sent.length === 0) return 0;
    const result = await this.db()
      .deleteFrom('place_contrib_outbox')
      .where('id', 'in', ids(sent))
      .where('cid', 'in', cids(sent))
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /** Empties the queue; answers how many values went. */
  async deleteAll(): Promise<number> {
    const result = await this.db().deleteFrom('place_contrib_outbox').executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async size(): Promise<number> {
    const row = await this.db()
      .selectFrom('place_contrib_outbox')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  /** The keys whose first value is due at `now`, oldest first, at most `limit` of them. */
  async dueKeys(now: string, limit: number): Promise<string[]> {
    const rows = await this.db()
      .selectFrom('place_contrib_outbox')
      .select('contrib_key')
      .where('next_attempt_at', '<=', now)
      .groupBy('contrib_key')
      .orderBy((eb) => eb.fn.min('next_attempt_at'))
      .limit(limit)
      .execute();
    return rows.map((row) => row.contrib_key);
  }

  /** The due values of one key. */
  async dueFor(contribKey: string, now: string): Promise<OutboxRow[]> {
    return this.db()
      .selectFrom('place_contrib_outbox')
      .select([...OUTBOX_COLUMNS])
      .where('contrib_key', '=', contribKey)
      .where('next_attempt_at', '<=', now)
      .orderBy('id')
      .execute();
  }

  /**
   * The queued values first queued before `before`, which the sender gives up
   * on; at most `limit` per call, so a long sweep goes in passes.
   */
  async queuedBefore(before: string, limit: number): Promise<OutboxRow[]> {
    return this.db()
      .selectFrom('place_contrib_outbox')
      .select([...OUTBOX_COLUMNS])
      .where('created_at', '<', before)
      .orderBy('id')
      .limit(limit)
      .execute();
  }

  /**
   * Counts the attempt and moves the values to their next try; a row that took
   * a newer value since is left as it is.
   */
  async scheduleRetry(sent: OutboxSent[], nextAttemptAt: string): Promise<void> {
    if (sent.length === 0) return;
    await this.db()
      .updateTable('place_contrib_outbox')
      .set((eb) => ({ attempts: eb('attempts', '+', 1), next_attempt_at: nextAttemptAt }))
      .where('id', 'in', ids(sent))
      .where('cid', 'in', cids(sent))
      .execute();
  }

  /**
   * Moves the values to a later try without counting one (the service is
   * pausing, not failing); a row that took a newer value since is left as it is.
   */
  async postpone(sent: OutboxSent[], nextAttemptAt: string): Promise<void> {
    if (sent.length === 0) return;
    await this.db()
      .updateTable('place_contrib_outbox')
      .set({ next_attempt_at: nextAttemptAt })
      .where('id', 'in', ids(sent))
      .where('cid', 'in', cids(sent))
      .execute();
  }

  /**
   * The value each queued row's place holds now, with the origin row of that
   * field: the sender sends only what is still the user's.
   */
  async currentOf(ids: number[]): Promise<Array<OutboxCurrentRow & { field: string }>> {
    if (ids.length === 0) return [];
    return this.db()
      .selectFrom('place_contrib_outbox as o')
      .innerJoin('places as p', 'p.id', 'o.place_id')
      .leftJoin('place_field_origin as f', (join) =>
        join.onRef('f.place_id', '=', 'o.place_id').onRef('f.field', '=', 'o.field'),
      )
      .select([
        'o.id as id',
        'o.field as field',
        'f.origin as origin',
        'f.value_hash as value_hash',
        'p.website as website',
        'p.phone as phone',
        'p.email as email',
        'p.opening_hours as opening_hours',
        'p.description as description',
        'p.image_url as image_url',
      ])
      .where('o.id', 'in', ids)
      .execute();
  }

  /**
   * The next places after `afterId`, by id, with a value a user typed in one
   * of these fields, each with the origins of those fields: the catch-up
   * after an agreement walks them page by page.
   */
  async typedAfter(afterId: number, fields: string[], limit: number): Promise<PlaceTypedRow[]> {
    if (fields.length === 0) return [];
    const placeIds = (
      await this.db()
        .selectFrom('place_field_origin')
        .select('place_id')
        .distinct()
        .where('origin', '=', 'user')
        .where('field', 'in', fields)
        .where('place_id', '>', afterId)
        .orderBy('place_id')
        .limit(limit)
        .execute()
    ).map((row) => row.place_id);
    if (placeIds.length === 0) return [];
    const typed = await this.db()
      .selectFrom('place_field_origin')
      .select(['place_id', 'field', 'value_hash'])
      .where('origin', '=', 'user')
      .where('field', 'in', fields)
      .where('place_id', 'in', placeIds)
      .execute();
    const places = await this.db()
      .selectFrom('places')
      .select([
        'id',
        'name',
        'lat',
        'lng',
        'osm_id',
        'website',
        'phone',
        'email',
        'opening_hours',
        'description',
        'image_url',
      ])
      .where('id', 'in', placeIds)
      .orderBy('id')
      .execute();
    return places.map((place) => ({
      place,
      typed: typed.filter((row) => row.place_id === place.id).map(({ field, value_hash }) => ({ field, value_hash })),
    }));
  }
}
