import { safeFetch, safeFetchLlm } from '../../utils/ssrfGuard';
import type { AiChatClient } from './ai-chat-client.interface';
import { AI_BASE_URLS } from './ai-connections.constants';
import type { ResolvedAiConnection } from './ai-connections.types';
import { ChatgptAuthService } from './chatgpt-auth.service';
import { AnthropicMessagesClient } from './providers/anthropic-messages.client';
import { OpenAiChatClient } from './providers/openai-chat.client';
import { OpenAiResponsesClient } from './providers/openai-responses.client';
import type { AiFetch } from './providers/provider-http';
import { Injectable } from '@nestjs/common';

/**
 * A cloud provider at its fixed address, through the SSRF guard. The body is
 * not capped here: the stream is read line by line under its own byte, line
 * and idle limits (providers/sse-lines.ts), and the deadline for the headers
 * is the adapter's.
 */
const cloudFetch: AiFetch = (url, init) => safeFetch(url, { ...init, signal: init.signal }, { maxBytes: null });

/**
 * An admin's own server, which may sit on loopback or in the LAN: the guard
 * that allows those and still refuses link-local and cloud metadata.
 */
const adminServerFetch: AiFetch = (url, init) => safeFetchLlm(url, { ...init, signal: init.signal }, 5, null);

/**
 * The chat client for a resolved connection: Anthropic's Messages API, the
 * Responses API for a ChatGPT plan, and Chat Completions for everything
 * OpenAI-compatible (OpenAI, Gemini, OpenRouter, an admin's own server).
 */
@Injectable()
export class AiChatClientService {
  constructor(private readonly chatgpt: ChatgptAuthService) {}

  create(connection: ResolvedAiConnection): AiChatClient {
    const { credential, kind, model } = connection;
    if (credential.type === 'chatgpt') {
      let current = credential.accessToken;
      return new OpenAiResponsesClient(
        model,
        async (rejected) => {
          if (rejected) current = await this.chatgpt.refresh(connection.id, rejected);
          return current;
        },
        cloudFetch,
      );
    }
    switch (kind) {
      case 'anthropic':
        return new AnthropicMessagesClient(model, credential.apiKey ?? '', cloudFetch);
      case 'custom':
        return new OpenAiChatClient(
          kind,
          model,
          (connection.baseUrl ?? '').replace(/(?<!\/)\/+$/, ''),
          credential.apiKey,
          adminServerFetch,
        );
      default:
        return new OpenAiChatClient(kind, model, AI_BASE_URLS[kind], credential.apiKey, cloudFetch);
    }
  }
}
