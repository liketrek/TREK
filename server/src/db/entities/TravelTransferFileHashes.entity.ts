import { EntityRepositoryType, defineEntity, p } from '@mikro-orm/core';
import { TravelTransferFileHashesRepository } from '../repositories/TravelTransferFileHashes.repository';

export class TravelTransferFileHashes {
  [EntityRepositoryType]?: TravelTransferFileHashesRepository;
  id!: string;
  stamp!: string;
  size!: number;
  digest!: string;
}

export const TravelTransferFileHashesSchema = defineEntity({
  class: TravelTransferFileHashes,
  repository: () => TravelTransferFileHashesRepository,
  properties: {
    id: p.text().primary(),
    stamp: p.text(),
    size: p.integer(),
    digest: p.text(),
  },
});
