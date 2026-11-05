import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PlaceFieldOriginRepository } from '../repositories/PlaceFieldOrigin.repository';
import { DbTimestampType } from '../types';
import { Places } from './Places.entity';

export class PlaceFieldOrigin {
  [EntityRepositoryType]?: PlaceFieldOriginRepository;
  [PrimaryKeyProp]?: ['place', 'field'];
  place!: Ref<Places>;
  place_id!: number;
  field!: string;
  origin!: string;
  value_hash!: string;
  updated_at!: string & Opt;
}

export const PlaceFieldOriginSchema = defineEntity({
  class: PlaceFieldOrigin,
  repository: () => PlaceFieldOriginRepository,
  uniques: [{ properties: ['place', 'field'] }],
  properties: {
    place: () => p.manyToOne(Places).primary().ref().deleteRule('cascade').hidden(),
    place_id: p.integer().persist(false),
    field: p.text().primary(),
    origin: p.text(),
    value_hash: p.text(),
    updated_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
