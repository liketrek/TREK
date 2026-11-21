/**
 * The manual rollback in wiki/Updating.md ("Rolling back a Postgres update")
 * prints the statement TREK's restore clears the schema with
 * (src/db/engine/postgres/clear-schema.ts), so a rollback by hand clears the
 * same objects as the tested restore. The page holds a copy; this keeps it the
 * same as the code.
 */
import { CLEAR_SCHEMA_SQL } from '../../../../../src/db/engine/postgres/clear-schema';

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../../../../..');

/** The `sql` code blocks of a Markdown text, with the indentation of their fence removed. */
function sqlBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const fence = /^( *)```sql\n([\s\S]*?)\n\1```$/gm;
  for (const match of markdown.replace(/\r\n?/g, '\n').matchAll(fence)) {
    const indent = match[1].length;
    blocks.push(
      match[2]
        .split('\n')
        .map((line) => line.slice(Math.min(indent, line.length - line.trimStart().length)))
        .join('\n'),
    );
  }
  return blocks;
}

describe('clear-schema', () => {
  it('CLEARSCHEMA-001: the manual rollback on the wiki clears the schema with the statement the restore runs', () => {
    const page = fs.readFileSync(path.join(repoRoot, 'wiki', 'Updating.md'), 'utf8');
    const section = page.slice(page.indexOf('### Rolling back a Postgres update'));
    expect(sqlBlocks(section)).toContain(CLEAR_SCHEMA_SQL.trimEnd());
  });
});
