import { readEnv } from '../../../app-config';
import { isTransientLlmFailure } from '../llm-outcome';
import { errorBodyCode, LlmRequestError } from './llm-request-error';

/** Tries after the first one, for a failure that passes. */
const MAX_RETRIES = 2;
/** The wait before the first retry, doubled for each one after it. */
const BACKOFF_MS = 1000;
/** The longest a Retry-After is waited for, so one busy provider cannot hold a reading for minutes. */
const MAX_WAIT_MS = 5000;

/** A provider's answer, with the body of a refusal already read. */
interface SentRequest {
  res: Response;
  /** The body of an answer that is not ok, empty for one that is. */
  detail: string;
}

/**
 * Sends one request, and sends it again up to twice when it failed in passing
 * (see isTransientLlmFailure). The tries share one LLM_TIMEOUT_MS: each gets
 * what is left of it, and a retry whose wait would not fit is not made.
 */
export async function sendWithRetry(send: (signal: AbortSignal) => Promise<Response>): Promise<SentRequest> {
  const budget = readEnv().integrations.llmTimeoutMs;
  return attempt(send, 0, budget, Date.now() + budget);
}

async function attempt(
  send: (signal: AbortSignal) => Promise<Response>,
  retry: number,
  budget: number,
  deadline: number,
): Promise<SentRequest> {
  let sent: SentRequest;
  try {
    sent = await sendOnce(send, retry === 0 ? budget : deadline - Date.now());
  } catch (err) {
    const wait = backoff(retry);
    if (!isTransientLlmFailure(err) || !fits(retry, wait, deadline)) throw err;
    await sleep(wait);
    return attempt(send, retry + 1, budget, deadline);
  }
  const { res, detail } = sent;
  if (res.ok || !isTransientLlmFailure(new LlmRequestError('', res.status, errorBodyCode(detail)))) return sent;
  const wait = retryAfter(res) ?? backoff(retry);
  if (!fits(retry, wait, deadline)) return sent;
  await sleep(wait);
  return attempt(send, retry + 1, budget, deadline);
}

/** Whether one more try is allowed, and its wait still leaves time before the deadline. */
function fits(retry: number, wait: number, deadline: number): boolean {
  return retry < MAX_RETRIES && Date.now() + wait < deadline;
}

async function sendOnce(send: (signal: AbortSignal) => Promise<Response>, timeoutMs: number): Promise<SentRequest> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await send(controller.signal);
    return { res, detail: res.ok ? '' : await res.text().catch(() => '') };
  } finally {
    clearTimeout(timer);
  }
}

function backoff(retry: number): number {
  return BACKOFF_MS * 2 ** retry;
}

/** The wait a Retry-After header asks for, in seconds or as an HTTP date, capped at MAX_WAIT_MS. */
function retryAfter(res: Response): number | null {
  const value = res.headers.get('retry-after')?.trim();
  if (!value) return null;
  const ms = /^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.min(Math.max(ms, 0), MAX_WAIT_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
