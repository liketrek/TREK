#!/usr/bin/env node
/**
 * The Phase 1 (async sweep) worklist and gate.
 *
 * WHAT IT MEASURES
 *   --sync  every *synchronous* method under `server/src/**` that touches the
 *           database — directly (a `get/all/run/prepare/transaction/exec/pragma`
 *           or a `canAccessTrip/isOwner/rosterUserIds/getPlaceWithTags` call on a
 *           DatabaseService / raw handle) or transitively through a chain of
 *           *synchronous* `this.*` calls that does. An `async` callee is a
 *           stopping point for this walk: it is not traversed into, and its own
 *           DB reach (direct or transitive) is not attributed to the caller — so
 *           a sync method that only calls already-async methods (e.g. an
 *           `onApplicationBootstrap()` hook that schedules an async cron
 *           callback) is not listed here. That shape is `--unawaited`'s job, not
 *           `--sync`'s. These are exactly the methods the sweep's R1 turns into
 *           `async` ones.
 *   --tx    every real `…​.transaction(` call site (the AST sees calls, so the six
 *           prose mentions inside doc comments that `grep` finds are not here).
 *           These are the sites R2 routes through `UnitOfWork.transactional`.
 *   --unawaited  every call expression of the form `this.<dep>.<m>(…)`,
 *           `this.<m>(…)`, or `<importedFn>(…)` (imported from a relative path
 *           resolving under `src/`) whose target resolves to an `async`
 *           method/function, where the call's result is used without `await`
 *           in a way that compiles under `strict: false` but is a live bug —
 *           stored in a variable then read, passed as a plain argument, used
 *           as an object-literal property value, tested in a condition or
 *           comparison, or member-accessed. Each finding carries a reason tag
 *           (`stored-then-used` / `argument` / `property` / `condition` /
 *           `compared` / `member` / `statement` / `other`). It does NOT flag
 *           `await x()`, `return x()` (any function), `void x()`, an argument
 *           of `Promise.all/allSettled/race/any`, the concise body of an arrow
 *           passed to `.map(` (the `Promise.all(arr.map(…))` pattern — but it
 *           DOES flag that shape for `.filter/.find/.some/.every/.sort/.forEach`),
 *           or a `.then(`/`.catch(`/`.finally(` chain (which also covers the
 *           fire-and-forget-with-`.catch(` case). It is a lint-shaped finder
 *           for shapes the type-aware ESLint rules (`no-floating-promises`,
 *           `no-misused-promises`) cannot see under `strict: false` — see the
 *           recipe for why those rules alone aren't enough during Phase 1.
 *
 *           IT DOES NOT RESOLVE: calls through a `.bind` alias, a call reached
 *           via a local variable holding a method/function reference, a call
 *           on a dependency typed as an interface/token/union (same limit as
 *           `--sync`), or a call to a `export default`-exported function. Those
 *           stay the manual-grep's job — see the recipe.
 *
 * It exits 1 as soon as any requested list is non-empty, so a task can gate on it:
 *   `node scripts/db-call-graph.mjs --sync --tx --domains nest/days,nest/budget`
 *
 * R0 EXCEPTIONS (never listed, by either flag): `DatabaseService` itself,
 * `src/db/**`, `src/demo/**` and `src/nest/plugins/host/plugin-data.service.ts`.
 * They stay synchronous for the whole of Phase 1 — see the recipe's R0.
 *
 * IT IS SYNTACTIC. It parses with `ts.createSourceFile` and no type checker, so
 * it resolves `this.<dep>.<method>()` by the dependency's *written* type name: a
 * dependency typed as an interface, a token or a union is not followed, and a
 * call through a local (`const s = f(); s.get(…)`) is not attributed. It is a
 * worklist and a ratchet, not a proof. Derived from the one-shot inventory pass
 * that produced `docs/superpowers/plans/phase1-inventory.{md,json}`; Appendix C
 * there lists the same accuracy caveats in full.
 *
 * LIFETIME: Plan 4 deletes this script along with `DatabaseService` — once no
 * raw handle is left to call synchronously, there is nothing for it to count.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(HERE, '..');
const REPO = path.resolve(SERVER, '..');
const require_ = createRequire(path.join(REPO, 'package.json'));
const ts = require_('typescript');

let SRC = path.join(SERVER, 'src');

// ---------------------------------------------------------------- CLI
function parseArgs(argv) {
  const opts = { sync: false, tx: false, unawaited: false, domains: null, json: false, root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sync') opts.sync = true;
    else if (a === '--tx') opts.tx = true;
    else if (a === '--unawaited') opts.unawaited = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--domains') opts.domains = splitDomains(argv[++i]);
    else if (a.startsWith('--domains=')) opts.domains = splitDomains(a.slice('--domains='.length));
    // --root is intentionally undocumented: it exists so tests/unit/scripts/db-call-graph.test.ts
    // can point the whole analysis at a tiny sample tree instead of server/src.
    else if (a === '--root') opts.root = argv[++i];
    else if (a.startsWith('--root=')) opts.root = a.slice('--root='.length);
    else if (a === '--help' || a === '-h') opts.help = true;
    else {
      process.stderr.write(`db-call-graph: unknown argument ${a}\n`);
      opts.help = true;
      opts.bad = true;
    }
  }
  // No selector: report both --sync and --tx, which is what a task's gate wants.
  // --unawaited is never implied — it's opt-in only.
  if (!opts.sync && !opts.tx && !opts.unawaited) {
    opts.sync = true;
    opts.tx = true;
  }
  return opts;
}
function splitDomains(value) {
  if (!value) return null;
  const list = value
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  return list.length ? list : null;
}
const USAGE = `Usage: node scripts/db-call-graph.mjs [--sync] [--tx] [--unawaited] [--domains a,b,…] [--json]

  --sync           list synchronous DB-touching methods (direct + transitive)
  --tx             list real transaction call sites
  --unawaited      list calls to async methods/functions whose result is used without await
  --domains a,b    restrict to these inventory domain names (nest/days, systemNotices, …)
  --json           machine-readable output
  (no --sync/--tx/--unawaited) --sync and --tx together

Exits 1 when a requested list is non-empty. R0 exceptions (DatabaseService,
src/db/**, src/demo/**, plugins/host/plugin-data.service.ts) are never listed.
`;

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  process.stdout.write(USAGE);
  process.exit(opts.bad ? 2 : 0);
}
if (opts.root) {
  SRC = path.resolve(process.cwd(), opts.root);
}

// ---------------------------------------------------------------- file walk
function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      const r = path.relative(SRC, p).replace(/\\/g, '/');
      // Generated/declarative trees with no call graph of their own.
      if (r === 'db/migrations' || r === 'db/seeders' || r === 'db/entities' || r === 'typings') continue;
      walk(p, acc);
    } else if (ent.name.endsWith('.ts') && !ent.name.endsWith('.d.ts')) {
      const r = path.relative(SRC, p).replace(/\\/g, '/');
      if (r === 'db/migrations.ts') continue; // legacy test-only schema replay
      acc.push(p);
    }
  }
  return acc;
}
const files = walk(SRC).sort();

// ---------------------------------------------------------------- constants
const DB_METHODS = new Set(['get', 'all', 'run', 'prepare', 'transaction', 'exec', 'pragma']);
const DB_HELPERS = new Set(['canAccessTrip', 'isOwner', 'rosterUserIds', 'getPlaceWithTags']);
const DB_IDENT_NAMES = new Set(['db', 'conn', 'tx', 'database', 'dbs']);
const DB_PROP_NAMES = new Set(['db', 'database', 'dbs']);
const DB_SERVICE_TYPES = new Set(['DatabaseService']);

/** R0: the raw seam and the out-of-scope trees. See the recipe's R0. */
const R0_CLASSES = new Set(['DatabaseService']);
function isR0File(relFile) {
  return (
    relFile.startsWith('src/db/') ||
    relFile.startsWith('src/demo/') ||
    relFile === 'src/nest/plugins/host/plugin-data.service.ts'
  );
}

function relServer(p) {
  return path.relative(SERVER, p).replace(/\\/g, '/');
}

function domainOf(file) {
  const r = path.relative(SRC, file).replace(/\\/g, '/');
  if (r.startsWith('nest/')) {
    const seg = r.split('/')[1];
    return seg.includes('.') ? 'nest(root)' : `nest/${seg}`;
  }
  if (r.startsWith('nest-mcp/')) return 'nest-mcp';
  if (r.startsWith('systemNotices/')) return 'systemNotices';
  if (r.startsWith('demo/')) return 'demo';
  if (r.startsWith('mcp/')) return 'mcp';
  if (r.startsWith('middleware/')) return 'middleware';
  if (r.startsWith('db/')) return 'db';
  if (r.startsWith('app-config/')) return 'app-config';
  if (r.startsWith('utils/')) return 'utils';
  return 'src(root)';
}

// ---------------------------------------------------------------- parse pass
/** @type {Map<string, any>} className -> first record with that name */
const classes = new Map();
/** @type {any[]} */
const allClasses = [];
const txSites = [];

function lineOf(sf, node) {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function typeNameOf(typeNode) {
  if (!typeNode) return null;
  if (ts.isTypeReferenceNode(typeNode)) {
    const n = typeNode.typeName;
    return ts.isIdentifier(n) ? n.text : n.getText();
  }
  return typeNode.getText().replace(/\s+/g, ' ').slice(0, 60);
}

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, /* setParentNodes */ true, ts.ScriptKind.TS);

  // Identifiers imported from db/database denote a raw handle / helper.
  const dbDatabaseImports = new Set();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const spec = st.moduleSpecifier.text;
    const names = [];
    if (st.importClause.name) names.push(st.importClause.name.text);
    const nb = st.importClause.namedBindings;
    if (nb && ts.isNamedImports(nb)) for (const e of nb.elements) names.push(e.name.text);
    if (nb && ts.isNamespaceImport(nb)) names.push(nb.name.text);
    for (const n of names) if (/(^|\/)db\/database$/.test(spec)) dbDatabaseImports.add(n);
  }

  const fileRel = relServer(file);
  const fileDomain = domainOf(file);

  // ---- gather class-likes and module-level functions
  const containers = [];
  for (const st of sf.statements) {
    if (ts.isClassDeclaration(st) && st.name) containers.push({ kind: 'class', node: st, name: st.name.text });
  }
  const moduleFns = [];
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name && st.body) {
      moduleFns.push({
        name: st.name.text,
        node: st,
        async: !!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword),
      });
    }
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) && ts.isIdentifier(d.name)) {
          moduleFns.push({
            name: d.name.text,
            node: d.initializer,
            async: !!d.initializer.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword),
          });
        }
      }
    }
  }
  if (moduleFns.length) {
    containers.push({ kind: 'module', node: sf, name: `${path.basename(file, '.ts')} (module)`, fns: moduleFns });
  }

  for (const c of containers) {
    const deps = {}; // propName -> written type name
    const dbProps = new Set();
    const methods = [];
    let classRec;

    if (c.kind === 'class') {
      for (const m of c.node.members) {
        if (ts.isConstructorDeclaration(m)) {
          for (const p of m.parameters) {
            if (!ts.isIdentifier(p.name)) continue;
            const tn = typeNameOf(p.type);
            deps[p.name.text] = tn;
            if (DB_SERVICE_TYPES.has(tn) || DB_PROP_NAMES.has(p.name.text)) dbProps.add(p.name.text);
          }
        } else if (ts.isPropertyDeclaration(m) && ts.isIdentifier(m.name)) {
          const tn = typeNameOf(m.type);
          if (tn && !deps[m.name.text]) deps[m.name.text] = tn;
          if ((tn && DB_SERVICE_TYPES.has(tn)) || DB_PROP_NAMES.has(m.name.text)) dbProps.add(m.name.text);
        }
      }
      // `private get db() { return this.dbs.connection; }` — the alias 14 services use.
      for (const m of c.node.members) {
        if (ts.isGetAccessorDeclaration(m) && m.name && ts.isIdentifier(m.name) && m.body) {
          const stmts = m.body.statements;
          const only = stmts.length === 1 && ts.isReturnStatement(stmts[0]) ? stmts[0].expression : null;
          const aliasesDb =
            only &&
            ts.isPropertyAccessExpression(only) &&
            ((only.expression.kind === ts.SyntaxKind.ThisKeyword && dbProps.has(only.name.text)) ||
              (only.name.text === 'connection' &&
                ts.isPropertyAccessExpression(only.expression) &&
                only.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
                dbProps.has(only.expression.name.text)));
          const tn = typeNameOf(m.type);
          if (aliasesDb || (tn && DB_SERVICE_TYPES.has(tn))) {
            dbProps.add(m.name.text);
            if (!deps[m.name.text]) deps[m.name.text] = 'DatabaseService';
          }
        }
      }
      for (const m of c.node.members) {
        const mods = ts.getModifiers(m);
        if (ts.isMethodDeclaration(m) && m.name && m.body) {
          methods.push({
            name: m.name.getText(sf),
            kind: 'method',
            body: m.body,
            async: !!mods?.some((x) => x.kind === ts.SyntaxKind.AsyncKeyword),
            generator: !!m.asteriskToken, // async *foo() — consumed via `for await`/`yield*`, not `await`; see --unawaited
            line: lineOf(sf, m),
          });
        } else if (
          ts.isPropertyDeclaration(m) &&
          m.initializer &&
          (ts.isArrowFunction(m.initializer) || ts.isFunctionExpression(m.initializer)) &&
          m.name
        ) {
          methods.push({
            name: m.name.getText(sf),
            kind: 'method',
            body: m.initializer.body,
            async: !!m.initializer.modifiers?.some((x) => x.kind === ts.SyntaxKind.AsyncKeyword),
            line: lineOf(sf, m),
          });
        } else if (
          ts.isPropertyDeclaration(m) &&
          m.initializer &&
          m.name &&
          (ts.isCallExpression(m.initializer) ||
            ts.isNewExpression(m.initializer) ||
            ts.isObjectLiteralExpression(m.initializer) ||
            ts.isArrayLiteralExpression(m.initializer))
        ) {
          // e.g. `private readonly supervisor = create(fn, { onStatus: () => this.db.… })`
          methods.push({ name: m.name.getText(sf), kind: 'field-init', body: m.initializer, async: false, line: lineOf(sf, m) });
        } else if (ts.isConstructorDeclaration(m) && m.body) {
          methods.push({ name: 'constructor', kind: 'constructor', body: m.body, async: false, line: lineOf(sf, m) });
        } else if (ts.isGetAccessorDeclaration(m) && m.body && m.name) {
          methods.push({ name: m.name.getText(sf), kind: 'getter', body: m.body, async: false, line: lineOf(sf, m) });
        }
      }
      classRec = { name: c.name, kind: 'class', file: fileRel, domain: fileDomain, deps, dbProps: [...dbProps], methods: [] };
    } else {
      for (const f of c.fns) {
        methods.push({ name: f.name, kind: 'function', body: f.node.body, async: f.async, line: lineOf(sf, f.node) });
      }
      classRec = { name: c.name, kind: 'module', file: fileRel, domain: fileDomain, deps: {}, dbProps: [], methods: [] };
    }

    // ---- receiver classification
    function receiverKind(expr) {
      if (ts.isIdentifier(expr)) {
        if (dbDatabaseImports.has(expr.text)) return { text: expr.text };
        if (DB_IDENT_NAMES.has(expr.text)) return { text: expr.text };
        return null;
      }
      if (ts.isPropertyAccessExpression(expr)) {
        if (expr.expression.kind === ts.SyntaxKind.ThisKeyword && dbProps.has(expr.name.text)) {
          return { text: `this.${expr.name.text}` };
        }
        if (
          expr.name.text === 'connection' &&
          ts.isPropertyAccessExpression(expr.expression) &&
          expr.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
          dbProps.has(expr.expression.name.text)
        ) {
          return { text: `this.${expr.expression.name.text}.connection` };
        }
        if (expr.expression.kind === ts.SyntaxKind.ThisKeyword && expr.name.text === 'conn') {
          return { text: 'this.conn' };
        }
      }
      return null;
    }

    // ---- walk each method body
    for (const m of methods) {
      const dbCalls = [];
      const calls = []; // {kind:'self'|'dep', dep, depType, method}

      const visit = (node) => {
        if (node !== m.body && (ts.isClassDeclaration(node) || ts.isClassExpression(node))) return;
        if (ts.isCallExpression(node)) {
          const callee = node.expression;
          if (ts.isPropertyAccessExpression(callee)) {
            const name = callee.name.text;
            const recv = receiverKind(callee.expression);
            if (recv && (DB_METHODS.has(name) || DB_HELPERS.has(name))) {
              dbCalls.push({ recv: recv.text, method: name, line: lineOf(sf, node) });
              if (name === 'transaction') {
                txSites.push({
                  file: fileRel,
                  domain: fileDomain,
                  class: classRec.name,
                  method: m.name,
                  line: lineOf(sf, node),
                  receiver: recv.text,
                });
              }
            }
            if (callee.expression.kind === ts.SyntaxKind.ThisKeyword) {
              calls.push({ kind: 'self', method: name });
            } else if (
              ts.isPropertyAccessExpression(callee.expression) &&
              callee.expression.expression.kind === ts.SyntaxKind.ThisKeyword
            ) {
              const dep = callee.expression.name.text;
              if (Object.prototype.hasOwnProperty.call(deps, dep)) {
                calls.push({ kind: 'dep', dep, depType: deps[dep], method: name });
              }
            }
          } else if (ts.isIdentifier(callee)) {
            if (DB_HELPERS.has(callee.text) && dbDatabaseImports.has(callee.text)) {
              dbCalls.push({ recv: '(import)', method: callee.text, line: lineOf(sf, node) });
            }
            if (c.kind === 'module' && moduleFns.some((f) => f.name === callee.text)) {
              calls.push({ kind: 'self', method: callee.text });
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      if (m.body) visit(m.body);

      classRec.methods.push({
        name: m.name,
        kind: m.kind,
        line: m.line,
        async: m.async,
        generator: !!m.generator,
        dbCalls,
        dbCallCount: dbCalls.length,
        calls,
      });
    }

    allClasses.push(classRec);
    if (!classes.has(classRec.name)) classes.set(classRec.name, classRec);
  }
}

// ------------------------------------------------- transitive DB closure
const methodKey = (cls, m) => `${cls}#${m}`;
const methodIndex = new Map();
for (const c of allClasses) for (const m of c.methods) methodIndex.set(methodKey(c.name, m.name), { cls: c, m });

function calleeKeys(c, m) {
  const out = [];
  for (const call of m.calls) {
    if (call.kind === 'self') out.push(methodKey(c.name, call.method));
    else if (call.kind === 'dep' && call.depType && classes.has(call.depType)) out.push(methodKey(call.depType, call.method));
  }
  return out;
}

for (const c of allClasses) for (const m of c.methods) m.directDb = m.dbCallCount > 0;

for (const c of allClasses) {
  for (const m of c.methods) {
    const seen = new Set();
    const stack = calleeKeys(c, m).slice();
    const dbCallees = new Set();
    while (stack.length) {
      const k = stack.pop();
      if (seen.has(k)) continue;
      seen.add(k);
      const t = methodIndex.get(k);
      if (!t) continue;
      // An async callee stops the walk: neither its own DB reach nor anything further
      // behind it is attributed to the (sync) caller — that's --unawaited's job. See header.
      if (t.m.async) continue;
      if (t.m.directDb) dbCallees.add(k);
      for (const nk of calleeKeys(t.cls, t.m)) if (!seen.has(nk)) stack.push(nk);
    }
    m.transitiveDbCallees = [...dbCallees].sort();
    m.touchesDb = m.directDb || dbCallees.size > 0;
  }
}

// ------------------------------------------------- selection
const domainFilter = opts.domains ? new Set(opts.domains) : null;
const unknownDomains = domainFilter
  ? [...domainFilter].filter((d) => !allClasses.some((c) => c.domain === d) && !files.some((f) => domainOf(f) === d))
  : [];
function inScope(rec) {
  if (isR0File(rec.file) || R0_CLASSES.has(rec.name)) return false;
  if (domainFilter && !domainFilter.has(rec.domain)) return false;
  return true;
}

/** A `constructor` / field initializer / getter cannot simply become `async` — R1.3/R1.5/R1.6. */
const CANNOT_BE_ASYNC = new Set(['constructor', 'field-init']);

const syncMethods = [];
const restructureSites = [];
for (const c of allClasses) {
  if (!inScope(c)) continue;
  for (const m of c.methods) {
    if (!m.touchesDb || m.async) continue;
    const entry = {
      domain: c.domain,
      file: c.file,
      class: c.name,
      container: c.kind,
      method: m.name,
      methodKind: m.kind,
      line: m.line,
      direct: m.directDb,
      dbCallSites: m.dbCallCount,
      via: m.directDb ? [] : m.transitiveDbCallees,
    };
    if (CANNOT_BE_ASYNC.has(m.kind)) restructureSites.push(entry);
    else syncMethods.push(entry);
  }
}
const txSelected = txSites.filter((t) => {
  if (isR0File(t.file) || R0_CLASSES.has(t.class)) return false;
  if (domainFilter && !domainFilter.has(t.domain)) return false;
  return true;
});

const byDomainClass = (a, b) => a.domain.localeCompare(b.domain) || a.file.localeCompare(b.file) || a.line - b.line;
syncMethods.sort(byDomainClass);
restructureSites.sort(byDomainClass);
txSelected.sort(byDomainClass);

// ------------------------------------------------- --unawaited
/**
 * Everything below is purely syntactic (same posture as the rest of the file):
 * it classifies a call expression's *immediate* AST context, and resolves its
 * target through the `classes`/`deps` maps the main pass already built (for
 * `this.<m>` / `this.<dep>.<m>`) or a fresh per-file import map (for a plain
 * `<importedFn>(…)` call). See the header comment for exactly what it does and
 * does not see.
 */
/** Walk up through no-op-at-runtime wrappers (parens, `as`/`satisfies`, postfix `!`) and through
 *  a ternary branch (`cond ? call() : x` propagates `call()`'s result exactly like `call()` would
 *  on its own) to the expression a caller actually treats as "the call's result". */
function effectiveNode(node) {
  let n = node;
  for (;;) {
    const p = n.parent;
    if (!p) return n;
    if (ts.isParenthesizedExpression(p) || ts.isAsExpression(p) || ts.isNonNullExpression(p) || ts.isSatisfiesExpression?.(p)) {
      n = p;
      continue;
    }
    if (ts.isConditionalExpression(p) && (p.whenTrue === n || p.whenFalse === n)) {
      n = p;
      continue;
    }
    return n;
  }
}
const COMPARE_OPS = new Set([
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
]);
const LOGICAL_OPS = new Set([ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken]);
const ARROW_ALWAYS_REPORT = new Set(['filter', 'find', 'some', 'every', 'sort', 'forEach']);

/** The property/method name of a call `X.<name>(arrow)` when `arrow` is one of its arguments, else null. */
function arrowCallContext(arrow) {
  const call = arrow.parent;
  if (!call || !ts.isCallExpression(call) || !call.arguments.includes(arrow)) return null;
  const callee = call.expression;
  if (!ts.isPropertyAccessExpression(callee)) return null;
  return callee.name.text;
}
/** `eff` is (via an optional spread) a direct element of an array passed to Promise.all/allSettled/race/any. */
function isPromiseCombinatorArrayElement(eff) {
  let n = eff;
  let p = n.parent;
  if (p && ts.isSpreadElement(p)) {
    n = p;
    p = n.parent;
  }
  if (!p || !ts.isArrayLiteralExpression(p)) return false;
  const call = p.parent;
  if (!call || !ts.isCallExpression(call) || !call.arguments.includes(p)) return false;
  const callee = call.expression;
  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === 'Promise' &&
    ['all', 'allSettled', 'race', 'any'].includes(callee.name.text)
  );
}
/** True when `node`'s result is used in a way this recipe treats as already-safe. */
function isUnawaitedSkip(node) {
  const eff = effectiveNode(node);
  const parent = eff.parent;
  if (!parent) return false;
  if (ts.isAwaitExpression(parent) && parent.expression === eff) return true;
  if (ts.isReturnStatement(parent) && parent.expression === eff) return true;
  if (ts.isVoidExpression(parent) && parent.expression === eff) return true;
  // A `.then(`/`.catch(`/`.finally(` chain — including the fire-and-forget-with-.catch( shape.
  if (
    ts.isPropertyAccessExpression(parent) &&
    parent.expression === eff &&
    ['then', 'catch', 'finally'].includes(parent.name.text) &&
    parent.parent &&
    ts.isCallExpression(parent.parent) &&
    parent.parent.expression === parent
  ) {
    return true;
  }
  if (isPromiseCombinatorArrayElement(eff)) return true;
  if (ts.isArrowFunction(parent) && parent.body === eff) {
    const mc = arrowCallContext(parent);
    return !(mc && ARROW_ALWAYS_REPORT.has(mc)); // default: implicit-return-like (the `.map(` pattern) — skip
  }
  return false;
}
/** `async *foo()` returns an AsyncGenerator, not a Promise — `await` doesn't consume it (and isn't
 *  expected to); only `for await (… of call())` or a delegating `yield* call()` does. */
function isGeneratorConsumedSafely(node) {
  const eff = effectiveNode(node);
  const parent = eff.parent;
  if (!parent) return false;
  if (ts.isForOfStatement(parent) && parent.expression === eff && parent.awaitModifier) return true;
  if (ts.isYieldExpression(parent) && parent.expression === eff && parent.asteriskToken) return true;
  return false;
}
/** Reason tag for a call whose result is used without await (only called when NOT skipped). */
function classifyUnawaitedShape(node) {
  const eff = effectiveNode(node);
  const parent = eff.parent;
  if (!parent) return 'other';
  if (ts.isVariableDeclaration(parent) && parent.initializer === eff) return 'stored-then-used';
  if (ts.isPropertyAssignment(parent) && parent.initializer === eff) return 'property';
  if (ts.isBinaryExpression(parent)) {
    const op = parent.operatorToken.kind;
    if (COMPARE_OPS.has(op) && (parent.left === eff || parent.right === eff)) return 'compared';
    if (LOGICAL_OPS.has(op) && (parent.left === eff || parent.right === eff)) return 'condition';
  }
  if (ts.isIfStatement(parent) && parent.expression === eff) return 'condition';
  if (ts.isConditionalExpression(parent) && parent.condition === eff) return 'condition';
  if (ts.isWhileStatement(parent) && parent.expression === eff) return 'condition';
  if (ts.isDoStatement(parent) && parent.expression === eff) return 'condition';
  if ((ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) && parent.expression === eff) {
    return 'member';
  }
  if ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.arguments?.includes(eff)) return 'argument';
  if (ts.isExpressionStatement(parent)) return 'statement';
  if (ts.isArrowFunction(parent) && parent.body === eff) {
    const mc = arrowCallContext(parent);
    if (mc && ['filter', 'find', 'some', 'every'].includes(mc)) return 'condition'; // predicate result discarded
    if (mc === 'forEach') return 'statement'; // return value discarded, same as an expression statement
  }
  return 'other';
}

function collectExportedFnAsyncness(sf) {
  const out = new Map(); // name -> { async, generator }
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name && st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      out.set(st.name.text, {
        async: !!st.modifiers.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword),
        generator: !!st.asteriskToken,
      });
    } else if (ts.isVariableStatement(st) && st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const d of st.declarationList.declarations) {
        if (
          d.initializer &&
          (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) &&
          ts.isIdentifier(d.name)
        ) {
          out.set(d.name.text, {
            async: !!d.initializer.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword),
            // Arrow functions can't be generators; a function expression can (`async function* () {}`).
            generator: ts.isFunctionExpression(d.initializer) ? !!d.initializer.asteriskToken : false,
          });
        }
      }
    }
  }
  return out;
}
/** Resolve a relative import specifier to a `.ts` file (or its `index.ts`) under the tree, else null. */
function resolveModuleFile(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null; // node_modules / path-mapped — not "a file under src/"
  const base = path.resolve(path.dirname(fromFile), specifier);
  for (const cand of [`${base}.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
  }
  return null;
}
/** Nearest enclosing function-like body of `node`, or null (e.g. a class-field initializer). */
function findEnclosingFunctionBody(node) {
  let n = node.parent;
  while (n) {
    if (
      ts.isFunctionDeclaration(n) ||
      ts.isFunctionExpression(n) ||
      ts.isArrowFunction(n) ||
      ts.isMethodDeclaration(n) ||
      ts.isGetAccessorDeclaration(n) ||
      ts.isSetAccessorDeclaration(n) ||
      ts.isConstructorDeclaration(n)
    ) {
      return n.body ?? null;
    }
    n = n.parent;
  }
  return null;
}
/**
 * `const x = this.asyncMethod()` is only safe when *every* later read of `x` in its
 * declaring function is itself one of the safe shapes `isUnawaitedSkip` recognizes
 * (`await x`, `return x`, `Promise.all([x, …])`, …) — the in-flight/memoized-promise
 * pattern (`this.inFlight.set(url, task); … return await task;`). Matches by name
 * within the enclosing function body only (no real scope/shadowing analysis — see
 * the header's limits); a variable this can't find a later read for is reported,
 * same as the declaration-only heuristic would.
 */
function isVariableUsedSafely(declNode, varName) {
  const scopeBody = findEnclosingFunctionBody(declNode);
  if (!scopeBody) return false;
  let sawReference = false;
  let allSafe = true;
  const visit = (node) => {
    if (ts.isIdentifier(node) && node.text === varName && node !== declNode.name) {
      const p = node.parent;
      const isBindingOrPropertyName =
        (ts.isVariableDeclaration(p) && p.name === node) ||
        (ts.isParameter(p) && p.name === node) ||
        (ts.isBindingElement(p) && p.name === node) ||
        (ts.isPropertyAccessExpression(p) && p.name === node);
      if (!isBindingOrPropertyName) {
        sawReference = true;
        if (!isUnawaitedSkip(node)) allSafe = false;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(scopeBody);
  return sawReference && allSafe;
}

function classMemberBodies(classNode, sf) {
  const out = [];
  for (const m of classNode.members) {
    if (ts.isMethodDeclaration(m) && m.name && m.body) {
      out.push({ name: m.name.getText(sf), body: m.body });
    } else if (
      ts.isPropertyDeclaration(m) &&
      m.initializer &&
      (ts.isArrowFunction(m.initializer) || ts.isFunctionExpression(m.initializer)) &&
      m.name
    ) {
      out.push({ name: m.name.getText(sf), body: m.initializer.body });
    } else if (ts.isConstructorDeclaration(m) && m.body) {
      out.push({ name: 'constructor', body: m.body });
    } else if (ts.isGetAccessorDeclaration(m) && m.body && m.name) {
      out.push({ name: m.name.getText(sf), body: m.body });
    }
  }
  return out;
}

let unawaitedFindings = [];
if (opts.unawaited) {
  const exportedFnsByFile = new Map();
  const parsed = new Map(); // file -> {sf, text}
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    parsed.set(file, sf);
    exportedFnsByFile.set(file, collectExportedFnAsyncness(sf));
  }

  function resolveCallTarget(node, classRec, selfAsyncByName, importMap) {
    const callee = node.expression;
    if (ts.isPropertyAccessExpression(callee)) {
      const methodName = callee.name.text;
      const obj = callee.expression;
      if (obj.kind === ts.SyntaxKind.ThisKeyword) {
        const self = selfAsyncByName?.get(methodName);
        if (self) return { desc: `this.${methodName}`, async: self.async, generator: self.generator };
        return null;
      }
      if (ts.isPropertyAccessExpression(obj) && obj.expression.kind === ts.SyntaxKind.ThisKeyword) {
        const dep = obj.name.text;
        const depType = classRec?.deps?.[dep];
        const depClass = depType ? classes.get(depType) : null;
        const m = depClass?.methods.find((mm) => mm.name === methodName);
        if (m) return { desc: `this.${dep}.${methodName}`, async: m.async, generator: !!m.generator };
      }
      return null;
    }
    if (ts.isIdentifier(callee)) {
      const imp = importMap.get(callee.text);
      if (!imp) return null;
      const asyncMap = exportedFnsByFile.get(imp.file);
      const entry = asyncMap?.get(imp.imported);
      if (!entry) return null;
      return { desc: `import:${callee.text}`, async: entry.async, generator: entry.generator };
    }
    return null;
  }

  for (const file of files) {
    const relFile = relServer(file);
    if (isR0File(relFile)) continue;
    const fileDomain = domainOf(file);
    if (domainFilter && !domainFilter.has(fileDomain)) continue;

    const sf = parsed.get(file);
    const importMap = new Map();
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st) || !st.importClause || !ts.isStringLiteral(st.moduleSpecifier)) continue;
      const targetFile = resolveModuleFile(file, st.moduleSpecifier.text);
      if (!targetFile) continue;
      const clause = st.importClause;
      const nb = clause.namedBindings;
      if (nb && ts.isNamedImports(nb)) {
        for (const el of nb.elements) {
          importMap.set(el.name.text, { file: targetFile, imported: el.propertyName ? el.propertyName.text : el.name.text });
        }
      }
      // A default import's local name can't be matched against a named-export map — not resolved (see header).
    }

    const record = (node, className, methodName) => {
      const target = resolveCallTarget(node, className.classRec, className.selfAsyncByName, importMap);
      if (!target || !target.async) return;
      if (target.generator ? isGeneratorConsumedSafely(node) : isUnawaitedSkip(node)) return;
      const reason = classifyUnawaitedShape(node);
      if (reason === 'stored-then-used') {
        const declNode = effectiveNode(node).parent;
        if (
          ts.isVariableDeclaration(declNode) &&
          ts.isIdentifier(declNode.name) &&
          isVariableUsedSafely(declNode, declNode.name.text)
        ) {
          return; // every later read is already await'd / returned / combined — the in-flight-promise pattern
        }
      }
      const text = node.getText(sf).replace(/\s+/g, ' ').trim();
      unawaitedFindings.push({
        domain: fileDomain,
        file: relFile,
        class: className.name,
        method: methodName,
        line: lineOf(sf, node),
        call: text.length > 100 ? `${text.slice(0, 97)}...` : text,
        target: target.desc,
        reason,
      });
    };

    for (const st of sf.statements) {
      if (!ts.isClassDeclaration(st) || !st.name) continue;
      const className = st.name.text;
      const classRec = allClasses.find((c) => c.file === relFile && c.name === className);
      if (!classRec || R0_CLASSES.has(className)) continue;
      const selfAsyncByName = new Map();
      for (const m of classRec.methods) {
        if (!selfAsyncByName.has(m.name)) selfAsyncByName.set(m.name, { async: m.async, generator: !!m.generator });
      }
      const ctx = { name: className, classRec, selfAsyncByName };

      for (const member of classMemberBodies(st, sf)) {
        const visit = (node) => {
          if (node !== member.body && (ts.isClassDeclaration(node) || ts.isClassExpression(node))) return;
          if (ts.isCallExpression(node)) record(node, ctx, member.name);
          ts.forEachChild(node, visit);
        };
        visit(member.body);
      }
    }

    // Module-level function bodies: only `<importedFn>(…)` calls apply (there is no `this`).
    const moduleCtx = { name: `${path.basename(file, '.ts')} (module)`, classRec: null, selfAsyncByName: null };
    const moduleFnBodies = [];
    for (const st of sf.statements) {
      if (ts.isFunctionDeclaration(st) && st.name && st.body) moduleFnBodies.push({ name: st.name.text, body: st.body });
      if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) && ts.isIdentifier(d.name)) {
            moduleFnBodies.push({ name: d.name.text, body: d.initializer.body });
          }
        }
      }
    }
    for (const fn of moduleFnBodies) {
      const visit = (node) => {
        if (ts.isCallExpression(node)) record(node, moduleCtx, fn.name);
        ts.forEachChild(node, visit);
      };
      visit(fn.body);
    }
  }

  unawaitedFindings.sort(
    (a, b) => a.domain.localeCompare(b.domain) || a.file.localeCompare(b.file) || a.line - b.line,
  );
}

// ------------------------------------------------- output
const out = [];
function group(entries, key) {
  const m = new Map();
  for (const e of entries) {
    const k = key(e);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(e);
  }
  return m;
}

if (opts.json) {
  out.push(
    JSON.stringify(
      {
        scope: {
          domains: opts.domains ?? 'all',
          r0Exceptions: ['DatabaseService', 'src/db/**', 'src/demo/**', 'src/nest/plugins/host/plugin-data.service.ts'],
        },
        syncDbMethods: opts.sync ? syncMethods : undefined,
        syncDbMethodCount: opts.sync ? syncMethods.length : undefined,
        cannotBeAsync: opts.sync ? restructureSites : undefined,
        transactionSites: opts.tx ? txSelected : undefined,
        transactionSiteCount: opts.tx ? txSelected.length : undefined,
        unawaitedCalls: opts.unawaited ? unawaitedFindings : undefined,
        unawaitedCallCount: opts.unawaited ? unawaitedFindings.length : undefined,
        unknownDomains,
      },
      null,
      2,
    ),
  );
} else {
  if (unknownDomains.length) {
    out.push(`! no such domain: ${unknownDomains.join(', ')} (names come from the inventory, e.g. nest/days, systemNotices)`);
    out.push('');
  }
  if (opts.sync) {
    const scope = opts.domains ? opts.domains.join(', ') : 'all domains';
    if (!syncMethods.length) {
      out.push(`sync DB-touching methods: none (${scope})`);
    } else {
      const direct = syncMethods.filter((e) => e.direct).length;
      out.push(
        `sync DB-touching methods: ${syncMethods.length} (${direct} direct, ${syncMethods.length - direct} transitive) in ${scope}`,
      );
      for (const [k, entries] of group(syncMethods, (e) => `${e.domain}\u0000${e.file}\u0000${e.class}`)) {
        const [domain, file, cls] = k.split('\u0000');
        const d = entries.filter((e) => e.direct).length;
        out.push('');
        out.push(`  ${domain} · ${cls} · ${file}  (${d} direct, ${entries.length - d} transitive)`);
        for (const e of entries) {
          const detail = e.direct ? `${e.dbCallSites} db call site${e.dbCallSites === 1 ? '' : 's'}` : `via ${e.via.join(', ')}`;
          out.push(`    ${String(e.line).padStart(5)}  ${e.method}  —  ${detail}`);
        }
      }
    }
    if (restructureSites.length) {
      out.push('');
      out.push(`  note: ${restructureSites.length} sync DB context(s) that cannot simply become async (recipe R1.5/R1.6 —`);
      out.push('  restructure, or call an async helper with `void h().catch(…)`); not counted, not gating:');
      for (const e of restructureSites) out.push(`    ${e.file}:${e.line}  ${e.class}.${e.method} (${e.methodKind})`);
    }
  }
  if (opts.tx) {
    if (opts.sync) out.push('');
    const scope = opts.domains ? opts.domains.join(', ') : 'all domains';
    if (!txSelected.length) {
      out.push(`transaction sites: none (${scope})`);
    } else {
      out.push(`transaction sites: ${txSelected.length} in ${scope}`);
      for (const t of txSelected) {
        out.push(`  ${t.file}:${t.line}  ${t.class}.${t.method}  —  ${t.receiver}.transaction(`);
      }
    }
  }
  if (opts.unawaited) {
    if (opts.sync || opts.tx) out.push('');
    const scope = opts.domains ? opts.domains.join(', ') : 'all domains';
    if (!unawaitedFindings.length) {
      out.push(`unawaited async call sites: none (${scope})`);
    } else {
      out.push(`unawaited async call sites: ${unawaitedFindings.length} in ${scope}`);
      const byReason = group(unawaitedFindings, (e) => e.reason);
      const reasonOrder = ['stored-then-used', 'argument', 'property', 'condition', 'compared', 'member', 'statement', 'other'];
      const reasonSummary = reasonOrder
        .filter((r) => byReason.has(r))
        .map((r) => `${r}=${byReason.get(r).length}`)
        .join(', ');
      out.push(`  by reason: ${reasonSummary}`);
      for (const [k, entries] of group(unawaitedFindings, (e) => `${e.domain}\u0000${e.file}\u0000${e.class}`)) {
        const [domain, file, cls] = k.split('\u0000');
        out.push('');
        out.push(`  ${domain} · ${cls} · ${file}`);
        for (const e of entries) {
          out.push(`    ${String(e.line).padStart(5)}  [${e.reason}]  ${e.method}  —  ${e.call}  (→ ${e.target})`);
        }
      }
    }
  }
}

process.stdout.write(out.join('\n') + '\n');

const found =
  (opts.sync && syncMethods.length > 0) ||
  (opts.tx && txSelected.length > 0) ||
  (opts.unawaited && unawaitedFindings.length > 0);
process.exit(found ? 1 : 0);
