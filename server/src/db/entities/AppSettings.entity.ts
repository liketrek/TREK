import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { AppSettingsRepository } from '../repositories/AppSettings.repository';

export class AppSettings {
  [EntityRepositoryType]?: AppSettingsRepository;
  [PrimaryKeyProp]?: 'key';
  key?: string | null;
  value?: string | null;
}

export const AppSettingsSchema = defineEntity({
  class: AppSettings,
  repository: () => AppSettingsRepository,
  properties: {
    key: p.text().primary().nullable(),
    value: p.text().nullable(),
  },
});
