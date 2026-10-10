import { db as testDb } from '../../../../src/db/database';
import { DocumentConnections } from '../../../../src/db/entities/DocumentConnections.entity';
import { DocumentProviders } from '../../../../src/db/entities/DocumentProviders.entity';
import { DocumentSyncItems } from '../../../../src/db/entities/DocumentSyncItems.entity';
import { TripDocumentLinks } from '../../../../src/db/entities/TripDocumentLinks.entity';
import { TripFiles } from '../../../../src/db/entities/TripFiles.entity';
import { TripMembers } from '../../../../src/db/entities/TripMembers.entity';
import { DocSyncConfigService } from '../../../../src/nest/doc-sync/doc-sync-config.service';
import type { LinkRow } from '../../../../src/nest/doc-sync/doc-sync-config.service';
import { DocSyncController } from '../../../../src/nest/doc-sync/doc-sync.controller';
import type {
  DocsyncConnectionDto,
  DocsyncConnectionTestDto,
  DocsyncLinkDto,
} from '../../../../src/nest/doc-sync/doc-sync.dto';
import type { DocSyncService } from '../../../../src/nest/doc-sync/doc-sync.service';
import type {
  DocumentConnectionRef,
  DocumentProvider,
  DocumentScopeRef,
} from '../../../../src/nest/doc-sync/document-provider';
import { DocumentProviderRegistry } from '../../../../src/nest/doc-sync/document-provider.registry';
import type { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import type { User } from '../../../../src/types';
import {
  createTestDocumentConnectionsRepo,
  createTestDocumentProviderFieldsRepo,
  createTestDocumentProvidersRepo,
  createTestDocumentSyncItemsRepo,
  createTestTripDocumentLinksRepo,
} from '../../../helpers/doc-sync-repos';
import { createTrip, createUser } from '../../../helpers/factories';
import { deleteRows, findRow, insertRow, updateRows } from '../../../helpers/factories/rows';
import { addTripMember } from '../../../helpers/factories/trips';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createTestUnitOfWork, createTestTripsRepo } from '../../../helpers/test-uow';
import { HttpException, Logger } from '@nestjs/common';

import type { Request } from 'express';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

/**
 * DocSyncController built with `new`, against a real in-memory SQLite.
 *
 * The guards are e2e's job (tests/e2e/doc-sync.e2e.test.ts drives the real
 * AddonGuard, JwtAuthGuard and TripAccessGuard). What is left here is what the
 * handler itself decides once a request is through the door, and all of it is
 * the kind that would be expensive to notice late: who counts as the owner, a
 * form field that must not lose a secret it never saw, and a webhook whose
 * callback URL is derived from the request rather than from configuration.
 *
 * The config service and the provider registry are the real ones: the merge
 * this file pins runs through actual encryption and actual provider-field rows,
 * and a stub of either would only be a restatement of the controller. The
 * reconciler is a spy: a run is a side effect here, not the subject.
 */

vi.mock('../../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
});

/**
 * The SSRF guard resolves DNS, and none of these hostnames exist. It is not
 * what this file tests, and a suite that needs a resolver is a suite that fails
 * on a train.
 */
const { checkSsrf } = vi.hoisted(() => ({
  checkSsrf: vi.fn(async (url: string) => ({
    allowed: !url.includes('blocked.invalid'),
    isPrivate: false,
    error: url.includes('blocked.invalid') ? 'blocked in test' : undefined,
  })),
}));
vi.mock('../../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/utils/ssrfGuard')>()),
  checkSsrf,
}));

const CAPS = {
  push: 'webhook-self-registered' as const,
  stableId: true,
  remoteTrash: true,
  replaceInPlace: true,
  contentHashInListing: true,
  maxUploadBytes: null,
  acceptedMimeTypes: null,
  canCreateScope: true,
};

function fakeProvider(id: string) {
  return {
    id,
    capabilities: () => CAPS,
    probe: vi.fn(async (_conn: DocumentConnectionRef) => ({
      success: true as const,
      data: { account: `${id}-account`, capabilities: CAPS },
    })),
    listScopes: vi.fn(async (_conn: DocumentConnectionRef, _query?: string) => ({ success: true as const, data: [] })),
    createScope: vi.fn(async () => ({ success: false as const, error: { code: 'provider_error' as const } })),
    resolveScope: vi.fn(async () => ({ success: false as const, error: { code: 'not_found' as const } })),
    list: vi.fn(async () => ({
      success: true as const,
      data: { documents: [], cursor: null, cursorUnchanged: false, truncated: false },
    })),
    fetch: vi.fn(async () => ({ success: false as const, error: { code: 'not_found' as const } })),
    push: vi.fn(async () => ({ success: false as const, error: { code: 'not_found' as const } })),
    rename: vi.fn(async () => ({ success: true as const, data: { remoteVersion: 'v2' } })),
    trash: vi.fn(async () => ({ success: true as const, data: undefined })),
    registerWebhook: vi.fn(
      async (_conn: DocumentConnectionRef, _scope: DocumentScopeRef, _callbackUrl: string, _secret: string) => ({
        success: true as const,
        data: { subscriptionId: 'sub-7' },
      }),
    ),
    unregisterWebhook: vi.fn(async (_conn: DocumentConnectionRef, _subscriptionId: string) => ({
      success: true as const,
      data: undefined,
    })),
  };
}

const paperless = fakeProvider('paperless');
const nextcloud = fakeProvider('nextcloud');

const sync = {
  syncLink: vi.fn(async (_link: LinkRow, _opts?: { full?: boolean }) => ({
    state: 'ok',
    pulled: 0,
    pushed: 0,
    conflicts: 0,
    missing: 0,
  })),
  retryShelvedItems: vi.fn((_linkId: number) => {}),
  isSwitchedOff: vi.fn((_link: LinkRow) => false),
  status: vi.fn(() => ({ links: [], items: {} })),
  resolveConflict: vi.fn(async () => true),
  // R2 (DSCTRL4/DSCTRL5, moved off the controller onto DocSyncService) — a
  // real read against this file's own testDb, not a stub: "the document
  // list" describe block below is testing the join/trip-scoping SHAPE this
  // method now owns, and a canned return would only restate the assertion.
  // It answers through the same two repository reads DocSyncService makes.
  itemsForTrip: vi.fn(async (tripId: number, state?: string) => {
    const items = await createTestDocumentSyncItemsRepo(testDb);
    return state ? items.listForTripByState(tripId, state) : items.listForTrip(tripId);
  }),
};

const registry = new DocumentProviderRegistry([paperless, nextcloud] as unknown as DocumentProvider[]);
const realtime = { broadcast: vi.fn() };
// Built in beforeAll: DocSyncConfigService now takes a UnitOfWork, and
// createTestUnitOfWork is async — module-scope construction cannot await it.
let config: DocSyncConfigService;
let controller: DocSyncController;
let t: TestOrm;

/** Only what publicOrigin reads: header lookup plus the connection's own scheme. */
function makeReq(headers: Record<string, string> = {}, protocol = 'http'): Request {
  return {
    protocol,
    headers,
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

function connBody(over: Partial<DocsyncConnectionDto> = {}): DocsyncConnectionDto {
  return {
    providerId: 'paperless',
    baseUrl: 'https://paperless.example.com',
    credentials: {},
    allowInsecureTls: false,
    ...over,
  } as DocsyncConnectionDto;
}

function linkBody(connectionId: number, over: Partial<DocsyncLinkDto> = {}): DocsyncLinkDto {
  return {
    connectionId,
    scopeKey: 'tag:1',
    remoteRootId: '1',
    remoteRootPath: '/TREK/japan',
    remoteLabel: 'Japan 2026',
    direction: 'both',
    deletePolicy: 'unlink',
    conflictPolicy: 'manual',
    syncEnabled: true,
    ...over,
  } as DocsyncLinkDto;
}

async function thrown(fn: () => unknown): Promise<HttpException> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    return err as HttpException;
  }
  throw new Error('expected the handler to throw');
}

let owner: User;
let member: User;
let admin: User;
let tripId: number;
let otherTripId: number;

beforeAll(async () => {
  // L1 (Plan 3h Task 7 review): createLink's fire-and-forget syncLink call
  // is now wrapped in its own withRequestContext fork, which needs a real
  // MikroORM instance — sync itself stays a spy, this ORM never resolves a
  // repository through it.
  t = await createTestOrm(testDb);
  config = new DocSyncConfigService(
    await createTestTripsRepo(testDb),
    await createTestDocumentProvidersRepo(testDb),
    await createTestDocumentProviderFieldsRepo(testDb),
    await createTestDocumentConnectionsRepo(testDb),
    await createTestTripDocumentLinksRepo(testDb),
    await createTestDocumentSyncItemsRepo(testDb),
    registry,
    await createTestUnitOfWork(testDb),
  );
  controller = new DocSyncController(
    config,
    sync as unknown as DocSyncService,
    registry,
    realtime as unknown as RealtimeService,
    t.orm,
  );
  const o = createUser(testDb, { username: 'owner', email: 'owner@test.local' }).user;
  const m = createUser(testDb, { username: 'member', email: 'member@test.local' }).user;
  const a = createUser(testDb, { username: 'admin', email: 'admin@test.local', role: 'admin' }).user;
  owner = { id: o.id, role: 'user' } as User;
  member = { id: m.id, role: 'user' } as User;
  admin = { id: a.id, role: 'admin' } as User;
  tripId = createTrip(testDb, o.id, { title: 'Japan' }).id;
  otherTripId = createTrip(testDb, m.id, { title: 'Norway' }).id;
  await addTripMember(t, tripId, m.id);
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

beforeEach(async () => {
  await deleteRows(t, DocumentSyncItems);
  await deleteRows(t, TripDocumentLinks);
  await deleteRows(t, DocumentConnections);
  await deleteRows(t, TripFiles);
  // Providers ship switched off; these three are what the cases below need.
  await updateRows(t, DocumentProviders, {}, { enabled: 0 });
  await updateRows(t, DocumentProviders, { id: { $in: ['paperless', 'nextcloud', 'papra'] } }, { enabled: 1 });
  vi.clearAllMocks();
});

async function storedPaperless(credentials: Record<string, string> = { api_token: 'stored-token' }) {
  const res = await config.upsertConnection(tripId, Number(owner.id), connBody({ credentials }));
  if ('error' in res) throw new Error(`fixture failed: ${res.error.code} ${res.error.detail ?? ''}`);
  return res.data;
}

describe('who may change a trip binding', () => {
  it('lets the trip owner through', async () => {
    await expect(controller.resolve(String(tripId), '1', owner, { keep: 'trek' })).resolves.toEqual({ success: true });
  });

  it('lets an instance admin through on a trip they neither own nor joined', async () => {
    await expect(controller.resolve(String(otherTripId), '1', admin, { keep: 'trek' })).resolves.toEqual({
      success: true,
    });
  });

  it('refuses a plain member with the message the client renders', async () => {
    const err = await thrown(() => controller.resolve(String(tripId), '1', member, { keep: 'trek' }));
    expect(err.getStatus()).toBe(403);
    expect(err.message).toBe('Only the trip owner can change document sync');
  });

  it('answers 404 for a trip that does not exist, rather than the 403 that would confirm it', async () => {
    const err = await thrown(() => controller.resolve('999999', '1', member, { keep: 'trek' }));
    expect(err.getStatus()).toBe(404);
    expect(err.message).toBe('Trip not found');
  });
});

describe('providers', () => {
  it('reports an enabled provider with no registered adapter as unavailable instead of hiding it', async () => {
    const rows = (await controller.providers()) as Array<{ id: string; available: boolean }>;
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.available]));
    // papra is switched on in the DB, but no adapter is registered in this suite.
    expect(byId.papra).toBe(false);
    expect(byId.paperless).toBe(true);
    expect(byId.nextcloud).toBe(true);
  });

  it('hands the form flags to the client as booleans rather than the 0/1 the column stores', async () => {
    const rows = (await controller.providers()) as Array<{
      id: string;
      fields: Array<{ field_key: string; secret: boolean; required: boolean }>;
    }>;
    const fields = rows.find((r) => r.id === 'paperless')!.fields;
    const token = fields.find((f) => f.field_key === 'api_token')!;
    expect(token.secret).toBe(true);
    expect(token.required).toBe(true);
    expect(fields.find((f) => f.field_key === 'allow_insecure_tls')!.secret).toBe(false);
  });
});

describe('storing a connection', () => {
  it('hands the stored connection back with the secret masked instead of echoed', async () => {
    const res = (await controller.upsertConnection(
      String(tripId),
      owner,
      connBody({ credentials: { api_token: 'super-secret' } }),
    )) as { id: number; secrets: Record<string, string> };

    expect(res.secrets.api_token).not.toContain('super-secret');

    const listed = (await controller.listConnections(String(tripId))) as Array<{
      id: number;
      secrets: Record<string, string>;
    }>;
    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe(res.id);
    // The list is what the form renders from, so the secret must not survive
    // the round trip either.
    expect(listed[0].secrets.api_token).not.toContain('super-secret');
  });

  it('refuses a base URL the SSRF guard turns down', async () => {
    const err = await thrown(() =>
      controller.upsertConnection(String(tripId), owner, connBody({ baseUrl: 'https://blocked.invalid' })),
    );
    expect(err.getStatus()).toBe(400);
    expect(await config.listConnections(tripId)).toHaveLength(0);
  });

  it('refuses to point the stored secret at another server when the form leaves it blank', async () => {
    // The probe route had this rule; the save route let an instance admin, or
    // whoever the trip was handed to, redirect the owner's token to a host of
    // their own with an empty form.
    const conn = await storedPaperless();
    const err = await thrown(() =>
      controller.upsertConnection(
        String(tripId),
        admin,
        connBody({ baseUrl: 'https://elsewhere.example', credentials: {} }),
      ),
    );
    expect(err.getStatus()).toBe(400);
    expect((await config.getConnection(conn.id))!.base_url).toBe('https://paperless.example.com');
    expect((await config.getConnection(conn.id))!.owner_user_id).toBe(Number(owner.id));
  });

  it('refuses a provider the instance admin has not switched on, and names it', async () => {
    await updateRows(t, DocumentProviders, { id: 'papra' }, { enabled: 0 });
    const err = await thrown(() =>
      controller.upsertConnection(
        String(tripId),
        owner,
        connBody({ providerId: 'papra', credentials: { api_key: 'k', organization_id: 'org_1' } }),
      ),
    );
    expect(err.getStatus()).toBe(400);
    expect(err.message).toBe('Provider: "papra" is not enabled, contact server administrator');
  });
});

describe('probing form values', () => {
  it('keeps the stored secret when the form leaves the field blank', async () => {
    await storedPaperless();
    await controller.testConnection(
      String(tripId),
      owner,
      connBody({ credentials: { api_token: '' } }) as DocsyncConnectionTestDto,
    );
    expect(paperless.probe.mock.calls[0][0]).toMatchObject({ secrets: { api_token: 'stored-token' } });
  });

  it('takes a freshly typed secret over the stored one', async () => {
    await storedPaperless();
    await controller.testConnection(
      String(tripId),
      owner,
      connBody({ credentials: { api_token: 'typed-now' } }) as DocsyncConnectionTestDto,
    );
    expect(paperless.probe.mock.calls[0][0]).toMatchObject({ secrets: { api_token: 'typed-now' } });
  });

  it('keeps a stored non-secret setting the form did not resend', async () => {
    const res = await config.upsertConnection(
      tripId,
      Number(owner.id),
      connBody({
        providerId: 'nextcloud',
        baseUrl: 'https://cloud.example.com',
        credentials: { login_name: 'alice', app_password: 'app-pw', base_path: '/TREK' },
      }),
    );
    expect('error' in res).toBe(false);

    await controller.testConnection(
      String(tripId),
      owner,
      connBody({
        providerId: 'nextcloud',
        baseUrl: 'https://cloud.example.com',
        credentials: { app_password: '' },
      }) as DocsyncConnectionTestDto,
    );

    expect(nextcloud.probe.mock.calls[0][0]).toMatchObject({
      settings: { login_name: 'alice', base_path: '/TREK' },
      secrets: { app_password: 'app-pw' },
    });
  });

  it('takes a freshly typed setting over the stored one', async () => {
    const res = await config.upsertConnection(
      tripId,
      Number(owner.id),
      connBody({
        providerId: 'nextcloud',
        baseUrl: 'https://cloud.example.com',
        credentials: { login_name: 'alice', app_password: 'app-pw' },
      }),
    );
    expect('error' in res).toBe(false);

    await controller.testConnection(
      String(tripId),
      owner,
      connBody({
        providerId: 'nextcloud',
        baseUrl: 'https://cloud.example.com',
        credentials: { login_name: 'bob' },
      }) as DocsyncConnectionTestDto,
    );

    expect(nextcloud.probe.mock.calls[0][0]).toMatchObject({ settings: { login_name: 'bob' } });
  });

  it('answers with a body instead of throwing when no adapter is registered', async () => {
    await expect(
      controller.testConnection(
        String(tripId),
        owner,
        connBody({ providerId: 'papra', credentials: { api_key: 'k' } }) as DocsyncConnectionTestDto,
      ),
    ).resolves.toEqual({ connected: false, error: 'unknown_provider' });
  });

  it('answers with a body instead of throwing when the URL is refused', async () => {
    await expect(
      controller.testConnection(
        String(tripId),
        owner,
        connBody({ baseUrl: 'https://blocked.invalid' }) as DocsyncConnectionTestDto,
      ),
    ).resolves.toEqual({ connected: false, error: 'ssrf_blocked' });
    expect(paperless.probe).not.toHaveBeenCalled();
  });

  it('answers with a body instead of throwing when the provider rejects the credentials', async () => {
    paperless.probe.mockResolvedValueOnce({
      success: false,
      error: { code: 'unauthorized', detail: 'token expired' },
    } as never);
    await expect(
      controller.testConnection(
        String(tripId),
        owner,
        connBody({ credentials: { api_token: 'nope' } }) as DocsyncConnectionTestDto,
      ),
    ).resolves.toEqual({ connected: false, error: 'unauthorized', detail: 'token expired' });
  });

  it('writes a successful probe onto the stored connection, so the status panel has something to show', async () => {
    const conn = await storedPaperless();
    await controller.testConnection(
      String(tripId),
      owner,
      connBody({ credentials: { api_token: '' } }) as DocsyncConnectionTestDto,
    );
    const row = (await config.getConnection(conn.id))!;
    expect(row.last_probe_state).toBe('ok');
    expect(JSON.parse(row.capabilities!)).toMatchObject({ push: 'webhook-self-registered' });
  });

  it('leaves no probe record behind when the form values belong to no stored connection yet', async () => {
    await controller.testConnection(
      String(tripId),
      owner,
      connBody({ credentials: { api_token: 'first-try' } }) as DocsyncConnectionTestDto,
    );
    expect(await config.listConnections(tripId)).toHaveLength(0);
    expect(paperless.probe.mock.calls[0][0]).toMatchObject({ connectionId: 0, secrets: { api_token: 'first-try' } });
  });
});

describe('a secret the adapter earned itself', () => {
  const EARNED = 'a1b2c3:DEVICE-SECRET';

  it('is in neither connection payload the form is rendered from', async () => {
    await updateRows(t, DocumentProviders, { id: 'synologydrive' }, { enabled: 1 });
    const nas = connBody({
      providerId: 'synologydrive',
      baseUrl: 'https://nas.example.com:5001',
      credentials: { username: 'anna', password: 'nas-pw' },
    });
    const created = (await controller.upsertConnection(String(tripId), owner, nas)) as { id: number };
    await config.saveEarnedSecret(created.id, 'device_token', EARNED);

    const listed = JSON.stringify(await controller.listConnections(String(tripId)));
    const edited = JSON.stringify(
      await controller.upsertConnection(String(tripId), owner, {
        ...nas,
        credentials: { username: 'anna', password: 'rotated' },
      }),
    );
    for (const payload of [listed, edited]) {
      expect(payload).not.toContain('DEVICE-SECRET');
      expect(payload).not.toContain('device_token');
    }
    expect(config.toRef((await config.getConnection(created.id))!).secrets.device_token).toBe(EARNED);
  });

  it('reaches a probe of the saved form, which gets no way to write', async () => {
    const conn = await storedPaperless();
    await config.saveEarnedSecret(conn.id, 'device_token', EARNED);
    const res = await controller.testConnection(
      String(tripId),
      owner,
      connBody({ credentials: { api_token: '' } }) as DocsyncConnectionTestDto,
    );

    const ref = paperless.probe.mock.calls[0][0];
    // The row as well as its id: together they are where the saved connection keeps its device token.
    expect(ref).toMatchObject({ connectionId: conn.id, createdAt: conn.created_at, secrets: { device_token: EARNED } });
    expect(ref.createdAt).not.toBe('');
    expect(ref.saveSecret).toBeUndefined();
    expect(JSON.stringify(res)).not.toContain('DEVICE-SECRET');
  });

  it('gives a probe of an unsaved form no way to write either', async () => {
    await controller.testConnection(
      String(tripId),
      owner,
      connBody({ credentials: { api_token: 'first-try' } }) as DocsyncConnectionTestDto,
    );
    const ref = paperless.probe.mock.calls[0][0];
    expect(ref.connectionId).toBe(0);
    expect(ref.createdAt).toBe('');
    expect(ref.saveSecret).toBeUndefined();
  });
});

describe('reading the trip state', () => {
  it('asks the reconciler with a number, because the path hands the handler a string', async () => {
    await controller.status(String(tripId));
    expect(sync.status).toHaveBeenCalledWith(tripId);
  });
});

describe('removing a connection', () => {
  it('unbinds without touching the documents that came through it', async () => {
    const conn = await storedPaperless();
    const fileId = await insertRow(t, TripFiles, {
      trip: tripId,
      filename: 'stored.pdf',
      original_name: 'boarding.pdf',
    });

    await expect(controller.deleteConnection(String(tripId), String(conn.id), owner)).resolves.toEqual({
      success: true,
    });
    expect(await config.getConnection(conn.id)).toBeUndefined();
    expect(await findRow(t, TripFiles, { id: fileId })).toBeTruthy();
  });

  it('takes down every subscription TREK registered for its bindings, before the credential goes', async () => {
    // The bindings cascade away with the connection, and the rows were the
    // only record of the Paperless workflows and Nextcloud listeners TREK had
    // set up: left standing, they keep posting to a token that answers
    // nothing, for good. Unbinding one binding already did this.
    const conn = await storedPaperless();
    const first = (await controller.createLink(
      String(tripId),
      owner,
      linkBody(conn.id, { scopeKey: 'tag:1' }),
      makeReq({ host: 'trek.example' }),
    )) as { id: number };
    paperless.registerWebhook.mockResolvedValueOnce({ success: true, data: { subscriptionId: 'sub-8' } } as never);
    await controller.createLink(
      String(tripId),
      owner,
      linkBody(conn.id, { scopeKey: 'tag:2' }),
      makeReq({ host: 'trek.example' }),
    );
    // One that never got a subscription, which must not be unregistered as ''.
    await controller.createLink(String(tripId), owner, linkBody(conn.id, { scopeKey: 'tag:3' }), makeReq());
    paperless.unregisterWebhook.mockClear();

    await controller.deleteConnection(String(tripId), String(conn.id), owner);

    expect(paperless.unregisterWebhook.mock.calls.map((c) => c[1]).sort()).toEqual(['sub-7', 'sub-8']);
    expect(paperless.unregisterWebhook.mock.calls[0][0]).toMatchObject({
      connectionId: conn.id,
      secrets: { api_token: 'stored-token' },
    });
    expect(await config.getConnection(conn.id)).toBeUndefined();
    expect(await config.getLink(first.id)).toBeUndefined();
  });

  it('still unbinds when the provider refuses to take a subscription down', async () => {
    const conn = await storedPaperless();
    await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq({ host: 'trek.example' }));
    paperless.unregisterWebhook.mockResolvedValueOnce({ success: false, error: { code: 'unreachable' } } as never);

    await expect(controller.deleteConnection(String(tripId), String(conn.id), owner)).resolves.toEqual({
      success: true,
    });
    expect(await config.getConnection(conn.id)).toBeUndefined();
  });

  it('refuses a connection that belongs to a different trip', async () => {
    const conn = await storedPaperless();
    const err = await thrown(() => controller.deleteConnection(String(otherTripId), String(conn.id), admin));
    expect(err.getStatus()).toBe(404);
    expect(await config.getConnection(conn.id)).toBeTruthy();
    expect(realtime.broadcast).not.toHaveBeenCalled();
  });

  it('pings the trip once for every binding that went with it, and for no other', async () => {
    const conn = await storedPaperless();
    const cloud = await config.upsertConnection(
      tripId,
      Number(owner.id),
      connBody({
        providerId: 'nextcloud',
        baseUrl: 'https://cloud.example.com',
        credentials: { login_name: 'alice', app_password: 'app-pw', base_path: '/TREK' },
      }),
    );
    if ('error' in cloud) throw new Error(`fixture failed: ${cloud.error.code}`);
    const bind = async (connectionId: number, scopeKey: string) => {
      const res = await config.createLink(tripId, Number(owner.id), linkBody(connectionId, { scopeKey }));
      if ('error' in res) throw new Error(`fixture failed: ${res.error.code}`);
      return res.data.id;
    };
    const first = await bind(conn.id, 'tag:1');
    const second = await bind(conn.id, 'tag:2');
    await bind(cloud.data.id, 'folder:1');

    await controller.deleteConnection(String(tripId), String(conn.id), owner);

    expect(realtime.broadcast.mock.calls).toEqual([
      [tripId, 'docsync:changed', { linkId: first, pulled: 0, pushed: 0 }],
      [tripId, 'docsync:changed', { linkId: second, pulled: 0, pushed: 0 }],
    ]);
  });
});

describe('the scope picker', () => {
  it('passes the search text to the adapter and hands back what it offers', async () => {
    const conn = await storedPaperless();
    paperless.listScopes.mockResolvedValueOnce({
      success: true,
      data: [{ scopeKey: 'tag:1', label: 'Japan 2026', remoteRootId: '1', remoteRootPath: '/TREK/japan' }],
    } as never);

    const res = await controller.listScopes(String(tripId), String(conn.id), owner, 'japan');

    expect(paperless.listScopes.mock.calls[0][1]).toBe('japan');
    expect(res).toMatchObject({ scopes: [{ scopeKey: 'tag:1' }] });
  });

  it('reports a provider failure in the body, so the picker can say why it is empty', async () => {
    const conn = await storedPaperless();
    paperless.listScopes.mockResolvedValueOnce({ success: false, error: { code: 'unauthorized' } } as never);
    await expect(controller.listScopes(String(tripId), String(conn.id), owner)).resolves.toEqual({
      scopes: [],
      error: 'unauthorized',
    });
  });

  it('refuses a connection whose provider has no adapter on this instance', async () => {
    const id = await insertRow(t, DocumentConnections, {
      trip: tripId,
      provider: 'papra',
      ownerUser: Number(owner.id),
      base_url: 'https://papra.example.com',
    });
    const err = await thrown(() => controller.listScopes(String(tripId), String(id), owner));
    expect(err.getStatus()).toBe(400);
    expect(err.message).toBe('Provider not available');
  });

  it('refuses a connection that belongs to a different trip', async () => {
    const conn = await storedPaperless();
    const err = await thrown(() => controller.listScopes(String(otherTripId), String(conn.id), admin));
    expect(err.getStatus()).toBe(404);
    expect(paperless.listScopes).not.toHaveBeenCalled();
  });

  it('hands back the container the adapter created', async () => {
    const conn = await storedPaperless();
    paperless.createScope.mockResolvedValueOnce({
      success: true,
      data: { scopeKey: 'tag:9', label: 'Norway', remoteRootId: '9', remoteRootPath: '/TREK/norway' },
    } as never);

    await expect(
      controller.createScope(String(tripId), String(conn.id), owner, { name: 'Norway' }),
    ).resolves.toMatchObject({ scopeKey: 'tag:9', label: 'Norway' });
    expect(paperless.createScope).toHaveBeenCalledWith(expect.objectContaining({ connectionId: conn.id }), 'Norway');
  });

  it('creates nothing through a connection that belongs to a different trip', async () => {
    // The connection comes from the path and nowhere else, so the path is what
    // has to match the trip the caller was admitted to.
    const conn = await storedPaperless();
    const err = await thrown(() =>
      controller.createScope(String(otherTripId), String(conn.id), admin, { name: 'Norway' }),
    );
    expect(err.getStatus()).toBe(404);
    expect(paperless.createScope).not.toHaveBeenCalled();
  });

  it('turns a refused creation into a 400 carrying the provider code', async () => {
    const conn = await storedPaperless();
    paperless.createScope.mockResolvedValueOnce({ success: false, error: { code: 'forbidden' } } as never);
    const err = await thrown(() => controller.createScope(String(tripId), String(conn.id), owner, { name: 'Norway' }));
    expect(err.getStatus()).toBe(400);
    expect(err.message).toBe('forbidden');
  });
});

describe('creating a binding', () => {
  it('subscribes at the provider and remembers the subscription id', async () => {
    const conn = await storedPaperless();
    const link = (await controller.createLink(
      String(tripId),
      owner,
      linkBody(conn.id),
      makeReq({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'trek.example' }),
    )) as { id: number };

    const row = (await config.getLink(link.id))!;
    expect(row.webhook_subscription_id).toBe('sub-7');
    expect(paperless.registerWebhook.mock.calls[0][2]).toBe(
      `https://trek.example/api/docsync/webhook/${row.webhook_token}`,
    );
    // The secret handed to the provider is the plaintext one, not the stored blob.
    expect(paperless.registerWebhook.mock.calls[0][3]).toBe(config.webhookSecret(row));
  });

  it('keeps the binding when the provider refuses the subscription, because polling still carries it', async () => {
    const conn = await storedPaperless();
    paperless.registerWebhook.mockResolvedValueOnce({ success: false, error: { code: 'forbidden' } } as never);

    const link = (await controller.createLink(
      String(tripId),
      owner,
      linkBody(conn.id),
      makeReq({ 'x-forwarded-host': 'trek.example' }),
    )) as { id: number; syncEnabled: boolean };

    const row = (await config.getLink(link.id))!;
    expect(row.webhook_subscription_id).toBeNull();
    expect(row.sync_enabled).toBe(1);
  });

  it('says so in the log when the provider refuses the subscription, since nothing on screen will', async () => {
    // The refusal used to go nowhere at all: not thrown, not logged, and the
    // first run overwrites the link state a moment later. An admin whose
    // Paperless kept declining the workflow had no way to find out why the
    // binding only ever ran on the timer.
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    try {
      const conn = await storedPaperless();
      paperless.registerWebhook.mockResolvedValueOnce({
        success: false,
        error: { code: 'forbidden', detail: 'API key may not manage workflows' },
      } as never);

      const link = (await controller.createLink(
        String(tripId),
        owner,
        linkBody(conn.id),
        makeReq({ host: 'trek.example' }),
      )) as { id: number };

      const lines = warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes(`link ${link.id}`));
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('forbidden');
      expect(lines[0]).toContain('API key may not manage workflows');
    } finally {
      warn.mockRestore();
    }
  });

  it('does not offer a webhook when no host reaches TREK', async () => {
    const conn = await storedPaperless();
    const link = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      webhookUrl: string | null;
    };
    expect(paperless.registerWebhook).not.toHaveBeenCalled();
    expect(link.webhookUrl).toBeNull();
  });

  it('starts a first run at once instead of letting the user wait out a poll interval', async () => {
    const conn = await storedPaperless();
    await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq({ host: 'trek.example' }));
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
    expect(sync.syncLink.mock.calls[0][1]).toEqual({ full: true });
  });

  it('pings the whole trip, so a member already on the Files tab gets the sync button', async () => {
    const conn = await storedPaperless();
    const link = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as { id: number };

    // Three arguments: no socket is skipped, the owner's own button reads it too.
    expect(realtime.broadcast).toHaveBeenCalledWith(tripId, 'docsync:changed', {
      linkId: link.id,
      pulled: 0,
      pushed: 0,
    });
  });

  it('refuses a binding for a connection that belongs to a different trip', async () => {
    const conn = await storedPaperless();
    const err = await thrown(() =>
      controller.createLink(String(otherTripId), admin, linkBody(conn.id), makeReq({ host: 'trek.example' })),
    );
    expect(err.getStatus()).toBe(400);
    expect(sync.syncLink).not.toHaveBeenCalled();
    expect(realtime.broadcast).not.toHaveBeenCalled();
  });
});

describe('changing a binding', () => {
  it('writes only the fields the request carried', async () => {
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };

    const res = (await controller.updateLink(
      String(tripId),
      String(created.id),
      owner,
      { syncEnabled: false },
      makeReq(),
    )) as {
      syncEnabled: boolean;
      direction: string;
      remoteLabel: string;
    };

    expect(res.syncEnabled).toBe(false);
    expect(res.direction).toBe('both');
    expect(res.remoteLabel).toBe('Japan 2026');
  });

  it('refuses a link that belongs to a different trip', async () => {
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };
    const err = await thrown(() =>
      controller.updateLink(String(otherTripId), String(created.id), admin, { syncEnabled: false }, makeReq()),
    );
    expect(err.getStatus()).toBe(404);
    expect((await config.getLink(created.id))!.sync_enabled).toBe(1);
  });
});

describe('a manual run', () => {
  it('passes the full flag through to the reconciler', async () => {
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };
    sync.syncLink.mockClear();

    await controller.syncNow(String(tripId), String(created.id), { full: true });

    expect(sync.syncLink.mock.calls[0][0]).toMatchObject({ id: created.id });
    expect(sync.syncLink.mock.calls[0][1]).toEqual({ full: true });
  });

  it('refuses a link that belongs to a different trip', async () => {
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };
    sync.syncLink.mockClear();

    const err = await thrown(() => controller.syncNow(String(otherTripId), String(created.id), { full: false }));
    expect(err.getStatus()).toBe(404);
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('refuses a binding an admin switched off with a code, and touches nothing', async () => {
    // A code rather than a sentence so the client can say it in the reader's
    // language; the MCP tool answers with the same one. Refused before the
    // shelved rows are cleared, so the binding resumes exactly as it was.
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };
    sync.syncLink.mockClear();
    sync.isSwitchedOff.mockReturnValueOnce(true);

    const err = await thrown(() => controller.syncNow(String(tripId), String(created.id), { full: false }));

    expect(err.getStatus()).toBe(409);
    expect(err.getResponse()).toEqual({ error: 'provider_disabled' });
    expect(sync.isSwitchedOff.mock.calls[0][0]).toMatchObject({ id: created.id });
    expect(sync.retryShelvedItems).not.toHaveBeenCalled();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('refuses a paused binding whose owner left, although the sweep never marked it', async () => {
    const res = await config.upsertConnection(
      tripId,
      Number(member.id),
      connBody({ credentials: { api_token: 'member-token' } }),
    );
    if ('error' in res) throw new Error('fixture failed');
    const created = (await controller.createLink(
      String(tripId),
      owner,
      linkBody(res.data.id, { syncEnabled: false }),
      makeReq(),
    )) as { id: number };
    sync.syncLink.mockClear();
    await deleteRows(t, TripMembers, { trip: tripId, user: member.id });
    try {
      const err = await thrown(() => controller.syncNow(String(tripId), String(created.id), { full: false }));

      expect(err.getStatus()).toBe(409);
      expect(sync.retryShelvedItems).not.toHaveBeenCalled();
      expect(sync.syncLink).not.toHaveBeenCalled();
    } finally {
      await addTripMember(t, tripId, member.id);
    }
  });
});

describe('the document list', () => {
  async function seedItems() {
    const conn = await storedPaperless();
    const fileId = await insertRow(t, TripFiles, {
      trip: tripId,
      filename: 'stored.pdf',
      original_name: 'boarding.pdf',
    });
    const linkId = await insertRow(t, TripDocumentLinks, {
      trip: tripId,
      connection: conn.id,
      provider_id: 'paperless',
      remote_scope_key: 'tag:1',
    });
    const insert = (trip: number, file: number | null, trekDocUid: string, state: string) =>
      insertRow(t, DocumentSyncItems, { link: linkId, trip, file, trek_doc_uid: trekDocUid, state });
    await insert(tripId, fileId, 'uid-1', 'synced');
    await insert(tripId, null, 'uid-2', 'conflict');
    // Another trip's row, which must never appear in this trip's list.
    await insert(otherTripId, null, 'uid-3', 'conflict');
  }

  it('carries the local file name, so the list reads as documents rather than as ids', async () => {
    await seedItems();
    const rows = (await controller.items(String(tripId))) as Array<{ trek_doc_uid: string; file_name: string | null }>;
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.trek_doc_uid === 'uid-1')!.file_name).toBe('boarding.pdf');
  });

  it('narrows to one state when asked, and never leaves the trip', async () => {
    await seedItems();
    const rows = (await controller.items(String(tripId), 'conflict')) as Array<{ trek_doc_uid: string }>;
    expect(rows.map((r) => r.trek_doc_uid)).toEqual(['uid-2']);
  });
});

describe('resolving a conflict', () => {
  it('refuses an item that is not in conflict rather than pretending it did something', async () => {
    sync.resolveConflict.mockResolvedValueOnce(false);
    const err = await thrown(() => controller.resolve(String(tripId), '5', owner, { keep: 'provider' }));
    expect(err.getStatus()).toBe(400);
    expect(err.message).toBe('Item is not in conflict');
  });
});

describe('removing a binding', () => {
  it('unsubscribes at the provider and keeps both copies of the documents', async () => {
    const conn = await storedPaperless();
    const created = (await controller.createLink(
      String(tripId),
      owner,
      linkBody(conn.id),
      makeReq({ host: 'trek.example' }),
    )) as { id: number };
    const fileId = await insertRow(t, TripFiles, {
      trip: tripId,
      filename: 'stored.pdf',
      original_name: 'boarding.pdf',
    });
    await insertRow(t, DocumentSyncItems, {
      link: created.id,
      trip: tripId,
      file: fileId,
      trek_doc_uid: 'uid-1',
      state: 'synced',
    });

    const res = await controller.deleteLink(String(tripId), String(created.id), owner);

    expect(res).toEqual({ success: true, documentsKept: true });
    expect(paperless.unregisterWebhook.mock.calls[0][1]).toBe('sub-7');
    expect(await config.getLink(created.id)).toBeUndefined();
    expect(await findRow(t, TripFiles, { id: fileId })).toBeTruthy();
  });

  it('pings the trip that the binding is gone', async () => {
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };
    realtime.broadcast.mockClear();

    await controller.deleteLink(String(tripId), String(created.id), owner);

    expect(realtime.broadcast.mock.calls).toEqual([
      [tripId, 'docsync:changed', { linkId: created.id, pulled: 0, pushed: 0 }],
    ]);
  });

  it('refuses a link that belongs to a different trip', async () => {
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };
    realtime.broadcast.mockClear();
    const err = await thrown(() => controller.deleteLink(String(otherTripId), String(created.id), admin));
    expect(err.getStatus()).toBe(404);
    expect(await config.getLink(created.id)).toBeTruthy();
    expect(realtime.broadcast).not.toHaveBeenCalled();
  });
});

describe('the callback origin a provider is given', () => {
  async function linkedTrip() {
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };
    return (await config.getLink(created.id))!;
  }

  it('builds the callback URL from the forwarded proto and host', async () => {
    const row = await linkedTrip();
    const [link] = (await controller.listLinks(
      String(tripId),
      makeReq({ 'x-forwarded-proto': 'https', 'x-forwarded-host': 'docs.example' }),
    )) as Array<{ webhookUrl: string }>;
    expect(link.webhookUrl).toBe(`https://docs.example/api/docsync/webhook/${row.webhook_token}`);
  });

  it('takes the first hop when a proxy chain appends its own protocol', async () => {
    await linkedTrip();
    const [link] = (await controller.listLinks(
      String(tripId),
      makeReq({ 'x-forwarded-proto': 'https, http', 'x-forwarded-host': 'docs.example' }),
    )) as Array<{ webhookUrl: string }>;
    expect(link.webhookUrl).toMatch(/^https:\/\/docs\.example\//);
  });

  it('falls back to the Host header and the connection scheme when nothing is forwarded', async () => {
    await linkedTrip();
    const [link] = (await controller.listLinks(String(tripId), makeReq({ host: 'trek.lan:3001' }, 'http'))) as Array<{
      webhookUrl: string;
    }>;
    expect(link.webhookUrl).toMatch(/^http:\/\/trek\.lan:3001\//);
  });

  it('offers no callback URL when a proxy strips the host', async () => {
    await linkedTrip();
    const [link] = (await controller.listLinks(String(tripId), makeReq())) as Array<{ webhookUrl: string | null }>;
    expect(link.webhookUrl).toBeNull();
  });

  it('offers no callback URL for a store the probe found unable to call back at all', async () => {
    // Synology takes no webhook. Showing the address with "paste this into
    // your provider" next to it promised something there was nowhere to do.
    const row = await linkedTrip();
    await config.recordProbe(row.connection_id, 'ok', null, { ...CAPS, push: 'none' });
    const [link] = (await controller.listLinks(String(tripId), makeReq({ host: 'trek.example' }))) as Array<{
      webhookUrl: string | null;
    }>;
    expect(link.webhookUrl).toBeNull();
  });

  it('keeps offering it for a store the probe found able to take one', async () => {
    const row = await linkedTrip();
    await config.recordProbe(row.connection_id, 'ok', null, { ...CAPS, push: 'webhook-manual' });
    const [link] = (await controller.listLinks(String(tripId), makeReq({ host: 'trek.example' }))) as Array<{
      webhookUrl: string | null;
    }>;
    expect(link.webhookUrl).toBe(`http://trek.example/api/docsync/webhook/${row.webhook_token}`);
  });
});

/**
 * A manual run is also a request to try the given-up rows once more.
 *
 * The scheduler must never do this: the attempt limit exists precisely so a
 * document a provider refuses is not re-uploaded on every tick. A person
 * pressing the button is the signal that something changed.
 */
describe('a manual run and the shelved rows', () => {
  it('clears the attempt counters of the link it runs', async () => {
    const conn = await storedPaperless();
    const created = (await controller.createLink(String(tripId), owner, linkBody(conn.id), makeReq())) as {
      id: number;
    };
    sync.retryShelvedItems.mockClear();

    await controller.syncNow(String(tripId), String(created.id), { full: false });

    expect(sync.retryShelvedItems).toHaveBeenCalledWith(created.id);
  });

  it('does not clear them for a link the caller does not own', async () => {
    sync.retryShelvedItems.mockClear();
    await expect(controller.syncNow(String(tripId), '999999', { full: false })).rejects.toThrow();
    expect(sync.retryShelvedItems).not.toHaveBeenCalled();
  });
});

/**
 * The trip the route was authorised against is now passed on to the service.
 *
 * `assertCanManage` proves the caller may manage the trip in the URL and says
 * nothing about whether the item id in the path belongs to that trip: the id is
 * a plain integer, and nothing tied the two together. The check itself lives in
 * the service (where the row is), so what belongs here is that the trip reaches
 * it at all.
 */
describe('resolving a conflict carries its trip', () => {
  it('passes the trip from the URL to the service', async () => {
    sync.resolveConflict.mockClear();
    await controller.resolve(String(tripId), '42', owner, { keep: 'trek' } as never);
    expect(sync.resolveConflict).toHaveBeenCalledWith(42, 'trek', tripId);
  });
});
