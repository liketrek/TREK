/**
 * RPCROWID: every plugin RPC handler reads an id param through rowIdParam.
 *
 * A plugin sends its params as JSON, so an id can arrive as '0x5', '5e0', 1.5
 * or 1e20. num() and Number() read the first two as 5 and pass the others on,
 * which SQLite matches against nothing while Postgres refuses them or reads
 * the string its own way. The params have no schema a walk could vary, so
 * this reads the handlers' source: every `params.<name>` named like a row id
 * must sit directly inside rowIdParam(), optionalRowIdParam() or toRowId(), or
 * inside str() for an id that is a string (a plugin's slug, a migration id).
 * A handler's `input` is parsed with a @trek/shared request schema, which
 * ROUTEID-002 holds to the same rule.
 */
import { ROW_ID_NAME, ROW_ID_NAMED_OTHERWISE } from '../../helpers/row-id-fields';

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(__dirname, '../../../src');
/** A `params.<id>` read directly inside one of these, line breaks allowed. */
const WRAPPED = /\b(rowIdParam|optionalRowIdParam|toRowId|str)\(\s*$/;
const PARAM_READ = /\bparams\.(\w+)/g;

function rpcFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return rpcFiles(full);
    return entry.name.endsWith('.ts') && fs.readFileSync(full, 'utf8').includes('@PluginMethod(') ? [full] : [];
  });
}

/** The `params.<id>` reads of `source` that no reader wraps, as `line: text`. */
function unparsedIdReads(source: string): string[] {
  const lines = source.split('\n');
  const found: string[] = [];
  for (const match of source.matchAll(PARAM_READ)) {
    if (!ROW_ID_NAME.test(match[1]) && !ROW_ID_NAMED_OTHERWISE.has(match[1])) continue;
    if (WRAPPED.test(source.slice(Math.max(0, match.index - 200), match.index))) continue;
    const line = source.slice(0, match.index).split('\n').length;
    found.push(`${line}: ${lines[line - 1].trim()}`);
  }
  return found;
}

describe('RPCROWID: plugin RPC handlers read id params through rowIdParam', () => {
  it('RPCROWID-001: finds an id param read any other way, and passes the readers', () => {
    expect(unparsedIdReads('const id = num(params.tripId, "tripId");')).toHaveLength(1);
    expect(unparsedIdReads('const id = Number(params.entryId);')).toHaveLength(1);
    expect(unparsedIdReads('await this.svc.list(params.tripId);')).toHaveLength(1);
    expect(unparsedIdReads('const id = rowIdParam(params.tripId, "tripId");')).toEqual([]);
    expect(unparsedIdReads('const id = rowIdParam(\n      params.tripId,\n      "tripId",\n    );')).toEqual([]);
    expect(unparsedIdReads('const id = optionalRowIdParam(params.dayId, "dayId");')).toEqual([]);
    expect(unparsedIdReads('return ctx.data.migrate(str(params.id, "id"));')).toEqual([]);
    expect(unparsedIdReads('const text = params.text;')).toEqual([]);
  });

  it('RPCROWID-002: no handler reads an id param past rowIdParam', () => {
    const files = rpcFiles(SRC);
    const failures = files.flatMap((file) =>
      unparsedIdReads(fs.readFileSync(file, 'utf8')).map((read) => `${path.relative(SRC, file)}:${read}`),
    );
    expect(files.length, 'no file declares a @PluginMethod; the walk broke').toBeGreaterThan(20);
    expect(
      failures,
      'Read a plugin RPC id param with rowIdParam(params.<name>, "<name>") from src/nest-rpc/rpc-params.ts ' +
        '(optionalRowIdParam when it may be left out), or with str() when the id is a string, never with num(), ' +
        'Number() or as sent.',
    ).toEqual([]);
  });
});
