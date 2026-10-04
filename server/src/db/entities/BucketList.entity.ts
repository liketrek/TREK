import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { BucketListRepository } from '../repositories/BucketList.repository';
import { DbTimestampType } from '../types';
import { DawarichVisitSuggestions } from './DawarichVisitSuggestions.entity';
import { Users } from './Users.entity';

export class BucketList {
  [EntityRepositoryType]?: BucketListRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  name!: string;
  lat?: number | null;
  lng?: number | null;
  country_code?: string | null;
  notes?: string | null;
  created_at?: string | null;
  target_date?: string | null;
  visited_at?: string | null;
  visited_source?: string | null;
  region_code?: string | null;
  dawarich_visit_suggestions_collection = new Collection<DawarichVisitSuggestions>(this);
  dawarich_visit_suggestions_collection1 = new Collection<DawarichVisitSuggestions>(this);
}

export const BucketListSchema = defineEntity({
  class: BucketList,
  repository: () => BucketListRepository,
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    name: p.text(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    country_code: p.text().nullable(),
    notes: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    target_date: p.text().nullable().defaultRaw(`NULL`),
    visited_at: p.text().nullable(),
    visited_source: p.text().nullable(),
    region_code: p.text().nullable(),
    dawarich_visit_suggestions_collection: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('acceptedBucketListItem').hidden(),
    dawarich_visit_suggestions_collection1: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('matchedBucketListItem').hidden(),
  },
});
