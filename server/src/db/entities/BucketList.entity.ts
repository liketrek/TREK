import { DawarichVisitSuggestions } from './DawarichVisitSuggestions.entity';
import { Users } from './Users.entity';
import { Collection, defineEntity, p, type Ref, EntityRepository } from '@mikro-orm/core';

export class BucketList {
  id?: number | null;
  user!: Ref<Users>;
  name!: string;
  lat?: unknown | null;
  lng?: unknown | null;
  countryCode?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
  targetDate?: string | null;
  visitedAt?: string | null;
  visitedSource?: string | null;
  dawarichAcceptedBucketListItem = new Collection<DawarichVisitSuggestions>(this);
  dawarichMatchedBucketListItem = new Collection<DawarichVisitSuggestions>(this);
}

export class BucketListRepository extends EntityRepository<BucketList> {}

export const BucketListSchema = defineEntity({
  class: BucketList,
  repository: () => BucketListRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    name: p.text(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    countryCode: p.text().nullable(),
    notes: p.text().nullable(),
    createdAt: p.datetime().onCreate(() => new Date()),
    targetDate: p.text().nullable(),
    visitedAt: p.text().nullable(),
    visitedSource: p.text().nullable(),
    dawarichAcceptedBucketListItem: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('acceptedBucketListItem'),
    dawarichMatchedBucketListItem: () => p.oneToMany(DawarichVisitSuggestions).mappedBy('matchedBucketListItem'),
  },
});
