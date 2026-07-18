/**
 * The plugin network guard, mirrored from the host so `dev` blocks exactly what a
 * real TREK blocks.
 *
 * In production the plugin child wraps fetch/net/dns/dgram and allows ONLY the hosts
 * granted as `http:outbound:<host>` permissions — with no such grant, all outbound is
 * blocked. The dev server had no guard at all, so a plugin calling an undeclared host
 * worked perfectly in dev and was refused the moment it was installed. This closes
 * that gap.
 *
 * The pure helpers below (isBlockedIp, makeHostAllow, classifyConnect, …) are copied
 * VERBATIM from the server's runtime/egress-policy.ts — trek-plugin-sdk ships
 * standalone and cannot import across the package boundary. test/egress-parity.test.ts
 * fails if the two drift.
 *
 * What is deliberately NOT mirrored: the host also locks its wrappers
 * non-configurable and disables process.binding, to contain a HOSTILE plugin in a
 * dedicated child. Dev runs YOUR code in the CLI's own process, where a plugin
 * escaping the guard is not a threat anyone needs defending from — and locking the
 * globals would make the guard un-restorable for tests. Dev's job here is fidelity,
 * not containment.
 */
import net from 'node:net';
import dns from 'node:dns';
import dgram from 'node:dgram';

// ---------------------------------------------------------------------------
// Pure policy helpers — kept byte-identical to the server's egress-policy.ts.
// ---------------------------------------------------------------------------

/**
 * Block outbound connections to loopback / private / link-local / ULA / carrier-
 * grade-NAT / cloud-metadata / multicast / reserved destinations. This is the
 * SSRF backstop: even a declared host that (re)resolves to one of these is
 * refused, so a plugin can't pivot to trek.db's host, the 169.254.169.254
 * metadata IP, the local docker network, or other internal services.
 */
export function isBlockedIp(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) || // link-local, incl. 169.254.169.254 metadata
      (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
      a >= 224 // multicast + reserved
    );
  }
  // IPv6: expand to 8 hextets so EVERY spelling is checked (compressed `::`,
  // hex IPv4-mapped `::ffff:a9fe:a9fe`, dotted `::ffff:169.254.169.254`, `0::1`).
  const g = expandV6(ip.replace(/^\[/, '').replace(/\]$/, ''));
  if (g) {
    if (g.every((x) => x === 0)) return true; // ::  (unspecified)
    // IPv4-mapped (::ffff:x) and IPv4-compatible (::x) → check the embedded IPv4.
    if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) {
      return isBlockedIp(`${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`);
    }
    if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 ULA
    // IPv6 transition addresses (NAT64/6to4/Teredo) embedding an IPv4 → re-check
    // the embedded target, so a NAT64 spelling of 169.254.169.254 can't tunnel past.
    const embedded = embeddedTransitionIpv4(g);
    if (embedded) return isBlockedIp(embedded);
  }
  return false;
}

/**
 * If the expanded hextets `g` are an IPv6 transition address that embeds an IPv4
 * target, return that IPv4 in dotted form; otherwise null. Recognises the NAT64
 * well-known prefix `64:ff9b::/96`, 6to4 `2002::/16`, and Teredo `2001:0000::/32`.
 * Kept local so this module stays dependency-free for the isolated plugin child.
 */
function embeddedTransitionIpv4(g: number[]): string | null {
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

/** Expand an IPv6 literal into its 8 numeric hextets, or null if not a valid IPv6. */
function expandV6(ip: string): number[] | null {
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

/** Build a declared-egress host matcher (exact host or `*.suffix` wildcard). */
export function makeHostAllow(egress: string[]): (host: string) => boolean {
  const patterns = egress
    .map((h) => h.trim().toLowerCase().replace(/\.$/, '')) // drop a trailing dot (FQDN trick)
    .filter((p) => p && p !== '*')
    // A wildcard must have a real multi-label suffix — reject the degenerate
    // `*.` (matched any trailing-dot host = allow-all) and whole-TLD `*.com`.
    .filter((p) => !p.startsWith('*.') || p.slice(2).includes('.'));
  return (host: string) => {
    const h = host.toLowerCase().replace(/\.$/, '');
    return patterns.some((p) => (p.startsWith('*.') ? h === p.slice(2) || h.endsWith(p.slice(1)) : h === p));
  };
}

export interface ConnectTarget {
  kind: 'local' | 'literal-ip' | 'hostname';
  host: string;
}

/**
 * Destination host of a `dgram.Socket.send(msg[, offset, length], port[, address][, cb])`
 * call, or null when no explicit address is given.
 */
export function dgramSendTarget(args: unknown[]): string | null {
  const offsetForm = typeof args[1] === 'number' && typeof args[2] === 'number';
  const address = args[offsetForm ? 4 : 2];
  return typeof address === 'string' ? address : null;
}

/** Destination host of a `dgram.Socket.connect(port[, address][, cb])` call, or null. */
export function dgramConnectTarget(args: unknown[]): string | null {
  return typeof args[1] === 'string' ? (args[1] as string) : null;
}

/**
 * Node's `net.connect()` pre-normalises its arguments into an `[options, callback]`
 * array and then calls `Socket.prototype.connect` with THAT ARRAY as the single
 * argument. undici's plain-HTTP connector takes this path; its TLS connector does
 * not — which is why HTTPS egress worked and plain HTTP silently did not.
 */
export function unwrapConnectArgs(args: unknown[]): unknown[] {
  return Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
}

/**
 * Classify a `net.Socket.connect(...)` argument list into what we must check:
 * a unix-socket/pipe (local), a literal IP (checked synchronously), or a hostname
 * (allowlist + a DNS-resolving guard).
 */
export function classifyConnect(rawArgs: unknown[], isIP: (s: string) => boolean): ConnectTarget {
  const args = unwrapConnectArgs(rawArgs);
  const first = args[0];
  if (first && typeof first === 'object') {
    const o = first as { host?: string; path?: string };
    if (o.path) return { kind: 'local', host: o.path };
    const host = o.host ?? 'localhost';
    return { kind: isIP(host) ? 'literal-ip' : 'hostname', host };
  }
  if (typeof first === 'string' && !/^\d+$/.test(first)) {
    // a bare string that isn't a port number is an IPC path
    return { kind: 'local', host: first };
  }
  // connect(port[, host][, cb])
  const host = typeof args[1] === 'string' ? (args[1] as string) : 'localhost';
  return { kind: isIP(host) ? 'literal-ip' : 'hostname', host };
}

// ---------------------------------------------------------------------------
// The dev-server guard.
// ---------------------------------------------------------------------------

/** Undo an installEgressGuard(), restoring the real fetch/net/dns/dgram. */
export type RestoreEgress = () => void;

const DNS_METHODS = [
  'lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'resolveCaa', 'resolveCname',
  'resolveMx', 'resolveNaptr', 'resolveNs', 'resolvePtr', 'resolveSoa', 'resolveSrv', 'resolveTxt',
];

/**
 * Restrict outbound network to `hosts` — the plugin's `http:outbound:<host>` grants.
 * With no hosts, ALL outbound is blocked, exactly as in production. `*.example.com`
 * wildcards match any subdomain.
 *
 * Safe to install process-wide here: the dev server itself makes no Node-side
 * outbound call (its only fetch() calls live in browser-side template strings) and
 * the mock host is pure fixtures — so the only caller that can trip this guard is
 * the plugin, which is the point.
 *
 * `TREK_PLUGIN_ALLOW_PRIVATE_EGRESS=on` permits private/loopback targets — the SAME
 * variable production honours, so a plugin developed against a self-hosted sibling
 * service uses one lever in both places.
 */
export function installEgressGuard(hosts: string[]): RestoreEgress {
  const allowed = makeHostAllow(hosts);
  const blockPrivate = (process.env.TREK_PLUGIN_ALLOW_PRIVATE_EGRESS ?? '').toLowerCase() !== 'on';

  // Name the fix in the error. Production can only say "not declared"; dev knows the
  // author is looking at the manifest right now, so it says what to add.
  const refuse = (host: string): Error =>
    new Error(
      `egress: ${host} is not in the plugin's declared hosts — ` +
        `add "http:outbound:${host}" to permissions (and "${host}" to egress) in trek-plugin.json`,
    );

  const restores: RestoreEgress[] = [];

  const realFetch = globalThis.fetch;
  if (typeof realFetch === 'function') {
    globalThis.fetch = ((input: unknown, init?: unknown) => {
      const url = typeof input === 'string' ? input : (input as { url?: string })?.url ?? String(input);
      let host: string;
      try {
        host = new URL(url).hostname.replace(/^\[/, '').replace(/\]$/, '');
      } catch {
        return Promise.reject(new Error('egress: invalid url'));
      }
      if (!allowed(host)) return Promise.reject(refuse(host));
      return (realFetch as (i: unknown, n: unknown) => Promise<unknown>)(input, init);
    }) as typeof fetch;
    restores.push(() => { globalThis.fetch = realFetch; });
  }

  // Capture the real resolver before the dns module is gated below, so the connect
  // guard keeps resolving even though direct dns.* calls are refused.
  const realLookup = dns.lookup.bind(dns);

  // Resolve, then refuse a name that lands on a blocked address — the DNS-rebinding
  // backstop, so a declared host can't point at localhost.
  const guardedLookup = (
    hostname: string,
    options: unknown,
    cb: (err: Error | null, address?: unknown, family?: number) => void,
  ): void => {
    const opts = typeof options === 'function' ? {} : options;
    if (typeof options === 'function') cb = options as typeof cb;
    realLookup(hostname, opts as dns.LookupOptions, (err, address, family) => {
      if (err) return cb(err, address as unknown, family);
      const list = Array.isArray(address) ? address : [{ address: address as string }];
      for (const a of list) {
        if (blockPrivate && isBlockedIp((a as { address: string }).address)) {
          return cb(new Error(`egress: ${hostname} resolves to a blocked address (${(a as { address: string }).address})`));
        }
      }
      cb(null, address as unknown, family);
    });
  };

  const proto = net.Socket.prototype as unknown as { connect: (...a: unknown[]) => unknown };
  const realConnect = proto.connect;
  proto.connect = function (this: unknown, ...rawArgs: unknown[]): unknown {
    const args = unwrapConnectArgs(rawArgs);
    const target = classifyConnect(args, (s) => net.isIP(s) !== 0);
    if (target.kind === 'local') {
      if (blockPrivate) throw new Error(`egress: connecting to a local socket/pipe (${target.host}) is not allowed`);
      return realConnect.apply(this, rawArgs);
    }
    if (!allowed(target.host)) throw refuse(target.host);
    if (target.kind === 'literal-ip') {
      if (blockPrivate && isBlockedIp(target.host)) throw new Error(`egress: ${target.host} is a blocked address`);
      return realConnect.apply(this, rawArgs);
    }
    // Hostname: inject the resolving guard, preserving any existing options.
    const first = args[0];
    const options = first && typeof first === 'object' ? { ...(first as object) } : { host: target.host, port: args[0] };
    (options as { lookup?: unknown }).lookup = guardedLookup;
    const rest = first && typeof first === 'object' ? args.slice(1) : args.slice(typeof args[1] === 'string' ? 2 : 1);
    return realConnect.call(this, options, ...rest);
  };
  restores.push(() => { proto.connect = realConnect; });

  // UDP: a TCP-only guard would leave a plugin's syslog/statsd channel wide open in
  // dev and blocked in prod — the exact asymmetry this exists to kill.
  const guardDatagram = (host: string | null): void => {
    if (host === null) return;
    if (!allowed(host)) throw refuse(host);
    if (blockPrivate && net.isIP(host) !== 0 && isBlockedIp(host)) {
      throw new Error(`egress: ${host} is a blocked address`);
    }
  };
  const dgramProto = dgram.Socket.prototype as unknown as {
    send: (...a: unknown[]) => unknown;
    connect: (...a: unknown[]) => unknown;
  };
  const realSend = dgramProto.send;
  dgramProto.send = function (this: unknown, ...args: unknown[]): unknown {
    guardDatagram(dgramSendTarget(args));
    return realSend.apply(this, args);
  };
  const realDgramConnect = dgramProto.connect;
  dgramProto.connect = function (this: unknown, ...args: unknown[]): unknown {
    guardDatagram(dgramConnectTarget(args));
    return realDgramConnect.apply(this, args);
  };
  restores.push(() => { dgramProto.send = realSend; dgramProto.connect = realDgramConnect; });

  // Gate the resolver family: a forward lookup for an undeclared NAME is a DNS-tunnel
  // exfiltration channel even when no socket is ever opened.
  //
  // A literal IP is exempt — it carries no name to tunnel data in, and reaching it is
  // still barred by the connect guard + isBlockedIp. This is not just pedantry: Node
  // resolves the bind address through dns.lookup when a server listens on a host, so
  // gating literal IPs makes the dev server unable to bind its own 127.0.0.1 listener.
  // (The host's child never calls listen(), which is why it can gate them.)
  const gateDnsMethods = (obj: Record<string, unknown> | undefined): void => {
    if (!obj) return;
    for (const name of DNS_METHODS) {
      const real = obj[name];
      if (typeof real !== 'function') continue;
      obj[name] = function (this: unknown, hostname: unknown, ...rest: unknown[]): unknown {
        if (typeof hostname === 'string' && net.isIP(hostname) === 0 && !allowed(hostname)) {
          const err = new Error(`egress: DNS lookup for ${hostname} is not in the plugin's declared hosts`);
          const cb = rest.find((a) => typeof a === 'function') as ((e: Error) => void) | undefined;
          if (cb) return cb(err);
          return Promise.reject(err);
        }
        return (real as (...a: unknown[]) => unknown).call(this, hostname, ...rest);
      };
      restores.push(() => { obj[name] = real; });
    }
  };
  gateDnsMethods(dns as unknown as Record<string, unknown>);
  gateDnsMethods(dns.promises as unknown as Record<string, unknown>);
  gateDnsMethods((dns as unknown as { Resolver?: { prototype: Record<string, unknown> } }).Resolver?.prototype);
  gateDnsMethods((dns.promises as unknown as { Resolver?: { prototype: Record<string, unknown> } })?.Resolver?.prototype);

  return () => { for (const r of restores.reverse()) r(); };
}
