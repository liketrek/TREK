import { HttpException } from '@nestjs/common';
import { errorResult, type McpTextResult } from '../../nest-mcp';

/**
 * Run a tool body and answer a refusal from the service with its reason.
 *
 * The roadtrip services refuse with an HttpException whose body is `{ error }`,
 * and the REST filter sends that body verbatim. A tool that lets the exception
 * escape gets the SDK's treatment instead: an error result made of
 * `error.message`, which Nest fills with the class name when the body carries no
 * `message` of its own. The assistant then reads "Http Exception" where the route
 * reads "Day end must be later than day start."
 *
 * Only a refusal is answered. A 5xx is a failure, not a refusal, and it keeps
 * propagating so it is logged and reported the way any other failure is.
 */
export function answeringRefusals<T extends McpTextResult>(work: () => Promise<T>): Promise<T | McpTextResult>;
export function answeringRefusals<T extends McpTextResult>(work: () => T): T | McpTextResult;
export function answeringRefusals<T extends McpTextResult>(work: () => T | Promise<T>): T | McpTextResult | Promise<T | McpTextResult> {
  try {
    const result = work();
    return isPending(result) ? result.catch(refusal) : result;
  } catch (error) {
    return refusal(error);
  }
}

function isPending<T>(value: T | Promise<T>): value is Promise<T> {
  return value instanceof Promise;
}

function refusal(error: unknown): McpTextResult {
  if (!(error instanceof HttpException) || error.getStatus() >= 500) throw error;
  const body = error.getResponse();
  const reason = typeof body === 'string' ? body : (body as { error?: unknown }).error;
  return errorResult(typeof reason === 'string' ? reason : error.message);
}
