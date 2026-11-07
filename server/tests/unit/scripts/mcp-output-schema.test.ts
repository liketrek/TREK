/**
 * scripts/mcp-output-schema.mjs (lint:mcp-output-schema): read tools without an
 * outputSchema per *.mcp.ts file may only shrink. The counter on fixtures, the
 * script against a throwaway server root, and once on this repository.
 */
import { countReadToolsWithoutOutput } from '../../../scripts/mcp-output-schema.mjs';

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/mcp-output-schema.mjs');
const SERVER_ROOT = path.join(__dirname, '../../..');
const BASE = 'mcp-output-schema-baseline.json';

const roots: string[] = [];
afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const tool = (annotations: string, extra = '') =>
  `  @Tool({ name: 't', title: 'T', annotations: ${annotations},${extra} inputSchema: { a: f(1) } })\n  t() {}\n`;
const READ = 'TOOL_ANNOTATIONS_READONLY';

function serverRoot(files: Record<string, string>, counts: Record<string, number>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-output-schema-'));
  roots.push(dir);
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  mkdirSync(path.join(dir, 'src/nest'), { recursive: true });
  writeFileSync(path.join(dir, 'scripts', BASE), JSON.stringify({ counts }));
  return dir;
}

function run(dir: string): { status: number | null; out: string } {
  try {
    return { status: 0, out: execFileSync(process.execPath, [SCRIPT, `--dir=${dir}`], { encoding: 'utf8' }) };
  } catch (err) {
    const { status, stdout, stderr } = err as { status: number | null; stdout: string; stderr: string };
    return { status, out: `${stdout}${stderr}` };
  }
}

describe('countReadToolsWithoutOutput', () => {
  it('OUTSCHEMA-001: counts read tools without an outputSchema, by preset or by hint', () => {
    const text = [
      tool(READ),
      tool('TOOL_ANNOTATIONS_OPEN_WORLD_READONLY'),
      tool('{ readOnlyHint: true }'),
      tool(READ, ' outputSchema: listOutput.shape,'),
      tool('TOOL_ANNOTATIONS_WRITE'),
      tool('{ readOnlyHint: false }'),
    ].join('\n');
    expect(countReadToolsWithoutOutput(text)).toBe(3);
  });

  it('OUTSCHEMA-002: reads only the decorator, not the handler under it', () => {
    const text = `${tool(READ)}  async t() { return { outputSchema: 1 }; }\n${tool('TOOL_ANNOTATIONS_WRITE')}  w() { TOOL_ANNOTATIONS_READONLY; }\n`;
    expect(countReadToolsWithoutOutput(text)).toBe(1);
  });
});

describe('mcp-output-schema.mjs', () => {
  it('OUTSCHEMA-003: fails a new read tool without an outputSchema, passes one with it', () => {
    const file = 'src/nest/a/a.mcp.ts';
    const failing = run(serverRoot({ [file]: tool(READ) }, {}));
    expect(failing.status).toBe(1);
    expect(failing.out).toContain(`FAIL  ${file}: 1 read tool(s) without an outputSchema`);
    expect(run(serverRoot({ [file]: tool(READ, ' outputSchema: s.shape,') }, {})).status).toBe(0);
  });

  it('OUTSCHEMA-004: this repository holds its committed baseline', () => {
    const { status, out } = run(SERVER_ROOT);
    expect(out).toContain('mcp-output-schema:');
    expect(status).toBe(0);
  });
});
