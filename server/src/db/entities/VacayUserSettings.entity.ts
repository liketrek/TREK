import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayUserSettingsRepository } from '../repositories/VacayUserSettings.repository';
import { Users } from './Users.entity';

export class VacayUserSettings {
  [EntityRepositoryType]?: VacayUserSettingsRepository;
  [PrimaryKeyProp]?: 'user';
  user?: Ref<Users> | null;
  user_id?: number | null;
  year_type: string & Opt = 'calendar';
  year_start_month: number & Opt = 1;
  year_start_day: number & Opt = 1;
  hire_date?: string | null;
}

export const VacayUserSettingsSchema = defineEntity({
  class: VacayUserSettings,
  repository: () => VacayUserSettingsRepository,
  properties: {
    user: () => p.oneToOne(Users).primary().ref().deleteRule('cascade').nullable().hidden(),
    user_id: p.integer().nullable().persist(false),
    year_type: p.text().default('calendar'),
    year_start_month: p.integer().default(1),
    year_start_day: p.integer().default(1),
    hire_date: p.text().nullable(),
  },
});
