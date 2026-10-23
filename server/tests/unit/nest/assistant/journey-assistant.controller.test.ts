/**
 * The Studio assistant's controller and its guard: the AI addon before auth,
 * then the journey addon and the journey (both a 404 worded like the journey
 * routes'), the managed marker, the routes with their statuses, and that every
 * handler hands the caller's own id and the journey (as the conversation's
 * scope) to the same service the trip's controller uses.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../../src/nest/addons/addon.guard';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import { REQUIRE_ADDON } from '../../../../src/nest/addons/require-addon.decorator';
import type { AssistantBookContext } from '../../../../src/nest/assistant/assistant-book-context';
import type { AssistantService, TurnChannel } from '../../../../src/nest/assistant/assistant.service';
import { JourneyAssistantController } from '../../../../src/nest/assistant/journey-assistant.controller';
import { JourneyAssistantGuard } from '../../../../src/nest/assistant/journey-assistant.guard';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { MANAGED_FORBIDDEN } from '../../../../src/nest/common/managed';
import type { User } from '../../../../src/types';
import { HttpException, RequestMethod, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import type { Response } from 'express';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const user = { id: 7, role: 'user' } as User;
const JOURNEY = { kind: 'journey', journeyId: 12 };

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
  const controller = new JourneyAssistantController(service as unknown as AssistantService);
  return { service, controller };
}

/** Enough of an Express response for a turn to hand to the service. */
class FakeResponse extends EventEmitter {
  writableEnded = false;
  destroyed = false;
}

function route(name: string) {
  const handler = (JourneyAssistantController.prototype as unknown as Record<string, object>)[name];
  return {
    method: Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod,
    path: Reflect.getMetadata(PATH_METADATA, handler) as string,
    httpCode: Reflect.getMetadata(HTTP_CODE_METADATA, handler) as number | undefined,
  };
}

function guardWith(addonOn: boolean, canOpen: boolean) {
  const addons = { isAddonEnabled: vi.fn(async () => addonOn) };
  const books = { canOpen: vi.fn(async () => canOpen) };
  const guard = new JourneyAssistantGuard(addons as unknown as AddonsService, books as unknown as AssistantBookContext);
  return { addons, books, guard };
}

function contextOf(journeyId: string, who: User | null = user): ExecutionContext {
  const request = { user: who ?? undefined, params: { journeyId } };
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

async function refusal(run: Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await run;
  } catch (err) {
    if (err instanceof HttpException) return { status: err.getStatus(), body: err.getResponse() };
    throw err;
  }
  throw new Error('expected a refusal');
}

describe('JourneyAssistantController', () => {
  it('ASTJCTL-001: sits behind the AI addon, then auth, then the journey, and is withheld on a managed install', () => {
    expect(Reflect.getMetadata(PATH_METADATA, JourneyAssistantController)).toBe('api/journeys/:journeyId/assistant');
    expect(Reflect.getMetadata(GUARDS_METADATA, JourneyAssistantController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      JourneyAssistantGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, JourneyAssistantController)).toMatchObject({ addonId: 'ai_assistant' });
    expect(Reflect.getMetadata(MANAGED_FORBIDDEN, JourneyAssistantController)?.reason).toBeTruthy();
  });

  it('ASTJCTL-002: declares the routes of the trip assistant that a journey has, with their statuses', () => {
    expect(route('threads')).toMatchObject({ method: RequestMethod.GET, path: 'threads' });
    expect(route('thread')).toMatchObject({ method: RequestMethod.GET, path: 'threads/:threadId' });
    expect(route('deleteThread')).toEqual({ method: RequestMethod.DELETE, path: 'threads/:threadId', httpCode: 200 });
    expect(route('chat')).toMatchObject({ method: RequestMethod.POST, path: 'chat' });
    expect(route('decide')).toMatchObject({ method: RequestMethod.POST, path: 'threads/:threadId/decisions' });
    expect(route('undo')).toEqual({ method: RequestMethod.POST, path: 'tool-calls/:toolCallId/undo', httpCode: 200 });
    expect(route('stop')).toEqual({ method: RequestMethod.POST, path: 'stop', httpCode: 200 });
    const handlers = JourneyAssistantController.prototype as unknown as Record<string, unknown>;
    const tripOnly = ['addFoundPlace', 'takeProposal', 'share', 'attach'];
    for (const name of tripOnly) expect(handlers[name], name).toBeUndefined();
  });

  it('ASTJCTL-003: hands the caller and the journey to the service, and answers the contract bodies', async () => {
    const { service, controller } = make();
    await controller.threads(user, '12');
    expect(service.listThreads).toHaveBeenCalledWith(7, JOURNEY);
    await controller.thread(user, '12', '9');
    expect(service.getThread).toHaveBeenCalledWith(7, JOURNEY, 9);
    expect(await controller.deleteThread(user, '12', '9')).toEqual({ success: true });
    expect(service.deleteThread).toHaveBeenCalledWith(7, JOURNEY, 9);
    expect(await controller.undo(user, '12', 'tc-1', {})).toEqual({ undone: true });
    expect(service.undo).toHaveBeenCalledWith(7, JOURNEY, 'tc-1');
    expect(await controller.stop(user, {})).toEqual({ success: true });
    expect(service.stop).toHaveBeenCalledWith(7);
    expect(() => controller.thread(user, '12', 'abc')).toThrow(DomainError);
  });

  it('ASTJCTL-004: a turn and a decision go to the service with the journey and the stream of the response', async () => {
    const { service, controller } = make();
    const chat = { locale: 'en', timeZone: 'UTC', threadId: null, text: 'Hi' };
    await controller.chat(user, '12', chat, new FakeResponse() as unknown as Response);
    expect(service.chat.mock.calls[0].slice(0, 3)).toEqual([7, JOURNEY, chat]);
    const decisions = { locale: 'en', timeZone: 'UTC', decisions: [] };
    const gone = new FakeResponse();
    await controller.decide(user, '12', '9', decisions, gone as unknown as Response);
    expect(service.decide.mock.calls[0].slice(0, 3)).toEqual([7, JOURNEY, 9]);
    gone.emit('close');
    expect(service.decide.mock.calls[0][4].signal.aborted).toBe(true);
  });
});

describe('JourneyAssistantGuard', () => {
  it('ASTJCTL-010: lets a member of the journey through while the journey addon is on', async () => {
    const { books, guard } = guardWith(true, true);
    expect(await guard.canActivate(contextOf('12'))).toBe(true);
    expect(books.canOpen).toHaveBeenCalledWith(7, 12);
  });

  it('ASTJCTL-011: answers 404 with the journey routes wording when the addon is off or the journey is not open', async () => {
    const off = guardWith(false, true);
    expect(await refusal(off.guard.canActivate(contextOf('12')))).toEqual({
      status: 404,
      body: { error: 'Journey addon is not enabled' },
    });
    expect(off.books.canOpen).not.toHaveBeenCalled();
    const closed = guardWith(true, false);
    expect(await refusal(closed.guard.canActivate(contextOf('12')))).toEqual({
      status: 404,
      body: { error: 'Journey not found' },
    });
  });

  it('ASTJCTL-012: an id that is not one never reaches the journey, and a request without a user is refused', async () => {
    const { books, guard } = guardWith(true, true);
    const bad = ['abc', '0', '-2', '1.5'];
    const refused = await Promise.all(bad.map((id) => refusal(guard.canActivate(contextOf(id)))));
    expect(refused.map((answer) => answer.status)).toEqual([404, 404, 404, 404]);
    expect(books.canOpen).not.toHaveBeenCalled();
    expect((await refusal(guard.canActivate(contextOf('12', null)))).status).toBe(401);
  });
});
