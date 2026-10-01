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

  it('hides the Web Push subscription body: the endpoint capability URL and both keys', () => {
    // POST /api/notifications/push/subscriptions, as PushSubscription.toJSON() hands it over.
    expect(
      redact({
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/device-capability',
          expirationTime: null,
          keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA', auth: 'tBHItJI5svbpez7KI4CCXg' },
        },
      }),
    ).toEqual({
      subscription: {
        endpoint: '[REDACTED]',
        expirationTime: null,
        keys: { p256dh: '[REDACTED]', auth: '[REDACTED]' },
      },
    });
  });

  it('hides the subscription the service worker posts again after the browser renewed it', () => {
    // sw-push.js on pushsubscriptionchange: the same route and shape, and a renewed
    // subscription may carry a real expiry instead of null.
    expect(
      redact({
        subscription: {
          endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/renewed-capability',
          expirationTime: 1767225600000,
          keys: { p256dh: 'BOr1renewedPublicKey', auth: 'renewedAuthSecret' },
        },
      }),
    ).toEqual({
      subscription: {
        endpoint: '[REDACTED]',
        expirationTime: 1767225600000,
        keys: { p256dh: '[REDACTED]', auth: '[REDACTED]' },
      },
    });
  });

  it('hides the endpoint of a subscription that arrives without its keys', () => {
    // The route refuses this body with a 400, but the request is logged all the same.
    expect(
      redact({ subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/keyless', expirationTime: null } }),
    ).toEqual({ subscription: { endpoint: '[REDACTED]', expirationTime: null } });
    expect(redact({ subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/lone' } })).toEqual({
      subscription: { endpoint: '[REDACTED]' },
    });
    expect(
      redact({ subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/odd-keys', keys: 'not-an-object' } }),
    ).toEqual({ subscription: { endpoint: '[REDACTED]', keys: 'not-an-object' } });
  });

  it('hides the endpoint of the body that forgets a push device', () => {
    // DELETE /api/notifications/push/subscriptions (logout, switching push off, the worker's renewal).
    expect(redact({ endpoint: 'https://web.push.apple.com/QGx-device' })).toEqual({ endpoint: '[REDACTED]' });
    expect(redact({ Endpoint: 'https://web.push.apple.com/QGx-device' })).toEqual({ Endpoint: '[REDACTED]' });
  });

  it('keeps an endpoint that is an ordinary setting readable, like the S3 backend URL', () => {
    expect(
      redact({ endpoint: 'http://127.0.0.1:9000', bucket: 'trek', region: 'us-east-1', secretAccessKey: 'sk' }),
    ).toEqual({ endpoint: 'http://127.0.0.1:9000', bucket: 'trek', region: 'us-east-1', secretAccessKey: '[REDACTED]' });
    expect(redact({ endpoint: 'https://s3.example.com', forcePathStyle: true })).toEqual({
      endpoint: 'https://s3.example.com',
      forcePathStyle: true,
    });
  });

  it('decides p256dh and auth by name wherever they appear, and nothing near them by accident', () => {
    // Only the push subscription sends either field today; an `auth` anywhere
    // else would carry credentials too. The fields around them stay readable.
    expect(redact({ p256dh: 'BPub', Auth: 'secret', auth_method: 'basic', author: 'Ada' })).toEqual({
      p256dh: '[REDACTED]',
      Auth: '[REDACTED]',
      auth_method: 'basic',
      author: 'Ada',
    });
    expect(redact({ auth: { user: 'mailer', pass: 'hunter2' } })).toEqual({ auth: '[REDACTED]' });
  });

  it('passes non-object values through untouched', () => {
    expect(redact('plain string')).toBe('plain string');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
    expect(redact(undefined)).toBe(undefined);
  });
});
