/**
 * The rules of `npm run lint:mcp-surface` (scripts/lib/mcp-surface-compare.mjs):
 * an existing tool may not grow, a new one may not pass 4 KB, a session may not
 * list more bytes of existing tools than its entry, a stale entry fails until
 * --update lowers it, and --update records new tools with the sessions that list
 * them so the next run passes.
 */
import {
  compareSurface,
  NEW_TOOL_MAX_BYTES,
  OUTPUT_SCHEMA_MAX_BYTES,
  updatedBaseline,
} from '../../../scripts/lib/mcp-surface-compare.mjs';

import { describe, expect, it } from 'vitest';

interface Session {
  tools: number;
  bytes: number;
  names: string[];
}

function measured(tools: Record<string, number>, sessions: Record<string, string[]>) {
  const out: Record<string, Session> = {};
  for (const [name, names] of Object.entries(sessions)) {
    out[name] = { tools: names.length, bytes: names.reduce((s, n) => s + tools[n], 0), names };
  }
  return { sessions: out, tools };
}

const BASE = { sessions: { full: { tools: 2, bytes: 300, tokens: 75 } }, tools: { a: 100, b: 200 } };

describe('compareSurface', () => {
  it('SURF-001: the same surface passes with nothing stale', () => {
    expect(compareSurface(measured({ a: 100, b: 200 }, { full: ['a', 'b'] }), BASE)).toEqual({
      problems: [],
      stale: [],
    });
  });

  it('SURF-002: an existing tool that grows fails, naming it', () => {
    const { problems } = compareSurface(measured({ a: 101, b: 200 }, { full: ['a', 'b'] }), BASE);
    expect(problems).toContain('tool a grew from 100 to 101 bytes');
    expect(problems.some((p) => p.startsWith('session full lists 301 bytes'))).toBe(true);
  });

  it('SURF-003: a new tool under the cap passes and does not count against the session', () => {
    const result = compareSurface(measured({ a: 100, b: 200, c: 900 }, { full: ['a', 'b', 'c'] }), BASE);
    expect(result).toEqual({ problems: [], stale: [] });
  });

  it('SURF-004: a new tool above the cap fails', () => {
    const big = NEW_TOOL_MAX_BYTES + 1;
    const { problems } = compareSurface(measured({ a: 100, b: 200, c: big }, { full: ['a', 'b', 'c'] }), BASE);
    expect(problems).toEqual([`new tool c weighs ${big} bytes in tools/list, above the ${NEW_TOOL_MAX_BYTES} cap`]);
  });

  it('SURF-005: a shrunk or removed tool is stale until --update lowers the baseline', () => {
    const { problems, stale } = compareSurface(measured({ a: 90 }, { full: ['a'] }), BASE);
    expect(problems).toEqual([]);
    expect(stale).toEqual([
      'tool a is 90 bytes now, its entry says 100',
      'tool b is gone, its entry is not',
      'session full is 90 bytes of existing tools now, its entry says 300',
    ]);
  });

  it('SURF-009: an outputSchema above its cap fails, one below it passes', () => {
    const now = {
      ...measured({ a: 100, b: 200 }, { full: ['a', 'b'] }),
      outputs: { a: 900, b: OUTPUT_SCHEMA_MAX_BYTES + 1 },
    };
    expect(compareSurface(now, BASE).problems).toEqual([
      `tool b has an outputSchema of ${OUTPUT_SCHEMA_MAX_BYTES + 1} bytes, above the ${OUTPUT_SCHEMA_MAX_BYTES} cap`,
    ]);
  });

  it('SURF-006: a session without an entry fails', () => {
    const { problems } = compareSurface(measured({ a: 100, b: 200 }, { full: ['a', 'b'], core: ['a'] }), BASE);
    expect(problems).toEqual(['session core has no baseline entry']);
  });
});

describe('updatedBaseline', () => {
  it('SURF-007: records new tools with their sessions, drops gone ones, never raises an entry', () => {
    const now = measured({ a: 90, c: 500 }, { full: ['a', 'c'] });
    const next = updatedBaseline(now, BASE);
    expect(next).toEqual({ sessions: { full: { tools: 2, bytes: 590, tokens: 148 } }, tools: { a: 90, c: 500 } });
    expect(compareSurface(now, next)).toEqual({ problems: [], stale: [] });
  });

  it('SURF-008: an existing tool that grew is held at its entry', () => {
    const next = updatedBaseline(measured({ a: 150, b: 200 }, { full: ['a', 'b'] }), BASE);
    expect(next.tools.a).toBe(100);
    expect(next.sessions.full.bytes).toBe(300);
  });
});
