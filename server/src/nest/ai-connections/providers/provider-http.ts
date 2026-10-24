import { readCappedJson } from '../../../utils/cappedFetch';
import { logWarn } from '../../audit/audit-log.logger';
import { AiProviderError, errorCodeOf, IMAGE_INPUT_REFUSED, namesImageInput, providerFailure } from './provider-errors';
import type { AiConnectionKind } from '@trek/shared';

/**
 * How an adapter reaches its provider: the guarded fetch the connection allows
 * (the cloud hosts through `safeFetch`, an admin's own server through
 * `safeFetchLlm`), handed in so a test can answer instead.
 */
export type AiFetch = (url: string, init: RequestInit & { signal: AbortSignal }) => Promise<Response>;

/** How long a provider may take to start answering. The stream itself then runs under the idle limit. */
const HEADER_TIMEOUT_MS = 60_000;

/** An error body is a few hundred bytes; anything past this is not one. */
const MAX_ERROR_BYTES = 64 * 1024;

/**
 * Sends a streaming request and answers the body once the headers are there
 * and the response is a success. A provider that does not answer within
 * HEADER_TIMEOUT_MS, a network failure and a refusal all come back as an
 * AiProviderError; an abort of `signal` stays the abort it is.
 */
export async function openProviderStream(
  fetcher: AiFetch,
  kind: AiConnectionKind,
  url: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const headers = new AbortController();
  const timer = setTimeout(() => headers.abort(), HEADER_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetcher(url, { ...init, signal: AbortSignal.any([signal, headers.signal]) });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new AiProviderError(
      'provider_unavailable',
      0,
      true,
      undefined,
      headers.signal.aborted ? 'timeout' : undefined,
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw await refusalOf(kind, res);
  if (!res.body) throw new AiProviderError('provider_unavailable', res.status, true, undefined, 'empty_body');
  return res.body;
}

/** The AiProviderError a non-success response stands for, read from its status and its error body. */
export async function refusalOf(kind: AiConnectionKind, res: Response): Promise<AiProviderError> {
  const body = await readCappedJson<unknown>(res, MAX_ERROR_BYTES).catch(() => undefined);
  const named = errorCodeOf(body);
  // A refused image is named by its own code, so the turn can send the step again without it; a
  // refusal the provider's own code already explains (a plan that does not cover it) keeps that code.
  const image = namesImageInput(res.status, body) && providerFailure(kind, res.status, named).code === 'generic';
  const code = image ? IMAGE_INPUT_REFUSED : named;
  // Status and code only: an error body can quote the request, and the request holds the trip.
  logWarn(`[ai] ${kind} refused the request: HTTP ${res.status}${code ? ` (${code})` : ''}`);
  return providerFailure(kind, res.status, code);
}

/** One SSE data payload as a JSON object; null for anything else (a `[DONE]`, a keepalive). */
export function parseEventData(data: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(data);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** A field of a provider's JSON that should be an object, or an empty one. */
export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** A field that should be text, or ''. */
export function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** A field that should be a count, or 0. */
export function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Parses a tool call's arguments; anything but a JSON object is an empty argument list. */
export function parseToolArgs(raw: string | undefined): Record<string, unknown> {
  return (raw && parseEventData(raw)) || {};
}

/** Keywords Gemini's OpenAI-compatible endpoint refuses in a function's parameters. */
const GEMINI_DROPPED_KEYWORDS = new Set([
  '$schema',
  'additionalProperties',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'propertyNames',
]);

/**
 * A tool's JSON Schema as the provider takes it. Every provider is spared the
 * `$schema` marker; Gemini also loses the keywords it refuses, and `const`
 * becomes the one-value `enum` it does read.
 */
export function toProviderSchema(schema: Record<string, unknown>, kind: AiConnectionKind): Record<string, unknown> {
  return clean(schema, kind === 'gemini') as Record<string, unknown>;
}

function clean(node: unknown, gemini: boolean): unknown {
  if (Array.isArray(node)) return node.map((item) => clean(item, gemini));
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === '$schema' || (gemini && GEMINI_DROPPED_KEYWORDS.has(key))) continue;
    if (gemini && key === 'const') {
      out.enum = [value];
      continue;
    }
    out[key] = clean(value, gemini);
  }
  return out;
}
