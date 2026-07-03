import { createHash } from 'node:crypto';
import dns from 'node:dns/promises';

/**
 * SSRF-hardened download for the plugin installer (#plugins, M4). The primary
 * control is a host allowlist (only GitHub delivery hosts); as defense in depth
 * we resolve each hop and refuse private/loopback/link-local IPs, and we follow
 * redirects manually so a 3xx to an internal address can't slip through. Returns
 * the bytes + their sha256; the caller verifies the hash against the registry
 * pin before anything is written to a plugin location.
 */

const ALLOWED_HOSTS = new Set(['github.com', 'codeload.github.com', 'objects.githubusercontent.com']);
const MAX_REDIRECTS = 5;
const MAX_BYTES = 50 * 1024 * 1024;

export class DownloadError extends Error {}

export function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('::ffff:127.');
}

async function assertSafeHost(urlStr: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    throw new DownloadError(`invalid url: ${urlStr}`);
  }
  if (url.protocol !== 'https:') throw new DownloadError('only https downloads are allowed');
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new DownloadError(`host not allowlisted: ${url.hostname}`);
  const addrs = await dns.lookup(url.hostname, { all: true }).catch(() => []);
  if (addrs.length === 0) throw new DownloadError(`could not resolve ${url.hostname}`);
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new DownloadError(`refusing private address for ${url.hostname}`);
  }
}

export async function safeDownload(urlStr: string, maxBytes = MAX_BYTES): Promise<{ bytes: Buffer; sha256: string }> {
  let current = urlStr;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeHost(current);
    const resp = await fetch(current, { redirect: 'manual', headers: { 'User-Agent': 'TREK-Server' } });
    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers.get('location');
      if (!loc) throw new DownloadError('redirect without a location');
      current = new URL(loc, current).toString();
      continue;
    }
    if (!resp.ok) throw new DownloadError(`download failed: ${resp.status}`);
    const declared = Number(resp.headers.get('content-length') || 0);
    if (declared && declared > maxBytes) throw new DownloadError('artifact exceeds size limit');
    const bytes = Buffer.from(await resp.arrayBuffer());
    if (bytes.length > maxBytes) throw new DownloadError('artifact exceeds size limit');
    return { bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
  }
  throw new DownloadError('too many redirects');
}

/** Constant-time compare of two hex digests. */
export function sha256Matches(actual: string, expected: string): boolean {
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
