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

  it('redacts secret-shaped keys by suffix — the OAuth token body and the settings API keys', () => {
    const out = redact({
      refresh_token: 'rt-1',
      code_verifier: 'cv-1',
      llm_api_key: 'sk-1',
      mapbox_access_token: 'pk-1',
      grant_type: 'refresh_token',
    }) as Record<string, unknown>;
    expect(out.refresh_token).toBe('[REDACTED]');
    expect(out.code_verifier).toBe('[REDACTED]');
    expect(out.llm_api_key).toBe('[REDACTED]');
    expect(out.mapbox_access_token).toBe('[REDACTED]');
    expect(out.grant_type).toBe('refresh_token');
  });

  it('redacts the value of a {key, value} settings body when the key names a secret', () => {
    expect(redact({ key: 'carto_api_key', value: 'carto-secret' })).toEqual({
      key: 'carto_api_key',
      value: '[REDACTED]',
    });
    expect(redact({ key: 'mapbox_access_token', value: 'pk-1' })).toEqual({
      key: 'mapbox_access_token',
      value: '[REDACTED]',
    });
    // A harmless setting keeps its value: the name is what decides.
    expect(redact({ key: 'map_tile_url', value: 'https://tiles.example/{z}/{x}/{y}.png' })).toEqual({
      key: 'map_tile_url',
      value: 'https://tiles.example/{z}/{x}/{y}.png',
    });
  });

  it('matches the suffix on the end of the key only, so identifiers stay readable', () => {
    expect(redact({ accessKeyId: 'ak-1', tokenCount: 5 })).toEqual({ accessKeyId: 'ak-1', tokenCount: 5 });
  });

  it('passes non-object values through untouched', () => {
    expect(redact('plain string')).toBe('plain string');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
    expect(redact(undefined)).toBe(undefined);
  });
});
