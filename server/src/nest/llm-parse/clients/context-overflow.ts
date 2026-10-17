/**
 * Raised when a server refuses a request because the prompt does not fit its
 * context. Only a shorter text can help, so the request is not retried in
 * another shape: the caller cuts the document down and asks once more (#2652).
 */
export class LlmContextOverflowError extends Error {}

/**
 * The wordings OpenAI, vLLM, llama.cpp, LiteLLM and Anthropic use for a prompt
 * that is too long for the model's context.
 */
const CONTEXT_OVERFLOW =
  /maximum context length|context[_ ]length[_ ]exceeded|context window|prompt is too long|too many tokens|exceeds the context/i;

export function isContextOverflow(detail: string): boolean {
  return CONTEXT_OVERFLOW.test(detail);
}
