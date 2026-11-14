// FE-MAILINGEST-REPO-001 to FE-MAILINGEST-REPO-003
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/mailIngest', () => ({
  mailIngestApi: { inboxCount: vi.fn(), tripAddress: vi.fn(), adminSettings: vi.fn() },
}));

import { mailIngestApi } from '../api/mailIngest';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { mailIngestRepo } from './mailIngestRepo';
import { OnlineOnlyError } from './onlineOnly';

afterEach(() => {
  _resetNetworkMode();
  vi.mocked(mailIngestApi.inboxCount).mockReset();
});

describe('mailIngestRepo', () => {
  it('FE-MAILINGEST-REPO-001: answers parsed against the shared contract', async () => {
    vi.mocked(mailIngestApi.inboxCount).mockResolvedValue({ pending: 3 });
    vi.mocked(mailIngestApi.tripAddress).mockResolvedValue({ address: null });
    expect(await mailIngestRepo.inboxCount()).toBe(3);
    expect(await mailIngestRepo.tripAddress(7)).toBeNull();
  });

  it('FE-MAILINGEST-REPO-002: an answer of another shape fails here, not in the view', async () => {
    vi.mocked(mailIngestApi.inboxCount).mockResolvedValue({ pending: 'many' });
    await expect(mailIngestRepo.inboxCount()).rejects.toThrow();
    vi.mocked(mailIngestApi.adminSettings).mockResolvedValue(null);
    expect(await mailIngestRepo.adminSettings()).toEqual({});
  });

  it('FE-MAILINGEST-REPO-003: offline nothing is asked, and the caller hears why', async () => {
    setForcedOffline(true);
    await expect(mailIngestRepo.inboxCount()).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(mailIngestApi.inboxCount).not.toHaveBeenCalled();
  });
});
