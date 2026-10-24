/**
 * FE-AI-CONN-REPO-001 to FE-AI-CONN-REPO-006
 *
 * Connections are online-only and parsed, never cast: a credential lives on
 * the server, and the client only ever handles the view of it.
 */
import type { AiAdminConnectionResponse, AiConnectionView, AiStatusResponse } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { aiConnectionsRepo } from './aiConnectionsRepo';
import { OnlineOnlyError } from './onlineOnly';

const VIEW: AiConnectionView = {
  scope: 'user',
  kind: 'anthropic',
  model: 'claude-sonnet',
  hint: '…a1b2',
  status: 'ok',
  host: 'api.anthropic.com',
};

const STATUS: AiStatusResponse = {
  available: true,
  policy: 'instance_or_user',
  canConnectOwn: true,
  effective: { source: 'user', kind: 'anthropic', model: 'claude-sonnet', host: 'api.anthropic.com', paidBy: 'user' },
  own: VIEW,
  instance: null,
  quota: null,
  privacyAcked: true,
  retention: { mode: 'days', days: 90 },
  openrouterOAuth: true,
};

const START = {
  flowId: '7d9f2c1e-3b4a-4c5d-8e6f-0a1b2c3d4e5f',
  authorizeUrl: 'https://openrouter.ai/auth?x=1',
  expiresAt: '2026-10-21T08:10:00.000Z',
};

beforeEach(() => _resetNetworkMode());
afterEach(() => _resetNetworkMode());

describe('aiConnectionsRepo', () => {
  it('FE-AI-CONN-REPO-001: reads the status', async () => {
    server.use(http.get('/api/ai/status', () => HttpResponse.json(STATUS)));
    await expect(aiConnectionsRepo.status()).resolves.toEqual(STATUS);
  });

  it('FE-AI-CONN-REPO-002: connects a key and answers with the view, never the key', async () => {
    let sent: unknown = null;
    server.use(
      http.put('/api/ai/connection', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(VIEW);
      })
    );
    await expect(aiConnectionsRepo.connectKey({ kind: 'anthropic', apiKey: 'sk-ant-12345678' })).resolves.toEqual(VIEW);
    expect(sent).toEqual({ kind: 'anthropic', apiKey: 'sk-ant-12345678' });
  });

  it('FE-AI-CONN-REPO-003: OpenRouter starts on the user route or, for the instance, the admin route', async () => {
    const seen: string[] = [];
    server.use(
      http.post('/api/ai/connect/openrouter/start', () => {
        seen.push('user');
        return HttpResponse.json(START);
      }),
      http.post('/api/admin/ai/connect/openrouter/start', () => {
        seen.push('instance');
        return HttpResponse.json(START);
      })
    );
    await expect(aiConnectionsRepo.openrouterStart('user')).resolves.toEqual(START);
    await expect(aiConnectionsRepo.openrouterStart('instance')).resolves.toEqual(START);
    expect(seen).toEqual(['user', 'instance']);
  });

  it('FE-AI-CONN-REPO-004: reads and writes the admin settings and the instance connection', async () => {
    const settings = {
      policy: 'user' as const,
      dailyTurns: 50,
      webSearch: true,
      retention: { mode: 'forever' as const },
    };
    const connection: AiAdminConnectionResponse = {
      connection: {
        ...VIEW,
        scope: 'instance',
        kind: 'custom',
        host: 'ollama.lan',
        baseUrl: 'http://ollama.lan:11434/v1',
      },
      prefill: null,
    };
    server.use(
      http.get('/api/admin/ai/settings', () => HttpResponse.json(settings)),
      http.put('/api/admin/ai/settings', async ({ request }) => HttpResponse.json(await request.json())),
      http.get('/api/admin/ai/connection', () => HttpResponse.json(connection)),
      http.get('/api/admin/ai/models', () =>
        HttpResponse.json({ models: [{ id: 'qwen3', label: 'Qwen 3', supportsTools: true }] })
      )
    );
    await expect(aiConnectionsRepo.adminSettings()).resolves.toEqual(settings);
    await expect(aiConnectionsRepo.saveAdminSettings({ ...settings, dailyTurns: 20 })).resolves.toEqual({
      ...settings,
      dailyTurns: 20,
      webSearch: true,
    });
    await expect(aiConnectionsRepo.adminConnection()).resolves.toEqual(connection);
    await expect(aiConnectionsRepo.adminModels()).resolves.toEqual([
      { id: 'qwen3', label: 'Qwen 3', supportsTools: true },
    ]);
  });

  it('FE-AI-CONN-REPO-005: an answer outside the contract fails here', async () => {
    server.use(http.get('/api/ai/status', () => HttpResponse.json({ available: 'yes' })));
    await expect(aiConnectionsRepo.status()).rejects.toThrow();
  });

  it('FE-AI-CONN-REPO-006: while offline every call refuses before a request', async () => {
    setForcedOffline(true);
    await expect(aiConnectionsRepo.status()).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(aiConnectionsRepo.disconnect()).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(aiConnectionsRepo.chatgptStart()).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(aiConnectionsRepo.adminSettings()).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(aiConnectionsRepo.claudeConnector()).rejects.toBeInstanceOf(OnlineOnlyError);
  });
});
