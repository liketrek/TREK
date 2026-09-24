/**
 * Per-key read scopes for /api/v1 (#2279).
 *
 * The feature is spread over four files that each know one third of it: the
 * shared vocabulary, the column and how it is read back (TokenService), the
 * grant on the request (ApiTokenGuard), and the refusal (public-api-request,
 * used from two controllers in two modules). Nothing forces those halves to
 * agree, so the cases below walk the whole path — a row in, a status out — and
 * pin the one rule that is easy to get backwards on the way:
 *
 *   a key that was never narrowed reads everything.
 *
 * That is not a nicety. Every integration key minted before this shipped has an
 * empty `api_scopes`, and the day "no list" starts meaning "no access" is the
 * day every one of them stops working.
 *
 * The end-to-end shape (real HTTP, real hash lookup) lives in
 * tests/e2e/public-api.e2e.test.ts; this file owns the branches that are
 * awkward to reach through a socket — a NULL column, a key the guard never
 * touched, an unknown scope name.
 */

// ---------------------------------------------------------------------------
// vi.hoisted: real in-memory DB + the module mock, before any import
// ---------------------------------------------------------------------------

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      canAccessTrip: () => undefined,
      isOwner: () => false,
    },
  };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/nest/auth/ephemeral-tokens', () => ({ createEphemeralToken: vi.fn() }));
vi.mock('../../../src/mcp/sessionManager', () => ({ revokeUserSessions: vi.fn() }));
vi.mock('../../../src/nest/audit/client-ip', () => ({ getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after the mocks)
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import {
  PUBLIC_API_INCLUDES,
  PUBLIC_API_SCOPES,
  apiTokenCreateRequestSchema,
  mcpTokenCreateRequestSchema,
  type PublicApiGrant,
  type PublicApiScope,
} from '@trek/shared';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { TokenService } from '../../../src/nest/tokens/token.service';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { ApiTokenGuard } from '../../../src/nest/public-api/api-token.guard';
import { PublicApiController } from '../../../src/nest/public-api/public-api.controller';
import type { PublicApiService } from '../../../src/nest/public-api/public-api.service';
import { PublicStatsController } from '../../../src/nest/atlas/public-stats.controller';
import type { AtlasService } from '../../../src/nest/atlas/atlas.service';
import {
  grantedScopes,
  narrowToGrant,
  requireScope,
} from '../../../src/nest/public-api/public-api-request';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { AuthController } from '../../../src/nest/auth/auth.controller';
import type { AuthService } from '../../../src/nest/auth/auth.service';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import type { UserProfileService } from '../../../src/nest/auth/user-profile.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import type { StorageService } from '../../../src/nest/storage/storage.service';
import type { User } from '../../../src/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ALL: PublicApiGrant = { mode: 'all', scopes: [...PUBLIC_API_SCOPES] };
const limited = (...scopes: PublicApiScope[]): PublicApiGrant => ({ mode: 'limited', scopes });

/** A request as the guard leaves it: a user and a grant, nothing else. */
const req = (grant: PublicApiGrant | undefined = ALL, userId: number | null = 7) =>
  ({
    headers: {},
    user: userId === null ? undefined : ({ id: userId } as User),
    apiToken: grant,
  }) as Request;

const TRIP = {
  id: 12,
  title: 'Toskana',
  description: null,
  start_date: '2026-06-14',
  end_date: '2026-06-22',
  currency: 'EUR',
  archived: false,
  updated_at: '2026-06-01 10:00:00',
};

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to refuse');
}

function apiController(svc: Partial<PublicApiService>) {
  const rl = { check: vi.fn().mockReturnValue(true) } as unknown as RateLimitService;
  return new PublicApiController(svc as PublicApiService, rl);
}

function statsController() {
  return new PublicStatsController(
    {
      getTravelStats: vi.fn(() => ({
        countries: ['JP'], cities: ['tokyo'], coords: [],
        totalTrips: 1, totalDays: 2, totalPlaces: 3, totalDistanceKm: 4,
      })),
      lastTrip: vi.fn(() => null),
    } as unknown as AtlasService,
    new RateLimitService(),
  );
}

// ---------------------------------------------------------------------------
// The grant on the request
// ---------------------------------------------------------------------------

describe('public-api scopes — the grant on the request', () => {
  it('PUBAPI-SCOPE-U001: a request the guard never touched may read nothing', () => {
    // Fail closed. A route mounted without the guard is a bug, and the answer to
    // a bug in an authorisation path is "no", never "everything".
    expect(grantedScopes({} as Request)).toEqual([]);
  });

  it('PUBAPI-SCOPE-U002: a resolved grant is what the request reports, verbatim', () => {
    expect(grantedScopes(req(limited('trips', 'days')))).toEqual(['trips', 'days']);
    expect(grantedScopes(req(ALL))).toEqual([...PUBLIC_API_SCOPES]);
  });

  it('PUBAPI-SCOPE-U003: a missing scope is a 403 with a code of its own, never a 401 or a 404', () => {
    // 401 would tell an integrator to re-mint a key that is perfectly valid; 404
    // would send them looking for a trip that is right there. Both are worse than
    // saying what actually happened.
    expect(thrown(() => requireScope(req(limited('trips')), 'stats'))).toEqual({
      status: 403,
      body: {
        error: 'This API key is not allowed to read stats',
        code: 'API_SCOPE_FORBIDDEN',
        required_scope: 'stats',
      },
    });
  });

  it('PUBAPI-SCOPE-U004: a granted scope passes without comment', () => {
    expect(() => requireScope(req(limited('trips')), 'trips')).not.toThrow();
    for (const scope of PUBLIC_API_SCOPES) {
      expect(() => requireScope(req(ALL), scope)).not.toThrow();
    }
  });

  it('PUBAPI-SCOPE-U005: narrowToGrant filters instead of refusing, and keeps the caller’s order', () => {
    expect(narrowToGrant([...PUBLIC_API_INCLUDES], req(limited('trips', 'days', 'notes')))).toEqual([
      'days',
      'notes',
    ]);
    expect(narrowToGrant([...PUBLIC_API_INCLUDES], req(ALL))).toEqual([...PUBLIC_API_INCLUDES]);
    expect(narrowToGrant([...PUBLIC_API_INCLUDES], req(limited('trips')))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ApiTokenGuard — resolving the grant
// ---------------------------------------------------------------------------

describe('ApiTokenGuard — the grant it leaves behind', () => {
  const USER = { id: 7, username: 'ada', email: 'ada@example.com', role: 'user' } as User;

  function contextWith(headers: Record<string, string | undefined>) {
    const request: Record<string, unknown> = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      req: request,
    } as unknown as ExecutionContext & { req: Record<string, unknown> };
  }

  function guardWith(result: { user: User; grant: PublicApiGrant } | null) {
    const verifyApiTokenWithGrant = vi.fn().mockReturnValue(result);
    return {
      guard: new ApiTokenGuard({ verifyApiTokenWithGrant } as unknown as TokenService),
      verifyApiTokenWithGrant,
    };
  }

  it('PUBAPI-SCOPE-U010: puts the user AND the grant on the request, as two separate things', () => {
    const grant = limited('trips');
    const { guard, verifyApiTokenWithGrant } = guardWith({ user: USER, grant });
    const ctx = contextWith({ authorization: 'Bearer trek_abc123' });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(verifyApiTokenWithGrant).toHaveBeenCalledWith('trek_abc123');
    expect(ctx.req.user).toBe(USER);
    expect(ctx.req.apiToken).toBe(grant);
    // The grant belongs to the credential, not to the person: nothing of it may
    // end up on `user`, which every other auth path in TREK also reads.
    expect(USER).not.toHaveProperty('scopes');
    expect(USER).not.toHaveProperty('scope_mode');
  });

  /**
   * The two refusals predate scopes and are load-bearing for every integration
   * that already handles them. Adding a third answer must not reword them.
   */
  it('PUBAPI-SCOPE-U011: the 401 bodies are unchanged — no scope wording leaked into them', () => {
    const { guard: noCredential } = guardWith(null);
    expect(thrown(() => noCredential.canActivate(contextWith({})))).toEqual({
      status: 401,
      body: { error: 'API token required', code: 'API_TOKEN_REQUIRED' },
    });
    const { guard: unknownToken } = guardWith(null);
    expect(
      thrown(() => unknownToken.canActivate(contextWith({ authorization: 'Bearer trek_nope' }))),
    ).toEqual({
      status: 401,
      body: { error: 'Invalid API token', code: 'API_TOKEN_INVALID' },
    });
  });

  it('PUBAPI-SCOPE-U012: a rejected token leaves no grant behind for a later handler to trust', () => {
    const { guard } = guardWith(null);
    const ctx = contextWith({ authorization: 'Bearer trek_nope' });
    thrown(() => guard.canActivate(ctx));
    expect(ctx.req.apiToken).toBeUndefined();
    expect(ctx.req.user).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The two controllers behind the guard
// ---------------------------------------------------------------------------

describe('PublicApiController — what a narrowed key reaches', () => {
  it('PUBAPI-SCOPE-U020: an un-narrowed key reads every route, exactly as before', () => {
    const listTrips = vi.fn().mockReturnValue([TRIP]);
    const listBucketList = vi.fn().mockReturnValue([]);
    const getTrip = vi.fn().mockReturnValue(TRIP);
    const ctl = apiController({ listTrips, listBucketList, getTrip });
    expect(ctl.listTrips(req(ALL))).toEqual({ trips: [TRIP] });
    expect(ctl.listBucketList(req(ALL))).toEqual({ items: [] });
    expect(ctl.getTrip(req(ALL), '12', undefined)).toEqual(TRIP);
    expect(getTrip).toHaveBeenCalledWith(12, 7, [...PUBLIC_API_INCLUDES], [...PUBLIC_API_SCOPES]);
  });

  it('PUBAPI-SCOPE-U021: a trips-only key reads the trip list', () => {
    const listTrips = vi.fn().mockReturnValue([TRIP]);
    expect(apiController({ listTrips }).listTrips(req(limited('trips')))).toEqual({ trips: [TRIP] });
  });

  it('PUBAPI-SCOPE-U022: and is refused the bucket list before the service is ever asked', () => {
    const listBucketList = vi.fn();
    const res = thrown(() => apiController({ listBucketList }).listBucketList(req(limited('trips'))));
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: 'API_SCOPE_FORBIDDEN', required_scope: 'bucket-list' });
    // The refusal has to happen before the read, not after it: a 403 carrying
    // rows that were already fetched is one careless `return` from leaking them.
    expect(listBucketList).not.toHaveBeenCalled();
  });

  it('PUBAPI-SCOPE-U023: a key without `trips` cannot reach the list or a single trip', () => {
    const listTrips = vi.fn();
    const getTrip = vi.fn();
    const ctl = apiController({ listTrips, getTrip });
    expect(thrown(() => ctl.listTrips(req(limited('bucket-list')))).status).toBe(403);
    expect(thrown(() => ctl.getTrip(req(limited('bucket-list')), '12', undefined)).status).toBe(403);
    expect(listTrips).not.toHaveBeenCalled();
    expect(getTrip).not.toHaveBeenCalled();
  });

  it('PUBAPI-SCOPE-U024: a trip asked for without include is narrowed, not refused', () => {
    const getTrip = vi.fn().mockReturnValue(TRIP);
    apiController({ getTrip }).getTrip(req(limited('trips', 'days', 'notes')), '12', undefined);
    // `include` absent means "everything"; refusing a key for wanting sections it
    // never named would make a narrow key unable to read a trip at all. The grant
    // rides along so the service can tell an implied day block from a granted one.
    expect(getTrip).toHaveBeenCalledWith(12, 7, ['days', 'notes'], ['trips', 'days', 'notes']);
  });

  it('PUBAPI-SCOPE-U025: a trips-only key gets the summary and nothing that hangs off it', () => {
    const getTrip = vi.fn().mockReturnValue(TRIP);
    apiController({ getTrip }).getTrip(req(limited('trips')), '12', undefined);
    expect(getTrip).toHaveBeenCalledWith(12, 7, [], ['trips']);
  });

  it('PUBAPI-SCOPE-U026: an empty include is treated like an absent one, and narrowed too', () => {
    const getTrip = vi.fn().mockReturnValue(TRIP);
    apiController({ getTrip }).getTrip(req(limited('trips', 'days')), '12', '   ');
    expect(getTrip).toHaveBeenCalledWith(12, 7, ['days'], ['trips', 'days']);
  });

  it('PUBAPI-SCOPE-U027: a section named explicitly and not granted is a 403, not a silent drop', () => {
    const getTrip = vi.fn();
    const res = thrown(() =>
      apiController({ getTrip }).getTrip(req(limited('trips', 'days')), '12', 'days,places'),
    );
    expect(res).toEqual({
      status: 403,
      body: {
        error: 'This API key is not allowed to read places',
        code: 'API_SCOPE_FORBIDDEN',
        required_scope: 'places',
      },
    });
    expect(getTrip).not.toHaveBeenCalled();
  });

  it('PUBAPI-SCOPE-U028: an include the key covers is passed through untouched', () => {
    const getTrip = vi.fn().mockReturnValue(TRIP);
    apiController({ getTrip }).getTrip(req(limited('trips', 'days', 'notes')), '12', 'days, notes');
    expect(getTrip).toHaveBeenCalledWith(12, 7, ['days', 'notes'], ['trips', 'days', 'notes']);
  });

  it('PUBAPI-SCOPE-U029: a bad id is still a 400 — the scope check does not swallow it', () => {
    const getTrip = vi.fn();
    expect(thrown(() => apiController({ getTrip }).getTrip(req(ALL), 'abc', undefined)).status).toBe(400);
    expect(getTrip).not.toHaveBeenCalled();
  });
});

describe('PublicStatsController — the widest answer on the surface', () => {
  it('PUBAPI-SCOPE-U030: a key without `stats` is refused, in the module next door too', () => {
    // The route lives in atlas/ and imports the check from public-api/. If it ever
    // stops calling it, nothing else in that module would notice.
    const res = thrown(() => statsController().stats(req(limited('trips'))));
    expect(res).toEqual({
      status: 403,
      body: {
        error: 'This API key is not allowed to read stats',
        code: 'API_SCOPE_FORBIDDEN',
        required_scope: 'stats',
      },
    });
  });

  it('PUBAPI-SCOPE-U031: a key that was granted stats still gets its numbers', () => {
    expect(statsController().stats(req(limited('stats')))).toMatchObject({
      total_trips: 1,
      total_countries: 1,
    });
  });

  it('PUBAPI-SCOPE-U032: an un-narrowed key reads stats, as every key did before', () => {
    expect(statsController().stats(req(ALL))).toMatchObject({ total_trips: 1 });
  });
});

// ---------------------------------------------------------------------------
// The column: what is written, and what is read back out of it
// ---------------------------------------------------------------------------

describe('TokenService — storing and resolving a grant', () => {
  const tokens = new TokenService(new DatabaseService(testDb), new EphemeralTokenService());

  beforeAll(() => {
    createTables(testDb);
    runMigrations(testDb);
  });

  beforeEach(() => {
    resetTestDb(testDb);
    vi.clearAllMocks();
  });

  afterAll(() => {
    testDb.close();
  });

  const rowFor = (id: number) =>
    testDb.prepare('SELECT kind, scope_mode, api_scopes FROM mcp_tokens WHERE id = ?').get(id) as {
      kind: string;
      scope_mode: string | null;
      api_scopes: string | null;
    };

  const mint = (userId: number, name: string, scopes?: readonly string[]) =>
    tokens.createApiToken(userId, name, scopes).token as {
      id: number;
      raw_token: string;
      scope_mode: string;
      scopes: string[];
    };

  it('PUBAPI-SCOPE-U040: a key minted without scopes is stored as a full grant, not an empty one', () => {
    const { user } = createUser(testDb);
    const created = mint(user.id, 'Dawarich');
    // 'all' is written explicitly: a NULL sentinel here would mean a bug that
    // drops the column silently grants everything.
    expect(rowFor(created.id)).toEqual({ kind: 'api', scope_mode: 'all', api_scopes: null });
    expect(created.scope_mode).toBe('all');
    expect(created.scopes).toEqual([...PUBLIC_API_SCOPES]);
  });

  it('PUBAPI-SCOPE-U041: and resolves to every scope when it is presented', () => {
    const { user } = createUser(testDb);
    const raw = mint(user.id, 'Dawarich').raw_token;
    const resolved = tokens.verifyApiTokenWithGrant(raw);
    expect(resolved?.user.id).toBe(user.id);
    expect(resolved?.grant).toEqual({ mode: 'all', scopes: [...PUBLIC_API_SCOPES] });
  });

  /**
   * The backwards-compatibility case, at the layer that decides it. A row written
   * before the columns existed carries neither value; the ALTER backfills
   * 'all', and a DatabaseService that hands back NULL anyway must land in the
   * same place. Both are "nobody ever narrowed this key".
   */
  it('PUBAPI-SCOPE-U042: a row with no narrowing at all still reads everything', () => {
    const noColumns = new TokenService(
      {
        get: () => ({ id: 3, username: 'ada', email: 'a@b.c', role: 'user', scope_mode: null, api_scopes: null }),
        run: () => ({ changes: 1 }),
      } as unknown as DatabaseService,
      new EphemeralTokenService(),
    );
    expect(noColumns.verifyApiTokenWithGrant('trek_legacy')?.grant).toEqual({
      mode: 'all',
      scopes: [...PUBLIC_API_SCOPES],
    });
  });

  it('PUBAPI-SCOPE-U043: a narrowed key stores exactly the chosen sections, in the canonical order', () => {
    const { user } = createUser(testDb);
    const created = mint(user.id, 'Dawarich', ['stats', 'trips']);
    expect(rowFor(created.id)).toEqual({
      kind: 'api',
      scope_mode: 'limited',
      // Canonical order, not the caller's: two keys with the same access must
      // read identically in the settings list.
      api_scopes: JSON.stringify(['trips', 'stats']),
    });
    expect(created).toMatchObject({ scope_mode: 'limited', scopes: ['trips', 'stats'] });
  });

  it('PUBAPI-SCOPE-U044: and resolves to exactly those, and no more', () => {
    const { user } = createUser(testDb);
    const raw = mint(user.id, 'Dawarich', ['trips', 'days']).raw_token;
    expect(tokens.verifyApiTokenWithGrant(raw)?.grant).toEqual({
      mode: 'limited',
      scopes: ['trips', 'days'],
    });
  });

  it('PUBAPI-SCOPE-U045: an unknown scope name is dropped rather than stored', () => {
    const { user } = createUser(testDb);
    const created = mint(user.id, 'Dawarich', ['trips', 'passwords', 'trips']);
    expect(rowFor(created.id).api_scopes).toBe(JSON.stringify(['trips']));
  });

  it('PUBAPI-SCOPE-U046: a list of nothing but unknown names is no narrowing at all', () => {
    const { user } = createUser(testDb);
    // Not an empty limited grant: that would mint a key that can read nothing,
    // which nobody asked for and which fails hours later at the integration.
    const created = mint(user.id, 'Dawarich', ['everything']);
    expect(rowFor(created.id)).toMatchObject({ scope_mode: 'all', api_scopes: null });
  });

  it('PUBAPI-SCOPE-U047: an empty scopes array means the caller did not narrow anything', () => {
    const { user } = createUser(testDb);
    expect(rowFor(mint(user.id, 'Dawarich', []).id)).toMatchObject({ scope_mode: 'all', api_scopes: null });
  });

  it('PUBAPI-SCOPE-U048: a key that says it is narrowed and cannot say how reads nothing', () => {
    // The direction matters. A row that never said 'limited' is a legacy
    // full-access key and stays one; a row that HAS said it is restricted must
    // never widen because its list became unreadable — that is the failure this
    // whole column exists to prevent. A key that stops working is a support
    // ticket; a key that quietly reads every trip is the bug.
    const { user } = createUser(testDb);
    const created = mint(user.id, 'Dawarich', ['trips']);
    for (const broken of ['{"not":"a list"', 'null', '"trips"', '{}', '[]', '[42, null]']) {
      testDb.prepare('UPDATE mcp_tokens SET api_scopes = ? WHERE id = ?').run(broken, created.id);
      expect(tokens.verifyApiTokenWithGrant(created.raw_token)?.grant).toEqual({
        mode: 'limited',
        scopes: [],
      });
    }
  });

  it('PUBAPI-SCOPE-U051: a narrowed key whose scopes were all renamed away denies rather than widens', () => {
    const { user } = createUser(testDb);
    const created = mint(user.id, 'Dawarich', ['trips']);
    // What a future version dropping or renaming a scope constant leaves behind.
    testDb
      .prepare('UPDATE mcp_tokens SET api_scopes = ? WHERE id = ?')
      .run(JSON.stringify(['itineraries']), created.id);
    expect(tokens.verifyApiTokenWithGrant(created.raw_token)?.grant).toEqual({
      mode: 'limited',
      scopes: [],
    });
  });

  it('PUBAPI-SCOPE-U049: a partly unreadable list keeps the names it can read', () => {
    const { user } = createUser(testDb);
    const created = mint(user.id, 'Dawarich', ['trips']);
    testDb
      .prepare('UPDATE mcp_tokens SET api_scopes = ? WHERE id = ?')
      .run(JSON.stringify(['trips', 42, 'nope', 'stats']), created.id);
    expect(tokens.verifyApiTokenWithGrant(created.raw_token)?.grant).toEqual({
      mode: 'limited',
      scopes: ['trips', 'stats'],
    });
  });

  it('PUBAPI-SCOPE-U050: the list route reports the grant of every key, narrowed or not', () => {
    const { user } = createUser(testDb);
    mint(user.id, 'Wide');
    mint(user.id, 'Narrow', ['trips']);
    const listed = tokens.listApiTokens(user.id) as Array<Record<string, unknown>>;
    expect(listed).toHaveLength(2);
    expect(listed.map((t) => [t.name, t.scope_mode, t.scopes])).toEqual(
      expect.arrayContaining([
        ['Wide', 'all', [...PUBLIC_API_SCOPES]],
        ['Narrow', 'limited', ['trips']],
      ]),
    );
    // Still no hash, and still no raw key.
    expect(JSON.stringify(listed)).not.toContain('token_hash');
  });

  it('PUBAPI-SCOPE-U051: an MCP token is untouched by any of this', () => {
    const { user } = createUser(testDb);
    const mcp = tokens.createMcpToken(user.id, 'Assistant').token as { id: number };
    // Stored as the column default, because an MCP token carries no read scopes
    // and must not look as if it did.
    expect(rowFor(mcp.id)).toEqual({ kind: 'mcp', scope_mode: 'all', api_scopes: null });
    const listed = tokens.listMcpTokens(user.id) as Array<Record<string, unknown>>;
    expect(listed).toHaveLength(1);
    // The MCP panel cannot act on scopes, so it is not shown two columns that
    // would always say the same thing.
    expect(listed[0]).not.toHaveProperty('scope_mode');
    expect(listed[0]).not.toHaveProperty('scopes');
    expect(Object.keys(listed[0]).sort()).toEqual(
      ['created_at', 'id', 'last_used_at', 'name', 'token_prefix'].sort(),
    );
  });

  it('PUBAPI-SCOPE-U052: an API key still does not verify as an MCP token, scopes or not', () => {
    const { user } = createUser(testDb);
    const raw = mint(user.id, 'Dawarich', ['trips']).raw_token;
    expect(tokens.verifyMcpToken(raw)).toBeNull();
    expect(tokens.verifyApiTokenWithGrant(raw)).not.toBeNull();
  });

  it('PUBAPI-SCOPE-U053: presenting a narrowed key stamps last_used_at like any other', () => {
    const { user } = createUser(testDb);
    const created = mint(user.id, 'Dawarich', ['trips']);
    expect(
      (testDb.prepare('SELECT last_used_at FROM mcp_tokens WHERE id = ?').get(created.id) as {
        last_used_at: string | null;
      }).last_used_at,
    ).toBeNull();
    tokens.verifyApiTokenWithGrant(created.raw_token);
    expect(
      (testDb.prepare('SELECT last_used_at FROM mcp_tokens WHERE id = ?').get(created.id) as {
        last_used_at: string | null;
      }).last_used_at,
    ).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // The mint routes. AuthController is constructed directly (repo convention)
  // over the real TokenService above, so the body really does reach the column.
  // -------------------------------------------------------------------------

  const authController = () =>
    new AuthController(
      { setAuthCookie: vi.fn(), clearAuthCookie: vi.fn() } as unknown as AuthService,
      {} as UserProfileService,
      tokens,
      new RateLimitService(),
      { writeAudit: vi.fn() } as unknown as AuditService,
      new RuntimeEnvService(),
      { put: vi.fn() } as unknown as StorageService,
    );
  const httpReq = { ip: '9.9.9.9', headers: {} } as Request;

  it('PUBAPI-SCOPE-U060: POST /api/auth/api-tokens stores the scopes it was given', () => {
    const { user } = createUser(testDb);
    const created = authController().createApiToken(
      { id: user.id } as User,
      { name: 'Dawarich', scopes: ['trips', 'days'] },
      httpReq,
    ).token as { id: number; scope_mode: string; scopes: string[]; raw_token: string };

    expect(rowFor(created.id)).toMatchObject({
      scope_mode: 'limited',
      api_scopes: JSON.stringify(['trips', 'days']),
    });
    // The response carries the grant, so the panel can show it without a re-read.
    expect(created).toMatchObject({ scope_mode: 'limited', scopes: ['trips', 'days'] });
    expect(created.raw_token).toMatch(/^trek_/);
  });

  it('PUBAPI-SCOPE-U061: and the list route hands the same grant back', () => {
    const { user } = createUser(testDb);
    const ctl = authController();
    ctl.createApiToken({ id: user.id } as User, { name: 'Dawarich', scopes: ['bucket-list'] }, httpReq);
    expect(ctl.listApiTokens({ id: user.id } as User)).toEqual({
      tokens: [expect.objectContaining({ name: 'Dawarich', scope_mode: 'limited', scopes: ['bucket-list'] })],
    });
  });

  it('PUBAPI-SCOPE-U062: a key minted with no scopes field is a full grant, as it always was', () => {
    const { user } = createUser(testDb);
    const ctl = authController();
    const created = ctl.createApiToken({ id: user.id } as User, { name: 'Legacy' }, httpReq).token as {
      id: number;
    };
    expect(rowFor(created.id)).toMatchObject({ scope_mode: 'all', api_scopes: null });
    expect(ctl.listApiTokens({ id: user.id } as User)).toEqual({
      tokens: [expect.objectContaining({ scope_mode: 'all', scopes: [...PUBLIC_API_SCOPES] })],
    });
  });

  it('PUBAPI-SCOPE-U063: POST /api/auth/mcp-tokens ignores scopes in the body entirely', () => {
    const { user } = createUser(testDb);
    const ctl = authController();
    // The DTO is a different schema on purpose, so the field never survives the
    // pipe — and even handed straight to the controller it changes nothing.
    const created = ctl.createMcpToken(
      { id: user.id } as User,
      { name: 'Assistant', scopes: ['trips'] } as { name: string },
      httpReq,
    ).token as Record<string, unknown>;

    expect(rowFor(created.id as number)).toEqual({ kind: 'mcp', scope_mode: 'all', api_scopes: null });
    expect(created).not.toHaveProperty('scope_mode');
    expect(created).not.toHaveProperty('scopes');
    expect(ctl.listMcpTokens({ id: user.id } as User).tokens[0]).not.toHaveProperty('scope_mode');
  });

  it('PUBAPI-SCOPE-U064: the two create schemas differ, which is what keeps them apart', () => {
    const api = apiTokenCreateRequestSchema.safeParse({ name: 'Dawarich', scopes: ['trips'] });
    expect(api.success && api.data.scopes).toEqual(['trips']);
    // An unknown section is refused at the edge rather than quietly sanitised, so
    // a typo in an integration's setup script is visible immediately.
    expect(apiTokenCreateRequestSchema.safeParse({ name: 'x', scopes: ['passwords'] }).success).toBe(false);
    // An empty array would mint a key that reads nothing; omitting the field is
    // how you ask for everything.
    expect(apiTokenCreateRequestSchema.safeParse({ name: 'x', scopes: [] }).success).toBe(false);
    expect(apiTokenCreateRequestSchema.safeParse({ name: 'x' }).success).toBe(true);

    const mcp = mcpTokenCreateRequestSchema.safeParse({ name: 'Assistant', scopes: ['trips'] });
    expect(mcp.success).toBe(true);
    // Parsed and dropped: the MCP route cannot be handed read scopes by accident.
    expect(mcp.success && mcp.data).toEqual({ name: 'Assistant' });
  });
});
