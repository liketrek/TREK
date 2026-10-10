import {
  checkDbTypes,
  generateDbTypes,
  interfaceName,
  KYSELY_DIR,
  pascalCase,
  renderAll,
  renderColumns,
  renderDb,
  renderTable,
  tsTypeFor,
  writeDbTypes,
  type ColumnInfo,
  type TableInfo,
} from '../../../scripts/generate-db-types';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function column(overrides: Partial<ColumnInfo> & { name: string }): ColumnInfo {
  return { type: 'TEXT', notnull: true, hasDefault: false, pk: 0, hidden: 0, ...overrides };
}

const ITEMS: TableInfo = {
  name: 'budget_items',
  columns: [
    column({ name: 'id', type: 'INTEGER', notnull: false, pk: 1 }),
    column({ name: 'trip_id', type: 'INTEGER' }),
    column({ name: 'name' }),
    column({ name: 'note', notnull: false }),
    column({ name: 'created_at', type: 'DATETIME', notnull: false, hasDefault: true }),
    column({ name: 'exchange_rate', type: 'REAL', hasDefault: true }),
  ],
};

function tempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('tsTypeFor', () => {
  it('DBTYPES-001: maps the declared types the schema uses by SQLite affinity', () => {
    expect(tsTypeFor('INTEGER')).toBe('number');
    expect(tsTypeFor('bigint')).toBe('number');
    expect(tsTypeFor('TEXT')).toBe('string');
    expect(tsTypeFor('varchar(255)')).toBe('string');
    expect(tsTypeFor('REAL')).toBe('number');
    expect(tsTypeFor('DATETIME')).toBe('string');
    expect(tsTypeFor('BLOB')).toBe('Buffer');
    expect(tsTypeFor('BOOLEAN')).toBe('number');
    expect(tsTypeFor('')).toBe('unknown');
  });

  it('DBTYPES-002: refuses a declared type it has no mapping for, naming it', () => {
    expect(() => tsTypeFor('GEOMETRY')).toThrow(/"GEOMETRY"/);
  });
});

describe('names', () => {
  it('DBTYPES-003: snake_case tables become PascalCase files and <Name>Table interfaces', () => {
    expect(pascalCase('budget_items')).toBe('BudgetItems');
    expect(pascalCase('users')).toBe('Users');
    expect(interfaceName('trip_files')).toBe('TripFilesTable');
  });
});

describe('renderTable', () => {
  it('DBTYPES-004: a rowid, a defaulted and a nullable column are InsertOptional, the rest required', () => {
    const source = renderTable(ITEMS);
    expect(source).toContain("import type { InsertOptional } from './columns';");
    expect(source).toContain('export interface BudgetItemsTable {');
    expect(source).toContain('  id: InsertOptional<number>;');
    expect(source).toContain('  trip_id: number;');
    expect(source).toContain('  name: string;');
    expect(source).toContain('  note: InsertOptional<string | null>;');
    expect(source).toContain('  created_at: InsertOptional<string | null>;');
    expect(source).toContain('  exchange_rate: InsertOptional<number>;');
  });

  it('DBTYPES-005: a composite primary key is required on insert, not a rowid', () => {
    const source = renderTable({
      name: 'place_tags',
      columns: [
        column({ name: 'place_id', type: 'INTEGER', pk: 1 }),
        column({ name: 'tag_id', type: 'INTEGER', pk: 2 }),
      ],
    });
    expect(source).toContain('  place_id: number;');
    expect(source).toContain('  tag_id: number;');
    expect(source).not.toContain('import type');
  });

  it('DBTYPES-006: a generated (computed) column is GeneratedAlways, so no insert or update can name it', () => {
    const source = renderTable({ name: 't', columns: [column({ name: 'total', type: 'INTEGER', hidden: 2 })] });
    expect(source).toContain("import type { GeneratedAlways } from 'kysely';");
    expect(source).toContain('  total: GeneratedAlways<number>;');
  });

  it('DBTYPES-007: a column name that is not an identifier is quoted', () => {
    const source = renderTable({ name: 't', columns: [column({ name: 'group-name' })] });
    expect(source).toContain("  'group-name': string;");
  });
});

describe('renderDb / renderColumns / renderAll', () => {
  it('DBTYPES-008: db.ts imports every table interface and maps the table name to it', () => {
    const source = renderDb([ITEMS, { name: 'users', columns: [column({ name: 'id', type: 'INTEGER', pk: 1 })] }]);
    expect(source).toContain("import type { BudgetItemsTable } from './BudgetItems.table';");
    expect(source).toContain("import type { UsersTable } from './Users.table';");
    expect(source).toContain('export interface DB {\n  budget_items: BudgetItemsTable;\n  users: UsersTable;\n}');
  });

  it('DBTYPES-009: InsertOptional widens the insert type with void, which survives a non-strict compile', () => {
    expect(renderColumns()).toContain('export type InsertOptional<T> = ColumnType<T, T | void, T>;');
  });

  it('DBTYPES-010: renderAll emits one file per table plus columns.ts and db.ts, and refuses an empty schema', () => {
    const files = renderAll([ITEMS]);
    expect([...files.keys()].sort()).toEqual(['BudgetItems.table.ts', 'columns.ts', 'db.ts']);
    expect(() => renderAll([])).toThrow(/no tables/);
  });
});

describe('checkDbTypes / writeDbTypes', () => {
  it('DBTYPES-011: reports a changed, a missing and an extra file, and nothing once written', () => {
    const files = renderAll([ITEMS]);
    const dir = tempDir('gen-db-types-');
    try {
      expect(checkDbTypes(dir, files)).toEqual(['BudgetItems.table.ts', 'columns.ts', 'db.ts']);
      writeDbTypes(dir, files);
      expect(checkDbTypes(dir, files)).toEqual([]);

      fs.writeFileSync(path.join(dir, 'db.ts'), 'export interface DB {}\n');
      fs.writeFileSync(path.join(dir, 'Stale.table.ts'), 'export interface StaleTable {}\n');
      expect(checkDbTypes(dir, files)).toEqual(['Stale.table.ts (not produced by the generator)', 'db.ts']);

      writeDbTypes(dir, files);
      expect(fs.existsSync(path.join(dir, 'Stale.table.ts'))).toBe(false);
      expect(checkDbTypes(dir, files)).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('DBTYPES-012: a CRLF checkout of an unchanged file is not drift', () => {
    const files = renderAll([ITEMS]);
    const dir = tempDir('gen-db-types-crlf-');
    try {
      writeDbTypes(dir, files);
      const target = path.join(dir, 'db.ts');
      fs.writeFileSync(target, fs.readFileSync(target, 'utf8').replace(/\n/g, '\r\n'));
      expect(checkDbTypes(dir, files)).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('the committed src/db/kysely/', () => {
  it('DBTYPES-013: matches what the migrated schema generates (the check:db-types gate)', async () => {
    const files = await generateDbTypes();
    expect(files.get('db.ts')).toContain('  budget_items: BudgetItemsTable;');
    expect(checkDbTypes(KYSELY_DIR, files)).toEqual([]);
  }, 60_000);
});

describe('formatting', () => {
  it('DBTYPES-014: every generated file is already Prettier-clean, so lint:format and check:db-types agree', async () => {
    const prettier = await import('prettier');
    // Sorted by name, as readSchema hands them over.
    const files = renderAll([
      ITEMS,
      {
        name: 'place_tags',
        columns: [
          column({ name: 'place_id', type: 'INTEGER', pk: 1 }),
          column({ name: 'tag_id', type: 'INTEGER', pk: 2 }),
        ],
      },
      {
        name: 't',
        columns: [column({ name: 'total', type: 'INTEGER', hidden: 2 }), column({ name: 'note', notnull: false })],
      },
    ]);
    const verdicts = await Promise.all(
      [...files].map(async ([fileName, content]) => {
        const filepath = path.join(KYSELY_DIR, fileName);
        const options = await prettier.resolveConfig(filepath);
        return { fileName, clean: await prettier.check(content, { ...options, filepath }) };
      }),
    );
    expect(verdicts).toEqual([...files.keys()].map((fileName) => ({ fileName, clean: true })));
  });
});
