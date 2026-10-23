import { encodeJson } from '../../utils/json-column';
import { TravelTransferChunks as ChunkRow } from '../entities/TravelTransferChunks.entity';
import { TravelTransferGraphs as GraphRow } from '../entities/TravelTransferGraphs.entity';
import { TravelTransferObjects as ObjectRow } from '../entities/TravelTransferObjects.entity';
import { TravelTransferOperations as Operation } from '../entities/TravelTransferOperations.entity';
import { Trips } from '../entities/Trips.entity';
import { Users } from '../entities/Users.entity';
import { TRANSFER_GRAPH, TRANSFER_ORIGINALS, TRANSFER_NATIVE_MAP, type TransferNativeMap } from '../json-columns';
import type { DB } from '../kysely/db';
import { NATIVE_DOMAINS, type NativeDomain, type NativeRow } from './_shared/transfer-native-domains';
import { TrekRepository } from './_shared/trek-repository';
import { UnprocessableEntityException } from '@nestjs/common';
import { travelTransfer } from '@trek/shared';

import { createHash } from 'node:crypto';
import type { z } from 'zod';

type Graph = z.infer<typeof travelTransfer.graphSchema>;

/** All reads bypass identity-map caching: a resumed request must see revocation/edits. */
export class TravelTransferOperationsRepository extends TrekRepository<Operation> {
  async reservedBytes(userId: number): Promise<number> {
    const row = await this.kysely<
      Pick<import('../kysely/db').DB, 'travel_transfer_objects' | 'travel_transfer_operations'>
    >()
      .selectFrom('travel_transfer_objects as o')
      .innerJoin('travel_transfer_operations as op', 'op.id', 'o.operation_id')
      .where('op.user_id', '=', userId)
      .where((eb) => eb.or([eb('op.receipt', 'is', null), eb('o.verified', '=', 1)]))
      .select((eb) => eb.fn.sum('o.size').as('bytes'))
      .executeTakeFirst();
    return Number(row?.bytes ?? 0);
  }
  op(id: string) {
    return this.getEntityManager().findOne(Operation, { id }, { refresh: true });
  }
  async addOp(value: {
    id: string;
    user: number;
    client_id: string;
    operation_id: string;
    target: number | null;
    include_private: number;
    created_at: number;
    expires_at: number;
  }) {
    const { user, target, ...rest } = value;
    await this.kysely<Pick<import('../kysely/db').DB, 'travel_transfer_operations'>>()
      .insertInto('travel_transfer_operations')
      .values({ ...rest, user_id: user, target_id: target })
      .execute();
  }
  async updateOp(id: string, value: { payload_digest?: string; receipt?: string }) {
    await this.getEntityManager().nativeUpdate(Operation, { id }, value);
  }
  async expire(user: number, now: number) {
    await this.getEntityManager().nativeDelete(Operation, { user, receipt: null, expires_at: { $lt: now } });
  }
  active(user: number) {
    return this.getEntityManager().find(Operation, { user, receipt: null }, { refresh: true, limit: 65 });
  }
  objects(operation: string) {
    return this.getEntityManager().find(ObjectRow, { operation }, { refresh: true, limit: 20002 });
  }
  object(id: string) {
    return this.getEntityManager().findOne(ObjectRow, { id }, { refresh: true });
  }
  async addObject(value: { id: string; operation: string; source_id: string; digest: string; size: number }) {
    const { operation, ...rest } = value;
    await this.kysely<Pick<import('../kysely/db').DB, 'travel_transfer_objects'>>()
      .insertInto('travel_transfer_objects')
      .values({ ...rest, operation_id: operation })
      .execute();
  }
  async advance(id: string, received: number, verified: boolean) {
    await this.getEntityManager().nativeUpdate(ObjectRow, { id }, { received, verified: Number(verified) });
  }
  chunks(object: string) {
    return this.getEntityManager().find(ChunkRow, { object }, { orderBy: { offset: 'asc' }, refresh: true });
  }
  chunk(object: string, offset: number) {
    return this.kysely<Pick<DB, 'travel_transfer_chunks'>>()
      .selectFrom('travel_transfer_chunks')
      .selectAll()
      .where('object_id', '=', object)
      .where('offset', '=', offset)
      .executeTakeFirst();
  }
  async addChunk(object: string, offset: number, data: string) {
    await this.kysely<Pick<import('../kysely/db').DB, 'travel_transfer_chunks'>>()
      .insertInto('travel_transfer_chunks')
      .values({
        id: object + ':' + offset,
        object_id: object,
        offset,
        data,
        digest: createHash('sha256').update(Buffer.from(data, 'base64')).digest('hex'),
      })
      .execute();
  }
  graph(trip: number) {
    return this.getEntityManager().findOne(GraphRow, { trip }, { refresh: true });
  }
  async saveGraph(
    trip: number,
    user: number,
    graph: Graph,
    originals: Record<string, string>,
    bindings: TransferNativeMap = {},
  ) {
    const value = {
      graph: encodeJson(TRANSFER_GRAPH, graph),
      originals: encodeJson(TRANSFER_ORIGINALS, originals),
      native_map: encodeJson(TRANSFER_NATIVE_MAP, bindings),
    };
    if (await this.graph(trip)) await this.getEntityManager().nativeUpdate(GraphRow, { trip, user }, value);
    else
      await this.kysely<Pick<import('../kysely/db').DB, 'travel_transfer_graphs'>>()
        .insertInto('travel_transfer_graphs')
        .values({ trip_id: trip, user_id: user, ...value })
        .execute();
  }
  trip(id: number) {
    return this.getEntityManager().findOne(Trips, { id }, { refresh: true });
  }
  user(id: number) {
    return this.getEntityManager().findOne(Users, { id }, { refresh: true });
  }
  trips(user: number, after: number, limit: number) {
    return this.getEntityManager().find(
      Trips,
      { user, id: { $gt: after } },
      { orderBy: { id: 'asc' }, limit, refresh: true },
    );
  }
  async createTrip(user: number, title: string): Promise<number> {
    const row = await this.kysely<Pick<import('../kysely/db').DB, 'trips'>>()
      .insertInto('trips')
      .values({ user_id: user, title, reminder_days: 0 })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }
  async updateTrip(
    id: number,
    fields: {
      title: string;
      description: string | null;
      start_date: string | null;
      end_date: string | null;
      currency: string;
      is_archived: number;
    },
  ) {
    const previous = await this.trip(id);
    await this.getEntityManager().nativeUpdate(
      Trips,
      { id },
      {
        ...fields,
        ...(previous?.start_date !== fields.start_date ? { reminder_sent_for: fields.start_date } : {}),
      },
    );
  }

  /** Explicit domains only; the dynamic SQL identifiers come from our checked-in registry. */
  async nativeRows(trip: number): Promise<Record<string, NativeRow[]>> {
    const rows: Record<string, NativeRow[]> = {
      trips: [{ id: trip }],
      journey_candidates: await this.kysely<Pick<DB, 'journey_entries'>>()
        .selectFrom('journey_entries')
        .select('journey_id')
        .distinct()
        .where('source_trip_id', '=', trip)
        .limit(20001)
        .execute(),
    };
    let count = 0;
    await NATIVE_DOMAINS.reduce(async (previous, domain) => {
      await previous;
      const ids = [
        ...new Set(
          [domain.scope, ...(domain.scope.also ?? [])].flatMap((scope) =>
            (rows[scope.parent] ?? []).map((r) => r[scope.key]),
          ),
        ),
      ].filter((id): id is string | number => id !== null && id !== undefined);
      const result: NativeRow[] = [];
      const chunks = Array.from({ length: Math.ceil(ids.length / 500) }, (_, i) => ids.slice(i * 500, i * 500 + 500));
      await chunks.reduce(async (prior, chunk) => {
        await prior;
        const found = await this.kysely<{ [T in keyof DB]: NativeRow }>()
          .selectFrom(domain.table)
          .selectAll()
          .where(domain.scope.column, 'in', chunk)
          .limit(20001)
          .execute();
        count += found.length;
        if (count > 20000) throw new UnprocessableEntityException('Native trip exceeds transfer record limit');
        result.push(...found);
      }, Promise.resolve());
      rows[domain.table] = result;
    }, Promise.resolve());
    return rows;
  }

  /** New native columns and relationships must be deliberately mapped, never silently dropped. */
  async unprojectedDomain(trip: number, rows: Record<string, NativeRow[]>): Promise<string | null> {
    const allowed = new Set<string>(NATIVE_DOMAINS.map((d) => d.table));
    const excluded = new Set([
      'trip_members',
      'share_tokens',
      'trip_invite_tokens',
      'invite_tokens',
      'travel_transfer_operations',
      'travel_transfer_graphs',
      'travel_transfer_silent_tasks',
      // Operational access/connection/job state is deliberately not portable content.
      'document_connections',
      'journey_contributors',
      'trip_journal_link_members',
      'journey_share_tokens',
      'journey_recording_prep',
      'trek_photo_cache_meta',
    ]);
    for (const domain of NATIVE_DOMAINS) {
      if (rows[domain.table].some((r) => Object.keys(r).some((c) => !domain.columns.includes(c))))
        return domain.table + ' columns';
    }
    // Category/tag definitions are shared lookup data, not roots of a traveller's unrelated collections.
    const catalogues = new Set(['categories', 'tags']);
    const relations = [...this.getEntityManager().getMetadata().getAll().values()]
      .filter((meta) => !allowed.has(meta.tableName) && !excluded.has(meta.tableName))
      .flatMap((meta) =>
        meta.props
          .filter(
            (prop) =>
              prop.targetMeta &&
              (prop.targetMeta.tableName === 'trips' || allowed.has(prop.targetMeta.tableName)) &&
              !catalogues.has(prop.targetMeta.tableName) &&
              (prop.kind === 'm:1' || (prop.kind === '1:1' && prop.owner)) &&
              prop.persist !== false,
          )
          .map((prop) => ({ meta, prop })),
      );
    return relations.reduce(async (previous, { meta, prop }) => {
      const found = await previous;
      if (found) return found;
      const parent = prop.targetMeta;
      if (!parent) return null;
      const keys = (rows[parent.tableName] ?? []).map((r) => r[parent.primaryKeys[0]]).filter((k) => k != null);
      if (!keys.length) return null;
      return (await this.getEntityManager().count(meta.class, { [prop.name]: { $in: keys } })) ? meta.tableName : null;
    }, Promise.resolve<string | null>(null));
  }

  async nativeInsert(domain: NativeDomain, values: NativeRow): Promise<number> {
    const row = await this.kysely<{ [T in keyof DB]: NativeRow }>()
      .insertInto(domain.table)
      .values(values)
      .returning('id')
      .executeTakeFirstOrThrow();
    return Number(row.id);
  }
  async updateMapped(domain: NativeDomain, key: NativeRow, values: NativeRow) {
    if (!Object.keys(values).length) return;
    await this.kysely<{ [T in keyof DB]: NativeRow }>()
      .updateTable(domain.table)
      .set(values)
      .where((eb) => eb.and(Object.entries(key).map(([name, value]) => eb(name, '=', value))))
      .execute();
  }
  async deleteMapped(domain: NativeDomain, key: NativeRow) {
    await this.kysely<{ [T in keyof DB]: NativeRow }>()
      .deleteFrom(domain.table)
      .where((eb) => eb.and(Object.entries(key).map(([name, value]) => eb(name, '=', value))))
      .execute();
  }
  async historicalPeople(ids: number[]): Promise<Record<string, string>> {
    if (!ids.length) return {};
    const result: Record<string, string> = {};
    const chunks = Array.from({ length: Math.ceil(ids.length / 500) }, (_, i) => ids.slice(i * 500, i * 500 + 500));
    await chunks.reduce(async (previous, chunk) => {
      await previous;
      const rows = await this.kysely<Pick<DB, 'users'>>()
        .selectFrom('users')
        .select(['id', 'display_name', 'username'])
        .where('id', 'in', chunk)
        .execute();
      for (const row of rows) result[String(row.id)] = row.display_name || row.username;
    }, Promise.resolve());
    return result;
  }

  fileHash(id: string) {
    return this.kysely<Pick<DB, 'travel_transfer_file_hashes'>>()
      .selectFrom('travel_transfer_file_hashes')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
  /** @txStandalone Rebuildable hash-cache metadata only; each independent write follows storage I/O. */
  async saveFileHash(id: string, stamp: string, size: number, digest: string) {
    await this.kysely<Pick<DB, 'travel_transfer_file_hashes'>>()
      .insertInto('travel_transfer_file_hashes')
      .values({ id, stamp, size, digest })
      .onConflict((oc) => oc.column('id').doUpdateSet({ stamp, size, digest }))
      .execute();
  }
  async fileIsLinked(filename: string): Promise<boolean> {
    return Boolean(
      await this.kysely<Pick<DB, 'trip_files'>>()
        .selectFrom('trip_files')
        .select('id')
        .where('filename', '=', filename)
        .limit(1)
        .executeTakeFirst(),
    );
  }
  async silenceTask(id: number) {
    await this.kysely<Pick<DB, 'travel_transfer_silent_tasks'>>()
      .insertInto('travel_transfer_silent_tasks')
      .values({ todo_id: id })
      .onConflict((oc) => oc.column('todo_id').doNothing())
      .execute();
  }
  graphsForUser(user: number) {
    return this.getEntityManager().find(GraphRow, { user }, { refresh: true });
  }
  async retiredCandidates(user: number) {
    return this.kysely<Pick<DB, 'travel_transfer_objects' | 'travel_transfer_operations'>>()
      .selectFrom('travel_transfer_objects as o')
      .innerJoin('travel_transfer_operations as op', 'op.id', 'o.operation_id')
      .select('o.id')
      .where('op.user_id', '=', user)
      .where('op.receipt', 'is not', null)
      .where('o.verified', '=', 1)
      .execute();
  }
  async retireObject(id: string) {
    const object = await this.object(id);
    if (!object) return;
    await Array.from(
      { length: Math.max(1, Math.ceil(object.size / travelTransfer.CHUNK)) },
      (_, i) => i * travelTransfer.CHUNK,
    ).reduce(async (previous, offset) => {
      await previous;
      const chunk = await this.chunk(id, offset);
      if (!chunk) return;
      const digest = chunk.digest ?? createHash('sha256').update(Buffer.from(chunk.data, 'base64')).digest('hex');
      await this.getEntityManager().nativeUpdate(ChunkRow, { id: chunk.id }, { data: '', digest });
    }, Promise.resolve());
    // Retain the digest/size/identity tombstone: reusing an original ID with different bytes still fails.
    await this.getEntityManager().nativeUpdate(ObjectRow, { id }, { received: 0, verified: 0 });
  }
}
