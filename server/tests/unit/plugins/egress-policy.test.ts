/**
 * Egress-policy helpers for the plugin network guard (#plugins, L1 hardening):
 * SSRF/private-IP blocking, declared-host allowlisting, and connect() arg
 * classification.
 */
import { describe, it, expect } from 'vitest';
import net from 'node:net';
import {
  isBlockedIp, makeHostAllow, classifyConnect, unwrapConnectArgs, dgramSendTarget, dgramConnectTarget,
} from '../../../src/nest/plugins/runtime/egress-policy';

const isIP = (s: string) => net.isIP(s) !== 0;

describe('isBlockedIp', () => {
  it.each([
    '0.0.0.0', '10.1.2.3', '127.0.0.1', '172.16.0.1', '172.31.255.255',
    '192.168.1.1', '169.254.169.254', '100.64.0.1', '224.0.0.1', '255.255.255.255',
    '::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1',
    // non-canonical IPv6 spellings must be blocked too (canonicalization)
    '0::1', '::ffff:a9fe:a9fe', '::ffff:169.254.169.254', '0:0:0:0:0:0:0:1', 'fD00::1', '::ffff:7f00:1',
    // IPv6 transition addresses (NAT64/6to4/Teredo) embedding a blocked IPv4
    '64:ff9b::a9fe:a9fe', '64:ff9b::7f00:1', '64:ff9b::a00:1', // NAT64 → metadata / loopback / 10.x
    '2002:a9fe:a9fe::', '2002:7f00:1::', // 6to4 → metadata / loopback
    '2001::5601:5601', // Teredo → 169.254.169.254
  ])('blocks %s', (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each([
    '8.8.8.8', '1.1.1.1', '140.82.121.3', '172.15.0.1', '172.32.0.1',
    '100.63.0.1', '100.128.0.1', '2606:4700::1111', '::ffff:8.8.8.8',
    // transition addresses to a public IPv4 are legitimate egress, not blocked
    '64:ff9b::808:808', '2002:808:808::',
  ])('allows public %s', (ip) => {
    expect(isBlockedIp(ip)).toBe(false);
  });
});

describe('makeHostAllow', () => {
  it('matches exact hosts and *.suffix wildcards, case-insensitively', () => {
    const allow = makeHostAllow(['api.example.com', '*.aviationstack.com']);
    expect(allow('api.example.com')).toBe(true);
    expect(allow('API.example.com')).toBe(true);
    expect(allow('v2.aviationstack.com')).toBe(true);
    expect(allow('aviationstack.com')).toBe(true); // apex matches *.suffix
    expect(allow('evil.com')).toBe(false);
    expect(allow('notapi.example.com')).toBe(false);
  });

  it('an empty egress list allows nothing', () => {
    const allow = makeHostAllow([]);
    expect(allow('anything.com')).toBe(false);
  });

  it('rejects degenerate wildcards that would be allow-all', () => {
    // `*.` matched any trailing-dot host; `*.com`/`*` are whole-TLD/allow-all.
    expect(makeHostAllow(['*.'])('evil.com')).toBe(false);
    expect(makeHostAllow(['*.'])('evil.com.')).toBe(false);
    expect(makeHostAllow(['*.com'])('evil.com')).toBe(false);
    expect(makeHostAllow(['*'])('evil.com')).toBe(false);
  });

  it('normalizes a trailing dot so an FQDN host cannot dodge an exact match', () => {
    const allow = makeHostAllow(['api.example.com']);
    expect(allow('api.example.com.')).toBe(true); // trailing-dot FQDN still matches
    // and the FQDN trick can't turn a real wildcard into allow-all
    expect(makeHostAllow(['*.example.com'])('sink.attacker.com.')).toBe(false);
  });
});

describe('classifyConnect', () => {
  it('treats a unix-socket path (options.path) as local', () => {
    expect(classifyConnect([{ path: '/tmp/x.sock' }], isIP)).toEqual({ kind: 'local', host: '/tmp/x.sock' });
  });

  it('treats a bare non-numeric string as a local IPC path', () => {
    expect(classifyConnect(['/run/app.sock'], isIP).kind).toBe('local');
  });

  it('classifies an options object with a hostname', () => {
    expect(classifyConnect([{ host: 'api.example.com', port: 443 }], isIP)).toEqual({ kind: 'hostname', host: 'api.example.com' });
  });

  it('classifies an options object with a literal IP', () => {
    expect(classifyConnect([{ host: '10.0.0.5', port: 80 }], isIP)).toEqual({ kind: 'literal-ip', host: '10.0.0.5' });
  });

  it('classifies the (port, host) form', () => {
    expect(classifyConnect([443, 'example.com'], isIP)).toEqual({ kind: 'hostname', host: 'example.com' });
    expect(classifyConnect([80, '127.0.0.1'], isIP)).toEqual({ kind: 'literal-ip', host: '127.0.0.1' });
  });

  it('defaults a port-only connect to localhost', () => {
    expect(classifyConnect([8080], isIP)).toEqual({ kind: 'hostname', host: 'localhost' });
  });
});

describe('dgramSendTarget', () => {
  const msg = Buffer.from('x');
  it('reads the address from send(msg, port, address)', () => {
    expect(dgramSendTarget([msg, 53, 'attacker.com'])).toBe('attacker.com');
  });
  it('reads the address from the send(msg, offset, length, port, address) form', () => {
    expect(dgramSendTarget([msg, 0, 1, 53, 'attacker.com'])).toBe('attacker.com');
  });
  it('is null when no explicit address is given (connected / localhost default)', () => {
    expect(dgramSendTarget([msg, 53])).toBeNull();
    expect(dgramSendTarget([msg])).toBeNull();
    expect(dgramSendTarget([msg, 0, 1, 53])).toBeNull();
  });
  it('ignores a trailing callback in the address slot', () => {
    expect(dgramSendTarget([msg, 53, () => {}])).toBeNull();
  });
});

describe('dgramConnectTarget', () => {
  it('reads the address from connect(port, address)', () => {
    expect(dgramConnectTarget([53, 'attacker.com'])).toBe('attacker.com');
  });
  it('is null for connect(port) or connect(port, cb)', () => {
    expect(dgramConnectTarget([53])).toBeNull();
    expect(dgramConnectTarget([53, () => {}])).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Node's pre-normalised connect args (the plain-HTTP egress bug)
// ─────────────────────────────────────────────────────────────────────────────
//
// net.connect() normalises its arguments into an [options, callback] array and calls
// Socket.prototype.connect with THAT ARRAY as the single argument. undici's plain-HTTP
// connector goes through this path; its TLS connector does not.
//
// Before unwrapConnectArgs, `host` read as undefined off the array and classifyConnect
// fell back to 'localhost' — so EVERY plain-HTTP request a plugin made was misclassified
// and refused with "localhost is not in the plugin's declared hosts", no matter which
// host it had declared. It only escaped notice because the sole shipped egress plugin
// uses HTTPS.

describe('unwrapConnectArgs (pre-normalised connect args)', () => {
  // Exactly what undici's plain-HTTP connector produces.
  const normalised = [[{ highWaterMark: 65536, localAddress: null, port: '18080', host: 'gotify.example.com' }, null]];

  it('unwraps the [options, cb] array Node passes as a single argument', () => {
    expect(unwrapConnectArgs(normalised)[0]).toEqual(
      expect.objectContaining({ host: 'gotify.example.com', port: '18080' }),
    );
  });

  it('leaves a conventional argument list alone', () => {
    expect(unwrapConnectArgs([{ host: 'a.example.com', port: 443 }])).toEqual([{ host: 'a.example.com', port: 443 }]);
    expect(unwrapConnectArgs([443, 'a.example.com'])).toEqual([443, 'a.example.com']);
  });

  it('classifyConnect reads the REAL host out of it, not the localhost fallback', () => {
    expect(classifyConnect(normalised, isIP)).toEqual({ kind: 'hostname', host: 'gotify.example.com' });
  });

  it('a normalised literal-IP target is still classified as an IP (so the private-IP block applies)', () => {
    expect(classifyConnect([[{ port: 80, host: '169.254.169.254' }, null]], isIP)).toEqual({
      kind: 'literal-ip',
      host: '169.254.169.254',
    });
  });

  it('a normalised unix-socket target is still classified as local', () => {
    expect(classifyConnect([[{ path: '/var/run/docker.sock' }, null]], isIP)).toEqual({
      kind: 'local',
      host: '/var/run/docker.sock',
    });
  });

  it('an undeclared host in normalised form is still refused by the allow-list', () => {
    const allow = makeHostAllow(['gotify.example.com']);
    const target = classifyConnect([[{ port: 80, host: 'evil.example.com' }, null]], isIP);
    expect(allow(target.host)).toBe(false);
  });
});
