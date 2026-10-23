import { encodeJson } from '../../utils/json-column';
import { TravelTransferChunks as ChunkRow } from '../entities/TravelTransferChunks.entity';
import { TravelTransferGraphs as GraphRow } from '../entities/TravelTransferGraphs.entity';
import { TravelTransferObjects as ObjectRow } from '../entities/TravelTransferObjects.entity';
import { TravelTransferOperations as Operation } from '../entities/TravelTransferOperations.entity';
import { Trips } from '../entities/Trips.entity';
import { Users } from '../entities/Users.entity';
import { TRANSFER_GRAPH, TRANSFER_ORIGINALS } from '../json-columns';
import { TrekRepository } from './_shared/trek-repository';
import { travelTransfer } from '@trek/shared';

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
    return this.getEntityManager().findOne(ChunkRow, { object, offset }, { refresh: true });
  }
  async addChunk(object: string, offset: number, data: string) {
    await this.kysely<Pick<import('../kysely/db').DB, 'travel_transfer_chunks'>>()
      .insertInto('travel_transfer_chunks')
      .values({ id: object + ':' + offset, object_id: object, offset, data })
      .execute();
  }
  graph(trip: number) {
    return this.getEntityManager().findOne(GraphRow, { trip }, { refresh: true });
  }
  async saveGraph(trip: number, user: number, graph: Graph, originals: Record<string, string>) {
    const value = { graph: encodeJson(TRANSFER_GRAPH, graph), originals: encodeJson(TRANSFER_ORIGINALS, originals) };
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
    fields: { title: string; description: string | null; start_date: string | null; end_date: string | null },
  ) {
    await this.getEntityManager().nativeUpdate(Trips, { id }, fields);
  }

  /**
   * Fail closed until every native domain has a reviewed projector. Discovering
   * relations from ORM metadata also catches new domains added upstream later.
   * Account security, membership and transfer bookkeeping are never graph data.
   */
  async unprojectedDomain(trip: number): Promise<string | null> {
    const excluded = new Set([
      'TripMembers',
      'ShareTokens',
      'TripInviteTokens',
      'InviteTokens',
      'TravelTransferOperations',
      'TravelTransferGraphs',
    ]);
    const relations = [...this.getEntityManager().getMetadata().getAll().values()]
      .filter((meta) => !excluded.has(meta.className))
      .flatMap((meta) =>
        meta.props
          .filter(
            (prop) =>
              prop.targetMeta?.className === 'Trips' &&
              (prop.kind === 'm:1' || (prop.kind === '1:1' && prop.owner)) &&
              prop.persist !== false,
          )
          .map((prop) => ({ meta, prop })),
      );
    // Stop at the first unsupported domain, with no concurrent query fan-out.
    return relations.reduce(async (previous, { meta, prop }) => {
      const found = await previous;
      if (found) return found;
      return (await this.getEntityManager().count(meta.class, { [prop.name]: trip })) ? meta.tableName : null;
    }, Promise.resolve<string | null>(null));
  }
}
