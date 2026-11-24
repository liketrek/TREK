/**
 * PGSEM-101..105: answers that differ by engine although every statement is
 * accepted, so the probe cannot see them; checked here against the real app
 * on the lane's Postgres database:
 * a booking linked to a stay as '14.0' still shows the stay in the public
 * reads; the traveller owner flag comes back as a number; a lost race for an
 * email or a username is the identity error, not a raw driver error; NULLs
 * sort where SQLite sorts them; and a plugin's capped writes, run in a unit of
 * work, never pass their cap when they race on the pool.
 */
import { buildApp } from '../../src/bootstrap';
import { PluginEntityMetadata } from '../../src/db/entities/PluginEntityMetadata.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { Users } from '../../src/db/entities/Users.entity';
import type { PluginEntityMetadataRepository } from '../../src/db/repositories/PluginEntityMetadata.repository';
import type { ReservationsRepository } from '../../src/db/repositories/Reservations.repository';
import type { TripsRepository } from '../../src/db/repositories/Trips.repository';
import { UserIdentityTakenError, type UsersRepository } from '../../src/db/repositories/Users.repository';
import { withRequestContext } from '../../src/nest/database/request-context';
import { UnitOfWork } from '../../src/nest/database/unit-of-work';
import { makeDayAccommodation } from '../helpers/factories/itinerary';
import { makePlace } from '../helpers/factories/places';
import { makeReservation } from '../helpers/factories/reservations';
import { addTripMember, makeTrip, readTripDays } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
}, 60_000);

afterAll(async () => {
  await app?.close();
});

/** `fn` on a fresh request context, as a request runs it. */
function inRequest<T>(fn: () => Promise<T>): Promise<T> {
  return withRequestContext(orm, fn);
}

const trips = () => orm.em.getRepository(Trips) as unknown as TripsRepository;
const reservations = () => orm.em.getRepository(Reservations) as unknown as ReservationsRepository;
const users = () => orm.em.getRepository(Users) as unknown as UsersRepository;

describe('Postgres answers as SQLite does', () => {
  it("PGSEM-101: a stay a booking points at as '14.0' is public in the calendar and share reads, for its trip and others", async () => {
    const { user } = await makeUser(orm);
    const linked = await makeTrip(orm, user.id, { start_date: '2026-09-01', end_date: '2026-09-03' });
    const other = await makeTrip(orm, user.id, { start_date: '2026-10-01', end_date: '2026-10-03' });
    const stayOn = async (trip: number): Promise<number> => {
      const place = await makePlace(orm, trip);
      const days = await readTripDays(orm, trip);
      return (await makeDayAccommodation(orm, trip, place.id, days[0].id, days[1].id)).id;
    };
    const linkedStay = await stayOn(linked.id);
    const otherStay = await stayOn(other.id);
    await makeReservation(orm, linked.id, { type: 'hotel', title: 'Hotel', accommodation_id: `${linkedStay}.0` });

    const expectPublicStay = async (trip: number, stay: number): Promise<void> => {
      const calendar = await inRequest(() => reservations().listPublicStaysForCalendar(trip));
      expect(calendar.map((row) => row.id)).toEqual([stay]);
      const shared = await inRequest(() => reservations().listPublicAccommodationsForShare(trip));
      expect(shared.map((row) => row.id)).toEqual([stay]);
      await expect(inRequest(() => reservations().listPublicStayPlaceIdsForShare(trip))).resolves.toHaveLength(1);
    };
    await expectPublicStay(linked.id, linkedStay);
    await expectPublicStay(other.id, otherStay);
  });

  it('PGSEM-102: the traveller list reports the owner flag as the numbers 1 and 0', async () => {
    const { user: owner } = await makeUser(orm, { username: 'pgsem-owner' });
    const { user: member } = await makeUser(orm, { username: 'pgsem-member' });
    const trip = await makeTrip(orm, owner.id);
    await addTripMember(orm, trip.id, member.id, owner.id);
    await expect(inRequest(() => trips().listTravellerUsernames(trip.id))).resolves.toEqual([
      { username: 'pgsem-owner', is_owner: 1 },
      { username: 'pgsem-member', is_owner: 0 },
    ]);
  });

  it('PGSEM-103: a taken email or username is refused as that field, whichever constraint Postgres names', async () => {
    await makeUser(orm, { username: 'pgsem-anna', email: 'pgsem-anna@example.com' });
    const row = (username: string, email: string) => ({ username, email, password_hash: 'x', role: 'user' });
    const sameEmail = inRequest(() => users().insertAdminCreatedUser(row('pgsem-anna2', 'pgsem-anna@example.com')));
    await expect(sameEmail).rejects.toMatchObject({ field: 'email' });
    const caseEmail = inRequest(() => users().insertAdminCreatedUser(row('pgsem-anna3', 'PGSEM-Anna@example.com')));
    await expect(caseEmail).rejects.toMatchObject({ field: 'email' });
    const sameName = inRequest(() => users().insertAdminCreatedUser(row('pgsem-anna', 'pgsem-other@example.com')));
    await expect(sameName).rejects.toBeInstanceOf(UserIdentityTakenError);
    await expect(sameName).rejects.toMatchObject({ field: 'username' });
  });

  it('PGSEM-104: NULLs sort first ascending and last descending, as on SQLite', async () => {
    const { user } = await makeUser(orm);
    const dated = await makeTrip(orm, user.id, { start_date: '2026-05-01', end_date: '2026-05-02' });
    const undated = await makeTrip(orm, user.id);
    const summaries = await inRequest(() => trips().listSummariesByIds([dated.id, undated.id]));
    expect(summaries.map((row) => row.id)).toEqual([dated.id, undated.id]);

    const trip = await makeTrip(orm, user.id);
    const timed = await makeReservation(orm, trip.id, { reservation_time: '2026-05-01T10:00' });
    const untimed = await makeReservation(orm, trip.id, { reservation_time: null });
    const listed = await inRequest(() => reservations().listForTrip(trip.id));
    expect(listed.map((row) => row.id)).toEqual([untimed.id, timed.id]);
  });

  it('PGSEM-105: capped plugin writes racing on the pool, each in a unit of work, never pass the cap', async () => {
    const uow = app.get(UnitOfWork, { strict: false });
    const meta = () => orm.em.getRepository(PluginEntityMetadata) as unknown as PluginEntityMetadataRepository;
    const cap = 5;
    const written = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        inRequest(() => uow.transactional(() => meta().upsertValueCapped('pgsem', 'trip', 1, `k${i}`, '1', cap))),
      ),
    );
    expect(written.filter(Boolean)).toHaveLength(cap);
    const stored = await inRequest(() => meta().countForEntity('pgsem', 'trip', 1));
    expect(stored).toBe(cap);
  });
});
