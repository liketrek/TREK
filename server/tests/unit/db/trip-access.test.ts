/**
 * canAccessTrip is the shared trip-access check every domain reads its trip row
 * from. It must return the trip's `currency`: the budget settlement takes its base
 * currency straight off this row, and when the column was missing from the SELECT
 * it silently fell back to 'EUR', inflating balances on every non-EUR trip that had
 * a foreign-currency expense (#1543).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { db, canAccessTrip } from '../../../src/db/database';

function seedUser(username: string): number {
  return Number(
    db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, 'x', 'user')")
      .run(username, `${username}@example.test`).lastInsertRowid,
  );
}

describe('canAccessTrip', () => {
  beforeEach(() => {
    db.exec('DELETE FROM trip_members; DELETE FROM trips; DELETE FROM users;');
  });

  it('returns the trip currency for the owner (#1543)', () => {
    const owner = seedUser('owner');
    const tripId = Number(
      db.prepare("INSERT INTO trips (user_id, title, currency) VALUES (?, 'Trip', 'RUB')")
        .run(owner).lastInsertRowid,
    );

    expect(canAccessTrip(tripId, owner)).toMatchObject({ id: tripId, user_id: owner, currency: 'RUB' });
  });

  it('returns the trip currency for a member too', () => {
    const owner = seedUser('owner2');
    const member = seedUser('member2');
    const tripId = Number(
      db.prepare("INSERT INTO trips (user_id, title, currency) VALUES (?, 'Trip', 'JPY')")
        .run(owner).lastInsertRowid,
    );
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(tripId, member);

    expect(canAccessTrip(tripId, member)).toMatchObject({ currency: 'JPY' });
  });

  it('returns undefined for a user with no access', () => {
    const owner = seedUser('owner3');
    const stranger = seedUser('stranger3');
    const tripId = Number(
      db.prepare("INSERT INTO trips (user_id, title) VALUES (?, 'Trip')").run(owner).lastInsertRowid,
    );

    expect(canAccessTrip(tripId, stranger)).toBeUndefined();
  });
});
