import { describe, it, expect } from 'vitest';
import { createLlmClient } from '../../../../src/nest/llm-parse/llm-client.factory';
import { OpenAiCompatibleClient } from '../../../../src/nest/llm-parse/clients/openai-compatible.client';
import { AnthropicClient } from '../../../../src/nest/llm-parse/clients/anthropic.client';
import type { ResolvedLlmConfig } from '../../../../src/services/llmConfig';

const cfg = (provider: string): ResolvedLlmConfig =>
  ({ provider, model: 'm', baseUrl: 'http://x', multimodal: false } as unknown as ResolvedLlmConfig);

describe('createLlmClient', () => {
  it('returns the Anthropic client for the anthropic provider', () => {
    expect(createLlmClient(cfg('anthropic'))).toBeInstanceOf(AnthropicClient);
  });

  it('returns the OpenAI-compatible client for openai and local', () => {
    expect(createLlmClient(cfg('openai'))).toBeInstanceOf(OpenAiCompatibleClient);
    expect(createLlmClient(cfg('local'))).toBeInstanceOf(OpenAiCompatibleClient);
  });

  it('falls back to the OpenAI-compatible client for an unknown provider', () => {
    expect(createLlmClient(cfg('something-else'))).toBeInstanceOf(OpenAiCompatibleClient);
  });
});
