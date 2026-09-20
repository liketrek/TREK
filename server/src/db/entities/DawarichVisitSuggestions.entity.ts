import { BucketList } from './BucketList.entity';
import { Places } from './Places.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';
import { defineEntity, EntityRepository, type Opt, p, type Ref } from '@mikro-orm/core';

export class DawarichVisitSuggestions {
  id?: number | null;
  user!: Ref<Users>;
  sourceVisitId!: string;
  trip?: Ref<Trips> | null;
  name!: string;
  lat?: unknown | null;
  lng?: unknown | null;
  startedAt!: string;
  endedAt!: string;
  durationMinutes: number & Opt = 0;
  localDate!: string;
  sourceStatus: string & Opt = 'suggested';
  confidence?: unknown | null;
  confidenceBand?: string | null;
  countryCode?: string | null;
  state: string & Opt = 'new';
  target?: string | null;
  acceptedPlace?: Ref<Places> | null;
  acceptedJournalEntryId?: number | null;
  acceptedBucketListItem?: Ref<BucketList> | null;
  matchedBucketListItem?: Ref<BucketList> | null;
  sourceHash!: string;
  acceptedHash?: string | null;
  sourceMissingAt?: string | null;
  firstSeenAt!: string & Opt;
  lastSeenAt!: string & Opt;
}

export class DawarichVisitSuggestionsRepository extends EntityRepository<DawarichVisitSuggestions> {}

export const DawarichVisitSuggestionsSchema = defineEntity({
  class: DawarichVisitSuggestions,
  repository: () => DawarichVisitSuggestionsRepository,
  indexes: [{ name: 'idx_dawarich_suggestions_user_state', properties: ['user', 'state'] }],
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    sourceVisitId: p.text(),
    trip: () => p.manyToOne(Trips).ref().nullable().index('idx_dawarich_suggestions_trip'),
    name: p.text(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    startedAt: p.text(),
    endedAt: p.text(),
    durationMinutes: p.integer(),
    localDate: p.text(),
    sourceStatus: p.text(),
    confidence: p.double().nullable(),
    confidenceBand: p.text().nullable(),
    countryCode: p.text().nullable(),
    state: p.text(),
    target: p.text().nullable(),
    acceptedPlace: () => p.manyToOne(Places).ref().nullable(),
    acceptedJournalEntryId: p.integer().nullable(),
    acceptedBucketListItem: () => p.manyToOne(BucketList).ref().nullable(),
    matchedBucketListItem: () => p.manyToOne(BucketList).ref().nullable(),
    sourceHash: p.text(),
    acceptedHash: p.text().nullable(),
    sourceMissingAt: p.text().nullable(),
    firstSeenAt: p.text().onCreate(() => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')),
    lastSeenAt: p.text().onCreate(() => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')),
  },
});
