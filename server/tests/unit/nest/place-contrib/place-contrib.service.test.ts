/**
 * PlaceContribService over the real tables on a migrated test db: when an
 * installation may send at all, what the admin's decisions store and do to the
 * queue, what the admin state says, which place writes are queued, and the
 * withdrawal.
 *
 * Replaced: the client of the TREK Places API (no request leaves), the
 * deployment (a production instance with the index at the public address,
 * unless a case says otherwise) and the services identity config.
 */
import type { AppEnv } from '../../../../src/app-config';
import { PlaceContribLog } from '../../../../src/db/entities/PlaceContribLog.entity';
import { PlaceContribOutbox } from '../../../../src/db/entities/PlaceContribOutbox.entity';
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { servicesConfig } from '../../../../src/nest/app-config/tokens';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { PlaceContribSettings } from '../../../../src/nest/place-contrib/place-contrib-settings';
import { PlaceContribClient } from '../../../../src/nest/place-contrib/place-contrib.client';
import { OUTBOX_CAP } from '../../../../src/nest/place-contrib/place-contrib.constants';
import { PlaceContribModule } from '../../../../src/nest/place-contrib/place-contrib.module';
import { PlaceContribService } from '../../../../src/nest/place-contrib/place-contrib.service';
import type { ContribWrite } from '../../../../src/nest/place-contrib/place-contrib.types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { countRows, findRow, findRows, insertRow } from '../../../helpers/factories/rows';
import { readAppSetting, setAppSetting } from '../../../helpers/factories/settings';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { PLACE_CONTRIB_TERMS_VERSION, type PlaceContribFieldSwitches } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/** The deployment a case runs on: production with the index on, unless it changes something. */
const deployment = {
  production: true,
  demo: false,
  maps: {} as Partial<AppEnv['maps']>,
};

class DeploymentEnv extends RuntimeEnvService {
  override env(): AppEnv {
    const env = super.env();
    return { ...env, maps: { ...env.maps, trekPlacesEnabled: true, trekPlacesUrl: undefined, ...deployment.maps } };
  }

  override isProduction(): boolean {
    return deployment.production;
  }

  override isDemoMode(): boolean {
    return deployment.demo;
  }
}

const services = {
  mode: 'auto' as 'auto' | 'off',
  key: null,
  hosts: ['places.liketrek.com'],
  photonUrl: 'https://photon.liketrek.com',
  valhallaUrl: 'https://valhalla.liketrek.com',
};

const client = {
  hasKey: vi.fn(() => true),
  keyFingerprint: vi.fn(() => 'fp-1'),
  withdraw: vi.fn(async (): Promise<unknown> => ({
    kind: 'ok',
    body: { ok: true, withdrawn: { website: 3, phone: 0 } },
  })),
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
const ADMIN = 1;
const NOW = new Date('2026-10-30T12:00:00Z');

const db = createSnapshotTestDb();
let t: TestModule;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [PlaceContribModule],
    overrides: [
      { provide: RuntimeEnvService, useValue: new DeploymentEnv() },
      { provide: servicesConfig.KEY, useValue: services },
      { provide: PlaceContribClient, useValue: client },
    ],
  });
});

beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
  deployment.production = true;
  deployment.demo = false;
  deployment.maps = {};
  services.mode = 'auto';
  client.hasKey.mockReturnValue(true);
});

afterAll(async () => {
  await t.close();
  db.close();
});

const service = () => t.get(PlaceContribService);
const store = () => t.get(PlaceContribSettings);
const orm = () => t.get(MikroORM);

async function agree(fields: PlaceContribFieldSwitches = ALL): Promise<void> {
  await service().decide(ADMIN, { action: 'agree', termsVersion: PLACE_CONTRIB_TERMS_VERSION, fields }, NOW);
}

async function newPlace(): Promise<number> {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  return (await makePlace(orm(), trip.id, { osm_id: GERS })).id;
}

function write(placeId: number, overrides: Partial<ContribWrite> = {}): ContribWrite {
  return {
    placeId,
    osmId: GERS,
    name: 'Café Luna',
    lat: 54.08,
    lng: 12.13,
    country: 'DE',
    values: [{ field: 'website', value: 'cafe-luna.de' }],
    dropped: [],
    ...overrides,
  };
}

async function refusal(promise: Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

describe('eligibility', () => {
  it('PCS-001: a production instance with a key at the public index may send', () => {
    expect(store().eligibility()).toEqual({ eligible: true, reason: null });
  });

  it('PCS-002: names the first reason it may not, in order', () => {
    const reasons: Array<[() => void, string]> = [
      [() => client.hasKey.mockReturnValue(false), 'no_key'],
      [() => (services.mode = 'off'), 'services_off'],
      [() => (deployment.maps = { trekPlacesUrl: 'https://places.example.org/' }), 'custom_places_url'],
      [() => (deployment.maps = { ...deployment.maps, trekPlacesEnabled: false }), 'index_off'],
      [() => (deployment.demo = true), 'demo'],
      [() => (deployment.production = false), 'not_production'],
      [() => (deployment.maps = { ...deployment.maps, trekPlacesContribute: 'off' }), 'env_off'],
    ];
    for (const [apply, reason] of reasons) {
      apply();
      expect(store().eligibility(), reason).toEqual({ eligible: false, reason });
    }
  });

  it('PCS-003: the public address with a trailing slash is still the public address', () => {
    deployment.maps = { trekPlacesUrl: 'https://places.liketrek.com/' };
    expect(store().eligibility().eligible).toBe(true);
  });
});

describe('the admin state and the decisions', () => {
  it('PCS-010: undecided, the prompt shows with every field proposed, and nothing is active', async () => {
    const state = await service().state(ADMIN, NOW);
    expect(state).toMatchObject({
      termsVersion: PLACE_CONTRIB_TERMS_VERSION,
      ceiling: 'admin',
      eligible: true,
      ineligibleReason: null,
      showPrompt: true,
      snoozedUntil: null,
      active: false,
      consent: { enabled: false, fields: ALL, decision: null },
      queue: { size: 0, cap: OUTBOX_CAP, full: false },
      pauseReason: null,
      registrationOpen: true,
    });
  });

  it('PCS-011: "Not now" keeps the prompt away from this admin for two weeks, not from another', async () => {
    const state = await service().decide(ADMIN, { action: 'snooze' }, NOW);
    expect(state.showPrompt).toBe(false);
    expect(state.snoozedUntil).toBe('2026-11-13T12:00:00.000Z');
    expect((await service().state(2, NOW)).showPrompt).toBe(true);
    expect((await service().state(ADMIN, new Date('2026-11-14T00:00:00Z'))).showPrompt).toBe(true);
  });

  it('PCS-012: "Agree" stores the switches, the terms and who decided, and switches sending on', async () => {
    await agree({ ...ALL, email: false });
    const state = await service().state(ADMIN, NOW);
    expect(state).toMatchObject({ active: true, showPrompt: false });
    expect(state.consent).toEqual({
      enabled: true,
      fields: { ...ALL, email: false },
      termsVersion: PLACE_CONTRIB_TERMS_VERSION,
      decision: 'agreed',
      decidedBy: ADMIN,
      decidedAt: NOW.toISOString(),
      includesEarlier: true,
    });
    expect(await store().activeFields()).toEqual(['website', 'phone', 'opening_hours', 'description', 'image']);
  });

  it('PCS-013: a dialog built for other terms is refused with 409, and nothing is stored', async () => {
    const res = await refusal(
      service().decide(ADMIN, { action: 'agree', termsVersion: PLACE_CONTRIB_TERMS_VERSION + 1, fields: ALL }, NOW),
    );
    expect(res).toEqual({
      status: 409,
      body: {
        error: 'The contribution terms changed',
        reason: 'terms_outdated',
        termsVersion: PLACE_CONTRIB_TERMS_VERSION,
      },
    });
    expect(await readAppSetting(orm(), 'places_contribute')).toBeNull();
  });

  it('PCS-014: an agreement to no field at all is refused', async () => {
    const none = { website: false, phone: false, email: false, opening_hours: false, description: false, image: false };
    const res = await refusal(
      service().decide(ADMIN, { action: 'agree', termsVersion: PLACE_CONTRIB_TERMS_VERSION, fields: none }, NOW),
    );
    expect(res.status).toBe(400);
    expect(res.body.reason).toBe('no_field');
  });

  it('PCS-015: "No" is a decision for these terms: no prompt, nothing active, the queue empty', async () => {
    const placeId = await newPlace();
    await agree();
    await service().enqueue(write(placeId), NOW);
    const state = await service().decide(ADMIN, { action: 'decline', termsVersion: PLACE_CONTRIB_TERMS_VERSION }, NOW);
    expect(state).toMatchObject({
      showPrompt: false,
      active: false,
      consent: { decision: 'declined', enabled: false },
    });
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
  });

  it('PCS-016: switching a field off drops what waits for it and withdraws it when asked', async () => {
    const placeId = await newPlace();
    await agree();
    await service().enqueue(
      write(placeId, {
        values: [
          { field: 'website', value: 'cafe-luna.de' },
          { field: 'phone', value: '+49 381 1' },
        ],
      }),
      NOW,
    );
    await service().decide(ADMIN, { action: 'fields', fields: { ...ALL, phone: false }, withdraw: true }, NOW);
    expect((await findRows(orm(), PlaceContribOutbox, {})).map((row) => row.field)).toEqual(['website']);
    expect(client.withdraw).toHaveBeenCalledWith({ field: 'phone' });
    expect(await store().activeFields()).not.toContain('phone');
    expect((await store().consent()).withdrawnFields).toEqual(['phone']);
  });

  it('PCS-017: changing the switches needs a standing agreement', async () => {
    const res = await refusal(service().decide(ADMIN, { action: 'fields', fields: ALL }, NOW));
    expect(res.status).toBe(409);
    expect(res.body.reason).toBe('not_agreed');
  });

  it('PCS-018: the master switch off empties the queue and, when asked, withdraws everything', async () => {
    const placeId = await newPlace();
    await agree();
    await service().enqueue(write(placeId), NOW);
    const state = await service().decide(ADMIN, { action: 'off', withdraw: true }, NOW);
    expect(state).toMatchObject({ active: false, consent: { decision: 'off', enabled: false } });
    expect(client.withdraw).toHaveBeenCalledWith();
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
  });

  it('PCS-019: an ineligible installation shows no prompt, and says why', async () => {
    deployment.production = false;
    expect(await service().state(ADMIN, NOW)).toMatchObject({
      eligible: false,
      ineligibleReason: 'not_production',
      showPrompt: false,
      active: false,
    });
  });

  it('PCS-020: a refused key is a pause until there is another key', async () => {
    await agree();
    await store().pauseFor('key_invalid', null);
    expect((await service().state(ADMIN, NOW)).pauseReason).toBe('key_invalid');
    client.keyFingerprint.mockReturnValue('fp-2');
    expect((await service().state(ADMIN, NOW)).pauseReason).toBeNull();
    client.keyFingerprint.mockReturnValue('fp-1');
    await agree();
    expect(await readAppSetting(orm(), 'places_contribute_pause')).toBeNull();
  });

  it('PCS-021: the service asking to wait is a pause until the time it named', async () => {
    await agree();
    await store().pauseFor('not_accepting', new Date('2026-10-30T13:00:00Z'));
    expect((await service().state(ADMIN, NOW)).pauseReason).toBe('not_accepting');
    expect((await service().state(ADMIN, new Date('2026-10-30T13:01:00Z'))).pauseReason).toBeNull();
  });

  it('PCS-022: a broken stored decision reads as undecided and off', async () => {
    await setAppSetting(orm(), 'places_contribute', '{"enabled":"yes"}');
    expect((await service().state(ADMIN, NOW)).consent).toMatchObject({ enabled: false, decision: null });
    expect(await store().activeFields()).toEqual([]);
  });

  it('PCS-023: closed registration is reported, so the prompt can leave its warning out', async () => {
    await setAppSetting(orm(), 'allow_registration', 'false');
    expect((await service().state(ADMIN, NOW)).registrationOpen).toBe(false);
  });
});

describe('enqueue', () => {
  it('PCS-030: nothing is queued before an admin agreed, but values no longer the user own still leave', async () => {
    const placeId = await newPlace();
    await insertRow(orm(), PlaceContribOutbox, outboxRow(placeId, 'phone'));
    await service().enqueue(write(placeId, { dropped: ['phone'] }), NOW);
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
    expect(await countRows(orm(), PlaceContribLog)).toBe(0);
  });

  it('PCS-031: a user value of a keyed place is queued, normalized and due at once', async () => {
    const placeId = await newPlace();
    await agree();
    await service().enqueue(write(placeId), NOW);
    const row = await findRow(orm(), PlaceContribOutbox, { field: 'website' });
    expect(row).toMatchObject({
      contrib_key: GERS,
      value: 'https://cafe-luna.de',
      place_name: 'Café Luna',
      country: 'DE',
    });
    const due = Date.parse(`${row?.eligible_at.replace(' ', 'T')}Z`);
    expect(Math.abs(due - NOW.getTime())).toBeLessThan(1000);
  });

  it('PCS-032: the newest value replaces the queued one, attempts and all', async () => {
    const placeId = await newPlace();
    await agree();
    await insertRow(orm(), PlaceContribOutbox, { ...outboxRow(placeId, 'website'), attempts: 3 });
    await service().enqueue(write(placeId, { values: [{ field: 'website', value: 'https://new.example' }] }), NOW);
    const rows = await findRows(orm(), PlaceContribOutbox, {});
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ value: 'https://new.example', attempts: 0 });
  });

  it('PCS-033: a field switched off is not queued; a place without a key is logged as withheld', async () => {
    const placeId = await newPlace();
    await agree({ ...ALL, website: false });
    await service().enqueue(write(placeId), NOW);
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
    await agree();
    await service().enqueue(write(placeId, { osmId: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA' }), NOW);
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
    expect(await findRow(orm(), PlaceContribLog, {})).toMatchObject({
      contrib_key: '-',
      field: 'website',
      result: 'withheld',
      reason: 'no_contrib_key',
      day: '2026-10-30',
    });
  });

  it('PCS-034: a value the service would refuse stays home, and the log says why', async () => {
    const placeId = await newPlace();
    await agree();
    await service().enqueue(
      write(placeId, { values: [{ field: 'image', value: 'https://photos.example/a.jpg' }] }),
      NOW,
    );
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
    expect(await findRow(orm(), PlaceContribLog, {})).toMatchObject({
      result: 'withheld',
      reason: 'image_not_uploaded',
    });
  });

  it('PCS-035: an ineligible installation queues nothing even after an agreement', async () => {
    const placeId = await newPlace();
    await agree();
    deployment.demo = true;
    await service().enqueue(write(placeId), NOW);
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(0);
  });
});

describe('withdrawAll and the log', () => {
  it('PCS-040: a confirmed withdrawal empties the queue and logs what the service took back', async () => {
    const placeId = await newPlace();
    await agree();
    await service().enqueue(write(placeId), NOW);
    expect(await service().withdrawAll(NOW)).toEqual({ withdrawn: { website: 3, phone: 0 }, cleared: 1 });
    expect(await findRows(orm(), PlaceContribLog, {})).toEqual([
      expect.objectContaining({ contrib_key: '*', field: 'website', value_summary: '3', result: 'retracted' }),
    ]);
    expect((await service().state(ADMIN, NOW)).counts.retracted).toBe(1);
  });

  it('PCS-041: an unconfirmed withdrawal is a 502, and the queue stays', async () => {
    const placeId = await newPlace();
    await agree();
    await service().enqueue(write(placeId), NOW);
    client.withdraw.mockResolvedValueOnce({ kind: 'failed', reason: 'TimeoutError', retryAfterMs: null });
    const res = await refusal(service().withdrawAll(NOW));
    expect(res).toEqual({
      status: 502,
      body: { error: 'The TREK Places API did not confirm the withdrawal', reason: 'TimeoutError' },
    });
    expect(await countRows(orm(), PlaceContribOutbox)).toBe(1);
    expect((await store().consent()).withdrawnFields).toBeUndefined();
  });

  it('PCS-042: the log pages newest first and filters by result and field', async () => {
    const placeId = await newPlace();
    await agree();
    await service().enqueue(write(placeId, { osmId: null }), NOW);
    await service().enqueue(
      write(placeId, { osmId: null, values: [{ field: 'phone', value: '+49 1' }] }),
      new Date('2026-10-31T09:00:00Z'),
    );
    const all = await service().logPage({ page: 1, perPage: 1 });
    expect(all).toMatchObject({ total: 2, page: 1, perPage: 1 });
    expect(all.entries).toEqual([
      {
        id: expect.any(Number),
        day: '2026-10-31',
        key: '-',
        placeName: 'Café Luna',
        field: 'phone',
        valueSummary: '+49 1',
        result: 'withheld',
        reason: 'no_contrib_key',
      },
    ]);
    expect((await service().logPage({ page: 1, perPage: 50, field: 'website' })).total).toBe(1);
    expect((await service().logPage({ page: 1, perPage: 50, result: 'accepted' })).total).toBe(0);
    expect((await service().state(ADMIN, NOW)).counts.withheld).toBe(2);
  });

  it('PCS-043: a confirmed withdrawal keeps the agreement but marks every field withdrawn', async () => {
    await agree();
    await service().withdrawAll(NOW);
    expect(await store().consent()).toMatchObject({
      enabled: true,
      decision: 'agreed',
      includesEarlier: true,
      withdrawnFields: ['website', 'phone', 'email', 'opening_hours', 'description', 'image'],
    });
  });
});

function outboxRow(placeId: number, field: string) {
  return {
    contrib_key: GERS,
    field,
    value: 'x',
    place: placeId,
    place_name: 'Café Luna',
    cid: 'entry-cid-0001',
    eligible_at: '2026-10-30 12:05:00',
    next_attempt_at: '2026-10-30 12:05:00',
  };
}
