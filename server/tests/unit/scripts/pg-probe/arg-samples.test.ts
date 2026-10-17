/**
 * The Postgres probe has no fixtures: scripts/pg-probe/arg-samples.ts reads
 * every repository with the TypeScript checker and builds one argument list
 * per public method from the parameter types. These tests run it over a
 * throwaway repository file with the server's own non-strict compiler
 * settings, so each shape it meets in the real repositories has a pinned
 * sample (or a pinned reason it has none).
 */
import {
  planRepositories,
  readCompilerOptions,
  sampleString,
  type MethodPlan,
} from '../../../../scripts/pg-probe/arg-samples';

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const FIXTURE = `
export interface NewThing {
  name: string;
  trip_id: number;
  note?: string | null;
  tags: string[];
  kind: 'a' | 'b';
  at: Date;
  onSave?: () => void;
}
export class ThingsRepository {
  private secret(): void {}
  protected guarded(): void {}
  static make(): void {}
  async listByTrip(tripId: number, includeHidden?: boolean): Promise<void> {}
  async create(data: NewThing): Promise<void> {}
  async byDate(date: string, created_at: string, email: string): Promise<void> {}
  async withCallback(fn: (x: number) => void): Promise<void> {}
  async optionalCallback(id: number, fn?: () => void): Promise<void> {}
  async rest(...ids: number[]): Promise<void> {}
  async idOrString(id: number | string): Promise<void> {}
  async tuple(pair: [number, string]): Promise<void> {}
  async collections(ids: Set<number>, byId: Map<string, number>): Promise<void> {}
  async nullable(x: string | null): Promise<void> {}
  async generic<T extends number>(x: T): Promise<void> {}
  async record(r: Record<string, number>): Promise<void> {}
  async literals(n: bigint, flag: true): Promise<void> {}
  async destructured({ id, label }: { id: number; label: string }): Promise<void> {}
}
export abstract class AbstractRepository {
  async skipped(): Promise<void> {}
}
class NotExported {
  async skipped(): Promise<void> {}
}
`;

let root: string;
let plans: MethodPlan[];

const planOf = (method: string): MethodPlan => {
  const plan = plans.find((p) => p.method === method);
  if (!plan) throw new Error(`no plan for ${method}`);
  return plan;
};
const argsOf = (method: string): unknown[] => {
  const plan = planOf(method);
  if (!('args' in plan)) throw new Error(`${method} is unprobeable: ${plan.unprobeable}`);
  return plan.args;
};

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), 'trek-pg-probe-'));
  mkdirSync(path.join(root, 'src'));
  writeFileSync(path.join(root, 'src/Things.repository.ts'), FIXTURE);
  // The server's own settings (non-strict: `string | null` is `string`), so
  // the fixture is sampled the way the real repositories are.
  const options = readCompilerOptions(path.join(__dirname, '../../../../tsconfig.json'));
  plans = planRepositories(
    [path.join(root, 'src/Things.repository.ts')],
    { ...options, rootDir: root, paths: undefined, types: [] },
    root,
  );
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('pg-probe argument samples', () => {
  it('PGPROBE-030: plans every public instance method of every exported concrete class, sorted', () => {
    expect(plans.map((p) => `${p.className}.${p.method}`)).toEqual(
      [
        'byDate',
        'collections',
        'create',
        'destructured',
        'generic',
        'idOrString',
        'listByTrip',
        'literals',
        'nullable',
        'optionalCallback',
        'record',
        'rest',
        'tuple',
        'withCallback',
      ].map((m) => `ThingsRepository.${m}`),
    );
    expect(plans.every((p) => p.file === 'src/Things.repository.ts')).toBe(true);
  });

  it('PGPROBE-031: numbers are 1, booleans false, a union prefers its number', () => {
    expect(argsOf('listByTrip')).toEqual([1, false]);
    expect(argsOf('idOrString')).toEqual([1]);
    expect(argsOf('generic')).toEqual([1]);
    expect(argsOf('nullable')).toEqual(['probe']);
    expect(argsOf('literals')).toEqual([BigInt(1), true]);
  });

  it('PGPROBE-032: strings are shaped by their names', () => {
    expect(argsOf('byDate')).toEqual(['2026-01-01', '2026-01-01 00:00:00', 'probe@example.com']);
    expect(sampleString('start_date')).toBe('2026-01-01');
    expect(sampleString('updatedAt')).toBe('2026-01-01 00:00:00');
    expect(sampleString('reservation_time')).toBe('2026-01-01 00:00:00');
    expect(sampleString('image_url')).toBe('https://example.com/probe');
    expect(sampleString('color')).toBe('#000000');
    expect(sampleString('tripId')).toBe('1');
    expect(sampleString('place_ids')).toBe('1');
    expect(sampleString('name')).toBe('probe');
  });

  it('PGPROBE-033: objects get every property it can sample, a callback property is left out', () => {
    expect(argsOf('create')).toEqual([
      { name: 'probe', trip_id: 1, note: 'probe', tags: ['probe'], kind: 'a', at: new Date('2026-01-01T00:00:00Z') },
    ]);
    expect(argsOf('destructured')).toEqual([{ id: 1, label: 'probe' }]);
    expect(argsOf('record')).toEqual([{}]);
  });

  it('PGPROBE-034: arrays, tuples, sets, maps and rest parameters', () => {
    expect(argsOf('rest')).toEqual([1]);
    expect(argsOf('tuple')).toEqual([[1, 'probe']]);
    expect(argsOf('collections')).toEqual([new Set([1]), new Map([['1', 1]])]);
  });

  it('PGPROBE-035: a required callback makes the method unprobeable, an optional one is left off', () => {
    expect(planOf('withCallback')).toMatchObject({ unprobeable: 'fn: a function parameter' });
    expect(argsOf('optionalCallback')).toEqual([1]);
  });

  it('PGPROBE-036: reads compiler options the way tsc -p does, and refuses a missing file', () => {
    const options = readCompilerOptions(path.join(__dirname, '../../../../tsconfig.json'));
    expect(options.experimentalDecorators).toBe(true);
    expect(options.module).toBe(ts.ModuleKind.CommonJS);
    expect(() => readCompilerOptions(path.join(root, 'missing.json'))).toThrow();
  });
});
