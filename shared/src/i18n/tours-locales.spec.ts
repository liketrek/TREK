/// <reference types="node" />
/// <reference types="vite/client" />
import { SUPPORTED_LANGUAGE_CODES } from './languages';
import { pluralFormOf, pluralGroups } from './plural';
import type { TranslationStrings } from './types';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const domains = import.meta.glob<{ default: TranslationStrings }>('./*/tours.ts', { eager: true });
const aggregates = import.meta.glob<{ default: TranslationStrings }>('./*/index.ts', { eager: true });
const englishModule = domains['./en/tours.ts'];
if (!englishModule) throw new Error('Missing English Tours domain');
const english = englishModule.default;
const tokens = (value: string) => [...value.matchAll(/\{[^{}]+\}/g)].map((match) => match[0]).sort();
// Plural forms (`tours.import.success.one`) differ by language on purpose:
// Japanese has none, Arabic five. They are compared by the parity CLI and the
// placeholder spec; here only the general keys are.
const groups = pluralGroups(Object.keys(english));
const generalKeys = (keys: string[]) => keys.filter((key) => !pluralFormOf(key, groups));
const GENERAL_KEY_COUNT = 133;

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

describe('Tours locale contracts', () => {
  it('covers all 27 supported locales with 133 general source keys', () => {
    expect(Object.keys(domains)).toHaveLength(27);
    expect(Object.keys(domains).sort()).toEqual(SUPPORTED_LANGUAGE_CODES.map((code) => `./${code}/tours.ts`).sort());
    expect(generalKeys(Object.keys(english))).toHaveLength(GENERAL_KEY_COUNT);
  });

  for (const [path, { default: strings }] of Object.entries(domains)) {
    it(`${path} imports, preserves placeholders and registers every key exactly once`, () => {
      const domainSource = readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
      const domainKeys = literalKeys(domainSource);
      expect(generalKeys(domainKeys)).toHaveLength(GENERAL_KEY_COUNT);
      expect(new Set(domainKeys).size).toBe(domainKeys.length);
      expect(generalKeys(Object.keys(strings)).sort()).toEqual(generalKeys(Object.keys(english)).sort());
      expect(domainSource).not.toMatch(/export\s*\{\s*default\s*\}\s*from/);
      const indexPath = path.replace('/tours.ts', '/index.ts');
      const indexSource = readFileSync(fileURLToPath(new URL(indexPath, import.meta.url)), 'utf8');
      const indexTree = ts.createSourceFile(indexPath, indexSource, ts.ScriptTarget.Latest, true);
      expect(indexSource.match(/import tours from ['"]\.\/tours['"]/g)).toHaveLength(1);
      expect(indexSource.match(/\.\.\.tours\b/g)).toHaveLength(1);
      const registeredKeys: string[] = [];
      for (const statement of indexTree.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
        const relativePath = statement.moduleSpecifier.text;
        if (!relativePath.startsWith('./')) continue;
        const domainUrl = new URL(`${relativePath}.ts`, new URL(indexPath, import.meta.url));
        registeredKeys.push(...literalKeys(readFileSync(fileURLToPath(domainUrl), 'utf8')));
      }
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
      for (const key of [
        'tours.planner.safetyNote',
        'tours.planner.safetyNoteDetails',
        'tours.planner.difficulty.t3Warning',
        'tours.planner.difficulty.alpineBody',
      ]) {
        expect(strings[key], key).toBeTruthy();
      }
    });
  }
});
