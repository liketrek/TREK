#!/usr/bin/env node
/*
 * lint:tx: a method that writes more than once must do it inside one transaction.
 *
 * A crash or a thrown error between two writes leaves half a change behind (a
 * journey without its owner row, a reservation whose budget line was not
 * updated). The rule in server/CLAUDE.md is that a multi-statement write runs
 * in `await this.uow.transactional(...)`; this script finds the methods that
 * do not, as far as a static read of the source can.
 *
 * HOW IT COUNTS
 *   Every class under src/ is read with the TypeScript parser. A repository
 *   method (src/db/repositories/) is a write when it builds an INSERT, UPDATE
 *   or DELETE (insertInto/updateTable/deleteFrom, nativeInsert/nativeUpdate/
 *   nativeDelete, insert/insertMany/upsert/upsertMany, a query builder's
 *   update/delete, flush, or a raw SQL string that starts with a write verb),
 *   directly or through another method of its own class.
 *
 *   A method's "write units" are then counted over its body:
 *     - a call to a write, on a constructor-injected field (`this.trips.x()`)
 *       or on its own class (`this.x()`), is one unit;
 *     - a `.transactional(...)` call that holds any write is one unit, however
 *       many writes it holds;
 *     - a call to a method of another class that is itself reported counts as
 *       one unit here (the fault is reported once, where it lives);
 *     - a write inside a loop, or inside a callback handed to forEach/map/
 *       reduce and friends, counts twice (it can run any number of times);
 *     - of two branches (if/else, a ternary, the cases of a switch, an `if`
 *       that returns or throws against the rest of its block) only the larger
 *       one counts, since only one of them runs.
 *   A method tagged `@txStandalone` in its JSDoc (an audit row, a notification,
 *   a failure record, an idempotent lazy provision, a non-fatal derived refresh)
 *   adds no unit to its callers; the tag says why in its text. A method tagged
 *   `@txIndependent` (writes that are each complete on their own on purpose,
 *   such as a retention sweep in passes or a sync with network I/O between its
 *   writes) is not reported itself.
 *   A method holding two or more units is reported, unless every call to it
 *   that the script can resolve sits inside a `.transactional(...)` callback or
 *   in a method that is itself only ever called that way (a helper that runs
 *   inside its callers' transaction).
 *
 * WHAT IT CANNOT SEE
 *   A local helper (`const f = async () => ...` inside the method) is counted
 *   where it is called, not where it is declared.
 *   Calls through anything but `this.<field>.<method>()`, `this.<method>()` and
 *   such a local helper (a free function, a value passed in as an argument, a
 *   dynamic dispatch) are not followed, and a write after network I/O that cannot share a
 *   transaction with it is still reported: those entries stay in the baseline.
 *
 * THE RATCHET
 *   scripts/tx-writes-baseline.json holds today's reported methods with their
 *   unit count. A method not in it fails, and so does one past its count. An
 *   entry above what its method holds now, or for a method that is no longer
 *   reported, fails too until --update lowers or drops it, so a fixed method
 *   cannot quietly regress.
 *
 *   npm run lint:tx              check against the baseline (CI)
 *   npm run lint:tx -- --update  lower the baseline to what the code holds now;
 *                                it never raises or adds an entry
 *   npm run lint:tx -- --list    print every reported method with its count
 *   npm run lint:tx -- --explain the same, with the line of each call that counted
 *
 * --dir=<path> points the check at another server root (the unit tests use it).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require_ = createRequire(import.meta.url);
const ts = require_('typescript');

const SOURCE = /\.ts$/;
const SKIP = /\.(?:test|spec|d)\.ts$/;
const REPOSITORY_DIR = 'src/db/repositories/';

/** Calls that issue a write wherever a repository makes them. */
const WRITE_CALLS = new Set([
  'insertInto',
  'updateTable',
  'deleteFrom',
  'replaceInto',
  'nativeInsert',
  'nativeUpdate',
  'nativeDelete',
  'insert',
  'insertMany',
  'upsert',
  'upsertMany',
  'update',
  'delete',
  'truncate',
  'flush',
  'persistAndFlush',
  'removeAndFlush',
]);

/** The base-class writes a service may call on a repository field directly. */
const BASE_WRITES = new Set([
  'nativeInsert',
  'nativeUpdate',
  'nativeDelete',
  'insert',
  'insertMany',
  'upsert',
  'upsertMany',
]);

/**
 * A method whose JSDoc carries this tag writes something that stands on its own,
 * whatever its caller does around it: an audit row, a notification, a failure
 * record, an idempotent lazy provision, a non-fatal derived refresh. Its calls
 * add no unit to the caller. The method's own body is still counted.
 */
export const STANDALONE_TAG = 'txStandalone';

/**
 * A method whose JSDoc carries this tag writes in steps that are each complete
 * on their own on purpose: a retention sweep that deletes in passes, a sync
 * whose network round trips sit between its writes, one transaction per item
 * of a batch. It is not reported; the tag's text says why.
 */
export const INDEPENDENT_TAG = 'txIndependent';

const RAW_WRITE = /^\s*(?:INSERT|UPDATE|DELETE|REPLACE)\b/i;

/** Array methods that run their callback once per element. */
const LOOP_CALLBACKS = new Set(['forEach', 'map', 'flatMap', 'filter', 'reduce', 'some', 'every', 'find', 'findIndex']);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (SOURCE.test(name) && !SKIP.test(name)) files.push(path);
  }
  return files;
}

function nameOf(node) {
  return node && node.name && (ts.isIdentifier(node.name) || ts.isPrivateIdentifier(node.name)) ? node.name.text : null;
}

/** The class a type annotation names: `FooRepository`, `Foo | undefined`, `Readonly<Foo>` all give `Foo...`. */
function typeName(type) {
  if (!type) return null;
  if (ts.isTypeReferenceNode(type)) {
    const n = type.typeName;
    return ts.isIdentifier(n) ? n.text : n.right.text;
  }
  if (ts.isUnionTypeNode(type)) {
    for (const t of type.types) {
      const found = typeName(t);
      if (found) return found;
    }
  }
  return null;
}

/** Every class in the tree, with its methods and the classes its constructor injects. */
export function collect(serverDir) {
  const srcDir = join(serverDir, 'src');
  if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) {
    throw new Error(`src/ does not exist under ${serverDir}: the check would pass without looking at anything`);
  }
  const classes = new Map();
  for (const path of walk(srcDir)) {
    const file = relative(serverDir, path).split('\\').join('/');
    const sf = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const cls = {
          name: node.name.text,
          file,
          repository: file.startsWith(REPOSITORY_DIR),
          fields: new Map(),
          methods: new Map(),
          standalone: new Set(),
          independent: new Set(),
        };
        for (const member of node.members) {
          if (ts.isConstructorDeclaration(member)) {
            for (const p of member.parameters) {
              const field = ts.isIdentifier(p.name) ? p.name.text : null;
              const type = typeName(p.type);
              if (field && type) cls.fields.set(field, type);
            }
          } else if (ts.isPropertyDeclaration(member) && member.initializer && ts.isArrowFunction(member.initializer)) {
            const method = nameOf(member);
            if (method) cls.methods.set(method, member.initializer);
          } else if (ts.isPropertyDeclaration(member)) {
            const field = nameOf(member);
            const type = typeName(member.type);
            if (field && type) cls.fields.set(field, type);
          } else if (ts.isMethodDeclaration(member) && member.body) {
            const method = nameOf(member);
            if (method) cls.methods.set(method, member);
            const tags = method ? ts.getJSDocTags(member).map((tag) => tag.tagName.text) : [];
            if (tags.includes(STANDALONE_TAG)) cls.standalone.add(method);
            if (tags.includes(INDEPENDENT_TAG)) cls.independent.add(method);
          }
        }
        // Two classes of one name: keep the first; the second is reached by no field type.
        if (!classes.has(cls.name)) classes.set(cls.name, cls);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return classes;
}

/** `this.x` → 'x', `this.#x` → '#x', otherwise null. */
function thisMember(expr) {
  if (ts.isPropertyAccessExpression(expr) && expr.expression.kind === ts.SyntaxKind.ThisKeyword) return expr.name.text;
  return null;
}

function exits(stmt) {
  if (!stmt) return false;
  if (ts.isReturnStatement(stmt) || ts.isThrowStatement(stmt)) return true;
  if (ts.isBlock(stmt)) return stmt.statements.length > 0 && exits(stmt.statements[stmt.statements.length - 1]);
  if (ts.isIfStatement(stmt)) return exits(stmt.thenStatement) && exits(stmt.elseStatement);
  return false;
}

export function analyse(classes) {
  const units = new Map(); // "Class.method" → number
  const inProgress = new Set();
  const callSites = new Map(); // "Class.method" → [{ caller, covered }]
  const reading = []; // the "Class.method" whose body is being read
  const sites = new Map(); // "Class.method" → the calls that added a unit, for --explain
  const frames = [];
  const locals = []; // per method read: local `const f = async () => ...` helpers, counted where they are called
  const running = new Set();

  /** Records the call that added a unit to the method being read, and returns that unit. */
  function unit(node, label) {
    const sf = node.getSourceFile();
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    frames[frames.length - 1]?.push(`${line}: ${label}`);
    return 1;
  }

  /** What `callee` is: { cls, method } on a known class, a base write, or null. */
  function resolve(cls, callee) {
    if (!ts.isPropertyAccessExpression(callee)) return null;
    const method = callee.name.text;
    const own = thisMember(callee);
    if (own !== null) return cls.methods.has(own) ? { cls, method: own } : null;
    const field = thisMember(callee.expression);
    if (field === null) return null;
    const target = classes.get(cls.fields.get(field));
    if (!target) return null;
    if (target.methods.has(method)) return { cls: target, method };
    if (target.repository && BASE_WRITES.has(method)) return { write: true };
    return null;
  }

  function directWrite(cls, call) {
    if (!cls.repository) return false;
    const callee = call.expression;
    if (ts.isPropertyAccessExpression(callee) && WRITE_CALLS.has(callee.name.text)) {
      // `this.update(...)` on a repository's own method is resolved as a call instead.
      if (callee.expression.kind === ts.SyntaxKind.ThisKeyword && cls.methods.has(callee.name.text)) return false;
      return true;
    }
    const first = call.arguments[0];
    return Boolean(
      first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) && RAW_WRITE.test(first.text),
    );
  }

  /** Write units of `node`, read inside `cls`. `covered` is true inside a transactional callback. */
  function count(cls, node, covered) {
    if (!node) return 0;
    if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) return 0;
    if (ts.isBlock(node) || ts.isSourceFile(node) || ts.isModuleBlock(node))
      return statements(cls, node.statements, 0, covered);
    if (ts.isIfStatement(node)) {
      return (
        count(cls, node.expression, covered) +
        Math.max(count(cls, node.thenStatement, covered), count(cls, node.elseStatement, covered))
      );
    }
    if (ts.isConditionalExpression(node)) {
      return (
        count(cls, node.condition, covered) +
        Math.max(count(cls, node.whenTrue, covered), count(cls, node.whenFalse, covered))
      );
    }
    if (ts.isSwitchStatement(node)) {
      let max = 0;
      for (const clause of node.caseBlock.clauses) max = Math.max(max, statements(cls, clause.statements, 0, covered));
      return count(cls, node.expression, covered) + max;
    }
    if (
      ts.isForStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node)
    ) {
      let head = 0;
      if (ts.isForStatement(node)) head = count(cls, node.initializer, covered);
      else if (!ts.isDoStatement(node) && !ts.isWhileStatement(node)) head = count(cls, node.expression, covered);
      return head + 2 * count(cls, node.statement, covered);
    }
    if (ts.isCallExpression(node)) return call(cls, node, covered);
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) {
      locals[locals.length - 1].set(node.name.text, node.initializer.body);
      return 0;
    }
    let total = 0;
    ts.forEachChild(node, (child) => {
      total += count(cls, child, covered);
    });
    return total;
  }

  /** A block read statement by statement: an `if` that always leaves competes with the rest of the block. */
  function statements(cls, list, from, covered) {
    let total = 0;
    for (let i = from; i < list.length; i++) {
      const stmt = list[i];
      if (ts.isIfStatement(stmt) && !stmt.elseStatement && exits(stmt.thenStatement)) {
        const rest = statements(cls, list, i + 1, covered);
        return total + count(cls, stmt.expression, covered) + Math.max(count(cls, stmt.thenStatement, covered), rest);
      }
      total += count(cls, stmt, covered);
    }
    return total;
  }

  function call(cls, node, covered) {
    const callee = node.expression;
    const method = ts.isPropertyAccessExpression(callee) ? callee.name.text : null;
    const receiver = ts.isPropertyAccessExpression(callee)
      ? count(cls, callee.expression, covered)
      : count(cls, callee, covered);
    if (method === 'transactional') {
      let inner = 0;
      frames.push([]); // what runs inside is one unit, not a list of its own
      for (const arg of node.arguments) inner += count(cls, arg, true);
      frames.pop();
      return receiver + (inner > 0 ? unit(node, 'transactional(...)') : 0);
    }
    let args = 0;
    for (const arg of node.arguments) args += count(cls, arg, covered);
    if (method && LOOP_CALLBACKS.has(method)) args *= 2;
    const local = ts.isIdentifier(callee) ? callee.text : null;
    const helper = local !== null ? locals[locals.length - 1].get(local) : undefined;
    if (helper && !running.has(helper)) {
      running.add(helper);
      const inner = count(cls, helper, covered);
      running.delete(helper);
      return receiver + args + inner;
    }
    const text = ts.isPropertyAccessExpression(callee) ? callee.getText().replace(/\s+/g, '') : method;
    if (directWrite(cls, node)) return receiver + args + unit(node, text);
    const target = resolve(cls, callee);
    if (!target) return receiver + args;
    if (target.write) return receiver + args + unit(node, text);
    if (target.cls.standalone.has(target.method)) return receiver + args;
    const key = `${target.cls.name}.${target.method}`;
    const list = callSites.get(key) ?? [];
    list.push({ caller: reading[reading.length - 1], covered });
    callSites.set(key, list);
    return receiver + args + (unitsOf(target.cls, target.method) > 0 ? unit(node, text) : 0);
  }

  function unitsOf(cls, method) {
    const key = `${cls.name}.${method}`;
    if (units.has(key)) return units.get(key);
    if (inProgress.has(key)) return 0; // recursion: the outer frame counts the body once
    inProgress.add(key);
    const fn = cls.methods.get(method);
    frames.push([]);
    locals.push(new Map());
    reading.push(key);
    const n = count(cls, fn.body, false);
    reading.pop();
    locals.pop();
    sites.set(key, frames.pop());
    inProgress.delete(key);
    units.set(key, n);
    return n;
  }

  for (const cls of classes.values()) for (const method of cls.methods.keys()) unitsOf(cls, method);

  // Bound to a transaction: called at least once, and every call either sits in a
  // transactional callback or comes from a method that is bound itself. Grown from
  // nothing to a fixed point, so a cycle of methods calling each other binds none.
  const bound = new Set();
  for (let grew = true; grew;) {
    grew = false;
    for (const [key, list] of callSites) {
      if (bound.has(key) || list.length === 0) continue;
      if (list.every((site) => site.covered || bound.has(site.caller))) {
        bound.add(key);
        grew = true;
      }
    }
  }

  const reported = {};
  const explained = {};
  for (const cls of classes.values()) {
    for (const method of cls.methods.keys()) {
      const key = `${cls.name}.${method}`;
      const n = units.get(key);
      if (n < 2) continue;
      if (bound.has(key) || cls.independent.has(method)) continue;
      reported[`${cls.file}#${key}`] = n;
      explained[`${cls.file}#${key}`] = sites.get(key);
    }
  }
  return {
    found: Object.fromEntries(Object.entries(reported).sort(([a], [b]) => a.localeCompare(b))),
    sites: explained,
  };
}

/** The baseline as committed. Missing or malformed stops the run instead of reading as empty. */
export function readBaseline(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`scripts/tx-writes-baseline.json cannot be read: ${err.message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('scripts/tx-writes-baseline.json must be an object of methods to write counts');
  }
  for (const [key, n] of Object.entries(parsed)) {
    if (!Number.isInteger(n) || n < 2) {
      throw new Error(
        `scripts/tx-writes-baseline.json: ${key} holds ${JSON.stringify(n)}, expected an integer of at least 2`,
      );
    }
  }
  return parsed;
}

/** The baseline lowered to what the code holds now. Never raises an entry, never adds one. */
export function lowerBaseline(baseline, found) {
  const lowered = {};
  for (const [key, allowed] of Object.entries(baseline)) {
    if (key in found) lowered[key] = Math.min(allowed, found[key]);
  }
  return Object.fromEntries(Object.entries(lowered).sort(([a], [b]) => a.localeCompare(b)));
}

export function compare(baseline, found) {
  const grown = Object.entries(found).filter(([key, n]) => n > (baseline[key] ?? 1));
  const lowered = lowerBaseline(baseline, found);
  const stale = Object.entries(baseline).filter(([key, n]) => lowered[key] !== n);
  return { grown, stale };
}

function main(argv) {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const serverDir = dirArg ? resolve(dirArg.slice('--dir='.length)) : fileURLToPath(new URL('..', import.meta.url));
  const baselinePath = join(serverDir, 'scripts', 'tx-writes-baseline.json');

  const { found, sites } = analyse(collect(serverDir));
  if (argv.includes('--list') || argv.includes('--explain')) {
    for (const [key, n] of Object.entries(found)) {
      console.log(`${n}\t${key}`);
      if (argv.includes('--explain')) for (const site of sites[key]) console.log(`\t\t${site}`);
    }
    return 0;
  }
  let baseline = readBaseline(baselinePath);
  if (argv.includes('--update')) {
    baseline = lowerBaseline(baseline, found);
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  }

  const { grown, stale } = compare(baseline, found);
  for (const [key, n] of grown) {
    const entry = baseline[key];
    console.error(
      `FAIL  ${key}: ${n} writes outside one transaction` +
        (entry ? `, its baseline is ${entry}. ` : '. ') +
        'Wrap the sequence in await this.uow.transactional(...) in the service.',
    );
  }
  for (const [key, entry] of stale) {
    console.error(
      `FAIL  ${key} is held at ${entry} in scripts/tx-writes-baseline.json, ` +
        (key in found ? `but it has ${found[key]} now.` : 'but it is no longer reported.'),
    );
  }
  if (stale.length) {
    console.error('Run npm run lint:tx -- --update to lower the baseline with the change that fixed it.');
  }
  console.log(
    `tx: ${Object.keys(found).length} method(s) with writes outside one transaction, ${Object.keys(baseline).length} held at their baseline`,
  );
  return grown.length || stale.length ? 1 : 0;
}

const isCli =
  Boolean(process.argv[1]) &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exitCode = 1;
  }
}
