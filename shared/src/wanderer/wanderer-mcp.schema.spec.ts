// WANDERER-MCP-SCHEMA-001 to WANDERER-MCP-SCHEMA-002: the wanderer routes as the assistant asks them.
import {
  wandererMcpImportRequestSchema,
  wandererMcpPreviewRequestSchema,
  wandererMcpSearchRequestSchema,
  wandererMcpSourceRequestSchema,
} from './wanderer-mcp.schema';

import { describe, expect, it } from 'vitest';

describe('wanderer over MCP', () => {
  it('WANDERER-MCP-SCHEMA-001: a search takes words, a page and a part of the map, nothing else', () => {
    expect(wandererMcpSearchRequestSchema.parse({ q: ' Zugspitze ', page: 2 })).toEqual({ q: 'Zugspitze', page: 2 });
    expect(wandererMcpSearchRequestSchema.parse({})).toEqual({});
    expect(wandererMcpSearchRequestSchema.safeParse({ page: 26 }).success).toBe(false);
    expect(
      wandererMcpSearchRequestSchema.safeParse({ bbox: { south: 48, west: 11, north: 47, east: 12 } }).success,
    ).toBe(false);
    expect(wandererMcpSearchRequestSchema.safeParse({ q: 'x', token: 'y' }).success).toBe(false);
  });

  it('WANDERER-MCP-SCHEMA-002: a preview, an import and a check name their trail or tour', () => {
    expect(wandererMcpPreviewRequestSchema.safeParse({ trailId: 'abc' }).success).toBe(true);
    expect(wandererMcpPreviewRequestSchema.safeParse({ trailId: '' }).success).toBe(false);
    const hash = 'a'.repeat(32);
    expect(wandererMcpImportRequestSchema.parse({ trailId: 'abc', contentHash: hash })).toEqual({
      trailId: 'abc',
      contentHash: hash,
    });
    expect(wandererMcpImportRequestSchema.safeParse({ trailId: 'abc', contentHash: 'short' }).success).toBe(false);
    expect(wandererMcpSourceRequestSchema.safeParse({ placeId: 3 }).success).toBe(true);
    expect(wandererMcpSourceRequestSchema.safeParse({ placeId: 0 }).success).toBe(false);
  });
});
