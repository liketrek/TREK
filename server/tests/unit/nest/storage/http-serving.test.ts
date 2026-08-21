import { describe, it, expect } from 'vitest';
import {
  decideRange,
  isNotModified,
  validatorsFor,
  type Validators,
} from '../../../../src/nest/storage/http-serving';

// The pure half of the remote-serving parity work (task C4): every decision a
// proxying byte-path makes BEFORE it touches a driver or a socket. Kept
// dependency-free so the state machine is provable in isolation — the
// service-level suite then only has to prove the wiring.

const LM_5000 = new Date(5000).toUTCString();

describe('validatorsFor', () => {
  it('prefers the driver-supplied ETag verbatim', () => {
    expect(validatorsFor({ key: 'a.bin', size: 10, mtimeMs: 5000, etag: '"abc123"' })).toEqual({
      etag: '"abc123"',
      lastModified: LM_5000,
    });
  });

  it('derives a weak size-mtime ETag when the driver supplies none (send/express parity)', () => {
    expect(validatorsFor({ key: 'a.bin', size: 26, mtimeMs: 4096 })).toEqual({
      etag: 'W/"1a-1000"',
      lastModified: new Date(4096).toUTCString(),
    });
  });

  it('emits NO validators at all when mtimeMs is 0 (S3 can report it — never a 1970 header)', () => {
    expect(validatorsFor({ key: 'a.bin', size: 10, mtimeMs: 0 })).toEqual({});
  });

  it('still emits a driver ETag when mtimeMs is 0, but no Last-Modified', () => {
    expect(validatorsFor({ key: 'a.bin', size: 10, mtimeMs: 0, etag: '"abc123"' })).toEqual({
      etag: '"abc123"',
    });
  });

  it('ignores an empty driver ETag and falls back to the derived one', () => {
    expect(validatorsFor({ key: 'a.bin', size: 1, mtimeMs: 16, etag: '' }).etag).toBe('W/"1-10"');
  });

  it('floors a fractional mtime into the derived tag', () => {
    expect(validatorsFor({ key: 'a.bin', size: 1, mtimeMs: 16.9 }).etag).toBe('W/"1-10"');
  });
});

describe('isNotModified', () => {
  const v: Validators = { etag: '"abc"', lastModified: LM_5000 };

  it('matches If-None-Match exactly', () => {
    expect(isNotModified({ 'if-none-match': '"abc"' }, v)).toBe(true);
    expect(isNotModified({ 'if-none-match': '"other"' }, v)).toBe(false);
  });

  it('matches a list of candidate tags', () => {
    expect(isNotModified({ 'if-none-match': '"x", "abc" ,"y"' }, v)).toBe(true);
  });

  it('compares weakly — W/ prefixes on either side are stripped', () => {
    expect(isNotModified({ 'if-none-match': 'W/"abc"' }, v)).toBe(true);
    expect(isNotModified({ 'if-none-match': '"1a-1000"' }, { etag: 'W/"1a-1000"' })).toBe(true);
  });

  it('honours the * wildcard', () => {
    expect(isNotModified({ 'if-none-match': '*' }, v)).toBe(true);
    expect(isNotModified({ 'if-none-match': '*' }, {})).toBe(true);
  });

  it('never matches when we have no ETag to compare against', () => {
    expect(isNotModified({ 'if-none-match': '"abc"' }, {})).toBe(false);
  });

  it('lets If-None-Match win over If-Modified-Since even when the date says fresh', () => {
    expect(isNotModified({ 'if-none-match': '"stale"', 'if-modified-since': LM_5000 }, v)).toBe(false);
  });

  it('matches If-Modified-Since at second granularity', () => {
    // 5400ms truncates to the same second as 5000ms — a 1970-second-boundary
    // stand-in for the sub-second mtimes Last-Modified cannot express.
    expect(isNotModified({ 'if-modified-since': LM_5000 }, { lastModified: new Date(5400).toUTCString() })).toBe(true);
    expect(isNotModified({ 'if-modified-since': LM_5000 }, { lastModified: new Date(6000).toUTCString() })).toBe(false);
  });

  it('treats an older If-Modified-Since as modified', () => {
    expect(isNotModified({ 'if-modified-since': new Date(4000).toUTCString() }, v)).toBe(false);
  });

  it('ignores an unparseable If-Modified-Since', () => {
    expect(isNotModified({ 'if-modified-since': 'not-a-date' }, v)).toBe(false);
  });

  it('is false when there is no Last-Modified to compare (mtimeMs 0)', () => {
    expect(isNotModified({ 'if-modified-since': LM_5000 }, {})).toBe(false);
  });

  it('is false with no conditional headers at all', () => {
    expect(isNotModified({}, v)).toBe(false);
  });

  it('reads the first value of a repeated header', () => {
    expect(isNotModified({ 'if-none-match': ['"abc"', '"zzz"'] }, v)).toBe(true);
  });
});

describe('decideRange', () => {
  it('is full with no Range header', () => {
    expect(decideRange({}, 10, '"abc"')).toEqual({ kind: 'full' });
  });

  it('resolves a closed range inclusively', () => {
    expect(decideRange({ range: 'bytes=2-5' }, 10, '"abc"')).toEqual({ kind: 'partial', start: 2, end: 5 });
  });

  it('resolves an open-ended range to the last byte', () => {
    expect(decideRange({ range: 'bytes=5-' }, 10, '"abc"')).toEqual({ kind: 'partial', start: 5, end: 9 });
  });

  it('clamps an end past EOF', () => {
    expect(decideRange({ range: 'bytes=5-999' }, 10, '"abc"')).toEqual({ kind: 'partial', start: 5, end: 9 });
  });

  it('computes a suffix range from the pre-stat size', () => {
    expect(decideRange({ range: 'bytes=-4' }, 10, '"abc"')).toEqual({ kind: 'partial', start: 6, end: 9 });
  });

  it('clamps a suffix larger than the object to the whole object', () => {
    expect(decideRange({ range: 'bytes=-999' }, 10, '"abc"')).toEqual({ kind: 'partial', start: 0, end: 9 });
  });

  it('is unsatisfiable past EOF, on an inverted range, and on a zero-length suffix', () => {
    expect(decideRange({ range: 'bytes=10-12' }, 10, '"abc"')).toEqual({ kind: 'unsatisfiable' });
    expect(decideRange({ range: 'bytes=5-3' }, 10, '"abc"')).toEqual({ kind: 'unsatisfiable' });
    expect(decideRange({ range: 'bytes=-0' }, 10, '"abc"')).toEqual({ kind: 'unsatisfiable' });
  });

  it('is unsatisfiable for any range against a zero-byte object', () => {
    expect(decideRange({ range: 'bytes=0-' }, 0, '"abc"')).toEqual({ kind: 'unsatisfiable' });
    expect(decideRange({ range: 'bytes=-1' }, 0, '"abc"')).toEqual({ kind: 'unsatisfiable' });
  });

  it('falls back to a full 200 for a multi-range request (no multipart/byteranges)', () => {
    expect(decideRange({ range: 'bytes=0-1,4-5' }, 10, '"abc"')).toEqual({ kind: 'full' });
  });

  it('falls back to a full 200 for malformed or non-byte units', () => {
    for (const range of ['bytes=-', 'bytes=abc', 'items=0-1', 'bytes 0-1', 'bytes=0-1;x', '']) {
      expect(decideRange({ range }, 10, '"abc"')).toEqual({ kind: 'full' });
    }
  });

  it('honours a strong-exact If-Range match', () => {
    expect(decideRange({ range: 'bytes=2-5', 'if-range': '"abc"' }, 10, '"abc"')).toEqual({
      kind: 'partial',
      start: 2,
      end: 5,
    });
  });

  it('serves the full entity when If-Range does not strong-match', () => {
    expect(decideRange({ range: 'bytes=2-5', 'if-range': '"stale"' }, 10, '"abc"')).toEqual({ kind: 'full' });
    // A weak validator can never satisfy If-Range (RFC 9110 §13.1.5).
    expect(decideRange({ range: 'bytes=2-5', 'if-range': 'W/"abc"' }, 10, 'W/"abc"')).toEqual({ kind: 'full' });
    // Neither can an HTTP-date form — we only carry the ETag here.
    expect(decideRange({ range: 'bytes=2-5', 'if-range': LM_5000 }, 10, '"abc"')).toEqual({ kind: 'full' });
    // …nor an If-Range sent for a resource we have no ETag for.
    expect(decideRange({ range: 'bytes=2-5', 'if-range': '"abc"' }, 10, undefined)).toEqual({ kind: 'full' });
  });

  it('reads the first value of a repeated Range header', () => {
    expect(decideRange({ range: ['bytes=2-5', 'bytes=0-1'] }, 10, '"abc"')).toEqual({
      kind: 'partial',
      start: 2,
      end: 5,
    });
  });
});
