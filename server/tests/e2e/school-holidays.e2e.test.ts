import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  return { db: new Database(':memory:') };
});
vi.mock('../../src/db/database', () => ({ db, closeDb: () => {} }));
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { SchoolHolidaysModule } from '../../src/nest/school-holidays/school-holidays.module';
import { SchoolHolidaysService } from '../../src/nest/school-holidays/school-holidays.service';
import { SchoolHolidaysMcp } from '../../src/nest/school-holidays/school-holidays.mcp';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { validateBodyContracts } from '../../src/nest/common/validate-body-contracts';
import { createTestRegistry } from '../../src/nest-mcp';
import { trekMcpAccessPolicy, trekMcpValidateAccess } from '../../src/mcp/nest-mcp-policy';

const base = '/api/school-holiday-catalog';
const winter = { name: 'Winter break', startDate: '2026-12-20', endDate: '2027-01-06' };
let app: INestApplication;
let service: SchoolHolidaysService;
beforeAll(async () => {
  db.pragma('foreign_keys = ON');
  createTables(db);
  runMigrations(db);
  db.prepare("INSERT INTO users (id, username, email, password_hash, role) VALUES (1, 'admin', 'admin@test.local', '', 'admin'), (2, 'member', 'member@test.local', '', 'user')").run();
  const module = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, SchoolHolidaysModule] }).compile();
  app = module.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new TrekExceptionFilter());
  await app.init();
  service = app.get(SchoolHolidaysService);
});
afterAll(async () => { await app.close(); db.close(); });
beforeEach(() => {
  db.exec('DELETE FROM vacay_holiday_calendars; DELETE FROM school_holiday_periods; DELETE FROM school_holiday_regions; DELETE FROM school_holiday_countries;');
});

function seed() {
  service.createCountry({ code: 'US', name: 'USA' });
  return service.createRegion('US', { name: 'Seattle schools', revision: 0, holidays: [winter] });
}

describe('global manual school holidays', () => {
  it('requires authentication and admin rights for every write', async () => {
    await request(app.getHttpServer()).get(base).expect(401);
    await request(app.getHttpServer()).post(`${base}/countries`).send({ code: 'US', name: 'USA' }).expect(401);
    for (const [method, path, body] of [
      ['post', '/countries', { code: 'US', name: 'USA' }],
      ['post', '/countries/US/regions', { name: 'District', revision: 0, holidays: [] }],
      ['put', '/regions/1', { name: 'District', revision: 1, holidays: [] }],
      ['delete', '/countries/US', {}], ['delete', '/regions/1?revision=1', {}],
    ] as const) {
      await request(app.getHttpServer())[method](`${base}${path}`).set('Cookie', sessionCookie(2)).send(body).expect(403);
    }
    expect(() => validateBodyContracts(app)).not.toThrow();
  });

  it('lets any member discover regions and read dates without external requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const country = await request(app.getHttpServer()).post(`${base}/countries`).set('Cookie', sessionCookie(1)).send({ code: 'US', name: 'USA' }).expect(201);
    expect(country.body.code).toBe('US');
    const created = await request(app.getHttpServer()).post(`${base}/countries/US/regions`).set('Cookie', sessionCookie(1)).send({ name: 'Seattle', revision: 0, holidays: [winter] }).expect(201);
    const catalog = await request(app.getHttpServer()).get(base).set('Cookie', sessionCookie(2)).expect(200);
    expect(catalog.body.regions[0].code).toBe(`US-MANUAL-${created.body.id}`);
    for (const year of [2026, 2027]) {
      const holidays = await request(app.getHttpServer()).get(`${base}/regions/${created.body.id}/holidays/${year}`).set('Cookie', sessionCookie(2)).expect(200);
      expect(holidays.body).toEqual([winter]);
    }
    expect(service.holidays(created.body.id, '2025')).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('validates dates and body shape before writing', async () => {
    service.createCountry({ code: 'US', name: 'USA' });
    for (const holidays of [[{ ...winter, endDate: '2026-01-01' }], [{ ...winter, startDate: '2026-02-30' }], [{ ...winter, name: ' ' }]]) {
      await request(app.getHttpServer()).post(`${base}/countries/US/regions`).set('Cookie', sessionCookie(1)).send({ name: 'Seattle', revision: 0, holidays }).expect(400);
    }
    expect(service.catalog().regions).toEqual([]);
  });

  it('preserves ids on rename and rejects stale saves atomically', async () => {
    const region = seed();
    const updated = await request(app.getHttpServer()).put(`${base}/regions/${region.id}`).set('Cookie', sessionCookie(1)).send({ name: 'Renamed', revision: 1, holidays: [] }).expect(200);
    expect(updated.body).toMatchObject({ code: region.code, revision: 2, holidays: [] });
    await request(app.getHttpServer()).put(`${base}/regions/${region.id}`).set('Cookie', sessionCookie(1)).send({ name: 'Stale', revision: 1, holidays: [winter] }).expect(409);
    expect(service.region(region.id).name).toBe('Renamed');
    expect(service.region(region.id).holidays).toEqual([]);
    await request(app.getHttpServer()).delete(`${base}/regions/${region.id}?revision=1`).set('Cookie', sessionCookie(1)).expect(409);
  });

  it('rejects duplicates, missing countries and nonzero initial revisions', () => {
    seed();
    expect(() => service.createCountry({ code: 'US', name: 'America' })).toThrow('already exists');
    expect(() => service.createRegion('US', { name: 'SEATTLE SCHOOLS', revision: 0, holidays: [] })).toThrow('already exists');
    expect(() => service.createRegion('CA', { name: 'School', revision: 0, holidays: [] })).toThrow('not found');
    expect(() => service.createRegion('US', { name: 'School', revision: 1, holidays: [] })).toThrow('revision zero');
    const other = service.createRegion('US', { name: 'Other', revision: 0, holidays: [] });
    expect(() => service.updateRegion(other.id, { name: 'Seattle schools', revision: 1, holidays: [] })).toThrow('already exists');
  });

  it('protects used regions and deletes unused regions with their periods', async () => {
    const region = seed();
    db.prepare('INSERT OR IGNORE INTO vacay_plans (id, owner_id) VALUES (1, 1)').run();
    db.prepare("INSERT INTO vacay_holiday_calendars (plan_id, type, region) VALUES (1, 'school_holiday', ?)").run(region.code);
    await request(app.getHttpServer()).delete(`${base}/regions/${region.id}?revision=1`).set('Cookie', sessionCookie(1)).expect(409);
    await request(app.getHttpServer()).delete(`${base}/countries/US`).set('Cookie', sessionCookie(1)).expect(409);
    db.exec('DELETE FROM vacay_holiday_calendars');
    await request(app.getHttpServer()).delete(`${base}/regions/${region.id}?revision=1`).set('Cookie', sessionCookie(1)).expect(200);
    expect(db.prepare('SELECT * FROM school_holiday_periods').all()).toEqual([]);
    await request(app.getHttpServer()).delete(`${base}/countries/US`).set('Cookie', sessionCookie(1)).expect(200);
    expect(service.catalog()).toEqual({ countries: [], regions: [] });
  });

  it('reports missing regions and malformed year and id parameters', async () => {
    const region = seed();
    await request(app.getHttpServer()).get(`${base}/regions/${region.id}`).set('Cookie', sessionCookie(2)).expect(200);
    await request(app.getHttpServer()).get(`${base}/regions/999999`).set('Cookie', sessionCookie(2)).expect(404);
    await request(app.getHttpServer()).get(`${base}/regions/invalid`).set('Cookie', sessionCookie(2)).expect(400);
    await request(app.getHttpServer()).get(`${base}/regions/${region.id}/holidays/xx`).set('Cookie', sessionCookie(2)).expect(400);
    await request(app.getHttpServer()).delete(`${base}/countries/CA`).set('Cookie', sessionCookie(1)).expect(404);
  });

  it('exposes the same manual catalog and periods through MCP', () => {
    const region = seed();
    const mcp = app.get(SchoolHolidaysMcp);
    expect(() => createTestRegistry([mcp], { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess })).not.toThrow();
    expect(JSON.stringify(mcp.catalog())).toContain(region.code);
    expect(JSON.stringify(mcp.forYear({ regionId: region.id, year: 2027 }))).toContain('Winter break');
  });

  it('denies every MCP mutation to normal users without changing the catalog', () => {
    const region = seed();
    const mcp = app.get(SchoolHolidaysMcp);
    const member = { userId: 2, scopes: null, isStaticToken: false };
    const before = service.region(region.id);
    const writes = [
      () => mcp.createCountry({ code: 'CA', name: 'Canada' }, member),
      () => mcp.createRegion({ country: 'US', name: 'Other', revision: 0, holidays: [] }, member),
      () => mcp.updateRegion({ regionId: region.id, name: 'Changed', revision: 1, holidays: [] }, member),
      () => mcp.deleteRegion({ regionId: region.id, revision: 1 }, member),
      () => mcp.deleteCountry({ code: 'US' }, member),
    ];
    for (const write of writes) expect(write()).toHaveProperty('isError', true);
    expect(service.region(region.id)).toEqual(before);
    expect(service.catalog().countries).toHaveLength(1);
    expect(service.catalog().regions).toHaveLength(1);
  });

  it('supports the complete admin MCP workflow with validation and revision protection', () => {
    const mcp = app.get(SchoolHolidaysMcp);
    const admin = { userId: 1, scopes: null, isStaticToken: false };
    expect(mcp.createCountry({ code: 'US', name: 'USA' }, admin)).not.toHaveProperty('isError', true);
    expect(mcp.createRegion({ country: 'US', name: 'Seattle', revision: 0, holidays: [winter] }, admin)).not.toHaveProperty('isError', true);
    const region = service.catalog().regions[0];
    expect(JSON.stringify(mcp.region({ regionId: region.id }))).toContain('Winter break');
    const edit = { regionId: region.id, name: 'Seattle Public Schools', revision: 1, holidays: [{ ...winter, name: 'Winter holiday' }] };
    expect(mcp.updateRegion(edit, admin)).not.toHaveProperty('isError', true);
    expect(mcp.updateRegion(edit, admin)).toHaveProperty('isError', true);
    expect(mcp.updateRegion({ ...edit, revision: 2, holidays: [{ ...winter, endDate: '2025-01-01' }] }, admin)).toHaveProperty('isError', true);
    expect(service.region(region.id)).toMatchObject({ revision: 2, holidays: [{ ...winter, name: 'Winter holiday' }] });
    expect(mcp.deleteCountry({ code: 'US' }, admin)).toHaveProperty('isError', true);
    expect(mcp.deleteRegion({ regionId: region.id, revision: 1 }, admin)).toHaveProperty('isError', true);
    expect(mcp.deleteRegion({ regionId: region.id, revision: 2 }, admin)).not.toHaveProperty('isError', true);
    expect(mcp.deleteCountry({ code: 'US' }, admin)).not.toHaveProperty('isError', true);
    expect(service.catalog()).toEqual({ countries: [], regions: [] });
  });
});
