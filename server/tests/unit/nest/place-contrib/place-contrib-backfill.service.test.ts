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
import type { PlaceContribOutboxRepository } from '../../../../src/db/repositories/PlaceContribOutbox.repository';
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
  opts: {
    osmId?: string | null;
    origin?: string;
    typed?: string;
    website?: string;
    lat?: number | null;
    lng?: number | null;
    address?: string;
  } = {},
): Promise<number> {
  const website = opts.website ?? 'https://cafe-luna.de';
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const { id } = await makePlace(orm(), trip.id, {
    name: 'Café Luna',
    osm_id: opts.osmId === undefined ? GERS : opts.osmId,
    website,
    lat: opts.lat === undefined ? 54.08 : opts.lat,
    lng: opts.lng === undefined ? 12.13 : opts.lng,
    address: opts.address ?? null,
  });
  await insertRow(orm(), PlaceFieldOrigin, {
    place: id,
    field: 'website',
    origin: opts.origin ?? 'user',
    value_hash: valueHash(opts.typed ?? website),
  });
  return id;
}

/** Runs `meanwhile` once the step has read its page, before it queues anything. */
function betweenReadAndWrite(meanwhile: () => Promise<unknown>): void {
  const outbox = (backfill() as unknown as { outbox: PlaceContribOutboxRepository }).outbox;
  const read = outbox.typedAfter.bind(outbox);
  vi.spyOn(outbox, 'typedAfter').mockImplementationOnce(async (...args) => {
    const page = await read(...args);
    await meanwhile();
    return page;
  });
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

  it('PCB-011: a withdrawal that commits while a step reads its page brings nothing back', async () => {
    await placeWith();
    await agree();
    betweenReadAndWrite(() => service().withdrawAll(NOW));
    expect(await backfill().step(NOW)).toBe(0);
    expect(await queued()).toEqual([]);
    expect(await store().backfill()).toBeNull();
  });

  it('PCB-012: switching off while a step reads its page queues nothing, and leaves the catch-up ended', async () => {
    await placeWith();
    await agree();
    betweenReadAndWrite(() => service().decide(ADMIN, { action: 'off' }, NOW));
    expect(await backfill().step(NOW)).toBe(0);
    expect(await queued()).toEqual([]);
    expect(await store().backfill()).toBeNull();
  });

  it('PCB-013: a field switched off while a step reads its page is not queued', async () => {
    const id = await placeWith();
    await agree();
    betweenReadAndWrite(() => service().decide(ADMIN, { action: 'fields', fields: { ...ALL, website: false } }, NOW));
    expect(await backfill().step(NOW)).toBe(0);
    expect(await queued()).toEqual([]);
    expect(await store().backfill()).toEqual({
      fields: ['phone', 'email', 'opening_hours', 'description', 'image'],
      afterId: id,
    });
  });

  it('PCB-014: after withdrawing everything, switching a field off and on again does not share its history', async () => {
    await placeWith();
    await agree();
    await service().withdrawAll(NOW);
    await service().decide(ADMIN, { action: 'fields', fields: { ...ALL, website: false } }, NOW);
    await service().decide(ADMIN, { action: 'fields', fields: ALL }, NOW);
    expect(await store().backfill()).toBeNull();
    expect(await backfill().step(NOW)).toBe(0);
    expect(await queued()).toEqual([]);

    // A new agreement shares the earlier values again.
    await agree();
    expect((await store().consent()).withdrawnFields).toBeUndefined();
    expect(await backfill().step(NOW)).toBe(1);
  });

  it('PCB-015: a field withdrawn on its own does not catch up when switched on again, another field still does', async () => {
    await agree({ ...ALL, phone: false });
    await store().writeBackfill(null);
    await service().decide(
      ADMIN,
      { action: 'fields', fields: { ...ALL, phone: false, website: false }, withdraw: true },
      NOW,
    );
    expect((await store().consent()).withdrawnFields).toEqual(['website']);
    await service().decide(ADMIN, { action: 'fields', fields: ALL }, NOW);
    expect(await store().backfill()).toEqual({ fields: ['phone'], afterId: 0 });
  });

  it('PCB-016: a field withdrawn while its catch-up is under way leaves the catch-up', async () => {
    await agree();
    await store().writeBackfill({ fields: ['website', 'email'], afterId: 7 });
    await service().decide(ADMIN, { action: 'fields', fields: { ...ALL, website: false }, withdraw: true }, NOW);
    expect(await store().backfill()).toEqual({ fields: ['email'], afterId: 7 });

    await service().decide(
      ADMIN,
      { action: 'fields', fields: { ...ALL, website: false, email: false }, withdraw: true },
      NOW,
    );
    expect(await store().backfill()).toBeNull();
  });

  it('PCB-017: sending that stops being possible while a step reads its page queues nothing, and the catch-up waits', async () => {
    await placeWith();
    await agree();
    betweenReadAndWrite(async () => client.hasKey.mockReturnValue(false));
    expect(await backfill().step(NOW)).toBe(0);
    expect(await queued()).toEqual([]);
    expect(await store().backfill()).toEqual({
      fields: ['website', 'phone', 'email', 'opening_hours', 'description', 'image'],
      afterId: 0,
    });
  });

  it('PCB-018: the country comes from the address when the coordinates do not give one, as on a save', async () => {
    await placeWith({ lat: null, lng: null, address: 'Lange Straße 1, 18055 Rostock, Germany' });
    await agree();
    expect(await backfill().step(NOW)).toBe(1);
    expect((await findRows(orm(), PlaceContribOutbox, {})).map((row) => row.country)).toEqual(['DE']);
  });
});
