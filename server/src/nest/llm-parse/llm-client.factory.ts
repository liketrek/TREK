import type { LlmExtractionClient } from './llm-provider.interface';
import type { ResolvedLlmConfig } from '../../services/llmConfig';
import { OpenAiCompatibleClient } from './clients/openai-compatible.client';
import { AnthropicClient } from './clients/anthropic.client';

/**
 * Pick the provider client for a resolved config.
 *  - 'anthropic'        → Anthropic Messages API client
 *  - 'openai' | 'local' → OpenAI-compatible client (cloud or local base URL)
 */
export function createLlmClient(config: ResolvedLlmConfig): LlmExtractionClient {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicClient();
    case 'openai':
    case 'local':
      return new OpenAiCompatibleClient();
    // TODO(nuextract): add a NuExtract template adapter here (local vision model
    // with its own template-fill API) once the OpenAI-compatible path proves
    // insufficient for small local models — see the design seam in the plan.
    default:
      return new OpenAiCompatibleClient();
  }
}
