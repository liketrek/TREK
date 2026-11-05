/**
 * PlaceOriginsService over the real tables on a migrated test db: a write
 * records an origin per changed field with the hash of its value, a cleared
 * value loses its row, an unchanged one keeps what it had, a value claimed as
 * typed that a provider handed out is the provider's, and only the user's
 * values go on to the contribution queue.
 *
 * Replaced: PlaceContribService, so what reaches the queue is read off a spy.
 */
import { PlaceDetailsCache } from '../../../../src/db/entities/PlaceDetailsCache.entity';
import { PlaceFieldOrigin } from '../../../../src/db/entities/PlaceFieldOrigin.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import { valueHash } from '../../../../src/nest/common/value-hash';
import { PlaceContribService } from '../../../../src/nest/place-contrib/place-contrib.service';
import { PlaceOriginsService } from '../../../../src/nest/places/place-origins.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { findRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
const contrib = { enqueue: vi.fn(async () => undefined) };
const GERS = 'gers:ceba0e62-172b-4343-bb3b-78b915a18383';

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [MikroOrmModule.forFeature([PlaceFieldOrigin])],
    providers: [PlaceOriginsService, { provide: PlaceContribService, useValue: contrib }],
  });
});

beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
});

afterAll(async () => {
  await t.close();
  db.close();
});

const service = () => t.get(PlaceOriginsService);
const orm = () => t.get(MikroORM);

async function place(overrides: Record<string, unknown> = {}): Promise<number> {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  return (await makePlace(orm(), trip.id, { osm_id: GERS, ...overrides })).id;
}

async function origins(placeId: number): Promise<Record<string, { origin: string; value_hash: string }>> {
  const rows = await findRows(orm(), PlaceFieldOrigin, { place: placeId });
  return Object.fromEntries(rows.map((row) => [row.field, { origin: row.origin, value_hash: row.value_hash }]));
}

describe('a new place', () => {
  it('POS-001: records the client origins, the hash of each value, and unknown for an unreported field', async () => {
    const id = await place({ website: 'https://cafe-luna.de/', phone: '+49 381 1', description: 'By the sea.' });
    await service().record(id, null, { kind: 'client', claims: { website: 'user', phone: 'trek' } });
    expect(await origins(id)).toEqual({
      website: { origin: 'user', value_hash: valueHash('https://cafe-luna.de/') },
      phone: { origin: 'trek', value_hash: valueHash('+49 381 1') },
      description: { origin: 'unknown', value_hash: valueHash('By the sea.') },
    });
    expect(contrib.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: id,
        osmId: GERS,
        name: 'Test Place',
        country: 'FR',
        values: [{ field: 'website', value: 'https://cafe-luna.de/' }],
        dropped: ['phone', 'description'],
      }),
    );
  });

  it('POS-002: a deciding path gives its origin to every value', async () => {
    const id = await place({ website: 'https://agent.example', image_url: '/uploads/places/a.jpg' });
    await service().record(id, null, { kind: 'fixed', origin: 'agent' });
    expect(Object.values(await origins(id)).map((row) => row.origin)).toEqual(['agent', 'agent']);
    expect(contrib.enqueue).toHaveBeenCalledWith(expect.objectContaining({ values: [] }));
  });

  it('POS-003: a typed value a provider handed out for the place is the provider', async () => {
    const id = await place({ website: 'cafe-luna.de' });
    await insertRow(orm(), PlaceDetailsCache, {
      place_id: GERS,
      lang: 'de',
      expanded: 0,
      payload_json: JSON.stringify({ website: 'https://cafe-luna.de' }),
      fetched_at: Date.now(),
    });
    await service().record(id, null, { kind: 'client', claims: { website: 'user' } });
    expect((await origins(id)).website?.origin).toBe('trek');
    expect(contrib.enqueue).toHaveBeenCalledWith(expect.objectContaining({ values: [], dropped: ['website'] }));
  });
});

describe('an update', () => {
  it('POS-010: only what moved gets an origin; a value from before the tracking stays without one', async () => {
    const id = await place({ website: 'https://old.example', phone: '+49 1' });
    const before = await service().valuesBefore(id);
    await updateRows(orm(), Places, { id }, { phone: '+49 2' });
    await service().record(id, before, { kind: 'client', claims: { website: 'user', phone: 'user' } });
    const rows = await origins(id);
    expect(rows.phone?.origin).toBe('user');
    expect(rows.website).toBeUndefined();
    expect(contrib.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ values: [{ field: 'phone', value: '+49 2' }], dropped: [] }),
    );
  });

  it('POS-011: a cleared value loses its origin and leaves the queue', async () => {
    const id = await place({ email: 'info@luna.de' });
    await service().record(id, null, { kind: 'client', claims: { email: 'user' } });
    const before = await service().valuesBefore(id);
    await updateRows(orm(), Places, { id }, { email: null });
    await service().record(id, before, { kind: 'client', claims: {} });
    expect(await origins(id)).toEqual({});
    expect(contrib.enqueue).toHaveBeenLastCalledWith(expect.objectContaining({ values: [], dropped: ['email'] }));
  });

  it('POS-012: a user value overwritten by the assistant is the agent', async () => {
    const id = await place({ website: 'https://mine.example' });
    await service().record(id, null, { kind: 'client', claims: { website: 'user' } });
    const before = await service().valuesBefore(id);
    await updateRows(orm(), Places, { id }, { website: 'https://agent.example' });
    await service().record(id, before, { kind: 'fixed', origin: 'agent' });
    expect((await origins(id)).website).toEqual({ origin: 'agent', value_hash: valueHash('https://agent.example') });
  });

  it('POS-015: a picture route records the picture only; a value another writer changed meanwhile keeps its origin', async () => {
    const id = await place({ website: 'https://mine.example' });
    await service().record(id, null, { kind: 'fixed', origin: 'agent' });
    const before = await service().valuesBefore(id);
    // The assistant changes the website while the picture uploads.
    await updateRows(orm(), Places, { id }, { website: 'https://agent.example', image_url: '/uploads/places/b.jpg' });
    await service().record(id, before, { kind: 'fixed', origin: 'user', field: 'image' });
    const rows = await origins(id);
    expect(rows.image).toEqual({ origin: 'user', value_hash: valueHash('/uploads/places/b.jpg') });
    expect(rows.website?.origin).toBe('agent');
    expect(contrib.enqueue).toHaveBeenLastCalledWith(
      expect.objectContaining({ values: [{ field: 'image', value: '/uploads/places/b.jpg' }], dropped: [] }),
    );
  });

  it('POS-013: nothing changed, nothing is recorded or queued', async () => {
    const id = await place({ website: 'https://same.example' });
    const before = await service().valuesBefore(id);
    await service().record(id, before, { kind: 'client', claims: { website: 'user' } });
    expect(await origins(id)).toEqual({});
    expect(contrib.enqueue).not.toHaveBeenCalled();
  });

  it('POS-014: a failure is logged, never raised into the write it follows', async () => {
    contrib.enqueue.mockRejectedValueOnce(new Error('queue down'));
    const id = await place({ website: 'https://x.example' });
    await expect(service().record(id, null, { kind: 'client', claims: { website: 'user' } })).resolves.toBeUndefined();
    expect(await service().valuesBefore('not-an-id')).toBeNull();
    await expect(service().record(999_999, null, { kind: 'fixed', origin: 'agent' })).resolves.toBeUndefined();
  });
});

describe('an import', () => {
  it('POS-020: records every value of the new places as the import, in one pass', async () => {
    const a = await place({ website: 'https://a.example' });
    const b = await place({ phone: '+1 2', description: 'Imported text' });
    await service().recordImported([a, b]);
    expect((await origins(a)).website?.origin).toBe('import');
    expect(Object.values(await origins(b)).map((row) => row.origin)).toEqual(['import', 'import']);
    expect(contrib.enqueue).not.toHaveBeenCalled();
    await expect(service().recordImported([])).resolves.toBeUndefined();
  });
});
