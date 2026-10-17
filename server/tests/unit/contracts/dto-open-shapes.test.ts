/**
 * contracts:dto-open: the contracts the server really binds may only get tighter.
 *
 * shared's contracts:open counts the open shapes in every export named
 * *RequestSchema, but the name is a convention, not what the server binds:
 * dozens of DTOs wrap a schema named *BodySchema, *InputSchema or just
 * *Schema, and some wrap a schema declared in the dto file itself. This walks
 * the other way round. It finds every `class X extends createZodDto(...)` under
 * src/, imports the file, and counts the open shapes (the same walk as
 * shared/scripts/open-request-schemas.mjs) in the schema that class hands the
 * global ZodValidationPipe. The count per class is held against
 * scripts/dto-open-shapes-baseline.json: a new DTO may hold none, an existing
 * one no more than its entry.
 *
 *   npm run contracts:dto-open              this file, as CI runs it in the unit tests
 *   npm run contracts:dto-open -- --update  lower the baseline to today's counts; it
 *                                           never raises or adds an entry
 *
 * It fails closed: a missing or malformed baseline, a createZodDto call that is
 * not an exported class, two DTO classes with one name, or a tree without a
 * single DTO stop it instead of passing with nothing checked.
 */
import { createZodDto } from 'nestjs-zod';
import { isZodDto } from 'nestjs-zod/dto';
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';

const SERVER_ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(SERVER_ROOT, 'src');
const BASELINE = path.join(SERVER_ROOT, 'scripts/dto-open-shapes-baseline.json');
const OPEN_SHAPES_SCRIPT = path.resolve(SERVER_ROOT, '../shared/scripts/open-request-schemas.mjs');

type Counts = Record<string, number>;

interface OpenShapesModule {
  openShapes(root: unknown): string[];
  compare(baseline: Counts, counts: Counts): { grown: [string, number][]; lowerable: [string, number][] };
  lowerBaseline(baseline: Counts, counts: Counts): Counts;
}

interface DtoDeclaration {
  file: string;
  name: string;
}

const DTO_CLASS = /\b(export\s+)?class\s+(\w+)\s+extends\s+createZodDto\s*\(/g;
const DTO_CALL = /\bcreateZodDto\s*\(/g;

function sourceFiles(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, files);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) files.push(full);
  }
  return files;
}

/** The source without its comments, so a createZodDto named in prose is not counted as a call. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/**
 * Every DTO class declared under `root`, and the problems that keep the walk
 * from seeing one: a createZodDto call that is not `export class X extends
 * createZodDto(...)` (its schema could not be reached through the module), or
 * a class name used twice (the baseline is keyed by name).
 */
function findDtoClasses(root: string): { dtos: DtoDeclaration[]; problems: string[] } {
  const dtos: DtoDeclaration[] = [];
  const problems: string[] = [];
  const firstFile = new Map<string, string>();
  for (const full of sourceFiles(root)) {
    const code = stripComments(readFileSync(full, 'utf8'));
    const file = path.relative(SERVER_ROOT, full).split(path.sep).join('/');
    const calls = code.match(DTO_CALL)?.length ?? 0;
    const classes = [...code.matchAll(DTO_CLASS)];
    if (calls !== classes.length) {
      problems.push(
        `${file}: ${calls - classes.length} createZodDto call(s) outside \`export class X extends createZodDto(...)\``,
      );
    }
    for (const [, exported, name] of classes) {
      if (!exported) problems.push(`${file}: ${name} is not exported, so its schema cannot be counted`);
      const seen = firstFile.get(name);
      if (seen) problems.push(`${name} is declared in ${seen} and ${file}: DTO class names must be unique`);
      firstFile.set(name, file);
      dtos.push({ file, name });
    }
  }
  return { dtos, problems };
}

/** The baseline as committed. Missing, unreadable or malformed is an error, never an empty baseline. */
function readBaseline(file = BASELINE): Counts {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`scripts/dto-open-shapes-baseline.json cannot be read: ${(err as Error).message}`, { cause: err });
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('scripts/dto-open-shapes-baseline.json must be an object of DTO class names to counts');
  }
  for (const [name, n] of Object.entries(parsed)) {
    if (!Number.isInteger(n) || (n as number) < 1) {
      throw new Error(
        `scripts/dto-open-shapes-baseline.json: ${name} holds ${JSON.stringify(n)}, expected a whole number above 0`,
      );
    }
  }
  return parsed as Counts;
}

/** Open-shape counts for every ZodDto class among a module's exports. */
function countDtoExports(namespace: Record<string, unknown>, names: string[], shapes: OpenShapesModule): Counts {
  const counts: Counts = {};
  for (const name of names) {
    const dto = namespace[name];
    if (typeof dto !== 'function' || !isZodDto(dto)) {
      throw new Error(`${name} is not an exported createZodDto class`);
    }
    counts[name] = shapes.openShapes(dto.schema).length;
  }
  return counts;
}

let shapes: OpenShapesModule;
beforeAll(async () => {
  shapes = (await import(pathToFileURL(OPEN_SHAPES_SCRIPT).href)) as OpenShapesModule;
});

describe('open shapes in the DTO contracts', () => {
  let counts: Counts;
  let problems: string[];
  beforeAll(async () => {
    const found = findDtoClasses(SRC);
    problems = found.problems;
    counts = {};
    const byFile = new Map<string, string[]>();
    for (const { file, name } of found.dtos) byFile.set(file, [...(byFile.get(file) ?? []), name]);
    for (const [file, names] of byFile) {
      const namespace = (await import(pathToFileURL(path.join(SERVER_ROOT, file)).href)) as Record<string, unknown>;
      for (const name of names) {
        try {
          Object.assign(counts, countDtoExports(namespace, [name], shapes));
        } catch (err) {
          // Reported once by DTO-001, together with the reason the scan found.
          if (!problems.some((p) => p.includes(` ${name} `))) problems.push(`${file}: ${(err as Error).message}`);
        }
      }
    }
  }, 120_000);

  it('DTO-001: every createZodDto call is an exported, uniquely named class, and there are some', () => {
    expect(problems).toEqual([]);
    expect(
      Object.keys(counts).length,
      'no DTO class found under src/: the check would look at nothing',
    ).toBeGreaterThan(0);
  });

  it('DTO-002: no DTO holds more open shapes than the baseline allows', () => {
    const { grown } = shapes.compare(readBaseline(), counts);
    expect(
      grown,
      'type the fields instead of accepting any object (shared/CLAUDE.md, "Rules for new contracts")',
    ).toEqual([]);
  });

  it('DTO-003: the baseline names only DTOs that exist and are still open', () => {
    let baseline = readBaseline();
    if (process.env.DTO_OPEN_SHAPES_UPDATE === '1') {
      baseline = shapes.lowerBaseline(baseline, counts);
      writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n');
    }
    const { lowerable } = shapes.compare(baseline, counts);
    expect(lowerable, 'run `npm run contracts:dto-open -- --update` after narrowing a schema').toEqual([]);
  });
});

describe('the DTO walk itself', () => {
  it('DTO-004: counts an open body whatever its schema is called and fails on a new one', () => {
    // A body named like most of the tree (fooBodySchema, pluginConfigSchema), not *RequestSchema.
    const pluginConfigSchema = z.record(z.string(), z.unknown());
    const fooBodySchema = z.looseObject({ name: z.string(), extra: z.unknown() });
    class PluginConfigDto extends createZodDto(pluginConfigSchema) {}
    class FooBodyDto extends createZodDto(fooBodySchema) {}
    class ClosedDto extends createZodDto(z.strictObject({ a: z.string() })) {}

    const counts = countDtoExports(
      { PluginConfigDto, FooBodyDto, ClosedDto },
      ['PluginConfigDto', 'FooBodyDto', 'ClosedDto'],
      shapes,
    );
    expect(counts).toEqual({ PluginConfigDto: 1, FooBodyDto: 2, ClosedDto: 0 });
    expect(shapes.compare({}, counts).grown).toEqual([
      ['PluginConfigDto', 1],
      ['FooBodyDto', 2],
    ]);
    expect(shapes.compare({ FooBodyDto: 1, PluginConfigDto: 1 }, counts).grown).toEqual([['FooBodyDto', 2]]);
    expect(() => countDtoExports({}, ['GoneDto'], shapes)).toThrow(/not an exported createZodDto class/);
  });

  it('DTO-005: refuses a DTO it cannot reach and a name used twice', () => {
    const root = path.join(tmpdir(), `trek-dto-walk-${process.pid}-${Date.now()}`);
    const nested = path.join(root, 'b');
    try {
      mkdirSync(nested, { recursive: true });
      writeFileSync(
        path.join(root, 'a.dto.ts'),
        [
          '// createZodDto( in a comment is not a call',
          'export class ADto extends createZodDto(a) {}',
          'class HiddenDto extends createZodDto(b) {}',
          'const Loose = createZodDto(c);',
        ].join('\r\n'),
      );
      writeFileSync(path.join(nested, 'b.dto.ts'), 'export class ADto extends createZodDto(d) {}\n');
      const { dtos, problems } = findDtoClasses(root);
      expect(dtos.map((d) => d.name).sort()).toEqual(['ADto', 'ADto', 'HiddenDto']);
      expect(problems.some((p) => p.includes('1 createZodDto call(s) outside'))).toBe(true);
      expect(problems.some((p) => p.includes('HiddenDto is not exported'))).toBe(true);
      expect(problems.some((p) => p.includes('ADto is declared in'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('DTO-006: a missing or malformed baseline is an error, never an empty baseline', () => {
    expect(() => readBaseline(path.join(SERVER_ROOT, 'scripts/definitely-not-here.json'))).toThrow(/cannot be read/);
    expect(() => readBaseline(path.join(SERVER_ROOT, 'package.json'))).toThrow(/expected a whole number/);
  });
});
