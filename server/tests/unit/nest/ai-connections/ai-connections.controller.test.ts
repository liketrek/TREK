/**
 * The two AI connection controllers: their routes, guards, addon gate,
 * managed marker and response contracts, and that each handler hands the
 * caller's own id (never one from the body) to the service.
 */
import 'reflect-metadata';

import { AddonGuard } from '../../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../../src/nest/addons/require-addon.decorator';
import { AiAdminController } from '../../../../src/nest/ai-connections/ai-admin.controller';
import { AiConnectionsController } from '../../../../src/nest/ai-connections/ai-connections.controller';
import type { AiConnectionsService } from '../../../../src/nest/ai-connections/ai-connections.service';
import type { ChatgptAuthService } from '../../../../src/nest/ai-connections/chatgpt-auth.service';
import type { OpenrouterAuthService } from '../../../../src/nest/ai-connections/openrouter-auth.service';
import { AdminGuard } from '../../../../src/nest/auth-core/admin.guard';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { MANAGED_FORBIDDEN } from '../../../../src/nest/common/managed';
import type { User } from '../../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { describe, expect, it, vi } from 'vitest';

const VIEW = { scope: 'user', kind: 'anthropic', model: 'm', hint: '…1234', status: 'ok', host: 'api.anthropic.com' };
const INSTANCE_VIEW = { ...VIEW, scope: 'instance', kind: 'chatgpt', host: 'chatgpt.com' };
const ADMIN_CONNECTION = { connection: INSTANCE_VIEW, prefill: null };
const user = { id: 7, role: 'user' } as User;

function services() {
  return {
    connections: {
      status: vi.fn(async () => ({ available: true })),
      listOwnModels: vi.fn(async () => [{ id: 'm', label: 'M', supportsTools: true }]),
      saveOwnKey: vi.fn(async () => VIEW),
      setOwnModel: vi.fn(async () => VIEW),
      removeOwn: vi.fn(async () => undefined),
      ackPrivacy: vi.fn(async () => undefined),
      ownView: vi.fn(async () => VIEW),
      instanceView: vi.fn(async () => INSTANCE_VIEW),
      readSettings: vi.fn(async () => ({ policy: 'user' })),
      writeSettings: vi.fn(async () => ({ policy: 'user' })),
      instanceConnection: vi.fn(async () => ADMIN_CONNECTION),
      saveInstance: vi.fn(async () => ({ connection: null, prefill: null })),
      removeInstance: vi.fn(async () => undefined),
      listInstanceModels: vi.fn(async () => []),
    },
    chatgpt: {
      start: vi.fn(async () => ({ flowId: 'f', authorizeUrl: 'https://auth.openai.com', expiresAt: 'x' })),
      finish: vi.fn(async (): Promise<'user' | 'instance'> => 'user'),
      signOut: vi.fn(async () => undefined),
    },
    openrouter: {
      start: vi.fn(async () => ({ flowId: 'f', authorizeUrl: 'https://openrouter.ai/auth', expiresAt: 'x' })),
      finish: vi.fn(async () => VIEW),
    },
  };
}

function userController(s = services()) {
  return {
    s,
    controller: new AiConnectionsController(
      s.connections as unknown as AiConnectionsService,
      s.chatgpt as unknown as ChatgptAuthService,
      s.openrouter as unknown as OpenrouterAuthService,
    ),
  };
}

function route(ctor: { prototype: object }, name: string) {
  const handler = (ctor.prototype as Record<string, unknown>)[name] as object;
  return {
    method: Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod,
    path: Reflect.getMetadata(PATH_METADATA, handler) as string,
    httpCode: Reflect.getMetadata(HTTP_CODE_METADATA, handler) as number | undefined,
  };
}

describe('AiConnectionsController', () => {
  it('AICTL-001: sits behind the addon, then auth, and is withheld on a managed install', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AiConnectionsController)).toBe('api/ai');
    expect(Reflect.getMetadata(GUARDS_METADATA, AiConnectionsController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, AiConnectionsController)).toEqual({
      addonId: ['ai_assistant', 'llm_parsing'],
      label: 'AI assistant',
    });
    expect(Reflect.getMetadata(MANAGED_FORBIDDEN, AiConnectionsController)?.reason).toBeTruthy();
  });

  it('AICTL-002: the routes, their methods and the 200 on every POST and DELETE', () => {
    expect(
      [
        'status',
        'models',
        'connect',
        'setModel',
        'disconnect',
        'ackPrivacy',
        'startChatgpt',
        'finishChatgpt',
        'signOutChatgpt',
        'startOpenrouter',
        'finishOpenrouter',
      ].map((name) => route(AiConnectionsController, name)),
    ).toEqual([
      { method: RequestMethod.GET, path: 'status', httpCode: undefined },
      { method: RequestMethod.GET, path: 'models', httpCode: undefined },
      { method: RequestMethod.PUT, path: 'connection', httpCode: undefined },
      { method: RequestMethod.PATCH, path: 'connection/model', httpCode: undefined },
      { method: RequestMethod.DELETE, path: 'connection', httpCode: 200 },
      { method: RequestMethod.POST, path: 'privacy-ack', httpCode: 200 },
      { method: RequestMethod.POST, path: 'connect/chatgpt/start', httpCode: 200 },
      { method: RequestMethod.POST, path: 'connect/chatgpt/finish', httpCode: 200 },
      { method: RequestMethod.POST, path: 'connect/chatgpt/sign-out', httpCode: 200 },
      { method: RequestMethod.POST, path: 'connect/openrouter/start', httpCode: 200 },
      { method: RequestMethod.POST, path: 'connect/openrouter/finish', httpCode: 200 },
    ]);
  });

  it('AICTL-003: every handler works on the caller own id', async () => {
    const { s, controller } = userController();
    await controller.status(user);
    expect(s.connections.status).toHaveBeenCalledWith(7);
    expect(await controller.models(user)).toEqual({ models: [{ id: 'm', label: 'M', supportsTools: true }] });
    expect(await controller.connect(user, { kind: 'anthropic', apiKey: 'sk-ant-key' })).toBe(VIEW);
    expect(s.connections.saveOwnKey).toHaveBeenCalledWith(7, { kind: 'anthropic', apiKey: 'sk-ant-key' });
    await controller.setModel(user, { model: 'm2' });
    expect(s.connections.setOwnModel).toHaveBeenCalledWith(7, 'm2');
    expect(await controller.disconnect(user)).toEqual({ success: true });
    expect(await controller.ackPrivacy(user, { kind: 'anthropic', host: 'api.anthropic.com' })).toEqual({
      success: true,
    });
    expect(s.connections.ackPrivacy).toHaveBeenCalledWith(7, { kind: 'anthropic', host: 'api.anthropic.com' });
  });

  it('AICTL-004: the ChatGPT routes answer the connection as it is afterwards', async () => {
    const { s, controller } = userController();
    await controller.startChatgpt(user);
    expect(s.chatgpt.start).toHaveBeenCalledWith(7);
    const flowId = '7d3c2a64-0f1e-4c4c-9a39-7d2a7a0c5b11';
    const pastedUrl = 'http://127.0.0.1:1455/auth/callback?code=c';
    expect(await controller.finishChatgpt(user, { flowId, pastedUrl })).toBe(VIEW);
    // The service gets the caller with their role, so it can refuse a sign-in for everyone to a non-admin.
    expect(s.chatgpt.finish).toHaveBeenCalledWith(user, flowId, pastedUrl);
    expect(s.connections.ownView).toHaveBeenCalledWith(7);
    // A sign-in an admin started for everyone answers with the instance's connection.
    s.chatgpt.finish.mockResolvedValueOnce('instance');
    expect(await controller.finishChatgpt(user, { flowId, pastedUrl })).toBe(INSTANCE_VIEW);
    expect(await controller.signOutChatgpt(user)).toBe(VIEW);
    expect(s.chatgpt.signOut).toHaveBeenCalledWith(7);
  });

  it('AICTL-005: OpenRouter for the instance is started on the admin route only', async () => {
    const { s, controller } = userController();
    await controller.startOpenrouter(user, { scope: 'user' });
    expect(s.openrouter.start).toHaveBeenCalledWith(7, 'user');
    expect(() => controller.startOpenrouter(user, { scope: 'instance' })).toThrow(DomainError);
    const flowId = '7d3c2a64-0f1e-4c4c-9a39-7d2a7a0c5b11';
    expect(await controller.finishOpenrouter(user, { flowId, code: 'c' })).toBe(VIEW);
    expect(s.openrouter.finish).toHaveBeenCalledWith(user, flowId, 'c');
  });
});

describe('AiAdminController', () => {
  function adminController(s = services()) {
    return {
      s,
      controller: new AiAdminController(
        s.connections as unknown as AiConnectionsService,
        s.openrouter as unknown as OpenrouterAuthService,
        s.chatgpt as unknown as ChatgptAuthService,
      ),
    };
  }

  it('AICTL-010: sits behind the addon, auth and the admin check, withheld on a managed install', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AiAdminController)).toBe('api/admin/ai');
    expect(Reflect.getMetadata(GUARDS_METADATA, AiAdminController)).toEqual([AddonGuard, JwtAuthGuard, AdminGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, AiAdminController)).toMatchObject({
      addonId: ['ai_assistant', 'llm_parsing'],
    });
    expect(Reflect.getMetadata(MANAGED_FORBIDDEN, AiAdminController)?.reason).toBeTruthy();
    expect(
      [
        'settings',
        'saveSettings',
        'connection',
        'saveConnection',
        'removeConnection',
        'models',
        'startOpenrouter',
        'startChatgpt',
        'signOutChatgpt',
      ].map((name) => route(AiAdminController, name)),
    ).toEqual([
      { method: RequestMethod.GET, path: 'settings', httpCode: undefined },
      { method: RequestMethod.PUT, path: 'settings', httpCode: undefined },
      { method: RequestMethod.GET, path: 'connection', httpCode: undefined },
      { method: RequestMethod.PUT, path: 'connection', httpCode: undefined },
      { method: RequestMethod.DELETE, path: 'connection', httpCode: 200 },
      { method: RequestMethod.GET, path: 'models', httpCode: undefined },
      { method: RequestMethod.POST, path: 'connect/openrouter/start', httpCode: 200 },
      { method: RequestMethod.POST, path: 'connect/chatgpt/start', httpCode: 200 },
      { method: RequestMethod.POST, path: 'connect/chatgpt/sign-out', httpCode: 200 },
    ]);
  });

  it('AICTL-011: hands the settings and the connection to the service, with the admin as the actor', async () => {
    const { s, controller } = adminController();
    const admin = { id: 1, role: 'admin' } as User;
    await controller.settings();
    const settings = {
      policy: 'instance' as const,
      dailyTurns: 10,
      retention: { mode: 'forever' as const },
      webSearch: true,
    };
    await controller.saveSettings(admin, settings);
    expect(s.connections.writeSettings).toHaveBeenCalledWith(1, settings);
    await controller.connection();
    await controller.saveConnection(admin, { kind: 'custom', baseUrl: 'http://ollama:11434/v1', model: 'llama' });
    expect(s.connections.saveInstance).toHaveBeenCalledWith(1, {
      kind: 'custom',
      baseUrl: 'http://ollama:11434/v1',
      model: 'llama',
    });
    expect(await controller.removeConnection(admin)).toEqual({ success: true });
    expect(await controller.models(admin)).toEqual({ models: [] });
    await controller.startOpenrouter(admin);
    expect(s.openrouter.start).toHaveBeenCalledWith(1, 'instance');
    // The admin's own ChatGPT plan, shared with everyone: started and signed out for the instance.
    await controller.startChatgpt(admin);
    expect(s.chatgpt.start).toHaveBeenCalledWith(1, 'instance');
    expect(await controller.signOutChatgpt(admin)).toBe(ADMIN_CONNECTION);
    expect(s.chatgpt.signOut).toHaveBeenCalledWith(1, 'instance');
  });
});
