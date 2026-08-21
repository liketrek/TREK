import type { ObjectStat } from './storage.types';

/**
 * The pure decision half of the proxied byte-path (storage.service.ts's
 * `sendStreamed`). Local backends get conditional-GET/Range/HEAD for free from
 * express's `res.sendFile` (send); a remote backend has no such machinery, so
 * this module reproduces the same contract from an `ObjectStat` plus the
 * request headers — no fs, no driver, no Response. Everything here is a pure
 * function so the state machine (304 before 416, weak-vs-strong comparison,
 * suffix ranges, the degraded no-validator case) is provable in isolation.
 *
 * Deliberately out of scope: If-Match / If-Unmodified-Since (and therefore
 * 412). No TREK caller sends a precondition on a GET, and answering one
 * half-heartedly is worse than not advertising it.
 */

/** Request headers as node/express hands them over (repeats arrive as arrays). */
export type ServingHeaders = Record<string, string | string[] | undefined>;

/** Cache validators for one object; either half may be absent (see validatorsFor). */
export interface Validators {
  etag?: string;
  /** HTTP-date. Present only when the backend knows a real mtime. */
  lastModified?: string;
}

export type RangeDecision =
  | { kind: 'full' }
  | { kind: 'partial'; start: number; end: number }
  | { kind: 'unsatisfiable' };

/**
 * ETag: the driver's own (S3 returns one on every HEAD/GET), else the same
 * weak `W/"<size hex>-<mtime hex>"` express's send derives, so a local→remote
 * migration doesn't invalidate every cached object.
 *
 * `mtimeMs === 0` is the degraded case, not a 1970 timestamp: S3-compatible
 * backends can answer without a LastModified, and emitting
 * `Thu, 01 Jan 1970 00:00:00 GMT` would let a client "revalidate" against a
 * date that is fresh forever. No mtime means no Last-Modified and no derived
 * ETag — serving without validators is correct, just uncached.
 */
export function validatorsFor(stat: ObjectStat): Validators {
  const validators: Validators = {};
  if (stat.etag) validators.etag = stat.etag;
  if (stat.mtimeMs > 0) {
    const mtime = Math.floor(stat.mtimeMs);
    validators.etag ??= `W/"${stat.size.toString(16)}-${mtime.toString(16)}"`;
    validators.lastModified = new Date(mtime).toUTCString();
  }
  return validators;
}

/**
 * RFC 9110 §13.2.2 evaluation order: If-None-Match, when present, is the whole
 * answer — a client that sends both headers has an ETag it trusts more than
 * the clock, so a tag mismatch means 200 even if the date says fresh.
 */
export function isNotModified(headers: ServingHeaders, validators: Validators): boolean {
  const ifNoneMatch = firstValue(headers['if-none-match']);
  if (ifNoneMatch !== undefined) return etagMatches(ifNoneMatch, validators.etag);

  const ifModifiedSince = firstValue(headers['if-modified-since']);
  if (ifModifiedSince === undefined || validators.lastModified === undefined) return false;
  const since = Date.parse(ifModifiedSince);
  if (Number.isNaN(since)) return false;
  // Both sides are HTTP-dates (second granularity), so this is already the
  // truncated comparison the spec asks for — validators.lastModified was
  // itself produced by toUTCString().
  return Date.parse(validators.lastModified) <= since;
}

/**
 * Single-range only: a multi-range request would need a
 * `multipart/byteranges` body, which no TREK client asks for and which is
 * never wrong to answer with the full entity (RFC 9110 §14.2 — a server MAY
 * ignore Range). Anything that isn't exactly one `bytes=<n>-<n>` spec —
 * commas, another unit, trailing junk — takes the same 200 path.
 */
export function decideRange(headers: ServingHeaders, size: number, etag: string | undefined): RangeDecision {
  const raw = firstValue(headers['range']);
  if (raw === undefined) return { kind: 'full' };

  // If-Range: only a strong-exact tag lets the client resume; anything else
  // (a weak tag, an HTTP-date form, a tag we can't match) means the entity may
  // have changed under them, so send all of it rather than a stitched-together
  // corrupt file.
  const ifRange = firstValue(headers['if-range']);
  if (ifRange !== undefined && !(etag !== undefined && !isWeak(etag) && ifRange.trim() === etag)) {
    return { kind: 'full' };
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(raw.trim());
  if (match === null) return { kind: 'full' };
  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') return { kind: 'full' }; // 'bytes=-' is malformed, not a range

  const last = size - 1;
  if (rawStart === '') {
    // Suffix form: the last N bytes, computed from the pre-stat size — the
    // reason the serving path stats before it streams.
    const suffix = Number(rawEnd);
    if (suffix === 0 || size === 0) return { kind: 'unsatisfiable' };
    return { kind: 'partial', start: Math.max(0, size - suffix), end: last };
  }

  const start = Number(rawStart);
  if (start > last) return { kind: 'unsatisfiable' }; // also the size-0 case (last === -1)
  const end = rawEnd === '' ? last : Math.min(Number(rawEnd), last);
  if (end < start) return { kind: 'unsatisfiable' };
  return { kind: 'partial', start, end };
}

/** Weak comparison (RFC 9110 §8.8.3.2) — the only one If-None-Match may use. */
function etagMatches(ifNoneMatch: string, etag: string | undefined): boolean {
  const raw = ifNoneMatch.trim();
  if (raw === '*') return true; // "any current representation" — and we have one
  if (etag === undefined) return false;
  const target = stripWeak(etag);
  return raw.split(',').some((candidate) => stripWeak(candidate.trim()) === target);
}

function isWeak(etag: string): boolean {
  return etag.startsWith('W/');
}

function stripWeak(etag: string): string {
  return isWeak(etag) ? etag.slice(2) : etag;
}

function firstValue(header: string | string[] | undefined): string | undefined {
  return Array.isArray(header) ? header[0] : header;
}
