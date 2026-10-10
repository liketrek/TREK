#!/usr/bin/env node
/*
 * lint:boundaries: the server's import graph may only get cleaner.
 *
 * Nest resolves a module's `imports` array while the file is still loading, so
 * an import cycle shows up at runtime as "imports[1] is undefined" (see
 * src/nest/storage/storage.module.ts), and every new reach into another
 * domain's internals is one more place a split has to untangle later. Both
 * were held only by review. This walks every .ts file under src/ with the
 * TypeScript parser and checks five rules against scripts/import-boundaries-baseline.json:
 *
 *   fileCycles      a runtime import edge between two files that sit on the
 *                   same cycle. Type-only imports and lazy ones (import(),
 *                   a require() inside a function) are erased or deferred, so
 *                   they cannot take part in a load-time cycle and are skipped.
 *                   So are the imports of src/db/entities/: MikroORM relations
 *                   point both ways by design and are read through `() => X`
 *                   thunks after every file has loaded.
 *   domainCycles    the same, between src/nest/<domain> folders: domain A
 *                   imports from B while B (directly or through others)
 *                   imports from A. Keyed by the domain pair, so a further
 *                   import along a dependency that already exists is not new;
 *                   a new dependency between two domains of the same cycle is.
 *                   The shared kernel folders are left out here and held by
 *                   the next rule instead.
 *   sharedImportsDomain
 *                   a file of the shared kernel (src/nest/common, database,
 *                   app-config, auth-core), which every domain imports,
 *                   importing from a domain. That ties the domain into every other one.
 *   domainInternals a file in src/nest/<A>/ importing (value or type) a
 *                   file of src/nest/<B>/ that is not B's public surface.
 *                   Public is what the codebase already treats that way: the
 *                   *.module, *.service, *.guard, *.decorator, *.types,
 *                   *.interface, *.contract, *.constants and *.logger files,
 *                   the shared kernel folders (common, database, app-config)
 *                   and the few entry points in PUBLIC_FILES. Keyed by the
 *                   importing domain, so moving a file inside A changes nothing.
 *   dbImportsNest   a file under src/db/ importing from src/nest/. The data
 *                   layer sits below the domains, never the other way round.
 *   foreignRepositories
 *                   a class in src/nest/<A>/ injecting (@InjectRepository) the
 *                   repository of an entity another domain owns. Ownership is
 *                   the map in scripts/repository-owners.json (entity class ->
 *                   owning domain folder); an injected entity missing from it
 *                   stops the run. Keyed by domain and entity, so a second
 *                   injection of an entity the domain already reads is not new.
 *                   Asking the owner instead (a service such as
 *                   trip-membership's TripAccessService) is what shrinks it.
 *   providersImportOrchestrator
 *                   a file under a providers/ folder of src/nest/<A>/
 *                   importing (value or type) A's own orchestrator,
 *                   nest/<A>/<A>.service.ts, or MapsService from any domain.
 *                   A provider knows how to ask one source; which source
 *                   answers is the orchestrator's decision, so the dependency
 *                   only ever points from the orchestrator to its providers.
 *
 * Each rule's baseline lists today's violations. A violation not in it fails
 * the check, and so does an entry that no longer occurs, until --update drops
 * it: a stale entry would let the same violation back in unseen.
 *
 *   npm run lint:boundaries              check against the baseline (CI)
 *   npm run lint:boundaries -- --update  drop the entries that no longer occur;
 *                                        it never adds one
 *
 * --dir=<path> points the check at another server root (the unit tests use it).
 */
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

export const RULES = ['fileCycles', 'domainCycles', 'sharedImportsDomain', 'domainInternals', 'dbImportsNest', 'foreignRepositories', 'providersImportOrchestrator'];

/**
 * Folders under src/nest whose every file is shared infrastructure, open to all domains.
 * auth-core holds the request-auth primitives (the guards, the decorators, JWT
 * verification, ephemeral tokens) every controller needs; it imports no domain.
 */
export const SHARED_DOMAINS = new Set(['common', 'database', 'app-config', 'auth-core']);

/** File name suffixes that make up a domain's public surface. */
export const PUBLIC_SUFFIXES = [
  '.module.ts',
  '.service.ts',
  '.guard.ts',
  '.decorator.ts',
  '.types.ts',
  '.interface.ts',
  '.contract.ts',
  '.constants.ts',
  '.logger.ts',
];

/**
 * Entry points that are public although their name does not say so: the
 * gates and helpers every controller shares. (The plugin RPC kit every
 * domain's *.rpc.ts is written against sits outside src/nest, in
 * src/nest-rpc, next to src/nest-mcp.) Adding to this list is a design
 * decision for review, not a way past the check.
 */
export const PUBLIC_FILES = [
  'audit/client-ip.ts',
  'addons/addon-gate.ts',
  'addons/mcp-addon-gate.ts',
  // The maps domain's outbound clients. MapsModule exports them so enrichment
  // asks Google and Wikimedia directly instead of through a MapsService facade.
  'maps/providers/google-places.provider.ts',
  'maps/providers/osm.client.ts',
  'maps/providers/wikimedia.client.ts',
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.ts$/.test(name) && !/\.d\.ts$/.test(name)) files.push(path);
  }
  return files;
}

function resolveSpecifier(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec.replace(/\.js$/, ''));
  for (const candidate of [`${base}.ts`, join(base, 'index.ts'), base]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** True when every name an import declaration brings in is type-only. */
function isTypeOnlyImport(node) {
  const clause = node.importClause;
  if (!clause) return false; // `import './x'` runs the file.
  if (clause.isTypeOnly) return true;
  if (clause.name) return false;
  const bindings = clause.namedBindings;
  if (!bindings || !ts.isNamedImports(bindings)) return false;
  return bindings.elements.length > 0 && bindings.elements.every((el) => el.isTypeOnly);
}

function isTypeOnlyExport(node) {
  if (node.isTypeOnly) return true;
  const clause = node.exportClause;
  return Boolean(clause && ts.isNamedExports(clause) && clause.elements.length > 0 && clause.elements.every((el) => el.isTypeOnly));
}

/** Every relative import of a file: { spec, runtime } where runtime means eager and not erased. */
export function importsOf(text, fileName = 'file.ts') {
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const found = [];
  const add = (spec, runtime) => found.push({ spec, runtime });
  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      add(stmt.moduleSpecifier.text, !isTypeOnlyImport(stmt));
    } else if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)) {
      add(stmt.moduleSpecifier.text, !isTypeOnlyExport(stmt));
    } else if (
      ts.isImportEqualsDeclaration(stmt) &&
      ts.isExternalModuleReference(stmt.moduleReference) &&
      ts.isStringLiteral(stmt.moduleReference.expression)
    ) {
      add(stmt.moduleReference.expression.text, !stmt.isTypeOnly);
    }
  }
  // require() and import() anywhere: eager only when the require sits in top-level code.
  const visit = (node, depth) => {
    if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      const isDynamic = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      if (isRequire || isDynamic) add(node.arguments[0].text, isRequire && depth === 0);
    }
    const inner = ts.isFunctionLike(node) ? depth + 1 : depth;
    ts.forEachChild(node, (child) => visit(child, inner));
  };
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) && !ts.isExportDeclaration(stmt) && !ts.isImportEqualsDeclaration(stmt)) visit(stmt, 0);
  }
  return found;
}

/** All resolved relative import edges under src/, as src-relative POSIX paths. */
export function collectEdges(serverDir) {
  const src = join(serverDir, 'src');
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    throw new Error(`src/ does not exist under ${serverDir}: the check would pass without looking at anything`);
  }
  const rel = (p) => relative(src, p).split(sep).join('/');
  const edges = [];
  const unresolved = [];
  for (const file of walk(src)) {
    for (const { spec, runtime } of importsOf(readFileSync(file, 'utf8'), file)) {
      if (!spec.startsWith('.')) continue;
      const target = resolveSpecifier(file, spec);
      if (!target) {
        unresolved.push(`${rel(file)} -> ${spec}`);
        continue;
      }
      if (target.startsWith(src + sep)) edges.push({ from: rel(file), to: rel(target), runtime });
    }
  }
  return { edges, unresolved };
}

/** Tarjan's strongly connected components; returns a node -> component id map for components of size > 1. */
function cyclicComponents(graph) {
  let index = 0;
  const idx = new Map();
  const low = new Map();
  const onStack = new Set();
  const stack = [];
  const component = new Map();
  let next = 0;
  const strong = (v) => {
    // Iterative, so a deep import chain cannot overflow the call stack.
    const work = [[v, 0]];
    idx.set(v, index);
    low.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);
    while (work.length) {
      const frame = work[work.length - 1];
      const [node, i] = frame;
      const targets = [...(graph.get(node) ?? [])];
      if (i < targets.length) {
        frame[1]++;
        const w = targets[i];
        if (!idx.has(w)) {
          idx.set(w, index);
          low.set(w, index);
          index++;
          stack.push(w);
          onStack.add(w);
          work.push([w, 0]);
        } else if (onStack.has(w)) {
          low.set(node, Math.min(low.get(node), idx.get(w)));
        }
        continue;
      }
      work.pop();
      if (work.length) {
        const parent = work[work.length - 1][0];
        low.set(parent, Math.min(low.get(parent), low.get(node)));
      }
      if (low.get(node) === idx.get(node)) {
        const members = [];
        let w;
        do {
          w = stack.pop();
          onStack.delete(w);
          members.push(w);
        } while (w !== node);
        if (members.length > 1) {
          for (const m of members) component.set(m, next);
          next++;
        }
      }
    }
  };
  for (const v of graph.keys()) if (!idx.has(v)) strong(v);
  return component;
}

function cycleEdges(pairs) {
  const graph = new Map();
  for (const [a, b] of pairs) {
    if (a === b) continue;
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a).add(b);
  }
  const component = cyclicComponents(graph);
  const out = new Set();
  for (const [a, targets] of graph) {
    for (const b of targets) {
      if (component.has(a) && component.get(a) === component.get(b)) out.add(`${a} -> ${b}`);
    }
  }
  return out;
}

const domainOf = (file) => file.match(/^nest\/([^/]+)\//)?.[1] ?? null;

/** The orchestrators no provider may import: its own domain's main service, and MapsService everywhere. */
function isOrchestratorOf(providerFile, target) {
  const domain = domainOf(providerFile);
  return target === `nest/${domain}/${domain}.service.ts` || target === 'nest/maps/maps.service.ts';
}

const isProviderFile = (file) => /^nest\/[^/]+\/(?:.+\/)?providers\//.test(file);

export function isPublic(target) {
  const inner = target.slice('nest/'.length);
  const domain = inner.split('/')[0];
  if (SHARED_DOMAINS.has(domain)) return true;
  if (PUBLIC_FILES.some((p) => (p.endsWith('/') ? inner.startsWith(p) : inner === p))) return true;
  return PUBLIC_SUFFIXES.some((s) => target.endsWith(s));
}

/** Every @InjectRepository(Entity) under src/nest: { domain, entity, file }. */
export function collectRepositoryInjections(serverDir) {
  const src = join(serverDir, 'src');
  const nest = join(src, 'nest');
  if (!existsSync(nest)) return [];
  const found = [];
  for (const file of walk(nest)) {
    const rel = relative(src, file).split(sep).join('/');
    const domain = domainOf(rel);
    if (!domain) continue;
    for (const m of readFileSync(file, 'utf8').matchAll(/@InjectRepository\(\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
      found.push({ domain, entity: m[1], file: rel });
    }
  }
  return found;
}

/** scripts/repository-owners.json: entity class -> owning domain. Missing is an empty map. */
export function readOwners(path) {
  if (!existsSync(path)) return {};
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('scripts/repository-owners.json must map each entity class to its owning domain');
  }
  return parsed;
}

/** foreignRepositories keys, plus the injected entities the owner map does not know. */
export function analyseRepositories(injections, owners) {
  const foreign = new Set();
  const unowned = new Set();
  for (const { domain, entity, file } of injections) {
    const owner = owners[entity];
    if (typeof owner !== 'string') {
      unowned.add(`${entity} (${file})`);
      continue;
    }
    if (owner !== domain) foreign.add(`${domain} -> ${entity} (owned by ${owner})`);
  }
  return { foreignRepositories: [...foreign].sort(), unowned: [...unowned].sort() };
}

/** The violations of every rule, each a sorted list of stable string keys. */
export function analyse(edges) {
  const runtime = edges.filter((e) => e.runtime);
  const fileCycles = cycleEdges(runtime.filter((e) => !e.from.startsWith('db/entities/')).map((e) => [e.from, e.to]));

  const domainPairs = [];
  for (const e of runtime) {
    const a = domainOf(e.from);
    const b = domainOf(e.to);
    if (a && b && a !== b && !SHARED_DOMAINS.has(a) && !SHARED_DOMAINS.has(b)) domainPairs.push([a, b]);
  }
  const domainCycles = cycleEdges(domainPairs);

  const sharedImportsDomain = new Set();
  const domainInternals = new Set();
  const dbImportsNest = new Set();
  const providersImportOrchestrator = new Set();
  for (const e of edges) {
    const a = domainOf(e.from);
    const b = domainOf(e.to);
    if (a && b && SHARED_DOMAINS.has(a) && !SHARED_DOMAINS.has(b)) sharedImportsDomain.add(`${e.from} -> ${e.to}`);
    if (a && b && a !== b && !isPublic(e.to)) domainInternals.add(`${a} -> ${e.to.slice('nest/'.length)}`);
    if (e.from.startsWith('db/') && e.to.startsWith('nest/')) dbImportsNest.add(`${e.from} -> ${e.to}`);
    if (isProviderFile(e.from) && isOrchestratorOf(e.from, e.to)) providersImportOrchestrator.add(`${e.from} -> ${e.to}`);
  }
  const sorted = (set) => [...set].sort();
  return {
    fileCycles: sorted(fileCycles),
    domainCycles: sorted(domainCycles),
    sharedImportsDomain: sorted(sharedImportsDomain),
    domainInternals: sorted(domainInternals),
    dbImportsNest: sorted(dbImportsNest),
    foreignRepositories: [],
    providersImportOrchestrator: sorted(providersImportOrchestrator),
  };
}

/** The baseline as committed. Missing, unreadable or malformed stops the run. */
export function readBaseline(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`scripts/import-boundaries-baseline.json cannot be read: ${err.message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('scripts/import-boundaries-baseline.json must be an object with one list per rule');
  }
  for (const rule of RULES) {
    if (!Array.isArray(parsed[rule]) || !parsed[rule].every((entry) => typeof entry === 'string')) {
      throw new Error(`scripts/import-boundaries-baseline.json: "${rule}" must be a list of strings`);
    }
  }
  const unknown = Object.keys(parsed).filter((key) => !RULES.includes(key));
  if (unknown.length) throw new Error(`scripts/import-boundaries-baseline.json: unknown rule(s) ${unknown.join(', ')}`);
  return parsed;
}

export function compare(baseline, found) {
  const added = {};
  const gone = {};
  for (const rule of RULES) {
    const allowed = new Set(baseline[rule]);
    const now = new Set(found[rule]);
    added[rule] = found[rule].filter((key) => !allowed.has(key));
    gone[rule] = baseline[rule].filter((key) => !now.has(key));
  }
  return { added, gone };
}

const HINTS = {
  fileCycles:
    'This import closes a load-time cycle. Move the shared piece into a file both can import, or make the import type-only.',
  domainCycles:
    'This makes two domains depend on each other. Invert the dependency (an event, a port the other side implements) or move the shared piece into a domain both can import.',
  domainInternals:
    "This reaches into another domain's internals. Go through its service or module, or move the piece into a *.types.ts/*.contract.ts file it publishes.",
  sharedImportsDomain:
    'The shared kernel is imported by every domain, so it may not import one. Move the piece into the kernel, or inject it from the domain.',
  dbImportsNest: 'src/db sits below src/nest. Move what the data layer needs into src/db (or src/utils) instead.',
  foreignRepositories:
    "This injects the repository of a table another domain owns. Ask the owner's service instead (e.g. TripAccessService for trip visibility), or move the code to the owning domain.",
  providersImportOrchestrator:
    'A provider sits below the orchestrator that chooses between providers. Hand it what it needs as an argument, or move the shared piece into a helpers file both import.',
};

function main(argv) {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const serverDir = dirArg ? resolve(dirArg.slice('--dir='.length)) : fileURLToPath(new URL('..', import.meta.url));
  const baselinePath = join(serverDir, 'scripts', 'import-boundaries-baseline.json');
  const update = argv.includes('--update');

  const { edges, unresolved } = collectEdges(serverDir);
  if (unresolved.length) {
    // An import the walker cannot follow is an edge it cannot judge: stop rather than pass on a partial graph.
    for (const u of unresolved) console.error(`FAIL  unresolved import ${u}`);
    return 1;
  }
  const found = analyse(edges);
  const { foreignRepositories, unowned } = analyseRepositories(
    collectRepositoryInjections(serverDir),
    readOwners(join(serverDir, 'scripts', 'repository-owners.json')),
  );
  if (unowned.length) {
    // An entity without an owner is an injection the rule cannot judge.
    for (const u of unowned) console.error(`FAIL  no owner for injected entity ${u}: add it to scripts/repository-owners.json`);
    return 1;
  }
  found.foreignRepositories = foreignRepositories;
  let baseline = readBaseline(baselinePath);
  if (update) {
    const now = Object.fromEntries(RULES.map((rule) => [rule, new Set(found[rule])]));
    baseline = Object.fromEntries(RULES.map((rule) => [rule, baseline[rule].filter((key) => now[rule].has(key)).sort()]));
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  }

  const { added, gone } = compare(baseline, found);
  let failed = 0;
  for (const rule of RULES) {
    for (const key of added[rule]) {
      console.error(`FAIL  ${rule}: ${key}. ${HINTS[rule]}`);
      failed++;
    }
  }
  for (const rule of RULES) {
    for (const key of gone[rule]) {
      console.error(`FAIL  ${rule}: ${key} is in scripts/import-boundaries-baseline.json but no longer occurs.`);
      failed++;
    }
  }
  if (RULES.some((rule) => gone[rule].length)) {
    console.error(
      'Run npm run lint:boundaries -- --update to drop it with the change that fixed it: ' +
        'a stale entry would let the same violation back in unseen.',
    );
  }
  console.log(
    `boundaries: ${edges.length} import(s); held at baseline: ` + RULES.map((rule) => `${rule} ${baseline[rule].length}`).join(', '),
  );
  return failed ? 1 : 0;
}

// Compared by real path, so the check still runs when the script is started through a symlink.
const isCli =
  Boolean(process.argv[1]) && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exitCode = 1;
  }
}
