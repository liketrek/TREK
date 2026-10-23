/**
 * FE-AI-PROVIDER-001 to FE-AI-PROVIDER-004
 *
 * Pasting a key picks the provider by its prefix, so the most specific prefix
 * has to win; pasting the ChatGPT sign-in address submits it, so only that
 * address may count.
 */
import { aiConnectionKindSchema } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { AI_PROVIDERS, detectKeyKind, isChatgptCallback, providerLabel } from './providerCatalog';

describe('providerCatalog', () => {
  it('FE-AI-PROVIDER-001: reads the provider from the key prefix, most specific first', () => {
    expect(detectKeyKind('sk-ant-api03-abcdef')).toBe('anthropic');
    expect(detectKeyKind('  sk-or-v1-abcdef\n')).toBe('openrouter');
    expect(detectKeyKind('AIzaSyAbcdef')).toBe('gemini');
    expect(detectKeyKind('AQ.Ab8RN6IVSexample')).toBe('gemini');
    expect(detectKeyKind('sk-proj-abcdef')).toBe('openai');
    expect(detectKeyKind('sk-abcdef')).toBe('openai');
    expect(detectKeyKind('ghp_abcdef')).toBeNull();
    expect(detectKeyKind('')).toBeNull();
  });

  it('FE-AI-PROVIDER-002: accepts only the loopback sign-in address, any port', () => {
    expect(isChatgptCallback('http://127.0.0.1:1455/auth/callback?code=abc&state=xyz')).toBe(true);
    expect(isChatgptCallback(' http://127.0.0.1:1457/auth/callback?code=abc ')).toBe(true);
    expect(isChatgptCallback('http://localhost:1455/auth/callback?code=abc')).toBe(false);
    expect(isChatgptCallback('https://127.0.0.1:1455/auth/callback?code=abc')).toBe(false);
    expect(isChatgptCallback('http://127.0.0.1:1455/other?code=abc')).toBe(false);
    expect(isChatgptCallback('not a url')).toBe(false);
  });

  it('FE-AI-PROVIDER-003: fills {provider} with the brand, or an own server with its host', () => {
    expect(providerLabel('anthropic', 'api.anthropic.com')).toBe('Anthropic');
    expect(providerLabel('chatgpt', 'api.openai.com')).toBe('ChatGPT');
    expect(providerLabel('custom', 'ollama.lan')).toBe('ollama.lan');
  });

  it('FE-AI-PROVIDER-004: every connection kind has an entry with a hint', () => {
    for (const kind of aiConnectionKindSchema.options) {
      expect(AI_PROVIDERS[kind].kind).toBe(kind);
      expect(AI_PROVIDERS[kind].hintKey).toMatch(/^assistant\./);
    }
  });
});
