import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { FerrataTilesRepository } from '../repositories/FerrataTiles.repository';

export class FerrataTiles {
  [EntityRepositoryType]?: FerrataTilesRepository;
  [PrimaryKeyProp]?: 'tile_key';
  tile_key!: string;
  payload!: string;
  fetched_at!: number;
}

export const FerrataTilesSchema = defineEntity({
  class: FerrataTiles,
  repository: () => FerrataTilesRepository,
  properties: {
    tile_key: p.text().primary(),
    payload: p.text(),
    fetched_at: p.integer(),
  },
});
