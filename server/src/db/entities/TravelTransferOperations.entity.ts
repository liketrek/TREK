import { Collection, EntityRepositoryType, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TravelTransferOperationsRepository } from '../repositories/TravelTransferOperations.repository';
import { TravelTransferObjects } from './TravelTransferObjects.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TravelTransferOperations {
  [EntityRepositoryType]?: TravelTransferOperationsRepository;
  id!: string;
  user!: Ref<Users>;
  user_id!: number;
  client_id!: string;
  operation_id!: string;
  target?: Ref<Trips> | null;
  target_id?: number | null;
  include_private!: number;
  payload_digest?: string | null;
  receipt?: string | null;
  created_at!: number;
  expires_at!: number;
  travel_transfer_objects_collection = new Collection<TravelTransferObjects>(this);
}

export const TravelTransferOperationsSchema = defineEntity({
  class: TravelTransferOperations,
  repository: () => TravelTransferOperationsRepository,
  uniques: [{ properties: ['user', 'client_id', 'operation_id'] }],
  properties: {
    id: p.text().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_transfer_user'),
    user_id: p.integer().persist(false).index('idx_transfer_user'),
    client_id: p.text(),
    operation_id: p.text(),
    target: () => p.manyToOne(Trips).ref().deleteRule('cascade').nullable().hidden().index('idx_transfer_target'),
    target_id: p.integer().nullable().persist(false).index('idx_transfer_target'),
    include_private: p.integer(),
    payload_digest: p.text().nullable(),
    receipt: p.text().nullable(),
    created_at: p.integer(),
    expires_at: p.integer().index('idx_transfer_expiry'),
    travel_transfer_objects_collection: () => p.oneToMany(TravelTransferObjects).mappedBy('operation').hidden(),
  },
});
