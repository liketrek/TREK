/**
 * The Amap key a cover search uses: the instance's own value first, the
 * caller's personal column last. TRIP-COVER-KEY-001 to 003.
 */
import { resolveAmapCoverKey } from '../../../src/nest/trips/amap-cover-key';

import { describe, expect, it, vi } from 'vitest';

const users = (stored: string | null) => ({ getApiKeyColumn: vi.fn(async () => stored) });
const settings = (instance: string | null) => ({ getInstanceApiKey: vi.fn(async () => instance) });

describe('resolveAmapCoverKey', () => {
  it('TRIP-COVER-KEY-001: the instance key wins and the personal column is never read', async () => {
    const repo = users('personal-key');
    expect(await resolveAmapCoverKey(settings('instance-key'), repo, 7)).toBe('instance-key');
    expect(repo.getApiKeyColumn).not.toHaveBeenCalled();
  });

  it("TRIP-COVER-KEY-002: falls back to the caller's own column when the instance has no key", async () => {
    const repo = users('personal-key');
    expect(await resolveAmapCoverKey(settings(null), repo, 7)).toBe('personal-key');
    expect(repo.getApiKeyColumn).toHaveBeenCalledWith(7, 'amap_api_key');
  });

  it('TRIP-COVER-KEY-003: nobody asking (userId 0) ends at the instance, and no key anywhere is null', async () => {
    const repo = users('personal-key');
    expect(await resolveAmapCoverKey(settings(null), repo, 0)).toBeNull();
    expect(repo.getApiKeyColumn).not.toHaveBeenCalled();
  });
});
