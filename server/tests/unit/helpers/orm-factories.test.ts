/**
 * The ORM test factories (tests/helpers/factories) replace the raw SQL
 * fixtures the suite seeds with, so every suite that converts onto them
 * trusts what they write. This pins that each one lands the row it promises,
 * with its defaults and overrides, against the real migrated schema, and that
 * the readers and the read-only-column guard behave as the README says.
 */
import { Addons } from '../../../src/db/entities/Addons.entity';
import { Categories } from '../../../src/db/entities/Categories.entity';
import { Days } from '../../../src/db/entities/Days.entity';
import { JourneyContributors } from '../../../src/db/entities/JourneyContributors.entity';
import { JourneyTrips } from '../../../src/db/entities/JourneyTrips.entity';
import { NotificationChannelPreferences } from '../../../src/db/entities/NotificationChannelPreferences.entity';
import { PackingBags } from '../../../src/db/entities/PackingBags.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { Tags } from '../../../src/db/entities/Tags.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { VisitedCountries } from '../../../src/db/entities/VisitedCountries.entity';
import { decryptMfaSecret } from '../../../src/nest/common/crypto/mfaCrypto';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeBucketListItem, markCountryVisited } from '../../helpers/factories/atlas';
import { addBudgetItemMember, makeBudgetItem } from '../../helpers/factories/budget';
import { makeCollabMessage, makeCollabNote } from '../../helpers/factories/collab';
import { addCollectionMember, makeCollection, makeCollectionPlace } from '../../helpers/factories/collections';
import { inContext } from '../../helpers/factories/context';
import { linkFile, makeTripFile } from '../../helpers/factories/files';
import { makeDayAssignment, makeDayNote } from '../../helpers/factories/itinerary';
import {
  addJourneyContributor,
  linkTripToJourney,
  makeJourney,
  makeJourneyEntry,
} from '../../helpers/factories/journeys';
import { disableNotificationPref, makeNotification } from '../../helpers/factories/notifications';
import { addPackingBagMembers, makePackingBag, makePackingItem } from '../../helpers/factories/packing';
import { addAlbumLink, addTripPhoto } from '../../helpers/factories/photos';
import { makeCategory, makePlace, makeTag, tagPlace } from '../../helpers/factories/places';
import { makePlugin, setPluginUserConfig } from '../../helpers/factories/plugins';
import { makeReservation, makeReservationEndpoint } from '../../helpers/factories/reservations';
import {
  countRows,
  createRow,
  deleteRows,
  findRow,
  findRows,
  insertRow,
  insertRowIgnoringConflict,
  updateRows,
} from '../../helpers/factories/rows';
import {
  readAppSetting,
  readUserSetting,
  setAddonEnabled,
  setAppSetting,
  setUserSetting,
} from '../../helpers/factories/settings';
import { makeTodoItem } from '../../helpers/factories/todos';
import { makeInviteToken, makeMcpToken, makeOauthClient } from '../../helpers/factories/tokens';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import {
  addTripMember,
  datesBetween,
  makeDay,
  makeShareToken,
  makeTrip,
  readTripDays,
} from '../../helpers/factories/trips';
import { KNOWN_MFA_SECRET, makeAdmin, makeUser, makeUserWithMfa, readUser } from '../../helpers/factories/users';
import { addVacayPlanMember, makeVacayEntry, makeVacayPlan } from '../../helpers/factories/vacay';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  orm.clear();
});
afterAll(async () => {
  await orm.close();
  testDb.close();
});

describe('ORM test factories: rows', () => {
  it('ORMF-001: createRow reads the row back with the database defaults filled in', async () => {
    const { user } = await makeUser(orm);
    const trip = await createRow(orm, Trips, { user: user.id, title: 'Defaults' });
    expect(trip).toMatchObject({ user_id: user.id, title: 'Defaults', currency: 'EUR', is_archived: 0 });
    expect(typeof trip.id).toBe('number');
  });

  it('ORMF-002: findRow, findRows, countRows, updateRows and deleteRows read and write what they say', async () => {
    const { user } = await makeUser(orm);
    await makeTrip(orm, user.id, { title: 'B' });
    await makeTrip(orm, user.id, { title: 'A' });

    expect(await countRows(orm, Trips, { user: user.id })).toBe(2);
    expect((await findRows(orm, Trips, { user: user.id }, { title: 'asc' })).map((t) => t.title)).toEqual(['A', 'B']);
    expect(await updateRows(orm, Trips, { title: 'A' }, { title: 'C' })).toBe(1);
    expect(await findRow(orm, Trips, { title: 'C' })).not.toBeNull();
    expect(await findRow(orm, Trips, { title: 'A' })).toBeNull();
    expect(await deleteRows(orm, Trips, { user: user.id })).toBe(2);
    expect(await countRows(orm, Trips)).toBe(0);
  });

  it('ORMF-003: refuses a read-only foreign-key twin and names the relation to write instead', async () => {
    const { user } = await makeUser(orm);
    await expect(insertRow(orm, Trips, { user: user.id, title: 'x', user_id: user.id })).rejects.toThrow(
      "Trips.user_id is read-only in the entity; write it through 'user'",
    );
    await expect(updateRows(orm, Trips, { user: user.id }, { user_id: user.id })).rejects.toThrow('read-only');
  });

  it('ORMF-004: insertRowIgnoringConflict leaves an existing row alone', async () => {
    const { user } = await makeUser(orm);
    await insertRowIgnoringConflict(orm, VisitedCountries, { user: user.id, country_code: 'FR', source: 'manual' });
    await insertRowIgnoringConflict(orm, VisitedCountries, { user: user.id, country_code: 'FR', source: 'trip' });
    expect(await findRows(orm, VisitedCountries, { user: user.id })).toEqual([
      expect.objectContaining({ country_code: 'FR', source: 'manual' }),
    ]);
  });

  it('ORMF-005: every step runs in a request context of its own, so nothing lingers in an identity map', async () => {
    const { user } = await makeUser(orm, { username: 'before' });
    await updateRows(orm, Users, { id: user.id }, { username: 'after' });
    expect((await readUser(orm, user.id)).username).toBe('after');
    await expect(inContext(orm, async (em) => em.getContext() !== orm.em)).resolves.toBe(true);
  });
});

describe('ORM test factories: users', () => {
  it('ORMF-010: makeUser stores a bcrypt hash of the password it returns, with unique defaults', async () => {
    const a = await makeUser(orm);
    const b = await makeUser(orm);
    expect(a.user.role).toBe('user');
    expect(a.user.email).not.toBe(b.user.email);
    expect(a.user.username).not.toBe(b.user.username);
    expect(bcrypt.compareSync(a.password, a.user.password_hash)).toBe(true);
  });

  it('ORMF-011: makeUser pins the id when asked, and makeAdmin makes an admin', async () => {
    const { user } = await makeUser(orm, { id: 4242, email: 'pinned@example.test' });
    expect(user).toMatchObject({ id: 4242, email: 'pinned@example.test', password_version: 0 });
    expect((await makeAdmin(orm)).user.role).toBe('admin');
  });

  it('ORMF-012: makeUserWithMfa turns MFA on with the known secret, encrypted', async () => {
    const { user, totpSecret } = await makeUserWithMfa(orm);
    expect(totpSecret).toBe(KNOWN_MFA_SECRET);
    expect(user.mfa_enabled).toBe(1);
    expect(user.mfa_secret).not.toBe(KNOWN_MFA_SECRET);
    expect(decryptMfaSecret(user.mfa_secret as string)).toBe(KNOWN_MFA_SECRET);
  });
});

describe('ORM test factories: trips and plans', () => {
  it('ORMF-020: makeTrip with both dates numbers one day per date, across a DST change too', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { start_date: '2026-03-28', end_date: '2026-03-30' });
    const days = await readTripDays(orm, trip.id);
    expect(days.map((d) => [d.day_number, d.date])).toEqual([
      [1, '2026-03-28'],
      [2, '2026-03-29'],
      [3, '2026-03-30'],
    ]);
    expect(datesBetween('2026-10-24', '2026-10-26')).toEqual(['2026-10-24', '2026-10-25', '2026-10-26']);
  });

  it('ORMF-021: makeTrip without dates has no days; makeDay appends the next number', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    expect(await countRows(orm, Days, { trip: trip.id })).toBe(0);
    expect((await makeDay(orm, trip.id)).day_number).toBe(1);
    expect((await makeDay(orm, trip.id, { title: 'Second' })).day_number).toBe(2);
    expect((await makeDay(orm, trip.id, { day_number: 7 })).day_number).toBe(7);
  });

  it('ORMF-022: addTripMember is idempotent and records who invited', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: guest } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);
    await addTripMember(orm, trip.id, guest.id, owner.id);
    await addTripMember(orm, trip.id, guest.id, owner.id);
    const members = await findRows(orm, TripMembers, { trip: trip.id });
    expect(members).toEqual([expect.objectContaining({ user_id: guest.id, invited_by: owner.id })]);
  });

  it('ORMF-023: makePlace files under the first category unless told otherwise; tagPlace links tags once', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const [first] = await findRows(orm, Categories, {}, { id: 'asc' });
    const place = await makePlace(orm, trip.id);
    expect(place.category_id).toBe(first?.id);
    expect((await makePlace(orm, trip.id, { category: null })).category_id).toBeNull();
    const own = await makeCategory(orm, { name: 'Mine' });
    expect((await makePlace(orm, trip.id, { category: own.id })).category_id).toBe(own.id);

    const tag = await makeTag(orm, user.id, { name: 'Beach' });
    await tagPlace(orm, place.id, [tag.id]);
    await tagPlace(orm, place.id, [tag.id]);
    const links = await inContext(orm, (em) => em.getRepository(Tags).listPlaceTagsForTrip(trip.id));
    expect(links).toEqual([{ place_id: place.id, tag_id: tag.id }]);
  });

  it('ORMF-024: itinerary, booking, budget, packing, to-do and file factories attach to the trip', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { start_date: '2026-06-01', end_date: '2026-06-02' });
    const [day] = await readTripDays(orm, trip.id);
    const place = await makePlace(orm, trip.id);

    const first = await makeDayAssignment(orm, day.id, place.id);
    const second = await makeDayAssignment(orm, day.id, place.id);
    expect([first.order_index, second.order_index]).toEqual([0, 1]);
    expect((await makeDayNote(orm, day.id, trip.id)).sort_order).toBe(9999);

    const reservation = await makeReservation(orm, trip.id, { day: day.id });
    expect(reservation).toMatchObject({ trip_id: trip.id, day_id: day.id, type: 'flight', status: 'pending' });
    expect((await makeReservationEndpoint(orm, reservation.id)).reservation_id).toBe(reservation.id);

    const item = await makeBudgetItem(orm, trip.id, { total_price: 250 });
    expect(item).toMatchObject({ category: 'Transport', total_price: 250 });
    expect((await addBudgetItemMember(orm, item.id, user.id)).budget_item_id).toBe(item.id);

    expect((await makePackingItem(orm, trip.id)).checked).toBe(0);
    const bag = await makePackingBag(orm, trip.id);
    await addPackingBagMembers(orm, bag.id, [user.id]);
    expect(await inContext(orm, (em) => em.getRepository(PackingBags).listMemberIdsForBag(bag.id))).toEqual([user.id]);

    expect((await makeTodoItem(orm, trip.id)).sort_order).toBe(0);
    expect((await makeTodoItem(orm, trip.id)).sort_order).toBe(1);

    const file = await makeTripFile(orm, trip.id);
    expect((await linkFile(orm, file.id, { reservation: reservation.id })).reservation_id).toBe(reservation.id);
    expect(await makeShareToken(orm, trip.id, user.id)).toMatchObject({ trip_id: trip.id, created_by: user.id });
  });
});

describe('ORM test factories: journeys, tours, collections and the rest', () => {
  it('ORMF-030: makeJourney adds the owner as contributor; contributors and trip links are idempotent', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: editor } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    await addJourneyContributor(orm, journey.id, editor.id);
    await addJourneyContributor(orm, journey.id, editor.id, 'viewer');
    const roles = (await findRows(orm, JourneyContributors, { journey: journey.id })).map((c) => [c.user_id, c.role]);
    expect(roles).toEqual(
      expect.arrayContaining([
        [owner.id, 'owner'],
        [editor.id, 'editor'],
      ]),
    );
    expect(roles).toHaveLength(2);

    const trip = await makeTrip(orm, owner.id);
    await linkTripToJourney(orm, journey.id, trip.id);
    await linkTripToJourney(orm, journey.id, trip.id);
    expect(await countRows(orm, JourneyTrips, { journey: journey.id })).toBe(1);
    expect((await makeJourneyEntry(orm, journey.id, owner.id)).visibility).toBe('private');
  });

  it('ORMF-031: makeTour keys the tour by its place and the waypoints run start, via, end', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const place = await makePlace(orm, trip.id);
    expect(await makeTour(orm, place.id)).toMatchObject({ place_id: place.id, tour_type: 'hike' });
    await addTourWaypoints(orm, place.id, [
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ]);
    const roles = (await findRows(orm, TourWaypoints, { place: place.id }, { sequence: 'asc' })).map((w) => w.role);
    expect(roles).toEqual(['start', 'via', 'end']);
  });

  it('ORMF-032: collections, notifications, settings, plugins and tokens land where the app reads them', async () => {
    const { user } = await makeUser(orm);
    const { user: friend } = await makeUser(orm);

    const collection = await makeCollection(orm, user.id);
    expect((await addCollectionMember(orm, collection.id, friend.id)).status).toBe('accepted');
    expect((await makeCollectionPlace(orm, collection.id, user.id)).collection_id).toBe(collection.id);

    expect(await makeNotification(orm, user.id)).toMatchObject({ recipient_id: user.id, is_read: 0 });
    await disableNotificationPref(orm, user.id, 'trip_invite', 'email');
    await disableNotificationPref(orm, user.id, 'trip_invite', 'email');
    expect(await findRows(orm, NotificationChannelPreferences, { user: user.id })).toEqual([
      expect.objectContaining({ event_type: 'trip_invite', channel: 'email', enabled: 0 }),
    ]);

    await setAppSetting(orm, 'factory_probe', 'one');
    await setAppSetting(orm, 'factory_probe', 'two');
    expect(await readAppSetting(orm, 'factory_probe')).toBe('two');
    await setUserSetting(orm, user.id, 'theme', 'dark');
    await setUserSetting(orm, user.id, 'theme', 'light');
    expect(await readUserSetting(orm, user.id, 'theme')).toBe('light');

    const seeded = await findRow(orm, Addons, { id: 'packing' });
    await setAddonEnabled(orm, 'packing', false);
    const flipped = await findRow(orm, Addons, { id: 'packing' });
    expect(Boolean(flipped?.enabled)).toBe(false);
    // Only `enabled` changes on an addon the instance already knows.
    expect(flipped?.name).toBe(seeded?.name);
    expect(flipped?.type).toBe(seeded?.type);
    await setAddonEnabled(orm, 'factory-addon', true);
    const created = await findRow(orm, Addons, { id: 'factory-addon' });
    expect(created).toMatchObject({ name: 'factory-addon', type: 'global' });
    expect(Boolean(created?.enabled)).toBe(true);

    expect((await makePlugin(orm, 'factory-plugin')).status).toBe('inactive');
    await setPluginUserConfig(orm, 'factory-plugin', user.id, { a: 1 });
    expect((await findRow(orm, PluginUserConfig, { plugin_id: 'factory-plugin', user_id: user.id }))?.config).toBe(
      '{"a":1}',
    );

    const { token, rawToken } = await makeMcpToken(orm, user.id);
    expect(token.token_prefix).toBe(rawToken.slice(0, 12));
    expect(token.token_hash).not.toContain(rawToken);
    expect((await makeOauthClient(orm, user.id)).client.user_id).toBe(user.id);
    expect((await makeInviteToken(orm, user.id)).created_by).toBe(user.id);
  });

  it('ORMF-033: atlas, vacay, photo and collab factories', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);

    expect((await makeBucketListItem(orm, user.id)).name).toBe('Test Destination');
    await markCountryVisited(orm, user.id, 'de');
    expect(await findRow(orm, VisitedCountries, { user: user.id })).toMatchObject({ country_code: 'DE' });

    const plan = await makeVacayPlan(orm, user.id);
    expect((await addVacayPlanMember(orm, plan.id, user.id)).status).toBe('accepted');
    expect((await makeVacayEntry(orm, plan.id, user.id, '2026-07-01')).date).toBe('2026-07-01');

    const album = await addAlbumLink(orm, trip.id, user.id, 'immich', 'album-1');
    const photo = await addTripPhoto(orm, trip.id, user.id, 'asset-1', 'immich', {
      shared: true,
      albumLinkId: album.id,
    });
    const again = await addTripPhoto(orm, await makeTrip(orm, user.id).then((t) => t.id), user.id, 'asset-1', 'immich');
    expect(photo).toMatchObject({ shared: 1, album_link_id: album.id });
    expect(again.photo_id).toBe(photo.photo_id);
    expect(await countRows(orm, TrekPhotos, { asset_id: 'asset-1' })).toBe(1);

    expect((await makeCollabNote(orm, trip.id, user.id)).category).toBe('General');
    expect((await makeCollabMessage(orm, trip.id, user.id)).text).toBe('Test message');
  });
});
