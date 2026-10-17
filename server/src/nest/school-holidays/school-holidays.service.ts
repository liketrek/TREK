import { SchoolHolidayCountries } from '../../db/entities/SchoolHolidayCountries.entity';
import { SchoolHolidayPeriods } from '../../db/entities/SchoolHolidayPeriods.entity';
import { SchoolHolidayRegions } from '../../db/entities/SchoolHolidayRegions.entity';
import { VacayHolidayCalendars } from '../../db/entities/VacayHolidayCalendars.entity';
import type { SchoolHolidayCountriesRepository } from '../../db/repositories/SchoolHolidayCountries.repository';
import type { SchoolHolidayPeriodsRepository } from '../../db/repositories/SchoolHolidayPeriods.repository';
import type {
  SchoolHolidayRegionsRepository,
  SchoolHolidayRegionRow,
} from '../../db/repositories/SchoolHolidayRegions.repository';
import type { VacayHolidayCalendarsRepository } from '../../db/repositories/VacayHolidayCalendars.repository';
import { UnitOfWork } from '../database/unit-of-work';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  SchoolHolidayCatalog,
  SchoolHolidayCountryRequest,
  SchoolHolidayPeriod,
  SchoolHolidayRegion,
  SchoolHolidayRegionDetail,
  SchoolHolidayRegionRequest,
} from '@trek/shared';

/**
 * School-holidays domain service — moved off `DatabaseService`/raw SQL onto
 * `SchoolHolidayCountriesRepository`/`SchoolHolidayRegionsRepository`/
 * `SchoolHolidayPeriodsRepository` (Plan 3f Task 2). The synthesized
 * `country || '-MANUAL-' || id AS code` column (SH2/SH7) is computed here in
 * JS (`toRegion`) rather than in SQL — see `SchoolHolidayRegions.repository
 * .ts`'s own docstring for why that is still exact parity. `checkName`'s
 * duplicate-name guard and `updateRegion`'s optimistic-concurrency revision
 * check keep their exact legacy shapes; see the repository methods they call
 * for the parity notes.
 */
@Injectable()
export class SchoolHolidaysService {
  constructor(
    @InjectRepository(SchoolHolidayCountries) private readonly countries: SchoolHolidayCountriesRepository,
    @InjectRepository(SchoolHolidayRegions) private readonly regions: SchoolHolidayRegionsRepository,
    @InjectRepository(SchoolHolidayPeriods) private readonly periods: SchoolHolidayPeriodsRepository,
    @InjectRepository(VacayHolidayCalendars) private readonly vacayCalendars: VacayHolidayCalendarsRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async catalog(): Promise<SchoolHolidayCatalog> {
    const countries = await this.countries.list();
    const regions = await this.regions.list();
    return { countries, regions: regions.map((region) => this.toRegion(region)) };
  }

  async country(code: string): Promise<SchoolHolidayCountryRequest> {
    const country = await this.countries.findByCode(code);
    if (!country) throw new NotFoundException('Country not found');
    return country;
  }

  async createCountry(country: SchoolHolidayCountryRequest) {
    const inserted = await this.countries.insertIgnore(country);
    if (!inserted) throw new ConflictException('Country already exists');
    return country;
  }

  async deleteCountry(code: string) {
    return await this.uow.transactional(async () => {
      await this.country(code);
      if (await this.regions.existsForCountry(code)) {
        throw new ConflictException('Remove the regions before deleting this country');
      }
      await this.countries.remove(code);
      return { success: true };
    });
  }

  async region(id: number): Promise<SchoolHolidayRegionDetail> {
    const region = await this.regions.findById(id);
    if (!region) throw new NotFoundException('Region not found');
    const holidays = await this.periods.listForRegion(id);
    return { ...this.toRegion(region), holidays };
  }

  /** The SH2/SH7 synthesized `code` column — see `SchoolHolidayRegions.repository.ts`'s class docstring. */
  private toRegion(region: SchoolHolidayRegionRow): SchoolHolidayRegion {
    return {
      id: region.id,
      country: region.country,
      name: region.name,
      revision: region.revision,
      code: `${region.country}-MANUAL-${region.id}`,
    };
  }

  private async checkName(country: string, name: string, id: number) {
    if (await this.regions.findIdByNameCI(country, name, id)) {
      throw new ConflictException('A region with this name already exists');
    }
  }

  private async writePeriods(id: number, holidays: SchoolHolidayPeriod[]) {
    await this.periods.deleteForRegion(id);
    await this.periods.insertPeriods(id, holidays);
  }

  async createRegion(country: string, body: SchoolHolidayRegionRequest) {
    return await this.uow.transactional(async () => {
      await this.country(country);
      await this.checkName(country, body.name, 0);
      if (body.revision !== 0) throw new ConflictException('New regions must have revision zero');
      const id = await this.regions.insertRegion(country, body.name);
      await this.writePeriods(id, body.holidays);
      return this.region(id);
    });
  }

  async updateRegion(id: number, body: SchoolHolidayRegionRequest) {
    return await this.uow.transactional(async () => {
      const region = await this.region(id);
      await this.checkName(region.country, body.name, id);
      const affected = await this.regions.updateWithRevision(id, body.revision, body.name);
      if (!affected) throw new ConflictException('This region changed. Reopen it before saving again.');
      await this.writePeriods(id, body.holidays);
      return this.region(id);
    });
  }

  async deleteRegion(id: number, revision: number) {
    return await this.uow.transactional(async () => {
      const region = await this.region(id);
      if (region.revision !== revision) throw new ConflictException('This region changed. Reload before deleting it.');
      if (await this.vacayCalendars.existsForSchoolRegion(region.code)) {
        throw new ConflictException('This region is used by vacation calendars and cannot be deleted');
      }
      await this.periods.deleteForRegion(id);
      await this.regions.remove(id);
      return { success: true };
    });
  }

  async holidays(id: number, year: string): Promise<SchoolHolidayPeriod[]> {
    return (await this.region(id)).holidays.filter(
      (holiday) => holiday.startDate <= `${year}-12-31` && holiday.endDate >= `${year}-01-01`,
    );
  }
}
