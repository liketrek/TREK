import type { AiConnectionScope } from '@trek/shared';

/** How long a started sign-in may take before it has to be started again. */
export const AI_AUTH_FLOW_TTL_MS = 10 * 60_000;

/** A Sign in with ChatGPT attempt between the authorize URL and the pasted callback. */
export interface ChatgptAuthFlow {
  provider: 'chatgpt';
  userId: number;
  /** A user's own plan, or the plan an admin shares with everyone on the instance. */
  scope: AiConnectionScope;
  verifier: string;
  state: string;
  nonce: string;
  /** The client id this user's registration was issued, sent instead of registering again. */
  savedClientId: string | null;
  expiresAt: number;
}

/** An OpenRouter key exchange between the authorize URL and the callback's code. */
interface OpenrouterAuthFlow {
  provider: 'openrouter';
  userId: number;
  scope: AiConnectionScope;
  verifier: string;
  expiresAt: number;
}

type AiAuthFlow = ChatgptAuthFlow | OpenrouterAuthFlow;

/**
 * The sign-ins in progress, as an injectable port. A flow belongs to the user
 * who started it and is taken once: `take` hands it out and forgets it in the
 * same step, and answers null for an unknown, expired or foreign flow (a
 * foreign one stays where it is). In memory today; a store shared between
 * processes replaces InMemoryAiAuthFlowStore in AiConnectionsModule.
 */
export abstract class AiAuthFlowStore {
  abstract put(flowId: string, flow: AiAuthFlow): Promise<void>;
  abstract take(flowId: string, userId: number, now: number): Promise<AiAuthFlow | null>;
}

export class InMemoryAiAuthFlowStore extends AiAuthFlowStore {
  private readonly flows = new Map<string, AiAuthFlow>();

  put(flowId: string, flow: AiAuthFlow): Promise<void> {
    const now = Date.now();
    for (const [id, entry] of this.flows) if (entry.expiresAt <= now) this.flows.delete(id);
    this.flows.set(flowId, flow);
    return Promise.resolve();
  }

  take(flowId: string, userId: number, now: number): Promise<AiAuthFlow | null> {
    const flow = this.flows.get(flowId);
    if (!flow || flow.userId !== userId) return Promise.resolve(null);
    this.flows.delete(flowId);
    return Promise.resolve(flow.expiresAt > now ? flow : null);
  }
}
