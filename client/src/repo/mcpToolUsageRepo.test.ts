import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminMcpApi } from '../api/adminMcp';
import { mcpToolUsageRepo } from './mcpToolUsageRepo';
import * as onlineOnly from './onlineOnly';

afterEach(() => vi.restoreAllMocks());

const usage = {
  days: 7,
  since: '2026-10-31 00:00:00',
  total_calls: 2,
  tools: [{ tool: 'list_trips', calls: 2, users: 1, last_called_at: '2026-11-05 10:00:00' }],
};

describe('mcpToolUsageRepo', () => {
  it('FE-REPO-MCPUSAGE-001: reads the span through the admin route and checks the answer', async () => {
    vi.spyOn(adminMcpApi, 'toolUsage').mockResolvedValue(usage);
    expect(await mcpToolUsageRepo.list(7)).toEqual(usage);
    expect(adminMcpApi.toolUsage).toHaveBeenCalledWith(7);
  });

  it('FE-REPO-MCPUSAGE-002: refuses offline and on an answer that is not a usage table', async () => {
    vi.spyOn(onlineOnly, 'requireOnline').mockImplementationOnce(() => {
      throw new Error('offline');
    });
    vi.spyOn(adminMcpApi, 'toolUsage').mockResolvedValue({ tools: 'nope' } as never);
    await expect(mcpToolUsageRepo.list(7)).rejects.toThrow('offline');
    expect(adminMcpApi.toolUsage).not.toHaveBeenCalled();
    await expect(mcpToolUsageRepo.list(7)).rejects.toThrow();
  });
});
