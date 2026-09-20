import { Collection, PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { SchoolHolidayRegions } from './SchoolHolidayRegions.entity';

export class SchoolHolidayCountries {
  [PrimaryKeyProp]?: 'code';
  code?: string | null;
  name!: string;
  schoolHolidayRegionsCollection = new Collection<SchoolHolidayRegions>(this);
}

export class SchoolHolidayCountriesRepository extends EntityRepository<SchoolHolidayCountries> {}

export const SchoolHolidayCountriesSchema = defineEntity({
  class: SchoolHolidayCountries,
  repository: () => SchoolHolidayCountriesRepository,
  properties: {
    code: p.text().primary().nullable(),
    name: p.text(),
    schoolHolidayRegionsCollection: () => p.oneToMany(SchoolHolidayRegions).mappedBy('country'),
  },
});
