/**
 * IPv6 helpers shared by the SSRF guard (`utils/ssrfGuard.ts`) and the plugin
 * egress policy (`nest/plugins/runtime/egress-policy.ts`).
 *
 * The headline job is detecting IPv6 *transition* addresses that embed an IPv4
 * target. A hostname that resolves to e.g. `64:ff9b::a9fe:a9fe` (NAT64 spelling
 * of 169.254.169.254) would otherwise sail past every IPv6 prefix check and,
 * on a host with a NAT64/6to4 gateway, connect straight through to the embedded
 * private IPv4 — an SSRF-guard bypass. Callers extract the embedded IPv4 and
 * re-apply their own blocklist to it.
 */

/** Expand an IPv6 literal into its 8 numeric hextets, or null if not a valid IPv6. */
export function expandIpv6(ip: string): number[] | null {
  let h = ip.toLowerCase().replace(/%.*$/, '');
  if (!h.includes(':')) return null;
  const dotted = h.match(/^(.*:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) {
    const v4 = dotted[2].split('.').map(Number);
    if (v4.some((n) => n > 255)) return null;
    h = dotted[1] + ((v4[0] << 8) | v4[1]).toString(16) + ':' + ((v4[2] << 8) | v4[3]).toString(16);
  }
  const halves = h.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const groups =
    halves.length === 2 ? [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail] : head;
  if (groups.length !== 8) return null;
  const nums = groups.map((x) => (x === '' ? NaN : parseInt(x, 16)));
  return nums.some((n) => !Number.isInteger(n) || n < 0 || n > 0xffff) ? null : nums;
}

/**
 * If `ip` is an IPv6 transition address that embeds an IPv4 target, return the
 * embedded IPv4 in dotted form; otherwise null. Recognised ranges:
 *
 *   - NAT64 well-known prefix `64:ff9b::/96` — last 32 bits are the IPv4
 *   - 6to4 `2002::/16` — hextets 1–2 are the IPv4
 *   - Teredo `2001:0000::/32` — last 32 bits are the client IPv4, XOR 0xffffffff
 *
 * Only the *well-known* NAT64 prefix is detected; custom-prefix NAT64 (RFC 6052
 * /32–/64, RFC 8215 `64:ff9b:1::/48`) can't be recognised without site config.
 */
export function embeddedTransitionIpv4(ip: string): string | null {
  const g = expandIpv6(ip.replace(/^\[/, '').replace(/\]$/, ''));
  if (!g) return null;
  const v4 = (hi: number, lo: number) => `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;
  // NAT64 well-known 64:ff9b::/96 — first 96 bits fixed, last 32 = IPv4.
  if (g[0] === 0x0064 && g[1] === 0xff9b && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0) {
    return v4(g[6], g[7]);
  }
  // 6to4 2002::/16 — hextets 1,2 = IPv4.
  if (g[0] === 0x2002) return v4(g[1], g[2]);
  // Teredo 2001:0000::/32 — last 32 bits = client IPv4 XOR 0xffffffff.
  if (g[0] === 0x2001 && g[1] === 0x0000) return v4(g[6] ^ 0xffff, g[7] ^ 0xffff);
  return null;
}
