import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class Settings {
  id?: number | null;
  user!: Ref<Users>;
  key!: string;
  value?: string | null;
}

export class SettingsRepository extends EntityRepository<Settings> {}

export const SettingsSchema = defineEntity({
  class: Settings,
  repository: () => SettingsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    key: p.text(),
    value: p.text().nullable(),
  },
});
