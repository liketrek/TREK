/**
 * TourPackingLinkService (P2D-XD-01): a tour points at the packing list of its
 * trip or at one of its categories, read against the items Packing lets the
 * user see. The service comes out of ToursModule over a snapshot test db; rows
 * are seeded through the ORM factories and broadcasts go to a FakeRealtimeService.
 */
import { PackingItems } from '../../../src/db/entities/PackingItems.entity';
import { TourPackingLinks } from '../../../src/db/entities/TourPackingLinks.entity';
import { DomainError } from '../../../src/nest/common/domain-error';
import { TourPackingLinkService } from '../../../src/nest/tours/tour-packing-link.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePackingItem } from '../../helpers/factories/packing';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRows } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { linkTourPacking, makeTour } from '../../helpers/factories/tours';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let links: TourPackingLinkService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  links = t.get(TourPackingLinkService);
});
beforeEach(async () => {
  resetTestDb(db);
  t.realtime.broadcastMock.mockClear();
  await setAddonEnabled(orm(), 'packing', true);
});
afterAll(async () => {
  await t.close();
  db.close();
});

/**
 * A trip of the owner with a member: a hike, a plain place, and a packing list
 * whose "Hiking gear" holds two items (one packed), "Snacks" only the
 * placeholder of a new category, and "Secret" an item the member keeps to
 * themselves. Another trip has a tour of its own.
 */
async function fixture() {
  const { user: owner } = await makeUser(orm());
  const { user: member } = await makeUser(orm());
  const trip = await makeTrip(orm(), owner.id, { title: 'Alps' });
  await addTripMember(orm(), trip.id, member.id);
  const hike = await makePlace(orm(), trip.id, { name: 'Ridge' });
  await makeTour(orm(), hike.id, {
    distance: 12.5,
    elevation_gain: 800,
    duration: 240,
    difficulty: 'T3',
    max_hiking_difficulty: 3,
  });
  const cafe = await makePlace(orm(), trip.id, { name: 'Cafe' });
  const boots = await makePackingItem(orm(), trip.id, {
    name: 'Boots',
    category: 'Hiking gear',
    checked: 1,
    sort_order: 1,
  });
  const jacket = await makePackingItem(orm(), trip.id, {
    name: 'Rain jacket',
    category: 'Hiking gear',
    quantity: 2,
    sort_order: 2,
  });
  await makePackingItem(orm(), trip.id, { name: '...', category: 'Snacks', sort_order: 3 });
  await makePackingItem(orm(), trip.id, {
    name: 'Diary',
    category: 'Secret',
    is_private: 1,
    owner: member.id,
    sort_order: 4,
  });
  const other = await makeTrip(orm(), owner.id, { title: 'Coast' });
  const otherTour = await makePlace(orm(), other.id, { name: 'Cliffs' });
  await makeTour(orm(), otherTour.id);
  return { owner, member, trip, hike, cafe, boots, jacket, other, otherTour };
}

describe('TourPackingLinkService', () => {
  it('TPL-SVC-001: a tour points at nothing until it is linked, then at the whole list, and says so to the trip', async () => {
    const f = await fixture();
    expect(await links.read(f.trip.id, f.hike.id)).toEqual({ packing_link: null });

    const answer = await links.link(String(f.trip.id), String(f.hike.id), { category: null }, f.owner.id, 'sock-1');
    expect(answer.tour.place_id).toBe(f.hike.id);
    expect(answer.packing_link).toEqual({ category: null, linked_at: expect.any(String) });
    expect(t.realtime.broadcastMock).toHaveBeenCalledWith(
      String(f.trip.id),
      'tours:changed',
      { placeIds: [f.hike.id] },
      'sock-1',
    );
    expect(await links.read(String(f.trip.id), String(f.hike.id))).toEqual({ packing_link: answer.packing_link });
  });

  it('TPL-SVC-002: a category is linked by its exact name, and a new link replaces the old one', async () => {
    const f = await fixture();
    await links.link(String(f.trip.id), String(f.hike.id), { category: null }, f.owner.id);
    const answer = await links.link(String(f.trip.id), String(f.hike.id), { category: 'Hiking gear' }, f.owner.id);
    expect(answer.packing_link?.category).toBe('Hiking gear');
    // A category that only holds the placeholder of a new one is there too.
    await links.link(String(f.trip.id), String(f.hike.id), { category: 'Snacks' }, f.owner.id);
    expect(await countRows(orm(), TourPackingLinks)).toBe(1);
  });

  it('TPL-SVC-003: a category the user cannot see an item of is refused, a private one of another member included', async () => {
    const f = await fixture();
    const refused = (category: string) =>
      expect(links.link(String(f.trip.id), String(f.hike.id), { category }, f.owner.id)).rejects.toMatchObject({
        status: 400,
        publicMessage: 'Packing category not found',
      });
    await refused('Climbing');
    await refused('hiking gear');
    await refused('Secret');
    // The member who keeps it may link it.
    const own = await links.link(String(f.trip.id), String(f.hike.id), { category: 'Secret' }, f.member.id);
    expect(own.packing_link?.category).toBe('Secret');
  });

  it('TPL-SVC-004: with Packing off nothing is linked, and an existing link can still be let go', async () => {
    const f = await fixture();
    await linkTourPacking(orm(), f.hike.id, 'Hiking gear', f.owner.id);
    await setAddonEnabled(orm(), 'packing', false);
    const refused = await links
      .link(String(f.trip.id), String(f.hike.id), { category: null }, f.owner.id)
      .catch((err: unknown) => err);
    expect(refused).toBeInstanceOf(DomainError);
    expect(refused).toMatchObject({ status: 404, publicMessage: 'Packing addon is not enabled' });
    await expect(links.view(f.trip.id, f.hike.id, f.owner.id)).rejects.toMatchObject({ status: 404 });

    const answer = await links.unlink(String(f.trip.id), String(f.hike.id));
    expect(answer.packing_link).toBeNull();
  });

  it('TPL-SVC-005: removing the link leaves the packing list and every item as it was', async () => {
    const f = await fixture();
    await linkTourPacking(orm(), f.hike.id, 'Hiking gear', f.owner.id);
    const before = await findRows(orm(), PackingItems, {}, { id: 'asc' });

    const answer = await links.unlink(String(f.trip.id), String(f.hike.id), 'sock-2');
    expect(answer.packing_link).toBeNull();
    expect(await links.read(f.trip.id, f.hike.id)).toEqual({ packing_link: null });
    expect(await findRows(orm(), PackingItems, {}, { id: 'asc' })).toEqual(before);
    expect(t.realtime.broadcastMock).toHaveBeenCalledWith(
      String(f.trip.id),
      'tours:changed',
      { placeIds: [f.hike.id] },
      'sock-2',
    );
    // Letting go of nothing is no error.
    expect((await links.unlink(String(f.trip.id), String(f.hike.id))).packing_link).toBeNull();
  });

  it('TPL-SVC-006: a tour of another trip, a plain place or a malformed id is not found', async () => {
    const f = await fixture();
    const notFound = (attempt: Promise<unknown>) =>
      expect(attempt).rejects.toMatchObject({ status: 404, publicMessage: 'Tour not found' });
    await notFound(links.read(f.trip.id, f.otherTour.id));
    await notFound(links.read(f.trip.id, f.cafe.id));
    await notFound(links.read('abc', f.hike.id));
    await notFound(links.read(f.trip.id, '1.5'));
    await notFound(links.link(String(f.trip.id), String(f.otherTour.id), { category: null }, f.owner.id));
    await notFound(links.unlink(String(f.trip.id), String(f.cafe.id)));
    await notFound(links.view(f.other.id, f.hike.id, f.owner.id));
    expect(await countRows(orm(), TourPackingLinks)).toBe(0);
  });

  it('TPL-SVC-007: an assistant reads the linked items it may see with the packed count and the tour as context', async () => {
    const f = await fixture();
    const unlinked = await links.view(f.trip.id, f.hike.id, f.owner.id);
    expect(unlinked).toEqual({
      packing_link: null,
      state: null,
      items: [],
      packed: 0,
      total: 0,
      tour: {
        name: 'Ridge',
        tour_type: 'hike',
        distance_km: 12.5,
        elevation_gain_m: 800,
        elevation_loss_m: null,
        walking_minutes: 240,
        planned_duration_minutes: null,
        difficulty: 'T3',
        max_hiking_difficulty: 3,
      },
    });

    await linkTourPacking(orm(), f.hike.id, 'Hiking gear', f.owner.id);
    const gear = await links.view(f.trip.id, f.hike.id, f.owner.id);
    expect(gear).toMatchObject({
      packing_link: { category: 'Hiking gear' },
      state: 'ready',
      items: [
        { id: f.boots.id, name: 'Boots', category: 'Hiking gear', quantity: 1, packed: true },
        { id: f.jacket.id, name: 'Rain jacket', category: 'Hiking gear', quantity: 2, packed: false },
      ],
      packed: 1,
      total: 2,
    });
  });

  it('TPL-SVC-008: what the link reads as follows the viewer: empty, missing, or the whole list without others’ private items', async () => {
    const f = await fixture();
    await linkTourPacking(orm(), f.hike.id, 'Snacks', f.owner.id);
    expect((await links.view(f.trip.id, f.hike.id, f.owner.id)).state).toBe('empty');

    await links.link(String(f.trip.id), String(f.hike.id), { category: 'Secret' }, f.member.id);
    expect(await links.view(f.trip.id, f.hike.id, f.owner.id)).toMatchObject({ state: 'missing', items: [], total: 0 });
    expect(await links.view(f.trip.id, f.hike.id, f.member.id)).toMatchObject({ state: 'ready', total: 1 });

    await links.link(String(f.trip.id), String(f.hike.id), { category: null }, f.owner.id);
    const whole = await links.view(f.trip.id, f.hike.id, f.owner.id);
    expect(whole.items.map((item) => item.name)).toEqual(['Boots', 'Rain jacket']);
    expect(whole).toMatchObject({ state: 'ready', packed: 1, total: 2 });
  });
});
