/**
 * The addon gates of the migrated plugin surface, checked as one table.
 *
 * These gates used to live inside the deps factory's closure rather than in the
 * router, which made them the single most likely thing to lose in the decorator
 * migration: a handler that calls its service directly still works, just without the
 * addon check, and neither the compiler nor the router tests would notice. The plan
 * calls it out as the most probable security regression of the whole rollout.
 *
 * So every addon-gated method gets the same two assertions: with the addon off it is
 * refused with that addon's message, and the underlying service is never touched.
 */
import { describe, it, expect, vi } from 'vitest';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { CollabRpc } from '../../../src/nest/collab/collab.rpc';
import { AtlasRpc } from '../../../src/nest/atlas/atlas.rpc';
import { VacayRpc } from '../../../src/nest/vacay/vacay.rpc';
import { JournalRpc } from '../../../src/nest/journey/journal.rpc';
import { CollectionsRpc } from '../../../src/nest/collections/collections.rpc';
import { CostsRpc } from '../../../src/nest/budget/costs.rpc';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

/** Records every service call, so "the service was never touched" is checkable. */
function spyService(calls: string[], name: string) {
  return new Proxy(
    {},
    {
      get: (_t, prop) => (...args: unknown[]) => {
        calls.push(`${name}.${String(prop)}`);
        // Shapes the handlers destructure on the happy path.
        if (prop === 'votePoll' || prop === 'createMessage') return { error: null, poll: {}, message: {} };
        if (prop === 'listEntries') return [];
        if (prop === 'getActivePlanId') return 1;
        // collections.deletePlace is async in production (it deletes a storage
        // object); a promise-returning double here pins the fix that awaits it —
        // an un-awaited call would leave an unhandled rejection unnoticed by every
        // assertion below.
        if (name === 'collections' && prop === 'deletePlace') return Promise.resolve(undefined);
        if (String(prop).startsWith('delete')) return true;
        if (String(prop).startsWith('list')) return [];
        return { id: 1 };
      },
    },
  ) as never;
}

/** Everything granted, every trip accessible, every permission allowed, addons OFF. */
function build(addonOn: boolean) {
  const calls: string[] = [];
  const db = {
    canAccessTrip: vi.fn(() => ({ id: 1, user_id: 42 })),
    prepare: vi.fn(() => ({ get: () => ({ role: 'user' }), all: () => [] })),
  } as unknown as DatabaseService;
  const guards = new PluginGuards(
    db,
    { checkPermission: vi.fn(() => true) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => addonOn) } as unknown as AddonsService,
  );
  const registry = createTestPluginRegistry([
    new CollabRpc(spyService(calls, 'collab'), { broadcast: vi.fn() } as never, guards),
    new AtlasRpc(spyService(calls, 'atlas'), guards),
    new VacayRpc(spyService(calls, 'vacay'), guards),
    // The photo method writes bytes, so its four extra deps need real shapes or the
    // addon-on half of the table would fail for a reason that is not the gate.
    new JournalRpc(spyService(calls, 'journey'), guards,
      { put: async () => undefined, delete: async () => undefined } as never,
      { get: () => '*' } as never,
      { schedule: () => undefined } as never,
      { prepare: () => ({ get: () => ({ email: 'u@example.test' }) }) } as never),
    new CollectionsRpc(spyService(calls, 'collections'), guards),
    new CostsRpc(spyService(calls, 'budget'), db, { broadcast: vi.fn() } as never, guards, spyService(calls, 'membership')),
  ]);
  const granted = new Set([
    'db:read:collab', 'db:write:collab', 'db:read:journal', 'db:write:journal',
    'db:read:atlas', 'db:write:atlas', 'db:read:vacay', 'db:write:vacay',
    'db:read:collections', 'db:write:collections', 'db:read:costs', 'db:write:costs',
  ]);
  return { calls, host: new PluginRpcHost('p', granted, makeDeps(), registry) };
}

/** Every addon-gated method with a payload that reaches its gate. */
const GATED: Array<[string, Record<string, unknown>, string]> = [
  ['collab.listNotes', { tripId: 1 }, 'collab'],
  ['collab.listPolls', { tripId: 1 }, 'collab'],
  ['collab.listMessages', { tripId: 1 }, 'collab'],
  ['collab.createNote', { tripId: 1, input: { title: 'n' } }, 'collab'],
  ['collab.createPoll', { tripId: 1, input: { question: 'q?', options: ['a', 'b'] } }, 'collab'],
  ['collab.votePoll', { tripId: 1, pollId: 1, optionIndex: 0 }, 'collab'],
  ['collab.createMessage', { tripId: 1, text: 'hi' }, 'collab'],
  ['journal.listMine', {}, 'journey'],
  ['journal.getEntries', { journeyId: 7 }, 'journey'],
  ['journal.createEntry', { journeyId: 7, input: { entry_date: '2027-01-01' } }, 'journey'],
  ['journal.updateEntry', { entryId: 1, input: {} }, 'journey'],
  ['journal.deleteEntry', { entryId: 1 }, 'journey'],
  ['journal.createJourney', { input: { title: 'J' } }, 'journey'],
  ['journal.addEntryPhoto', { entryId: 1, input: { name: 'a.jpg', content_base64: 'eA==' } }, 'journey'],
  ['journal.deleteJourney', { journeyId: 7 }, 'journey'],
  ['atlas.visited', {}, 'atlas'],
  ['atlas.bucketList', {}, 'atlas'],
  ['atlas.markCountry', { code: 'JP' }, 'atlas'],
  ['atlas.unmarkCountry', { code: 'JP' }, 'atlas'],
  ['atlas.markRegion', { regionCode: 'JP-13', countryCode: 'JP' }, 'atlas'],
  ['atlas.unmarkRegion', { regionCode: 'JP-13' }, 'atlas'],
  ['atlas.createBucketItem', { input: { name: 'Kyoto' } }, 'atlas'],
  ['atlas.deleteBucketItem', { itemId: 1 }, 'atlas'],
  ['vacay.mine', {}, 'vacay'],
  ['vacay.toggleEntry', { date: '2027-01-01' }, 'vacay'],
  ['vacay.toggleCompanyHoliday', { date: '2027-01-01' }, 'vacay'],
  ['collections.listMine', {}, 'collections'],
  ['collections.get', { id: 1 }, 'collections'],
  ['collections.create', { input: { name: 'C' } }, 'collections'],
  ['collections.update', { id: 1, input: { name: 'C' } }, 'collections'],
  ['collections.savePlace', { input: { collection_id: 1, name: 'P', lat: 1, lng: 2 } }, 'collections'],
  ['collections.copyToTrip', { input: { trip_id: 1, place_ids: [1] } }, 'collections'],
  ['collections.deletePlace', { placeId: 1 }, 'collections'],
  ['costs.getByTrip', { tripId: 1 }, 'costs'],
  ['costs.listMine', {}, 'costs'],
  ['costs.create', { tripId: 1, input: { name: 'H', price: 1 } }, 'costs'],
  ['costs.update', { tripId: 1, itemId: 1, input: { name: 'H' } }, 'costs'],
  ['costs.delete', { tripId: 1, itemId: 1 }, 'costs'],
];

describe('every addon-gated plugin method refuses when its addon is off', () => {
  for (const [method, params, addon] of GATED) {
    it(`ADDONGATE-${method} is refused with "the ${addon} addon is disabled"`, async () => {
      const f = build(false);
      const res = (await f.host.dispatch(req(method, params), 42)) as RpcError;
      expect(res.ok).toBe(false);
      expect(res.error.code).toBe('RESOURCE_FORBIDDEN');
      expect(res.error.message).toBe(`the ${addon} addon is disabled`);
      // The gate has to come before the service, not after it.
      expect(f.calls).toEqual([]);
    });
  }

  it('ADDONGATE-covers-every-gated-method', () => {
    // Guards the table itself: if a later PR adds an addon-gated method without a row
    // here, this number is the reminder.
    expect(GATED).toHaveLength(38);
  });

  it('ADDONGATE-the-same-calls-succeed-with-the-addon-on', async () => {
    const f = build(true);
    for (const [method, params] of GATED) {
      const res = await f.host.dispatch(req(method, params), 42);
      expect(res.ok, `${method} should pass with the addon on`).toBe(true);
    }
    expect(f.calls.length).toBeGreaterThan(0);
  });
});
