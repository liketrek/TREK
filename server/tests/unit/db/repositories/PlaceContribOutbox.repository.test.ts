/**
 * PlaceContribOutboxRepository: the values waiting to go to the TREK Places
 * API, one per place key and field, with the retry bookkeeping the sender uses
 * and the join that tells it whether a value is still what the user typed.
 */
import { PlaceContribOutbox } from '../../../../src/db/entities/PlaceContribOutbox.entity';
import { PlaceFieldOrigin } from '../../../../src/db/entities/PlaceFieldOrigin.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import type { PlaceContribOutboxRepository } from '../../../../src/db/repositories/PlaceContribOutbox.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPlace, createTrip, createUser } from '../../../helpers/factories';
import { countRows, findRow, insertRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let outbox: PlaceContribOutboxRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  outbox = t.repo(PlaceContribOutbox);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const PAST = '2026-10-29 10:00:00';
const NOW = '2026-10-30 10:00:00';
const LATER = '2026-10-31 10:00:00';

/** A place named Café Luna, with the shareable columns given (the factory sets only a few). */
async function aPlace(columns: Partial<Record<'website' | 'phone' | 'osm_id', string>> = {}): Promise<number> {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const { id } = createPlace(testDb, trip.id, { name: 'Café Luna' });
  if (Object.keys(columns).length > 0) await updateRows(t, Places, { id }, columns);
  return id;
}

async function queue(placeId: number, over: Partial<Parameters<PlaceContribOutboxRepository['upsertEntry']>[0]> = {}) {
  await outbox.upsertEntry({
    contrib_key: 'osm:node/1',
    field: 'website',
    value: 'https://cafe-luna.de',
    place_id: placeId,
    place_name: 'Café Luna',
    lat: 54.08,
    lng: 12.13,
    country: 'DE',
    cid: 'cid-website-0001',
    eligible_at: PAST,
    next_attempt_at: PAST,
    ...over,
  });
}

describe('PlaceContribOutboxRepository', () => {
  it('PCOUTREPO-001: a newer value for the same key and field replaces the queued one and starts its attempts over', async () => {
    const placeId = await aPlace();
    await queue(placeId);
    await outbox.scheduleRetry(await outbox.dueFor('osm:node/1', NOW), PAST);
    await queue(placeId, { value: 'https://luna.example', cid: 'cid-website-0002' });
    const rows = await outbox.dueFor('osm:node/1', NOW);
    expect(rows).toEqual([
      expect.objectContaining({ value: 'https://luna.example', cid: 'cid-website-0002', attempts: 0 }),
    ]);
    expect(await outbox.size()).toBe(1);
    expect(await outbox.hasEntry('osm:node/1', 'website')).toBe(true);
    expect(await outbox.hasEntry('osm:node/1', 'phone')).toBe(false);
  });

  it('PCOUTREPO-002: due keys come oldest first, only once due, at most the limit', async () => {
    const placeId = await aPlace();
    await queue(placeId, { contrib_key: 'osm:node/2', next_attempt_at: NOW });
    await queue(placeId, { contrib_key: 'osm:node/1', next_attempt_at: PAST });
    await queue(placeId, { contrib_key: 'osm:node/3', next_attempt_at: LATER });
    expect(await outbox.dueKeys(NOW, 10)).toEqual(['osm:node/1', 'osm:node/2']);
    expect(await outbox.dueKeys(NOW, 1)).toEqual(['osm:node/1']);
  });

  it('PCOUTREPO-003: retries count up and wait, a postponement only waits', async () => {
    const placeId = await aPlace();
    await queue(placeId);
    const [row] = await outbox.dueFor('osm:node/1', NOW);
    if (!row) throw new Error('the queued value is missing');
    await outbox.scheduleRetry([row], LATER);
    expect(await outbox.dueFor('osm:node/1', NOW)).toEqual([]);
    await outbox.postpone([row], PAST);
    const [again] = await outbox.dueFor('osm:node/1', NOW);
    expect(again).toEqual(expect.objectContaining({ attempts: 1 }));
    await outbox.scheduleRetry([], LATER);
    await outbox.postpone([], LATER);
    expect((await findRow(t, PlaceContribOutbox, { id: row.id }))?.next_attempt_at).toBe(PAST);
  });

  it('PCOUTREPO-004: values queued before a time come in id order, at most the limit', async () => {
    const placeId = await aPlace();
    await insertRow(t, PlaceContribOutbox, {
      contrib_key: 'osm:node/1',
      field: 'phone',
      value: '+49 381 1',
      place: placeId,
      place_name: 'Café Luna',
      cid: 'cid-phone-0001',
      eligible_at: PAST,
      next_attempt_at: PAST,
      created_at: '2026-01-01 00:00:00',
    });
    await queue(placeId);
    expect(await outbox.queuedBefore('2026-06-01 00:00:00', 10)).toEqual([expect.objectContaining({ field: 'phone' })]);
    expect(await outbox.queuedBefore(LATER, 1)).toHaveLength(1);
  });

  it('PCOUTREPO-005: deletes by place and field, by field, by id and all, and an empty list deletes nothing', async () => {
    const one = await aPlace();
    const two = await aPlace();
    await queue(one, { contrib_key: 'osm:node/1', field: 'website' });
    await queue(one, { contrib_key: 'osm:node/1', field: 'phone', value: '+49 381 1' });
    await queue(two, { contrib_key: 'osm:node/2', field: 'website' });
    await queue(two, { contrib_key: 'osm:node/2', field: 'email', value: 'hi@luna.de' });

    expect(await outbox.deleteForPlace(one, [])).toBe(0);
    expect(await outbox.deleteFields([])).toBe(0);
    expect(await outbox.deleteSent([])).toBe(0);

    expect(await outbox.deleteForPlace(one, ['phone'])).toBe(1);
    expect(await outbox.deleteFields(['email'])).toBe(1);
    expect(await outbox.deleteSent(await outbox.dueFor('osm:node/2', NOW))).toBe(1);
    expect(await outbox.deleteAll()).toBe(1);
    expect(await countRows(t, PlaceContribOutbox)).toBe(0);
  });

  it("PCOUTREPO-006: the current state joins the place's values and the field's origin, none where it has none", async () => {
    const placeId = await aPlace({ website: 'https://cafe-luna.de', phone: '+49 381 1' });
    await insertRow(t, PlaceFieldOrigin, { place: placeId, field: 'website', origin: 'user', value_hash: 'h1' });
    await queue(placeId, { field: 'website' });
    await queue(placeId, { field: 'phone', value: '+49 381 1' });
    const ids = (await outbox.dueFor('osm:node/1', NOW)).map((row) => row.id);
    expect(await outbox.currentOf([])).toEqual([]);
    const current = await outbox.currentOf(ids);
    expect(current).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'website',
          origin: 'user',
          value_hash: 'h1',
          website: 'https://cafe-luna.de',
        }),
        expect.objectContaining({ field: 'phone', origin: null, value_hash: null, phone: '+49 381 1' }),
      ]),
    );
  });

  it('PCOUTREPO-007: a value replaced after the sender read it is neither deleted nor charged nor postponed', async () => {
    const placeId = await aPlace();
    await queue(placeId);
    const read = await outbox.dueFor('osm:node/1', NOW);
    await queue(placeId, { value: 'https://luna.example', cid: 'cid-website-0002' });

    await outbox.scheduleRetry(read, LATER);
    await outbox.postpone(read, LATER);
    expect(await outbox.deleteSent(read)).toBe(0);

    expect(await outbox.dueFor('osm:node/1', NOW)).toEqual([
      expect.objectContaining({ value: 'https://luna.example', cid: 'cid-website-0002', attempts: 0 }),
    ]);
  });

  it('PCOUTREPO-008: a replaced value counts its age from the replacement, not from the value it replaced', async () => {
    const placeId = await aPlace();
    await insertRow(t, PlaceContribOutbox, {
      contrib_key: 'osm:node/1',
      field: 'website',
      value: 'https://cafe-luna.de',
      place: placeId,
      place_name: 'Café Luna',
      cid: 'cid-website-0001',
      eligible_at: PAST,
      next_attempt_at: PAST,
      created_at: '2026-01-01 00:00:00',
    });
    expect(await outbox.queuedBefore('2026-06-01 00:00:00', 10)).toHaveLength(1);
    await queue(placeId, { value: 'https://luna.example', cid: 'cid-website-0002' });
    expect(await outbox.queuedBefore('2026-06-01 00:00:00', 10)).toEqual([]);
  });

  it('PCOUTREPO-009: pages through the places with typed values of the fields asked for, by id, with their origins', async () => {
    const one = await aPlace({ website: 'https://one.example', osm_id: 'node/1' });
    const provider = await aPlace({ website: 'https://two.example' });
    const three = await aPlace({ phone: '+49 381 3' });
    const four = await aPlace({ website: 'https://four.example' });
    const origin = (place: number, field: string, kind: string, hash: string) =>
      insertRow(t, PlaceFieldOrigin, { place, field, origin: kind, value_hash: hash });
    await origin(one, 'website', 'user', 'h1');
    await origin(one, 'phone', 'trek', 'h2');
    await origin(provider, 'website', 'trek', 'h3');
    await origin(three, 'phone', 'user', 'h4');
    await origin(four, 'website', 'user', 'h5');

    expect(await outbox.typedAfter(0, [], 10)).toEqual([]);
    const page = await outbox.typedAfter(0, ['website', 'phone'], 2);
    expect(page.map((row) => row.place.id)).toEqual([one, three]);
    expect(page[0]).toEqual({
      place: expect.objectContaining({ id: one, website: 'https://one.example', osm_id: 'node/1' }),
      typed: [{ field: 'website', value_hash: 'h1' }],
    });
    expect((await outbox.typedAfter(three, ['website', 'phone'], 2)).map((row) => row.place.id)).toEqual([four]);
    expect(await outbox.typedAfter(four, ['website', 'phone'], 2)).toEqual([]);
    expect((await outbox.typedAfter(0, ['phone'], 10)).map((row) => row.place.id)).toEqual([three]);
  });
});
