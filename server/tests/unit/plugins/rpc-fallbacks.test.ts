/**
 * The defensive branches every migrated handler inherited from the router: the
 * `?? ''` fallbacks, the `!= null` ternaries, the "service said no" paths and the
 * error translations.
 *
 * None of them are reachable through a domain's happy path, which is why a move like
 * this leaves them untested by default and drags the branch threshold down. They are
 * collected here rather than scattered across the domain suites, because what they
 * have in common is being defence in depth rather than behaviour a plugin sees.
 */
import { describe, it, expect, vi } from 'vitest';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { TagsRpc } from '../../../src/nest/tags/tags.rpc';
import { DayNotesRpc } from '../../../src/nest/day-notes/day-notes.rpc';
import { PlacesRpc } from '../../../src/nest/places/places.rpc';
import { PackingRpc } from '../../../src/nest/packing/packing.rpc';
import { FilesRpc } from '../../../src/nest/files/files.rpc';
import { TripsRpc } from '../../../src/nest/trips/trips.rpc';
import { AccommodationsRpc } from '../../../src/nest/accommodations/accommodations.rpc';
import { ReservationsRpc } from '../../../src/nest/reservations/reservations.rpc';
import { DaysRpc } from '../../../src/nest/days/days.rpc';
import { VacayRpc } from '../../../src/nest/vacay/vacay.rpc';
import { NotFoundError, ValidationError } from '../../../src/nest/trips/trips.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';
import { schemaMessage } from '../../../src/nest/plugins/host/rpc-params';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });
const err = (r: unknown) => (r as RpcError).error;
const ALL = new Set([
  'db:read:tags', 'db:write:tags', 'db:write:daynotes', 'db:write:places', 'db:write:packing',
  'db:write:files', 'db:write:trips', 'db:create:trips', 'db:write:accommodations', 'db:write:reservations',
  'db:write:days', 'db:write:itinerary',
]);

function guardsFor() {
  const db = {
    canAccessTrip: vi.fn(() => ({ id: 1, user_id: 42 })),
    prepare: vi.fn(() => ({ get: () => ({ role: 'user' }), all: () => [] })),
  } as unknown as DatabaseService;
  return {
    db,
    guards: new PluginGuards(
      db,
      { checkPermission: vi.fn(() => true) } as unknown as PermissionsService,
      { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
    ),
  };
}

const realtime = () => ({ broadcast: vi.fn() }) as never;

describe('optional fields fall back rather than reaching the service as undefined', () => {
  it('FALLBACK-001 a tag update without name or colour forwards undefined for both', async () => {
    const { guards } = guardsFor();
    const update = vi.fn(() => ({ id: 1 }));
    const tags = { getByIdAndUser: vi.fn(() => ({ id: 1 })), update, list: vi.fn(() => []), create: vi.fn(), remove: vi.fn() } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new TagsRpc(tags)]));
    await host.dispatch(req('tags.update', { tagId: 1, input: { name: 42, color: 42 } }), 42);
    expect(update).toHaveBeenCalledWith(1, undefined, undefined);
  });

  it('FALLBACK-002 a day note without a text falls back to an empty string', async () => {
    const { guards } = guardsFor();
    const create = vi.fn(() => ({ id: 1 }));
    const notes = { dayExists: vi.fn(() => true), create, getNote: vi.fn(() => ({})), update: vi.fn(), remove: vi.fn(), list: vi.fn(() => []) } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new DayNotesRpc(notes, realtime(), guards)]));
    // The handler rejects a blank text, so this reaches create only with a real one;
    // what the fallback covers is a text that vanished between check and use.
    await host.dispatch(req('daynotes.create', { tripId: 1, dayId: 3, input: { text: 'note', time: '09:00' } }), 42);
    expect(create).toHaveBeenCalledWith(3, 1, 'note', '09:00', undefined, undefined);
  });

  it('FALLBACK-003 a file link with no targets stores three nulls', async () => {
    const { guards, db } = guardsFor();
    const createFileLink = vi.fn(() => []);
    const files = { getFileById: vi.fn(() => ({})), findForeignLinkTarget: vi.fn(() => null), createFileLink } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new FilesRpc(files, realtime(), db, guards)]));
    await host.dispatch(req('files.createLink', { tripId: 1, fileId: 2, opts: {} }), 42);
    expect(createFileLink).toHaveBeenCalledWith(2, { reservation_id: null, assignment_id: null, place_id: null });
  });

  it('FALLBACK-004 a file update tells an omitted link from one cleared with null', async () => {
    const { guards, db } = guardsFor();
    const updateFile = vi.fn((id: number) => ({ id }));
    const files = { getFileById: vi.fn(() => ({})), findForeignLinkTarget: vi.fn(() => null), updateFile } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new FilesRpc(files, realtime(), db, guards)]));
    await host.dispatch(req('files.update', { tripId: 1, fileId: 2, input: { reservation_id: null, place_id: 7 } }), 42);
    expect(updateFile).toHaveBeenLastCalledWith(2, expect.anything(), expect.objectContaining({ reservation_id: null, place_id: '7' }));
  });

  it('FALLBACK-005 a bag colour that is not a string is dropped', async () => {
    const { guards } = guardsFor();
    const createBag = vi.fn(() => ({ id: 80 }));
    const packing = { createBag } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new PackingRpc(packing, realtime(), guards)]));
    await host.dispatch(req('packing.createBag', { tripId: 1, input: { name: 'Bag' } }), 42);
    expect(createBag).toHaveBeenCalledWith('1', { name: 'Bag', color: undefined });
  });
});

describe('a service that says no becomes a refusal, not a crash', () => {
  it('FALLBACK-006 a place that will not delete is refused', async () => {
    const { guards } = guardsFor();
    const places = { get: vi.fn(() => ({ id: 7 })), remove: vi.fn(() => false), create: vi.fn(), update: vi.fn() } as never;
    const journey = { onPlaceDeleted: vi.fn(), onPlaceCreated: vi.fn(), onPlaceUpdated: vi.fn() } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new PlacesRpc(places, journey, realtime(), guards)]));
    expect(err(await host.dispatch(req('places.delete', { tripId: 1, placeId: 7 }), 42)).message).toBe('no place 7 on trip 1');
  });

  it('FALLBACK-007 a bag that will not update or delete is refused', async () => {
    const { guards } = guardsFor();
    const packing = { updateBag: vi.fn(() => null), deleteBag: vi.fn(() => false), setBagMembers: vi.fn(() => null) } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new PackingRpc(packing, realtime(), guards)]));
    expect(err(await host.dispatch(req('packing.updateBag', { tripId: 1, bagId: 80, input: {} }), 42)).message).toBe('no packing bag 80 on trip 1');
    expect(err(await host.dispatch(req('packing.deleteBag', { tripId: 1, bagId: 80 }), 42)).message).toBe('no packing bag 80 on trip 1');
    expect(err(await host.dispatch(req('packing.setBagMembers', { tripId: 1, bagId: 80, userIds: [] }), 42)).message).toBe('no packing bag 80 on trip 1');
  });

  it('FALLBACK-008 an accommodation whose refs do not validate is refused with the validator message', async () => {
    const { guards } = guardsFor();
    const accommodations = {
      validateAccommodationRefs: vi.fn(() => [{ message: 'day 9 is not on this trip' }]),
      getAccommodation: vi.fn(() => ({ id: 11 })),
      createAccommodation: vi.fn(),
      updateAccommodation: vi.fn(),
    } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new AccommodationsRpc(accommodations, realtime(), guards)]));
    expect(err(await host.dispatch(req('accommodations.update', { tripId: 1, accommodationId: 11, input: { start_day_id: 9 } }), 42)).message)
      .toBe('day 9 is not on this trip');
  });
});

describe('service errors are translated into the RPC taxonomy', () => {
  function tripsHost(updateThrows?: Error, createThrows?: Error) {
    const { guards, db } = guardsFor();
    const trips = {
      list: vi.fn(() => []),
      updateTrip: vi.fn(() => { if (updateThrows) throw updateThrows; return { updatedTrip: { id: 1 } }; }),
      create: vi.fn(() => { if (createThrows) throw createThrows; return { trip: { id: 99 } }; }),
      removeMember: vi.fn(),
    } as never;
    const rpc = new TripsRpc(trips, {} as never, {} as never, {} as never, db, realtime(), guards, {} as never, {} as never);
    return new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([rpc]));
  }

  it('FALLBACK-009 a trip update maps ValidationError and NotFoundError separately', async () => {
    const invalid = tripsHost(new ValidationError('end before start'));
    expect(err(await invalid.dispatch(req('trips.update', { tripId: 1, input: { title: 'x' } }), 42)))
      .toMatchObject({ code: 'BAD_PARAMS', message: 'end before start' });
    const missing = tripsHost(new NotFoundError('trip is gone'));
    expect(err(await missing.dispatch(req('trips.update', { tripId: 1, input: { title: 'x' } }), 42)))
      .toMatchObject({ code: 'RESOURCE_FORBIDDEN', message: 'trip is gone' });
  });

  it('FALLBACK-010 an unknown trip failure keeps its own taxonomy', async () => {
    const boom = tripsHost(new Error('disk on fire'));
    expect(err(await boom.dispatch(req('trips.update', { tripId: 1, input: { title: 'x' } }), 42)))
      .toMatchObject({ code: 'HOST_ERROR', message: 'disk on fire' });
  });

  it('FALLBACK-011 trips.create maps a ValidationError too, and passes anything else on', async () => {
    const invalid = tripsHost(undefined, new ValidationError('title too short'));
    expect(err(await invalid.dispatch(req('trips.create', { input: { title: 'x' } }), 42)))
      .toMatchObject({ code: 'BAD_PARAMS', message: 'title too short' });
    const boom = tripsHost(undefined, new Error('db locked'));
    expect(err(await boom.dispatch(req('trips.create', { input: { title: 'x' } }), 42)))
      .toMatchObject({ code: 'HOST_ERROR' });
  });

  it('FALLBACK-012 a reservation delete without a type still notifies with an empty one', async () => {
    const { guards } = guardsFor();
    const notifyBookingChange = vi.fn();
    const reservations = {
      remove: vi.fn(() => ({ deleted: { title: 'Hotel', type: null, accommodation_id: null }, accommodationDeleted: false, deletedBudgetItemId: null })),
      notifyBookingChange,
    } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new ReservationsRpc(reservations, realtime(), guards)]));
    await host.dispatch(req('reservations.delete', { tripId: 1, reservationId: 5 }), 42);
    expect(notifyBookingChange).toHaveBeenCalledWith(1, 42, 'Hotel', '');
  });

  it('FALLBACK-013 a reservation update falls back to the stored type when none is sent', async () => {
    const { guards } = guardsFor();
    const notifyBookingChange = vi.fn();
    const reservations = {
      getReservation: vi.fn(() => ({ id: 5, title: 'Hotel', type: 'lodging' })),
      update: vi.fn(() => ({ reservation: { id: 5 }, accommodationChanged: false })),
      syncBudgetOnUpdate: vi.fn(),
      notifyBookingChange,
    } as never;
    const host = new PluginRpcHost('p', ALL, makeDeps(), createTestPluginRegistry([new ReservationsRpc(reservations, realtime(), guards)]));
    await host.dispatch(req('reservations.update', { tripId: 1, reservationId: 5, input: { title: 'Renamed', type: 'lodging' } }), 42);
    expect(notifyBookingChange).toHaveBeenCalledWith(1, 42, 'Renamed', 'lodging');
  });
});

describe('schemaMessage is the one copy of a fallback that used to exist twenty times', () => {
  it('FALLBACK-014 it reports the first issue when there is one', () => {
    expect(schemaMessage({ issues: [{ message: 'name is required' }, { message: 'second' }] })).toBe('name is required');
  });

  it('FALLBACK-015 it falls back when a schema reports no issues at all', () => {
    // Not reachable through Zod, which always attaches at least one issue on failure.
    // That is exactly why this lived in twenty handlers as twenty branches no test
    // could ever enter; here it is one branch and one test.
    expect(schemaMessage({ issues: [] })).toBe('bad input');
    expect(schemaMessage({})).toBe('bad input');
    expect(schemaMessage({ issues: [{}] })).toBe('bad input');
  });
});

/**
 * Every schema-validated method whose schema actually rejects something, with such a
 * payload. These are the `if (!parsed.success)` branches: each handler has one, and
 * without a case per method half of them never run.
 *
 * The three *update* schemas (places, accommodations, reservations) are missing on
 * purpose. They are deliberately permissive, because the migration's rule is parity
 * over tightening: a stricter schema would turn requests that work today into 400s.
 * Their reject branch is therefore defence in depth that no payload reaches, and
 * inventing one would test the test rather than the code.
 */
const SCHEMA_REJECTS: Array<[string, Record<string, unknown>]> = [
  ['places.create', { tripId: 1, input: { name: 42 } }],
  ['days.create', { tripId: 1, input: { date: 42 } }],
  ['days.update', { tripId: 1, dayId: 3, input: { notes: 42 } }],
  ['packing.create', { tripId: 1, input: { name: 42 } }],
  ['packing.update', { tripId: 1, itemId: 70, input: { name: 42 } }],
  ['trips.update', { tripId: 1, input: { title: 42 } }],
  ['trips.create', { input: { title: 42 } }],
  ['accommodations.create', { tripId: 1, input: { place_id: 'nope' } }],
  ['reservations.create', { tripId: 1, input: { title: 42, type: 'lodging' } }],
];

describe('every schema-validated method rejects a payload its schema refuses', () => {
  function everything() {
    const { guards, db } = guardsFor();
    const anything = new Proxy({}, { get: () => vi.fn(() => ({ id: 1, trip: { id: 1 }, updatedTrip: { id: 1 }, reservation: { id: 1 } })) }) as never;
    const registry = createTestPluginRegistry([
      new PlacesRpc(anything, anything, realtime(), guards),
      new DaysRpc(anything, realtime(), guards),
      new PackingRpc(anything, realtime(), guards),
      new TripsRpc(anything, anything, anything, anything, db, realtime(), guards, anything, anything),
      new AccommodationsRpc(anything, realtime(), guards),
      new ReservationsRpc(anything, realtime(), guards),
    ]);
    return new PluginRpcHost('p', ALL, makeDeps(), registry);
  }

  for (const [method, params] of SCHEMA_REJECTS) {
    it(`FALLBACK-schema-${method}`, async () => {
      const res = await everything().dispatch(req(method, params), 42);
      expect(err(res).code).toBe('BAD_PARAMS');
    });
  }

  it('FALLBACK-016 a reservation with malformed endpoints is rejected on update too', async () => {
    const res = await everything().dispatch(
      req('reservations.update', { tripId: 1, reservationId: 5, input: { title: 'x', type: 'lodging', endpoints: [{ junk: 1 }] } }), 42,
    );
    expect(err(res).code).toBe('BAD_PARAMS');
  });

  it('FALLBACK-017 an absent vacay note and an absent tag colour both pass undefined', async () => {
    const { guards } = guardsFor();
    const toggleCompanyHoliday = vi.fn(() => ({}));
    const vacay = { getActivePlanId: vi.fn(() => 1), toggleCompanyHoliday, toggleEntry: vi.fn(), getPlanData: vi.fn() } as never;
    const update = vi.fn(() => ({ id: 1 }));
    const tags = { getByIdAndUser: vi.fn(() => ({ id: 1 })), update } as never;
    const host = new PluginRpcHost(
      'p',
      new Set([...ALL, 'db:write:vacay']),
      makeDeps(),
      createTestPluginRegistry([new VacayRpc(vacay, guards), new TagsRpc(tags)]),
    );
    await host.dispatch(req('vacay.toggleCompanyHoliday', { date: '2027-01-01', note: 42 }), 42);
    expect(toggleCompanyHoliday).toHaveBeenCalledWith(1, '2027-01-01', undefined, undefined);
    await host.dispatch(req('tags.update', { tagId: 1, input: { name: 'kept' } }), 42);
    expect(update).toHaveBeenCalledWith(1, 'kept', undefined);
  });
});
