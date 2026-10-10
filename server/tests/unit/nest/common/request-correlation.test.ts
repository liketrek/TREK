/**
 * The correlation store (nest/common/request-correlation.ts): which incoming
 * ids are adopted, how a unit of work nests inside another, and how the tag
 * reads in a log line.
 */
import {
  acceptRequestId,
  childCorrelation,
  correlationTag,
  currentCorrelation,
  newCorrelationId,
  runWithCorrelation,
} from '../../../../src/nest/common/request-correlation';

import { describe, it, expect } from 'vitest';

describe('acceptRequestId', () => {
  it('CORR-001: adopts the ids proxies and tracers send', () => {
    for (const id of [
      'abc123',
      '7f9c2ba4-e88f-11ec-8ea0-0242ac120002',
      'Root=1-5759e988-bd862e3fe1be46a994272793',
      'a.b_c:d',
    ]) {
      expect(acceptRequestId(id)).toBe(id);
    }
  });

  it('CORR-002: refuses anything that could forge or bloat a log line', () => {
    expect(acceptRequestId('')).toBeNull();
    expect(acceptRequestId('x'.repeat(129))).toBeNull();
    expect(acceptRequestId('has space')).toBeNull();
    expect(acceptRequestId('line\nbreak')).toBeNull();
    expect(acceptRequestId('<script>')).toBeNull();
    expect(acceptRequestId(['a', 'b'])).toBeNull();
    expect(acceptRequestId(undefined)).toBeNull();
  });
});

describe('the correlation store', () => {
  it('CORR-003: nothing is current outside a unit of work', () => {
    expect(currentCorrelation()).toBeUndefined();
    expect(correlationTag(undefined)).toBe('');
  });

  it('CORR-004: a correlation stays current across awaits inside its run', async () => {
    const id = newCorrelationId();
    const seen = await runWithCorrelation({ id, kind: 'http' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return currentCorrelation();
    });
    expect(seen).toEqual({ id, kind: 'http' });
    expect(currentCorrelation()).toBeUndefined();
  });

  it('CORR-005: a child gets its own id and remembers the one it started inside', () => {
    const top = childCorrelation('cron');
    expect(top.parentId).toBeUndefined();
    const nested = runWithCorrelation({ id: 'outer', kind: 'http' }, () => childCorrelation('mcp'));
    expect(nested.kind).toBe('mcp');
    expect(nested.parentId).toBe('outer');
    expect(nested.id).not.toBe('outer');
  });

  it('CORR-006: the tag names the kind and the id', () => {
    expect(correlationTag({ id: 'abc', kind: 'ws' })).toBe('[ws abc] ');
  });
});
