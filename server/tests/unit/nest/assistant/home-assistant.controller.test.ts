/**
 * The home assistant's controller: the AI addon before auth and nothing else
 * to open, the managed marker, the routes with their statuses, and that every
 * handler hands the caller's own id and the home scope to the same service
 * the trip's and the journey's controllers use.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../../src/nest/addons/require-addon.decorator';
import type { AssistantService, TurnChannel } from '../../../../src/nest/assistant/assistant.service';
import { HomeAssistantController } from '../../../../src/nest/assistant/home-assistant.controller';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { MANAGED_FORBIDDEN } from '../../../../src/nest/common/managed';
import { MANAGED_ROUTE_ALLOW_LIST } from '../../../../src/nest/common/validate-managed-routes';
import type { User } from '../../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import type { Response } from 'express';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const user = { id: 7, role: 'user' } as User;
const HOME = { kind: 'home' };

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
  const controller = new HomeAssistantController(service as unknown as AssistantService);
  return { service, controller };
}

/** Enough of an Express response for a turn to hand to the service. */
class FakeResponse extends EventEmitter {
  writableEnded = false;
  destroyed = false;
}

function route(name: string) {
  const handler = (HomeAssistantController.prototype as unknown as Record<string, object>)[name];
  return {
    method: Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod,
    path: Reflect.getMetadata(PATH_METADATA, handler) as string,
    httpCode: Reflect.getMetadata(HTTP_CODE_METADATA, handler) as number | undefined,
  };
}

describe('HomeAssistantController', () => {
  it('ASTHCTL-001: sits behind the AI addon and auth, and is withheld on a managed install', () => {
    expect(Reflect.getMetadata(PATH_METADATA, HomeAssistantController)).toBe('api/assistant');
    expect(Reflect.getMetadata(GUARDS_METADATA, HomeAssistantController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, HomeAssistantController)).toMatchObject({ addonId: 'ai_assistant' });
    expect(Reflect.getMetadata(MANAGED_FORBIDDEN, HomeAssistantController)?.reason).toBeTruthy();
    for (const name of ['chat', 'decide', 'deleteThread', 'stop', 'thread', 'threads', 'undo']) {
      expect(MANAGED_ROUTE_ALLOW_LIST, name).toContain(`HomeAssistantController.${name}`);
    }
  });

  it('ASTHCTL-002: declares the conversation routes, with their statuses, and none that belongs to a trip', () => {
    expect(route('threads')).toMatchObject({ method: RequestMethod.GET, path: 'threads' });
    expect(route('thread')).toMatchObject({ method: RequestMethod.GET, path: 'threads/:threadId' });
    expect(route('deleteThread')).toEqual({ method: RequestMethod.DELETE, path: 'threads/:threadId', httpCode: 200 });
    expect(route('chat')).toMatchObject({ method: RequestMethod.POST, path: 'chat' });
    expect(route('decide')).toMatchObject({ method: RequestMethod.POST, path: 'threads/:threadId/decisions' });
    expect(route('undo')).toEqual({ method: RequestMethod.POST, path: 'tool-calls/:toolCallId/undo', httpCode: 200 });
    expect(route('stop')).toEqual({ method: RequestMethod.POST, path: 'stop', httpCode: 200 });
    const handlers = HomeAssistantController.prototype as unknown as Record<string, unknown>;
    for (const name of ['addFoundPlace', 'takeProposal', 'share', 'attach', 'upload']) {
      expect(handlers[name], name).toBeUndefined();
    }
  });

  it('ASTHCTL-003: hands the caller and the home scope to the service, and answers the contract bodies', async () => {
    const { service, controller } = make();
    await controller.threads(user);
    expect(service.listThreads).toHaveBeenCalledWith(7, HOME);
    await controller.thread(user, '9');
    expect(service.getThread).toHaveBeenCalledWith(7, HOME, 9);
    expect(await controller.deleteThread(user, '9')).toEqual({ success: true });
    expect(service.deleteThread).toHaveBeenCalledWith(7, HOME, 9);
    expect(await controller.undo(user, 'tc-1', {})).toEqual({ undone: true });
    expect(service.undo).toHaveBeenCalledWith(7, HOME, 'tc-1');
    expect(await controller.stop(user, {})).toEqual({ success: true });
    expect(service.stop).toHaveBeenCalledWith(7);
    expect(() => controller.thread(user, 'abc')).toThrow(DomainError);
    await expect(controller.deleteThread(user, '0')).rejects.toThrow(DomainError);
  });

  it('ASTHCTL-004: a turn and a decision go to the service at home, with the stream of the response', async () => {
    const { service, controller } = make();
    const chat = { locale: 'en', timeZone: 'UTC', threadId: null, text: 'Which trip is next?' };
    await controller.chat(user, chat, new FakeResponse() as unknown as Response);
    expect(service.chat.mock.calls[0].slice(0, 3)).toEqual([7, HOME, chat]);
    const decisions = { locale: 'en', timeZone: 'UTC', decisions: [] };
    const gone = new FakeResponse();
    await controller.decide(user, '9', decisions, gone as unknown as Response);
    expect(service.decide.mock.calls[0].slice(0, 3)).toEqual([7, HOME, 9]);
    gone.emit('close');
    expect(service.decide.mock.calls[0][4].signal.aborted).toBe(true);
  });
});
