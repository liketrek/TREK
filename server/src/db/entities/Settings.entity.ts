import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { SettingsRepository } from '../repositories/Settings.repository';
import { Users } from './Users.entity';

export class Settings {
  [EntityRepositoryType]?: SettingsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  key!: string;
  value?: string | null;
}

export const SettingsSchema = defineEntity({
  class: Settings,
  repository: () => SettingsRepository,
  uniques: [{ properties: ['user', 'key'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    key: p.text(),
    value: p.text().nullable(),
  },
});
