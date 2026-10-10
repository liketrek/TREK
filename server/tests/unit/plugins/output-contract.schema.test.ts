/**
 * The plugin output contract (protocol/output-contract.ts) against the real thing.
 *
 * Two questions, both answered on the migrated schema and the real domain services:
 *
 * - Does every column of a whole-row table have a decision? A migration that adds a
 *   column to `trips`, or to a child table such as `day_notes` or
 *   `reservation_endpoints`, fails here until the column is listed as published or
 *   withheld, which is the point: a new column no longer reaches plugins by default,
 *   and nobody forgets to decide.
 * - Does the contract drop anything a plugin received before it existed? Each entity
 *   method is called once directly on its handler and its result is put through the
 *   contract; the only keys allowed to disappear, at the top or in a nested child row,
 *   are the withheld credentials. A new key a read model starts carrying fails here
 *   the same way a new column does.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createPluginRpcHostParts } from '../../helpers/plugin-host';
import { sharedTestOrm } from '../../helpers/test-uow';
import { updateRows } from '../../helpers/factories/rows';
import { readTripDays } from '../../helpers/factories/trips';
import { tagPlace } from '../../helpers/factories/places';
import { Trips } from '../../../src/db/entities/Trips.entity';
import {
  addTripMember,
  createBudgetItem,
  createCollabNote,
  createDayAccommodation,
  createDayAssignment,
  createDayNote,
  createJourney,
  createJourneyEntry,
  createPackingItem,
  createPlace,
  createReservation,
  createTag,
  createTodoItem,
  createTrip,
  createUser,
  linkTripToJourney,
} from '../../helpers/factories';
import { createTestPluginRegistry } from '../../../src/nest-rpc/rpc-kit/testing';
import type { PluginRpcContext } from '../../../src/nest-rpc/rpc-kit/types';
import type { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { KNOWN_PERMISSIONS, type RpcResponse } from '../../../src/nest/plugins/protocol/envelope';
import {
  PLUGIN_ENTITY_CONTRACT,
  PLUGIN_ENTITY_NESTED,
  PLUGIN_METHOD_OUTPUT,
  shapePluginOutput,
  type PluginEntityContract,
  type PluginEntityName,
} from '../../../src/nest/plugins/protocol/output-contract';

const testDb = createSnapshotTestDb();
afterAll(() => testDb.close());

const ENTITIES = Object.keys(PLUGIN_ENTITY_CONTRACT) as PluginEntityName[];
const contractOf = (entity: PluginEntityName): PluginEntityContract => PLUGIN_ENTITY_CONTRACT[entity];
/** The entities read from a table; the envelopes (table null) have no columns to check. */
const TABLE_ENTITIES = ENTITIES.filter((e) => contractOf(e).table !== null);

const tableOf = (entity: PluginEntityName): string => {
  const table = contractOf(entity).table;
  if (table === null) throw new Error(`${entity} is an envelope, not a table`);
  return table;
};

const columnsOf = (table: string): string[] =>
  // test-sql-allow: the check is against the columns the migrated table has, which only PRAGMA table_info reports.
  (testDb.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((c) => c.name);

describe('the output contract against the migrated schema', () => {
  it.each(TABLE_ENTITIES)('OUTCONTRACT-SCHEMA-001 %s names only columns its table has', (entity) => {
    const contract = contractOf(entity);
    const columns = columnsOf(tableOf(entity));
    expect(columns.length).toBeGreaterThan(0);
    expect(contract.columns.filter((c) => !columns.includes(c))).toEqual([]);
    expect(contract.withheld.filter((c) => !columns.includes(c))).toEqual([]);
  });

  it.each(TABLE_ENTITIES.filter((e) => contractOf(e).wholeRow))(
    'OUTCONTRACT-SCHEMA-002 every column of %s is published or withheld',
    (entity) => {
      const contract = contractOf(entity);
      const decided = new Set([...contract.columns, ...contract.withheld]);
      // A failure names the new column: add it to `columns` to publish it to plugins,
      // or to `withheld` if it is a credential.
      expect(columnsOf(tableOf(entity)).filter((c) => !decided.has(c))).toEqual([]);
    },
  );
});

/**
 * `shaped` is `raw` put through the contract of `entity`: same keys in the same order
 * minus the withheld ones, the same values, and every nested child row held to its own
 * entity the same way.
 */
function expectOnlyWithheldDropped(entity: PluginEntityName, raw: unknown, shaped: unknown, where: string): void {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    expect(shaped, where).toBe(raw);
    return;
  }
  const rawRow = raw as Record<string, unknown>;
  const shapedRow = shaped as Record<string, unknown>;
  const withheld: readonly string[] = contractOf(entity).withheld;
  expect(Object.keys(shapedRow), where).toEqual(Object.keys(rawRow).filter((k) => !withheld.includes(k)));
  const nested: Readonly<Record<string, PluginEntityName>> = PLUGIN_ENTITY_NESTED[entity] ?? {};
  for (const key of Object.keys(shapedRow)) {
    const child = nested[key];
    const rawValue = rawRow[key];
    if (!child) {
      expect(shapedRow[key], `${where}.${key}`).toBe(rawValue);
    } else if (Array.isArray(rawValue)) {
      const shapedList = shapedRow[key] as unknown[];
      expect(shapedList).toHaveLength(rawValue.length);
      rawValue.forEach((item, i) => expectOnlyWithheldDropped(child, item, shapedList[i], `${where}.${key}[${i}]`));
    } else {
      expectOnlyWithheldDropped(child, rawValue, shapedRow[key], `${where}.${key}`);
    }
  }
}

describe('the output contract drops only the withheld fields', () => {
  let host: PluginRpcHost;
  let callHandler: (method: string, params: Record<string, unknown>) => Promise<unknown>;
  let ownerId: number;
  let memberId: number;
  let tripId: number;
  let dayIds: number[];
  let placeId: number;
  let journeyId: number;

  beforeAll(async () => {
    // Collab, journey, atlas, vacay and collections are addons; their methods refuse
    // while the addon is off.
    testDb.exec('UPDATE addons SET enabled = 1');
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    ownerId = owner.id;
    memberId = member.id;
    const trip = createTrip(testDb, owner.id, { start_date: '2026-05-01', end_date: '2026-05-03' });
    tripId = trip.id;
    addTripMember(testDb, trip.id, member.id);
    // A real credential in the row, so "withheld" is proven rather than vacuous.
    const orm = await sharedTestOrm(testDb);
    await updateRows(orm, Trips, { id: trip.id }, { feed_token: 'feed-secret' });
    dayIds = (await readTripDays(orm, trip.id)).map((d) => d.id);
    placeId = createPlace(testDb, trip.id).id;
    const tag = createTag(testDb, owner.id);
    await tagPlace(orm, placeId, [tag.id]);
    createDayAssignment(testDb, dayIds[0], placeId);
    createDayNote(testDb, dayIds[0], trip.id);
    createBudgetItem(testDb, trip.id);
    createPackingItem(testDb, trip.id);
    createReservation(testDb, trip.id, { day_id: dayIds[0] });
    createTodoItem(testDb, trip.id);
    createCollabNote(testDb, trip.id, owner.id);
    createDayAccommodation(testDb, trip.id, placeId, dayIds[0], dayIds[1]);
    journeyId = createJourney(testDb, owner.id).id;
    linkTripToJourney(testDb, journeyId, trip.id);
    createJourneyEntry(testDb, journeyId, owner.id, { title: 'Arrival' });

    const parts = await createPluginRpcHostParts(testDb);
    host = parts.factory.create('contract', new Set<string>(KNOWN_PERMISSIONS), {
      callPlugin: () => Promise.reject(new Error('no peer plugins here')),
      emitPluginEvent: () => Promise.reject(new Error('no peer plugins here')),
    });
    const listing = createTestPluginRegistry(parts.controllers).list();
    const ctx: PluginRpcContext = {
      pluginId: 'contract',
      actingUserId: owner.id,
      data: undefined as never,
      plugins: {
        call: () => Promise.reject(new Error('no peer plugins here')),
        emit: () => Promise.reject(new Error('no peer plugins here')),
      },
    };
    callHandler = async (method, params) => {
      const entry = listing.find((e) => e.name === method);
      const instance = parts.controllers.find((c) => c.constructor.name === entry?.className);
      if (!entry || !instance) throw new Error(`no handler for ${method}`);
      const handler = (instance as Record<string, (p: Record<string, unknown>, c: PluginRpcContext) => unknown>)[entry.methodName];
      return await handler.call(instance, params, ctx);
    };
  });

  /** Calls `method` on its handler and holds its result to the method's contract. */
  const callAndCheck = async (method: string, params: Record<string, unknown>): Promise<unknown> => {
    const raw = await callHandler(method, params);
    const output = PLUGIN_METHOD_OUTPUT[method as keyof typeof PLUGIN_METHOD_OUTPUT];
    if (output.kind !== 'entity') throw new Error(`${method} is not an entity method`);
    const shaped = shapePluginOutput(method, raw);
    if (output.many) {
      expect(Array.isArray(raw), method).toBe(true);
      const rawRows = raw as unknown[];
      expect(rawRows.length, method).toBeGreaterThan(0);
      rawRows.forEach((item, i) => expectOnlyWithheldDropped(output.entity, item, (shaped as unknown[])[i], `${method}[${i}]`));
    } else {
      expect(raw, method).toBeTruthy();
      expectOnlyWithheldDropped(output.entity, raw, shaped, method);
    }
    return raw;
  };

  const idOf = (value: unknown): number => (value as { id: number }).id;

  it('OUTCONTRACT-001 the writes return every field they returned before, minus credentials', async () => {
    await callAndCheck('trips.update', { tripId, input: { title: 'Renamed' } });
    await callAndCheck('trips.create', { input: { title: 'Another trip' } });
    const place = idOf(await callAndCheck('places.create', { tripId, input: { name: 'Museum', lat: 1, lng: 2 } }));
    await callAndCheck('places.update', { tripId, placeId: place, input: { name: 'Museum of Art' } });
    await callAndCheck('places.update', { tripId, placeId, input: { name: 'Tagged place' } });
    const day = idOf(await callAndCheck('days.create', { tripId, input: { notes: 'spare day' } }));
    await callAndCheck('days.update', { tripId, dayId: day, input: { title: 'Spare' } });
    await callAndCheck('days.update', { tripId, dayId: dayIds[0], input: { title: 'Arrival' } });
    await callAndCheck('days.create', { tripId, input: { dated: true } });
    await callAndCheck('itinerary.assign', { tripId, dayId: dayIds[1], placeId: place });
    const reservation = idOf(
      await callAndCheck('reservations.create', {
        tripId,
        input: {
          title: 'Flight',
          type: 'flight',
          endpoints: [
            { role: 'from', name: 'Frankfurt', code: 'FRA', lat: 50.03, lng: 8.56 },
            { role: 'to', name: 'Rome', code: 'FCO', lat: 41.8, lng: 12.25 },
          ],
        },
      }),
    );
    await callAndCheck('reservations.update', { tripId, reservationId: reservation, input: { title: 'Flight home' } });
    const accommodation = idOf(
      await callAndCheck('accommodations.create', {
        tripId,
        input: { place_id: placeId, start_day_id: dayIds[1], end_day_id: dayIds[2] },
      }),
    );
    await callAndCheck('accommodations.update', { tripId, accommodationId: accommodation, input: { notes: 'Late check-in' } });
    const bag = idOf(await callAndCheck('packing.createBag', { tripId, input: { name: 'Backpack' } }));
    await callAndCheck('packing.updateBag', { tripId, bagId: bag, input: { name: 'Big backpack' } });
    const item = idOf(await callAndCheck('packing.create', { tripId, input: { name: 'Socks' } }));
    await callAndCheck('packing.update', { tripId, itemId: item, input: { name: 'Wool socks' } });
    const content = Buffer.from('boarding pass').toString('base64');
    const file = idOf(
      await callAndCheck('files.create', { tripId, input: { name: 'pass.txt', content_base64: content, mimetype: 'text/plain' } }),
    );
    await callAndCheck('files.update', { tripId, fileId: file, input: { description: 'Boarding pass' } });
    await callAndCheck('files.createLink', { tripId, fileId: file, opts: { reservation_id: reservation } });
    const cost = idOf(await callAndCheck('costs.create', { tripId, input: { name: 'Dinner', total_price: 10 } }));
    await callAndCheck('costs.update', { tripId, itemId: cost, input: { name: 'Lunch' } });
    const note = idOf(await callAndCheck('daynotes.create', { tripId, dayId: dayIds[0], input: { text: 'Breakfast' } }));
    await callAndCheck('daynotes.update', { tripId, dayId: dayIds[0], noteId: note, input: { text: 'Late breakfast' } });
    const todo = idOf(await callAndCheck('todos.create', { tripId, input: { name: 'Book train' } }));
    await callAndCheck('todos.update', { tripId, todoId: todo, input: { name: 'Book the train' } });
    const tag = idOf(await callAndCheck('tags.create', { input: { name: 'Food' } }));
    await callAndCheck('tags.update', { tagId: tag, input: { name: 'Good food' } });
    await callAndCheck('collab.createNote', { tripId, input: { title: 'Ideas' } });
    const poll = idOf(await callAndCheck('collab.createPoll', { tripId, input: { question: 'Where?', options: ['Rome', 'Milan'] } }));
    await callAndCheck('collab.votePoll', { tripId, pollId: poll, optionIndex: 0 });
    const message = idOf(await callAndCheck('collab.createMessage', { tripId, text: 'Hello' }));
    await callAndCheck('collab.createMessage', { tripId, text: 'Reply', replyTo: message });
    await callAndCheck('journal.createJourney', { input: { title: 'Italy' } });
    const entry = idOf(await callAndCheck('journal.createEntry', { journeyId, input: { title: 'Day one', entry_date: '2026-05-01' } }));
    await callAndCheck('journal.updateEntry', { entryId: entry, input: { story: 'We arrived.' } });
    await callAndCheck('atlas.createBucketItem', { input: { name: 'Lisbon' } });
    const collection = idOf(await callAndCheck('collections.create', { input: { name: 'Rome' } }));
    await callAndCheck('collections.update', { id: collection, input: { name: 'Rome again' } });
  });

  it('OUTCONTRACT-002 the reads return every field they returned before, minus credentials', async () => {
    const collection = idOf(await callHandler('collections.create', { input: { name: 'Read me' } }));
    const reads: Array<[string, Record<string, unknown>]> = [
      ['trips.getById', { tripId }],
      ['trips.listMine', {}],
      ['trips.getPlaces', { tripId }],
      ['trips.getDays', { tripId }],
      ['trips.getReservations', { tripId }],
      ['trips.getAccommodations', { tripId }],
      ['reservations.listMine', {}],
      ['trips.members', { tripId }],
      ['users.getById', { id: memberId }],
      ['packing.list', { tripId }],
      ['packing.listBags', { tripId }],
      ['files.list', { tripId }],
      ['costs.getByTrip', { tripId }],
      ['costs.listMine', {}],
      ['daynotes.list', { tripId, dayId: dayIds[0] }],
      ['todos.list', { tripId }],
      ['tags.list', {}],
      ['categories.list', {}],
      ['collab.listNotes', { tripId }],
      ['collab.listPolls', { tripId }],
      ['collab.listMessages', { tripId }],
      ['journal.listMine', {}],
      ['journal.getEntries', { journeyId }],
      ['atlas.bucketList', {}],
      ['collections.listMine', {}],
      ['collections.get', { id: collection }],
      ['vacay.mine', {}],
    ];
    for (const [method, params] of reads) await callAndCheck(method, params);
  });

  it('OUTCONTRACT-004 the nested child rows are exercised, not vacuous', async () => {
    const days = (await callHandler('trips.getDays', { tripId })) as Array<{ notes_items: unknown[]; assignments: unknown[] }>;
    expect(days.some((d) => d.notes_items.length > 0)).toBe(true);
    expect(days.some((d) => d.assignments.length > 0)).toBe(true);
    const reservations = (await callHandler('trips.getReservations', { tripId })) as Array<{ endpoints: unknown[] }>;
    expect(reservations.some((r) => r.endpoints.length > 0)).toBe(true);
  });

  it('OUTCONTRACT-003 through the router, a trip never carries its feed token', async () => {
    const dispatch = async (method: string, params: Record<string, unknown>) => {
      const res = await host.dispatch({ k: 'req', id: 'x', method, params }, ownerId);
      expect(res.ok).toBe(true);
      return (res as RpcResponse).result;
    };
    const trip = (await dispatch('trips.getById', { tripId })) as Record<string, unknown>;
    expect(trip.id).toBe(tripId);
    expect('feed_token' in trip).toBe(false);
    const mine = (await dispatch('trips.listMine', {})) as Array<Record<string, unknown>>;
    expect(mine.length).toBeGreaterThan(0);
    for (const row of mine) {
      expect('feed_token' in row).toBe(false);
      expect(row).toHaveProperty('owner_username');
    }
  });
});
