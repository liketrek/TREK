import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import net from 'node:net';
import type { AddressInfo } from 'node:net';

// Only the resolver is stubbed. undici and net are the real thing, because the
// point of these cases is what the socket does with the list it is handed.
vi.mock('dns/promises', () => ({
  default: { lookup: vi.fn() },
  lookup: vi.fn(),
}));

import dns from 'dns/promises';
import { safeFetchAdminConfigured } from '../../../src/utils/ssrfGuard';

const mockLookup = vi.mocked(dns.lookup);

// RFC 6666 discard prefix and TEST-NET-1: routed nowhere on any sane machine,
// so a connect attempt either fails at once or sits until the family timeout.
const DEAD_V6 = '100::1';
const DEAD_V4 = '192.0.2.1';

let v4: http.Server;
let v4Port: number;
let v6: http.Server | null = null;
let v6Port = 0;

const listen = (server: http.Server, host: string) =>
  new Promise<number>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, host, () => resolve((server.address() as AddressInfo).port));
  });

beforeAll(async () => {
  v4 = http.createServer((_req, res) => res.end('v4'));
  v4Port = await listen(v4, '127.0.0.1');
  const six = http.createServer((_req, res) => res.end('v6'));
  try {
    v6Port = await listen(six, '::1');
    v6 = six;
  } catch {
    six.close();
  }
});

afterAll(async () => {
  await new Promise((r) => v4.close(r));
  if (v6) await new Promise((r) => v6!.close(r));
});

afterEach(() => {
  mockLookup.mockReset();
});

describe('a dual-stack name where one family does not answer', () => {
  it('SEC-DUAL-101: the AAAA first in the answer no longer pins the connection to an unreachable IPv6', async () => {
    mockLookup.mockResolvedValue([
      { address: DEAD_V6, family: 6 },
      { address: '127.0.0.1', family: 4 },
    ] as never);

    const started = Date.now();
    const res = await safeFetchAdminConfigured(`http://idp.example:${v4Port}/`, { signal: AbortSignal.timeout(8000) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('v4');
    // Well inside what a single dead attempt would have cost.
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it('SEC-DUAL-102: a dead IPv4 ahead of a live IPv6 still connects, the socket moves on by itself', async (ctx) => {
    if (!v6) return ctx.skip();
    mockLookup.mockResolvedValue([
      { address: DEAD_V4, family: 4 },
      { address: '::1', family: 6 },
    ] as never);

    const started = Date.now();
    const res = await safeFetchAdminConfigured(`http://idp.example:${v6Port}/`, { signal: AbortSignal.timeout(8000) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('v6');
    // One attempt timeout (250 ms by default) plus the real connect.
    expect(Date.now() - started).toBeLessThan(net.getDefaultAutoSelectFamilyAttemptTimeout() * 8 + 1000);
  });

  it('SEC-DUAL-103: the socket never gets an address the guard did not check', async () => {
    // The resolver answers the checked list once; if the socket re-resolved the
    // name it would be handed this second, unchecked answer and connect there.
    mockLookup
      .mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }] as never)
      .mockResolvedValue([{ address: DEAD_V4, family: 4 }] as never);

    const res = await safeFetchAdminConfigured(`http://idp.example:${v4Port}/`, { signal: AbortSignal.timeout(8000) });

    expect(res.status).toBe(200);
    expect(mockLookup).toHaveBeenCalledTimes(1);
  });
});
