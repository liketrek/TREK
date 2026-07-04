import { createHash } from 'node:crypto';
import dns from 'node:dns/promises';
import { isBlockedIp } from '../runtime/egress-policy';

/**
 * SSRF-hardened download for the plugin installer (#plugins, M4). The primary
 * control is a host allowlist (only GitHub delivery hosts); as defense in depth
 * we resolve each hop and refuse private/loopback/link-local IPs, and we follow
 * redirects manually so a 3xx to an internal address can't slip through. Returns
 * the bytes + their sha256; the caller verifies the hash against the registry
 * pin before anything is written to a plugin location.
 */

const MAX_REDIRECTS = 5;
const MAX_BYTES = 50 * 1024 * 1024;

export class DownloadError extends Error {}

/**
 * GitHub delivery hosts only. Release-asset downloads 302 through a rotating
 * `*.githubusercontent.com` host (objects / github-releases / release-assets …),
 * so we allow that whole suffix plus github.com and codeload. The private-IP
 * check below is the SSRF backstop regardless of host.
 */
function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'github.com' || h === 'codeload.github.com' || h.endsWith('.githubusercontent.com');
}

export function isPrivateIp(ip: string): boolean {
  // Reuse the egress guard's canonicalizing check so non-canonical IPv6 forms
  // (hex IPv4-mapped, compressed) and CGNAT/multicast are all covered here too.
  return isBlockedIp(ip);
}

async function assertSafeHost(urlStr: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    throw new DownloadError(`invalid url: ${urlStr}`);
  }
  if (url.protocol !== 'https:') throw new DownloadError('only https downloads are allowed');
  if (!isAllowedHost(url.hostname)) throw new DownloadError(`host not allowlisted: ${url.hostname}`);
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
    // Stream the body and abort the moment it crosses the cap — a chunked response
    // (e.g. codeload archives) carries no content-length, so buffering the whole
    // body first (arrayBuffer) could OOM the server before any post-check fires.
    const bytes = await readCapped(resp, maxBytes);
    return { bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
  }
  throw new DownloadError('too many redirects');
}

/** Read a response body into a Buffer, throwing once it exceeds maxBytes. */
async function readCapped(resp: Response, maxBytes: number): Promise<Buffer> {
  const reader = resp.body?.getReader();
  if (!reader) {
    const b = Buffer.from(await resp.arrayBuffer());
    if (b.length > maxBytes) throw new DownloadError('artifact exceeds size limit');
    return b;
  }
  const chunks: Buffer[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    if (received > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new DownloadError('artifact exceeds size limit');
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

/** Constant-time compare of two hex digests. */
export function sha256Matches(actual: string, expected: string): boolean {
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
