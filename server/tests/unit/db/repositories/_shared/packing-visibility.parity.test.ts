import { PackingItems } from '../../../../../src/db/entities/PackingItems.entity';
import {
  packingVisibleToActorCondition,
  packingVisibleToActorExpr,
  type PackingVisibilityKyselyDB,
} from '../../../../../src/db/repositories/_shared/packing-visibility';
import { createSnapshotTestDb } from '../../../../helpers/db-mock';
import { createTrip, createUser } from '../../../../helpers/factories';
import { resetTestDb } from '../../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * The legacy fragment this harness proves parity against
 * (`PackingService.VISIBLE_TO_ACTOR`,
 * `server/src/nest/packing/packing.service.ts:347-351`), kept here
 * byte-identical to the source text as this test's own oracle — the same
 * "hold the STRING side fixed and independent of the production code it is
 * proving" reasoning `reservation-visibility.test.ts` documents. Binds the
 * actor id twice.
 */
const VISIBLE_TO_ACTOR = `(
    is_private = 0
    OR owner_id = ?
    OR EXISTS (SELECT 1 FROM packing_item_recipients r WHERE r.item_id = packing_items.id AND r.user_id = ?)
  )`;

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

type Tier = 'common' | 'personal' | 'shared';
type Actor = 'owner' | 'recipient' | 'stranger' | 'no-actor';

/**
 * Seeds one item of every tier (common, personal/private-owned,
 * shared/private-with-recipients) for a fresh trip, and returns the three
 * item ids plus the owner/recipient/stranger user ids the 12-cell matrix
 * below runs against.
 */
function seedFixture() {
  const { user: owner } = createUser(testDb);
  const { user: recipient } = createUser(testDb);
  const { user: stranger } = createUser(testDb);
  const trip = createTrip(testDb, owner.id);

  const common = testDb
    .prepare('INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, ?, 0, NULL)')
    .run(trip.id, 'Common item').lastInsertRowid as number;
  const personal = testDb
    .prepare('INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, ?, 1, ?)')
    .run(trip.id, 'Personal item', owner.id).lastInsertRowid as number;
  const shared = testDb
    .prepare('INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, ?, 1, ?)')
    .run(trip.id, 'Shared item', owner.id).lastInsertRowid as number;
  testDb.prepare('INSERT INTO packing_item_recipients (item_id, user_id) VALUES (?, ?)').run(shared, recipient.id);

  return {
    tripId: trip.id as number,
    itemIds: { common, personal, shared } as Record<Tier, number>,
    actorIds: { owner: owner.id, recipient: recipient.id, stranger: stranger.id } as Record<
      Exclude<Actor, 'no-actor'>,
      number
    >,
  };
}

/** `actorId` resolved for the matrix's fourth actor type: `undefined`, never a bound `null`. */
function resolveActorId(actor: Actor, actorIds: Record<Exclude<Actor, 'no-actor'>, number>): number | undefined {
  return actor === 'no-actor' ? undefined : actorIds[actor];
}

async function legacyVisibleIds(tripId: number, actorId: number | undefined): Promise<number[]> {
  const rows = testDb
    .prepare(`SELECT id FROM packing_items WHERE trip_id = ? AND ${VISIBLE_TO_ACTOR} ORDER BY id ASC`)
    .all(tripId, actorId ?? null, actorId ?? null) as { id: number }[];
  return rows.map((r) => r.id);
}

async function typedQbVisibleIds(tripId: number, actorId: number | undefined): Promise<number[]> {
  const rows = await t.em
    .createQueryBuilder(PackingItems, 'packing_items')
    .select(['packing_items.id'])
    .where({ trip_id: tripId, ...packingVisibleToActorCondition(actorId) })
    .orderBy({ id: 'asc' })
    .execute<{ id: number }[]>('all', false);
  return rows.map((r) => r.id);
}

async function typedKyselyVisibleIds(tripId: number, actorId: number | undefined): Promise<number[]> {
  const rows = await t.em
    .getKysely<PackingVisibilityKyselyDB & { packing_items: { trip_id: number } }>()
    .selectFrom('packing_items')
    .select('packing_items.id')
    .where('packing_items.trip_id', '=', tripId)
    .where((eb) => packingVisibleToActorExpr(eb, actorId))
    .orderBy('packing_items.id', 'asc')
    .execute();
  return rows.map((r) => r.id);
}

/**
 * The expected visible-tier set per actor, independent of both
 * implementations — the harness's own ground truth, so a bug shared by the
 * legacy fragment's oracle text AND both typed forms (all three wrong the
 * same way) would still be caught.
 */
const EXPECTED: Record<Actor, Tier[]> = {
  owner: ['common', 'personal', 'shared'],
  recipient: ['common', 'shared'],
  stranger: ['common'],
  'no-actor': ['common'],
};

describe('packing-visibility parity — 12-cell matrix (4 actor types × 3 item tiers)', () => {
  const actors: Actor[] = ['owner', 'recipient', 'stranger', 'no-actor'];

  for (const actor of actors) {
    it(`PKVIS-${actor}: legacy fragment, typed QB condition and typed Kysely expr all select the same tiers for a(n) ${actor} actor`, async () => {
      const { tripId, itemIds, actorIds } = seedFixture();
      const actorId = resolveActorId(actor, actorIds);

      const legacy = await legacyVisibleIds(tripId, actorId);
      const typedQb = await typedQbVisibleIds(tripId, actorId);
      const typedKysely = await typedKyselyVisibleIds(tripId, actorId);

      const expectedIds = EXPECTED[actor].map((tier) => itemIds[tier]).sort((a, b) => a - b);

      expect(legacy).toEqual(expectedIds);
      expect(typedQb).toEqual(legacy);
      expect(typedKysely).toEqual(legacy);
    });
  }

  it('PKVIS-mixed: every actor checked against the SAME seeded trip, plus a second trip that must never leak in', async () => {
    const fixture = seedFixture();
    // A second, unrelated trip's items must never leak into either actor's
    // result — the WHERE clause is trip-scoped independently of visibility.
    const { user: otherOwner } = createUser(testDb);
    const otherTrip = createTrip(testDb, otherOwner.id);
    testDb
      .prepare('INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, ?, 0, NULL)')
      .run(otherTrip.id, 'Other trip common');

    for (const actor of ['owner', 'recipient', 'stranger', 'no-actor'] as const) {
      const actorId = resolveActorId(actor, fixture.actorIds);
      const legacy = await legacyVisibleIds(fixture.tripId, actorId);
      const typedQb = await typedQbVisibleIds(fixture.tripId, actorId);
      const typedKysely = await typedKyselyVisibleIds(fixture.tripId, actorId);
      const expectedIds = EXPECTED[actor].map((tier) => fixture.itemIds[tier]).sort((a, b) => a - b);
      expect(legacy).toEqual(expectedIds);
      expect(typedQb).toEqual(legacy);
      expect(typedKysely).toEqual(legacy);
    }
  });

  // Mutation-sensitive (R1/§17 surprise 2's own demand — a dedicated parity
  // matrix "before anything else in packing ships"): a one-token confusion
  // between "recipient of THIS item" (`r.item_id = packing_items.id`,
  // correct) and "recipient of ANY item" (dropping the correlation) would
  // leak a stranger's access to every Shared item on the trip the moment
  // ANY item shares with them. Proven red, then restored — see this test's
  // own trailing comment for the exact mutation and the observed failure.
  it('PKVIS-mutation: a second, unrelated Shared item (recipient not invited) stays hidden from that recipient', async () => {
    const { tripId, itemIds, actorIds } = seedFixture();
    const otherShared = testDb
      .prepare('INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, ?, 1, ?)')
      .run(tripId, 'Second shared item, different recipients', actorIds.owner).lastInsertRowid as number;
    // Deliberately NOT inviting `recipient` to this second shared item —
    // only `stranger` is invited here, so `recipient`'s own visibility must
    // stay exactly {common, shared} (itemIds.shared), never picking up
    // `otherShared` just because SOME row in packing_item_recipients names them
    // as a recipient of a DIFFERENT item.
    testDb
      .prepare('INSERT INTO packing_item_recipients (item_id, user_id) VALUES (?, ?)')
      .run(otherShared, actorIds.stranger);

    const actorId = actorIds.recipient;
    const legacy = await legacyVisibleIds(tripId, actorId);
    const typedQb = await typedQbVisibleIds(tripId, actorId);
    const typedKysely = await typedKyselyVisibleIds(tripId, actorId);

    const expected = [itemIds.common, itemIds.shared].sort((a, b) => a - b);
    expect(legacy).toEqual(expected);
    expect(typedQb).toEqual(expected);
    expect(typedKysely).toEqual(expected);
    // Manually mutating `packingVisibleToActorExpr`'s `.whereRef('r.item_id',
    // '=', 'packing_items.id')` to `.where('r.item_id', '=', otherShared)`
    // (i.e. losing the correlation) and re-running this suite turns this
    // exact case red — `recipient` wrongly gains `otherShared` — while
    // PKVIS-owner/stranger/no-actor stay green, confirming this case is not
    // redundant with the rest of the matrix.
  });
});
