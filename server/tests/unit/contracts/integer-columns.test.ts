/**
 * INTCOL: a request number bound for an integer column is a
 * whole number at the request boundary.
 *
 * Every integer column is `bigint` on Postgres. SQLite stores a fraction sent
 * to one as a REAL without a word, while Postgres rounds it (a statement
 * MikroORM renders) or refuses it with a 500 (a Kysely statement, whose
 * values travel as text), so the two engines end up holding different data
 * for the same request. The fix is to refuse the fraction before it reaches
 * the database, with `.int()` on the field in the `@trek/shared` schema, the
 * way `idSchema` already does for ids.
 *
 * This walks every `class X extends createZodDto(...)` under src/ (the schemas
 * the global ZodValidationPipe enforces, found as contracts:dto-open finds
 * them), and reads the fields an MCP tool declares inline in a `*.mcp.ts`, and
 * fails on a number field without `.int()` whose name is a column
 * that is an integer in some entity and fractional in none. The names come
 * from the entity files (`<name>: p.integer()`), so a new integer column is
 * checked as soon as it exists. A field that shares a column's name but does
 * not end up in it goes into NOT_A_COLUMN with the reason; a name that is
 * an integer in one table and a double in another (`sort_order`, `position`)
 * cannot be judged by its name and is left out.
 */
import { isZodDto } from 'nestjs-zod/dto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';

const SERVER_ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(SERVER_ROOT, 'src');
const ENTITIES = path.join(SRC, 'db/entities');

/**
 * Fields named like an integer column that never reach one, each with its
 * reason, keyed `DtoClass.path`, or `DtoClass` alone for every field of a DTO
 * that is stored as one document or not stored at all. Only add one when the
 * value never lands in an integer column.
 */
const NOT_A_COLUMN: Record<string, string> = {
  BookSaveDto: 'the photo book is stored whole as one JSON document; its sizes and widths are layout measures',
  ImmichSearchDto: 'a search sent on to Immich: size is its page size and the offset a time zone, neither is stored',
  SynologySearchDto:
    'a search sent on to Synology Photos: size is its page size and the offset a time zone, neither is stored',
};

/** Whether `key` (`DtoClass.path`) is excused by NOT_A_COLUMN. */
function excused(key: string): boolean {
  return key in NOT_A_COLUMN || key.split('.')[0] in NOT_A_COLUMN;
}

/** An inline MCP tool field: `name: z.number()` or `name: z.coerce.number()`, with the rest of its line. */
const INLINE_NUMBER = /\b(\w+): z\.(?:coerce\.)?number\(\)(.*)$/gm;
const DTO_CLASS = /\bexport\s+class\s+(\w+)\s+extends\s+createZodDto\s*\(/g;
const COLUMN = /^\s+(\w+): (?:\(\) => )?p\.(\w+)\(/gm;
const INTEGER_TYPES = new Set(['integer', 'smallint', 'bigint', 'tinyint', 'mediumint']);
const FRACTIONAL_TYPES = new Set(['double', 'float', 'decimal', 'real']);

function sourceFiles(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, files);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) files.push(full);
  }
  return files;
}

/** The column names that are an integer in some entity and fractional in none. */
function integerColumnNames(entitySources: readonly string[]): Set<string> {
  const integer = new Set<string>();
  const fractional = new Set<string>();
  for (const source of entitySources) {
    for (const [, name, type] of source.matchAll(COLUMN)) {
      if (INTEGER_TYPES.has(type)) integer.add(name);
      if (FRACTIONAL_TYPES.has(type)) fractional.add(name);
    }
  }
  return new Set([...integer].filter((name) => !fractional.has(name)));
}

/** What a zod schema holds once its wrappers (optional, nullable, default, both ends of a pipe, ...) are taken off. */
function children(schema: z.ZodType): Array<[string | null, z.ZodType]> {
  const def = schema._zod.def as unknown as Record<string, unknown> & { type: string };
  switch (def.type) {
    case 'object':
      return Object.entries(def.shape as Record<string, z.ZodType>);
    case 'optional':
    case 'nullable':
    case 'default':
    case 'prefault':
    case 'readonly':
    case 'catch':
    case 'nonoptional':
    case 'success':
      return [[null, def.innerType as z.ZodType]];
    case 'pipe':
      return [
        [null, def.in as z.ZodType],
        [null, def.out as z.ZodType],
      ];
    case 'array':
      return [[null, def.element as z.ZodType]];
    case 'union':
      return (def.options as z.ZodType[]).map((option) => [null, option]);
    case 'intersection':
      return [
        [null, def.left as z.ZodType],
        [null, def.right as z.ZodType],
      ];
    case 'record':
      return [[null, def.valueType as z.ZodType]];
    case 'tuple':
      return (def.items as z.ZodType[]).map((item) => [null, item]);
    case 'lazy':
      return [[null, (def.getter as () => z.ZodType)()]];
    default:
      return [];
  }
}

/**
 * The paths in `schema` whose field is named like an integer column but takes
 * any number. A path names the object keys from the root, so a nested field
 * reads `items.quantity`.
 */
function fractionalIntegerFields(schema: z.ZodType, integerNames: ReadonlySet<string>): string[] {
  const found = new Set<string>();
  const seen = new Set<z.ZodType>();
  const walk = (node: z.ZodType, trail: string[], field: string | null): void => {
    if (seen.has(node)) return;
    seen.add(node);
    if (node instanceof z.ZodNumber && field !== null && integerNames.has(field) && !node.isInt) {
      found.add(trail.join('.'));
    }
    for (const [key, child] of children(node)) {
      if (key === null) walk(child, trail, field);
      else walk(child, [...trail, key], key);
    }
    seen.delete(node);
  };
  walk(schema, [], null);
  return [...found].sort();
}

/** `file:line field` for every inline number field in `source` named like an integer column without `.int()`. */
function fractionalInlineFields(file: string, source: string, integerNames: ReadonlySet<string>): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(INLINE_NUMBER)) {
    const [, field, rest] = match;
    if (!integerNames.has(field) || rest.startsWith('.int()')) continue;
    const line = source.slice(0, match.index).split('\n').length;
    found.push(`${file}:${line} ${field}`);
  }
  return found;
}

describe('request numbers bound for integer columns', () => {
  let integerNames: Set<string>;
  let found: string[];
  let inline: string[];
  let dtoCount: number;

  beforeAll(async () => {
    integerNames = integerColumnNames(
      readdirSync(ENTITIES)
        .filter((name) => name.endsWith('.entity.ts'))
        .map((name) => readFileSync(path.join(ENTITIES, name), 'utf8')),
    );
    found = [];
    dtoCount = 0;
    inline = sourceFiles(SRC)
      .filter((file) => file.endsWith('.mcp.ts'))
      .flatMap((file) =>
        fractionalInlineFields(
          path.relative(SERVER_ROOT, file).split(path.sep).join('/'),
          readFileSync(file, 'utf8'),
          integerNames,
        ),
      );
    const files = sourceFiles(SRC).filter((file) => readFileSync(file, 'utf8').includes('createZodDto'));
    const modules = await Promise.all(
      files.map(async (file) => ({
        names: [...readFileSync(file, 'utf8').matchAll(DTO_CLASS)].map(([, name]) => name),
        namespace: (await import(pathToFileURL(file).href)) as Record<string, unknown>,
      })),
    );
    for (const { names, namespace } of modules) {
      for (const name of names) {
        const dto = namespace[name];
        if (typeof dto !== 'function' || !isZodDto(dto)) continue;
        dtoCount++;
        for (const field of fractionalIntegerFields(dto.schema as z.ZodType, integerNames))
          found.push(`${name}.${field}`);
      }
    }
  }, 120_000);

  it('INTCOL-001: the walk saw DTOs and integer columns', () => {
    expect(dtoCount, 'no DTO class found under src/: the check would look at nothing').toBeGreaterThan(0);
    expect(integerNames.has('quantity')).toBe(true);
  });

  it('INTCOL-002: every such field is a whole number', () => {
    expect(
      found.filter((key) => !excused(key)),
      'add .int() to these fields in the @trek/shared schema: the column is bigint on Postgres, ' +
        'which cannot hold the fraction SQLite would store. If the field never reaches that column, ' +
        'list it in NOT_A_COLUMN in this file with the reason.',
    ).toEqual([]);
  });

  it('INTCOL-006: no MCP tool declares such a field inline without .int()', () => {
    expect(inline, 'add .int() to these inline MCP fields, or take the field from the @trek/shared schema').toEqual([]);
  });

  it('INTCOL-003: NOT_A_COLUMN names only fields that would be reported', () => {
    const stale = Object.keys(NOT_A_COLUMN).filter(
      (entry) => !found.some((key) => key === entry || key.startsWith(`${entry}.`)),
    );
    expect(stale, 'drop these NOT_A_COLUMN entries: nothing they excuse is reported any more').toEqual([]);
  });
});

describe('the walk itself', () => {
  const names = integerColumnNames([
    '    quantity: p.integer(),\n    plan: () => p.manyToOne(Plans),\n    plan_id: p.integer().persist(false),\n',
    '    lat: p.double().nullable(),\n    sort_order: p.integer(),\n',
    '    sort_order: p.double(),\n',
  ]);

  it('INTCOL-004: reads integer columns from the entities and drops the names a table keeps fractional', () => {
    expect([...names].sort()).toEqual(['plan_id', 'quantity']);
  });

  it('INTCOL-005: finds a bare number through wrappers, arrays and nesting, and accepts .int()', () => {
    const schema = z.object({
      quantity: z.number().optional(),
      plan_id: z.number().int(),
      lat: z.number(),
      items: z.array(z.object({ quantity: z.number().nullable().default(null) })),
      nested: z.object({ plan_id: z.coerce.number() }).optional(),
      sort_order: z.number(),
    });
    expect(fractionalIntegerFields(schema, names)).toEqual(['items.quantity', 'nested.plan_id', 'quantity']);
    expect(fractionalIntegerFields(z.object({ quantity: z.int() }), names)).toEqual([]);
  });

  it('INTCOL-007: finds an inline MCP number field without .int() and its line', () => {
    const source = [
      '  quantity: z.number().optional(),',
      '  plan_id: z.number().int(),',
      '  lat: z.number(),',
      '  quantity: z.coerce.number().min(1),',
    ].join('\n');
    expect(fractionalInlineFields('a.mcp.ts', source, names)).toEqual(['a.mcp.ts:1 quantity', 'a.mcp.ts:4 quantity']);
  });
});
