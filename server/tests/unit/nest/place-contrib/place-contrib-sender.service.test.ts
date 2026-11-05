/**
 * PlaceContribSender over the real tables on a migrated test db, with the TREK
 * Places API stubbed: what a run sends, what it keeps home, and what each kind
 * of answer does to the queue, the log and the pause.
 *
 * Replaced: the API client, the storage the pictures are read from, and the
 * deployment (a production instance at the public index).
 */
import type { AppEnv } from '../../../../src/app-config';
import { PlaceContribLog } from '../../../../src/db/entities/PlaceContribLog.entity';
import { PlaceContribOutbox } from '../../../../src/db/entities/PlaceContribOutbox.entity';
import { PlaceFieldOrigin } from '../../../../src/db/entities/PlaceFieldOrigin.entity';
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { servicesConfig } from '../../../../src/nest/app-config/tokens';
import { inOrder } from '../../../../src/nest/common/in-order';
import { valueHash } from '../../../../src/nest/common/value-hash';
import { PlaceContribSender } from '../../../../src/nest/place-contrib/place-contrib-sender.service';
import { PlaceContribSettings } from '../../../../src/nest/place-contrib/place-contrib-settings';
import { PlaceContribClient, type ContribAnswer } from '../../../../src/nest/place-contrib/place-contrib.client';
import { MAX_ATTEMPTS, PLACES_PER_RUN } from '../../../../src/nest/place-contrib/place-contrib.constants';
import { PlaceContribModule } from '../../../../src/nest/place-contrib/place-contrib.module';
import { PlaceContribService } from '../../../../src/nest/place-contrib/place-contrib.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { countRows, findRow, findRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { readAppSetting } from '../../../helpers/factories/settings';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import {
  PLACE_CONTRIB_TERMS_VERSION,
  placeContribCidSchema,
  type PlaceContribImageAnswer,
  type PlaceContribPlaceAnswer,
  type PlaceContribPlaceBody,
} from '@trek/shared';

import { Jimp } from 'jimp';
import { Readable } from 'node:stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

class ProductionEnv extends RuntimeEnvService {
  override env(): AppEnv {
    const env = super.env();
    return { ...env, maps: { ...env.maps, trekPlacesEnabled: true, trekPlacesUrl: undefined } };
  }

  override isProduction(): boolean {
    return true;
  }

  override isDemoMode(): boolean {
    return false;
  }
}

type PlaceAnswer = ContribAnswer<PlaceContribPlaceAnswer>;
type ImageAnswer = ContribAnswer<PlaceContribImageAnswer>;

const client = {
  hasKey: vi.fn(() => true),
  keyFingerprint: vi.fn(() => 'fp-1'),
  servedPlace: vi.fn(async (): Promise<unknown> => null),
  postPlace: vi.fn(async (_body: PlaceContribPlaceBody): Promise<PlaceAnswer> => accepted({})),
  postImage: vi.fn(async (): Promise<ImageAnswer> => ({
    kind: 'ok',
    body: { ok: true, result: { result: 'review' } },
  })),
  withdraw: vi.fn(),
};
const storage = { stat: vi.fn(), getStream: vi.fn() };

const GERS = 'gers:ceba0e62-172b-4343-bb3b-78b915a18383';
const NOW = new Date('2026-10-30T12:00:00Z');
const DUE = '2026-10-30 11:00:00';

const db = createSnapshotTestDb();
let t: TestModule;
let jpeg: Buffer;

beforeAll(async () => {
  jpeg = Buffer.from(await new Jimp({ width: 40, height: 30, color: 0xff0000ff }).getBuffer('image/jpeg'));
  t = await createTestModule({
    db,
    imports: [PlaceContribModule],
    overrides: [
      { provide: RuntimeEnvService, useValue: new ProductionEnv() },
      {
        provide: servicesConfig.KEY,
        useValue: { mode: 'auto', key: null, hosts: ['places.liketrek.com'], photonUrl: '', valhallaUrl: '' },
      },
      { provide: PlaceContribClient, useValue: client },
      { provide: StorageService, useValue: storage },
    ],
  });
});

beforeEach(async () => {
  resetTestDb(db);
  vi.clearAllMocks();
  client.hasKey.mockReturnValue(true);
  client.servedPlace.mockResolvedValue(null);
  client.postPlace.mockImplementation(async (body) => accepted(resultsFor(body, 'published')));
  storage.stat.mockResolvedValue({ key: 'k', size: jpeg.length, mtimeMs: 0 });
  storage.getStream.mockImplementation(async () => ({ stream: Readable.from([jpeg]), stat: {} }));
  await t
    .get(PlaceContribService)
    .decide(1, { action: 'agree', termsVersion: PLACE_CONTRIB_TERMS_VERSION, fields: allFields() }, NOW);
});

afterAll(async () => {
  await t.close();
  db.close();
});

const sender = () => t.get(PlaceContribSender);
const orm = () => t.get(MikroORM);

function allFields() {
  return { website: true, phone: true, email: true, opening_hours: true, description: true, image: true };
}

function accepted(results: PlaceContribPlaceAnswer['results'], duplicate = false): PlaceAnswer {
  return { kind: 'ok', body: { ok: true, cid: 'c', duplicate, key: GERS, results } };
}

function resultsFor(body: PlaceContribPlaceBody, result: 'published' | 'review'): PlaceContribPlaceAnswer['results'] {
  return Object.fromEntries(Object.keys(body.fields).map((field) => [field, { result }]));
}

/**
 * A place holding the user's values, each with the origin row that vouches
 * for it and a due entry in the queue.
 */
async function seed(
  values: Record<string, string>,
  opts: { key?: string; queued?: Record<string, string>; created?: string; attempts?: number } = {},
): Promise<{ placeId: number }> {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const columns = Object.fromEntries(
    Object.entries(values).map(([field, value]) => [field === 'image' ? 'image_url' : field, value]),
  );
  const place = await makePlace(orm(), trip.id, { osm_id: GERS, name: 'Café Luna', ...columns });
  await inOrder(Object.entries(values), async ([field, value]) => {
    await insertRow(orm(), PlaceFieldOrigin, { place: place.id, field, origin: 'user', value_hash: valueHash(value) });
    await insertRow(orm(), PlaceContribOutbox, {
      contrib_key: opts.key ?? GERS,
      field,
      value: opts.queued?.[field] ?? value,
      place: place.id,
      place_name: 'Café Luna',
      lat: 54.08,
      lng: 12.13,
      country: 'DE',
      cid: `cid-${field}-0001`,
      attempts: opts.attempts ?? 0,
      eligible_at: DUE,
      next_attempt_at: DUE,
      ...(opts.created ? { created_at: opts.created } : {}),
    });
  });

  return { placeId: place.id };
}

async function logLines() {
  return (await findRows(orm(), PlaceContribLog, {})).map(({ field, result, reason }) => ({ field, result, reason }));
}

describe('when nothing may go', () => {
  it('PCSD-001: without an agreement in force the queue is left alone', async () => {
    await t.get(PlaceContribService).decide(1, { action: 'off' }, NOW);
    await seed({ website: 'https://cafe-luna.de' });
    expect(await sender().run(NOW)).toEqual({ skipped: 'inactive', places: 0, expired: 0 });
    expect(client.postPlace).not.toHaveBeenCalled();
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(1);
  });

  it('PCSD-002: a pause holds the run', async () => {
    await seed({ website: 'https://cafe-luna.de' });
    await t.get(PlaceContribSettings).pauseFor('key_invalid', null);
    expect((await sender().run(NOW)).skipped).toBe('paused');
    expect(client.postPlace).not.toHaveBeenCalled();
  });
});

describe('a place request', () => {
  it('PCSD-010: sends the due fields of a place in one request and logs what the service made of them', async () => {
    const hours = JSON.stringify([
      { closed: false, open: '09:00', close: '18:00' },
      { closed: false, open: '09:00', close: '18:00' },
      { closed: false },
      { closed: false },
      { closed: false },
      { closed: false },
      { closed: true },
    ]);
    await seed(
      { website: 'https://cafe-luna.de', opening_hours: hours },
      { queued: { opening_hours: 'Mo-Tu 09:00-18:00; Su off' } },
    );
    client.servedPlace.mockResolvedValue({
      website: 'https://old-luna.de',
      phone: null,
      email: null,
      opening_hours: null,
      description: null,
    });
    client.postPlace.mockResolvedValue(
      accepted({ website: { result: 'review', reason: null }, opening_hours: { result: 'published' } }),
    );

    expect(await sender().run(NOW)).toEqual({ skipped: null, places: 1, expired: 0 });

    expect(client.servedPlace).toHaveBeenCalledWith('ceba0e62-172b-4343-bb3b-78b915a18383');
    const body = client.postPlace.mock.calls[0]?.[0];
    expect(body).toMatchObject({
      v: 1,
      termsVersion: PLACE_CONTRIB_TERMS_VERSION,
      key: GERS,
      fields: {
        website: { value: 'https://cafe-luna.de', baseHash: expect.stringMatching(/^[0-9a-f]{16}$/) },
        opening_hours: { value: 'Mo-Tu 09:00-18:00; Su off', baseHash: null },
      },
      place: { name: 'Café Luna', lat: 54.08, lng: 12.13, country: 'DE' },
    });
    expect(placeContribCidSchema.safeParse(body?.cid).success).toBe(true);
    expect(await logLines()).toEqual([
      { field: 'website', result: 'accepted', reason: 'review' },
      { field: 'opening_hours', result: 'accepted', reason: 'published' },
    ]);
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
  });

  it('PCSD-011: a value the index already serves is not sent', async () => {
    await seed({ website: 'https://cafe-luna.de' });
    client.servedPlace.mockResolvedValue({
      website: 'cafe-luna.de',
      phone: null,
      email: null,
      opening_hours: null,
      description: null,
    });
    await sender().run(NOW);
    expect(client.postPlace).not.toHaveBeenCalled();
    expect(await logLines()).toEqual([{ field: 'website', result: 'withheld', reason: 'unchanged' }]);
  });

  it('PCSD-012: a value that is no longer the user one stays home', async () => {
    const { placeId } = await seed({ website: 'https://cafe-luna.de', phone: '+49 1', email: 'a@luna.de' });
    // The assistant took the phone over; the e-mail changed on a path that recorded nothing.
    await updateRows(orm(), PlaceFieldOrigin, { place: placeId, field: 'phone' }, { origin: 'agent' });
    await updateRows(
      orm(),
      PlaceFieldOrigin,
      { place: placeId, field: 'email' },
      { value_hash: valueHash('b@luna.de') },
    );
    await sender().run(NOW);
    expect(client.postPlace.mock.calls[0]?.[0].fields).toEqual({
      website: { value: 'https://cafe-luna.de', baseHash: null },
    });
    expect(await logLines()).toEqual(
      expect.arrayContaining([
        { field: 'phone', result: 'withheld', reason: 'origin_changed' },
        { field: 'email', result: 'withheld', reason: 'origin_stale' },
        { field: 'website', result: 'accepted', reason: 'published' },
      ]),
    );
  });

  it('PCSD-013: a duplicate answer without a result is logged as one', async () => {
    await seed({ website: 'https://cafe-luna.de' });
    client.postPlace.mockResolvedValue(accepted({}, true));
    await sender().run(NOW);
    expect(await logLines()).toEqual([{ field: 'website', result: 'duplicate', reason: 'no_result' }]);
  });

  it('PCSD-014: at most PLACES_PER_RUN places go in one run', async () => {
    await inOrder(
      Array.from({ length: PLACES_PER_RUN + 2 }, (_, i) => i),
      async (i) => {
        await seed({ website: `https://cafe-${i}.de` }, { key: `osm:node/${i + 1}` });
      },
    );
    expect((await sender().run(NOW)).places).toBe(PLACES_PER_RUN);
    expect(client.postPlace).toHaveBeenCalledTimes(PLACES_PER_RUN);
    expect(client.servedPlace).not.toHaveBeenCalled();
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(2);
  });

  it('PCSD-015: a value the user replaces while its request is out stays queued for the next run', async () => {
    await seed({ website: 'https://cafe-luna.de' });
    client.postPlace.mockImplementation(async (body) => {
      // The user saves a newer website while the request for the old one is out.
      await updateRows(
        orm(),
        PlaceContribOutbox,
        { field: 'website' },
        { value: 'https://luna.example', cid: 'cid-website-0002' },
      );
      return accepted(resultsFor(body, 'published'));
    });
    await sender().run(NOW);
    // The old value went out and is logged; the newer one waits for its own request.
    expect(await logLines()).toEqual([{ field: 'website', result: 'accepted', reason: 'published' }]);
    expect(await findRows(orm(), PlaceContribOutbox, {})).toEqual([
      expect.objectContaining({ value: 'https://luna.example', cid: 'cid-website-0002', attempts: 0 }),
    ]);
  });
});

describe('refusals and failures', () => {
  it('PCSD-020: a refused key pauses sending and stops the run, counting no attempt', async () => {
    await seed({ website: 'https://a.de' }, { key: 'osm:node/1' });
    await seed({ website: 'https://b.de' }, { key: 'osm:node/2' });
    client.postPlace.mockResolvedValue({ kind: 'refused', status: 401, error: 'key_invalid', retryAfterMs: null });
    await sender().run(NOW);
    expect(client.postPlace).toHaveBeenCalledTimes(1);
    expect(JSON.parse((await readAppSetting(orm(), 'places_contribute_pause')) ?? '{}')).toMatchObject({
      reason: 'key_invalid',
      key: 'fp-1',
    });
    const rows = await findRows(orm(), PlaceContribOutbox, {});
    expect(rows.map((row) => row.attempts)).toEqual([0, 0]);
    expect(rows[0]?.next_attempt_at).toBe('2026-10-30 12:30:00');
  });

  it('PCSD-021: a service not taking contributions is a pause until its Retry-After', async () => {
    await seed({ website: 'https://a.de' });
    client.postPlace.mockResolvedValue({
      kind: 'refused',
      status: 503,
      error: 'not_accepting',
      retryAfterMs: 3_600_000,
    });
    await sender().run(NOW);
    expect(JSON.parse((await readAppSetting(orm(), 'places_contribute_pause')) ?? '{}')).toMatchObject({
      reason: 'not_accepting',
      until: '2026-10-30T13:00:00.000Z',
    });
    expect((await findRow(orm(), PlaceContribOutbox, {}))?.next_attempt_at).toBe('2026-10-30 13:00:00');
  });

  it('PCSD-022: no answer is tried again after 10 minutes, and given up after MAX_ATTEMPTS', async () => {
    await seed({ website: 'https://a.de' }, { key: 'osm:node/1' });
    await seed({ website: 'https://b.de' }, { key: 'osm:node/2', attempts: MAX_ATTEMPTS - 1 });
    client.postPlace.mockResolvedValue({ kind: 'failed', reason: 'TimeoutError', retryAfterMs: null });
    await sender().run(NOW);
    const rows = await findRows(orm(), PlaceContribOutbox, {});
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ contrib_key: 'osm:node/1', attempts: 1, next_attempt_at: '2026-10-30 12:10:00' });
    expect(await logLines()).toEqual([{ field: 'website', result: 'withheld', reason: 'gave_up' }]);
  });

  it('PCSD-023: a rate limit waits as long as the service says and stops the run', async () => {
    await seed({ website: 'https://a.de' }, { key: 'osm:node/1' });
    await seed({ website: 'https://b.de' }, { key: 'osm:node/2' });
    client.postPlace.mockResolvedValue({
      kind: 'refused',
      status: 429,
      error: 'field_allowance',
      retryAfterMs: 120_000,
    });
    await sender().run(NOW);
    expect(client.postPlace).toHaveBeenCalledTimes(1);
    expect(await findRow(orm(), PlaceContribOutbox, { contrib_key: 'osm:node/1' })).toMatchObject({
      attempts: 1,
      next_attempt_at: '2026-10-30 12:02:00',
    });
  });

  it('PCSD-024: a field the service does not take is final; the others go again at once', async () => {
    await seed({ website: 'https://a.de', email: 'info@a.de' });
    client.postPlace.mockResolvedValue({
      kind: 'refused',
      status: 422,
      error: 'field_not_accepted:email',
      retryAfterMs: null,
    });
    await sender().run(NOW);
    expect(await logLines()).toEqual([{ field: 'email', result: 'rejected', reason: 'field_not_accepted:email' }]);
    expect(await findRow(orm(), PlaceContribOutbox, {})).toMatchObject({
      field: 'website',
      attempts: 0,
      next_attempt_at: '2026-10-30 12:00:00',
    });
  });

  it('PCSD-025: any other refusal with a reason is final for the whole request', async () => {
    await seed({ website: 'https://a.de', phone: '+49 1' });
    client.postPlace.mockResolvedValue({ kind: 'refused', status: 422, error: 'unknown_place', retryAfterMs: null });
    await sender().run(NOW);
    expect(await logLines()).toEqual([
      { field: 'website', result: 'rejected', reason: 'unknown_place' },
      { field: 'phone', result: 'rejected', reason: 'unknown_place' },
    ]);
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
  });

  it('PCSD-026: a field over its allowance is tried again, the rest is final', async () => {
    await seed({ website: 'https://a.de', phone: '+49 1' });
    client.postPlace.mockResolvedValue(accepted({ website: { result: 'published' }, phone: { result: 'quota' } }));
    await sender().run(NOW);
    expect(await logLines()).toEqual([{ field: 'website', result: 'accepted', reason: 'published' }]);
    expect(await findRow(orm(), PlaceContribOutbox, {})).toMatchObject({ field: 'phone', attempts: 1 });
  });

  it('PCSD-027: a value queued for over 30 days is given up on', async () => {
    await seed({ website: 'https://a.de' }, { created: '2026-09-01 00:00:00' });
    expect((await sender().run(NOW)).expired).toBe(1);
    expect(client.postPlace).not.toHaveBeenCalled();
    expect(await logLines()).toEqual([{ field: 'website', result: 'withheld', reason: 'expired' }]);
  });
});

describe('a picture', () => {
  it('PCSD-030: images switched off on the service keep the picture home, out of the retry loop', async () => {
    await seed({ image: '/uploads/places/luna.jpg' });
    client.postImage.mockResolvedValueOnce({
      kind: 'refused',
      status: 503,
      error: 'images_disabled',
      retryAfterMs: null,
    });
    await sender().run(NOW);
    expect(client.postImage).toHaveBeenCalledWith(GERS, expect.any(String), expect.any(Buffer));
    expect(storage.getStream).toHaveBeenCalledWith('places', 'luna.jpg');
    expect(await logLines()).toEqual([{ field: 'image', result: 'withheld', reason: 'images_disabled' }]);
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
    expect(await readAppSetting(orm(), 'places_contribute_pause')).toBeNull();
  });

  it('PCSD-031: a picture the service takes for review is logged as accepted', async () => {
    await seed({ image: '/uploads/places/luna.jpg' });
    await sender().run(NOW);
    const sent = client.postImage.mock.calls[0] as unknown as [string, string, Buffer] | undefined;
    expect(sent?.[2].subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
    expect(await logLines()).toEqual([{ field: 'image', result: 'accepted', reason: 'review' }]);
  });

  it('PCSD-032: a picture that is gone or unreadable stays home', async () => {
    await seed({ image: '/uploads/places/gone.jpg' });
    storage.stat.mockResolvedValueOnce(null);
    await sender().run(NOW);
    await seed({ image: '/uploads/places/garbage.jpg' }, { key: 'osm:node/9' });
    storage.getStream.mockImplementationOnce(async () => ({ stream: Readable.from([Buffer.from('nope')]), stat: {} }));
    await sender().run(NOW);
    expect(client.postImage).not.toHaveBeenCalled();
    expect(await logLines()).toEqual([
      { field: 'image', result: 'withheld', reason: 'image_missing' },
      { field: 'image', result: 'withheld', reason: 'image_unreadable' },
    ]);
  });
});
