/**
 * /api/maps search and reverse e2e with Photon in front of Nominatim: the real
 * JwtAuthGuard, Zod pipe and response contracts over MapsModule on a migrated
 * temp database, the TREK Places index switched off so the OpenStreetMap half
 * answers alone.
 *
 * Replaced: the global fetch, routed by host to a fake Photon and a fake
 * Nominatim, and the installation identity, a fake holding a key or none.
 */
import { servicesConfig } from '../../src/nest/app-config/tokens';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { MapsModule } from '../../src/nest/maps/maps.module';
import { serviceIdentitySlot } from '../../src/nest/service-identity/service-identity.interface';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makeUser } from '../helpers/factories/users';
import { FakeServiceIdentity, gateFeature, photonAnswer } from '../helpers/photon';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const USER = 1;
const SERVICES = {
  mode: 'auto',
  key: null,
  hosts: ['places.liketrek.com', 'photon.liketrek.com', 'valhalla.liketrek.com'],
  photonUrl: 'https://photon.liketrek.com',
};

const NOMINATIM_HIT = {
  osm_type: 'node',
  osm_id: '42',
  class: 'amenity',
  type: 'cafe',
  name: 'Café Nominatim',
  display_name: 'Café Nominatim, Pariser Platz, Berlin, Deutschland',
  lat: '52.516',
  lon: '13.378',
};

let orm: TestOrm;
let app: Awaited<ReturnType<typeof build>>;
let identity: FakeServiceIdentity;
let photonReply: () => Response;
const asked: URL[] = [];

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), MapsModule],
  })
    .overrideProvider(servicesConfig.KEY)
    .useValue(SERVICES)
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalFilters(new TrekExceptionFilter());
  nest.useGlobalPipes(new ZodValidationPipe());
  await nest.init();
  return nest;
}

const hostsAsked = () => asked.map((url) => url.hostname);
const as = (userId: number) => ({ Cookie: sessionCookie(userId) });

beforeAll(async () => {
  orm = await createTestOrm(db);
  await makeUser(orm, { id: USER, username: 'traveler', email: 'traveler@example.test' });
  app = await build();
});

afterAll(async () => {
  await app.close();
  await orm.close();
});

beforeEach(() => {
  identity = new FakeServiceIdentity();
  serviceIdentitySlot.install(identity);
  photonReply = () => photonAnswer([gateFeature()]);
  asked.length = 0;
  vi.stubEnv('TREK_PLACES_ENABLED', 'false');
  vi.stubEnv('NOMINATIM_URL', '');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      asked.push(url);
      if (url.hostname === 'photon.liketrek.com') return photonReply();
      const body = url.pathname.endsWith('/reverse')
        ? { display_name: NOMINATIM_HIT.display_name, name: NOMINATIM_HIT.name, address: {} }
        : [NOMINATIM_HIT];
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    }),
  );
});

afterEach(() => {
  serviceIdentitySlot.release(identity);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('POST /api/maps/search', () => {
  it('MAPS-PHOTON-E2E-001: answers from Photon with the key, in the reader language and around the bias', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/maps/search?lang=de')
      .set(as(USER))
      .send({ query: 'Brandenburger Tor', locationBias: { lat: 52.5, lng: 13.4 } });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('openstreetmap');
    expect(res.body.places[0]).toMatchObject({
      osm_id: 'way:518071791',
      name: 'Brandenburger Tor',
      address: 'Brandenburger Tor, Pariser Platz, Mitte, Berlin, 10117, Deutschland',
      lat: 52.5163,
      lng: 13.3777,
      wikidata: 'Q82425',
    });
    expect(hostsAsked()).toEqual(['photon.liketrek.com']);
    expect(Object.fromEntries(asked[0].searchParams)).toMatchObject({ lang: 'de', lat: '52.5', lon: '13.4' });
    expect(identity.observed).toEqual([{ host: 'photon.liketrek.com', status: 200 }]);
  });

  it('MAPS-PHOTON-E2E-002: falls back to Nominatim when Photon refuses, and the answer reads the same', async () => {
    photonReply = () => photonAnswer([], 429);
    const res = await request(app.getHttpServer()).post('/api/maps/search').set(as(USER)).send({ query: 'Café' });
    expect(res.status).toBe(200);
    expect(res.body.places[0]).toMatchObject({ osm_id: 'node:42', name: 'Café Nominatim', category: 'cafe' });
    expect(hostsAsked()).toEqual(['photon.liketrek.com', 'nominatim.openstreetmap.org']);
  });

  it('MAPS-PHOTON-E2E-003: never asks Photon without a key', async () => {
    identity.bearer = null;
    const res = await request(app.getHttpServer()).post('/api/maps/search').set(as(USER)).send({ query: 'Café' });
    expect(res.status).toBe(200);
    expect(hostsAsked()).toEqual(['nominatim.openstreetmap.org']);
  });

  it("MAPS-PHOTON-E2E-004: keeps an operator's own Nominatim", async () => {
    vi.stubEnv('NOMINATIM_URL', 'http://nominatim.internal:8080');
    const res = await request(app.getHttpServer()).post('/api/maps/search').set(as(USER)).send({ query: 'Café' });
    expect(res.status).toBe(200);
    expect(hostsAsked()).toEqual(['nominatim.internal']);
  });
});

describe('GET /api/maps/reverse', () => {
  it('MAPS-PHOTON-E2E-005: names the point from Photon', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/maps/reverse')
      .set(as(USER))
      .query({ lat: '52.5163', lng: '13.3777', lang: 'de' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      name: 'Brandenburger Tor',
      address: 'Brandenburger Tor, Pariser Platz, Mitte, Berlin, 10117, Deutschland',
    });
    expect(asked[0].pathname).toBe('/reverse');
  });

  it('MAPS-PHOTON-E2E-006: asks Nominatim when Photon is down', async () => {
    photonReply = () => photonAnswer([], 503);
    const res = await request(app.getHttpServer())
      .get('/api/maps/reverse')
      .set(as(USER))
      .query({ lat: '52.5163', lng: '13.3777' });
    expect(res.body).toEqual({ name: 'Café Nominatim', address: NOMINATIM_HIT.display_name });
    expect(hostsAsked()).toEqual(['photon.liketrek.com', 'nominatim.openstreetmap.org']);
  });

  it('MAPS-PHOTON-E2E-007: answers 401 without a session and asks nobody', async () => {
    const res = await request(app.getHttpServer()).get('/api/maps/reverse').query({ lat: '52.5', lng: '13.4' });
    expect(res.status).toBe(401);
    expect(asked).toEqual([]);
  });
});
