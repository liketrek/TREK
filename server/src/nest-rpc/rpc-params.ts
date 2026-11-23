import { toRowId } from '../db/row-id';
import { BadParams } from './rpc-errors';

/**
 * The param coercions every plugin RPC handler shares, lifted verbatim out of
 * rpc-host.ts so decorated *.rpc.ts handlers use the same ones.
 *
 * Their leniency is part of the published contract: num() accepts numeric strings
 * and asPayload() wraps a non-object in { value }, so tightening either would reject
 * calls that shipped plugins make today.
 */

export const num = (v: unknown, name: string): number => {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new BadParams(`${name} must be a number`);
  return n;
};

/**
 * A row id, or another whole number compared with an integer column (a list
 * position, a pagination cursor): a safe integer or its decimal digits, read
 * through toRowId. num() let '0x5', '5e0', 1.5 and 1e20 through,
 * which SQLite matches against nothing while Postgres refuses the cast or reads
 * the string its own way; a canonical numeric string still passes, as the
 * published contract says. The refusal keeps num()'s message.
 */
export const rowIdParam = (v: unknown, name: string): number => {
  const id = toRowId(v);
  if (id === null) throw new BadParams(`${name} must be a number`);
  return id;
};

/** rowIdParam for a param that may be left out: absent stays undefined, anything else must be a row id. */
export const optionalRowIdParam = (v: unknown, name: string): number | undefined =>
  v === undefined ? undefined : rowIdParam(v, name);

export const str = (v: unknown, name: string): string => {
  if (typeof v !== 'string') throw new BadParams(`${name} must be a string`);
  return v;
};

/**
 * A Buffer a plugin binds crosses the JSON IPC as its toJSON form,
 * { type: 'Buffer', data: [bytes] }; it is bound as those bytes again.
 */
function reviveBuffer(v: unknown): unknown {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return v;
  const o = v as Record<string, unknown>;
  if (o.type !== 'Buffer' || !Array.isArray(o.data) || Object.keys(o).length !== 2) return v;
  const bytes: unknown[] = o.data;
  return bytes.every((b) => Number.isInteger(b) && (b as number) >= 0 && (b as number) <= 255)
    ? Buffer.from(bytes as number[])
    : v;
}

export function asArgs(v: unknown): unknown[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(reviveBuffer);
  throw new BadParams('args must be an array');
}

/**
 * Coerce a db.tx `ops` param into a validated {sql, args}[] before it reaches the
 * data db: each op must carry a string sql and, if present, an array of args.
 */
export function asTxOps(v: unknown): Array<{ sql: string; args?: unknown[] }> {
  if (!Array.isArray(v)) throw new BadParams('ops must be an array of { sql, args }');
  return v.map((op) => {
    const o = (op ?? {}) as Record<string, unknown>;
    return { sql: str(o.sql, 'ops[].sql'), args: asArgs(o.args) };
  });
}

export function asPayload(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : { value: v };
}

/**
 * The message a failed Zod parse should carry into BAD_PARAMS.
 *
 * Every handler used to inline `error.issues[0]?.message ?? 'bad input'`, twenty
 * copies of the same two-branch fallback that no test could reach, because a real
 * parse failure always reports at least one issue. One copy is testable; twenty are
 * twenty permanently uncovered branches.
 */
export function schemaMessage(error: { issues?: Array<{ message?: string }> }): string {
  return error.issues?.[0]?.message ?? 'bad input';
}
