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
  const h = ip.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  if (h === '::' || h === '::1' || h === '0:0:0:0:0:0:0:0' || h === '0:0:0:0:0:0:0:1') return true;
  if (h.startsWith('fe80') || h.startsWith('fc') || h.startsWith('fd')) return true; // link-local + ULA
  const mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIp(mapped[1]);
  return false;
}

/** Build a declared-egress host matcher (exact host or `*.suffix` wildcard). */
export function makeHostAllow(egress: string[]): (host: string) => boolean {
  const patterns = egress.map((h) => h.trim().toLowerCase()).filter(Boolean);
  return (host: string) => {
    const h = host.toLowerCase();
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
 * Classify a `net.Socket.connect(...)` argument list into what we must check:
 * a unix-socket/pipe (local, allowed), a literal IP (checked synchronously), or
 * a hostname (allowlist + a DNS-resolving guard). Mirrors Node's connect
 * overloads: connect(options[,cb]) | connect(port[,host][,cb]) | connect(path[,cb]).
 */
export function classifyConnect(args: unknown[], isIP: (s: string) => boolean): ConnectTarget {
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
