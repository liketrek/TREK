import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { SchoolHolidayRegionsRepository } from '../repositories/SchoolHolidayRegions.repository';
import { SchoolHolidayCountries } from './SchoolHolidayCountries.entity';
import { SchoolHolidayPeriods } from './SchoolHolidayPeriods.entity';

export class SchoolHolidayRegions {
  [EntityRepositoryType]?: SchoolHolidayRegionsRepository;
  id!: number & Opt;
  country!: string;
  name!: string;
  revision: number & Opt = 1;
  countryRef!: Ref<SchoolHolidayCountries>;
  school_holiday_periods_collection = new Collection<SchoolHolidayPeriods>(this);
}

export const SchoolHolidayRegionsSchema = defineEntity({
  class: SchoolHolidayRegions,
  repository: () => SchoolHolidayRegionsRepository,
  uniques: [{ properties: ['countryRef', 'name'] }],
  properties: {
    id: p.integer().primary(),
    country: p.text().persist(false),
    name: p.text().collation('NOCASE'),
    revision: p.integer().default(1),
    countryRef: () => p.manyToOne(SchoolHolidayCountries).ref().joinColumn('country').hidden(),
    school_holiday_periods_collection: () => p.oneToMany(SchoolHolidayPeriods).mappedBy('region').hidden(),
  },
});
