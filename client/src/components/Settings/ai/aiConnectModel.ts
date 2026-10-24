import type { AiConnectionStatus, AiConnectionView } from '@trek/shared';
import { OnlineOnlyError } from '../../../repo/onlineOnly';

/**
 * Pure helpers behind connecting an AI provider, shared by the settings card,
 * the admin's instance connection and both phone twins. No React here.
 */

/** How a connection is being set up: a ChatGPT sign-in, a pasted key, or (admin only) an own server. */
export type AiConnectMode = 'chatgpt' | 'key' | 'custom';

/** Where the Claude connector card sits, for the "Using Claude?" line to jump to. */
export const CLAUDE_CONNECTOR_ANCHOR = 'claude-connector';

/** The `code` of a refused AI request (`{ error, code }`), or null when the failure carries none. */
export function refusalCode(err: unknown): string | null {
  if (err instanceof OnlineOnlyError) return 'offline';
  const code = (err as { response?: { data?: { code?: unknown } } } | null)?.response?.data?.code;
  return typeof code === 'string' ? code : null;
}

/**
 * What a refused connect says, per code. Everything the server can answer while
 * a key is tested or a sign-in finishes; anything else reads as the generic line.
 */
const CONNECT_ERRORS: Record<string, { messageKey: string }> = {
  invalid_key: { messageKey: 'assistant.connect.badKey' },
  unknown_model: { messageKey: 'assistant.connect.unknownModel' },
  rate_limited: { messageKey: 'assistant.error.rateLimited' },
  provider_unavailable: { messageKey: 'assistant.error.providerDown' },
  not_eligible: { messageKey: 'assistant.error.notEligible' },
  usage_limit: { messageKey: 'assistant.error.usageLimit' },
  expired: { messageKey: 'assistant.connect.chatgptExpired' },
  wrong_url: { messageKey: 'assistant.connect.chatgptWrong' },
  account_mismatch: { messageKey: 'assistant.connect.chatgptOtherAccount' },
  offline: { messageKey: 'assistant.error.offline' },
};

/** The line a failed connect shows. Takes `{provider}` where the line names one. */
export function connectErrorKey(err: unknown): string {
  return CONNECT_ERRORS[refusalCode(err) ?? '']?.messageKey ?? 'assistant.error.generic';
}

/** How each connection state reads on its pill. */
export const CONNECTION_STATUS: Record<
  AiConnectionStatus,
  { labelKey: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  ok: { labelKey: 'assistant.connect.statusOk', tone: 'success' },
  needs_reauth: { labelKey: 'assistant.connect.statusNeedsReauth', tone: 'warning' },
  signed_out: { labelKey: 'assistant.connect.statusSignedOut', tone: 'neutral' },
  error: { labelKey: 'assistant.connect.statusError', tone: 'danger' },
};

/** The way back into a connection that no longer works: a ChatGPT sign-in again, or a new key. */
export function repairModeOf(view: AiConnectionView): AiConnectMode | null {
  if (view.status === 'ok') return null;
  if (view.kind === 'chatgpt') return 'chatgpt';
  return view.kind === 'custom' ? 'custom' : 'key';
}

// The OpenRouter sign-in leaves the page and comes back with a code only; the
// flow it belongs to waits here for that one return. Tab-scoped on purpose.
const OPENROUTER_FLOW_KEY = 'trek.ai.openrouterFlow';

export function rememberOpenrouterFlow(flowId: string): void {
  try {
    sessionStorage.setItem(OPENROUTER_FLOW_KEY, flowId);
  } catch {
    // Storage refused (private mode): the return then reads as an expired sign-in.
  }
}

/** The flow the OpenRouter sign-in started, read once. */
export function takeOpenrouterFlow(): string | null {
  try {
    const flowId = sessionStorage.getItem(OPENROUTER_FLOW_KEY);
    sessionStorage.removeItem(OPENROUTER_FLOW_KEY);
    return flowId;
  } catch {
    return null;
  }
}

const PRIVATE_V4 = [/^10\./, /^127\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^0\./];

/**
 * Whether Claude can reach this address from the internet: https on a public
 * name. A LAN address, a loopback, a single-label host or `.local` cannot be
 * reached from claude.ai, so the connector would fail after the user did
 * everything right.
 */
export function isPublicHttpsUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host.startsWith('[')) return false;
  if (!host.includes('.') || host === 'localhost' || host.endsWith('.local') || host.endsWith('.localhost')) {
    return false;
  }
  return !PRIVATE_V4.some((range) => range.test(host));
}

/** The host of an http(s) address as typed, or '' while it is not one yet. */
export function httpHostOf(raw: string): string {
  const value = raw.trim();
  if (!/^https?:\/\//i.test(value)) return '';
  try {
    return new URL(value).host;
  } catch {
    return '';
  }
}

/** An SVG as an `<img>` source, so its markup never lands in the page's DOM. */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * What a user's AI connection serves, as its section's title and line: the
 * assistant, AI parsing (booking import reads with the same connection), or both.
 */
export function aiSectionText(assistant: boolean, parsing: boolean): { titleKey: string; hintKey: string } {
  if (!assistant) return { titleKey: 'settings.aiParsing.title', hintKey: 'assistant.connect.descriptionParsingOnly' };
  if (parsing) return { titleKey: 'assistant.connect.title', hintKey: 'assistant.connect.descriptionWithParsing' };
  return { titleKey: 'assistant.connect.title', hintKey: 'assistant.connect.description' };
}
