import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import type { AddressInfo } from 'node:net';

// Only the resolver is stubbed. undici and net are the real thing, because the
// point of these cases is what the socket does with the list it is handed.
vi.mock('dns/promises', () => ({
  default: { lookup: vi.fn() },
  lookup: vi.fn(),
}));

import dns from 'dns/promises';
import { safeFetchAdminConfigured, SsrfBlockedError } from '../../../src/utils/ssrfGuard';

const mockLookup = vi.mocked(dns.lookup);

// Every address a socket dials, read off the socket itself rather than the
// resolver: Node emits `connectionAttempt` once for each address it tries.
const attempted: string[] = [];
const realConnect = net.Socket.prototype.connect;
function trackAttempts(this: net.Socket, ...args: unknown[]) {
  this.on('connectionAttempt', (ip: string) => attempted.push(ip));
  return (realConnect as (...a: unknown[]) => net.Socket).apply(this, args);
}

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
  net.Socket.prototype.connect = trackAttempts as typeof realConnect;
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
  net.Socket.prototype.connect = realConnect;
  await new Promise((r) => v4.close(r));
  if (v6) await new Promise((r) => v6!.close(r));
});

afterEach(() => {
  mockLookup.mockReset();
  attempted.length = 0;
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

describe('a name with link-local records next to a reachable address (#2506)', () => {
  it('SEC-DUAL-104: an fe80:: record beside the IdP address no longer refuses the name', async () => {
    // Loopback stands in for the LAN address, being the one address reachable
    // here; the admin lane treats the two alike.
    mockLookup.mockResolvedValue([
      { address: 'fe80::1', family: 6 },
      { address: '127.0.0.1', family: 4 },
    ] as never);

    const res = await safeFetchAdminConfigured(`http://idp.example:${v4Port}/`, { signal: AbortSignal.timeout(8000) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('v4');
    expect(attempted).toEqual(['127.0.0.1']);
  });

  it('SEC-DUAL-105: the socket never dials a link-local or metadata address, not even one listed first', async () => {
    mockLookup.mockResolvedValue([
      { address: '169.254.169.254', family: 4 },
      { address: 'fe80::1', family: 6 },
      { address: '::ffff:169.254.169.254', family: 6 },
      { address: '::169.254.169.254', family: 6 },
      { address: 'fd00:ec2::254', family: 6 },
      { address: '127.0.0.1', family: 4 },
    ] as never);

    const res = await safeFetchAdminConfigured(`http://idp.example:${v4Port}/`, { signal: AbortSignal.timeout(8000) });

    expect(res.status).toBe(200);
    expect(attempted).toEqual(['127.0.0.1']);
  });

  it('SEC-DUAL-106: with nothing else to offer the name is refused and no socket is opened', async () => {
    mockLookup.mockResolvedValue([
      { address: 'fe80::1', family: 6 },
      { address: '169.254.169.254', family: 4 },
    ] as never);

    await expect(
      safeFetchAdminConfigured(`http://idp.example:${v4Port}/`, { signal: AbortSignal.timeout(8000) }),
    ).rejects.toThrow(SsrfBlockedError);
    expect(attempted).toEqual([]);
  });
});

describe('the strict guard, ALLOW_INTERNAL_NETWORK on, with metadata records in the answer (#2506)', () => {
  // The strict guard refuses loopback, so the reachable address here is one of
  // this machine's own interface addresses, with a server listening on it.
  const lanIp = Object.values(os.networkInterfaces())
    .flat()
    .find((nic) => nic && nic.family === 'IPv4' && !nic.internal && !nic.address.startsWith('169.254.'))?.address;
  let lan: http.Server | null = null;
  let lanPort = 0;

  beforeAll(async () => {
    if (!lanIp) return;
    const server = http.createServer((_req, res) => res.end('lan'));
    try {
      lanPort = await listen(server, lanIp);
      lan = server;
    } catch {
      server.close();
    }
  });

  afterAll(async () => {
    if (lan) await new Promise((r) => lan!.close(r));
  });

  afterEach(() => vi.unstubAllEnvs());

  // The flag is read when the guard loads, so each case loads a fresh copy.
  async function strictGuard() {
    vi.stubEnv('ALLOW_INTERNAL_NETWORK', 'true');
    vi.resetModules();
    const guard = await import('../../../src/utils/ssrfGuard');
    const lookup = vi.mocked((await import('dns/promises')).default.lookup);
    return { guard, lookup };
  }

  it('SEC-DUAL-107: a metadata record next to an fe80:: one is refused and no socket is opened', async () => {
    for (const answer of [
      [{ address: 'fe80::1', family: 6 }, { address: 'fd00:ec2::254', family: 6 }],
      [{ address: 'fe80::1', family: 6 }, { address: '100.100.100.200', family: 4 }],
      [{ address: '::169.254.169.254', family: 6 }],
    ]) {
      const { guard, lookup } = await strictGuard();
      lookup.mockResolvedValue(answer as never);

      await expect(
        guard.safeFetch(`http://photos.example:${v4Port}/`, { signal: AbortSignal.timeout(3000) }),
      ).rejects.toThrow(guard.SsrfBlockedError);
    }
    expect(attempted).toEqual([]);
  });

  it('SEC-DUAL-108: the socket dials the LAN address and never the metadata ones listed ahead of it', async (ctx) => {
    if (!lan || !lanIp) return ctx.skip();
    const { guard, lookup } = await strictGuard();
    lookup.mockResolvedValue([
      { address: 'fd00:ec2::254', family: 6 },
      { address: '100.100.100.200', family: 4 },
      { address: '100.100.100.100', family: 4 },
      { address: '::169.254.169.254', family: 6 },
      { address: 'fe80::1', family: 6 },
      { address: lanIp, family: 4 },
    ] as never);

    const res = await guard.safeFetch(`http://nas.example:${lanPort}/`, { signal: AbortSignal.timeout(8000) });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('lan');
    expect(attempted).toEqual([lanIp]);
  });
});
