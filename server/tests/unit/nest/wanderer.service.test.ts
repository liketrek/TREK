import { WandererConnections } from '../../../src/db/entities/WandererConnections.entity';
import type { WandererConnectionsRepository } from '../../../src/db/repositories/WandererConnections.repository';
import { AuditService } from '../../../src/nest/audit/audit.service';
import { maybe_encrypt_api_key } from '../../../src/nest/common/crypto/apiKeyCrypto';
import { DomainError } from '../../../src/nest/common/domain-error';
import { WandererClient, WandererError, type WandererSearchHit } from '../../../src/nest/wanderer/wanderer.client';
import { WandererModule } from '../../../src/nest/wanderer/wanderer.module';
import { WandererService } from '../../../src/nest/wanderer/wanderer.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { WANDERER_TOKEN_MASK } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { checkSsrf } = vi.hoisted(() => ({ checkSsrf: vi.fn() }));
vi.mock('../../../src/utils/ssrfGuard', () => ({ checkSsrf, safeFetch: vi.fn() }));

const PUBLIC = { allowed: true, isPrivate: false };
const PRIVATE = { allowed: false, isPrivate: true, resolvedIp: '192.168.1.5', error: 'private' };
const BLOCKED = { allowed: false, isPrivate: false, error: 'not a public address' };

type Row = Awaited<ReturnType<WandererConnectionsRepository['findRow']>>;

function savedRow(over: Partial<NonNullable<Row>> = {}): NonNullable<Row> {
  return {
    user_id: 1,
    url: 'https://trails.example',
    token: maybe_encrypt_api_key('saved-token'),
    allow_insecure_tls: 0,
    last_checked_at: null,
    last_check_ok: null,
    last_check_error: null,
    ...over,
  } as NonNullable<Row>;
}

function hit(over: Partial<WandererSearchHit> = {}): WandererSearchHit {
  return { id: 'trail1', name: 'Ridge', ...over };
}

type Watch = Awaited<ReturnType<WandererConnectionsRepository['findWatch']>>;

const state: { row: Row; watch: Watch } = { row: undefined, watch: undefined };
const connections = {
  findRow: vi.fn(async () => state.row),
  save: vi.fn(async () => undefined),
  remove: vi.fn(async () => undefined),
  recordCheck: vi.fn(async () => undefined),
  findWatch: vi.fn(async () => state.watch),
  setWatch: vi.fn(async () => undefined),
  listWatchable: vi.fn(async () => [3, 4]),
  recordWatchRun: vi.fn(async () => undefined),
};
const client = {
  check: vi.fn(),
  ownActors: vi.fn(),
  search: vi.fn(),
  searchById: vi.fn(),
  trail: vi.fn(),
  gpx: vi.fn(),
};
const audit = { writeAudit: vi.fn(async () => undefined) };

const db = createSnapshotTestDb();
let t: TestModule;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [WandererModule],
    overrides: [
      { provide: getRepositoryToken(WandererConnections), useValue: connections },
      { provide: WandererClient, useValue: client },
      { provide: AuditService, useValue: audit },
    ],
  });
});

afterAll(async () => {
  await t.close();
  db.close();
});

/** The service over a saved row (or none), every collaborator answering the happy path. */
function setup(row: Row = undefined, watch: Watch = undefined) {
  state.row = row;
  state.watch = watch;
  for (const mock of [...Object.values(connections), ...Object.values(client), audit.writeAudit]) mock.mockClear();
  client.check.mockReset().mockResolvedValue({ trailCount: 4 });
  client.ownActors.mockReset().mockResolvedValue(['actor1']);
  client.search.mockReset().mockResolvedValue({ hits: [hit()], total: 1 });
  client.searchById.mockReset().mockResolvedValue(hit());
  client.trail.mockReset().mockResolvedValue({ id: 'trail1', name: 'Ridge', author: 'actor1' });
  client.gpx.mockReset().mockResolvedValue('<gpx/>');
  return { service: t.get(WandererService), connections, client, audit };
}

async function refusal(promise: Promise<unknown>): Promise<DomainError> {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return err as DomainError;
}

beforeEach(() => {
  checkSsrf.mockReset();
  checkSsrf.mockResolvedValue(PUBLIC);
});

describe('WandererService connection card', () => {
  it('WAND-SVC-001: no saved row reads as an empty, unconnected card', async () => {
    const { service } = setup();
    expect(await service.getConnection(1)).toEqual({
      url: '',
      tokenMasked: '',
      allowInsecureTls: false,
      connected: false,
      lastCheckedAt: null,
      lastCheckOk: null,
      lastCheckError: null,
    });
  });

  it('WAND-SVC-002: a saved row shows the mask, never the token, and its last check either way', async () => {
    const failed = setup(savedRow({ allow_insecure_tls: 1, last_check_ok: 0, last_check_error: 'unauthorized' }));
    expect(await failed.service.getConnection(1)).toMatchObject({
      url: 'https://trails.example',
      tokenMasked: WANDERER_TOKEN_MASK,
      allowInsecureTls: true,
      connected: true,
      lastCheckOk: false,
      lastCheckError: 'unauthorized',
    });
    const passed = setup(savedRow({ last_check_ok: 1 }));
    expect((await passed.service.getConnection(1)).lastCheckOk).toBe(true);
    const tokenless = setup(savedRow({ token: null }));
    expect(await tokenless.service.getConnection(1)).toMatchObject({ tokenMasked: '', connected: false });
  });
});

describe('WandererService.save', () => {
  it('WAND-SVC-003: a public address that is not allowed is refused as invalid_url', async () => {
    checkSsrf.mockResolvedValue(BLOCKED);
    const { service, connections } = setup();
    const err = await refusal(
      service.save(1, { url: 'https://bad.example', token: 't', allowInsecureTls: false }, null),
    );
    expect(err.getStatus()).toBe(400);
    expect(connections.save).not.toHaveBeenCalled();
  });

  it('WAND-SVC-004: a first save stores the typed token encrypted and audits a connection', async () => {
    const { service, connections, audit } = setup();
    expect(
      await service.save(1, { url: 'https://trails.example/api', token: 'new', allowInsecureTls: false }, '1.2.3.4'),
    ).toEqual({
      success: true,
    });
    const saved = connections.save.mock.calls[0] as unknown as [
      number,
      { url: string; token: string; hostChanged: boolean },
    ];
    expect(saved[1].url).toBe('https://trails.example');
    expect(saved[1].token).not.toBe('new');
    expect(saved[1].hostChanged).toBe(false);
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'wanderer.connected',
        details: { url: 'https://trails.example', token_changed: true },
      }),
    );
  });

  it('WAND-SVC-005: a private address saves with a warning and records where it resolved', async () => {
    checkSsrf.mockResolvedValue(PRIVATE);
    const { service, audit } = setup(savedRow({ url: 'http://192.168.1.5:3000' }));
    expect(
      await service.save(
        1,
        { url: 'http://192.168.1.5:3000', token: WANDERER_TOKEN_MASK, allowInsecureTls: false },
        null,
      ),
    ).toEqual({
      success: true,
      warning: 'private_ip',
    });
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'wanderer.updated',
        details: expect.objectContaining({ token_changed: false, resolved_ip: '192.168.1.5' }),
      }),
    );
  });

  it('WAND-SVC-006: the mask keeps the stored token on the same host and drops it on another', async () => {
    const same = setup(savedRow());
    await same.service.save(
      1,
      { url: 'https://trails.example', token: WANDERER_TOKEN_MASK, allowInsecureTls: true },
      null,
    );
    expect(same.connections.save).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ token: undefined, hostChanged: false }),
    );

    const moved = setup(savedRow());
    await moved.service.save(1, { url: 'https://elsewhere.example', allowInsecureTls: false }, null);
    expect(moved.connections.save).toHaveBeenCalledWith(1, expect.objectContaining({ token: null, hostChanged: true }));
  });

  it('WAND-SVC-007: disconnecting removes the row and audits it', async () => {
    const { service, connections, audit } = setup(savedRow());
    await service.disconnect(1, '1.2.3.4');
    expect(connections.remove).toHaveBeenCalledWith(1);
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'wanderer.disconnected', ip: '1.2.3.4' }),
    );
  });
});

describe('WandererService.test', () => {
  it('WAND-SVC-008: without an address or a token there is nothing to test', async () => {
    expect(await setup().service.test(1, {})).toEqual({ ok: false, code: 'not_connected' });
    // A typed address on another host never borrows the saved token.
    expect(await setup(savedRow()).service.test(1, { url: 'https://elsewhere.example' })).toEqual({
      ok: false,
      code: 'not_connected',
    });
  });

  it('WAND-SVC-009: an address the guard refuses answers blocked_address or invalid_url', async () => {
    checkSsrf.mockResolvedValue(PRIVATE);
    expect(await setup().service.test(1, { url: 'http://192.168.1.5', token: 't' })).toEqual({
      ok: false,
      code: 'blocked_address',
    });
    checkSsrf.mockResolvedValue(BLOCKED);
    expect(await setup().service.test(1, { url: 'https://bad.example', token: 't' })).toEqual({
      ok: false,
      code: 'invalid_url',
    });
  });

  it('WAND-SVC-010: testing the saved connection notes the outcome on it', async () => {
    const ok = setup(savedRow({ allow_insecure_tls: 1 }));
    expect(await ok.service.test(1, {})).toEqual({ ok: true, trailCount: 4 });
    expect(ok.client.check).toHaveBeenCalledWith({
      baseUrl: 'https://trails.example',
      token: 'saved-token',
      allowInsecureTls: true,
    });
    expect(ok.connections.recordCheck).toHaveBeenCalledWith(1, true, null);

    const bad = setup(savedRow());
    bad.client.check.mockRejectedValueOnce(new WandererError('unauthorized', 'rejected'));
    expect(await bad.service.test(1, { url: 'https://trails.example' })).toEqual({ ok: false, code: 'unauthorized' });
    expect(bad.connections.recordCheck).toHaveBeenCalledWith(1, false, 'unauthorized');
  });

  it('WAND-SVC-011: a typed token is tested without touching the saved state', async () => {
    const { service, client, connections } = setup(savedRow());
    client.check.mockRejectedValueOnce(new WandererError('unreachable', 'down'));
    expect(await service.test(1, { url: 'https://trails.example', token: 'typed', allowInsecureTls: false })).toEqual({
      ok: false,
      code: 'unreachable',
    });
    expect(client.check).toHaveBeenCalledWith(expect.objectContaining({ token: 'typed', allowInsecureTls: false }));
    expect(connections.recordCheck).not.toHaveBeenCalled();
  });

  it('WAND-SVC-012: an error that is not wanderer answering is not swallowed', async () => {
    const { service, client } = setup(savedRow());
    client.check.mockRejectedValueOnce(new TypeError('bug'));
    await expect(service.test(1, {})).rejects.toThrow(TypeError);
  });
});

describe('WandererService reads for an import', () => {
  it.each([
    ['no row', undefined],
    ['no token', savedRow({ token: null })],
    ['no address', savedRow({ url: '' })],
  ])('WAND-SVC-013: a read with %s is a 409 not_connected', async (_case, row) => {
    expect((await refusal(setup(row).service.search(1, { q: '', page: 1 }))).getStatus()).toBe(409);
  });

  it('WAND-SVC-013b: the saved connection names its instance', async () => {
    expect(await setup(savedRow()).service.instanceOf(1)).toBe('https://trails.example');
  });

  it('WAND-SVC-014: search lists only the own trails, each as a list row', async () => {
    const { service, client } = setup(savedRow());
    client.search.mockResolvedValueOnce({
      hits: [
        hit({
          author_name: 'maurice',
          domain: 'trails.example',
          description: '',
          location: 'Alps',
          duration: 0,
          difficulty: 1,
          public: true,
          polyline: '_p~iF~ps|U_ulLnnqC',
        }),
        hit({ id: 'trail2', author_name: 'julia' }),
        hit({ id: 'trail3', difficulty: 9 }),
      ],
      total: 3,
    });
    const found = await service.search(1, { q: 'ridge', page: 2, bbox: undefined });
    expect(client.search).toHaveBeenCalledWith(expect.anything(), { q: 'ridge', page: 2, bbox: undefined }, ['actor1']);
    expect(found.total).toBe(3);
    const [first, second, third] = found.trails;
    expect(first).toMatchObject({
      author: 'maurice@trails.example',
      description: null,
      location: 'Alps',
      durationS: null,
      difficulty: 'moderate',
      public: true,
      externalUrl: 'https://trails.example/trail/view/@maurice%40trails.example/trail1',
    });
    expect(first.line.length).toBeGreaterThan(1);
    expect(second).toMatchObject({ author: 'julia', line: [] });
    expect(third).toMatchObject({
      author: null,
      difficulty: null,
      public: false,
      externalUrl: 'https://trails.example/trail/view/@/trail3',
    });
  });

  it.each([
    ['not_found', 404, 0],
    ['forbidden', 403, 0],
    ['unauthorized', 502, 1],
    ['unreachable', 502, 0],
  ] as const)(
    'WAND-SVC-015: an upstream %s answers %i, noted on the connection %i times',
    async (code, status, notes) => {
      const { service, client, connections } = setup(savedRow());
      client.ownActors.mockRejectedValueOnce(new WandererError(code, code));
      expect((await refusal(service.search(1, { q: '', page: 1 }))).getStatus()).toBe(status);
      expect(connections.recordCheck).toHaveBeenCalledTimes(notes);
    },
  );

  it.each(['someone-else', null])('WAND-SVC-016: download refuses a trail whose author is %s', async (author) => {
    const { service, client } = setup(savedRow());
    client.trail.mockResolvedValueOnce({ id: 'trail1', name: 'Ridge', author });
    expect((await refusal(service.download(1, 'trail1'))).getStatus()).toBe(403);
    expect(client.gpx).not.toHaveBeenCalled();
  });

  it('WAND-SVC-017: download hands over the own trail with its GPX', async () => {
    const { service } = setup(savedRow());
    expect(await service.download(1, 'trail1')).toEqual({
      instance: 'https://trails.example',
      trail: { id: 'trail1', name: 'Ridge', author: 'actor1' },
      gpx: '<gpx/>',
    });
  });

  it('WAND-SVC-018: findTrail answers the row, null when the search has none, and maps a failure', async () => {
    const found = setup(savedRow());
    expect(await found.service.findTrail(1, 'trail1')).toMatchObject({ id: 'trail1', name: 'Ridge' });
    const missing = setup(savedRow());
    missing.client.searchById.mockResolvedValueOnce(null as unknown as WandererSearchHit);
    expect(await missing.service.findTrail(1, 'trail1')).toBeNull();
    const failing = setup(savedRow());
    failing.client.searchById.mockRejectedValueOnce(new WandererError('not_found', 'gone'));
    expect((await refusal(failing.service.findTrail(1, 'trail1'))).getStatus()).toBe(404);
  });

  it('WAND-SVC-019: a failure that is not wanderer answering is rethrown as it is', async () => {
    const { service, client } = setup(savedRow());
    client.trail.mockRejectedValueOnce(new TypeError('bug'));
    await expect(service.download(1, 'trail1')).rejects.toThrow(TypeError);
  });
});

describe('WandererService background watch (WAN-02)', () => {
  it('WAND-SVC-020: the watch state reads the switch, the last run and a refused token', async () => {
    const none = setup();
    expect(await none.service.watchState(1)).toEqual({
      connected: false,
      enabled: false,
      lastRunAt: null,
      failures: 0,
      pausedUntil: null,
      blocked: false,
    });
    const watched = setup(savedRow({ last_check_ok: 0, last_check_error: 'unauthorized' }), {
      watch_enabled: 1,
      watch_last_run_at: '2026-10-19 10:00:00',
      watch_failures: 2,
      watch_paused_until: '2026-10-19 14:00:00',
    });
    expect(await watched.service.watchState(1)).toEqual({
      connected: true,
      enabled: true,
      lastRunAt: '2026-10-19 10:00:00',
      failures: 2,
      pausedUntil: '2026-10-19 14:00:00',
      blocked: true,
    });
  });

  it('WAND-SVC-021: switching on needs a connection; either way the switch is audited', async () => {
    const none = setup();
    expect((await refusal(none.service.setWatch(1, true, null))).getStatus()).toBe(409);
    expect(none.connections.setWatch).not.toHaveBeenCalled();

    const { service, connections, audit } = setup(savedRow());
    await service.setWatch(1, true, '10.0.0.1');
    expect(connections.setWatch).toHaveBeenCalledWith(1, true);
    expect(audit.writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'wanderer.watch_enabled' }));
    await setup().service.setWatch(1, false, null);
    expect(connections.setWatch).toHaveBeenLastCalledWith(1, false);
    expect(audit.writeAudit).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'wanderer.watch_disabled' }));
  });

  it('WAND-SVC-022: lists the watchable users and notes a run as given', async () => {
    const { service, connections } = setup(savedRow());
    expect(await service.watchableUserIds('2026-10-19 10:00:00', 5)).toEqual([3, 4]);
    expect(connections.listWatchable).toHaveBeenCalledWith('2026-10-19 10:00:00', 5);
    const run = { lastRunAt: '2026-10-19 10:00:00', failures: 0, pausedUntil: null };
    await service.noteWatchRun(1, run);
    expect(connections.recordWatchRun).toHaveBeenCalledWith(1, run);
  });

  it('WAND-SVC-023: reads each trail record once, never a GPX, and calls the gone ones gone', async () => {
    const { service, client } = setup(savedRow());
    client.trail.mockImplementation(async (_creds: unknown, id: string) => {
      if (id === 'deleted') throw new WandererError('not_found', 'gone');
      if (id === 'hidden') throw new WandererError('forbidden', 'no');
      if (id === 'theirs') return { id, name: 'Theirs', author: 'stranger' };
      return { id, name: 'Ridge', description: 'Up', updated: '2026-10-02', author: 'actor1' };
    });
    const read = await service.lookAtTrails(1, ['trail1', 'trail1', 'deleted', 'hidden', 'theirs']);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(Object.fromEntries(read.looks)).toEqual({
      trail1: { kind: 'record', name: 'Ridge', description: 'Up', updated: '2026-10-02' },
      deleted: { kind: 'gone' },
      hidden: { kind: 'gone' },
      theirs: { kind: 'gone' },
    });
    expect(client.trail).toHaveBeenCalledTimes(4);
    expect(client.gpx).not.toHaveBeenCalled();

    client.trail.mockResolvedValue({ id: 'bare', name: 'Bare', author: 'actor1' });
    const bare = await service.lookAtTrails(1, ['bare']);
    expect(bare.ok && bare.looks.get('bare')).toEqual({
      kind: 'record',
      name: 'Bare',
      description: null,
      updated: null,
    });
  });

  it('WAND-SVC-024: a failing instance ends the look with its reason, and a refused token is noted', async () => {
    const { service, client, connections } = setup(savedRow());
    client.trail.mockRejectedValue(new WandererError('unreachable', 'down'));
    expect(await service.lookAtTrails(1, ['trail1'])).toEqual({ ok: false, code: 'unreachable' });
    expect(connections.recordCheck).not.toHaveBeenCalled();

    client.ownActors.mockRejectedValue(new WandererError('unauthorized', 'revoked'));
    expect(await service.lookAtTrails(1, ['trail1'])).toEqual({ ok: false, code: 'unauthorized' });
    expect(connections.recordCheck).toHaveBeenCalledWith(1, false, 'unauthorized');

    client.ownActors.mockRejectedValue(new Error('bug'));
    await expect(service.lookAtTrails(1, ['trail1'])).rejects.toThrow('bug');
    expect((await refusal(setup().service.lookAtTrails(1, ['trail1']))).getStatus()).toBe(409);
  });
});
