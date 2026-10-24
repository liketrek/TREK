/**
 * The assistant controller: its guards (addon before auth, then the trip),
 * the managed marker, the routes with their statuses and contracts, and that
 * every handler hands the caller's own id and the route's trip (as the
 * conversation's scope) to the service.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../../src/nest/addons/require-addon.decorator';
import type { AssistantFoundPlacesService } from '../../../../src/nest/assistant/assistant-found-places.service';
import type { AssistantProposalsService } from '../../../../src/nest/assistant/assistant-proposals.service';
import type { AssistantShareService } from '../../../../src/nest/assistant/assistant-share.service';
import { AssistantController } from '../../../../src/nest/assistant/assistant.controller';
import type { AssistantService, TurnChannel } from '../../../../src/nest/assistant/assistant.service';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { MANAGED_FORBIDDEN } from '../../../../src/nest/common/managed';
import { TRIP_PERMISSION_KEY, TripAccessGuard } from '../../../../src/nest/permissions/trip-access.guard';
import type { User } from '../../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import type { Response } from 'express';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const user = { id: 7, role: 'user' } as User;
const CHAT = { locale: 'en', timeZone: 'UTC', threadId: null, text: 'Hi' };
/** The scope of trip 5, as the controller hands it on. */
const TRIP = { kind: 'trip', tripId: 5 };

function make() {
  const service = {
    listThreads: vi.fn(async () => ({ threads: [] })),
    getThread: vi.fn(async () => ({ thread: { id: 1, title: 't', lastMessageAt: 'x' }, messages: [] })),
    deleteThread: vi.fn(async () => undefined),
    chat: vi.fn(async (_u: number, _s: unknown, _b: unknown, _c: TurnChannel) => undefined),
    decide: vi.fn(async (_u: number, _s: unknown, _th: number, _b: unknown, _c: TurnChannel) => undefined),
    undo: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
  };
  const foundPlaces = {
    add: vi.fn(async () => ({ message: { id: 'msg-3' } })),
    insertIntoTour: vi.fn(async () => ({ message: { id: 'msg-4' } })),
  };
  const shares = { share: vi.fn(async () => ({ message: { id: 12, origin: 'assistant' } })) };
  const proposals = { take: vi.fn(async () => ({ message: { id: 'msg-4' } })) };
  const controller = new AssistantController(
    service as unknown as AssistantService,
    foundPlaces as unknown as AssistantFoundPlacesService,
    shares as unknown as AssistantShareService,
    proposals as unknown as AssistantProposalsService,
  );
  return { service, foundPlaces, shares, proposals, controller };
}

/** Enough of an Express response for the stream: headers, writes and the close event. */
class FakeResponse extends EventEmitter {
  writableEnded = false;
  destroyed = false;
  readonly written: string[] = [];
  readonly headers: Record<string, string> = {};
  readonly flushHeaders = vi.fn();

  status(_code: number): this {
    return this;
  }

  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  write(chunk: string): boolean {
    this.written.push(chunk);
    return true;
  }

  end(): void {
    this.writableEnded = true;
  }
}

function route(name: string) {
  const handler = (AssistantController.prototype as unknown as Record<string, object>)[name];
  return {
    method: Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod,
    path: Reflect.getMetadata(PATH_METADATA, handler) as string,
    httpCode: Reflect.getMetadata(HTTP_CODE_METADATA, handler) as number | undefined,
  };
}

describe('AssistantController', () => {
  it('ASTCTL-001: sits behind the addon, then auth, then the trip, and is withheld on a managed install', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AssistantController)).toBe('api/trips/:tripId/assistant');
    expect(Reflect.getMetadata(GUARDS_METADATA, AssistantController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, AssistantController)).toMatchObject({ addonId: 'ai_assistant' });
    expect(Reflect.getMetadata(MANAGED_FORBIDDEN, AssistantController)?.reason).toBeTruthy();
  });

  it('ASTCTL-002: declares its routes with the statuses the contract names', () => {
    expect(route('threads')).toMatchObject({ method: RequestMethod.GET, path: 'threads' });
    expect(route('thread')).toMatchObject({ method: RequestMethod.GET, path: 'threads/:threadId' });
    expect(route('deleteThread')).toEqual({ method: RequestMethod.DELETE, path: 'threads/:threadId', httpCode: 200 });
    expect(route('chat')).toMatchObject({ method: RequestMethod.POST, path: 'chat' });
    expect(route('decide')).toMatchObject({ method: RequestMethod.POST, path: 'threads/:threadId/decisions' });
    expect(route('undo')).toEqual({ method: RequestMethod.POST, path: 'tool-calls/:toolCallId/undo', httpCode: 200 });
    expect(route('stop')).toEqual({ method: RequestMethod.POST, path: 'stop', httpCode: 200 });
    expect(route('addFoundPlace')).toEqual({
      method: RequestMethod.POST,
      path: 'threads/:threadId/found-places',
      httpCode: 200,
    });
    expect(route('insertFoundPlace')).toEqual({
      method: RequestMethod.POST,
      path: 'threads/:threadId/found-places/tour',
      httpCode: 200,
    });
    expect(route('takeProposal')).toEqual({
      method: RequestMethod.POST,
      path: 'threads/:threadId/proposals',
      httpCode: 200,
    });
    expect(route('share')).toEqual({
      method: RequestMethod.POST,
      path: 'threads/:threadId/messages/:messageId/share',
      httpCode: 201,
    });
  });

  it('ASTCTL-003: hands the caller and the trip to the service, and answers the contract bodies', async () => {
    const { service, controller } = make();
    await controller.threads(user, '5');
    expect(service.listThreads).toHaveBeenCalledWith(7, TRIP);
    await controller.thread(user, '5', '9');
    expect(service.getThread).toHaveBeenCalledWith(7, TRIP, 9);
    expect(await controller.deleteThread(user, '5', '9')).toEqual({ success: true });
    expect(service.deleteThread).toHaveBeenCalledWith(7, TRIP, 9);
    expect(await controller.undo(user, '5', 'tc-1', {})).toEqual({ undone: true });
    expect(service.undo).toHaveBeenCalledWith(7, TRIP, 'tc-1');
    expect(await controller.stop(user, {})).toEqual({ success: true });
    expect(service.stop).toHaveBeenCalledWith(7);
  });

  it('ASTCTL-007: a found place and a share go to their services with the caller, the trip and the thread', async () => {
    const { foundPlaces, shares, controller } = make();
    const body = { locale: 'en', timeZone: 'UTC', ref: 'call_1:0', dayId: 4 };
    expect(await controller.addFoundPlace(user, '5', '9', body)).toEqual({ message: { id: 'msg-3' } });
    expect(foundPlaces.add).toHaveBeenCalledWith(7, 5, 9, body);
    expect(await controller.share(user, '5', '9', 'msg-3', { text: 'Hi all' }, 'sock-1')).toEqual({
      message: { id: 12, origin: 'assistant' },
    });
    expect(shares.share).toHaveBeenCalledWith(user, 5, 9, 'msg-3', 'Hi all', 'sock-1');
    expect(() => controller.addFoundPlace(user, '5', 'x', body)).toThrow(DomainError);
    const stop = { locale: 'en', timeZone: 'UTC', ref: 'call_1:0', tourId: 64 };
    expect(await controller.insertFoundPlace(user, '5', '9', stop)).toEqual({ message: { id: 'msg-4' } });
    expect(foundPlaces.insertIntoTour).toHaveBeenCalledWith(7, 5, 9, stop);
  });

  it('ASTCTL-008: sharing asks for the trip chat right, "Plan this" and "+ Day" for editing places; nothing else asks', () => {
    const handlers = AssistantController.prototype as unknown as Record<string, object>;
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handlers.share)).toBe('collab_edit');
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handlers.takeProposal)).toBe('place_edit');
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handlers.addFoundPlace)).toBe('place_edit');
    expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handlers.insertFoundPlace)).toBe('place_edit');
    for (const name of ['chat', 'decide', 'undo']) {
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handlers[name]), name).toBeUndefined();
    }
  });

  it('ASTCTL-009: "Plan this" goes to the proposals with the caller, the trip and the thread', async () => {
    const { proposals, controller } = make();
    const body = { locale: 'en', timeZone: 'UTC', toolCallId: 'call_7' };
    expect(await controller.takeProposal(user, '5', '9', body)).toEqual({ message: { id: 'msg-4' } });
    expect(proposals.take).toHaveBeenCalledWith(7, 5, 9, body);
    expect(() => controller.takeProposal(user, '5', '0', body)).toThrow(DomainError);
  });

  it('ASTCTL-004: a thread id that is not one answers 404', () => {
    const { controller } = make();
    for (const bad of ['0', '-3', 'abc', '1.5']) {
      expect(() => controller.thread(user, '5', bad)).toThrow(DomainError);
    }
  });

  it('ASTCTL-005: a turn opens its stream on the response only when the service asks for it', async () => {
    const { service, controller } = make();
    const res = new FakeResponse();
    await controller.chat(user, '5', CHAT, res as unknown as Response);
    const channel = service.chat.mock.calls[0][3];
    expect(service.chat.mock.calls[0].slice(0, 3)).toEqual([7, TRIP, CHAT]);
    expect(res.flushHeaders).not.toHaveBeenCalled();
    const stream = channel.open();
    expect(res.headers['Content-Type']).toBe('text/event-stream; charset=utf-8');
    expect(res.headers['X-Accel-Buffering']).toBe('no');
    stream.send('{"type":"start","messageId":"msg-1"}');
    expect(res.written).toEqual(['data: {"type":"start","messageId":"msg-1"}\n\n']);
  });

  it('ASTCTL-006: the turn learns that its client went away, not that a finished response closed', async () => {
    const { service, controller } = make();
    const gone = new FakeResponse();
    await controller.decide(
      user,
      '5',
      '9',
      { locale: 'en', timeZone: 'UTC', decisions: [] },
      gone as unknown as Response,
    );
    expect(service.decide.mock.calls[0].slice(0, 3)).toEqual([7, TRIP, 9]);
    const goneSignal = service.decide.mock.calls[0][4].signal;
    gone.emit('close');
    expect(goneSignal.aborted).toBe(true);

    const done = new FakeResponse();
    await controller.chat(user, '5', CHAT, done as unknown as Response);
    const doneSignal = service.chat.mock.calls[0][3].signal;
    done.writableEnded = true;
    done.emit('close');
    expect(doneSignal.aborted).toBe(false);
  });
});
