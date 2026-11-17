import { checkSsrf, SsrfBlockedError } from '../../utils/ssrfGuard';
import type { MailIngestImapConfig } from './mail-ingest-settings.service';
import { Injectable } from '@nestjs/common';

import { ImapFlow } from 'imapflow';
import { isIP } from 'node:net';

/** How long connecting and the server's greeting may take, and how long the socket may idle after. */
const CONNECT_TIMEOUT_MS = 15_000;
const SOCKET_TIMEOUT_MS = 60_000;

/** A mail waiting in the box: its uid, its size and when the box got it, before anything of it is downloaded. */
export interface ImapMailRef {
  uid: number;
  size: number;
  receivedAt: Date | null;
}

/** What the import asks of an IMAP box, one connection per run. */
export interface ImapSession {
  /** Opens the folder; answers the uid validity, which changes when the server renumbers it. */
  open(mailbox: string): Promise<{ uidValidity: number }>;
  /** The mails with a uid above `lastUid`, oldest first. */
  listAfter(lastUid: number): Promise<ImapMailRef[]>;
  /** One mail's raw bytes; null for a uid that is gone. */
  source(uid: number): Promise<Buffer | null>;
  /** Makes the folder (made of these parts, in the server's own delimiter) unless it exists; answers its path. */
  ensureFolder(parts: readonly string[]): Promise<string>;
  move(uids: readonly number[], folder: string): Promise<void>;
  close(): Promise<void>;
}

/**
 * Opens the admin's IMAP box. The host goes through the SSRF guard first,
 * with the same allowance for a box on the own network as every other
 * address an admin configures (ALLOW_INTERNAL_NETWORK), and the connection
 * goes to the address the guard vetted, the certificate still checked
 * against the host's name, so a name that resolves differently a moment
 * later cannot redirect it.
 */
@Injectable()
export class MailIngestImapClient {
  async connect(config: MailIngestImapConfig): Promise<ImapSession> {
    const address = await vettedAddress(config.host);
    const client = new ImapFlow({
      host: address,
      port: config.port,
      secure: config.tls === 'tls',
      doSTARTTLS: config.tls === 'starttls' ? true : undefined,
      servername: isIP(config.host) ? undefined : config.host,
      auth: { user: config.user, pass: config.pass },
      logger: false,
      disableAutoIdle: true,
      connectionTimeout: CONNECT_TIMEOUT_MS,
      greetingTimeout: CONNECT_TIMEOUT_MS,
      socketTimeout: SOCKET_TIMEOUT_MS,
    });
    await client.connect();
    return new ImapFlowSession(client);
  }
}

/** The address a connection to `host` may use, or a refusal naming why. */
async function vettedAddress(host: string): Promise<string> {
  const verdict = await checkSsrf(`https://${isIP(host) === 6 ? `[${host}]` : host}/`);
  if (!verdict.allowed || !verdict.resolvedIp) {
    throw new SsrfBlockedError(verdict.error ?? 'This IMAP host is not allowed');
  }
  return verdict.resolvedIp;
}

class ImapFlowSession implements ImapSession {
  /** How many mails the open folder holds; an empty one is not asked for a range, which some servers refuse. */
  private exists = 0;

  constructor(private readonly client: ImapFlow) {}

  async open(mailbox: string): Promise<{ uidValidity: number }> {
    const box = await this.client.mailboxOpen(mailbox);
    this.exists = box.exists;
    return { uidValidity: Number(box.uidValidity) };
  }

  async listAfter(lastUid: number): Promise<ImapMailRef[]> {
    if (this.exists === 0) return [];
    const found: ImapMailRef[] = [];
    // `n:*` always names the newest mail, even below n, so the range alone does not filter.
    const query = { uid: true, size: true, internalDate: true };
    for await (const message of this.client.fetch(`${lastUid + 1}:*`, query, { uid: true })) {
      if (message.uid > lastUid) {
        found.push({ uid: message.uid, size: message.size ?? 0, receivedAt: dateOf(message.internalDate) });
      }
    }
    return found.sort((a, b) => a.uid - b.uid);
  }

  async source(uid: number): Promise<Buffer | null> {
    const message = await this.client.fetchOne(String(uid), { source: true }, { uid: true });
    return message && Buffer.isBuffer(message.source) ? message.source : null;
  }

  async ensureFolder(parts: readonly string[]): Promise<string> {
    const created = await this.client.mailboxCreate([...parts]);
    return created.path;
  }

  async move(uids: readonly number[], folder: string): Promise<void> {
    if (uids.length === 0) return;
    await this.client.messageMove(uids.join(','), folder, { uid: true });
  }

  async close(): Promise<void> {
    try {
      await this.client.logout();
    } catch {
      // The connection broke on its own; there is nothing left to say goodbye to.
      this.client.close();
    }
  }
}

/** The server's arrival time of a mail, which imapflow hands over as a Date or as the server wrote it. */
function dateOf(value: Date | string | undefined): Date | null {
  if (value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** What an admin reads when the box cannot be read: the reason, never the password. */
export function describeImapFailure(err: unknown): string {
  if (err instanceof SsrfBlockedError) return err.message;
  const failure = (err ?? {}) as {
    authenticationFailed?: boolean;
    code?: string;
    responseText?: string;
    message?: string;
  };
  if (failure.authenticationFailed) return 'The IMAP server refused the user name or password';
  if (failure.code && /^E[A-Z]+$/.test(failure.code)) return `Could not reach the IMAP server (${failure.code})`;
  const said = failure.responseText || failure.message || String(err);
  return `The IMAP server answered: ${said}`.slice(0, 300);
}
