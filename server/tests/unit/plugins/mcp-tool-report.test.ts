/**
 * The declarations a plugin reports for its `mcpTools` are untrusted input that ends
 * up in a tools/list response a model reads and acts on. normalizeMcpToolReports is
 * the only thing standing between the two, so it drops anything malformed WHOLE
 * rather than repairing it into a tool whose description no longer describes it.
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeMcpToolReports,
  publicMcpToolName,
  MAX_MCP_TOOLS_PER_PLUGIN,
} from '../../../src/nest/plugins/mcp-tool-report';

const tool = (over: Record<string, unknown> = {}) => ({ name: 'lookup', description: 'Look something up', ...over });

describe('normalizeMcpToolReports', () => {
  it('keeps a well-formed tool intact', () => {
    const schema = { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] };
    expect(normalizeMcpToolReports([tool({ title: 'Lookup', inputSchema: schema })], 'my-plugin')).toEqual([
      { name: 'lookup', title: 'Lookup', description: 'Look something up', inputSchema: schema, annotations: undefined },
    ]);
  });

  it('drops names that are not snake_case identifiers', () => {
    const bad = ['Lookup', 'look-up', '1lookup', 'look up', '', 'look.up', 'a'.repeat(49)];
    for (const name of bad) {
      expect(normalizeMcpToolReports([tool({ name })], 'p1'), name).toEqual([]);
    }
  });

  it('drops a tool whose namespaced name would exceed the 64-char client limit', () => {
    const longId = 'a'.repeat(40);
    const name = 'b'.repeat(30);
    expect(publicMcpToolName(longId, name).length).toBeGreaterThan(64);
    expect(normalizeMcpToolReports([tool({ name })], longId)).toEqual([]);
    // The same tool on a short plugin id is fine — it is the composite that is capped.
    expect(normalizeMcpToolReports([tool({ name })], 'p1')).toHaveLength(1);
  });

  it('requires a description — it is all the model reads before calling', () => {
    expect(normalizeMcpToolReports([{ name: 'lookup' }], 'p1')).toEqual([]);
    expect(normalizeMcpToolReports([tool({ description: '' })], 'p1')).toEqual([]);
    expect(normalizeMcpToolReports([tool({ description: 42 })], 'p1')).toEqual([]);
  });

  it('drops rather than truncates an over-long description', () => {
    expect(normalizeMcpToolReports([tool({ description: 'x'.repeat(4097) })], 'p1')).toEqual([]);
    expect(normalizeMcpToolReports([tool({ description: 'x'.repeat(4096) })], 'p1')).toHaveLength(1);
  });

  it('drops an over-long title but keeps the tool', () => {
    const [t] = normalizeMcpToolReports([tool({ title: 'x'.repeat(81) })], 'p1');
    expect(t.title).toBeUndefined();
    expect(t.name).toBe('lookup');
  });

  it('strips emoji from the rendered text, like every other plugin-supplied string', () => {
    const [t] = normalizeMcpToolReports([tool({ title: '🔍 Lookup', description: '🚀 Look it up' })], 'p1');
    expect(t.title).toBe('Lookup');
    expect(t.description).toBe('Look it up');
  });

  it('drops a schema that is not an object, or is too large to ship on every request', () => {
    expect(normalizeMcpToolReports([tool({ inputSchema: 'nope' })], 'p1')[0].inputSchema).toBeUndefined();
    expect(normalizeMcpToolReports([tool({ inputSchema: [1, 2] })], 'p1')[0].inputSchema).toBeUndefined();
    const huge = { type: 'object', properties: { q: { description: 'x'.repeat(17_000) } } };
    expect(normalizeMcpToolReports([tool({ inputSchema: huge })], 'p1')[0].inputSchema).toBeUndefined();
  });

  it('keeps only the four real MCP annotation hints, and only booleans', () => {
    const [t] = normalizeMcpToolReports(
      [tool({ annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: 'yes', invented: true } })],
      'p1',
    );
    expect(t.annotations).toEqual({ readOnlyHint: true, openWorldHint: false });
  });

  it('drops an annotations bag with nothing usable in it', () => {
    expect(normalizeMcpToolReports([tool({ annotations: { nope: 1 } })], 'p1')[0].annotations).toBeUndefined();
  });

  it('keeps the first of a duplicated name', () => {
    const out = normalizeMcpToolReports(
      [tool({ description: 'first' }), tool({ description: 'second' })],
      'p1',
    );
    expect(out).toHaveLength(1);
    expect(out[0].description).toBe('first');
  });

  it('caps how many tools one plugin may advertise', () => {
    const many = Array.from({ length: MAX_MCP_TOOLS_PER_PLUGIN + 5 }, (_, i) => tool({ name: `tool_${i}` }));
    expect(normalizeMcpToolReports(many, 'p1')).toHaveLength(MAX_MCP_TOOLS_PER_PLUGIN);
  });

  it('treats anything that is not an array of objects as no tools at all', () => {
    for (const raw of [undefined, null, 'tools', 42, {}, [null, 'x', 7]]) {
      expect(normalizeMcpToolReports(raw, 'p1')).toEqual([]);
    }
  });
});

describe('publicMcpToolName', () => {
  it('namespaces by plugin id so two plugins can never collide', () => {
    expect(publicMcpToolName('trip-doctor', 'check')).toBe('plugin_trip-doctor_check');
    expect(publicMcpToolName('other', 'check')).not.toBe(publicMcpToolName('trip-doctor', 'check'));
  });
});
