import type { AppSettingsRepository } from '../../../../src/db/repositories/AppSettings.repository';
import { getPhotoProviderConfig } from '../../../../src/nest/common/photo-provider-config';
import {
  DEFAULT_TRANSIT_PROVIDER,
  readTransitProvider,
  TRANSIT_PROVIDER_SETTING,
  writeTransitProvider,
} from '../../../../src/nest/common/transit-provider';

import { describe, expect, it, vi } from 'vitest';

function settings(value: string | null) {
  return { getValue: vi.fn(async () => value), setValue: vi.fn(async () => undefined) };
}

describe('transit provider setting', () => {
  it('reads a known backend as stored', async () => {
    const repo = settings('google');
    expect(await readTransitProvider(repo as unknown as AppSettingsRepository)).toBe('google');
    expect(repo.getValue).toHaveBeenCalledWith(TRANSIT_PROVIDER_SETTING);
  });

  it('falls back to Transitous for a missing row or a name this version does not know', async () => {
    expect(await readTransitProvider(settings(null) as unknown as AppSettingsRepository)).toBe(
      DEFAULT_TRANSIT_PROVIDER,
    );
    expect(await readTransitProvider(settings('rail-x') as unknown as AppSettingsRepository)).toBe(
      DEFAULT_TRANSIT_PROVIDER,
    );
  });

  it('writes the name under its one key and hands it back', async () => {
    const repo = settings(null);
    expect(await writeTransitProvider(repo as unknown as AppSettingsRepository, 'google')).toBe('google');
    expect(repo.setValue).toHaveBeenCalledWith(TRANSIT_PROVIDER_SETTING, 'google');
  });
});

describe('photo provider config', () => {
  it('points every endpoint under the provider prefix', () => {
    expect(getPhotoProviderConfig('immich')).toEqual({
      settings_get: '/integrations/memories/immich/settings',
      settings_put: '/integrations/memories/immich/settings',
      status_get: '/integrations/memories/immich/status',
      test_post: '/integrations/memories/immich/test',
    });
  });
});
