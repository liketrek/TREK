import pkg from '../../../package.json';
import { runningVersion } from '../../../src/app-config';
import { hostVersion } from '../../../src/nest/plugins/install/host-compat';

import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('runningVersion', () => {
  it('announces APP_VERSION when it is set', () => {
    vi.stubEnv('APP_VERSION', '9.8.7');
    expect(runningVersion()).toBe('9.8.7');
  });

  it('falls back to the server package version', () => {
    vi.stubEnv('APP_VERSION', '');
    expect(runningVersion()).toBe(pkg.version);
  });

  it('is what the plugin host-compatibility checks call the host version', () => {
    vi.stubEnv('APP_VERSION', '1.2.3');
    expect(hostVersion()).toBe(runningVersion());
  });
});
