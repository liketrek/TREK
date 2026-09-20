import { type Opt, PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class VacayUserSettings {
  [PrimaryKeyProp]?: 'user';
  user?: Ref<Users> | null;
  yearType: string & Opt = 'calendar';
  yearStartMonth: number & Opt = 1;
  yearStartDay: number & Opt = 1;
  hireDate?: string | null;
}

export class VacayUserSettingsRepository extends EntityRepository<VacayUserSettings> {}

export const VacayUserSettingsSchema = defineEntity({
  class: VacayUserSettings,
  repository: () => VacayUserSettingsRepository,
  properties: {
    user: () => p.oneToOne(Users).primary().ref().nullable(),
    yearType: p.text(),
    yearStartMonth: p.integer(),
    yearStartDay: p.integer(),
    hireDate: p.text().nullable(),
  },
});
