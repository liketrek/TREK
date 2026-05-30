import { describe, it, expect } from 'vitest';
import { ConfigController } from '../../../src/nest/config/config.controller';
import { DEFAULT_LANGUAGE } from '../../../src/config';

describe('ConfigController (parity with the legacy /api/config route)', () => {
  it('returns the server default language, like the legacy public route', () => {
    expect(new ConfigController().getConfig()).toEqual({ defaultLanguage: DEFAULT_LANGUAGE });
  });
});
