import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { SchoolHolidayCountries } from './SchoolHolidayCountries.entity';
import { SchoolHolidayPeriods } from './SchoolHolidayPeriods.entity';

export class SchoolHolidayRegions {
  id?: number | null;
  country!: Ref<SchoolHolidayCountries>;
  name!: string;
  revision: number & Opt = 1;
  schoolHolidayPeriodsCollection = new Collection<SchoolHolidayPeriods>(this);
}

export class SchoolHolidayRegionsRepository extends EntityRepository<SchoolHolidayRegions> {}

export const SchoolHolidayRegionsSchema = defineEntity({
  class: SchoolHolidayRegions,
  repository: () => SchoolHolidayRegionsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    country: () => p.manyToOne(SchoolHolidayCountries).ref().name('country'),
    name: p.text().collation('NOCASE'),
    revision: p.integer(),
    schoolHolidayPeriodsCollection: () => p.oneToMany(SchoolHolidayPeriods).mappedBy('region'),
  },
});
