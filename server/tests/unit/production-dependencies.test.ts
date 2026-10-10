import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The image installs the server with `npm ci --omit=dev` (Dockerfile), so a
// package that src/ imports at runtime but package.json lists under
// devDependencies is simply absent in production: the container boots, loads
// dist/index.js and dies with MODULE_NOT_FOUND on the first require. Nothing
// else catches that: typecheck, lint and every test run against a full
// node_modules. This happened twice on the ORM branch (`tsx`, then
// `@mikro-orm/sqlite`), so the rule is pinned here: everything src/ (and the
// one script the image runs from source) imports must be a dependency.
const serverRoot = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(serverRoot, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

const builtins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));

/** The npm package a specifier resolves to: `@scope/name` or the first segment. */
const packageOf = (specifier: string): string =>
  specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];

/** Runtime imports only: `import type` and `export type` load nothing. */
const IMPORT_FROM = /^[ \t]*(?:import|export)\s+(?!type\s)[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/gm;
const BARE_IMPORT = /^[ \t]*import\s*['"]([^'"]+)['"]/gm;
const REQUIRE_OR_DYNAMIC = /\b(?:require|import)\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Comments go first so a docblock that mentions `require('x')` is not an import. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

function externalImports(file: string): string[] {
  const source = stripComments(fs.readFileSync(file, 'utf8'));
  const specifiers = [IMPORT_FROM, BARE_IMPORT, REQUIRE_OR_DYNAMIC].flatMap((re) =>
    [...source.matchAll(re)].map((m) => m[1]),
  );
  return specifiers.filter((s) => !s.startsWith('.') && !s.startsWith('/') && !builtins.has(s)).map(packageOf);
}

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.ts$/.test(entry.name) && !/\.(test|d)\.ts$/.test(entry.name)) yield full;
  }
}

describe('production dependencies', () => {
  const files = [...walk(path.join(serverRoot, 'src')), path.join(serverRoot, 'scripts', 'migrate-encryption.ts')];
  const usedBy = new Map<string, string[]>();
  for (const file of files) {
    for (const pkg of externalImports(file)) {
      const list = usedBy.get(pkg) ?? [];
      if (list.length < 3) list.push(path.relative(serverRoot, file));
      usedBy.set(pkg, list);
    }
  }

  it('PRODDEPS-001: the scan sees the server (guards against matching nothing)', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(usedBy.has('@nestjs/common')).toBe(true);
    expect(usedBy.has('@mikro-orm/sqlite')).toBe(true);
  });

  it('PRODDEPS-002: every package src/ imports at runtime is a dependency, never a devDependency or undeclared', () => {
    // `@trek/shared` is the workspace package the image copies in as shared/dist;
    // `trek-plugin-sdk` is resolved inside the plugin child from its own install.
    const provided = new Set(['@trek/shared', 'trek-plugin-sdk']);
    const missing = [...usedBy.entries()]
      .filter(([pkg]) => !provided.has(pkg) && !(pkg in manifest.dependencies))
      .map(
        ([pkg, where]) =>
          `${pkg} (${pkg in manifest.devDependencies ? 'devDependencies' : 'undeclared'}; e.g. ${where.join(', ')})`,
      );
    expect(missing).toEqual([]);
  });
});
