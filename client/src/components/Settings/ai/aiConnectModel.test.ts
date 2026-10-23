// FE-AI-CONNECT-MODEL-001 to FE-AI-CONNECT-MODEL-007: the pure rules behind connecting an AI provider.
import type { AiConnectionView } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import {
  connectErrorKey,
  httpHostOf,
  isPublicHttpsUrl,
  refusalCode,
  rememberOpenrouterFlow,
  repairModeOf,
  svgDataUrl,
  takeOpenrouterFlow,
} from './aiConnectModel';

const refused = (code: unknown) => ({ response: { status: 422, data: { error: 'nope', code } } });

const VIEW: AiConnectionView = {
  scope: 'user',
  kind: 'anthropic',
  model: 'claude-sonnet',
  hint: '…a1b2',
  status: 'ok',
  host: 'api.anthropic.com',
};

describe('aiConnectModel', () => {
  it('FE-AI-CONNECT-MODEL-001: reads the code of a refusal, offline included', () => {
    expect(refusalCode(refused('invalid_key'))).toBe('invalid_key');
    expect(refusalCode(new OnlineOnlyError())).toBe('offline');
    expect(refusalCode(refused(42))).toBeNull();
    expect(refusalCode(new Error('boom'))).toBeNull();
    expect(refusalCode(null)).toBeNull();
  });

  it('FE-AI-CONNECT-MODEL-002: names the line each refusal shows, and the generic one for the rest', () => {
    expect(connectErrorKey(refused('invalid_key'))).toBe('assistant.connect.badKey');
    expect(connectErrorKey(refused('unknown_model'))).toBe('assistant.connect.unknownModel');
    expect(connectErrorKey(refused('account_mismatch'))).toBe('assistant.connect.chatgptOtherAccount');
    expect(connectErrorKey(refused('wrong_url'))).toBe('assistant.connect.chatgptWrong');
    expect(connectErrorKey(refused('expired'))).toBe('assistant.connect.chatgptExpired');
    expect(connectErrorKey(refused('not_eligible'))).toBe('assistant.error.notEligible');
    expect(connectErrorKey(refused('provider_unavailable'))).toBe('assistant.error.providerDown');
    expect(connectErrorKey(new OnlineOnlyError())).toBe('assistant.error.offline');
    expect(connectErrorKey(refused('forbidden'))).toBe('assistant.error.generic');
    expect(connectErrorKey(new Error('boom'))).toBe('assistant.error.generic');
  });

  it('FE-AI-CONNECT-MODEL-003: offers the way back into a broken connection, none for a working one', () => {
    expect(repairModeOf(VIEW)).toBeNull();
    expect(repairModeOf({ ...VIEW, status: 'error' })).toBe('key');
    expect(repairModeOf({ ...VIEW, kind: 'chatgpt', status: 'needs_reauth' })).toBe('chatgpt');
    expect(repairModeOf({ ...VIEW, kind: 'chatgpt', status: 'signed_out' })).toBe('chatgpt');
    expect(repairModeOf({ ...VIEW, scope: 'instance', kind: 'custom', status: 'error' })).toBe('custom');
  });

  it('FE-AI-CONNECT-MODEL-004: keeps the OpenRouter flow for exactly one return', () => {
    expect(takeOpenrouterFlow()).toBeNull();
    rememberOpenrouterFlow('flow-1');
    expect(takeOpenrouterFlow()).toBe('flow-1');
    expect(takeOpenrouterFlow()).toBeNull();
  });

  it('FE-AI-CONNECT-MODEL-005: only an https address on a public name counts as reachable for Claude', () => {
    expect(isPublicHttpsUrl('https://trip.example.org/mcp')).toBe(true);
    for (const url of [
      'http://trip.example.org/mcp',
      'https://localhost/mcp',
      'https://nas.local/mcp',
      'https://trek/mcp',
      'https://192.168.1.20/mcp',
      'https://10.0.0.5/mcp',
      'https://172.20.1.1/mcp',
      'https://127.0.0.1/mcp',
      'https://[::1]/mcp',
      'not a url',
    ]) {
      expect(isPublicHttpsUrl(url), url).toBe(false);
    }
    expect(isPublicHttpsUrl('https://172.32.0.1/mcp')).toBe(true);
  });

  it('FE-AI-CONNECT-MODEL-006: reads the host of an address while it is typed', () => {
    expect(httpHostOf(' http://localhost:11434/v1 ')).toBe('localhost:11434');
    expect(httpHostOf('https://llm.example.org')).toBe('llm.example.org');
    expect(httpHostOf('localhost:11434')).toBe('');
    expect(httpHostOf('http://')).toBe('');
  });

  it('FE-AI-CONNECT-MODEL-007: turns SVG markup into an image source, never into markup', () => {
    const src = svgDataUrl('<svg><path d="M0 0"/></svg>');
    expect(src.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(src).not.toContain('<');
    expect(decodeURIComponent(src.split(',')[1])).toBe('<svg><path d="M0 0"/></svg>');
  });
});
