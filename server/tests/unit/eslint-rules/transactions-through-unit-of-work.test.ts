import transactionsThroughUnitOfWork from '../../../eslint-rules/transactions-through-unit-of-work.mjs';

import { RuleTester, type Rule } from 'eslint';
import path from 'path';
import tseslint from 'typescript-eslint';

// TXGATE: the rule reads the receiver's type, so the tester runs against a real
// TypeScript program, the fixture project no-promise-as-value.test.ts uses
// (eslint-rules/fixtures/, outside src/ and tests/). Per-file mode on CI too,
// for the reason given there.
const fixtureRoot = path.resolve(__dirname, '../../../eslint-rules/fixtures');
const filename = path.join(fixtureRoot, 'file.ts');

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: fixtureRoot,
      disallowAutomaticSingleRunInference: true,
    },
  },
});

// Stand-ins named like the real classes: the rule goes by the receiver's type name.
const PRELUDE = `
declare class UnitOfWork { transactional<T>(fn: () => Promise<T>): Promise<T>; }
declare class EntityManager {
  transactional<T>(fn: (em: EntityManager) => Promise<T>): Promise<T>;
  begin(): Promise<void>;
}
declare class SqlEntityManager extends EntityManager {}
declare class AbstractSqlConnection { transactional<T>(fn: (trx: unknown) => Promise<T>): Promise<T>; begin(): Promise<unknown>; }
declare class Kysely<DB> { transaction(): { execute<T>(fn: (trx: Kysely<DB>) => Promise<T>): Promise<T> }; readonly db?: DB; }
declare class Database { transaction<F extends (...args: unknown[]) => unknown>(fn: F): F; }
declare class RouterState { begin(): void; }
declare function writeTransaction<T>(em: EntityManager, engine: unknown, fn: (em: EntityManager) => Promise<T>): Promise<T>;
declare const uow: UnitOfWork;
declare const em: EntityManager;
declare const sqlEm: SqlEntityManager;
declare const connection: AbstractSqlConnection;
declare const kysely: Kysely<{ trips: { id: number } }>;
declare const pluginDb: Database;
declare const state: RouterState;
declare const repo: { getEntityManager(): EntityManager };
declare const untyped: ReturnType<typeof JSON.parse>;
`;

const withPrelude = (code: string) => `${PRELUDE}${code}\n`;

const valid = [
  // The unit of work, injected or held in a field.
  `void uow.transactional(async () => 1);`,
  `class S { constructor(private readonly uow: UnitOfWork) {} run() { return this.uow.transactional(async () => 1); } }`,
  // The engine's own wrapper for code outside the container.
  `void writeTransaction(em, null, async () => 1);`,
  // better-sqlite3's transaction() on a plugin's private file, and an unrelated begin().
  `pluginDb.transaction(() => 1)();`,
  `state.begin();`,
];

const invalid = [
  `void em.transactional(async () => 1);`,
  `void sqlEm.transactional(async () => 1);`,
  `void repo.getEntityManager().transactional(async () => 1);`,
  `void connection.transactional(async () => 1);`,
  `void em.begin();`,
  `void connection.begin();`,
  `void kysely.transaction().execute(async () => 1);`,
  // An untyped receiver is reported too: the rule fails closed.
  `void untyped.transactional(async () => 1);`,
];

ruleTester.run('trek/transactions-through-unit-of-work', transactionsThroughUnitOfWork as unknown as Rule.RuleModule, {
  valid: valid.map((code) => ({ code: withPrelude(code), filename })),
  invalid: invalid.map((code) => ({ code: withPrelude(code), filename, errors: [{ messageId: 'direct' }] })),
});
