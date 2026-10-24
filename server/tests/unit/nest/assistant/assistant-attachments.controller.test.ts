/**
 * The attachment route: a multipart upload, so only auth runs as a guard and
 * the addon, the managed install and the trip are refused in the handler with
 * the guards' own answers; the file is checked before the turn starts, and
 * the turn streams on the response like a chat turn.
 */
import 'reflect-metadata';

import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { AssistantAttachmentsController } from '../../../../src/nest/assistant/assistant-attachments.controller';
import type { AssistantService, TurnChannel } from '../../../../src/nest/assistant/assistant.service';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { MANAGED_FORBIDDEN, MANAGED_FORBIDDEN_ERROR } from '../../../../src/nest/common/managed';
import type { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import type { User } from '../../../../src/types';
import { HttpException, RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import type { Response } from 'express';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const user = { id: 7, role: 'user' } as User;
const BODY = { locale: 'de', timeZone: 'Europe/Berlin' };

function file(name: string, size = 100): Express.Multer.File {
  return { originalname: name, size, mimetype: 'application/pdf', buffer: Buffer.alloc(0) } as Express.Multer.File;
}

/** Enough of an Express response for the stream: headers, writes and the close event. */
class FakeResponse extends EventEmitter {
  writableEnded = false;
  destroyed = false;
  readonly headers: Record<string, string> = {};
  readonly flushHeaders = vi.fn();
  status(_code: number): this {
    return this;
  }
  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }
  write(): boolean {
    return true;
  }
  end(): void {
    this.writableEnded = true;
  }
}

function make(opts: { addon?: boolean; managed?: boolean; trip?: boolean } = {}) {
  const service = {
    attach: vi.fn(async (_u: number, _t: number, _b: unknown, _f: unknown, _c: TurnChannel) => undefined),
  };
  const trips = { findAccessible: vi.fn(async () => (opts.trip === false ? undefined : { id: 5, user_id: 7 })) };
  const addons = { isAddonEnabled: vi.fn(async () => opts.addon !== false) };
  const env = { isManaged: () => opts.managed === true };
  const controller = new AssistantAttachmentsController(
    service as unknown as AssistantService,
    trips as unknown as TripAccessService,
    addons as unknown as AddonsService,
    env as unknown as RuntimeEnvService,
  );
  return { service, trips, addons, controller };
}

async function refusal(promise: Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await promise;
  } catch (err) {
    // A DomainError is an HttpException whose response is the body the client gets.
    if (err instanceof HttpException) return { status: err.getStatus(), body: err.getResponse() };
    throw err;
  }
  throw new Error('expected a refusal');
}

describe('AssistantAttachmentsController', () => {
  it('ASTATT-001: sits behind auth alone, marked managed but refused in the handler', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AssistantAttachmentsController)).toBe('api/trips/:tripId/assistant');
    expect(Reflect.getMetadata(GUARDS_METADATA, AssistantAttachmentsController)).toEqual([JwtAuthGuard]);
    const handler = AssistantAttachmentsController.prototype.attach;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('attachments');
    expect(Reflect.getMetadata(MANAGED_FORBIDDEN, handler)).toMatchObject({ enforcedInHandler: true });
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
  });

  it('ASTATT-002: the addon, the managed install and the trip answer as their guards would', async () => {
    const res = new FakeResponse() as unknown as Response;
    const off = make({ addon: false });
    expect(await refusal(off.controller.attach(user, '5', file('a.pdf'), BODY, res))).toEqual({
      status: 404,
      body: { error: 'AI assistant addon is not enabled' },
    });
    const managed = make({ managed: true });
    expect(await refusal(managed.controller.attach(user, '5', file('a.pdf'), BODY, res))).toEqual({
      status: 403,
      body: MANAGED_FORBIDDEN_ERROR,
    });
    const stranger = make({ trip: false });
    expect(await refusal(stranger.controller.attach(user, '5', file('a.pdf'), BODY, res))).toEqual({
      status: 404,
      body: { error: 'Trip not found' },
    });
    expect(stranger.trips.findAccessible).toHaveBeenCalledWith('5', 7);
    for (const t of [off, managed, stranger]) expect(t.service.attach).not.toHaveBeenCalled();
  });

  it('ASTATT-003: a missing, too large or unknown file is refused before the turn', async () => {
    const t = make();
    const res = new FakeResponse() as unknown as Response;
    expect(await refusal(t.controller.attach(user, '5', undefined, BODY, res))).toMatchObject({
      status: 400,
      body: { error: 'No file uploaded', code: 'generic' },
    });
    const large = await refusal(t.controller.attach(user, '5', file('a.pdf', 10 * 1024 * 1024 + 1), BODY, res));
    expect(large).toMatchObject({ status: 400, body: { error: 'The file is larger than 10 MB', code: 'generic' } });
    const unknown = await refusal(t.controller.attach(user, '5', file('setup.exe'), BODY, res));
    expect(unknown).toMatchObject({ status: 400, body: { code: 'generic' } });
    const { error } = unknown.body as { error: string };
    expect(error).toMatch(/^Unsupported file type: setup\.exe\. Accepted: EML, PDF/);
    expect(t.service.attach).not.toHaveBeenCalled();
  });

  it('ASTATT-004: an accepted file starts the turn on the response, for the caller and the trip', async () => {
    const t = make();
    const res = new FakeResponse();
    await Promise.all(
      ['Bestätigung.PDF', 'ticket.pkpass', 'trip.ics', 'mail.eml', 'photo.jpg'].map((name) =>
        t.controller.attach(user, '5', file(name), BODY, res as unknown as Response),
      ),
    );
    expect(t.service.attach).toHaveBeenCalledTimes(5);
    const [userId, tripId, body, given, channel] = t.service.attach.mock.calls[0];
    expect([userId, tripId, body]).toEqual([7, 5, BODY]);
    expect(given).toMatchObject({ originalname: 'Bestätigung.PDF' });
    expect(res.flushHeaders).not.toHaveBeenCalled();
    channel.open();
    expect(res.headers['Content-Type']).toBe('text/event-stream; charset=utf-8');
    res.emit('close');
    expect(channel.signal.aborted).toBe(true);
  });
});
