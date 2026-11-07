/**
 * GET /api/trips/:tripId/reservations/:id/wallet-pass end to end: the session,
 * the trip guard, the booking read through the reservations module and the
 * request the TREK services' pass signer receives. The signer itself is
 * stubbed at the fetch seam.
 */
import { servicesConfig } from '../../src/nest/app-config/tokens';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { WalletPassModule } from '../../src/nest/wallet-pass/wallet-pass.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makeReservation, makeReservationEndpoint } from '../helpers/factories/reservations';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetchAdminConfigured } = vi.hoisted(() => ({ safeFetchAdminConfigured: vi.fn() }));
vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  safeFetchAdminConfigured,
}));

const db = createSnapshotTestDb();
const OWNER = 1;
const STRANGER = 2;
const PASS = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('signed pass')]);

let orm: TestOrm;
let app: Awaited<ReturnType<typeof build>>;
let tripId: number;
let flightId: number;

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), WalletPassModule],
  })
    .overrideProvider(servicesConfig.KEY)
    .useValue({ mode: 'auto', key: null, hosts: [], walletPassUrl: 'https://push.liketrek.com/v1/wallet/pass' })
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalFilters(new TrekExceptionFilter());
  nest.useGlobalPipes(new ZodValidationPipe());
  await nest.init();
  return nest;
}

const as = (userId: number) => ({ Cookie: sessionCookie(userId) });
const path = (trip: number, id: number, lang = 'de') =>
  `/api/trips/${trip}/reservations/${id}/wallet-pass?lang=${lang}`;

beforeAll(async () => {
  orm = await createTestOrm(db);
  await makeUser(orm, { id: OWNER, username: 'owner', email: 'owner@example.test' });
  await makeUser(orm, { id: STRANGER, username: 'stranger', email: 'stranger@example.test' });
  const trip = await makeTrip(orm, OWNER, { title: 'Japan 2027' });
  tripId = trip.id;
  const flight = await makeReservation(orm, tripId, {
    title: 'LH 716',
    type: 'flight',
    reservation_time: '2027-04-01T13:25',
    confirmation_number: 'X7K2QP',
    metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH716', seat: '34K' }),
  });
  flightId = flight.id;
  await makeReservationEndpoint(orm, flightId, {
    role: 'from',
    name: 'Frankfurt',
    code: 'FRA',
    lat: 50.03,
    lng: 8.57,
    timezone: 'Europe/Berlin',
    local_date: '2027-04-01',
    local_time: '13:25',
  });
  await makeReservationEndpoint(orm, flightId, {
    role: 'to',
    sequence: 1,
    name: 'Tokyo Haneda',
    code: 'HND',
    lat: 35.55,
    lng: 139.78,
    timezone: 'Asia/Tokyo',
    local_date: '2027-04-02',
    local_time: '08:50',
  });
  app = await build();
});

beforeEach(() => {
  safeFetchAdminConfigured.mockReset();
  safeFetchAdminConfigured.mockResolvedValue(
    new Response(PASS, { status: 200, headers: { 'content-type': 'application/vnd.apple.pkpass' } }),
  );
});

afterAll(async () => {
  await app.close();
  await orm.close();
});

describe('GET /api/trips/:tripId/reservations/:id/wallet-pass', () => {
  it('WALLET-E2E-001: answers 401 without a session and asks nobody', async () => {
    const res = await request(app.getHttpServer()).get(path(tripId, flightId));
    expect(res.status).toBe(401);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('WALLET-E2E-002: someone outside the trip gets a 404, not a pass', async () => {
    const res = await request(app.getHttpServer()).get(path(tripId, flightId)).set(as(STRANGER));
    expect(res.status).toBe(404);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('WALLET-E2E-003: the owner gets the signed pass, built from the booking in their language', async () => {
    const res = await request(app.getHttpServer())
      .get(path(tripId, flightId))
      .set(as(OWNER))
      .buffer(true)
      .parse((r, done) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => done(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/vnd.apple.pkpass');
    expect(res.headers['content-disposition']).toBe('attachment; filename="LH-716.pkpass"');
    expect(Buffer.compare(res.body as Buffer, PASS)).toBe(0);

    const [url, init] = safeFetchAdminConfigured.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://push.liketrek.com/v1/wallet/pass');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      kind: 'flight',
      title: 'LH 716',
      trip: 'Japan 2027',
      start: '2027-04-01T13:25:00+02:00',
      end: '2027-04-02T08:50:00+09:00',
      from: { code: 'FRA', name: 'Frankfurt' },
      to: { code: 'HND', name: 'Tokyo Haneda' },
      confirmation: { value: 'X7K2QP' },
      locale: 'de-DE',
    });
    expect(body.details.map((d: { label: string }) => d.label)).toContain('Sitzplatz');
  });

  it('WALLET-E2E-004: a booking of another trip, or none, is a 404', async () => {
    const other = await makeTrip(orm, OWNER, { title: 'Elsewhere' });
    expect((await request(app.getHttpServer()).get(path(other.id, flightId)).set(as(OWNER))).status).toBe(404);
    expect((await request(app.getHttpServer()).get(path(tripId, 999_999)).set(as(OWNER))).status).toBe(404);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('WALLET-E2E-005: a booking without a date gets a 422, and the signer failing a 502', async () => {
    const undated = await makeReservation(orm, tripId, { title: 'Someday', type: 'event', reservation_time: null });
    expect((await request(app.getHttpServer()).get(path(tripId, undated.id)).set(as(OWNER))).status).toBe(422);

    safeFetchAdminConfigured.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    expect((await request(app.getHttpServer()).get(path(tripId, flightId)).set(as(OWNER))).status).toBe(502);
  });
});
