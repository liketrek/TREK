/**
 * The small pieces behind the AI connections: the sealed secrets blob, the
 * sign-in flows taken once, the per-key refresh lock and the refusal helpers.
 */
import { InMemoryAiAuthFlowStore, type ChatgptAuthFlow } from '../../../../src/nest/ai-connections/ai-auth-flow.store';
import {
  aiHostOf,
  aiRefusal,
  openrouterOAuthAvailable,
  providerRefusal,
} from '../../../../src/nest/ai-connections/ai-connections.constants';
import { InMemoryAiRefreshLock } from '../../../../src/nest/ai-connections/ai-refresh-lock';
import { maskHint, openSecrets, sealSecrets } from '../../../../src/nest/ai-connections/ai-secrets';
import { AiProviderError } from '../../../../src/nest/ai-connections/providers/provider-errors';
import { maybe_encrypt_api_key } from '../../../../src/nest/common/crypto/apiKeyCrypto';
import { DomainError } from '../../../../src/nest/common/domain-error';

import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('ai-secrets', () => {
  it('AIHLP-001: a sealed key is encrypted at rest and opens to what went in', () => {
    const sealed = sealSecrets({ apiKey: 'sk-ant-secret-1234' });
    expect(sealed).not.toContain('sk-ant-secret');
    expect(openSecrets(sealed)).toEqual({ apiKey: 'sk-ant-secret-1234' });
  });

  it('AIHLP-002: ChatGPT tokens round-trip with their expiry', () => {
    const tokens = { accessToken: 'at', refreshToken: 'rt', expiresAt: 1_700_000_000_000 };
    expect(openSecrets(sealSecrets(tokens))).toEqual(tokens);
  });

  it('AIHLP-003: nothing stored, a blob that does not decrypt and a blob of the wrong shape all open to null', () => {
    expect(openSecrets(null)).toBeNull();
    expect(openSecrets('enc:v1:not-a-real-ciphertext')).toBeNull();
    expect(openSecrets(String(maybe_encrypt_api_key(JSON.stringify({ apiKey: '' }))))).toBeNull();
    expect(openSecrets(String(maybe_encrypt_api_key('not json')))).toBeNull();
  });

  it('AIHLP-004: the hint shows the last four characters only', () => {
    expect(maskHint('sk-or-v1-abcdef9876')).toBe('…9876');
  });
});

describe('InMemoryAiAuthFlowStore', () => {
  const flow = (userId: number, expiresAt: number): ChatgptAuthFlow => ({
    provider: 'chatgpt',
    userId,
    scope: 'user',
    verifier: 'v',
    state: 's',
    nonce: 'n',
    savedClientId: null,
    expiresAt,
  });

  it('AIHLP-010: a flow is taken once, by the user who started it', async () => {
    const store = new InMemoryAiAuthFlowStore();
    const now = Date.now();
    await store.put('f1', flow(1, now + 60_000));
    expect(await store.take('f1', 2, now)).toBeNull();
    expect(await store.take('f1', 1, now)).toMatchObject({ userId: 1 });
    expect(await store.take('f1', 1, now)).toBeNull();
  });

  it('AIHLP-011: an expired flow is gone, and stale ones are swept on the next start', async () => {
    const store = new InMemoryAiAuthFlowStore();
    const now = Date.now();
    await store.put('old', flow(1, now + 1_000));
    expect(await store.take('old', 1, now + 2_000)).toBeNull();

    await store.put('stale', flow(1, now - 1));
    await store.put('fresh', flow(1, now + 60_000));
    expect(await store.take('stale', 1, now - 10)).toBeNull();
    expect(await store.take('fresh', 1, now)).not.toBeNull();
  });
});

describe('InMemoryAiRefreshLock', () => {
  it('AIHLP-020: runs one job per key at a time, in order, and keeps going after a failure', async () => {
    const lock = new InMemoryAiRefreshLock();
    const order: string[] = [];
    let release: () => void = () => {};
    const first = lock.run('k', async () => {
      order.push('first:start');
      await new Promise<void>((resolve) => (release = resolve));
      order.push('first:end');
      throw new Error('boom');
    });
    const second = lock.run('k', async () => {
      order.push('second');
      return 2;
    });
    const other = lock.run('other', async () => {
      order.push('other');
      return 3;
    });
    expect(await other).toBe(3);
    release();
    await expect(first).rejects.toThrow('boom');
    expect(await second).toBe(2);
    expect(order).toEqual(['first:start', 'other', 'first:end', 'second']);
  });
});

describe('constants', () => {
  it('AIHLP-030: a refusal carries its code in the body, at the status that belongs to it', () => {
    const err = aiRefusal('invalid_key', 'The provider refused this key');
    expect(err).toBeInstanceOf(DomainError);
    expect(err.getStatus()).toBe(422);
    expect(err.toBody()).toEqual({ error: 'The provider refused this key', code: 'invalid_key' });
    expect(aiRefusal('expired', 'x').getStatus()).toBe(410);
    expect(aiRefusal('not_connected', 'x').getStatus()).toBe(409);
  });

  it('AIHLP-031: a provider failure becomes the refusal of its code', () => {
    const err = providerRefusal(new AiProviderError('usage_limit', 429, false));
    expect(err.getStatus()).toBe(429);
    expect(err.toBody()).toMatchObject({ code: 'usage_limit' });
    expect(providerRefusal(new AiProviderError('generic', 400, false)).toBody()).toEqual({
      error: 'The provider refused the request',
      code: 'generic',
    });
  });

  it('AIHLP-032: the host a conversation goes to', () => {
    expect(aiHostOf('anthropic', null)).toBe('api.anthropic.com');
    expect(aiHostOf('chatgpt', null)).toBe('api.openai.com');
    expect(aiHostOf('custom', 'http://ollama.lan:11434/v1')).toBe('ollama.lan:11434');
    expect(aiHostOf('custom', 'not a url')).toBe('');
    expect(aiHostOf('custom', null)).toBe('');
  });

  it('AIHLP-033: OpenRouter sign-in is offered only on an https app URL', () => {
    vi.stubEnv('APP_URL', 'https://trip.example.org');
    expect(openrouterOAuthAvailable()).toBe(true);
    vi.stubEnv('APP_URL', 'http://192.168.1.10:3000');
    expect(openrouterOAuthAvailable()).toBe(false);
  });
});
