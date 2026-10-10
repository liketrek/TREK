/**
 * SSRF-hardened installer download (#plugins, M4): host allowlist, private-IP
 * refusal, manual redirect following, size cap, sha256.
 */
import { isPrivateIp, sha256Matches, safeDownload, DownloadError } from '../../../src/nest/plugins/install/safe-fetch';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn(async () => [{ address: '140.82.121.3', family: 4 }]) }));
vi.mock('node:dns/promises', () => ({ default: { lookup } }));

beforeEach(() => {
  lookup.mockResolvedValue([{ address: '140.82.121.3', family: 4 }]);
});
afterEach(() => vi.unstubAllGlobals());

describe('isPrivateIp', () => {
  it.each(['10.0.0.1', '127.0.0.1', '172.16.5.5', '192.168.1.1', '169.254.1.1', '::1', 'fd00::1', 'fe80::1'])(
    'private: %s',
    (ip) => expect(isPrivateIp(ip)).toBe(true),
  );
  it.each(['140.82.121.3', '8.8.8.8', '2606:2800::1'])('public: %s', (ip) => expect(isPrivateIp(ip)).toBe(false));
});

describe('sha256Matches', () => {
  it('constant-time equals', () => {
    expect(sha256Matches('abc123', 'abc123')).toBe(true);
    expect(sha256Matches('abc123', 'abc124')).toBe(false);
    expect(sha256Matches('abc', 'abcd')).toBe(false);
  });
});

describe('safeDownload', () => {
  it('rejects a non-allowlisted host before any fetch', async () => {
    await expect(safeDownload('https://evil.example/x.zip')).rejects.toThrow(/not allowlisted/);
  });

  it('rejects non-https', async () => {
    await expect(safeDownload('http://github.com/x.zip')).rejects.toThrow(/https/);
  });

  it('refuses when the host resolves to a private address', async () => {
    lookup.mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    await expect(safeDownload('https://github.com/x.zip')).rejects.toThrow(/private address/);
  });

  it('downloads and hashes, following a GitHub release-asset redirect', async () => {
    const bytes = Buffer.from('plugin-bytes');
    const fetchMock = vi
      .fn()
      // GitHub 302s release assets to a rotating *.githubusercontent.com host
      .mockResolvedValueOnce({
        status: 302,
        headers: new Headers({ location: 'https://release-assets.githubusercontent.com/x/plugin.zip' }),
      })
      .mockResolvedValueOnce({ status: 200, ok: true, headers: new Headers(), arrayBuffer: async () => bytes });
    vi.stubGlobal('fetch', fetchMock);

    const out = await safeDownload('https://github.com/x');
    expect(out.bytes.toString()).toBe('plugin-bytes');
    expect(out.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid url', async () => {
    await expect(safeDownload('not-a-url')).rejects.toThrow(/invalid url/);
  });

  it('rejects a redirect without a location header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 302, headers: new Headers() }) as unknown as Response),
    );
    await expect(safeDownload('https://github.com/x')).rejects.toThrow(/redirect without/);
  });

  it('enforces the size cap', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers(),
      arrayBuffer: async () => Buffer.alloc(2000),
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(safeDownload('https://github.com/x', 1000)).rejects.toThrow(DownloadError);
  });
});
