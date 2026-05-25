import { describe, it, expect, afterEach } from 'vitest';
import { getNestPrefixes, makeNestPathMatcher } from '../../../src/nest/strangler';

describe('strangler toggle', () => {
  const original = process.env.NEST_PREFIXES;
  afterEach(() => {
    if (original === undefined) delete process.env.NEST_PREFIXES;
    else process.env.NEST_PREFIXES = original;
  });

  it('defaults to the migrated prefixes (/api/_nest + /api/weather) when NEST_PREFIXES is unset', () => {
    delete process.env.NEST_PREFIXES;
    expect(getNestPrefixes()).toEqual(['/api/_nest', '/api/weather']);
  });

  it('parses NEST_PREFIXES (comma-separated, trimmed)', () => {
    process.env.NEST_PREFIXES = '/api/weather, /api/airports';
    expect(getNestPrefixes()).toEqual(['/api/weather', '/api/airports']);
  });

  it('treats an empty NEST_PREFIXES as "all routes on legacy"', () => {
    process.env.NEST_PREFIXES = '';
    expect(getNestPrefixes()).toEqual([]);
  });

  it('matches exact prefixes and subpaths but not lookalikes', () => {
    const match = makeNestPathMatcher(['/api/_nest']);
    expect(match('/api/_nest')).toBe(true);
    expect(match('/api/_nest/health')).toBe(true);
    expect(match('/api/_nestxyz')).toBe(false);
    expect(match('/api/health')).toBe(false);
  });
});
