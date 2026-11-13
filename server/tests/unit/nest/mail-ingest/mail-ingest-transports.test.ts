/**
 * How mail reaches the import and how the admin sees it run, over stubs: the
 * signed webhook (its window, its signature over the recipient and the raw
 * mail, its refusals), the IMAP run (cursor, renumbered box, size limit, the
 * move to TREK/processed, a mail deferred for now and offered again, a
 * failure the status card reads), the TREK Cloud relay (its page format,
 * paging, hash check, a mail it cannot read, a mail kept for now,
 * acknowledgement, idle without a relay or an import there) and the status
 * card and connection test. Whatever a transport takes in is read at once.
 */
import { MailIngestCandidates } from '../../../../src/db/entities/MailIngestCandidates.entity';
import { MailIngestCursor } from '../../../../src/db/entities/MailIngestCursor.entity';
import { MailIngestMessages } from '../../../../src/db/entities/MailIngestMessages.entity';
import { DomainError } from '../../../../src/nest/common/domain-error';
import {
  MailIngestImapClient,
  describeImapFailure,
  type ImapSession,
} from '../../../../src/nest/mail-ingest/mail-ingest-imap.client';
import { MailIngestImapJob } from '../../../../src/nest/mail-ingest/mail-ingest-imap.job';
import { MailIngestIntakeService } from '../../../../src/nest/mail-ingest/mail-ingest-intake.service';
import { MailIngestProcessJob } from '../../../../src/nest/mail-ingest/mail-ingest-process.job';
import { MailIngestRelayJob } from '../../../../src/nest/mail-ingest/mail-ingest-relay.job';
import { MailIngestRelayHost } from '../../../../src/nest/mail-ingest/mail-ingest-relay.service';
import { MailIngestSettingsService } from '../../../../src/nest/mail-ingest/mail-ingest-settings.service';
import { MailIngestStatusService } from '../../../../src/nest/mail-ingest/mail-ingest-status.service';
import {
  MailIngestWebhookService,
  signWebhookMail,
} from '../../../../src/nest/mail-ingest/mail-ingest-webhook.service';
import { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { SsrfBlockedError } from '../../../../src/utils/ssrfGuard';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test } from '@nestjs/testing';

import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

/**
 * The control plane's inbox answer, byte for byte the fixture its own tests
 * hold the collection to (trek-hosted control-plane/fixtures/instance-inbox.json).
 */
const RELAY_FIXTURE = {
  messages: [
    {
      id: '0b9f2c4e-7d1a-4c3b-9e8f-1a2b3c4d5e6f',
      receivedAt: '2026-11-13T10:00:00.000Z',
      size: 37,
      sha256: 'd9f4a3ee48bcaa66f8c8ddd7f348385bb63034211431d0e5f921d7cd131e83e7',
      recipients: ['k3m7mfrggzdfmztwq2lknnwg23tp@in.liketrek.com'],
      raw: 'U3ViamVjdDogWW91ciBib29raW5nDQoNClBOUiBBQkMxMjMNCg==',
    },
  ],
  more: false,
  next: 'MjAyNi0xMS0xM1QxMDowMDowMC4wMDBaCjBiOWYyYzRlLTdkMWEtNGMzYi05ZThmLTFhMmIzYzRkNWU2Zg',
};

const IMAP = { host: 'imap.example.com', port: 993, tls: 'tls', user: 'u', pass: 'p', mailbox: 'INBOX' } as const;

const settings = {
  isAvailable: vi.fn(async () => true),
  transport: vi.fn(async () => 'webhook'),
  webhookSecret: vi.fn(async (): Promise<string | null> => 'a'.repeat(32)),
  imapConfig: vi.fn(async (): Promise<typeof IMAP | null> => IMAP),
  maxMailBytes: vi.fn(() => 1000),
};
const intake = { receive: vi.fn() };
const processing = { runSoon: vi.fn() };
const cursor = {
  acquireLease: vi.fn(async () => true),
  releaseLease: vi.fn(async () => undefined),
  recordOk: vi.fn(async () => undefined),
  recordError: vi.fn(async () => undefined),
  findCursor: vi.fn(),
};
const messages = { tallySince: vi.fn(), countAllAiReadSince: vi.fn() };
const candidates = { tallyResolutionsSince: vi.fn(), pendingPerUser: vi.fn() };
const session = {
  open: vi.fn(),
  listAfter: vi.fn(),
  source: vi.fn(),
  ensureFolder: vi.fn(async (parts: readonly string[]) => parts.join('.')),
  move: vi.fn(async () => undefined),
  close: vi.fn(async () => undefined),
};
const imap = { connect: vi.fn(async (): Promise<ImapSession> => session) };
const registrar = { isEnabled: () => false, register: vi.fn() };
let relays: MailIngestRelayHost;

async function build() {
  const moduleRef = await Test.createTestingModule({
    providers: [
      MailIngestWebhookService,
      MailIngestImapJob,
      MailIngestRelayJob,
      MailIngestStatusService,
      { provide: MailIngestRelayHost, useValue: relays },
      { provide: MailIngestSettingsService, useValue: settings },
      { provide: MailIngestIntakeService, useValue: intake },
      { provide: MailIngestProcessJob, useValue: processing },
      { provide: MailIngestImapClient, useValue: imap },
      { provide: CronRegistrarService, useValue: registrar },
      { provide: getRepositoryToken(MailIngestCursor), useValue: cursor },
      { provide: getRepositoryToken(MailIngestMessages), useValue: messages },
      { provide: getRepositoryToken(MailIngestCandidates), useValue: candidates },
    ],
  }).compile();
  return moduleRef;
}

let app: Awaited<ReturnType<typeof build>>;
beforeEach(async () => {
  vi.clearAllMocks();
  settings.isAvailable.mockResolvedValue(true);
  settings.webhookSecret.mockResolvedValue('a'.repeat(32));
  settings.imapConfig.mockResolvedValue(IMAP);
  cursor.acquireLease.mockResolvedValue(true);
  cursor.findCursor.mockResolvedValue(null);
  relays = new MailIngestRelayHost();
  app = await build();
});

describe('the signed webhook', () => {
  const SECRET = 'a'.repeat(32);
  const RAW = Buffer.from('Subject: Your booking\r\n\r\nABC123');
  const NOW = Date.parse('2030-01-15T10:00:00Z');
  const STAMP = String(NOW / 1000);
  const service = () => app.get(MailIngestWebhookService);
  const signed = (over: { timestamp?: string; recipient?: string; secret?: string } = {}) => {
    const timestamp = over.timestamp ?? STAMP;
    const recipient = over.recipient ?? 'trek+tok@example.com';
    const signature = `sha256=${signWebhookMail(over.secret ?? SECRET, timestamp, recipient, RAW)}`;
    return { timestamp, recipient, signature };
  };

  it('opens only while the import is on, the webhook is its transport and a secret is set', async () => {
    settings.transport.mockResolvedValue('webhook');
    expect(await service().secret()).toBe(SECRET);
    settings.transport.mockResolvedValue('imap');
    await expect(service().secret()).rejects.toThrow('Not found');
    settings.transport.mockResolvedValue('webhook');
    settings.webhookSecret.mockResolvedValue(null);
    await expect(service().secret()).rejects.toThrow('Not found');
    settings.webhookSecret.mockResolvedValue(SECRET);
    settings.isAvailable.mockResolvedValue(false);
    await expect(service().secret()).rejects.toThrow('Not found');
  });

  it('takes a mail whose signature covers it, its recipient and a fresh timestamp', async () => {
    intake.receive.mockResolvedValue({ status: 'accepted' });
    expect(await service().receive(SECRET, RAW, signed(), NOW)).toEqual({ accepted: true, duplicate: false });
    expect(intake.receive).toHaveBeenCalledWith(RAW, 'webhook', ['trek+tok@example.com']);
    expect(processing.runSoon).toHaveBeenCalledTimes(1);
    intake.receive.mockResolvedValue({ status: 'duplicate' });
    const noRecipient = signed({ recipient: '' });
    expect(await service().receive(SECRET, RAW, noRecipient, NOW)).toEqual({ accepted: true, duplicate: true });
    expect(intake.receive).toHaveBeenLastCalledWith(RAW, 'webhook', []);
    // A duplicate is in already: nothing new to read.
    expect(processing.runSoon).toHaveBeenCalledTimes(1);
  });

  it('refuses another secret, another recipient, a changed mail and a timestamp out of its window', async () => {
    const refused = (parts: ReturnType<typeof signed>, raw = RAW) =>
      expect(service().receive(SECRET, raw, parts, NOW)).rejects.toThrow('The signature does not match');
    await refused(signed({ secret: 'b'.repeat(32) }));
    await refused({ ...signed(), recipient: 'trek+other@example.com' });
    await refused(signed(), Buffer.from('Subject: Your booking\r\n\r\nXYZ999'));
    await refused(signed({ timestamp: String(NOW / 1000 - 301) }));
    await refused({ ...signed(), signature: 'sha256=nothex' });
    await refused({ ...signed(), timestamp: undefined as never });
    expect(intake.receive).not.toHaveBeenCalled();
  });

  it('answers what the intake refused with its own status', async () => {
    const cases: Array<[string, number]> = [
      ['unknown_address', 422],
      ['too_large', 413],
      ['address_daily_limit', 429],
      ['unavailable', 404],
    ];
    // One after the other: each answer is the intake's next one.
    await cases.reduce(async (previous, [reason, status]) => {
      await previous;
      intake.receive.mockResolvedValueOnce({ status: 'refused', reason });
      const err = await service()
        .receive(SECRET, RAW, signed(), NOW)
        .catch((e: unknown) => e);
      expect(err, reason).toBeInstanceOf(DomainError);
      expect((err as DomainError).getStatus(), reason).toBe(status);
    }, Promise.resolve());
  });
});

describe('the IMAP run', () => {
  const job = () => app.get(MailIngestImapJob);
  const NOW = new Date('2030-01-15T10:00:00Z');
  const ref = (uid: number, size = 10, receivedAt: Date | null = NOW) => ({ uid, size, receivedAt });
  /** The box's new mails, then the deferred folder's, as the run opens one after the other. */
  const boxes = (fresh: ReturnType<typeof ref>[], deferred: ReturnType<typeof ref>[] = []) => {
    session.listAfter.mockResolvedValueOnce(fresh).mockResolvedValueOnce(deferred);
  };

  beforeEach(() => {
    settings.transport.mockResolvedValue('imap');
    session.open.mockResolvedValue({ uidValidity: 9 });
    session.listAfter.mockResolvedValue([]);
    session.source.mockImplementation(async (uid: number) => Buffer.from(`mail ${uid}`));
    intake.receive.mockResolvedValue({ status: 'accepted' });
  });

  it('takes the new mails after the cursor, moves them on, and notes where it got to', async () => {
    cursor.findCursor.mockResolvedValue({ uid_validity: 9, last_uid: 40 });
    boxes([ref(41), ref(42)]);
    expect(await job().tick(NOW)).toBe(2);
    expect(session.listAfter).toHaveBeenNthCalledWith(1, 40);
    expect(intake.receive.mock.calls.map(([raw]) => String(raw))).toEqual(['mail 41', 'mail 42']);
    expect(session.ensureFolder).toHaveBeenCalledWith(['TREK', 'processed']);
    expect(session.move).toHaveBeenCalledWith([41, 42], 'TREK.processed');
    expect(cursor.recordOk).toHaveBeenCalledWith('imap', 'INBOX', expect.any(String), { uidValidity: 9, lastUid: 42 });
    expect(session.close).toHaveBeenCalled();
    expect(cursor.releaseLease).toHaveBeenCalled();
    // What came in is read at once, by one run for the whole box.
    expect(processing.runSoon).toHaveBeenCalledTimes(1);
  });

  it('starts over when the server renumbered the box, and leaves a mail over the limit unread', async () => {
    cursor.findCursor.mockResolvedValue({ uid_validity: 3, last_uid: 400 });
    boxes([ref(1, 5000), ref(2)]);
    expect(await job().tick(NOW)).toBe(1);
    expect(session.listAfter).toHaveBeenNthCalledWith(1, 0);
    expect(session.source).toHaveBeenCalledTimes(1);
    expect(session.move).toHaveBeenCalledWith([1, 2], 'TREK.processed');
  });

  it('defers a mail the import cannot take for now, so the mails behind it go on', async () => {
    boxes([ref(5), ref(6), ref(7)]);
    intake.receive
      .mockResolvedValueOnce({ status: 'refused', reason: 'inbox_full' })
      .mockResolvedValueOnce({ status: 'refused', reason: 'unknown_address' })
      .mockResolvedValueOnce({ status: 'duplicate' });
    expect(await job().tick(NOW)).toBe(0);
    expect(session.move).toHaveBeenCalledWith([6, 7], 'TREK.processed');
    expect(session.move).toHaveBeenCalledWith([5], 'TREK.deferred');
    expect(cursor.recordOk).toHaveBeenCalledWith('imap', 'INBOX', expect.any(String), { uidValidity: 9, lastUid: 7 });
  });

  it('offers deferred mails again, and gives up one that waited too long', async () => {
    const old = new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000);
    boxes([], [ref(1), ref(2), ref(3, 10, old)]);
    intake.receive
      .mockResolvedValueOnce({ status: 'accepted' })
      .mockResolvedValueOnce({ status: 'refused', reason: 'address_daily_limit' })
      .mockResolvedValueOnce({ status: 'refused', reason: 'address_daily_limit' });
    expect(await job().tick(NOW)).toBe(1);
    expect(session.open).toHaveBeenLastCalledWith('TREK.deferred');
    expect(session.listAfter).toHaveBeenLastCalledWith(0);
    // 2 is kept for the next run; 3 waited past its days and goes on with 1.
    expect(session.move).toHaveBeenCalledTimes(1);
    expect(session.move).toHaveBeenCalledWith([1, 3], 'TREK.processed');
  });

  it('moves nothing with an empty box, and touches nothing unless IMAP is the transport', async () => {
    expect(await job().tick(NOW)).toBe(0);
    expect(session.move).not.toHaveBeenCalled();
    expect(intake.receive).not.toHaveBeenCalled();
    expect(processing.runSoon).not.toHaveBeenCalled();
    expect(cursor.recordOk).toHaveBeenCalledWith('imap', 'INBOX', expect.any(String), { uidValidity: 9, lastUid: 0 });
    settings.transport.mockResolvedValue('webhook');
    vi.clearAllMocks();
    expect(await job().tick(NOW)).toBe(0);
    expect(imap.connect).not.toHaveBeenCalled();
    settings.transport.mockResolvedValue('imap');
    cursor.acquireLease.mockResolvedValue(false);
    expect(await job().tick(NOW)).toBe(0);
    expect(imap.connect).not.toHaveBeenCalled();
  });

  it('records why a run failed for the status card, and keeps the cursor where it was', async () => {
    imap.connect.mockRejectedValueOnce(Object.assign(new Error('Command failed'), { authenticationFailed: true }));
    expect(await job().tick(NOW)).toBe(0);
    const refused = 'The IMAP server refused the user name or password';
    expect(cursor.recordError).toHaveBeenCalledWith('imap', 'INBOX', refused);
    expect(cursor.recordOk).not.toHaveBeenCalled();
    expect(cursor.releaseLease).toHaveBeenCalled();
  });

  it('describes a failure without anything of the login', () => {
    expect(describeImapFailure(new SsrfBlockedError('Requests to loopback are not allowed'))).toBe(
      'Requests to loopback are not allowed',
    );
    expect(describeImapFailure(Object.assign(new Error('connect'), { code: 'ECONNREFUSED' }))).toBe(
      'Could not reach the IMAP server (ECONNREFUSED)',
    );
    expect(describeImapFailure(Object.assign(new Error('x'), { responseText: 'Mailbox does not exist' }))).toBe(
      'The IMAP server answered: Mailbox does not exist',
    );
  });
});

describe('the TREK Cloud relay', () => {
  const job = () => app.get(MailIngestRelayJob);
  const relay = { list: vi.fn(), ack: vi.fn(async () => undefined) };
  const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const mail = (n: number, body: string, sha = createHash('sha256').update(body).digest('hex')) => ({
    id: uuid(n),
    receivedAt: '2030-01-15T09:58:00.000Z',
    size: Buffer.byteLength(body),
    sha256: sha,
    recipients: ['ab12tok@in.example.com'],
    raw: Buffer.from(body).toString('base64'),
  });
  const page = (messages: unknown[], more = false, next: string | null = null) => ({ messages, more, next });

  beforeEach(() => {
    settings.transport.mockResolvedValue('cloud');
    relays.attach(relay);
  });

  it('stays idle without a relay attached, and where the control plane runs no import', async () => {
    relays = new MailIngestRelayHost();
    app = await build();
    expect(await job().tick()).toBe(0);
    expect(cursor.acquireLease).not.toHaveBeenCalled();

    relays.attach(relay);
    relay.list.mockResolvedValue(null);
    expect(await job().tick()).toBe(0);
    expect(cursor.recordError).not.toHaveBeenCalled();
    expect(cursor.recordOk).toHaveBeenCalledWith('cloud', '', expect.any(String));
  });

  it('reads the page the control plane sends, as its own fixture has it', async () => {
    relay.list.mockResolvedValue(RELAY_FIXTURE);
    intake.receive.mockResolvedValue({ status: 'accepted' });
    expect(await job().tick()).toBe(1);
    const [fixture] = RELAY_FIXTURE.messages;
    expect(intake.receive).toHaveBeenCalledWith(Buffer.from(fixture.raw, 'base64'), 'cloud', fixture.recipients);
    expect(relay.ack).toHaveBeenCalledWith(fixture.id);
  });

  it('takes each whole mail in under the addresses it was sent to and acknowledges it', async () => {
    const broken = mail(2, 'two', 'f'.repeat(64));
    relay.list.mockResolvedValue(page([mail(1, 'one'), broken, mail(3, 'three')]));
    intake.receive
      .mockResolvedValueOnce({ status: 'accepted' })
      .mockResolvedValueOnce({ status: 'refused', reason: 'unknown_address' });
    expect(await job().tick()).toBe(1);
    expect(relay.list).toHaveBeenCalledWith(10, null);
    expect(intake.receive).toHaveBeenCalledWith(Buffer.from('one'), 'cloud', ['ab12tok@in.example.com']);
    // 2 did not arrive whole and stays with the relay; 3 is refused for good and dropped.
    expect(relay.ack.mock.calls).toEqual([[uuid(1)], [uuid(3)]]);
    expect(cursor.recordOk).toHaveBeenCalledWith('cloud', '', expect.any(String));
    expect(processing.runSoon).toHaveBeenCalledTimes(1);
  });

  it('keeps a mail the import cannot take for now, and reads the mails after it', async () => {
    relay.list.mockResolvedValue(page([mail(1, 'one'), mail(2, 'two')]));
    intake.receive
      .mockResolvedValueOnce({ status: 'refused', reason: 'inbox_full' })
      .mockResolvedValueOnce({ status: 'accepted' });
    expect(await job().tick()).toBe(1);
    expect(relay.ack.mock.calls).toEqual([[uuid(2)]]);

    intake.receive.mockResolvedValue({ status: 'refused', reason: 'address_daily_limit' });
    await job().tick();
    intake.receive.mockResolvedValue({ status: 'refused', reason: 'unavailable' });
    await job().tick();
    expect(relay.ack).toHaveBeenCalledTimes(1);
  });

  it('drops a mail it can never read without holding up the rest, and refuses a page it cannot read', async () => {
    const recipients = Array.from({ length: 101 }, (_, i) => `ab12t${i}@in.example.com`);
    relay.list.mockResolvedValue(page([{ ...mail(1, 'one'), recipients }, { id: '../../etc' }, mail(3, 'three')]));
    intake.receive.mockResolvedValue({ status: 'accepted' });
    expect(await job().tick()).toBe(1);
    expect(relay.ack.mock.calls).toEqual([[uuid(1)], [uuid(3)]]);

    relay.list.mockResolvedValue({ mails: [mail(4, 'four')] });
    expect(await job().tick()).toBe(0);
    const unreadable = 'The relay answered with an inbox this server cannot read';
    expect(cursor.recordError).toHaveBeenCalledWith('cloud', '', unreadable);
  });

  it('pages on while more wait, from where the last page ended, up to five pages a run', async () => {
    relay.list
      .mockResolvedValueOnce(page([mail(1, 'one')], true, 'c1'))
      .mockResolvedValueOnce(page([mail(2, 'two')], false, 'c2'));
    intake.receive.mockResolvedValue({ status: 'accepted' });
    expect(await job().tick()).toBe(2);
    expect(relay.list.mock.calls).toEqual([
      [10, null],
      [10, 'c1'],
    ]);

    relay.list.mockReset();
    const position = (after: string | null) => Number(after?.slice(1) ?? 0) + 1;
    relay.list.mockImplementation(async (_limit: number, after: string | null) =>
      page([mail(position(after), 'x')], true, `c${position(after)}`),
    );
    await job().tick();
    expect(relay.list).toHaveBeenCalledTimes(5);
  });
});

describe('the status card and the connection test', () => {
  const status = () => app.get(MailIngestStatusService);

  it('counts the last day by status and reason, and names no mail and no person', async () => {
    settings.transport.mockResolvedValue('cloud');
    cursor.findCursor.mockResolvedValue({ last_ok_at: '2030-01-15 09:58:00', last_error: null, lease_until: null });
    messages.tallySince.mockResolvedValue([
      { status: 'processed', reason: null, n: 4 },
      { status: 'discarded', reason: 'newsletter', n: 2 },
      { status: 'processed', reason: 'no_trip_in_range', n: 1 },
    ]);
    messages.countAllAiReadSince.mockResolvedValue(3);
    candidates.tallyResolutionsSince.mockResolvedValue([
      { resolution: 'auto_applied', n: 5 },
      { resolution: 'undone', n: 1 },
    ]);
    candidates.pendingPerUser.mockResolvedValue([4, 1]);

    expect(await status().status(new Date('2030-01-15T10:00:00Z'))).toEqual({
      transport: 'cloud',
      last_ok_at: '2030-01-15T09:58:00Z',
      last_error: null,
      lease_until: null,
      last_day: {
        by_status: { processed: 5, discarded: 2 },
        by_reason: { newsletter: 2, no_trip_in_range: 1 },
      },
      auto_applied: 5,
      undone: 1,
      ai_calls_today: 3,
      backlog: [4, 1],
    });
    expect(cursor.findCursor).toHaveBeenCalledWith('cloud', '');
    expect(messages.countAllAiReadSince).toHaveBeenCalledWith('2030-01-15 00:00:00');
  });

  it('tests each transport the way the import reaches it', async () => {
    settings.transport.mockResolvedValue('off');
    expect(await status().test()).toMatchObject({ ok: false, error: expect.stringContaining('upload') });
    settings.transport.mockResolvedValue('webhook');
    expect(await status().test()).toEqual({ transport: 'webhook', ok: true, error: null });
    settings.transport.mockResolvedValue('cloud');
    expect(await status().test()).toMatchObject({ ok: false, error: 'The TREK Cloud relay is not connected' });
    settings.transport.mockResolvedValue('imap');
    session.open.mockResolvedValue({ uidValidity: 1 });
    expect(await status().test()).toEqual({ transport: 'imap', ok: true, error: null });
    expect(session.open).toHaveBeenCalledWith('INBOX');
    expect(session.close).toHaveBeenCalled();
    imap.connect.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'ETIMEDOUT' }));
    expect(await status().test()).toMatchObject({ ok: false, error: 'Could not reach the IMAP server (ETIMEDOUT)' });
    settings.imapConfig.mockResolvedValue(null);
    expect(await status().test()).toMatchObject({ ok: false, error: 'The IMAP host, user or password is missing' });
  });
});
