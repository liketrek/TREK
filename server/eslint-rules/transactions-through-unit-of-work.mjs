/**
 * trek/transactions-through-unit-of-work: every transaction under src/ goes
 * through `UnitOfWork.transactional` (or `writeTransaction`, which it wraps).
 *
 * On SQLite one connection writes one transaction at a time, so a check read
 * inside a transaction (a `MAX(...) + 1` position, a count under a cap, an
 * existence before an insert) still held at the write that followed. On
 * Postgres a pool runs transactions side by side, and only the engine's write
 * lock (`DatabaseEngine.serializeWrites`), which `UnitOfWork` takes first,
 * puts them one after the other again. A transaction opened any other way,
 * `em.transactional(...)`, a repository's `getEntityManager().transactional(...)`,
 * `em.begin()`, a connection's `transactional(...)` or Kysely's
 * `db.transaction()`, does not take that lock, and its check can be raced.
 *
 * The rule reads the receiver's type: `transactional` is reported on anything
 * but a `UnitOfWork` (an untyped receiver included, so it fails closed), and
 * `begin`/`transaction` on an EntityManager, a connection or a Kysely
 * instance (better-sqlite3's own `transaction()`, the plugin's private SQLite
 * file, and unrelated `begin()` methods stay out of it). The engine and the
 * boot-time schema files open their own transactions on purpose and are left
 * out in eslint.config.mjs, each with its reason.
 */
const OPENERS = new Set(['transactional', 'begin', 'transaction']);
const DATABASE_HANDLE = /EntityManager|Connection|^Kysely\b/;

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Open transactions only through UnitOfWork.transactional, which takes the engine write lock on Postgres',
    },
    schema: [],
    messages: {
      direct:
        '`.{{method}}(...)` opens a transaction without the engine write lock. Use `UnitOfWork.transactional` ' +
        '(src/nest/database/unit-of-work.ts; outside the Nest container `writeTransaction` from ' +
        'src/db/engine/write-transaction.ts), and read every check its write relies on (a count, an existence, ' +
        "a MAX + 1) inside it. A repository method runs inside its caller's unit of work instead of opening one. " +
        'See server/CLAUDE.md, "Transactions are not optional".',
    },
  },
  create(context) {
    const services = context.sourceCode.parserServices;
    if (!services?.program) return {};
    const checker = services.program.getTypeChecker();

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.computed || callee.property.type !== 'Identifier') return;
        const method = callee.property.name;
        if (!OPENERS.has(method)) return;
        const type = services.getTypeAtLocation(callee.object);
        const symbol = (type.getSymbol() ?? type.aliasSymbol)?.getName();
        if (symbol === 'UnitOfWork') return;
        if (method !== 'transactional' && !DATABASE_HANDLE.test(checker.typeToString(type))) return;
        context.report({ node, messageId: 'direct', data: { method } });
      },
    };
  },
};
