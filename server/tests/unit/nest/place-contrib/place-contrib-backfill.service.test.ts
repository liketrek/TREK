/**
 * PlaceContribBackfill over the real tables on a migrated test db: after an
 * admin agrees, what users typed into places before that goes out as well,
 * page by page, only while it is still the user's value, only for fields that
 * are switched on and only for places the service can key.
 *
 * Replaced: the client of the TREK Places API (no request leaves) and the
 * deployment (a production instance with the index at the public address).
 */
import type { AppEnv } from '../../../../src/app-config';
import { PlaceContribLog } from '../../../../src/db/entities/PlaceContribLog.entity';
import { PlaceContribOutbox } from '../../../../src/db/entities/PlaceContribOutbox.entity';
import { PlaceFieldOrigin } from '../../../../src/db/entities/PlaceFieldOrigin.entity';
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { servicesConfig } from '../../../../src/nest/app-config/tokens';
import { valueHash } from '../../../../src/nest/common/value-hash';
import {
  BACKFILL_LOW_WATER,
  PlaceContribBackfill,
} from '../../../../src/nest/place-contrib/place-contrib-backfill.service';
import { PlaceContribSettings } from '../../../../src/nest/place-contrib/place-contrib-settings';
import { PlaceContribClient } from '../../../../src/nest/place-contrib/place-contrib.client';
import { PlaceContribModule } from '../../../../src/nest/place-contrib/place-contrib.module';
import { PlaceContribService } from '../../../../src/nest/place-contrib/place-contrib.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { countRows, findRows, insertRow } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { PLACE_CONTRIB_TERMS_VERSION, type PlaceContribFieldSwitches } from '@trek/shared';

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

const client = {
  hasKey: vi.fn(() => true),
  keyFingerprint: vi.fn(() => 'fp-1'),
  withdraw: vi.fn(async (): Promise<unknown> => ({ kind: 'ok', body: { ok: true, withdrawn: { website: 1 } } })),
};

const ALL: PlaceContribFieldSwitches = {
  website: true,
  phone: true,
  email: true,
  opening_hours: true,
  description: true,
  image: true,
};
const GERS = 'gers:ceba0e62-172b-4343-bb3b-78b915a18383';
const OSM = 'node:4242';
const ADMIN = 1;
const NOW = new Date('2026-11-02T12:00:00Z');

const db = createSnapshotTestDb();
let t: TestModule;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [PlaceContribModule],
    overrides: [
      { provide: RuntimeEnvService, useValue: new ProductionEnv() },
      {
        provide: servicesConfig.KEY,
        useValue: {
          mode: 'auto',
          key: null,
          hosts: ['places.liketrek.com'],
          photonUrl: 'https://photon.liketrek.com',
          valhallaUrl: 'https://valhalla.liketrek.com',
        },
      },
      { provide: PlaceContribClient, useValue: client },
    ],
  });
});

beforeEach(() => {
  resetTestDb(db);
  vi.restoreAllMocks();
  client.hasKey.mockReturnValue(true);
});

afterAll(async () => {
  await t.close();
  db.close();
});

const backfill = () => t.get(PlaceContribBackfill);
const service = () => t.get(PlaceContribService);
const store = () => t.get(PlaceContribSettings);
const orm = () => t.get(MikroORM);

async function agree(fields: PlaceContribFieldSwitches = ALL): Promise<void> {
  await service().decide(ADMIN, { action: 'agree', termsVersion: PLACE_CONTRIB_TERMS_VERSION, fields }, NOW);
}

/** A place with a website, whose origin is recorded as `origin` for the value given (the current one by default). */
async function placeWith(
  opts: { osmId?: string | null; origin?: string; typed?: string; website?: string } = {},
): Promise<number> {
  const website = opts.website ?? 'https://cafe-luna.de';
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const { id } = await makePlace(orm(), trip.id, {
    name: 'Café Luna',
    osm_id: opts.osmId === undefined ? GERS : opts.osmId,
    website,
    lat: 54.08,
    lng: 12.13,
  });
  await insertRow(orm(), PlaceFieldOrigin, {
    place: id,
    field: 'website',
    origin: opts.origin ?? 'user',
    value_hash: valueHash(opts.typed ?? website),
  });
  return id;
}

const queued = async () =>
  (await findRows(orm(), PlaceContribOutbox, {})).map((row) => ({ place: row.place_id, field: row.field }));

describe('PlaceContribBackfill', () => {
  it('PCB-001: an agreement starts the catch-up for every field switched on', async () => {
    await agree({ ...ALL, image: false });
    expect(await store().backfill()).toEqual({
      fields: ['website', 'phone', 'email', 'opening_hours', 'description'],
      afterId: 0,
    });
  });

  it('PCB-002: queues what a user typed earlier, and leaves provider values, changed values and unkeyed places', async () => {
    const typed = await placeWith();
    await placeWith({ origin: 'trek' });
    await placeWith({ typed: 'https://old.example' });
    const unkeyed = await placeWith({ osmId: null });
    const osm = await placeWith({ osmId: OSM });
    await agree();

    expect(await backfill().step(NOW)).toBe(2);
    expect(await queued()).toEqual([
      { place: typed, field: 'website' },
      { place: osm, field: 'website' },
    ]);
    // An unkeyed place is passed over without a line in the log.
    expect(await countRows(orm(), PlaceContribLog)).toBe(0);
    expect((await store().backfill())?.afterId).toBe(Math.max(typed, unkeyed, osm));
  });

  it('PCB-003: goes on after the last place it queued, and ends once nothing is left', async () => {
    const first = await placeWith();
    const second = await placeWith();
    await agree();
    await store().writeBackfill({ fields: ['website'], afterId: first });

    expect(await backfill().step(NOW)).toBe(1);
    expect(await queued()).toEqual([{ place: second, field: 'website' }]);
    expect(await backfill().step(NOW)).toBe(0);
    expect(await store().backfill()).toBeNull();
  });

  it('PCB-004: waits without a key, and while the queue is full enough', async () => {
    await placeWith();
    await agree();
    client.hasKey.mockReturnValue(false);
    expect(await backfill().step(NOW)).toBe(0);
    expect(await store().backfill()).not.toBeNull();

    client.hasKey.mockReturnValue(true);
    const outbox = (backfill() as unknown as { outbox: { size: () => Promise<number> } }).outbox;
    vi.spyOn(outbox, 'size').mockResolvedValueOnce(BACKFILL_LOW_WATER);
    expect(await backfill().step(NOW)).toBe(0);
    expect(await queued()).toEqual([]);
    expect(await backfill().step(NOW)).toBe(1);
  });

  it('PCB-005: does nothing without a catch-up, and ends one whose fields were all switched off', async () => {
    await placeWith();
    expect(await backfill().step(NOW)).toBe(0);

    await agree();
    await store().writeBackfill({ fields: ['email'], afterId: 0 });
    await service().decide(ADMIN, { action: 'fields', fields: { ...ALL, email: false } }, NOW);
    expect(await backfill().step(NOW)).toBe(0);
    expect(await store().backfill()).toBeNull();
    expect(await queued()).toEqual([]);
  });

  it('PCB-006: a field switched on later catches up from the start, together with what was still to do', async () => {
    await agree({ ...ALL, website: false, phone: false });
    await store().writeBackfill({ fields: ['email'], afterId: 7 });
    await service().decide(ADMIN, { action: 'fields', fields: { ...ALL, phone: false } }, NOW);
    expect(await store().backfill()).toEqual({ fields: ['website', 'email'], afterId: 0 });

    // A change that switches nothing on leaves the catch-up where it is.
    await store().writeBackfill({ fields: ['email'], afterId: 7 });
    await service().decide(ADMIN, { action: 'fields', fields: { ...ALL, phone: false, website: false } }, NOW);
    expect(await store().backfill()).toEqual({ fields: ['email'], afterId: 7 });
  });

  it('PCB-008: a value a save queued for the same place key is newer and stays', async () => {
    const older = await placeWith({ website: 'https://old-luna.example' });
    const newer = await placeWith({ website: 'https://cafe-luna.de' });
    await agree();
    await service().enqueue(
      {
        placeId: newer,
        osmId: GERS,
        name: 'Café Luna',
        lat: 54.08,
        lng: 12.13,
        country: 'DE',
        values: [{ field: 'website', value: 'https://cafe-luna.de' }],
        dropped: [],
      },
      NOW,
    );
    await store().writeBackfill({ fields: ['website'], afterId: 0 });
    await backfill().step(NOW);
    const rows = await findRows(orm(), PlaceContribOutbox, {});
    expect(rows.map((row) => ({ place: row.place_id, value: row.value }))).toEqual([
      { place: newer, value: expect.stringContaining('cafe-luna.de') },
    ]);
    expect(rows.some((row) => row.place_id === older)).toBe(false);
  });

  it('PCB-009: an agreement from 5.1.0 does not catch up when a field is switched on later', async () => {
    await agree({ ...ALL, phone: false });
    const consent = await store().consent();
    await store().writeConsent({ ...consent, includesEarlier: undefined });
    await store().writeBackfill(null);
    await service().decide(ADMIN, { action: 'fields', fields: ALL }, NOW);
    expect(await store().backfill()).toBeNull();
  });

  it('PCB-010: withdrawing everything ends the catch-up, so nothing taken back goes out again', async () => {
    await agree();
    await service().withdrawAll(NOW);
    expect(await store().backfill()).toBeNull();
  });

  it('PCB-007: switching off or declining ends the catch-up', async () => {
    await agree();
    await service().decide(ADMIN, { action: 'off' }, NOW);
    expect(await store().backfill()).toBeNull();

    await agree();
    await service().decide(ADMIN, { action: 'decline', termsVersion: PLACE_CONTRIB_TERMS_VERSION }, NOW);
    expect(await store().backfill()).toBeNull();
  });
});
