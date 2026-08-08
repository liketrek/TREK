import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getAppUrl, getMcpSafeUrl } from '../../../src/app-config/app-url';

// These tests PIN the exact behavior moved verbatim from
// services/notifications.ts (2026-07-28): the APP_URL → ALLOWED_ORIGINS →
// localhost fallback chain, the strip-ALL-trailing-slashes quirk, the
// invalid-URL silent fallthrough, and getMcpSafeUrl's HTTPS/localhost issuer
// sanitization. If one fails after an edit, the edit changed runtime
// behavior — fix the edit, not the test (parity is law).

const KEYS = ['APP_URL', 'ALLOWED_ORIGINS', 'PORT'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('getAppUrl', () => {
  it('returns APP_URL with ALL trailing slashes stripped', () => {
    process.env.APP_URL = 'https://trek.example.com///';
    expect(getAppUrl()).toBe('https://trek.example.com');
  });

  it('falls through an invalid APP_URL to the first ALLOWED_ORIGINS entry', () => {
    process.env.APP_URL = 'not a url';
    process.env.ALLOWED_ORIGINS = 'https://a.example/, https://b.example';
    expect(getAppUrl()).toBe('https://a.example');
  });

  it('uses the first ALLOWED_ORIGINS entry (trimmed, slashes stripped) when APP_URL is unset', () => {
    process.env.ALLOWED_ORIGINS = ' https://origin.example// ,https://other.example';
    expect(getAppUrl()).toBe('https://origin.example');
  });

  it('falls back to http://localhost:{PORT} when neither is usable', () => {
    process.env.ALLOWED_ORIGINS = 'not-a-url';
    process.env.PORT = '4123';
    expect(getAppUrl()).toBe('http://localhost:4123');
  });

  it('defaults to port 3001 with no env at all', () => {
    expect(getAppUrl()).toBe('http://localhost:3001');
  });

  it('reads the env live — no caching across calls', () => {
    process.env.APP_URL = 'https://first.example';
    expect(getAppUrl()).toBe('https://first.example');
    process.env.APP_URL = 'https://second.example';
    expect(getAppUrl()).toBe('https://second.example');
  });
});

describe('getMcpSafeUrl', () => {
  it('passes through HTTPS URLs', () => {
    process.env.APP_URL = 'https://trek.example.com';
    expect(getMcpSafeUrl()).toBe('https://trek.example.com');
  });

  it('passes through http://localhost and http://127.0.0.1', () => {
    process.env.APP_URL = 'http://localhost:8080';
    expect(getMcpSafeUrl()).toBe('http://localhost:8080');
    process.env.APP_URL = 'http://127.0.0.1:8080';
    expect(getMcpSafeUrl()).toBe('http://127.0.0.1:8080');
  });

  it('sanitizes non-HTTPS, non-localhost URLs to http://localhost:{PORT}', () => {
    process.env.APP_URL = 'http://trek.internal.lan';
    process.env.PORT = '3005';
    expect(getMcpSafeUrl()).toBe('http://localhost:3005');
  });
});
