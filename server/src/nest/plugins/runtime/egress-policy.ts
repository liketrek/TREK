/**
 * Pure egress-policy helpers for the plugin child's network guard (#plugins, L1
 * hardening). Kept dependency-free so the isolated child can import them without
 * pulling in any privileged server module, and so they are unit-testable on
 * their own (the guard that uses them lives in plugin-host-entry, which is
 * excluded from coverage as a subprocess entry).
 */

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
  }
  return false;
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
 * call, or null when no explicit address is given (Node then uses the socket's
 * connected remote or the localhost default — the connect() wrapper already
 * vetted that, and a localhost default is not an exfil vector). Only an explicit
 * address string is a target we must allowlist. Mirrors both send() overloads:
 * the (offset, length) form pushes port/address two slots right.
 */
export function dgramSendTarget(args: unknown[]): string | null {
  const offsetForm = typeof args[1] === 'number' && typeof args[2] === 'number';
  const address = args[offsetForm ? 4 : 2];
  return typeof address === 'string' ? address : null;
}

/**
 * Destination host of a `dgram.Socket.connect(port[, address][, cb])` call, or
 * null when no address is given (localhost default — not an exfil vector).
 */
export function dgramConnectTarget(args: unknown[]): string | null {
  return typeof args[1] === 'string' ? (args[1] as string) : null;
}

/**
 * Node's `net.connect()` pre-normalises its arguments into an `[options, callback]`
 * array and then calls `Socket.prototype.connect` with THAT ARRAY as the single
 * argument. undici's plain-HTTP connector takes this path; its TLS connector does
 * not — which is why HTTPS egress worked and plain HTTP silently did not.
 *
 * Unwrap it before anything reads `host`/`path`, or those come back undefined off an
 * array, every plain-HTTP request a plugin makes is misclassified as `localhost`, and
 * it is rejected with a nonsense "localhost is not in the plugin's declared hosts".
 */
export function unwrapConnectArgs(args: unknown[]): unknown[] {
  return Array.isArray(args[0]) ? (args[0] as unknown[]) : args;
}

/**
 * Classify a `net.Socket.connect(...)` argument list into what we must check:
 * a unix-socket/pipe (local, allowed), a literal IP (checked synchronously), or
 * a hostname (allowlist + a DNS-resolving guard). Mirrors Node's connect
 * overloads: connect(options[,cb]) | connect(port[,host][,cb]) | connect(path[,cb]),
 * plus the pre-normalised array form above.
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
