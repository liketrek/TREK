/**
 * TripTagsService: the tags a trip owns, read by everybody on the trip and
 * written under its `place_edit` right, whoever created them. The service
 * comes out of TagsModule over a snapshot test db; rows are seeded through the
 * ORM factories and broadcasts go to a FakeRealtimeService.
 */
import { Tags } from '../../../src/db/entities/Tags.entity';
import { DomainError } from '../../../src/nest/common/domain-error';
import { restTripWriter, type TripWriter } from '../../../src/nest/common/trip-writer';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { TagsModule } from '../../../src/nest/tags/tags.module';
import { TagsService } from '../../../src/nest/tags/tags.service';
import { TripTagsService } from '../../../src/nest/tags/trip-tags.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace, makeTag, tagPlace } from '../../helpers/factories/places';
import { countRows, findRow, findRows } from '../../helpers/factories/rows';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let tripTags: TripTagsService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [TagsModule] });
  tripTags = t.get(TripTagsService);
});
beforeEach(() => {
  resetTestDb(db);
  t.realtime.broadcastMock.mockClear();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const SOCKET = 'sock-1';

/** A REST caller, as the controller hands one in. */
const writer = (userId: number, tripId: number): TripWriter =>
  restTripWriter(t.realtime, tripId, { id: userId, role: 'user' }, SOCKET);

/** The status and text a write was refused with. */
async function refusal(run: () => Promise<unknown>): Promise<{ status: number; message: string }> {
  const thrown: unknown = await run().then(
    () => null,
    (err: unknown) => err,
  );
  expect(thrown).toBeInstanceOf(DomainError);
  const refused = thrown as DomainError;
  return { status: refused.getStatus(), message: refused.publicMessage };
}

const NOT_FOUND = { status: 404, message: 'Trip not found' };
const NO_TAG = { status: 404, message: 'Tag not found' };

/** A trip of `owner` with `member` on it; `stranger` is on neither, and has a trip of their own. */
async function scene() {
  const { user: owner } = await makeUser(orm());
  const { user: member } = await makeUser(orm());
  const { user: stranger } = await makeUser(orm());
  const trip = await makeTrip(orm(), owner.id, { title: 'Lisbon' });
  await addTripMember(orm(), trip.id, member.id, owner.id);
  const elsewhere = await makeTrip(orm(), stranger.id, { title: 'Porto' });
  return { owner, member, stranger, trip, elsewhere };
}

describe('list', () => {
  it('TRIPTAG-SVC-001: every member reads the same tags, by name, whoever created them', async () => {
    const s = await scene();
    await makeTag(orm(), s.owner.id, { trip: s.trip.id, name: 'Zone' });
    await makeTag(orm(), s.member.id, { trip: s.trip.id, name: 'Monument' });
    await makeTag(orm(), s.owner.id, { name: 'personal' });
    await makeTag(orm(), s.stranger.id, { trip: s.elsewhere.id, name: 'Elsewhere' });

    const forOwner = await tripTags.list(s.trip.id, s.owner.id);
    const forMember = await tripTags.list(String(s.trip.id), s.member.id);

    expect(forOwner.map((tag) => tag.name)).toEqual(['Monument', 'Zone']);
    expect(forMember).toEqual(forOwner);
    expect(forOwner.every((tag) => tag.trip_id === s.trip.id)).toBe(true);
  });

  it('TRIPTAG-SVC-002: a trip the reader is not on, or an id that is no trip, reads as not found', async () => {
    const s = await scene();
    await makeTag(orm(), s.owner.id, { trip: s.trip.id, name: 'Zone' });

    expect(await refusal(() => tripTags.list(s.trip.id, s.stranger.id))).toEqual(NOT_FOUND);
    expect(await refusal(() => tripTags.list('abc', s.owner.id))).toEqual(NOT_FOUND);
  });
});

describe('create', () => {
  it('TRIPTAG-SVC-010: stores the trimmed name under the trip and tells its other sockets', async () => {
    const s = await scene();

    const tag = await tripTags.create(s.trip.id, { name: '  Monument ' }, writer(s.member.id, s.trip.id));

    expect(tag).toMatchObject({ name: 'Monument', color: '#10b981', trip_id: s.trip.id, user_id: s.member.id });
    expect(await findRow(orm(), Tags, { id: tag.id })).toMatchObject({ name: 'Monument', trip_id: s.trip.id });
    expect(t.realtime.broadcastMock.mock.calls).toEqual([[s.trip.id, 'tripTags:changed', {}, SOCKET]]);
  });

  it('TRIPTAG-SVC-011: takes the colour it is given', async () => {
    const s = await scene();
    const tag = await tripTags.create(s.trip.id, { name: 'Zone', color: '#0ea5e9' }, writer(s.owner.id, s.trip.id));
    expect(tag.color).toBe('#0ea5e9');
  });

  it('TRIPTAG-SVC-012: a name the trip has, whatever its case, answers that tag and writes nothing', async () => {
    const s = await scene();
    const first = await tripTags.create(
      s.trip.id,
      { name: 'Monument', color: '#ff0000' },
      writer(s.owner.id, s.trip.id),
    );
    t.realtime.broadcastMock.mockClear();

    const again = await tripTags.create(
      s.trip.id,
      { name: ' monument', color: '#00ff00' },
      writer(s.member.id, s.trip.id),
    );

    expect(again).toEqual(first);
    expect(await countRows(orm(), Tags, { trip: s.trip.id })).toBe(1);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TRIPTAG-SVC-013: the same name on another trip, or as a personal tag, is a tag of its own', async () => {
    const s = await scene();
    await makeTag(orm(), s.owner.id, { name: 'Monument' });
    await makeTag(orm(), s.stranger.id, { trip: s.elsewhere.id, name: 'Monument' });

    const tag = await tripTags.create(s.trip.id, { name: 'Monument' }, writer(s.owner.id, s.trip.id));

    expect(await countRows(orm(), Tags, { name: 'Monument' })).toBe(3);
    expect(tag.trip_id).toBe(s.trip.id);
  });

  it('TRIPTAG-SVC-014: refuses a writer who is not on the trip, and one without the right to edit places', async () => {
    const s = await scene();

    expect(await refusal(() => tripTags.create(s.trip.id, { name: 'Zone' }, writer(s.stranger.id, s.trip.id)))).toEqual(
      NOT_FOUND,
    );
    expect(await refusal(() => tripTags.create('abc', { name: 'Zone' }, writer(s.owner.id, s.trip.id)))).toEqual(
      NOT_FOUND,
    );

    vi.spyOn(t.get(PermissionsService), 'checkPermission').mockResolvedValueOnce(false);
    expect(await refusal(() => tripTags.create(s.trip.id, { name: 'Zone' }, writer(s.member.id, s.trip.id)))).toEqual({
      status: 403,
      message: 'No permission',
    });

    expect(await countRows(orm(), Tags, { trip: s.trip.id })).toBe(0);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });
});

describe('update', () => {
  it('TRIPTAG-SVC-020: renames and recolours a tag another member created, one field at a time', async () => {
    const s = await scene();
    const tag = await makeTag(orm(), s.owner.id, { trip: s.trip.id, name: 'Monument', color: '#ff0000' });

    const renamed = await tripTags.update(s.trip.id, tag.id, { name: ' Landmark ' }, writer(s.member.id, s.trip.id));
    expect(renamed).toMatchObject({ id: tag.id, name: 'Landmark', color: '#ff0000' });

    const recoloured = await tripTags.update(
      String(s.trip.id),
      String(tag.id),
      { color: '#0ea5e9' },
      writer(s.member.id, s.trip.id),
    );
    expect(recoloured).toMatchObject({ id: tag.id, name: 'Landmark', color: '#0ea5e9', user_id: s.owner.id });
    expect(t.realtime.broadcastMock.mock.calls).toEqual([
      [s.trip.id, 'tripTags:changed', {}, SOCKET],
      [s.trip.id, 'tripTags:changed', {}, SOCKET],
    ]);
  });

  it('TRIPTAG-SVC-021: keeps its own name in another case, and refuses the name of another tag', async () => {
    const s = await scene();
    const monument = await makeTag(orm(), s.owner.id, { trip: s.trip.id, name: 'Monument' });
    await makeTag(orm(), s.owner.id, { trip: s.trip.id, name: 'Zone' });

    expect(
      await tripTags.update(s.trip.id, monument.id, { name: 'MONUMENT' }, writer(s.owner.id, s.trip.id)),
    ).toMatchObject({ name: 'MONUMENT' });
    expect(
      await refusal(() => tripTags.update(s.trip.id, monument.id, { name: 'zone' }, writer(s.owner.id, s.trip.id))),
    ).toEqual({ status: 409, message: 'A tag with this name already exists' });
    expect(await findRow(orm(), Tags, { id: monument.id })).toMatchObject({ name: 'MONUMENT' });
  });

  it('TRIPTAG-SVC-022: a personal tag, another trip’s tag and an id that is none read as not found', async () => {
    const s = await scene();
    const personal = await makeTag(orm(), s.owner.id, { name: 'personal' });
    const foreign = await makeTag(orm(), s.stranger.id, { trip: s.elsewhere.id, name: 'Elsewhere' });
    const as = writer(s.owner.id, s.trip.id);

    expect(await refusal(() => tripTags.update(s.trip.id, personal.id, { name: 'x' }, as))).toEqual(NO_TAG);
    expect(await refusal(() => tripTags.update(s.trip.id, foreign.id, { name: 'x' }, as))).toEqual(NO_TAG);
    expect(await refusal(() => tripTags.update(s.trip.id, 'abc', { name: 'x' }, as))).toEqual(NO_TAG);
    expect(await findRows(orm(), Tags, { name: 'x' })).toEqual([]);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });
});

describe('remove', () => {
  it('TRIPTAG-SVC-030: deletes the tag and takes it off the places that carried it', async () => {
    const s = await scene();
    const place = await makePlace(orm(), s.trip.id, { name: 'Belem Tower' });
    const monument = await makeTag(orm(), s.owner.id, { trip: s.trip.id, name: 'Monument' });
    const zone = await makeTag(orm(), s.owner.id, { trip: s.trip.id, name: 'Zone' });
    await tagPlace(orm(), place.id, [monument.id, zone.id]);

    await tripTags.remove(s.trip.id, monument.id, writer(s.member.id, s.trip.id));

    expect(await findRow(orm(), Tags, { id: monument.id })).toBeNull();
    expect((await findRows(orm(), Tags, { place_tags_inverse: place.id })).map((tag) => tag.id)).toEqual([zone.id]);
    expect(t.realtime.broadcastMock.mock.calls).toEqual([[s.trip.id, 'tripTags:changed', {}, SOCKET]]);
  });

  it('TRIPTAG-SVC-031: leaves a personal tag, another trip’s tag and an id that is none alone', async () => {
    const s = await scene();
    const personal = await makeTag(orm(), s.owner.id, { name: 'personal' });
    const foreign = await makeTag(orm(), s.stranger.id, { trip: s.elsewhere.id, name: 'Elsewhere' });
    const as = writer(s.owner.id, s.trip.id);

    expect(await refusal(() => tripTags.remove(s.trip.id, personal.id, as))).toEqual(NO_TAG);
    expect(await refusal(() => tripTags.remove(s.trip.id, foreign.id, as))).toEqual(NO_TAG);
    expect(await refusal(() => tripTags.remove(s.trip.id, 'abc', as))).toEqual(NO_TAG);
    expect(await countRows(orm(), Tags, {})).toBe(2);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });
});

describe('the personal surface next to it', () => {
  it('TRIPTAG-SVC-040: a tag of a trip is not on its creator’s own list, and not theirs to find there', async () => {
    const s = await scene();
    const personal = await makeTag(orm(), s.owner.id, { name: 'personal' });
    const ofTrip = await makeTag(orm(), s.owner.id, { trip: s.trip.id, name: 'Monument' });
    const tags = t.get(TagsService);

    expect((await tags.list(s.owner.id)).map((tag) => tag.id)).toEqual([personal.id]);
    expect(await tags.getByIdAndUser(personal.id, s.owner.id)).toMatchObject({ id: personal.id });
    expect(await tags.getByIdAndUser(ofTrip.id, s.owner.id)).toBeUndefined();
  });
});
