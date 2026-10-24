import { EntityRepositoryType, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TravelTransferChunksRepository } from '../repositories/TravelTransferChunks.repository';
import { TravelTransferObjects } from './TravelTransferObjects.entity';

export class TravelTransferChunks {
  [EntityRepositoryType]?: TravelTransferChunksRepository;
  id!: string;
  object!: Ref<TravelTransferObjects>;
  object_id!: string;
  offset!: number;
  data!: string;
  digest?: string | null;
}

export const TravelTransferChunksSchema = defineEntity({
  class: TravelTransferChunks,
  repository: () => TravelTransferChunksRepository,
  uniques: [{ properties: ['object', 'offset'] }],
  properties: {
    id: p.text().primary(),
    object: () => p.manyToOne(TravelTransferObjects).ref().deleteRule('cascade').hidden(),
    object_id: p.text().persist(false),
    offset: p.integer(),
    data: p.text(),
    digest: p.text().nullable(),
  },
});
