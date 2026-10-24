/**
 * The JSON Schema every registered MCP tool advertises in tools/list, built the
 * way the registry and the SDK build it (a shape is registered strict, then
 * converted by zod's toJSONSchema). It walks every *.mcp.ts under src/nest, so a
 * tool needs no harness wiring to be covered.
 *
 * What it holds: an input schema is self-contained (no $ref or $defs, which
 * several MCP clients do not resolve), every id field is the positive integer
 * of @trek/shared's idSchema, the shared primitive the tools derive their ids
 * from, and the book restore's schema, which carries whole pages, stays under a ceiling, as do
 * the page edit and the design revision, which take every page operation.
 */
import type { ToolOptions } from '../../../src/nest-mcp';
import { getEntry, isMcpController, type ClassRef } from '../../../src/nest-mcp/metadata';
import { idSchema } from '@trek/shared';

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, it, expect } from 'vitest';
import { z } from 'zod';

const NEST_ROOT = join(__dirname, '../../../src/nest');

function mcpFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return mcpFiles(full);
    return name.endsWith('.mcp.ts') ? [full] : [];
  });
}

function methodNames(ctor: ClassRef): string[] {
  const names = new Set<string>();
  let proto: object | null = (ctor as unknown as { prototype: object }).prototype;
  while (proto && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) if (name !== 'constructor') names.add(name);
    proto = Object.getPrototypeOf(proto);
  }
  return [...names];
}

async function toolSchemas(): Promise<Map<string, Record<string, unknown>>> {
  const out = new Map<string, Record<string, unknown>>();
  const files = mcpFiles(NEST_ROOT).sort();
  const modules = (await Promise.all(files.map((file) => import(file)))) as Record<string, unknown>[];
  for (const [index, mod] of modules.entries()) {
    const file = files[index];
    for (const exported of Object.values(mod)) {
      if (!isMcpController(exported)) continue;
      for (const name of methodNames(exported)) {
        const entry = getEntry(exported, name);
        if (entry?.kind !== 'tool') continue;
        const input = (entry.options as ToolOptions).inputSchema;
        if (input === undefined) continue;
        const schema = '_zod' in input ? input : z.strictObject(input);
        const json = z.toJSONSchema(schema as z.ZodType, { target: 'draft-7', io: 'input' }) as Record<string, unknown>;
        out.set(`${relative(NEST_ROOT, file)}#${entry.options.name}`, json);
      }
    }
  }
  return out;
}

describe('MCP tool input schemas', () => {
  let schemas: Map<string, Record<string, unknown>>;
  // Importing every MCP module pulls in most of the server once.
  beforeAll(async () => {
    schemas = await toolSchemas();
  }, 180_000);

  it('MCP-SCHEMA-001: every tool advertises a self-contained input schema', () => {
    expect(schemas.size).toBeGreaterThan(150);
    const withRefs = [...schemas]
      .filter(([, json]) => /"\$ref"|"\$defs"|"definitions"/.test(JSON.stringify(json)))
      .map(([key]) => key);
    expect(withRefs).toEqual([]);
  });

  it('MCP-SCHEMA-002: a shared id stays the positive integer it always was in tools/list', () => {
    const id = z.toJSONSchema(idSchema, { target: 'draft-7', io: 'input' }) as Record<string, unknown>;
    expect(id).toMatchObject({ type: 'integer', exclusiveMinimum: 0 });
    const tripIds = [...schemas.values()]
      .map((json) => (json.properties as Record<string, Record<string, unknown>> | undefined)?.tripId)
      .filter((p): p is Record<string, unknown> => !!p && p.type === 'integer');
    expect(tripIds.length).toBeGreaterThan(100);
    for (const prop of tripIds) expect(prop).toMatchObject({ type: 'integer', exclusiveMinimum: 0 });
  });

  it('MCP-SCHEMA-003: restore_book_page, the one tool that takes whole book pages, stays under its size ceiling', () => {
    // Every client loads it with tools/list, though only an undo calls it. Measured at about 34 000
    // characters; a new element kind or field on a book page grows it, and this says so.
    const restore = [...schemas].find(([key]) => key.endsWith('#restore_book_page'))?.[1];
    const size = JSON.stringify(restore ?? null).length;
    expect(size).toBeGreaterThan(10_000);
    expect(size).toBeLessThan(40_000);
  });

  it('MCP-SCHEMA-004: the page edit and the design revision, which take every page operation, stay under their ceiling', () => {
    // Every element kind's add and style operation widen the op union; the design's
    // revision takes the same ops. A layout's undo takes its layout as JSON text, so it stays small.
    const sizeOf = (tool: string) =>
      JSON.stringify([...schemas].find(([key]) => key.endsWith(`#${tool}`))?.[1] ?? null).length;
    for (const tool of ['edit_book_page', 'revise_book_design']) {
      expect(sizeOf(tool)).toBeGreaterThan(10_000);
      expect(sizeOf(tool)).toBeLessThan(45_000);
    }
    expect(sizeOf('restore_book_layout')).toBeLessThan(2_000);
  });
});
