import { getAppUrl } from '../../app-config';
import { DomainError } from '../common/domain-error';
import type { AiProviderError } from './providers/provider-errors';
import type { AiConnectionKind, AiPolicy, AiRetention, AssistantErrorCode } from '@trek/shared';

/** Where each cloud kind is reached. A `custom` connection carries its own base URL. */
export const AI_BASE_URLS = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openrouter: 'https://openrouter.ai/api/v1',
  chatgpt: 'https://api.openai.com/v1',
} as const satisfies Record<Exclude<AiConnectionKind, 'custom'>, string>;

/** The host a connection sends the conversation to, as the privacy notice names it. */
export function aiHostOf(kind: AiConnectionKind, baseUrl: string | null): string {
  if (kind !== 'custom') return new URL(AI_BASE_URLS[kind]).host;
  try {
    return baseUrl ? new URL(baseUrl).host : '';
  } catch {
    return '';
  }
}

/** Whether OpenRouter's OAuth can send the browser back here: it only returns to an https address. */
export function openrouterOAuthAvailable(): boolean {
  return getAppUrl().startsWith('https://');
}

export const AI_DEFAULT_POLICY: AiPolicy = 'instance_or_user';
export const AI_DEFAULT_DAILY_TURNS = 50;
export const AI_DEFAULT_RETENTION: AiRetention = { mode: 'days', days: 90 };

/** The user setting that records which `kind@host` a user was told receives their messages. */
export const AI_PRIVACY_ACK_SETTING = 'assistant_privacy_ack';

/**
 * The user setting that records which `kind@host` a user let receive images of
 * their Studio pages (journey-studio.md 3.4), asked for on its own: the
 * planner's notice says no files leave, which a page image would contradict.
 */
export const AI_STUDIO_IMAGES_ACK_SETTING = 'assistant_privacy_ack_studio_images';

/**
 * Why a connection request was refused, as the client reads it from the body's
 * `code`: the assistant's error codes, plus the ones only setting up a
 * connection meets (a sign-in that took too long, a pasted address that is not
 * the callback, another account than the one connected).
 */
type AiRefusalCode =
  AssistantErrorCode | 'forbidden' | 'not_found' | 'expired' | 'wrong_url' | 'account_mismatch' | 'unknown_model';

const REFUSAL_STATUS: Record<AiRefusalCode, number> = {
  not_connected: 409,
  busy: 409,
  daily_limit: 429,
  rate_limited: 429,
  needs_reauth: 409,
  usage_limit: 429,
  not_eligible: 403,
  invalid_key: 422,
  provider_unavailable: 502,
  max_steps: 409,
  empty_answer: 502,
  offline: 503,
  no_bookings_found: 422,
  import_unavailable: 503,
  decide_first: 409,
  too_many_requests: 429,
  generic: 400,
  forbidden: 403,
  not_found: 404,
  expired: 410,
  wrong_url: 422,
  account_mismatch: 409,
  unknown_model: 422,
};

/** A refusal of the AI routes: `{ error, code }` at the status that belongs to the code. */
export function aiRefusal(code: AiRefusalCode, message: string): DomainError {
  return new DomainError(REFUSAL_STATUS[code], message, { code, details: { code } });
}

const PROVIDER_MESSAGES: Partial<Record<AssistantErrorCode, string>> = {
  invalid_key: 'The provider refused this key',
  needs_reauth: 'The sign-in with the provider has expired',
  not_eligible: 'This account cannot be used here',
  usage_limit: 'The usage included in this plan is used up',
  rate_limited: 'The provider is limiting requests right now',
  provider_unavailable: 'The provider is not responding',
};

/** A provider's failure as the refusal a REST route answers with. */
export function providerRefusal(err: AiProviderError): DomainError {
  return aiRefusal(err.code, PROVIDER_MESSAGES[err.code] ?? 'The provider refused the request');
}
