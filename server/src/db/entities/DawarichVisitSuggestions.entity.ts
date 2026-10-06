import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { DawarichVisitSuggestionsRepository } from '../repositories/DawarichVisitSuggestions.repository';
import { BucketList } from './BucketList.entity';
import { Places } from './Places.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class DawarichVisitSuggestions {
  [EntityRepositoryType]?: DawarichVisitSuggestionsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  source_visit_id!: string;
  trip?: Ref<Trips> | null;
  trip_id?: number | null;
  name!: string;
  lat?: number | null;
  lng?: number | null;
  started_at!: string;
  ended_at!: string;
  duration_minutes: number & Opt = 0;
  local_date!: string;
  source_status: string & Opt = 'suggested';
  confidence?: number | null;
  confidence_band?: string | null;
  country_code?: string | null;
  state: string & Opt = 'new';
  target?: string | null;
  acceptedPlace?: Ref<Places> | null;
  accepted_place_id?: number | null;
  accepted_journal_entry_id?: number | null;
  acceptedBucketListItem?: Ref<BucketList> | null;
  accepted_bucket_list_item_id?: number | null;
  matchedBucketListItem?: Ref<BucketList> | null;
  matched_bucket_list_item_id?: number | null;
  source_hash!: string;
  accepted_hash?: string | null;
  source_missing_at?: string | null;
  first_seen_at!: string & Opt;
  last_seen_at!: string & Opt;
}

export const DawarichVisitSuggestionsSchema = defineEntity({
  class: DawarichVisitSuggestions,
  repository: () => DawarichVisitSuggestionsRepository,
  indexes: [
    {
      name: 'idx_dawarich_suggestions_user_state',
      properties: ['user_id', 'state'],
    },
  ],
  uniques: [{ properties: ['user', 'source_visit_id'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    source_visit_id: p.text(),
    trip: () => p.manyToOne(Trips).ref().nullable().hidden().index('idx_dawarich_suggestions_trip'),
    trip_id: p.integer().nullable().persist(false).index('idx_dawarich_suggestions_trip'),
    name: p.text(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    started_at: p.text(),
    ended_at: p.text(),
    duration_minutes: p.integer().default(0),
    local_date: p.text(),
    source_status: p.text().default('suggested'),
    confidence: p.double().nullable(),
    confidence_band: p.text().nullable(),
    country_code: p.text().nullable(),
    state: p.text().default('new'),
    target: p.text().nullable(),
    acceptedPlace: () => p.manyToOne(Places).ref().nullable().hidden(),
    accepted_place_id: p.integer().nullable().persist(false),
    accepted_journal_entry_id: p.integer().nullable(),
    acceptedBucketListItem: () => p.manyToOne(BucketList).ref().nullable().hidden(),
    accepted_bucket_list_item_id: p.integer().nullable().persist(false),
    matchedBucketListItem: () => p.manyToOne(BucketList).ref().nullable().hidden(),
    matched_bucket_list_item_id: p.integer().nullable().persist(false),
    source_hash: p.text(),
    accepted_hash: p.text().nullable(),
    source_missing_at: p.text().nullable(),
    first_seen_at: p.text().defaultRaw(`CURRENT_TIMESTAMP`),
    last_seen_at: p.text().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
