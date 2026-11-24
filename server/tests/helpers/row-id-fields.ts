/**
 * The fields of a request schema that hold a row id, and the spellings of an id
 * each one lets through. For ROUTEID-002 (route-row-ids.e2e.test.ts): a body
 * or query id a schema accepts as '0x1', '1e0' or 1.5 reaches the handler, and
 * from there SQL, where SQLite matches nothing, Postgres 14 and 15 refuse the
 * cast and 16 and later read hex and underscores as a number.
 */
import type { z } from 'zod';

/** A field is taken for a row id when it is named like one: `id`, `ids`, `*_id`, `*_ids`, `*Id`, `*Ids`. */
export const ROW_ID_NAME = /^(id|ids|[a-z][a-z0-9_]*_ids?|[a-z][A-Za-z0-9]*Ids?)$/;

/** Fields that hold a row id under a name the pattern above does not catch. */
export const ROW_ID_NAMED_OTHERWISE: ReadonlySet<string> = new Set(['reply_to', 'replyTo']);

/**
 * Spellings of row 1 that toRowId refuses: Number() and parseInt() read most
 * of them as 1, a Postgres 16+ cast reads hex and underscores, Postgres 14
 * and 15 refuse them, and 1.5 and 1e20 are no bigint on any Postgres.
 */
const MALFORMED_ROW_IDS: readonly unknown[] = [
  '0x1',
  '1e0',
  '1.0',
  '+1',
  ' 1',
  '1 ',
  '1_0',
  'abc',
  '99999999999999999999',
  1.5,
  1e20,
];

/**
 * The spellings of `id` toRowId refuses that Number(), parseInt() or a
 * Postgres 16+ cast read as `id`, plus a number past the bigint range, for an
 * id that travels as text (a path, a URI).
 */
export function malformedIdSpellings(id: number): string[] {
  return [`0x${id.toString(16)}`, `${id}e0`, `${id}.0`, `+${id}`, `0_${id}`, ` ${id}`, '99999999999999999999'];
}

interface RowIdField {
  /** `$.a.b[].c`, from the schema's root. */
  path: string;
  name: string;
  schema: z.ZodType;
}

interface ZodDefLike {
  type: string;
  shape?: Record<string, z.ZodType>;
  getter?: () => z.ZodType;
  [key: string]: unknown;
}

function defOf(schema: unknown): ZodDefLike | undefined {
  return (schema as { _zod?: { def?: ZodDefLike } } | undefined)?._zod?.def;
}

function isZod(value: unknown): value is z.ZodType {
  return defOf(value) !== undefined;
}

/** Every field of `root` named like a row id, at every depth, once per path. */
export function rowIdFields(root: z.ZodType): RowIdField[] {
  const found = new Map<string, RowIdField>();
  const ancestors = new Set<unknown>();
  const visit = (schema: unknown, path: string): void => {
    const def = defOf(schema);
    if (!def || ancestors.has(schema)) return;
    ancestors.add(schema);
    try {
      walk(def, path);
    } finally {
      ancestors.delete(schema);
    }
  };
  const walk = (def: ZodDefLike, path: string): void => {
    if (def.type === 'object') {
      for (const [name, value] of Object.entries(def.shape ?? {})) {
        const at = `${path}.${name}`;
        if ((ROW_ID_NAME.test(name) || ROW_ID_NAMED_OTHERWISE.has(name)) && !found.has(at)) {
          found.set(at, { path: at, name, schema: value });
        }
        visit(value, at);
      }
      return;
    }
    if (def.type === 'lazy' && def.getter) {
      visit(def.getter(), path);
      return;
    }
    if (def.type === 'array') {
      visit(def.element, `${path}[]`);
      return;
    }
    for (const key of ['innerType', 'in', 'out', 'valueType', 'left', 'right', 'rest']) {
      if (isZod(def[key])) visit(def[key], path);
    }
    for (const key of ['options', 'items']) {
      const list = def[key];
      if (Array.isArray(list)) list.forEach((option) => visit(option, path));
    }
  };
  visit(root, '$');
  return [...found.values()];
}

const WRAPPERS = new Set(['optional', 'nullable', 'default', 'prefault', 'readonly', 'catch', 'nonoptional']);

/** True when the field, under its optional/nullable/default wrappers, is a list. */
function holdsList(schema: z.ZodType): boolean {
  let def = defOf(schema);
  while (def && WRAPPERS.has(def.type)) def = defOf(def.innerType);
  return def?.type === 'array';
}

/** The spellings in MALFORMED_ROW_IDS a row id field accepts; a list field is tried with one element. */
export function malformedAccepted(field: z.ZodType): unknown[] {
  const list = holdsList(field);
  return MALFORMED_ROW_IDS.filter((value) => field.safeParse(list ? [value] : value).success);
}
