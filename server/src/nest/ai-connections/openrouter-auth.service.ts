import { getAppUrl } from '../../app-config';
import { readCappedJson } from '../../utils/cappedFetch';
import { safeFetch } from '../../utils/ssrfGuard';
import { AI_AUTH_FLOW_TTL_MS, AiAuthFlowStore } from './ai-auth-flow.store';
import { aiRefusal, openrouterOAuthAvailable } from './ai-connections.constants';
import { AiConnectionsService } from './ai-connections.service';
import { AiSettingsService } from './ai-settings.service';
import { Injectable } from '@nestjs/common';
import type { AiAuthStartResponse, AiConnectionScope, AiConnectionView } from '@trek/shared';

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';

const AUTHORIZE_URL = 'https://openrouter.ai/auth';
const KEY_EXCHANGE_URL = 'https://openrouter.ai/api/v1/auth/keys';
const EXCHANGE_TIMEOUT_MS = 15_000;
const MAX_EXCHANGE_BYTES = 64 * 1024;

const keyAnswerSchema = z.object({ key: z.string().min(8).max(400) });

/**
 * Connecting OpenRouter without copying a key: OpenRouter's OAuth with PKCE
 * sends the browser back with a code, which is exchanged for a key that is
 * then saved like a pasted one. The address it returns to is built from the
 * configured app URL only, never from the request's Origin or Host, so a
 * forged header cannot send the code elsewhere.
 */
@Injectable()
export class OpenrouterAuthService {
  constructor(
    private readonly connections: AiConnectionsService,
    private readonly settings: AiSettingsService,
    private readonly flows: AiAuthFlowStore,
  ) {}

  async start(userId: number, scope: AiConnectionScope): Promise<AiAuthStartResponse> {
    if (scope === 'user') await this.settings.assertCanConnectOwn(userId);
    if (!openrouterOAuthAvailable()) {
      throw aiRefusal('forbidden', 'Connecting OpenRouter this way needs this server on an https address');
    }
    const verifier = randomBytes(32).toString('base64url');
    const flowId = randomUUID();
    const expiresAt = Date.now() + AI_AUTH_FLOW_TTL_MS;
    await this.flows.put(flowId, { provider: 'openrouter', userId, scope, verifier, expiresAt });
    const back = scope === 'user' ? '/settings?tab=integrations&ai=openrouter' : '/admin?tab=addons&ai=openrouter';
    const params = new URLSearchParams({
      callback_url: `${getAppUrl()}${back}`,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
    });
    return {
      flowId,
      authorizeUrl: `${AUTHORIZE_URL}?${params.toString()}`,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Exchanges the code for a key and saves it. An exchange started for the
   * instance is only finished by an admin; the flow already belongs to the
   * user who started it.
   */
  async finish(user: { id: number; role: string }, flowId: string, code: string): Promise<AiConnectionView> {
    const flow = await this.flows.take(flowId, user.id, Date.now());
    if (flow?.provider !== 'openrouter') throw aiRefusal('expired', 'The sign-in took too long; start it again');
    if (flow.scope === 'instance' && user.role !== 'admin') throw aiRefusal('forbidden', 'Admin access required');

    let res: Response;
    try {
      res = await safeFetch(
        KEY_EXCHANGE_URL,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ code, code_verifier: flow.verifier, code_challenge_method: 'S256' }),
          signal: AbortSignal.timeout(EXCHANGE_TIMEOUT_MS),
        },
        { maxBytes: MAX_EXCHANGE_BYTES },
      );
    } catch {
      throw aiRefusal('provider_unavailable', 'OpenRouter is not responding');
    }
    const answer = keyAnswerSchema.safeParse(await readCappedJson<unknown>(res, MAX_EXCHANGE_BYTES));
    if (!res.ok || !answer.success) {
      throw res.status >= 500
        ? aiRefusal('provider_unavailable', 'OpenRouter is not responding')
        : aiRefusal('expired', 'OpenRouter did not accept the sign-in; start it again');
    }
    return this.connections.saveOpenrouterKey(user.id, flow.scope, answer.data.key);
  }
}
