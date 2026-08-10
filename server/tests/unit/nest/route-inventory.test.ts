/**
 * The anonymous surface of the server, as a list.
 *
 * This is what makes default-deny durable. The APP_GUARD protects what exists
 * today; this fails when a NEW route arrives that answers without a session and
 * nobody wrote it down. The same shape as the body-contract gate, and for the
 * same reason: a rule with no inventory behind it decays into whatever the last
 * person needed to make a test pass.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(':memory:');
  return { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => null, isOwner: () => false, getPlaceWithTags: () => null };
});

import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/nest/app.module';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { collectRouteGuards, PUBLIC_ROUTE_ALLOW_LIST, validateRouteGuards } from '../../../src/nest/common/validate-route-guards';

async function buildApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DatabaseService)
    .useValue({ get: () => undefined, all: () => [], run: () => ({}), canAccessTrip: () => null, isOwner: () => false })
    .compile();
  return moduleRef.createNestApplication();
}

describe('route guard inventory', () => {
  it('ROUTES-001: every @Public() route is in the reviewed list, and every listed one still exists', async () => {
    const app = await buildApp();
    try {
      expect(() => validateRouteGuards(app)).not.toThrow();
    } finally {
      await app.close();
    }
  });

  it('ROUTES-002: the list is sorted and free of duplicates, so a diff to it reads', () => {
    expect([...PUBLIC_ROUTE_ALLOW_LIST].sort()).toEqual(PUBLIC_ROUTE_ALLOW_LIST);
    expect(new Set(PUBLIC_ROUTE_ALLOW_LIST).size).toBe(PUBLIC_ROUTE_ALLOW_LIST.length);
  });

  it('ROUTES-003: an unlisted public route fails the gate, naming it', async () => {
    const app = await buildApp();
    try {
      // Drop one entry: the gate must notice the route it no longer covers.
      const short = PUBLIC_ROUTE_ALLOW_LIST.slice(1);
      expect(() => validateRouteGuards(app, short)).toThrow(PUBLIC_ROUTE_ALLOW_LIST[0]);
    } finally {
      await app.close();
    }
  });

  it('ROUTES-004: a stale entry fails too — an unpruned list is not a list', async () => {
    const app = await buildApp();
    try {
      expect(() => validateRouteGuards(app, [...PUBLIC_ROUTE_ALLOW_LIST, 'GhostController.vanished'].sort()))
        .toThrow('GhostController.vanished');
    } finally {
      await app.close();
    }
  });

  it('ROUTES-005: nothing is left uncovered by accident — every route is public, optional, guarded or default-denied', async () => {
    const app = await buildApp();
    try {
      const entries = collectRouteGuards(app);
      // The inventory only lists routes that opted out of the default. Anything
      // absent from it falls to GlobalAuthGuard, which is the safe direction.
      expect(entries.every((e) => ['public', 'optional-auth', 'declared-guards'].includes(e.cover))).toBe(true);
      expect(entries.filter((e) => e.cover === 'public').length).toBe(PUBLIC_ROUTE_ALLOW_LIST.length);
    } finally {
      await app.close();
    }
  });
});
