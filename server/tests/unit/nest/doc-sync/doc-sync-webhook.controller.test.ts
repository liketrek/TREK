import type { DocSyncConfigService, LinkRow } from '../../../../src/nest/doc-sync/doc-sync-config.service';
import { DocSyncWebhookController } from '../../../../src/nest/doc-sync/doc-sync-webhook.controller';
import type { DocSyncService } from '../../../../src/nest/doc-sync/doc-sync.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm } from '../../../helpers/test-orm';

import crypto from 'crypto';
import type { Request } from 'express';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Nothing here touches SQLite; the stub keeps the import chain from opening a
// database and running 238 migrations for a handler that never queries one.
vi.mock('../../../../src/db/database', () => ({
  db: {},
  closeDb: () => {},
  reinitialize: () => {},
  getPlaceWithTags: () => null,
  canAccessTrip: () => undefined,
  isOwner: () => false,
}));

/**
 * The webhook endpoint, with both services stubbed.
 *
 * It is the only route in TREK a stranger on the internet can reach with a
 * guessed URL, so what matters is what it does NOT do: it never says whether a
 * token exists, never says whether a secret matched, and never acts on the
 * payload. Every case below therefore asserts two things: the answer, which is
 * always the same, and whether a run was scheduled, which is the only place the
 * decision is visible at all.
 *
 * The signature is computed here from a fixed id and timestamp, exactly as the
 * provider would. Timers are faked, because the endpoint now collects a burst
 * before it runs: providers fire once per document, and twenty files dropped
 * into a watched folder used to be twenty runs, nineteen of which the service
 * answered `busy` and threw away.
 */

const SECRET = 'M7dQ2vLp5rTn8kYw1xZc4bJh';

/**
 * A binding whose subscription TREK registered itself, so the provider was
 * handed the secret and is expected to present it. A binding pasted in by
 * hand has no subscription id; see the cases on that below.
 */
const link = (over: Partial<LinkRow> = {}): LinkRow => ({
  id: 4,
  trip_id: 1,
  connection_id: 2,
  provider_id: 'papra',
  remote_scope_key: 'tag:1',
  remote_root_id: '1',
  remote_root_path: '/TREK/japan',
  remote_label: 'Japan 2026',
  direction: 'both',
  delete_policy: 'unlink',
  conflict_policy: 'manual',
  sync_enabled: 1,
  webhook_token: 'tok-live',
  webhook_secret: 'enc:v1:whatever',
  webhook_subscription_id: 'sub-7',
  remote_cursor: null,
  last_sync_at: null,
  last_sync_state: 'never',
  last_sync_error: null,
  failure_count: 0,
  next_attempt_at: null,
  created_by: 1,
  created_at: '2026-09-01 08:00:00',
  updated_at: '2026-09-01 08:00:00',
  ...over,
});

const config = {
  getLinkByToken: vi.fn((token: string) => (token === 'tok-live' ? link() : undefined)),
  // Looked up again when the timer fires, so a binding switched off during the
  // window does not get one last run out of a stale row.
  getLink: vi.fn((id: number) => (id === 4 ? link() : undefined)),
  webhookSecret: vi.fn(() => SECRET),
};

const sync = {
  syncLink: vi.fn(async (_link: LinkRow) => ({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 })),
  // The Documents addon and the binding's provider, as one answer. What goes
  // into it is the service's business and tested there.
  isSwitchedOff: vi.fn((_link: LinkRow) => false),
  // DSWH1 (R2 — moved off this controller onto DocSyncService.isSyncEnabled):
  // the instance-wide kill switch, the same rule the job's own tick obeys.
  isSyncEnabled: vi.fn(() => true),
};

// R9's withRequestContext wrap needs a real MikroORM EntityManager to fork
// (RequestContext.create calls em.fork(...)) — a bare `{ em: {} }` double
// cannot satisfy that, so this file draws the same shared test ORM
// `StorageHealthNotifierService`'s own unit test uses for the identical
// reason (its class docstring: "these hand-built doubles pass the shared
// test ORM instead"). Nothing in this file's own assertions touches SQLite
// (`config`/`sync` are still full mocks), so no `createTables`/migrations
// beyond what `createSnapshotTestDb`'s cached snapshot already carries.
const testDb = createSnapshotTestDb();
let controller: DocSyncWebhookController;

beforeAll(async () => {
  const t = await createTestOrm(testDb);
  controller = new DocSyncWebhookController(
    config as unknown as DocSyncConfigService,
    sync as unknown as DocSyncService,
    t.orm,
  );
});

afterAll(() => {
  testDb.close();
});

/** Only what the handler reads: headers, the parsed body, and the raw bytes. */
function makeReq(
  headers: Record<string, string> = {},
  opts: { body?: unknown; rawBody?: Buffer | undefined } = {},
): Request {
  return {
    headers,
    body: opts.body,
    rawBody: opts.rawBody,
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

const WEBHOOK_ID = 'msg_2f8a';
const WEBHOOK_TS = '1758200000';

function sign(payload: string, secret = SECRET, id = WEBHOOK_ID, ts = WEBHOOK_TS): string {
  return crypto.createHmac('sha256', Buffer.from(secret)).update(`${id}.${ts}.${payload}`).digest('base64');
}

function papraReq(payload: string, signature: string, sent = payload): Request {
  return makeReq(
    { 'webhook-id': WEBHOOK_ID, 'webhook-timestamp': WEBHOOK_TS, 'webhook-signature': `v1,${signature}` },
    { rawBody: Buffer.from(sent, 'utf8') },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  sync.isSwitchedOff.mockReturnValue(false);
  sync.isSyncEnabled.mockReturnValue(true);
  config.getLinkByToken.mockImplementation((token: string) => (token === 'tok-live' ? link() : undefined));
  config.getLink.mockImplementation((id: number) => (id === 4 ? link() : undefined));
  config.webhookSecret.mockReturnValue(SECRET);
});

afterEach(async () => {
  await vi.runOnlyPendingTimersAsync();
  vi.useRealTimers();
});

/**
 * Let the debounce window pass, so a scheduled run actually happens.
 *
 * The timer callback is an async IIFE (recipe R1.5): advancing the clock only
 * starts it running, it does not wait for the `await`s inside to settle. The
 * async variant advances the timers and drains the microtasks each callback
 * queues before returning, so a scheduled run has actually happened by the
 * time this resolves.
 */
async function settle() {
  await vi.advanceTimersByTimeAsync(6000);
}

describe('an unknown token', () => {
  it('answers as if it were known, so nobody can enumerate which tokens exist', async () => {
    expect(await controller.nudge('tok-guessed', makeReq())).toEqual({ received: true });
  });

  it('schedules no run', async () => {
    await controller.nudge('tok-guessed', makeReq());
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

describe('a binding whose sync is switched off', () => {
  it('is left alone, and says nothing about it', async () => {
    config.getLinkByToken.mockReturnValue(link({ sync_enabled: 0 }));
    expect(await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }))).toEqual({
      received: true,
    });
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

describe('a shared-secret header', () => {
  it('triggers the run when it matches', async () => {
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
    await settle();
    expect(sync.syncLink.mock.calls[0][0]).toMatchObject({ id: 4 });
  });

  it('triggers nothing when it is wrong, and the answer looks identical', async () => {
    const wrong = `${SECRET.slice(0, -1)}X`;
    expect(await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': wrong }))).toEqual({ received: true });
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('triggers nothing when the header is missing altogether', async () => {
    await controller.nudge('tok-live', makeReq());
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('is not demanded from a binding that carries no secret: the token alone authenticates there', async () => {
    config.webhookSecret.mockReturnValue('');
    await controller.nudge('tok-live', makeReq());
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });
});

/**
 * A URL somebody pasted into the store by hand.
 *
 * Papra's webhook settings are closed to API keys and Nextcloud's need admin
 * rights, so the person copies the address off the binding card. The secret
 * behind it is never shown to anybody, and Papra signs with a secret of its
 * own, so no such call could ever carry the one TREK holds. Every one of them
 * was dropped, and the binding ran on the timer while the card promised
 * instant updates. The token in the URL is the whole credential there.
 */
describe('a binding pasted into the store by hand', () => {
  const pasted = () => link({ webhook_subscription_id: null });

  beforeEach(() => {
    config.getLinkByToken.mockImplementation((token: string) => (token === 'tok-live' ? pasted() : undefined));
    config.getLink.mockImplementation((id: number) => (id === 4 ? pasted() : undefined));
  });

  it('runs on the token alone, with no secret in the call', async () => {
    await controller.nudge('tok-live', makeReq());
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
    expect(config.webhookSecret).not.toHaveBeenCalled();
  });

  it('runs on a Papra call signed with a secret TREK has never seen', async () => {
    const payload = JSON.stringify({ event: 'document.created', documentId: 'doc_1' });
    await controller.nudge('tok-live', papraReq(payload, sign(payload, 'papras-own-signing-secret')));
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('still needs the right token', async () => {
    await controller.nudge('tok-guessed', makeReq());
    await settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

describe('a Papra standard-webhooks signature', () => {
  const payload = JSON.stringify({ event: 'document.created', documentId: 'doc_1' });

  it('triggers the run when it covers the bytes that arrived', async () => {
    await controller.nudge('tok-live', papraReq(payload, sign(payload)));
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('triggers nothing when the payload was altered after it was signed', async () => {
    const tampered = JSON.stringify({ event: 'document.created', documentId: 'doc_999' });
    expect(await controller.nudge('tok-live', papraReq(payload, sign(payload), tampered))).toEqual({ received: true });
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('triggers nothing when the signature was made with another secret', async () => {
    await controller.nudge('tok-live', papraReq(payload, sign(payload, 'someone-elses-secret-value')));
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('triggers nothing when the id or timestamp does not match what was signed', async () => {
    const req = makeReq(
      { 'webhook-id': 'msg_other', 'webhook-timestamp': WEBHOOK_TS, 'webhook-signature': `v1,${sign(payload)}` },
      { rawBody: Buffer.from(payload, 'utf8') },
    );
    await controller.nudge('tok-live', req);
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('accepts a header carrying several signatures, as a key rotation sends', async () => {
    const req = makeReq(
      {
        'webhook-id': WEBHOOK_ID,
        'webhook-timestamp': WEBHOOK_TS,
        'webhook-signature': `v1,${sign(payload, 'the-previous-secret')} v1,${sign(payload)}`,
      },
      { rawBody: Buffer.from(payload, 'utf8') },
    );
    await controller.nudge('tok-live', req);
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('verifies against the parsed body when a mount left no raw bytes behind', async () => {
    const body = { event: 'document.created', documentId: 'doc_1' };
    const req = makeReq(
      {
        'webhook-id': WEBHOOK_ID,
        'webhook-timestamp': WEBHOOK_TS,
        'webhook-signature': `v1,${sign(JSON.stringify(body))}`,
      },
      { body },
    );
    await controller.nudge('tok-live', req);
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('is ignored when the timestamp header is missing, rather than verified without it', async () => {
    const req = makeReq(
      { 'webhook-id': WEBHOOK_ID, 'webhook-signature': `v1,${sign(payload)}` },
      { rawBody: Buffer.from(payload, 'utf8') },
    );
    await controller.nudge('tok-live', req);
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

describe('a credential of the wrong length', () => {
  // crypto.timingSafeEqual throws on buffers of unequal length, so a one-byte
  // header would turn into a 500 that tells a prober the secret is longer than
  // what they sent.
  it('is rejected rather than thrown over, whether it arrives as a header or as a signature', async () => {
    await expect(controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': 'a' }))).resolves.not.toThrow();
    await expect(controller.nudge('tok-live', papraReq('{}', 'short'))).resolves.not.toThrow();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('is rejected the same way when it is longer than the stored secret', async () => {
    await expect(
      controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': `${SECRET}extra` })),
    ).resolves.not.toThrow();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

/**
 * A burst of calls is one run.
 *
 * Every provider here fires per document: a folder of twenty files is twenty
 * calls within a second or two. Each used to start its own run. The service's
 * in-flight guard then answered `busy` to nineteen of them, so nineteen
 * announcements were thrown away and the one run that did start had begun
 * before most of the changes landed.
 */
describe('a burst of nudges', () => {
  it('runs once for twenty calls rather than twenty times', async () => {
    for (let i = 0; i < 20; i += 1) {
      await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    }
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('answers every one of them immediately, before any run happens', async () => {
    const answers = [];
    for (let i = 0; i < 5; i += 1) {
      answers.push(await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET })));
    }
    // Paperless gives the call five seconds before it counts it as failed.
    expect(answers).toEqual(Array.from({ length: 5 }, () => ({ received: true })));
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('runs again for a burst that arrives after the window closed', async () => {
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await settle();
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('keeps one window per binding, so a busy trip cannot starve a quiet one', async () => {
    const other = link({ id: 9, webhook_token: 'tok-other' });
    config.getLinkByToken.mockImplementation((t: string) =>
      t === 'tok-live' ? link() : t === 'tok-other' ? other : undefined,
    );
    config.getLink.mockImplementation((id: number) => (id === 4 ? link() : id === 9 ? other : undefined));

    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await controller.nudge('tok-other', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await settle();

    expect(sync.syncLink).toHaveBeenCalledTimes(2);
    expect(sync.syncLink.mock.calls.map((c) => c[0].id).sort()).toEqual([4, 9]);
  });

  it('drops the run when the binding is switched off inside the window', async () => {
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    config.getLink.mockReturnValue(link({ sync_enabled: 0 }));
    await settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('drops the run when the binding is deleted inside the window', async () => {
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    config.getLink.mockReturnValue(undefined);
    await settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('forgets its pending timers when the module goes down', async () => {
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    controller.onModuleDestroy();
    await settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

/**
 * The switches an admin expects to mean "off".
 *
 * The scheduler obeys the Documents addon, the binding's provider and the
 * app_settings kill switch; the webhook obeyed none of them, so switching
 * document sync off stopped the poll while every provider holding a webhook
 * carried on driving full runs.
 */
describe('the admin switches', () => {
  it('does nothing while the addon or the provider of the binding is switched off', async () => {
    sync.isSwitchedOff.mockReturnValue(true);
    expect(await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }))).toEqual({
      received: true,
    });
    await settle();
    expect(sync.isSwitchedOff.mock.calls[0][0]).toMatchObject({ id: 4, provider_id: 'papra' });
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('does nothing while the kill switch is set', async () => {
    sync.isSyncEnabled.mockReturnValue(false);
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('drops a scheduled run when the provider goes off inside the window', async () => {
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    sync.isSwitchedOff.mockReturnValue(true);
    await settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('runs normally while both are on', async () => {
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });
});

/**
 * A nudge that lands on a run already in flight.
 *
 * `syncLink` answers `busy` and returns, so the nudge was thrown away, and the
 * changes it was about may well have landed after the running pass read the
 * folder, which means waiting out a whole poll interval for them. Asked again
 * once, and only once, so two clients cannot keep each other going.
 */
describe('a nudge that arrives mid-run', () => {
  it('asks again once when the run was busy', async () => {
    sync.syncLink.mockResolvedValueOnce({ state: 'busy', pulled: 0, pushed: 0, conflicts: 0, missing: 0 });
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await settle();
    await Promise.resolve();
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('gives up after that one retry rather than chasing itself', async () => {
    sync.syncLink.mockResolvedValue({ state: 'busy', pulled: 0, pushed: 0, conflicts: 0, missing: 0 });
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    for (let i = 0; i < 5; i += 1) {
      await settle();
      await Promise.resolve();
    }
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('does not retry a run that worked', async () => {
    // Set explicitly: clearAllMocks drops the calls but keeps the
    // implementation the previous case installed.
    sync.syncLink.mockResolvedValue({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 });
    await controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    await settle();
    await Promise.resolve();
    await settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });
});
