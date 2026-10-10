/**
 * The values `src/config` holds under test.
 *
 * tests/setup.ts mocks `src/config` with this object for every test file, so a
 * suite never reads or writes the key files under data/ and every suite signs
 * tokens with the same secret the code under test verifies them with. A suite
 * does not declare its own `vi.mock` of the config module (lint:test-mocks
 * counts them); one that needs a different value calls `overrideTestConfig`,
 * and the setup file puts the defaults back after every test.
 *
 * This file must not import application code: the setup file loads it before
 * any module under test, and an app import here would resolve against the
 * environment before the setup file has written it.
 */
import type * as RealConfig from '../../src/config';

type ConfigModule = typeof RealConfig;
type ConfigValues = Omit<ConfigModule, 'updateJwtSecret'>;

const DEFAULTS: ConfigValues = {
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  DEFAULT_LANGUAGE: 'en',
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER: '30d',
  SESSION_DURATION_REMEMBER_MS: 2592000000,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
};

/**
 * The mocked module itself. Code under test reads its exports at call time,
 * so a change made by `overrideTestConfig` is seen by the next read.
 * `updateJwtSecret` stays inert, as it was in every per-file mock before: a
 * rotation inside one case must not change the secret the next case signs with.
 */
export const TEST_CONFIG: ConfigModule = {
  ...DEFAULTS,
  updateJwtSecret: () => {},
};

/**
 * Set config values for the current test. Returns a function that puts the
 * previous values back; the setup file also restores the defaults after every
 * test, so calling it is only needed to undo an override inside one case.
 */
export function overrideTestConfig(values: Partial<ConfigValues>): () => void {
  const previous: Partial<ConfigValues> = {};
  const target = TEST_CONFIG as unknown as Record<string, unknown>;
  for (const key of Object.keys(values) as (keyof ConfigValues)[]) {
    (previous as Record<string, unknown>)[key] = target[key];
    target[key] = values[key];
  }
  return () => {
    for (const key of Object.keys(previous)) target[key] = (previous as Record<string, unknown>)[key];
  };
}

/** Put every value back to its default. Called by tests/setup.ts after each test. */
export function resetTestConfig(): void {
  Object.assign(TEST_CONFIG, DEFAULTS);
}
