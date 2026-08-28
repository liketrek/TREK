import { DatabaseService } from '../../../src/nest/database/database.service';
import { GuestIdentityTransferError, TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { createTestDb } from '../../helpers/test-db';

import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('TripMembersService Guest identity transfer', () => {
  let db: Database.Database;
  let service: TripMembersService;
  const erasePluginUserData = vi.fn();

  beforeEach(() => {
    db = createTestDb();
    const dbs = new DatabaseService(db);
    service = new TripMembersService(
      dbs,
      {} as never,
      { erasePluginUserData } as never,
      {} as never,
      { broadcast: vi.fn() } as never,
      {} as never,
    );
    db.prepare(
      "INSERT INTO users (username,email,password_hash,role) VALUES ('owner','owner@example.test','x','admin')",
    ).run();
    const owner = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get() as { id: number };
    db.prepare(
      "INSERT INTO users (username,email,password_hash,role,is_guest,display_name) VALUES ('member','member@example.test','x','user',0,'Member')",
    ).run();
    db.prepare(
      "INSERT INTO users (username,email,password_hash,role,is_guest,display_name) VALUES ('guest-handle','guest@example.invalid','', 'user',1,'Guest Sam')",
    ).run();
    const member = db.prepare("SELECT id FROM users WHERE username='member'").get() as { id: number };
    const guest = db.prepare("SELECT id FROM users WHERE username='guest-handle'").get() as { id: number };
    const tripId = Number(
      db.prepare("INSERT INTO trips (user_id,title,currency) VALUES (?, 'Trip','EUR')").run(owner.id).lastInsertRowid,
    );
    db.prepare('INSERT INTO trip_members (trip_id,user_id) VALUES (?,?)').run(tripId, member.id);
    db.prepare(
      'INSERT INTO trip_members (trip_id,user_id,new_member_identity_check_completed_at) VALUES (?,?,CURRENT_TIMESTAMP)',
    ).run(tripId, guest.id);
  });

  afterEach(() => {
    erasePluginUserData.mockReset();
    db.close();
  });

  const ids = () => ({
    trip: (db.prepare("SELECT id FROM trips WHERE title='Trip'").get() as { id: number }).id,
    member: (db.prepare("SELECT id FROM users WHERE username='member'").get() as { id: number }).id,
    guest: (db.prepare("SELECT id FROM users WHERE username='guest-handle'").get() as { id: number }).id,
  });

  it('moves v4 traveler/ticket/rating participation and keeps the member rating on overlap', () => {
    const { trip, member, guest } = ids();
    const placeId = Number(
      db.prepare("INSERT INTO places (trip_id,name) VALUES (?, 'Museum')").run(trip).lastInsertRowid,
    );
    db.prepare('INSERT INTO place_ratings (place_id,user_id,rating) VALUES (?,?,5)').run(placeId, guest);
    db.prepare('INSERT INTO place_ratings (place_id,user_id,rating) VALUES (?,?,3)').run(placeId, member);
    const reservationId = Number(
      db.prepare("INSERT INTO reservations (trip_id,title,type) VALUES (?, 'Train','train')").run(trip).lastInsertRowid,
    );
    db.prepare('INSERT INTO reservation_travelers (reservation_id,user_id) VALUES (?,?)').run(reservationId, guest);
    db.prepare('INSERT INTO reservation_travelers (reservation_id,user_id) VALUES (?,?)').run(reservationId, member);
    const ticket = JSON.stringify({ items: [{ name: 'Ticket', price: 10, parts: [guest] }] });
    const budgetId = Number(
      db
        .prepare(
          "INSERT INTO budget_items (trip_id,category,name,total_price,ticket_json) VALUES (?, 'activities','Museum',10,?)",
        )
        .run(trip, ticket).lastInsertRowid,
    );

    const preview = service.listGuestIdentityTransferCandidates(trip, member)[0];
    expect(preview.impact).toMatchObject({ bookings: 1, ratings: 1, rating_overlaps: 1, expenses: 1 });
    expect(preview.conflicts).toEqual([]);

    service.transferGuestIdentity(trip, guest, member);

    expect(db.prepare('SELECT id FROM users WHERE id = ?').get(guest)).toBeUndefined();
    expect(
      db.prepare('SELECT rating FROM place_ratings WHERE place_id = ? AND user_id = ?').get(placeId, member),
    ).toEqual({ rating: 3 });
    expect(
      db.prepare('SELECT COUNT(*) AS count FROM reservation_travelers WHERE reservation_id = ?').get(reservationId),
    ).toEqual({ count: 1 });
    const stored = db.prepare('SELECT ticket_json FROM budget_items WHERE id = ?').get(budgetId) as {
      ticket_json: string;
    };
    expect(JSON.parse(stored.ticket_json).items[0].parts).toEqual([member]);
    expect(erasePluginUserData).toHaveBeenCalledWith(guest);
  });

  it('blocks an overlapping expense share without partially rewriting the trip', () => {
    const { trip, member, guest } = ids();
    const itemId = Number(
      db
        .prepare("INSERT INTO budget_items (trip_id,category,name,total_price) VALUES (?, 'food','Dinner',20)")
        .run(trip).lastInsertRowid,
    );
    db.prepare('INSERT INTO budget_item_members (budget_item_id,user_id,paid) VALUES (?,?,0)').run(itemId, guest);
    db.prepare('INSERT INTO budget_item_members (budget_item_id,user_id,paid) VALUES (?,?,0)').run(itemId, member);

    expect(() => service.transferGuestIdentity(trip, guest, member)).toThrow(GuestIdentityTransferError);
    expect(db.prepare('SELECT id FROM users WHERE id = ?').get(guest)).toEqual({ id: guest });
    expect(erasePluginUserData).not.toHaveBeenCalled();
  });
});
