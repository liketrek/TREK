/**
 * The refusal paths of the five addon-gated domains: no bound user, invalid input,
 * and the service saying no.
 *
 * The happy paths and the addon gates live in addon-gates.rpc.test.ts and the domain
 * suites; this file is about what happens when something is wrong, because those are
 * the branches a move like this leaves untested by default.
 */
import { describe, it, expect, vi } from 'vitest';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { CollabRpc } from '../../../src/nest/collab/collab.rpc';
import { AtlasRpc } from '../../../src/nest/atlas/atlas.rpc';
import { BucketItemExistsError } from '../../../src/nest/atlas/atlas.service';
import { VacayRpc } from '../../../src/nest/vacay/vacay.rpc';
import { JournalRpc } from '../../../src/nest/journey/journal.rpc';
import { CollectionsRpc } from '../../../src/nest/collections/collections.rpc';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });
const err = (r: unknown) => (r as RpcError).error;

/** A status-tagged error, the shape CollectionsService throws. */
function statusError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function build(overrides: {
  collab?: Record<string, unknown>;
  atlas?: Record<string, unknown>;
  vacay?: Record<string, unknown>;
  journey?: Record<string, unknown>;
  collections?: Record<string, unknown>;
} = {}) {
  const db = {
    canAccessTrip: vi.fn(() => ({ id: 1, user_id: 42 })),
    prepare: vi.fn(() => ({ get: () => ({ role: 'user' }), all: () => [] })),
  } as unknown as DatabaseService;
  const guards = new PluginGuards(
    db,
    { checkPermission: vi.fn(() => true) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
  );
  const realtime = { broadcast: vi.fn() } as never;
  const registry = createTestPluginRegistry([
    new CollabRpc({ createNote: vi.fn(() => ({})), createPoll: vi.fn(() => ({})), votePoll: vi.fn(() => ({ error: null, poll: {} })), createMessage: vi.fn(() => ({ error: null, message: {} })), listNotes: vi.fn(() => []), listPolls: vi.fn(() => []), listMessages: vi.fn(() => []), ...overrides.collab } as never, realtime, guards),
    new AtlasRpc({ listVisitedCountries: vi.fn(() => []), listManuallyVisitedRegions: vi.fn(() => []), bucketList: vi.fn(() => []), markCountry: vi.fn(), unmarkCountry: vi.fn(), markRegion: vi.fn(), unmarkRegion: vi.fn(), createBucketItem: vi.fn(() => ({})), deleteBucketItem: vi.fn(() => true), ...overrides.atlas } as never, guards),
    new VacayRpc({ getPlanData: vi.fn(() => ({})), getActivePlanId: vi.fn(() => 1), toggleEntry: vi.fn(() => ({})), toggleCompanyHoliday: vi.fn(() => ({})), ...overrides.vacay } as never, guards),
    new JournalRpc({ listJourneys: vi.fn(() => []), listEntries: vi.fn(() => []), createEntry: vi.fn(() => ({})), updateEntry: vi.fn(() => ({})), deleteEntry: vi.fn(() => true), createJourney: vi.fn(() => ({})), deleteJourney: vi.fn(() => true), ...overrides.journey } as never, guards),
    // deletePlace is async in production, so its double returns a promise: an
    // un-awaited call in the RPC handler would let a rejection sail past
    // mapCollectionError as an unhandled rejection while the handler still replied
    // {deleted: true}.
    new CollectionsRpc({ listCollections: vi.fn(() => []), getCollection: vi.fn(() => ({})), createCollection: vi.fn(() => ({})), updateCollection: vi.fn(() => ({})), savePlace: vi.fn(() => ({})), copyToTrip: vi.fn(() => ({})), deletePlace: vi.fn(() => Promise.resolve(undefined)), ...overrides.collections } as never, guards),
  ]);
  const granted = new Set([
    'db:read:collab', 'db:write:collab', 'db:read:journal', 'db:write:journal',
    'db:read:atlas', 'db:write:atlas', 'db:read:vacay', 'db:write:vacay',
    'db:read:collections', 'db:write:collections',
  ]);
  return new PluginRpcHost('p', granted, makeDeps(), registry);
}

/** Every user-scoped method, with the refusal it owes a job or onLoad. */
const USERLESS: Array<[string, Record<string, unknown>, string]> = [
  ['journal.listMine', {}, 'journal reads require an authenticated user context'],
  ['journal.getEntries', { journeyId: 7 }, 'journal reads require an authenticated user context'],
  ['journal.createEntry', { journeyId: 7, input: { entry_date: '2027-01-01' } }, 'journal writes require an authenticated user context'],
  ['journal.updateEntry', { entryId: 1, input: {} }, 'journal writes require an authenticated user context'],
  ['journal.deleteEntry', { entryId: 1 }, 'journal writes require an authenticated user context'],
  ['journal.createJourney', { input: { title: 'J' } }, 'journal writes require an authenticated user context'],
  ['journal.deleteJourney', { journeyId: 7 }, 'journal writes require an authenticated user context'],
  ['atlas.visited', {}, 'atlas reads require an authenticated user context'],
  ['atlas.bucketList', {}, 'atlas reads require an authenticated user context'],
  ['atlas.markCountry', { code: 'JP' }, 'atlas writes require an authenticated user context'],
  ['atlas.unmarkCountry', { code: 'JP' }, 'atlas writes require an authenticated user context'],
  ['atlas.markRegion', { regionCode: 'JP-13', countryCode: 'JP' }, 'atlas writes require an authenticated user context'],
  ['atlas.unmarkRegion', { regionCode: 'JP-13' }, 'atlas writes require an authenticated user context'],
  ['atlas.createBucketItem', { input: { name: 'K' } }, 'atlas writes require an authenticated user context'],
  ['atlas.deleteBucketItem', { itemId: 1 }, 'atlas writes require an authenticated user context'],
  ['vacay.mine', {}, 'vacay reads require an authenticated user context'],
  ['vacay.toggleEntry', { date: '2027-01-01' }, 'vacay writes require an authenticated user context'],
  ['vacay.toggleCompanyHoliday', { date: '2027-01-01' }, 'vacay writes require an authenticated user context'],
  ['collections.listMine', {}, 'collection reads require an authenticated user context'],
  ['collections.get', { id: 1 }, 'collection reads require an authenticated user context'],
  ['collections.create', { input: { name: 'C' } }, 'collection writes require an authenticated user context'],
  ['collections.update', { id: 1, input: { name: 'C' } }, 'collection writes require an authenticated user context'],
  ['collections.savePlace', { input: { collection_id: 1, name: 'P', lat: 1, lng: 2 } }, 'collection writes require an authenticated user context'],
  ['collections.copyToTrip', { input: { trip_id: 1, place_ids: [1] } }, 'collection writes require an authenticated user context'],
  ['collections.deletePlace', { placeId: 1 }, 'collection writes require an authenticated user context'],
  ['collab.createNote', { tripId: 1, input: { title: 'n' } }, 'collab note writes require an authenticated user context'],
  ['collab.createPoll', { tripId: 1, input: { question: 'q', options: ['a', 'b'] } }, 'collab poll writes require an authenticated user context'],
  ['collab.votePoll', { tripId: 1, pollId: 1, optionIndex: 0 }, 'collab poll writes require an authenticated user context'],
  ['collab.createMessage', { tripId: 1, text: 'hi' }, 'collab message writes require an authenticated user context'],
];

describe('addon-gated domains refuse a job or onLoad', () => {
  for (const [method, params, message] of USERLESS) {
    it(`ADDONERR-userless-${method}`, async () => {
      const res = await build().dispatch(req(method, params), undefined);
      expect(err(res).code).toBe('RESOURCE_FORBIDDEN');
      expect(err(res).message).toBe(message);
    });
  }
});

describe('addon-gated domains validate their input', () => {
  it('ADDONERR-001 collab refuses a blank note title, a thin poll and an oversized message', async () => {
    const host = build();
    expect(err(await host.dispatch(req('collab.createNote', { tripId: 1, input: { title: '  ' } }), 42)).message).toBe('note title is required');
    expect(err(await host.dispatch(req('collab.createPoll', { tripId: 1, input: { question: '  ', options: ['a', 'b'] } }), 42)).message).toBe('poll question is required');
    expect(err(await host.dispatch(req('collab.createPoll', { tripId: 1, input: { question: 'q', options: ['a'] } }), 42)).message).toBe('a poll needs at least two options');
    expect(err(await host.dispatch(req('collab.createMessage', { tripId: 1, text: 'x'.repeat(4001) }), 42)).message).toBe('message text is required (max 4000 chars)');
    expect(err(await host.dispatch(req('collab.createMessage', { tripId: 1, text: '  ' }), 42)).message).toBe('message text is required (max 4000 chars)');
  });

  it('ADDONERR-002 the collab service reports its own failures as BAD_PARAMS', async () => {
    const host = build({ collab: { votePoll: vi.fn(() => ({ error: 'poll is closed' })), createMessage: vi.fn(() => ({ error: 'reply target is gone' })) } });
    expect(err(await host.dispatch(req('collab.votePoll', { tripId: 1, pollId: 1, optionIndex: 0 }), 42))).toMatchObject({ code: 'BAD_PARAMS', message: 'poll is closed' });
    expect(err(await host.dispatch(req('collab.createMessage', { tripId: 1, text: 'hi' }), 42))).toMatchObject({ code: 'BAD_PARAMS', message: 'reply target is gone' });
  });

  it('ADDONERR-003 atlas rejects a code that is empty or too long', async () => {
    const host = build();
    expect(err(await host.dispatch(req('atlas.markCountry', { code: '' }), 42)).message).toBe('code must be a short code');
    expect(err(await host.dispatch(req('atlas.markCountry', { code: 'TOOLONGCODE' }), 42)).message).toBe('code must be a short code');
    expect(err(await host.dispatch(req('atlas.markRegion', { regionCode: 'JP-13', countryCode: '' }), 42)).message).toBe('countryCode must be a short code');
    expect(err(await host.dispatch(req('atlas.createBucketItem', { input: { name: ' ' } }), 42)).message).toBe('bucket item name is required');
  });

  it('ADDONERR-004 a missing bucket item is refused, naming it', async () => {
    const host = build({ atlas: { deleteBucketItem: vi.fn(() => false) } });
    expect(err(await host.dispatch(req('atlas.deleteBucketItem', { itemId: 404 }), 42)).message).toBe('no bucket item 404 for this user');
  });

  it('ADDONERR-004b a duplicate bucket item is the caller\'s mistake, not an internal error (#1898)', async () => {
    const host = build({
      atlas: { createBucketItem: vi.fn(() => { throw new BucketItemExistsError(); }) },
    });
    expect(err(await host.dispatch(req('atlas.createBucketItem', { input: { name: 'Kyoto' } }), 42)))
      .toMatchObject({ code: 'BAD_PARAMS', message: 'bucket item already exists' });
  });

  it('ADDONERR-005 vacay insists on an ISO date', async () => {
    const host = build();
    expect(err(await host.dispatch(req('vacay.toggleEntry', { date: '01.01.2027' }), 42)).message).toBe('date must be YYYY-MM-DD');
    expect(err(await host.dispatch(req('vacay.toggleCompanyHoliday', { date: 42 }), 42)).message).toBe('date must be YYYY-MM-DD');
  });

  it('ADDONERR-006 journal needs an entry_date and a journal title', async () => {
    const host = build();
    expect(err(await host.dispatch(req('journal.createEntry', { journeyId: 7, input: {} }), 42)).message).toBe('entry_date is required');
    expect(err(await host.dispatch(req('journal.createJourney', { input: { title: '  ' } }), 42)).message).toBe('journal title is required');
  });

  it('ADDONERR-007 an unreadable or uneditable journey is RESOURCE_FORBIDDEN', async () => {
    const host = build({
      journey: {
        listEntries: vi.fn(() => null),
        createEntry: vi.fn(() => null),
        updateEntry: vi.fn(() => null),
        deleteEntry: vi.fn(() => false),
        deleteJourney: vi.fn(() => false),
      },
    });
    expect(err(await host.dispatch(req('journal.getEntries', { journeyId: 7 }), 42)).message).toBe('no access to journey 7');
    expect(err(await host.dispatch(req('journal.createEntry', { journeyId: 7, input: { entry_date: '2027-01-01' } }), 42)).message).toBe('no editable journey 7 for this user');
    expect(err(await host.dispatch(req('journal.updateEntry', { entryId: 3, input: {} }), 42)).message).toBe('no editable journal entry 3 for this user');
    expect(err(await host.dispatch(req('journal.deleteEntry', { entryId: 3 }), 42)).message).toBe('no editable journal entry 3 for this user');
    expect(err(await host.dispatch(req('journal.deleteJourney', { journeyId: 7 }), 42)).message).toBe('no deletable journal 7 for this user');
  });

  it('ADDONERR-008 collections map the service status onto the RPC error taxonomy', async () => {
    // 403/404 become RESOURCE_FORBIDDEN, 400/409 become BAD_PARAMS. Without this the
    // plugin would see an opaque HOST_ERROR and could not tell the cases apart.
    const forbidden = build({ collections: { createCollection: vi.fn(() => { throw statusError(403, 'not your collection'); }) } });
    expect(err(await forbidden.dispatch(req('collections.create', { input: { name: 'C' } }), 42))).toMatchObject({ code: 'RESOURCE_FORBIDDEN', message: 'not your collection' });

    const missing = build({ collections: { updateCollection: vi.fn(() => { throw statusError(404, 'no such collection'); }) } });
    expect(err(await missing.dispatch(req('collections.update', { id: 1, input: { name: 'C' } }), 42))).toMatchObject({ code: 'RESOURCE_FORBIDDEN' });

    const conflict = build({ collections: { savePlace: vi.fn(() => { throw statusError(409, 'already saved'); }) } });
    expect(err(await conflict.dispatch(req('collections.savePlace', { input: { collection_id: 1, name: 'P', lat: 1, lng: 2 } }), 42))).toMatchObject({ code: 'BAD_PARAMS', message: 'already saved' });

    const badRequest = build({ collections: { copyToTrip: vi.fn(() => { throw statusError(400, 'nothing to copy'); }) } });
    expect(err(await badRequest.dispatch(req('collections.copyToTrip', { input: { trip_id: 1, place_ids: [1] } }), 42))).toMatchObject({ code: 'BAD_PARAMS' });
  });

  it('ADDONERR-009 an untagged collections failure stays a HOST_ERROR', async () => {
    // Only the known statuses are translated; anything else keeps its own taxonomy
    // rather than being dressed up as a permission problem.
    const host = build({ collections: { deletePlace: vi.fn(() => { throw new Error('disk on fire'); }) } });
    expect(err(await host.dispatch(req('collections.deletePlace', { placeId: 1 }), 42))).toMatchObject({ code: 'HOST_ERROR', message: 'disk on fire' });
  });

  it('ADDONERR-009b a refused collections delete is ForbiddenResource, not {deleted: true}', async () => {
    // deletePlace is async, so a status-tagged rejection has to be awaited before the
    // handler decides what to reply — an un-awaited call would let this rejection
    // become an unhandled promise rejection while the RPC still answered {deleted: true}.
    const host = build({ collections: { deletePlace: vi.fn(() => Promise.reject(statusError(403, 'not your collection'))) } });
    const res = await host.dispatch(req('collections.deletePlace', { placeId: 1 }), 42);
    expect(res.ok).toBe(false);
    expect(err(res)).toMatchObject({ code: 'RESOURCE_FORBIDDEN', message: 'not your collection' });
  });

  it('ADDONERR-010 collections reject a payload the shared schema refuses', async () => {
    const host = build();
    expect(err(await host.dispatch(req('collections.create', { input: {} }), 42)).code).toBe('BAD_PARAMS');
    expect(err(await host.dispatch(req('collections.update', { id: 1, input: { name: 42 } }), 42)).code).toBe('BAD_PARAMS');
    expect(err(await host.dispatch(req('collections.savePlace', { input: {} }), 42)).code).toBe('BAD_PARAMS');
    expect(err(await host.dispatch(req('collections.copyToTrip', { input: { trip_id: 1, place_ids: [] } }), 42)).code).toBe('BAD_PARAMS');
  });

  it('ADDONERR-010b an update or savePlace with only some fields still passes', async () => {
    const updateCollection = vi.fn(() => ({}));
    const host = build({ collections: { updateCollection } });
    await host.dispatch(req('collections.update', { id: 1, input: { description: 'only this' } }), 42);
    expect(updateCollection).toHaveBeenCalled();
  });

  it('ADDONERR-010c a journal entry update carries a non-object input through asPayload', async () => {
    const updateEntry = vi.fn(() => ({ id: 1 }));
    const host = build({ journey: { updateEntry } });
    // asPayload wraps a non-object in { value }, which is the published contract.
    await host.dispatch(req('journal.updateEntry', { entryId: 1, input: 'note' }), 42);
    expect(updateEntry).toHaveBeenCalledWith(1, 42, { value: 'note' });
  });

  it('ADDONERR-010d a company holiday without a note passes undefined, not an empty string', async () => {
    const toggleCompanyHoliday = vi.fn(() => ({}));
    const host = build({ vacay: { toggleCompanyHoliday } });
    await host.dispatch(req('vacay.toggleCompanyHoliday', { date: '2027-01-01' }), 42);
    expect(toggleCompanyHoliday).toHaveBeenCalledWith(1, '2027-01-01', undefined, undefined);
  });

  it('ADDONERR-010e a collab message without a replyTo passes null', async () => {
    const createMessage = vi.fn(() => ({ error: null, message: {} }));
    const host = build({ collab: { createMessage } });
    await host.dispatch(req('collab.createMessage', { tripId: 1, text: 'hi' }), 42);
    expect(createMessage).toHaveBeenCalledWith('1', 42, 'hi', null);
    await host.dispatch(req('collab.createMessage', { tripId: 1, text: 'hi', replyTo: 5 }), 42);
    expect(createMessage).toHaveBeenLastCalledWith('1', 42, 'hi', 5);
  });

  it('ADDONERR-010f listMessages passes the before cursor only when given', async () => {
    const listMessages = vi.fn(() => []);
    const host = build({ collab: { listMessages } });
    await host.dispatch(req('collab.listMessages', { tripId: 1 }), 42);
    expect(listMessages).toHaveBeenCalledWith(1, undefined);
    await host.dispatch(req('collab.listMessages', { tripId: 1, before: 9 }), 42);
    expect(listMessages).toHaveBeenLastCalledWith(1, 9);
  });

  it('ADDONERR-011 a region without a name falls back to its code', async () => {
    const markRegion = vi.fn();
    const host = build({ atlas: { markRegion } });
    await host.dispatch(req('atlas.markRegion', { regionCode: 'jp-13', countryCode: 'jp' }), 42);
    // Codes are upper-cased on the way in, and the name defaults to the code.
    expect(markRegion).toHaveBeenCalledWith(42, 'JP-13', 'jp-13', 'JP');
  });
});
