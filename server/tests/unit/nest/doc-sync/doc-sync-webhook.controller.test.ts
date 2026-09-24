import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import type { Request } from 'express';

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

import { DocSyncWebhookController } from '../../../../src/nest/doc-sync/doc-sync-webhook.controller';
import type { DocSyncConfigService, LinkRow } from '../../../../src/nest/doc-sync/doc-sync-config.service';
import type { DocSyncService } from '../../../../src/nest/doc-sync/doc-sync.service';
import type { DatabaseService } from '../../../../src/nest/database/database.service';

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
  ...over,
});

const config = {
  getLinkByToken: vi.fn((token: string) => (token === 'tok-live' ? link() : undefined)),
  // Looked up again when the timer fires, so a binding switched off during the
  // window does not get one last run out of a stale row.
  getLink: vi.fn((id: number) => (id === 4 ? link() : undefined)),
  webhookSecret: vi.fn(() => SECRET),
};

const settings = new Map<string, string>();
const db = {
  get: vi.fn((_sql: string, key?: unknown) => {
    const value = settings.get(String(key));
    return value === undefined ? undefined : { value };
  }),
};

const sync = {
  syncLink: vi.fn(async (_link: LinkRow) => ({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 })),
  // The Documents addon and the binding's provider, as one answer. What goes
  // into it is the service's business and tested there.
  isSwitchedOff: vi.fn((_link: LinkRow) => false),
};

const controller = new DocSyncWebhookController(
  config as unknown as DocSyncConfigService,
  sync as unknown as DocSyncService,
  db as unknown as DatabaseService,
);

/** Only what the handler reads: headers, the parsed body, and the raw bytes. */
function makeReq(headers: Record<string, string> = {}, opts: { body?: unknown; rawBody?: Buffer | undefined } = {}): Request {
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
  settings.clear();
  sync.isSwitchedOff.mockReturnValue(false);
  config.getLinkByToken.mockImplementation((token: string) => (token === 'tok-live' ? link() : undefined));
  config.getLink.mockImplementation((id: number) => (id === 4 ? link() : undefined));
  config.webhookSecret.mockReturnValue(SECRET);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

/** Let the debounce window pass, so a scheduled run actually happens. */
function settle() {
  vi.advanceTimersByTime(6000);
}

describe('an unknown token', () => {
  it('answers as if it were known, so nobody can enumerate which tokens exist', () => {
    expect(controller.nudge('tok-guessed', makeReq())).toEqual({ received: true });
  });

  it('schedules no run', () => {
    controller.nudge('tok-guessed', makeReq());
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

describe('a binding whose sync is switched off', () => {
  it('is left alone, and says nothing about it', () => {
    config.getLinkByToken.mockReturnValue(link({ sync_enabled: 0 }));
    expect(controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }))).toEqual({ received: true });
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

describe('a shared-secret header', () => {
  it('triggers the run when it matches', () => {
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
    settle();
    expect(sync.syncLink.mock.calls[0][0]).toMatchObject({ id: 4 });
  });

  it('triggers nothing when it is wrong, and the answer looks identical', () => {
    const wrong = `${SECRET.slice(0, -1)}X`;
    expect(controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': wrong }))).toEqual({ received: true });
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('triggers nothing when the header is missing altogether', () => {
    controller.nudge('tok-live', makeReq());
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('is not demanded from a binding that carries no secret: the token alone authenticates there', () => {
    config.webhookSecret.mockReturnValue('');
    controller.nudge('tok-live', makeReq());
    settle();
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

  it('runs on the token alone, with no secret in the call', () => {
    controller.nudge('tok-live', makeReq());
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
    expect(config.webhookSecret).not.toHaveBeenCalled();
  });

  it('runs on a Papra call signed with a secret TREK has never seen', () => {
    const payload = JSON.stringify({ event: 'document.created', documentId: 'doc_1' });
    controller.nudge('tok-live', papraReq(payload, sign(payload, 'papras-own-signing-secret')));
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('still needs the right token', () => {
    controller.nudge('tok-guessed', makeReq());
    settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

describe('a Papra standard-webhooks signature', () => {
  const payload = JSON.stringify({ event: 'document.created', documentId: 'doc_1' });

  it('triggers the run when it covers the bytes that arrived', () => {
    controller.nudge('tok-live', papraReq(payload, sign(payload)));
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('triggers nothing when the payload was altered after it was signed', () => {
    const tampered = JSON.stringify({ event: 'document.created', documentId: 'doc_999' });
    expect(controller.nudge('tok-live', papraReq(payload, sign(payload), tampered))).toEqual({ received: true });
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('triggers nothing when the signature was made with another secret', () => {
    controller.nudge('tok-live', papraReq(payload, sign(payload, 'someone-elses-secret-value')));
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('triggers nothing when the id or timestamp does not match what was signed', () => {
    const req = makeReq(
      { 'webhook-id': 'msg_other', 'webhook-timestamp': WEBHOOK_TS, 'webhook-signature': `v1,${sign(payload)}` },
      { rawBody: Buffer.from(payload, 'utf8') },
    );
    controller.nudge('tok-live', req);
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('accepts a header carrying several signatures, as a key rotation sends', () => {
    const req = makeReq(
      {
        'webhook-id': WEBHOOK_ID,
        'webhook-timestamp': WEBHOOK_TS,
        'webhook-signature': `v1,${sign(payload, 'the-previous-secret')} v1,${sign(payload)}`,
      },
      { rawBody: Buffer.from(payload, 'utf8') },
    );
    controller.nudge('tok-live', req);
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('verifies against the parsed body when a mount left no raw bytes behind', () => {
    const body = { event: 'document.created', documentId: 'doc_1' };
    const req = makeReq(
      { 'webhook-id': WEBHOOK_ID, 'webhook-timestamp': WEBHOOK_TS, 'webhook-signature': `v1,${sign(JSON.stringify(body))}` },
      { body },
    );
    controller.nudge('tok-live', req);
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('is ignored when the timestamp header is missing, rather than verified without it', () => {
    const req = makeReq(
      { 'webhook-id': WEBHOOK_ID, 'webhook-signature': `v1,${sign(payload)}` },
      { rawBody: Buffer.from(payload, 'utf8') },
    );
    controller.nudge('tok-live', req);
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

describe('a credential of the wrong length', () => {
  // crypto.timingSafeEqual throws on buffers of unequal length, so a one-byte
  // header would turn into a 500 that tells a prober the secret is longer than
  // what they sent.
  it('is rejected rather than thrown over, whether it arrives as a header or as a signature', () => {
    expect(() => controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': 'a' }))).not.toThrow();
    expect(() =>
      controller.nudge('tok-live', papraReq('{}', 'short')),
    ).not.toThrow();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('is rejected the same way when it is longer than the stored secret', () => {
    expect(() => controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': `${SECRET}extra` }))).not.toThrow();
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
  it('runs once for twenty calls rather than twenty times', () => {
    for (let i = 0; i < 20; i += 1) {
      controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    }
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('answers every one of them immediately, before any run happens', () => {
    const answers = [];
    for (let i = 0; i < 5; i += 1) {
      answers.push(controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET })));
    }
    // Paperless gives the call five seconds before it counts it as failed.
    expect(answers).toEqual(Array.from({ length: 5 }, () => ({ received: true })));
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('runs again for a burst that arrives after the window closed', () => {
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    settle();
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('keeps one window per binding, so a busy trip cannot starve a quiet one', () => {
    const other = link({ id: 9, webhook_token: 'tok-other' });
    config.getLinkByToken.mockImplementation((t: string) =>
      t === 'tok-live' ? link() : t === 'tok-other' ? other : undefined);
    config.getLink.mockImplementation((id: number) => (id === 4 ? link() : id === 9 ? other : undefined));

    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    controller.nudge('tok-other', makeReq({ 'x-trek-docsync-secret': SECRET }));
    settle();

    expect(sync.syncLink).toHaveBeenCalledTimes(2);
    expect(sync.syncLink.mock.calls.map((c) => c[0].id).sort()).toEqual([4, 9]);
  });

  it('drops the run when the binding is switched off inside the window', () => {
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    config.getLink.mockReturnValue(link({ sync_enabled: 0 }));
    settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('drops the run when the binding is deleted inside the window', () => {
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    config.getLink.mockReturnValue(undefined);
    settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('forgets its pending timers when the module goes down', () => {
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    controller.onModuleDestroy();
    settle();
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
  it('does nothing while the addon or the provider of the binding is switched off', () => {
    sync.isSwitchedOff.mockReturnValue(true);
    expect(controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }))).toEqual({ received: true });
    settle();
    expect(sync.isSwitchedOff.mock.calls[0][0]).toMatchObject({ id: 4, provider_id: 'papra' });
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('does nothing while the kill switch is set', () => {
    settings.set('docsync_sync_enabled', 'false');
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('drops a scheduled run when the provider goes off inside the window', () => {
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    sync.isSwitchedOff.mockReturnValue(true);
    settle();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });

  it('runs normally while both are on', () => {
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    settle();
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
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    settle();
    await Promise.resolve();
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('gives up after that one retry rather than chasing itself', async () => {
    sync.syncLink.mockResolvedValue({ state: 'busy', pulled: 0, pushed: 0, conflicts: 0, missing: 0 });
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    for (let i = 0; i < 5; i += 1) { settle(); await Promise.resolve(); }
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('does not retry a run that worked', async () => {
    // Set explicitly: clearAllMocks drops the calls but keeps the
    // implementation the previous case installed.
    sync.syncLink.mockResolvedValue({ state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 });
    controller.nudge('tok-live', makeReq({ 'x-trek-docsync-secret': SECRET }));
    settle();
    await Promise.resolve();
    settle();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });
});
