/// <reference types="node" />
/// <reference types="vite/client" />
import { SUPPORTED_LANGUAGE_CODES } from './languages';
import { pluralFormOf, pluralGroups } from './plural';
import type { TranslationStrings } from './types';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

type DomainModules = Record<string, { default: TranslationStrings }>;

const toursModules = import.meta.glob<{ default: TranslationStrings }>('./*/tours.ts', { eager: true });

// The tours strings live in more than one file per locale, so that none of
// them grows past the size limit: `tours.ts` holds the planner,
// `tourCollection.ts` the tours kept in a collection and `tourPacking.ts` the
// packing list a tour points at. Each file is held to its own count.
const TOUR_DOMAINS: { file: string; generalKeyCount: number; modules: DomainModules }[] = [
  {
    file: 'tours',
    generalKeyCount: 1349,
    modules: toursModules,
  },
  {
    file: 'tourCollection',
    generalKeyCount: 41,
    modules: import.meta.glob<{ default: TranslationStrings }>('./*/tourCollection.ts', { eager: true }),
  },
  {
    file: 'tourPacking',
    generalKeyCount: 23,
    modules: import.meta.glob<{ default: TranslationStrings }>('./*/tourPacking.ts', { eager: true }),
  },
];
const aggregates = import.meta.glob<{ default: TranslationStrings }>('./*/index.ts', { eager: true });
const tokens = (value: string) => [...value.matchAll(/\{[^{}]+\}/g)].map((match) => match[0]).sort();

function literalKeys(source: string): string[] {
  const tree = ts.createSourceFile('locale.ts', source, ts.ScriptTarget.Latest, true);
  const keys: string[] = [];
  function visit(node: ts.Node): void {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) keys.push(node.name.text);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return keys;
}

function registeredKeysOf(indexPath: string): string[] {
  const indexSource = readFileSync(fileURLToPath(new URL(indexPath, import.meta.url)), 'utf8');
  const indexTree = ts.createSourceFile(indexPath, indexSource, ts.ScriptTarget.Latest, true);
  const registeredKeys: string[] = [];
  for (const statement of indexTree.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const relativePath = statement.moduleSpecifier.text;
    if (!relativePath.startsWith('./')) continue;
    const domainUrl = new URL(`${relativePath}.ts`, new URL(indexPath, import.meta.url));
    registeredKeys.push(...literalKeys(readFileSync(fileURLToPath(domainUrl), 'utf8')));
  }
  return registeredKeys;
}

for (const { file, generalKeyCount, modules } of TOUR_DOMAINS) {
  const englishModule = modules[`./en/${file}.ts`];
  if (!englishModule) throw new Error(`Missing English ${file} domain`);
  const english = englishModule.default;
  // Plural forms (`tours.import.success.one`) differ by language on purpose:
  // Japanese has none, Arabic five. They are compared by the parity CLI and the
  // placeholder spec; here only the general keys are.
  const groups = pluralGroups(Object.keys(english));
  const generalKeys = (keys: string[]) => keys.filter((key) => !pluralFormOf(key, groups));

  describe(`Tours locale contracts: ${file}.ts`, () => {
    it(`covers all 27 supported locales with ${generalKeyCount} general source keys`, () => {
      expect(Object.keys(modules)).toHaveLength(27);
      expect(Object.keys(modules).sort()).toEqual(
        SUPPORTED_LANGUAGE_CODES.map((code) => `./${code}/${file}.ts`).sort(),
      );
      expect(generalKeys(Object.keys(english))).toHaveLength(generalKeyCount);
    });

    for (const [path, { default: strings }] of Object.entries(modules)) {
      it(`${path} imports, preserves placeholders and registers every key exactly once`, () => {
        const domainSource = readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
        const domainKeys = literalKeys(domainSource);
        expect(generalKeys(domainKeys)).toHaveLength(generalKeyCount);
        expect(new Set(domainKeys).size).toBe(domainKeys.length);
        expect(generalKeys(Object.keys(strings)).sort()).toEqual(generalKeys(Object.keys(english)).sort());
        expect(domainSource).not.toMatch(/export\s*\{\s*default\s*\}\s*from/);
        const indexPath = path.replace(`/${file}.ts`, '/index.ts');
        const indexSource = readFileSync(fileURLToPath(new URL(indexPath, import.meta.url)), 'utf8');
        expect(indexSource.match(new RegExp(`import ${file} from ['"]\\./${file}['"]`, 'g'))).toHaveLength(1);
        expect(indexSource.match(new RegExp(`\\.\\.\\.${file}\\b`, 'g'))).toHaveLength(1);
        const registeredKeys = registeredKeysOf(indexPath);
        for (const [key, reference] of Object.entries(english)) {
          if (pluralFormOf(key, groups)) continue;
          expect(typeof strings[key], key).toBe('string');
          const value = strings[key] as string;
          expect(value.trim(), key).not.toBe('');
          expect(value, key).not.toBe(key);
          expect(tokens(value), key).toEqual(tokens(reference as string));
          expect(
            registeredKeys.filter((registered) => registered === key),
            key,
          ).toHaveLength(1);
          expect(aggregates[indexPath]?.default[key], key).toBe(value);
        }
        for (const key of domainKeys.filter((domainKey) => pluralFormOf(domainKey, groups))) {
          expect(
            registeredKeys.filter((registered) => registered === key),
            key,
          ).toHaveLength(1);
          expect(aggregates[indexPath]?.default[key], key).toBe(strings[key]);
        }
      });
    }
  });
}

describe('Tours locale contracts: safety strings', () => {
  for (const [path, { default: strings }] of Object.entries(toursModules)) {
    it(`${path} carries the safety notes`, () => {
      for (const key of [
        'tours.planner.safetyNote',
        'tours.planner.difficulty.t3Warning',
        'tours.planner.difficulty.alpineBody',
      ]) {
        expect(strings[key], key).toBeTruthy();
      }
    });
  }
});
