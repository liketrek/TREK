/**
 * The IMAP client the import reads a box with, over a stand-in for imapflow:
 * the host goes through the SSRF guard and the connection to the address it
 * vetted, the certificate checked against the name; the session filters the
 * newest mail IMAP always names, makes the processed folder, moves by uid and
 * says goodbye even over a broken connection.
 */
import { MailIngestImapClient } from '../../../../src/nest/mail-ingest/mail-ingest-imap.client';
import { SsrfBlockedError } from '../../../../src/utils/ssrfGuard';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { checkSsrf, flow, ImapFlow } = vi.hoisted(() => {
  const flow = {
    connect: vi.fn(async () => undefined),
    mailboxOpen: vi.fn(async () => ({ uidValidity: 77n, exists: 3 })),
    fetch: vi.fn(),
    fetchOne: vi.fn(),
    mailboxCreate: vi.fn(async () => ({ path: 'TREK.processed', created: false })),
    messageMove: vi.fn(async () => true),
    logout: vi.fn(async () => undefined),
    close: vi.fn(),
  };
  // A function, not an arrow: the client builds it with `new`.
  const ImapFlow = vi.fn(function () {
    return flow;
  });
  return { checkSsrf: vi.fn(), flow, ImapFlow };
});
vi.mock('imapflow', () => ({ ImapFlow }));
vi.mock('../../../../src/utils/ssrfGuard', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  checkSsrf,
}));

const CONFIG = {
  host: 'imap.example.com',
  port: 143,
  tls: 'starttls',
  user: 'u',
  pass: 'p',
  mailbox: 'INBOX',
} as const;

const ARRIVED = new Date('2030-01-15T10:00:00Z');

async function* messages(...uids: number[]) {
  for (const uid of uids) yield { uid, size: uid * 10, internalDate: uid === 42 ? 'not a date' : ARRIVED };
}

beforeEach(() => {
  vi.clearAllMocks();
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: '203.0.113.5' });
});

describe('MailIngestImapClient', () => {
  it('connects to the vetted address, checking the certificate against the name', async () => {
    await new MailIngestImapClient().connect(CONFIG);
    expect(checkSsrf).toHaveBeenCalledWith('https://imap.example.com/');
    expect(ImapFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        host: '203.0.113.5',
        port: 143,
        secure: false,
        doSTARTTLS: true,
        servername: 'imap.example.com',
        auth: { user: 'u', pass: 'p' },
        logger: false,
      }),
    );
    expect(flow.connect).toHaveBeenCalled();
  });

  it('refuses a host the guard blocks, before any connection', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, isPrivate: true, error: 'Private addresses are not allowed' });
    await expect(new MailIngestImapClient().connect(CONFIG)).rejects.toBeInstanceOf(SsrfBlockedError);
    expect(ImapFlow).not.toHaveBeenCalled();
  });

  it('reads a box through one session: uid validity, the mails after the cursor, a source, the move', async () => {
    const session = await new MailIngestImapClient().connect({ ...CONFIG, host: '2001:db8::1', tls: 'tls' });
    expect(checkSsrf).toHaveBeenCalledWith('https://[2001:db8::1]/');
    expect(ImapFlow).toHaveBeenCalledWith(expect.objectContaining({ secure: true, servername: undefined }));

    expect(await session.open('INBOX')).toEqual({ uidValidity: 77 });
    // `41:*` names the newest mail even when it is older than 41.
    flow.fetch.mockReturnValue(messages(40, 42, 41));
    expect(await session.listAfter(40)).toEqual([
      { uid: 41, size: 410, receivedAt: ARRIVED },
      { uid: 42, size: 420, receivedAt: null },
    ]);
    expect(flow.fetch).toHaveBeenCalledWith('41:*', { uid: true, size: true, internalDate: true }, { uid: true });

    flow.fetchOne.mockResolvedValueOnce({ uid: 41, source: Buffer.from('raw') }).mockResolvedValueOnce(false);
    expect(await session.source(41)).toEqual(Buffer.from('raw'));
    expect(await session.source(43)).toBeNull();

    expect(await session.ensureFolder(['TREK', 'processed'])).toBe('TREK.processed');
    expect(flow.mailboxCreate).toHaveBeenCalledWith(['TREK', 'processed']);
    await session.move([41, 42], 'TREK.processed');
    expect(flow.messageMove).toHaveBeenCalledWith('41,42', 'TREK.processed', { uid: true });
    await session.move([], 'TREK.processed');
    expect(flow.messageMove).toHaveBeenCalledTimes(1);
  });

  it('does not ask an empty folder for a range', async () => {
    flow.mailboxOpen.mockResolvedValueOnce({ uidValidity: 5n, exists: 0 });
    const session = await new MailIngestImapClient().connect(CONFIG);
    await session.open('INBOX');
    expect(await session.listAfter(0)).toEqual([]);
    expect(flow.fetch).not.toHaveBeenCalled();
  });

  it('logs out, and closes a connection that broke on its own', async () => {
    const session = await new MailIngestImapClient().connect(CONFIG);
    await session.close();
    expect(flow.logout).toHaveBeenCalled();
    flow.logout.mockRejectedValueOnce(new Error('socket closed'));
    await session.close();
    expect(flow.close).toHaveBeenCalled();
  });
});
