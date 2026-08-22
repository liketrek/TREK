import {
  demoDenied,
  errorResult,
  ok,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
} from '../../../src/nest-mcp';

import { describe, expect, it } from 'vitest';

describe('result helpers', () => {
  it('ok() wraps data as one pretty-printed JSON text block, without isError', () => {
    const result = ok({ a: 1 });
    expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify({ a: 1 }, null, 2) }] });
    expect('isError' in result).toBe(false);
  });

  it('errorResult() carries the message verbatim with isError', () => {
    expect(errorResult('Tag not found.')).toEqual({
      content: [{ type: 'text', text: 'Tag not found.' }],
      isError: true,
    });
  });

  it('demoDenied() uses the canned demo-mode message', () => {
    expect(demoDenied()).toEqual({
      content: [{ type: 'text', text: 'Write operations are disabled in demo mode.' }],
      isError: true,
    });
  });
});

describe('tool annotation presets', () => {
  it('encode the read/write/delete/idempotency matrix', () => {
    expect(TOOL_ANNOTATIONS_READONLY).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(TOOL_ANNOTATIONS_WRITE).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(TOOL_ANNOTATIONS_DELETE).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(TOOL_ANNOTATIONS_NON_IDEMPOTENT).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
  });

  it('open-world variants only flip openWorldHint', () => {
    expect(TOOL_ANNOTATIONS_OPEN_WORLD_READONLY).toEqual({ ...TOOL_ANNOTATIONS_READONLY, openWorldHint: true });
    expect(TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT).toEqual({
      ...TOOL_ANNOTATIONS_NON_IDEMPOTENT,
      openWorldHint: true,
    });
  });
});
