import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PlaceContribOutboxRepository } from '../repositories/PlaceContribOutbox.repository';
import { DbTimestampType } from '../types';
import { Places } from './Places.entity';

export class PlaceContribOutbox {
  [EntityRepositoryType]?: PlaceContribOutboxRepository;
  id!: number & Opt;
  contrib_key!: string;
  field!: string;
  value!: string;
  place!: Ref<Places>;
  place_id!: number;
  place_name!: string;
  lat?: number | null;
  lng?: number | null;
  country?: string | null;
  cid!: string;
  attempts: number & Opt = 0;
  eligible_at!: string;
  next_attempt_at!: string;
  created_at!: string & Opt;
}

export const PlaceContribOutboxSchema = defineEntity({
  class: PlaceContribOutbox,
  repository: () => PlaceContribOutboxRepository,
  uniques: [{ properties: ['contrib_key', 'field'] }],
  properties: {
    id: p.integer().primary(),
    contrib_key: p.text(),
    field: p.text(),
    value: p.text(),
    place: () => p.manyToOne(Places).ref().deleteRule('cascade').hidden().index('idx_place_contrib_outbox_place'),
    place_id: p.integer().persist(false).index('idx_place_contrib_outbox_place'),
    place_name: p.text(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    country: p.text().nullable(),
    cid: p.text(),
    attempts: p.integer().default(0),
    eligible_at: p.type(DbTimestampType),
    next_attempt_at: p.type(DbTimestampType).index('idx_place_contrib_outbox_due'),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
