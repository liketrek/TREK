import type { AiConnectionKind, AiConnectionScope, AiConnectionStatus } from '@trek/shared';

/** The secret a connection calls its provider with. Only the server ever holds it. */
export type AiCredential = { type: 'api_key'; apiKey: string | null } | { type: 'chatgpt'; accessToken: string };

/**
 * A connection ready to be called: whose it is, what it reaches and with which
 * secret. `paidBy` says whose account the conversation is billed to, which is
 * what the daily limit applies to.
 */
export interface ResolvedAiConnection {
  id: number;
  scope: AiConnectionScope;
  kind: AiConnectionKind;
  model: string;
  /** Only for `custom`: the admin's OpenAI-compatible server. */
  baseUrl: string | null;
  host: string;
  paidBy: AiConnectionScope;
  status: AiConnectionStatus;
  credential: AiCredential;
}
