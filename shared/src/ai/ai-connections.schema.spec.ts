import {
  aiAdminSettingsSchema,
  aiApiKeyConnectRequestSchema,
  aiChatgptFinishRequestSchema,
  aiInstanceConnectionRequestSchema,
  aiModelInfoSchema,
  aiOpenrouterStartRequestSchema,
  aiPrivacyAckRequestSchema,
  aiRetentionSchema,
  aiStatusResponseSchema,
} from './ai-connections.schema';

import { describe, expect, it } from 'vitest';

describe('aiRetentionSchema', () => {
  it('keeps chats for a number of days, or forever as its own mode', () => {
    expect(aiRetentionSchema.safeParse({ mode: 'days', days: 90 }).success).toBe(true);
    expect(aiRetentionSchema.safeParse({ mode: 'forever' }).success).toBe(true);
  });

  it('has no sentinel day count', () => {
    expect(aiRetentionSchema.safeParse({ mode: 'days', days: 0 }).success).toBe(false);
    expect(aiRetentionSchema.safeParse({ mode: 'days', days: -1 }).success).toBe(false);
    expect(aiRetentionSchema.safeParse({ mode: 'days', days: 3651 }).success).toBe(false);
  });
});

describe('aiApiKeyConnectRequestSchema', () => {
  it('takes a key for a cloud provider', () => {
    expect(aiApiKeyConnectRequestSchema.safeParse({ kind: 'anthropic', apiKey: 'sk-ant-api03-abcdef' }).success).toBe(
      true,
    );
  });

  it('never lets a user connect ChatGPT by key or a server of their own', () => {
    expect(aiApiKeyConnectRequestSchema.safeParse({ kind: 'chatgpt', apiKey: 'abcdefghij' }).success).toBe(false);
    expect(aiApiKeyConnectRequestSchema.safeParse({ kind: 'custom', apiKey: 'abcdefghij' }).success).toBe(false);
    expect(
      aiApiKeyConnectRequestSchema.safeParse({ kind: 'openai', apiKey: 'sk-abcdefgh', baseUrl: 'http://10.0.0.2' })
        .success,
    ).toBe(false);
  });

  it('refuses a key too short to be one', () => {
    expect(aiApiKeyConnectRequestSchema.safeParse({ kind: 'gemini', apiKey: 'AIza' }).success).toBe(false);
  });
});

describe('aiInstanceConnectionRequestSchema', () => {
  it('takes an own server with a base URL and a model, the key optional', () => {
    expect(
      aiInstanceConnectionRequestSchema.safeParse({
        kind: 'custom',
        baseUrl: 'http://ollama:11434/v1',
        model: 'qwen3:8b',
      }).success,
    ).toBe(true);
    expect(
      aiInstanceConnectionRequestSchema.safeParse({ kind: 'custom', baseUrl: 'http://ollama:11434' }).success,
    ).toBe(false);
  });

  it('refuses a base URL that is not http(s)', () => {
    expect(
      aiInstanceConnectionRequestSchema.safeParse({ kind: 'custom', baseUrl: 'javascript:alert(1)', model: 'm' })
        .success,
    ).toBe(false);
    expect(
      aiInstanceConnectionRequestSchema.safeParse({ kind: 'custom', baseUrl: 'file:///etc/passwd', model: 'm' })
        .success,
    ).toBe(false);
  });

  it('gives a cloud key no base URL to redirect it to', () => {
    expect(aiInstanceConnectionRequestSchema.safeParse({ kind: 'openrouter', apiKey: 'sk-or-v1-abc' }).success).toBe(
      true,
    );
    expect(
      aiInstanceConnectionRequestSchema.safeParse({
        kind: 'anthropic',
        apiKey: 'sk-ant-api03-abcdef',
        baseUrl: 'https://evil.example',
      }).success,
    ).toBe(false);
  });

  it('never shares a ChatGPT plan as the instance connection', () => {
    expect(aiInstanceConnectionRequestSchema.safeParse({ kind: 'chatgpt', apiKey: 'abcdefghij' }).success).toBe(false);
  });
});

describe('aiChatgptFinishRequestSchema', () => {
  it('needs the flow id it was started with', () => {
    const pastedUrl = 'http://127.0.0.1:1455/auth/callback?code=c&state=s';
    expect(
      aiChatgptFinishRequestSchema.safeParse({ flowId: '0d6c1f0e-2c3b-4a5d-8e9f-1a2b3c4d5e6f', pastedUrl }).success,
    ).toBe(true);
    expect(aiChatgptFinishRequestSchema.safeParse({ flowId: 'flow-1', pastedUrl }).success).toBe(false);
  });
});

describe('aiOpenrouterStartRequestSchema', () => {
  it('takes only the scope, never a callback address', () => {
    expect(aiOpenrouterStartRequestSchema.safeParse({ scope: 'user' }).success).toBe(true);
    expect(
      aiOpenrouterStartRequestSchema.safeParse({ scope: 'user', callbackUrl: 'https://evil.example' }).success,
    ).toBe(false);
  });
});

describe('aiAdminSettingsSchema', () => {
  it('takes the policy, the daily limit and the retention', () => {
    expect(
      aiAdminSettingsSchema.safeParse({
        policy: 'instance_or_user',
        dailyTurns: 50,
        retention: { mode: 'days', days: 90 },
      }).success,
    ).toBe(true);
    expect(
      aiAdminSettingsSchema.safeParse({ policy: 'instance', dailyTurns: 0, retention: { mode: 'forever' } }).success,
    ).toBe(false);
  });
});

describe('aiStatusResponseSchema', () => {
  it('describes a user on the instance connection with a quota', () => {
    expect(
      aiStatusResponseSchema.safeParse({
        available: true,
        policy: 'instance_or_user',
        canConnectOwn: true,
        effective: {
          source: 'instance',
          kind: 'anthropic',
          model: 'claude-sonnet-4-5',
          host: 'api.anthropic.com',
          paidBy: 'instance',
        },
        own: null,
        instance: { kind: 'anthropic', model: 'claude-sonnet-4-5', host: 'api.anthropic.com' },
        quota: { used: 3, limit: 50 },
        privacyAcked: false,
        retention: { mode: 'days', days: 90 },
        openrouterOAuth: true,
      }).success,
    ).toBe(true);
  });
});

describe('the Studio page image', () => {
  it('AIVIS-001: a model may say whether it reads images, and a list that cannot say leaves it out', () => {
    expect(aiModelInfoSchema.parse({ id: 'm', label: 'm', supportsTools: true, supportsImages: false })).toEqual({
      id: 'm',
      label: 'm',
      supportsTools: true,
      supportsImages: false,
    });
    expect(aiModelInfoSchema.safeParse({ id: 'm', label: 'm', supportsTools: true }).success).toBe(true);
  });

  it('AIVIS-002: the acknowledgement of page images is its own scope; no other scope exists', () => {
    const ack = { kind: 'anthropic', host: 'api.anthropic.com' };
    expect(aiPrivacyAckRequestSchema.safeParse(ack).success).toBe(true);
    expect(aiPrivacyAckRequestSchema.safeParse({ ...ack, scope: 'studio_images' }).success).toBe(true);
    expect(aiPrivacyAckRequestSchema.safeParse({ ...ack, scope: 'everything' }).success).toBe(false);
  });
});
