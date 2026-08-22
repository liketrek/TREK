import { describe, it, expect } from 'vitest';
import { redact, SENSITIVE_KEYS } from '../../../src/middleware/globalMiddleware';

describe('globalMiddleware request-log redaction', () => {
  it('redacts secretAccessKey (any casing) — storage admin PUT bodies land in the same debug log line', () => {
    expect(redact({ secretAccessKey: 'sk-super-secret' })).toEqual({ secretAccessKey: '[REDACTED]' });
    expect(redact({ SecretAccessKey: 'sk-super-secret' })).toEqual({ SecretAccessKey: '[REDACTED]' });
    expect(redact({ secretaccesskey: 'sk-super-secret' })).toEqual({ secretaccesskey: '[REDACTED]' });
  });

  it('lists secretaccesskey in the lowercase lookup set (lookup lowercases the key first)', () => {
    expect(SENSITIVE_KEYS.has('secretaccesskey')).toBe(true);
  });

  it('still redacts every pre-existing sensitive key (no regression)', () => {
    const input = {
      password: 'p',
      new_password: 'p',
      current_password: 'p',
      token: 't',
      jwt: 'j',
      authorization: 'a',
      cookie: 'c',
      client_secret: 's',
      mfa_token: 'm',
      code: '123456',
      smtp_pass: 's',
    };
    const out = redact(input) as Record<string, unknown>;
    for (const key of Object.keys(input)) {
      expect(out[key]).toBe('[REDACTED]');
    }
  });

  it('redacts nested objects and arrays, leaving non-sensitive fields untouched', () => {
    const out = redact({
      name: 'off-box',
      options: { secretAccessKey: 'sk-1', accessKeyId: 'ak-1' },
      backends: [{ secretAccessKey: 'sk-2' }, { accessKeyId: 'ak-2' }],
    });
    expect(out).toEqual({
      name: 'off-box',
      options: { secretAccessKey: '[REDACTED]', accessKeyId: 'ak-1' },
      backends: [{ secretAccessKey: '[REDACTED]' }, { accessKeyId: 'ak-2' }],
    });
  });

  it('passes non-object values through untouched', () => {
    expect(redact('plain string')).toBe('plain string');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
    expect(redact(undefined)).toBe(undefined);
  });
});
