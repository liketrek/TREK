import type { AiApiKeyKind, AiConnectionKind } from '@trek/shared';

/**
 * The AI providers as the client names and explains them. Brand names live
 * here and nowhere in the locales: a translated string takes them through a
 * `{provider}` placeholder. The tiles show a neutral monogram, never a logo.
 *
 * Which model a new connection starts on is the server's choice; the client
 * only lists what the provider offers once connected.
 */

interface AiProviderInfo {
  kind: AiConnectionKind;
  /** The brand name, never translated; null for an own server, which has no brand. */
  label: string | null;
  /** The letter on the provider's tile; null for an own server, which shows a server icon. */
  monogram: string | null;
  /** Where a key for it is made; null where there is none to copy. */
  keyUrl: string | null;
  /** The one-line help under the key field or tile. */
  hintKey: string;
  /** The provider offers a free tier worth naming; a key may still be on a paid one. */
  free: boolean;
}

export const AI_PROVIDERS: Record<AiConnectionKind, AiProviderInfo> = {
  anthropic: {
    kind: 'anthropic',
    label: 'Anthropic',
    monogram: 'A',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    hintKey: 'assistant.connect.hintAnthropic',
    free: false,
  },
  openai: {
    kind: 'openai',
    label: 'OpenAI',
    monogram: 'O',
    keyUrl: 'https://platform.openai.com/api-keys',
    hintKey: 'assistant.connect.hintOpenai',
    free: false,
  },
  gemini: {
    kind: 'gemini',
    label: 'Gemini',
    monogram: 'G',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    hintKey: 'assistant.connect.hintGemini',
    free: true,
  },
  openrouter: {
    kind: 'openrouter',
    label: 'OpenRouter',
    monogram: 'R',
    keyUrl: 'https://openrouter.ai/keys',
    hintKey: 'assistant.connect.hintOpenrouter',
    free: false,
  },
  chatgpt: {
    kind: 'chatgpt',
    label: 'ChatGPT',
    monogram: 'C',
    keyUrl: null,
    hintKey: 'assistant.connect.chatgptHint',
    free: false,
  },
  custom: {
    kind: 'custom',
    label: null,
    monogram: null,
    keyUrl: null,
    hintKey: 'assistant.admin.customHint',
    free: false,
  },
};

/** The kinds a pasted key can be, in the order the tiles list them. */
export const API_KEY_KINDS: readonly AiApiKeyKind[] = ['anthropic', 'openai', 'gemini', 'openrouter'];

/** What fills `{provider}`: the brand, or for an own server its host. */
export function providerLabel(kind: AiConnectionKind, host: string): string {
  return AI_PROVIDERS[kind].label ?? host;
}

// Most specific first: an OpenRouter or Anthropic key also starts with "sk-".
const KEY_PREFIXES: readonly [string, AiApiKeyKind][] = [
  ['sk-ant-', 'anthropic'],
  ['sk-or-', 'openrouter'],
  ['AIza', 'gemini'],
  // Google's newer AI Studio keys.
  ['AQ.', 'gemini'],
  ['sk-', 'openai'],
];

/**
 * The provider a pasted key belongs to, read from its prefix; null when it
 * matches none. Only a convenience: key formats change, so an unknown prefix
 * asks which provider it is instead of refusing, and saving tests the key.
 */
export function detectKeyKind(raw: string): AiApiKeyKind | null {
  const key = raw.trim();
  return KEY_PREFIXES.find(([prefix]) => key.startsWith(prefix))?.[1] ?? null;
}

/** Where a ChatGPT plan's usage is shown, linked when it ran out. */
export const CHATGPT_USAGE_URL = 'https://chatgpt.com/settings/usage';

/**
 * Whether pasted text is the address ChatGPT's sign-in ended on. It sends the
 * browser to a loopback address nothing listens on, so the browser shows an
 * error page and the user pastes its address back; only the port may differ.
 */
export function isChatgptCallback(text: string): boolean {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return false;
  }
  return url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.pathname === '/auth/callback';
}
