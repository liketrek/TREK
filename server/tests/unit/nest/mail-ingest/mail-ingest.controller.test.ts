/**
 * The mail import's REST and MCP adapters over stub services: every route and
 * its tool hand the same arguments to the same service method, answer the
 * same shape, and refuse with the service's own error. The webhook route
 * reads the raw body itself, up to the import's limit, after the transport
 * said it is open.
 */
import type { MailIngestCandidateRow } from '../../../../src/db/repositories/MailIngestCandidates.repository';
import type { McpContext } from '../../../../src/nest-mcp';
import { DomainError } from '../../../../src/nest/common/domain-error';
import type { MailIngestActionsService } from '../../../../src/nest/mail-ingest/mail-ingest-actions.service';
import { MailIngestAdminController } from '../../../../src/nest/mail-ingest/mail-ingest-admin.controller';
import { MailIngestInboundController } from '../../../../src/nest/mail-ingest/mail-ingest-inbound.controller';
import type { MailIngestInboxService } from '../../../../src/nest/mail-ingest/mail-ingest-inbox.service';
import type { MailIngestStatusService } from '../../../../src/nest/mail-ingest/mail-ingest-status.service';
import { MailIngestTripController } from '../../../../src/nest/mail-ingest/mail-ingest-trip.controller';
import type { MailIngestWebhookService } from '../../../../src/nest/mail-ingest/mail-ingest-webhook.service';
import { MailIngestController } from '../../../../src/nest/mail-ingest/mail-ingest.controller';
import { MailIngestMcp } from '../../../../src/nest/mail-ingest/mail-ingest.mcp';
import type { User } from '../../../../src/types';
import { HttpException } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';

import type { Request } from 'express';
import { PassThrough } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const user = { id: 7 } as User;
const ctx = { userId: 7 } as McpContext;
const row = { id: 3, user_id: 7 } as MailIngestCandidateRow;
const view = { id: 3, resolution: 'applied' };

const inbox = {
  settingsOf: vi.fn(),
  updatePrefs: vi.fn(),
  renewOwnAddress: vi.fn(),
  tripAddress: vi.fn(),
  renewTripAddress: vi.fn(),
  revokeTripAddress: vi.fn(),
  inbox: vi.fn(),
  count: vi.fn(),
  preview: vi.fn(),
  upload: vi.fn(),
  entry: vi.fn(),
};
const actions = {
  applyToTrip: vi.fn(),
  move: vi.fn(),
  fileToTrip: vi.fn(),
  undo: vi.fn(),
  discard: vi.fn(),
  prefill: vi.fn(),
};

const rest = () =>
  new MailIngestController(inbox as unknown as MailIngestInboxService, actions as unknown as MailIngestActionsService);
const mcp = () =>
  new MailIngestMcp(inbox as unknown as MailIngestInboxService, actions as unknown as MailIngestActionsService);

/** The JSON a tool answered with. */
function read(result: { content: Array<{ type: string; text: string }> }): unknown {
  return JSON.parse(result.content[0].text);
}

async function thrown(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    return { status: (err as HttpException).getStatus(), body: (err as HttpException).getResponse() };
  }
  throw new Error('expected the handler to throw');
}

const statusOf = (proto: object, name: string): number | undefined =>
  Reflect.getMetadata(HTTP_CODE_METADATA, (proto as Record<string, unknown>)[name] as object) as number | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  inbox.entry.mockResolvedValue(view);
  for (const action of [actions.applyToTrip, actions.move, actions.fileToTrip, actions.undo, actions.discard]) {
    action.mockResolvedValue(row);
  }
});

describe('the settings card and the inbox', () => {
  it('answers each read from the inbox service for the signed-in person', async () => {
    inbox.settingsOf.mockResolvedValue({ available: true });
    inbox.inbox.mockResolvedValue({ entries: [] });
    inbox.count.mockResolvedValue({ pending: 2 });
    inbox.preview.mockResolvedValue({ id: 9 });
    expect(await rest().settings(user)).toEqual({ available: true });
    expect(await rest().list(user, { status: 'open', limit: 50 })).toEqual({ entries: [] });
    expect(inbox.inbox).toHaveBeenCalledWith(7, { status: 'open', limit: 50 });
    expect(await rest().count(user)).toEqual({ pending: 2 });
    expect(await rest().preview(user, '9')).toEqual({ id: 9 });
    expect(inbox.preview).toHaveBeenCalledWith(7, 9);
  });

  it('writes the switches and renews the own address, the renewal answering 200', async () => {
    inbox.updatePrefs.mockResolvedValue({ available: true });
    inbox.renewOwnAddress.mockResolvedValue({ address: null });
    await rest().updateSettings(user, { auto_add: false });
    expect(inbox.updatePrefs).toHaveBeenCalledWith(7, { auto_add: false });
    expect(await rest().renewAddress(user)).toEqual({ address: null });
    expect(statusOf(MailIngestController.prototype, 'renewAddress')).toBe(200);
  });

  it('answers 404 for a path id that is no id, without asking the services', async () => {
    expect(await thrown(() => rest().preview(user, 'abc'))).toEqual({ status: 404, body: { error: 'Mail not found' } });
    expect(await thrown(() => rest().discard(user, '0'))).toEqual({ status: 404, body: { error: 'Entry not found' } });
    expect(inbox.preview).not.toHaveBeenCalled();
    expect(actions.discard).not.toHaveBeenCalled();
  });
});

describe('acting on an entry, over REST and MCP alike', () => {
  it('apply and add_mail_booking: the suggested trip without trip_id, the picked one with it', async () => {
    expect(await rest().apply(user, '3', {})).toEqual({ candidate: view });
    expect(actions.applyToTrip).toHaveBeenLastCalledWith(3, 7, null);
    await rest().apply(user, '3', { trip_id: 12 });
    expect(actions.applyToTrip).toHaveBeenLastCalledWith(3, 7, 12);
    expect(read(await mcp().addMailBooking({ candidateId: 3, trip_id: 12 }, ctx))).toEqual({ candidate: view });
    expect(actions.applyToTrip).toHaveBeenLastCalledWith(3, 7, 12);
    expect(inbox.entry).toHaveBeenCalledWith(row);
  });

  it('move, file, undo and discard reach the same action with the same arguments from both sides', async () => {
    await rest().move(user, '3', { trip_id: 5 });
    await mcp().moveMailBooking({ candidateId: 3, trip_id: 5 }, ctx);
    expect(actions.move.mock.calls).toEqual([
      [3, 7, 5, false],
      [3, 7, 5, false],
    ]);
    await rest().file(user, '3', { trip_id: 5 });
    await mcp().fileMailBooking({ candidateId: 3, trip_id: 5 }, ctx);
    expect(actions.fileToTrip.mock.calls).toEqual([
      [3, 7, 5],
      [3, 7, 5],
    ]);
    await rest().undo(user, '3', { confirm: true });
    await mcp().undoMailBooking({ candidateId: 3, confirm: true }, ctx);
    expect(actions.undo.mock.calls).toEqual([
      [3, 7, true],
      [3, 7, true],
    ]);
    await rest().discard(user, '3');
    await mcp().discardMailBooking({ candidateId: 3 }, ctx);
    expect(actions.discard.mock.calls).toEqual([
      [3, 7],
      [3, 7],
    ]);
    for (const name of ['apply', 'move', 'file', 'undo', 'discard']) {
      expect(statusOf(MailIngestController.prototype, name), name).toBe(200);
    }
  });

  it('passes the service’s refusal on as it stands: the undo’s 409 with what it would touch', async () => {
    const conflict = new DomainError(409, 'Undoing this booking changes more than the booking', {
      details: { code: 'needs_confirmation', affects: ['balances'] },
    });
    actions.undo.mockRejectedValue(conflict);
    expect(await thrown(() => rest().undo(user, '3', {}))).toEqual({
      status: 409,
      body: {
        error: 'Undoing this booking changes more than the booking',
        code: 'needs_confirmation',
        affects: ['balances'],
      },
    });
    await expect(mcp().undoMailBooking({ candidateId: 3 }, ctx)).rejects.toBe(conflict);
  });

  it('prefills the form, and the MCP switches answer without the address and its token', async () => {
    actions.prefill.mockResolvedValue({ trip_id: null, item: { type: 'flight' } });
    expect(await rest().prefill(user, '3')).toEqual({ trip_id: null, item: { type: 'flight' } });
    inbox.updatePrefs.mockResolvedValue({
      available: true,
      address: { id: 1, address: 'trek+secrettoken@example.com' },
      prefs: { enabled: true, ai_enabled: false, auto_add: true },
      ai_available: false,
      pending: 0,
    });
    const answer = read(await mcp().updateMailImportSettings({ ai_enabled: false }, ctx));
    expect(answer).toEqual({
      available: true,
      prefs: { enabled: true, ai_enabled: false, auto_add: true },
      ai_available: false,
      pending: 0,
    });
    expect(JSON.stringify(answer)).not.toContain('secrettoken');
  });

  it('list_mail_inbox reads the same page the REST inbox reads', async () => {
    inbox.inbox.mockResolvedValue({ entries: [], pending: 0, next_before: null });
    expect(read(await mcp().listMailInbox({ status: 'resolved', limit: 10 }, ctx))).toEqual({
      entries: [],
      pending: 0,
      next_before: null,
    });
    expect(inbox.inbox).toHaveBeenCalledWith(7, { status: 'resolved', limit: 10 });
  });
});

describe('POST /api/mail-ingest/upload', () => {
  const file = (originalname: string, mimetype = 'application/octet-stream') =>
    ({ originalname, mimetype, buffer: Buffer.from('mail') }) as Express.Multer.File;

  it('takes an .eml (or a message/rfc822 file) and refuses anything else in the handler', async () => {
    inbox.upload.mockResolvedValue({ duplicate: false });
    expect(await rest().upload(user, file('booking.EML'))).toEqual({ duplicate: false });
    expect(inbox.upload).toHaveBeenCalledWith(7, Buffer.from('mail'));
    await rest().upload(user, file('mail', 'message/rfc822'));
    expect(await thrown(() => rest().upload(user, undefined))).toEqual({
      status: 400,
      body: { error: 'No file uploaded' },
    });
    expect(await thrown(() => rest().upload(user, file('ticket.pdf', 'application/pdf')))).toEqual({
      status: 400,
      body: { error: 'Upload a mail saved as an .eml file' },
    });
  });
});

describe('the trip address and the admin routes', () => {
  it('reads, renews and revokes the person’s address of the trip', async () => {
    inbox.tripAddress.mockResolvedValue({ address: null });
    inbox.renewTripAddress.mockResolvedValue({ address: null });
    const trips = new MailIngestTripController(inbox as unknown as MailIngestInboxService);
    expect(await trips.get(user, '4')).toEqual({ address: null });
    expect(inbox.tripAddress).toHaveBeenCalledWith(7, 4);
    await trips.renew(user, '4');
    expect(inbox.renewTripAddress).toHaveBeenCalledWith(7, 4);
    expect(await trips.revoke(user, '4')).toEqual({ success: true });
    expect(inbox.revokeTripAddress).toHaveBeenCalledWith(7, 4);
    expect(statusOf(MailIngestTripController.prototype, 'renew')).toBe(200);
  });

  it('answers the status card and the connection test from the status service', async () => {
    const status = { status: vi.fn().mockResolvedValue({ transport: 'off' }), test: vi.fn() };
    status.test.mockResolvedValue({ transport: 'off', ok: false, error: 'No transport is set' });
    const admin = new MailIngestAdminController(status as unknown as MailIngestStatusService);
    expect(await admin.read()).toEqual({ transport: 'off' });
    expect(await admin.test()).toEqual({ transport: 'off', ok: false, error: 'No transport is set' });
    expect(statusOf(MailIngestAdminController.prototype, 'test')).toBe(200);
  });
});

describe('POST /api/mail-ingest/inbound', () => {
  const webhook = {
    secret: vi.fn(),
    maxBytes: vi.fn(() => 10),
    receive: vi.fn(),
  };
  const controller = () => new MailIngestInboundController(webhook as unknown as MailIngestWebhookService);

  /** A request whose body arrives as a stream, the way Express hands an unparsed one on. */
  function request(body: string, headers: Record<string, string>): Request {
    const stream = new PassThrough();
    const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    Object.assign(stream, {
      get: (name: string) => lower[name.toLowerCase()],
      is: (type: string) => (lower['content-type'] === type ? type : false),
    });
    setImmediate(() => stream.end(body));
    return stream as unknown as Request;
  }

  beforeEach(() => {
    webhook.secret.mockResolvedValue('s3cret');
    webhook.receive.mockResolvedValue({ accepted: true, duplicate: false });
  });

  it('reads the raw mail and hands it with the signed headers to the webhook service', async () => {
    const req = request('Subject: x', {
      'content-type': 'message/rfc822',
      'x-trek-timestamp': '1700000000',
      'x-trek-signature': 'sha256=ab',
      'x-trek-recipient': 'trek+t@example.com',
    });
    expect(await controller().receive(req)).toEqual({ accepted: true, duplicate: false });
    expect(webhook.receive).toHaveBeenCalledWith('s3cret', Buffer.from('Subject: x'), {
      timestamp: '1700000000',
      signature: 'sha256=ab',
      recipient: 'trek+t@example.com',
    });
  });

  it('is a 404 while the webhook is closed, and refuses a body that is no raw mail or too large', async () => {
    webhook.secret.mockRejectedValueOnce(new DomainError(404, 'Not found'));
    const closed = await thrown(() => controller().receive(request('x', { 'content-type': 'message/rfc822' })));
    expect(closed).toEqual({ status: 404, body: { error: 'Not found' } });
    const json = await thrown(() => controller().receive(request('{}', { 'content-type': 'application/json' })));
    expect(json.status).toBe(415);
    const large = await thrown(() =>
      controller().receive(request('Subject: far too long', { 'content-type': 'message/rfc822' })),
    );
    expect(large).toEqual({ status: 413, body: { error: 'This mail is larger than the import takes' } });
    const declared = request('x', { 'content-type': 'message/rfc822', 'content-length': '999' });
    expect((await thrown(() => controller().receive(declared))).status).toBe(413);
    expect(webhook.receive).not.toHaveBeenCalled();
  });
});
