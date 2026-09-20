import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class ShareTokens {
  id?: number | null;
  trip!: Ref<Trips>;
  token!: string;
  createdBy!: Ref<Users>;
  shareMap?: number | null = 1;
  shareBookings?: number | null = 1;
  sharePacking?: number | null = 0;
  shareBudget?: number | null = 0;
  shareCollab?: number | null = 0;
  createdAt?: Date | null;
  expiresAt?: string | null;
}

export class ShareTokensRepository extends EntityRepository<ShareTokens> {}

export const ShareTokensSchema = defineEntity({
  class: ShareTokens,
  repository: () => ShareTokensRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade'),
    token: p.text().index('idx_share_tokens_token'),
    createdBy: () => p.manyToOne(Users).ref().name('created_by'),
    shareMap: p.integer().nullable(),
    shareBookings: p.integer().nullable(),
    sharePacking: p.integer().nullable(),
    shareBudget: p.integer().nullable(),
    shareCollab: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    expiresAt: p.text().nullable(),
  },
});
