/** Vacay public holiday provider integration tests. */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { VacayService } from '../../src/nest/vacay/vacay.service';
import { authCookie } from '../helpers/auth';
import { createUser } from '../helpers/factories';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  }),
);
vi.spyOn(VacayService.prototype, 'getCountries').mockResolvedValue({ data: [] });

let nestApp: INestApplication;
let app: Application;
beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
  vi.unstubAllGlobals();
});

describe('Vacay public holidays', () => {
  it('VACAY-035 — returns 502 when the external API fetch fails', async () => {
    const { user } = createUser(testDb);
    vi.mocked(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const res = await request(app).get('/api/addons/vacay/holidays/2099/ZZ').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(502);
  });

  it('VACAY-037 — adapts a Nager v4 record when the external API succeeds', async () => {
    const { user } = createUser(testDb);
    vi.mocked(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            date: '2025-05-01',
            name: 'Labour Day',
            nationalHoliday: true,
            subdivisionCodes: null,
          },
        ]),
    });

    const res = await request(app).get('/api/addons/vacay/holidays/2025/AT').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        date: '2025-05-01',
        name: 'Labour Day',
        localName: 'Labour Day',
        global: true,
        counties: null,
      },
    ]);
  });
});
