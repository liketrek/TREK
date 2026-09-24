import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { SchoolHolidayCatalog, SchoolHolidayCountryRequest, SchoolHolidayPeriod, SchoolHolidayRegion, SchoolHolidayRegionDetail, SchoolHolidayRegionRequest } from '@trek/shared';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SchoolHolidaysService {
  constructor(private readonly db: DatabaseService) {}

  catalog(): SchoolHolidayCatalog {
    return {
      countries: this.db.all<SchoolHolidayCountryRequest>('SELECT code, name FROM school_holiday_countries ORDER BY name, code'),
      regions: this.db.all<SchoolHolidayRegion>("SELECT *, country || '-MANUAL-' || id AS code FROM school_holiday_regions ORDER BY name, id"),
    };
  }

  country(code: string): SchoolHolidayCountryRequest {
    const country = this.db.get<SchoolHolidayCountryRequest>('SELECT code, name FROM school_holiday_countries WHERE code = ?', code);
    if (!country) throw new NotFoundException('Country not found');
    return country;
  }

  createCountry(country: SchoolHolidayCountryRequest) {
    const inserted = this.db.run('INSERT OR IGNORE INTO school_holiday_countries (code, name) VALUES (?, ?)', country.code, country.name);
    if (!inserted.changes) throw new ConflictException('Country already exists');
    return country;
  }

  deleteCountry(code: string) {
    return this.db.transaction(() => {
      this.country(code);
      if (this.db.get('SELECT id FROM school_holiday_regions WHERE country = ? LIMIT 1', code)) {
        throw new ConflictException('Remove the regions before deleting this country');
      }
      this.db.run('DELETE FROM school_holiday_countries WHERE code = ?', code);
      return { success: true };
    });
  }

  region(id: number): SchoolHolidayRegionDetail {
    const region = this.db.get<SchoolHolidayRegion>("SELECT *, country || '-MANUAL-' || id AS code FROM school_holiday_regions WHERE id = ?", id);
    if (!region) throw new NotFoundException('Region not found');
    return { ...region, holidays: this.db.all<SchoolHolidayPeriod>('SELECT name, start_date AS startDate, end_date AS endDate FROM school_holiday_periods WHERE region_id = ? ORDER BY start_date, end_date, name', id) };
  }

  private checkName(country: string, name: string, id: number) {
    if (this.db.get('SELECT id FROM school_holiday_regions WHERE country = ? AND name = ? COLLATE NOCASE AND id != ?', country, name, id)) {
      throw new ConflictException('A region with this name already exists');
    }
  }

  private writePeriods(id: number, holidays: SchoolHolidayPeriod[]) {
    this.db.run('DELETE FROM school_holiday_periods WHERE region_id = ?', id);
    const insert = this.db.prepare('INSERT INTO school_holiday_periods (region_id, name, start_date, end_date) VALUES (?, ?, ?, ?)');
    for (const holiday of holidays) insert.run(id, holiday.name, holiday.startDate, holiday.endDate);
  }

  createRegion(country: string, body: SchoolHolidayRegionRequest) {
    return this.db.transaction(() => {
      this.country(country);
      this.checkName(country, body.name, 0);
      if (body.revision !== 0) throw new ConflictException('New regions must have revision zero');
      const inserted = this.db.run('INSERT INTO school_holiday_regions (country, name) VALUES (?, ?)', country, body.name);
      const id = Number(inserted.lastInsertRowid);
      this.writePeriods(id, body.holidays);
      return this.region(id);
    });
  }

  updateRegion(id: number, body: SchoolHolidayRegionRequest) {
    return this.db.transaction(() => {
      const region = this.region(id);
      this.checkName(region.country, body.name, id);
      const updated = this.db.run('UPDATE school_holiday_regions SET name = ?, revision = revision + 1 WHERE id = ? AND revision = ?', body.name, id, body.revision);
      if (!updated.changes) throw new ConflictException('This region changed. Reopen it before saving again.');
      this.writePeriods(id, body.holidays);
      return this.region(id);
    });
  }

  deleteRegion(id: number, revision: number) {
    return this.db.transaction(() => {
      const region = this.region(id);
      if (region.revision !== revision) throw new ConflictException('This region changed. Reload before deleting it.');
      if (this.db.get("SELECT id FROM vacay_holiday_calendars WHERE type = 'school_holiday' AND region = ? LIMIT 1", region.code)) {
        throw new ConflictException('This region is used by vacation calendars and cannot be deleted');
      }
      this.db.run('DELETE FROM school_holiday_periods WHERE region_id = ?', id);
      this.db.run('DELETE FROM school_holiday_regions WHERE id = ?', id);
      return { success: true };
    });
  }

  holidays(id: number, year: string): SchoolHolidayPeriod[] {
    return this.region(id).holidays.filter(holiday => holiday.startDate <= `${year}-12-31` && holiday.endDate >= `${year}-01-01`);
  }
}
