import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { cookieOptions } from '../../../src/services/cookie';
import { SESSION_DURATION_MS, SESSION_DURATION_REMEMBER_MS } from '../../../src/config';

describe('cookieOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('always sets httpOnly: true', () => {
    expect(cookieOptions()).toHaveProperty('httpOnly', true);
  });

  it('always sets sameSite: lax', () => {
    expect(cookieOptions()).toHaveProperty('sameSite', 'lax');
  });

  it('always sets path: /', () => {
    expect(cookieOptions()).toHaveProperty('path', '/');
  });

  it('sets secure: false in test environment (COOKIE_SECURE=false from setup)', () => {
    // setup.ts sets COOKIE_SECURE=false, so secure should be false
    const opts = cookieOptions();
    expect(opts.secure).toBe(false);
  });

  it('sets secure: true when NODE_ENV=production and COOKIE_SECURE is not false', () => {
    vi.stubEnv('COOKIE_SECURE', 'true');
    vi.stubEnv('NODE_ENV', 'production');
    expect(cookieOptions().secure).toBe(true);
  });

  it('sets secure: false when COOKIE_SECURE=false even in production', () => {
    vi.stubEnv('COOKIE_SECURE', 'false');
    vi.stubEnv('NODE_ENV', 'production');
    expect(cookieOptions().secure).toBe(false);
  });

  it('sets secure: true when FORCE_HTTPS=true', () => {
    vi.stubEnv('COOKIE_SECURE', 'true');
    vi.stubEnv('FORCE_HTTPS', 'true');
    vi.stubEnv('NODE_ENV', 'development');
    expect(cookieOptions().secure).toBe(true);
  });

  it('includes maxAge: 86400000 when clear is false (default)', () => {
    expect(cookieOptions()).toHaveProperty('maxAge', 24 * 60 * 60 * 1000);
    expect(cookieOptions(false)).toHaveProperty('maxAge', 24 * 60 * 60 * 1000);
  });

  it('omits maxAge when clear is true', () => {
    const opts = cookieOptions(true);
    expect(opts).not.toHaveProperty('maxAge');
  });

  it('keeps the default SESSION_DURATION maxAge when remember is undefined', () => {
    expect(cookieOptions(false, undefined)).toHaveProperty('maxAge', SESSION_DURATION_MS);
  });

  it('uses the longer SESSION_DURATION_REMEMBER maxAge when remember is true', () => {
    expect(cookieOptions(false, undefined, true)).toHaveProperty('maxAge', SESSION_DURATION_REMEMBER_MS);
  });

  it('omits maxAge (session cookie) when remember is false', () => {
    expect(cookieOptions(false, undefined, false)).not.toHaveProperty('maxAge');
  });
});
