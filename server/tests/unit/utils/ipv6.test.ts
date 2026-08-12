import { describe, it, expect } from 'vitest';
import { expandIpv6, embeddedTransitionIpv4 } from '../../../src/utils/ipv6';

describe('expandIpv6', () => {
  it.each([
    ['::1', [0, 0, 0, 0, 0, 0, 0, 1]],
    ['2606:4700::1111', [0x2606, 0x4700, 0, 0, 0, 0, 0, 0x1111]],
    ['fe80::1', [0xfe80, 0, 0, 0, 0, 0, 0, 1]],
    // Dotted-quad tail (IPv4-mapped) is normalised into hextets.
    ['::ffff:169.254.169.254', [0, 0, 0, 0, 0, 0xffff, 0xa9fe, 0xa9fe]],
    ['64:ff9b::a9fe:a9fe', [0x0064, 0xff9b, 0, 0, 0, 0, 0xa9fe, 0xa9fe]],
  ])('expands %s', (ip, expected) => {
    expect(expandIpv6(ip)).toEqual(expected);
  });

  it.each(['8.8.8.8', 'not-an-ip', '', '::ffff:999.1.1.1', '1::2::3'])(
    'returns null for non-IPv6 / invalid %s',
    (ip) => {
      expect(expandIpv6(ip)).toBeNull();
    },
  );
});

describe('embeddedTransitionIpv4', () => {
  it.each([
    // NAT64 well-known 64:ff9b::/96
    ['64:ff9b::a9fe:a9fe', '169.254.169.254'],
    ['64:ff9b::7f00:1', '127.0.0.1'],
    ['64:ff9b::a00:1', '10.0.0.1'],
    ['64:ff9b::808:808', '8.8.8.8'],
    ['[64:ff9b::a9fe:a9fe]', '169.254.169.254'], // bracketed literal
    // 6to4 2002::/16
    ['2002:7f00:1::', '127.0.0.1'],
    ['2002:a9fe:a9fe::', '169.254.169.254'],
    ['2002:808:808::', '8.8.8.8'],
    // Teredo 2001:0000::/32 — client IPv4 is XOR 0xffffffff of the last 32 bits.
    ['2001::5601:5601', '169.254.169.254'],
  ])('extracts %s -> %s', (ip, embedded) => {
    expect(embeddedTransitionIpv4(ip)).toBe(embedded);
  });

  it.each([
    '8.8.8.8', // plain IPv4 — no colon
    '169.254.169.254',
    '::ffff:169.254.169.254', // IPv4-mapped, handled by other checks not this one
    '::a9fe:a9fe', // IPv4-compatible
    '2606:4700::1111', // ordinary public IPv6
    'fe80::1', // link-local, not a transition prefix
    '64:ff9b:1::a9fe:a9fe', // NAT64 local-use /48 prefix — deliberately NOT matched
    'garbage',
  ])('returns null for non-transition %s', (ip) => {
    expect(embeddedTransitionIpv4(ip)).toBeNull();
  });
});
