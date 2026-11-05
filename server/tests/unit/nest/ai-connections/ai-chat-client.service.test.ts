/**
 * AICL-001 to AICL-002: which chat client a resolved connection gets. An
 * OpenAI reasoning model behind an API key takes its function tools only on the
 * Responses API, so it goes there like a ChatGPT plan does (#2792).
 */
import { AiChatClientService, openAiWantsResponses } from '../../../../src/nest/ai-connections/ai-chat-client.service';
import { AiConnectionsModule } from '../../../../src/nest/ai-connections/ai-connections.module';
import type { ResolvedAiConnection } from '../../../../src/nest/ai-connections/ai-connections.types';
import { AnthropicMessagesClient } from '../../../../src/nest/ai-connections/providers/anthropic-messages.client';
import { OpenAiChatClient } from '../../../../src/nest/ai-connections/providers/openai-chat.client';
import { OpenAiResponsesClient } from '../../../../src/nest/ai-connections/providers/openai-responses.client';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { DemoModule } from '../../../../src/nest/common/demo.module';
import { LlmLocalService } from '../../../../src/nest/llm-parse/llm-local.service';
import { OidcService } from '../../../../src/nest/oidc/oidc.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [AppConfigModule, DemoModule, AiConnectionsModule],
    overrides: [
      { provide: LlmLocalService, useValue: {} },
      { provide: OidcService, useValue: {} },
    ],
  });
});

afterAll(async () => {
  await t.close();
  db.close();
});

function connection(kind: ResolvedAiConnection['kind'], model: string): ResolvedAiConnection {
  return {
    id: 1,
    scope: 'instance',
    kind,
    model,
    baseUrl: kind === 'custom' ? 'http://ollama:11434/v1' : null,
    host: 'host',
    paidBy: 'instance',
    status: 'ok',
    credential: { type: 'api_key', apiKey: 'sk-test' },
  };
}

describe('AiChatClientService', () => {
  it('AICL-001: an OpenAI reasoning model on a key goes to the Responses API, an older one stays on Chat Completions', () => {
    const clients = t.get(AiChatClientService);
    const sol = clients.create(connection('openai', 'gpt-6.1-sol'));
    expect(sol).toBeInstanceOf(OpenAiResponsesClient);
    expect(sol.kind).toBe('openai');
    expect(clients.create(connection('openai', 'gpt-4.1'))).toBeInstanceOf(OpenAiChatClient);
    expect(clients.create(connection('anthropic', 'claude-sonnet-5-5'))).toBeInstanceOf(AnthropicMessagesClient);
    expect(clients.create(connection('custom', 'gpt-6.1-sol'))).toBeInstanceOf(OpenAiChatClient);
    const plan = clients.create({
      ...connection('chatgpt', 'gpt-6.1-sol'),
      credential: { type: 'chatgpt', accessToken: 'at' },
    });
    expect(plan).toBeInstanceOf(OpenAiResponsesClient);
    expect(plan.kind).toBe('chatgpt');
  });

  it('AICL-002: the reasoning lines are o-series, GPT-5 and later; their -chat variants and GPT-4 are not', () => {
    for (const model of ['o3', 'o4-mini', 'gpt-5', 'gpt-5.6-sol', 'gpt-6.1-sol', 'gpt-6-sol']) {
      expect(openAiWantsResponses(model), model).toBe(true);
    }
    for (const model of ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'gpt-5-chat-latest', 'omni-moderation-latest']) {
      expect(openAiWantsResponses(model), model).toBe(false);
    }
  });
});
