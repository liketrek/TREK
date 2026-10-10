/**
 * R1 async-closure mutation harness (Plan 3d Task 0, deliverable 4d;
 * inventory §18.4; Plan 3c Task 0a's independent trap — "a Promise is
 * always truthy → every 404 unreachable").
 *
 * Three synchronous closures wrap `this.db.get(...)` today and are used
 * directly as booleans:
 *
 * - **RB2** `DayBoundariesService.save`'s `belongs` (`day-boundaries.service.ts:16-19`):
 *   `if (!belongs(from) || to !== null && !belongs(to))`.
 * - **RS21** `ReservationsService.referencesOutsideTrip`'s `elsewhere`
 *   (`reservations.service.ts:539-542`), called through `check(field,
 *   elsewhere(table, id))` for every foreign-key-shaped field.
 * - **RS23** `ReservationsService.unresolvedReferences`'s `onTrip`
 *   (`reservations.service.ts:592-593`): `if (data.day_id && !onTrip('days',
 *   data.day_id)) offenders.push('day_id')`.
 *
 * Converting each closure's own body to a repository call is Task 1/2's
 * job, not this one's — but the MOMENT a closure becomes genuinely async, a
 * call site that keeps `elsewhere('days', id)` (no `await`) receives a
 * `Promise`, which is always truthy. The three closures do NOT all break
 * the same direction:
 *
 * - RB2: `!belongs(x)` becomes `!Promise` = always `false` → the refusal
 *   branch never fires → **a FOREIGN assignment id is silently accepted**.
 *   RB2-001 below drives this direction: a `from_assignment_id` belonging
 *   to a different trip must still be refused (404).
 * - RS21: `elsewhere(...)` itself becomes the `offending` argument to
 *   `check()`; a `Promise` is always truthy, so `check()` ALWAYS pushes the
 *   field — **every id, including a genuinely valid one on the SAME trip,
 *   gets flagged as foreign**. RS21-002 drives this direction (the one
 *   that actually ratchets RS21): a `day_id` genuinely on the target trip
 *   must succeed (201), not fail with "Not part of this trip". RS21-001 is
 *   the ordinary-behaviour baseline (a genuinely foreign id is refused
 *   today) kept alongside it for completeness.
 * - RS23: `!onTrip(...)` becomes `!Promise` = always `false` → the
 *   offender is never pushed → **an id that resolves to nothing is
 *   silently accepted**. RS23-001 drives this direction: a `day_id` that
 *   does not exist at all must be refused (400 "Unknown reference").
 *
 * Each test below drives the REAL route (`buildApp()`, `supertest`, a real
 * JWT) as the trip's own owner using a non-member's / a foreign / an
 * unresolvable id — never a unit double of the service — so a future
 * task's dropped `await` fails HTTP-level, the same way Plan 3c Task 0a's
 * mutation table proves M1/M2 fail the real guard rather than a synchronous
 * stand-in.
 *
 * **Mutation proof (manually applied and reverted while writing this file,
 * per the brief; not left in the tree as a permanent code change — `git
 * diff --stat` on both service files is empty):**
 *
 * - `reservations.service.ts:539` — `const elsewhere = (table, id) => {...}`
 *   changed to `const elsewhere = async (table, id) => {...}`, no `await`
 *   added at any of its 7 call sites. Two findings: `tsc --noEmit` ALREADY
 *   refuses this mutation at compile time (7 × TS2345, `Argument of type
 *   'Promise<boolean>' is not assignable to parameter of type 'boolean'`
 *   — `check(field: string, offending: boolean)`'s explicit parameter
 *   type catches it) — but `vitest` transpiles through SWC, which does
 *   NOT typecheck, so the SAME mutation compiles and runs under `vitest
 *   run` (the actual CI test command) and RS21-002 turns red there:
 *   `POST .../reservations` returned 400 `{"error":"Not part of this
 *   trip: day_id"}` for a day that genuinely belongs to the target trip.
 *   So `typecheck` is a real (if incidental) second line of defence for
 *   THIS one closure specifically, because of `check()`'s typed
 *   parameter — RS21-002 is still the test that catches it at the level
 *   the brief asks for (the real route, driven through `vitest run`).
 * - `day-boundaries.service.ts:16` — `belongs` changed to `async (id) =>
 *   this.db.get(...)`, no `await` at its two call sites. `!Promise` is
 *   valid TypeScript in a boolean context (no typed intermediate
 *   parameter here, unlike RS21's `check()`) — `tsc --noEmit` passes this
 *   mutation silently. RB2-001 turned red: `PUT .../day-boundaries` with
 *   a foreign `from_assignment_id` returned 200, not 404 — the id was
 *   silently accepted. This is the closure with NO compile-time net at
 *   all; RB2-001 is the only thing that would catch it.
 * - `reservations.service.ts:592` — `onTrip` changed the same way, no
 *   `await` at its 3 call sites (`if (data.day_id && !onTrip(...))`).
 *   Also no typed intermediate parameter — `tsc --noEmit` passes it
 *   silently, same as `belongs`. RS23-001 turned red: a `day_id` that
 *   resolves to nothing was accepted (201), not refused (400 "Unknown
 *   reference").
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { generateToken } from '../helpers/auth';
import { createDay, createDayAssignment, createPlace, createTrip, createUser } from '../helpers/factories';
import { setAddonEnabled } from '../helpers/factories/settings';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

describe('R1 async-closure truthiness guards (RB2/RS21/RS23) — driven through the real routes', () => {
  let app: INestApplication;
  let httpApp: Application;

  beforeAll(async () => {
    app = await buildApp();
    httpApp = app.getHttpAdapter().getInstance() as Application;
    await setAddonEnabled(app.get(MikroORM), 'roadtrip', true);
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it('RB2-001: DayBoundariesService.save refuses a from_assignment_id that belongs to a DIFFERENT trip (404 "Stop not found") — the direction an un-awaited `belongs` would silently accept', async () => {
    const { user: owner } = createUser(testDb);
    const tripA = createTrip(testDb, owner.id, { title: 'Trip A' });
    createDay(testDb, tripA.id);

    const { user: otherOwner } = createUser(testDb);
    const tripB = createTrip(testDb, otherOwner.id, { title: 'Trip B' });
    const dayB = createDay(testDb, tripB.id);
    const placeB = createPlace(testDb, tripB.id);
    const foreignAssignment = createDayAssignment(testDb, dayB.id, placeB.id);

    const res = await request(httpApp)
      .put(`/api/trips/${tripA.id}/roadtrip/day-boundaries`)
      .set('Authorization', `Bearer ${generateToken(owner.id)}`)
      .send({ day_number: 1, from_assignment_id: foreignAssignment.id, to_assignment_id: null, fraction: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Stop not found' });
  });

  it('RS21-001: POST .../reservations refuses a day_id that belongs to a DIFFERENT trip (400 "Not part of this trip: day_id") — baseline', async () => {
    const { user: owner } = createUser(testDb);
    const tripA = createTrip(testDb, owner.id, { title: 'Trip A' });

    const { user: otherOwner } = createUser(testDb);
    const tripB = createTrip(testDb, otherOwner.id, { title: 'Trip B' });
    const dayB = createDay(testDb, tripB.id);

    const res = await request(httpApp)
      .post(`/api/trips/${tripA.id}/reservations`)
      .set('Authorization', `Bearer ${generateToken(owner.id)}`)
      .send({ title: 'Foreign day booking', day_id: dayB.id });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Not part of this trip: day_id' });
  });

  it('RS21-002 (the load-bearing direction): POST .../reservations SUCCEEDS for a day_id genuinely on the SAME trip — an un-awaited `elsewhere` would flag every id, including this one, as foreign', async () => {
    const { user: owner } = createUser(testDb);
    const tripA = createTrip(testDb, owner.id, { title: 'Trip A' });
    const dayA = createDay(testDb, tripA.id);

    const res = await request(httpApp)
      .post(`/api/trips/${tripA.id}/reservations`)
      .set('Authorization', `Bearer ${generateToken(owner.id)}`)
      .send({ title: 'Same-trip booking', day_id: dayA.id });

    expect(res.status).toBe(201);
    expect((res.body as { reservation?: { day_id?: number } }).reservation?.day_id).toBe(dayA.id);
  });

  it('RS23-001 (the load-bearing direction): POST .../reservations refuses a day_id that resolves to NOTHING (400 "Unknown reference: day_id") — an un-awaited `onTrip` would never flag it', async () => {
    const { user: owner } = createUser(testDb);
    const tripA = createTrip(testDb, owner.id, { title: 'Trip A' });

    const res = await request(httpApp)
      .post(`/api/trips/${tripA.id}/reservations`)
      .set('Authorization', `Bearer ${generateToken(owner.id)}`)
      .send({ title: 'Nonexistent day booking', day_id: 999_999_999 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Unknown reference: day_id' });
  });
});
