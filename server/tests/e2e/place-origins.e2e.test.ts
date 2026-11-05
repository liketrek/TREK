/**
 * Origin tracking through the real place routes: PlacesModule behind the real
 * JwtAuthGuard and Zod pipe on a migrated temp database. A create or update
 * records where each shareable field it changed came from, the way the
 * offline replay of the same request does, and a test instance queues nothing
 * for the TREK Places API.
 *
 * Replaced: the journey hooks and the realtime transport.
 */
import { PlaceContribOutbox } from '../../src/db/entities/PlaceContribOutbox.entity';
import { PlaceDetailsCache } from '../../src/db/entities/PlaceDetailsCache.entity';
import { PlaceFieldOrigin } from '../../src/db/entities/PlaceFieldOrigin.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { valueHash } from '../../src/nest/common/value-hash';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PlacesModule } from '../../src/nest/places/places.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { countRows, deleteRows, findRows, insertRow } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
const GERS = 'gers:ceba0e62-172b-4343-bb3b-78b915a18383';
const journey = { onPlaceCreated: async () => undefined, onPlaceUpdated: async () => undefined };

let orm: TestOrm;
let app: Awaited<ReturnType<typeof build>>;
let server: Server;

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, PlacesModule],
  })
    .overrideProvider(RealtimeService)
    .useValue(new FakeRealtimeService())
    .overrideProvider(JourneyDomainService)
    .useValue(journey)
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalFilters(new TrekExceptionFilter());
  nest.useGlobalPipes(new ZodValidationPipe());
  await nest.init();
  return nest;
}

const as = () => ({ Cookie: sessionCookie(1) });

async function origins(placeId: number): Promise<Record<string, string>> {
  const rows = await findRows(orm, PlaceFieldOrigin, { place: placeId });
  return Object.fromEntries(rows.map((row) => [row.field, row.origin]));
}

beforeAll(async () => {
  orm = await createTestOrm(db);
  await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test' });
  app = await build();
  server = app.getHttpServer();
});

beforeEach(async () => {
  await deleteRows(orm, Trips, { id: 5 });
  await insertRow(orm, Trips, { id: 5, title: 'Trip', user: 1 });
  await deleteRows(orm, PlaceDetailsCache);
});

afterAll(async () => {
  await app.close();
  await orm.close();
});

describe('origin tracking on the place routes', () => {
  it('POE2E-001: a create records the origins the client reported, and unknown where it reported none', async () => {
    const res = await request(server)
      .post('/api/trips/5/places')
      .set(as())
      .send({
        name: 'Café Luna',
        osm_id: GERS,
        website: 'https://cafe-luna.de',
        phone: '+49 381 1',
        description: 'Coffee by the sea.',
        fieldOrigins: { website: 'user', phone: 'trek' },
      });
    expect(res.status).toBe(201);
    expect(res.body.place).not.toHaveProperty('fieldOrigins');
    expect(await origins(res.body.place.id)).toEqual({ website: 'user', phone: 'trek', description: 'unknown' });
    const [website] = await findRows(orm, PlaceFieldOrigin, { place: res.body.place.id, field: 'website' });
    expect(website?.value_hash).toBe(valueHash('https://cafe-luna.de'));
    // Not eligible under NODE_ENV=test: nothing waits to be sent.
    expect(await countRows(orm, PlaceContribOutbox)).toBe(0);
  });

  it('POE2E-002: an update records only the field it changed', async () => {
    const created = await request(server)
      .post('/api/trips/5/places')
      .set(as())
      .send({ name: 'Café Luna', website: 'https://cafe-luna.de', fieldOrigins: { website: 'user' } });
    const id = created.body.place.id as number;
    const res = await request(server)
      .put(`/api/trips/5/places/${id}`)
      .set(as())
      .send({
        name: 'Café Luna',
        website: 'https://cafe-luna.de',
        email: 'info@cafe-luna.de',
        fieldOrigins: { email: 'user' },
      });
    expect(res.status).toBe(200);
    expect(await origins(id)).toEqual({ website: 'user', email: 'user' });
    const cleared = await request(server).put(`/api/trips/5/places/${id}`).set(as()).send({ email: '' });
    expect(cleared.status).toBe(200);
    expect(await origins(id)).toEqual({ website: 'user' });
  });

  it('POE2E-003: a value claimed as typed that a provider handed out for the place is the provider', async () => {
    await insertRow(orm, PlaceDetailsCache, {
      place_id: GERS,
      lang: 'en',
      expanded: 0,
      payload_json: JSON.stringify({ website: 'https://cafe-luna.de', phone: '+49 381 1' }),
      fetched_at: Date.now(),
    });
    const res = await request(server)
      .post('/api/trips/5/places')
      .set(as())
      .send({ name: 'Café Luna', osm_id: GERS, phone: '+49 381 1', fieldOrigins: { phone: 'user' } });
    expect(await origins(res.body.place.id)).toEqual({ phone: 'trek' });
  });

  it('POE2E-004: the pipe refuses an origin only the server may decide', async () => {
    const res = await request(server)
      .post('/api/trips/5/places')
      .set(as())
      .send({ name: 'Café Luna', website: 'https://cafe-luna.de', fieldOrigins: { website: 'agent' } });
    expect(res.status).toBe(400);
  });
});
