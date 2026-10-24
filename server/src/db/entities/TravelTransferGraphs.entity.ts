import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TravelTransferGraphsRepository } from '../repositories/TravelTransferGraphs.repository';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TravelTransferGraphs {
  [EntityRepositoryType]?: TravelTransferGraphsRepository;
  [PrimaryKeyProp]?: 'trip';
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  graph!: string;
  originals!: string;
  native_map: string & Opt = '{}';
}

export const TravelTransferGraphsSchema = defineEntity({
  class: TravelTransferGraphs,
  repository: () => TravelTransferGraphsRepository,
  properties: {
    trip: () => p.oneToOne(Trips).primary().ref().hidden(),
    trip_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_transfer_graph_user'),
    user_id: p.integer().persist(false).index('idx_transfer_graph_user'),
    graph: p.text(),
    originals: p.text(),
    native_map: p.text().default('{}'),
  },
});
