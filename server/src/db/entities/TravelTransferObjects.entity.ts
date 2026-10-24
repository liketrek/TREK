import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TravelTransferObjectsRepository } from '../repositories/TravelTransferObjects.repository';
import { TravelTransferChunks } from './TravelTransferChunks.entity';
import { TravelTransferOperations } from './TravelTransferOperations.entity';

export class TravelTransferObjects {
  [EntityRepositoryType]?: TravelTransferObjectsRepository;
  id!: string;
  operation!: Ref<TravelTransferOperations>;
  operation_id!: string;
  source_id!: string;
  digest!: string;
  size!: number;
  received: number & Opt = 0;
  verified: number & Opt = 0;
  travel_transfer_chunks_collection = new Collection<TravelTransferChunks>(this);
}

export const TravelTransferObjectsSchema = defineEntity({
  class: TravelTransferObjects,
  repository: () => TravelTransferObjectsRepository,
  uniques: [{ properties: ['operation', 'source_id'] }],
  properties: {
    id: p.text().primary(),
    operation: () => p.manyToOne(TravelTransferOperations).ref().deleteRule('cascade').hidden(),
    operation_id: p.text().persist(false),
    source_id: p.text(),
    digest: p.text(),
    size: p.integer(),
    received: p.integer().default(0),
    verified: p.integer().default(0),
    travel_transfer_chunks_collection: () => p.oneToMany(TravelTransferChunks).mappedBy('object').hidden(),
  },
});
