import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { MailIngestPrefsRepository } from '../repositories/MailIngestPrefs.repository';
import { Users } from './Users.entity';

export class MailIngestPrefs {
  [EntityRepositoryType]?: MailIngestPrefsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  enabled: number & Opt = 1;
  ai_enabled: number & Opt = 1;
  auto_add: number & Opt = 1;
}

export const MailIngestPrefsSchema = defineEntity({
  class: MailIngestPrefs,
  repository: () => MailIngestPrefsRepository,
  uniques: [{ properties: ['user'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    enabled: p.integer().default(1),
    ai_enabled: p.integer().default(1),
    auto_add: p.integer().default(1),
  },
});
