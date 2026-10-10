import * as config from '../../../src/config';
import { TEST_CONFIG, overrideTestConfig, resetTestConfig } from '../../helpers/test-config';

import { describe, it, expect } from 'vitest';

describe('test config', () => {
  it('is what src/config answers in every suite', () => {
    expect(config.JWT_SECRET).toBe('test-jwt-secret-for-trek-testing-only');
    expect(config.ENCRYPTION_KEY).toBe(TEST_CONFIG.ENCRYPTION_KEY);
    expect(config.DEFAULT_LANGUAGE).toBe('en');
    expect(config.SESSION_DURATION_SECONDS).toBe(86400);
    expect(config.SESSION_DURATION_REMEMBER_MS).toBe(2592000000);
  });

  it('keeps updateJwtSecret inert, so a rotation in one case does not leak into the next', () => {
    config.updateJwtSecret('rotated');
    expect(config.JWT_SECRET).toBe('test-jwt-secret-for-trek-testing-only');
  });

  it('overrideTestConfig changes what src/config answers until the restore runs', () => {
    const restore = overrideTestConfig({ JWT_SECRET: 'other-secret', DEFAULT_LANGUAGE: 'de' });
    expect(config.JWT_SECRET).toBe('other-secret');
    expect(config.DEFAULT_LANGUAGE).toBe('de');
    restore();
    expect(config.JWT_SECRET).toBe('test-jwt-secret-for-trek-testing-only');
    expect(config.DEFAULT_LANGUAGE).toBe('en');
  });

  it('leaves an override in place for the rest of its own case', () => {
    overrideTestConfig({ ENCRYPTION_KEY: 'case-local-key' });
    expect(config.ENCRYPTION_KEY).toBe('case-local-key');
  });

  it('starts the next case from the defaults again', () => {
    expect(config.ENCRYPTION_KEY).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2');
  });

  it('resetTestConfig puts every value back', () => {
    overrideTestConfig({ SESSION_DURATION_SECONDS: 5 });
    resetTestConfig();
    expect(config.SESSION_DURATION_SECONDS).toBe(86400);
  });
});
