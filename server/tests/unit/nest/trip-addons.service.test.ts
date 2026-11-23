/**
 * TripAddonsService: whether a trip addon applies to one trip, and the owner's
 * switch for it. Real in-memory SQLite over the container (the service comes
 * out of AddonsModule), the broadcasts recorded by the FakeRealtimeService.
 */
import { TripAddonOverrides } from '../../../src/db/entities/TripAddonOverrides.entity';
import { sessions, type McpSession } from '../../../src/mcp/sessionManager';
import { AddonsModule } from '../../../src/nest/addons/addons.module';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import {
  TRIP_ADDON_NOT_FOUND,
  TRIP_ADDON_OWNER_ONLY,
  TripAddonsService,
} from '../../../src/nest/addons/trip-addons.service';
import { DomainError } from '../../../src/nest/common/domain-error';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeAdmin, makeUser } from '../../helpers/factories/users';
import { oneByOne } from '../../helpers/one-by-one';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let svc: TripAddonsService;
let addons: AddonsService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [AddonsModule] });
  svc = t.get(TripAddonsService);
  addons = t.get(AddonsService);
});
beforeEach(() => {
  resetTestDb(db);
  t.realtime.reset();
});
afterAll(async () => {
  await t.close();
  db.close();
});

async function ownedTrip() {
  const { user: owner } = await makeUser(orm());
  const trip = await makeTrip(orm(), owner.id);
  return { owner, trip };
}

async function refusal(work: Promise<unknown>): Promise<DomainError> {
  const error = await work.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(DomainError);
  return error as DomainError;
}

describe('TripAddonsService: what applies to a trip', () => {
  it('TRIPADDON-SVC-001: without a choice the trip follows the instance switch', async () => {
    const { trip } = await ownedTrip();
    await setAddonEnabled(orm(), 'roadtrip', false);
    await setAddonEnabled(orm(), 'budget', true);
    expect(await addons.isEnabledForTrip(trip.id, 'roadtrip')).toBe(false);
    expect(await addons.isEnabledForTrip(trip.id, 'budget')).toBe(true);
  });

  it('TRIPADDON-SVC-002: the owner may switch an addon on although the instance has it off, and off although on', async () => {
    const { owner, trip } = await ownedTrip();
    await setAddonEnabled(orm(), 'roadtrip', false);
    await setAddonEnabled(orm(), 'budget', true);
    await svc.setTripOverride(trip.id, owner.id, 'roadtrip', true);
    await svc.setTripOverride(trip.id, owner.id, 'budget', false);
    expect(await addons.isEnabledForTrip(trip.id, 'roadtrip')).toBe(true);
    expect(await addons.isEnabledForTrip(trip.id, 'budget')).toBe(false);
  });

  it('TRIPADDON-SVC-003: a global addon and an unknown id answer with the instance switch alone', async () => {
    const { trip } = await ownedTrip();
    await setAddonEnabled(orm(), 'vacay', true);
    expect(await addons.isEnabledForTrip(trip.id, 'vacay')).toBe(true);
    expect(await addons.isEnabledForTrip(trip.id, 'no_such_addon')).toBe(false);
  });

  it('TRIPADDON-SVC-004: the list holds every trip addon in order, the legacy photo row and other types left out', async () => {
    const { owner, trip } = await ownedTrip();
    await svc.setTripOverride(trip.id, owner.id, 'budget', false);
    const list = await svc.effectiveTripAddons(trip.id);
    const ids = list.map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['packing', 'budget', 'documents', 'collab', 'roadtrip', 'tours']));
    expect(ids).not.toContain('memories');
    expect(ids).not.toContain('vacay');
    expect(ids).not.toContain('mcp');
    const budget = list.find((a) => a.id === 'budget');
    expect(budget).toMatchObject({ enabled: false, instanceEnabled: true, overridden: true });
    expect(typeof budget?.name).toBe('string');
    const packing = list.find((a) => a.id === 'packing');
    expect(packing).toMatchObject({ overridden: false });
    expect(packing?.enabled).toBe(packing?.instanceEnabled);
  });
});

describe('TripAddonsService: routes without a trip', () => {
  it('TRIPADDON-SVC-010: open while the instance has the addon on', async () => {
    const { owner } = await ownedTrip();
    await setAddonEnabled(orm(), 'tours', true);
    expect(await addons.isEnabledForUserAnywhere(owner.id, 'tours')).toBe(true);
  });

  it('TRIPADDON-SVC-011: off for the instance, open once a trip the user owns or belongs to switched it on', async () => {
    const { owner, trip } = await ownedTrip();
    const { user: member } = await makeUser(orm());
    const { user: stranger } = await makeUser(orm());
    await addTripMember(orm(), trip.id, member.id, owner.id);
    await setAddonEnabled(orm(), 'tours', false);
    expect(await addons.isEnabledForUserAnywhere(owner.id, 'tours')).toBe(false);

    await svc.setTripOverride(trip.id, owner.id, 'tours', true);
    expect(await addons.isEnabledForUserAnywhere(owner.id, 'tours')).toBe(true);
    expect(await addons.isEnabledForUserAnywhere(member.id, 'tours')).toBe(true);
    expect(await addons.isEnabledForUserAnywhere(stranger.id, 'tours')).toBe(false);
  });

  it('TRIPADDON-SVC-012: a global addon that is off and an unknown id stay closed', async () => {
    const { owner } = await ownedTrip();
    await setAddonEnabled(orm(), 'vacay', false);
    expect(await addons.isEnabledForUserAnywhere(owner.id, 'vacay')).toBe(false);
    expect(await addons.isEnabledForUserAnywhere(owner.id, 'no_such_addon')).toBe(false);
  });

  it('TRIPADDON-SVC-015: isEnabledAnywhere opens for any trip that switched the addon on, whoever owns it', async () => {
    const { owner, trip } = await ownedTrip();
    await setAddonEnabled(orm(), 'tours', false);
    expect(await addons.isEnabledAnywhere('tours')).toBe(false);
    await svc.setTripOverride(trip.id, owner.id, 'tours', true);
    expect(await addons.isEnabledAnywhere('tours')).toBe(true);
    await setAddonEnabled(orm(), 'vacay', false);
    expect(await addons.isEnabledAnywhere('vacay')).toBe(false);
    expect(await addons.isEnabledAnywhere('no_such_addon')).toBe(false);
    await setAddonEnabled(orm(), 'roadtrip', true);
    expect(await addons.isEnabledAnywhere('roadtrip')).toBe(true);
  });

  it('TRIPADDON-SVC-016: the feed offers wanderer to a user once a trip of theirs switched Tours on', async () => {
    const { owner, trip } = await ownedTrip();
    const { user: stranger } = await makeUser(orm());
    await setAddonEnabled(orm(), 'tours', false);
    await addons.updateToursWanderer(true);
    expect((await addons.list(owner.id)).toursWanderer).toBe(false);
    await svc.setTripOverride(trip.id, owner.id, 'tours', true);
    expect((await addons.list(owner.id)).toursWanderer).toBe(true);
    expect((await addons.list(stranger.id)).toursWanderer).toBe(false);
    expect((await addons.list()).toursWanderer).toBe(false);
  });

  it('TRIPADDON-SVC-013: tripsWithAddon keeps the trips the addon applies to, in their order, each as isEnabledForTrip says', async () => {
    const { owner, trip: off } = await ownedTrip();
    const on = await makeTrip(orm(), owner.id);
    const follows = await makeTrip(orm(), owner.id);
    const ids = [on.id, off.id, follows.id];
    await setAddonEnabled(orm(), 'tours', true);
    await svc.setTripOverride(off.id, owner.id, 'tours', false);
    expect(await addons.tripsWithAddon(ids, 'tours')).toEqual([on.id, follows.id]);

    await setAddonEnabled(orm(), 'tours', false);
    await svc.setTripOverride(on.id, owner.id, 'tours', true);
    expect(await addons.tripsWithAddon(ids, 'tours')).toEqual([on.id]);
    expect(await addons.tripsWithAddon([], 'tours')).toEqual([]);
  });

  it('TRIPADDON-SVC-014: tripsWithAddon answers a global addon with its instance switch and an unknown id with none', async () => {
    const { trip } = await ownedTrip();
    await setAddonEnabled(orm(), 'vacay', true);
    expect(await addons.tripsWithAddon([trip.id], 'vacay')).toEqual([trip.id]);
    await setAddonEnabled(orm(), 'vacay', false);
    expect(await addons.tripsWithAddon([trip.id], 'vacay')).toEqual([]);
    expect(await addons.tripsWithAddon([trip.id], 'no_such_addon')).toEqual([]);
  });
});

describe('TripAddonsService: the owner switch', () => {
  it('TRIPADDON-SVC-020: answers the whole list and broadcasts it to the trip, the saving tab left out', async () => {
    const { owner, trip } = await ownedTrip();
    const addons = await svc.setTripOverride(trip.id, owner.id, 'budget', false, 'sock-1');
    expect(addons.find((a) => a.id === 'budget')).toMatchObject({ enabled: false, overridden: true });
    expect(t.realtime.broadcastMock).toHaveBeenCalledTimes(1);
    expect(t.realtime.broadcastMock).toHaveBeenCalledWith(String(trip.id), 'tripAddons:changed', { addons }, 'sock-1');
  });

  it('TRIPADDON-SVC-021: null drops the choice, so the instance setting applies again', async () => {
    const { owner, trip } = await ownedTrip();
    await svc.setTripOverride(trip.id, owner.id, 'budget', false);
    const addons = await svc.setTripOverride(trip.id, owner.id, 'budget', null);
    expect(addons.find((a) => a.id === 'budget')).toMatchObject({ enabled: true, overridden: false });
    expect(await countRows(orm(), TripAddonOverrides, { trip: trip.id })).toBe(0);
  });

  it('TRIPADDON-SVC-022: a member and an admin who does not own the trip are refused, and nothing is written', async () => {
    const { owner, trip } = await ownedTrip();
    const { user: member } = await makeUser(orm());
    const { user: admin } = await makeAdmin(orm());
    await addTripMember(orm(), trip.id, member.id, owner.id);
    await addTripMember(orm(), trip.id, admin.id, owner.id);
    const refused = await oneByOne([member.id, admin.id], (userId) =>
      refusal(svc.setTripOverride(trip.id, userId, 'budget', false)),
    );
    for (const e of refused) {
      expect(e.getStatus()).toBe(403);
      expect(e.publicMessage).toBe(TRIP_ADDON_OWNER_ONLY);
    }
    expect(await countRows(orm(), TripAddonOverrides, { trip: trip.id })).toBe(0);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TRIPADDON-SVC-023: somebody who cannot see the trip gets a 404', async () => {
    const { trip } = await ownedTrip();
    const { user: stranger } = await makeUser(orm());
    const e = await refusal(svc.setTripOverride(trip.id, stranger.id, 'budget', false));
    expect(e.getStatus()).toBe(404);
    expect(e.publicMessage).toBe('Trip not found');
  });

  it('TRIPADDON-SVC-024: an id that names no trip addon is a 404 and writes nothing', async () => {
    const { owner, trip } = await ownedTrip();
    const unknown = await oneByOne(['vacay', 'memories', 'no_such_addon'], (addonId) =>
      refusal(svc.setTripOverride(trip.id, owner.id, addonId, true)),
    );
    for (const e of unknown) {
      expect(e.getStatus()).toBe(404);
      expect(e.publicMessage).toBe(TRIP_ADDON_NOT_FOUND);
    }
    expect(await countRows(orm(), TripAddonOverrides, { trip: trip.id })).toBe(0);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TRIPADDON-SVC-025: copyOverrides gives a copied trip the choices of its source', async () => {
    const { owner, trip } = await ownedTrip();
    const copy = await makeTrip(orm(), owner.id);
    await svc.setTripOverride(trip.id, owner.id, 'budget', false);
    await svc.copyOverrides(trip.id, copy.id);
    expect(await addons.isEnabledForTrip(copy.id, 'budget')).toBe(false);
  });
});

describe('TripAddonsService: open MCP sessions', () => {
  /** A live MCP session of `userId`, as the transport keeps it; `closed` says whether it was ended. */
  function liveSession(sid: string, userId: number) {
    const state = { closed: false };
    sessions.set(sid, {
      userId,
      server: { close: () => undefined },
      transport: { close: () => (state.closed = true) },
    } as unknown as McpSession);
    return state;
  }
  afterEach(() => sessions.clear());

  it('TRIPADDON-SVC-030: switching on an addon the instance has off ends the sessions of everyone on the trip', async () => {
    const { owner, trip } = await ownedTrip();
    const { user: member } = await makeUser(orm());
    const { user: stranger } = await makeUser(orm());
    await addTripMember(orm(), trip.id, member.id, owner.id);
    await setAddonEnabled(orm(), 'roadtrip', false);
    const own = liveSession('own', owner.id);
    const asMember = liveSession('member', member.id);
    const other = liveSession('other', stranger.id);

    await svc.setTripOverride(trip.id, owner.id, 'roadtrip', true);
    // Their tools were attached while Road trip was off everywhere for them; a new session offers them.
    expect([own.closed, asMember.closed, other.closed]).toEqual([true, true, false]);
    expect(sessions.has('other')).toBe(true);
  });

  it('TRIPADDON-SVC-031: switching off, or on while the instance has it on, leaves every session alone', async () => {
    const { owner, trip } = await ownedTrip();
    await setAddonEnabled(orm(), 'budget', true);
    const own = liveSession('own', owner.id);
    await svc.setTripOverride(trip.id, owner.id, 'budget', false);
    await svc.setTripOverride(trip.id, owner.id, 'budget', true);
    await setAddonEnabled(orm(), 'roadtrip', false);
    await svc.setTripOverride(trip.id, owner.id, 'roadtrip', false);
    expect(own.closed).toBe(false);
  });

  it('TRIPADDON-SVC-032: a member who joins a trip that switched on an addon the instance has off gets a new session', async () => {
    const { owner, trip } = await ownedTrip();
    const { user: joiner } = await makeUser(orm());
    await setAddonEnabled(orm(), 'roadtrip', false);
    const before = liveSession('before', joiner.id);
    await svc.reattachJoinedMember(trip.id, joiner.id);
    expect(before.closed).toBe(false);

    await svc.setTripOverride(trip.id, owner.id, 'roadtrip', true);
    const joined = liveSession('joined', joiner.id);
    await svc.reattachJoinedMember(trip.id, joiner.id);
    expect(joined.closed).toBe(true);
  });
});
