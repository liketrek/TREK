/**
 * Parity guard for scripts/migrate-encryption.ts.
 *
 * The rotation script re-encrypts at-rest secrets from one ENCRYPTION_KEY to the
 * next, and it walks a hardcoded list of app_settings keys. It cannot import the
 * canonical list from src/, because it deliberately runs without config.ts and
 * without the Nest container, so the list is a copy.
 *
 * A missing name does not fail loudly: the value stays encrypted under the old
 * key, decrypt_api_key returns null on the next read, and the instance quietly
 * behaves as if no key were configured. This pins the copy instead.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { INSTANCE_API_KEY_NAMES } from '../../../src/nest/settings/instance-api-keys';

const script = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'scripts', 'migrate-encryption.ts'),
  'utf8',
);

// The app_settings loop only, so a name that happens to appear elsewhere in the
// script (a users column of the same name, a comment) cannot satisfy the test.
const appSettingsLoop = (() => {
  const start = script.indexOf("'oidc_client_secret'");
  expect(start).toBeGreaterThan(-1);
  const end = script.indexOf('--- users:', start);
  expect(end).toBeGreaterThan(start);
  return script.slice(start, end);
})();

describe('migrate-encryption.ts app_settings parity', () => {
  it('ROTPAR-001: rotates every instance-wide API key', () => {
    for (const name of INSTANCE_API_KEY_NAMES) {
      expect(appSettingsLoop).toContain(`'${name}'`);
    }
  });

  it('ROTPAR-002: still rotates the app_settings secrets that predate them', () => {
    for (const name of ['oidc_client_secret', 'smtp_pass', 'admin_webhook_url', 'admin_ntfy_token']) {
      expect(appSettingsLoop).toContain(`'${name}'`);
    }
  });

  it('ROTPAR-003: the canonical list is not empty, so ROTPAR-001 cannot pass vacuously', () => {
    expect(INSTANCE_API_KEY_NAMES.length).toBeGreaterThan(0);
  });
});
