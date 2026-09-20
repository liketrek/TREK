import { PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class AppSettings {
  [PrimaryKeyProp]?: 'key';
  key?: string | null;
  value?: string | null;
}

export class AppSettingsRepository extends EntityRepository<AppSettings> {}

export const AppSettingsSchema = defineEntity({
  class: AppSettings,
  repository: () => AppSettingsRepository,
  properties: {
    key: p.text().primary().nullable(),
    value: p.text().nullable(),
  },
});
