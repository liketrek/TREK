import { afterEach, describe, expect, it, vi } from 'vitest';
import { mcpAppsAdminApi } from '../api/tourBaseMaps';
import { mcpAppsAdminRepo } from './mcpAppsAdminRepo';
import * as onlineOnly from './onlineOnly';

afterEach(() => vi.restoreAllMocks());

describe('mcpAppsAdminRepo', () => {
  it('FE-REPO-MCPAPPS-001: reads and writes the switch through the admin route, checking the answer', async () => {
    vi.spyOn(mcpAppsAdminApi, 'get').mockResolvedValue({ enabled: true });
    vi.spyOn(mcpAppsAdminApi, 'update').mockResolvedValue({ enabled: false });
    expect(await mcpAppsAdminRepo.get()).toEqual({ enabled: true });
    expect(await mcpAppsAdminRepo.update(false)).toEqual({ enabled: false });
    expect(mcpAppsAdminApi.update).toHaveBeenCalledWith(false);
  });

  it('FE-REPO-MCPAPPS-002: refuses offline and on an answer that is not a switch', async () => {
    vi.spyOn(onlineOnly, 'requireOnline').mockImplementationOnce(() => {
      throw new Error('offline');
    });
    await expect(mcpAppsAdminRepo.get()).rejects.toThrow('offline');
    vi.spyOn(mcpAppsAdminApi, 'get').mockResolvedValue({ nope: 1 } as never);
    await expect(mcpAppsAdminRepo.get()).rejects.toThrow();
  });
});
