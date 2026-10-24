/**
 * PaddleCheckCache: the readings of the last lines for one version of the
 * obstacle data, kept without their lines, the least recently used one
 * dropped once it holds more than it keeps, and all of them dropped with a
 * new version.
 */
import { PaddleCheckCache, type PaddleCheckEvaluation } from '../../../src/nest/tours/tour-paddle-check.cache';
import type { PaddleCheckLine } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const line = (totalM: number): PaddleCheckLine => ({ points: [], alongM: [], totalM, portages: [], locks: [] });

function evaluation(totalM: number): PaddleCheckEvaluation {
  return {
    line: line(totalM),
    candidates: [],
    own: [],
    dataKeys: new Set([`node/${totalM}`]),
    complete: true,
    data: { data: 'covered', data_as_of: null, read_at: null },
  };
}

describe('PaddleCheckCache', () => {
  it('PCC-001: answers what it was given with the line it is asked for, and nothing it was not', () => {
    const cache = new PaddleCheckCache();
    cache.atVersion('v1');
    cache.set('a', evaluation(1));
    const asked = line(7);
    const hit = cache.get('a', asked);
    expect(hit?.line).toBe(asked);
    expect(hit?.dataKeys.has('node/1')).toBe(true);
    expect(cache.get('b', asked)).toBeUndefined();
    cache.set('a', evaluation(2));
    expect(cache.get('a', asked)?.dataKeys.has('node/2')).toBe(true);
  });

  it('PCC-002: past 64 readings drops the one used longest ago, a reading just read is kept', () => {
    const cache = new PaddleCheckCache();
    cache.atVersion('v1');
    for (let i = 0; i < 64; i++) cache.set(`line-${i}`, evaluation(i));
    expect(cache.get('line-0', line(0))).toBeDefined();
    cache.set('line-64', evaluation(64));
    expect(cache.get('line-0', line(0))).toBeDefined();
    expect(cache.get('line-1', line(1))).toBeUndefined();
    expect(cache.get('line-64', line(64))).toBeDefined();
  });

  it('PCC-003: a new version of the data drops every reading, the same version keeps them', () => {
    const cache = new PaddleCheckCache();
    cache.atVersion('v1');
    cache.set('a', evaluation(1));
    cache.atVersion('v1');
    expect(cache.get('a', line(1))).toBeDefined();
    cache.atVersion('v2');
    expect(cache.get('a', line(1))).toBeUndefined();
  });
});
