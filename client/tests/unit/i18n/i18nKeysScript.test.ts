import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DYNAMIC_ALLOWED,
  MAX_IMPLICIT_MATCHES,
  compareUnused,
  countMatches,
  evaluate,
  firstArgument,
  interpolationResults,
  readEnKeys,
  readUnusedBaseline,
  scanElsewhere,
  scanSource,
  scanTree,
  templatePattern,
  unusedPerFile,
} from '../../../scripts/i18n-keys.mjs';

// FE-I18N-KEYS-001 to FE-I18N-KEYS-015: the client key check (scripts/i18n-keys.mjs).

const EN = new Set([
  'budget.title',
  'places.count',
  'places.count.one',
  'trips.total.other',
  'trips.total.one',
  'costs.filter.all',
]);

describe('i18n key check', () => {
  it('FE-I18N-KEYS-001: finds literal keys in t, tHtml, tr, TransHtml, translateApiError and *Key props', () => {
    const { literal } = scanSource(
      [
        "t('budget.title')",
        'props.t("places.count", { count })',
        "tHtml('a.html')",
        "tr('pdf.mapTitle')",
        '<TransHtml html="journey.text" />',
        "translateApiError(t, err, 'files.uploadError')",
        "const tabs = [{ labelKey: 'tabs.one' }]",
        '<Hint titleKey="hint.title" />',
      ].join('\n')
    );
    expect(literal.map((l) => l.key)).toEqual([
      'budget.title',
      'places.count',
      'a.html',
      'pdf.mapTitle',
      'journey.text',
      'files.uploadError',
      'tabs.one',
      'hint.title',
    ]);
  });

  it('FE-I18N-KEYS-002: checks both sides of a conditional key and ignores later arguments', () => {
    const { literal } = scanSource("t(open ? 'a.open' : 'a.closed', { name: 'x.y' })");
    expect(literal.map((l) => l.key)).toEqual(['a.open', 'a.closed']);
    expect(firstArgument("t(fn(a, b) ? 'x.y' : 'z.w', 1)", 1)).toBe("fn(a, b) ? 'x.y' : 'z.w'");
  });

  it('FE-I18N-KEYS-003: reads templates, appended prefixes and key builders as patterns', () => {
    const { literal, dynamic } = scanSource(
      [
        't(`costs.filter.${f}`)',
        "t('costs.filter.' + f)",
        't(`plain.key`)',
        'export const guideKey = (id: string): string =>\n  `help.guide.${id}.title`',
        'const cacheKey = (id: number): string => `${id} x`',
        "const other = notATranslation('x.y')",
      ].join('\n')
    );
    expect(literal.map((l) => l.key)).toEqual(['plain.key']);
    expect(dynamic.map((d) => d.template)).toEqual([
      'costs.filter.${f}',
      'costs.filter.${…}',
      'help.guide.${id}.title',
    ]);
    expect(templatePattern('costs.filter.${f}')!.test('costs.filter.all')).toBe(true);
    expect(templatePattern('${opt.label}Hint')).toBeNull();
    // An interpolation is one key segment: costs.filter.${f} does not reach a nested costs.filter.x.y.
    expect(templatePattern('costs.filter.${f}')!.test('costs.filter.x.y')).toBe(false);
  });

  it('FE-I18N-KEYS-004: fails a literal key en lacks and accepts a plural group by its general form', () => {
    const scan = scanSource("t('budget.addCategory'); t('places.count', { count }); t('trips.total', { count })");
    const { missing } = evaluate(scan, EN, []);
    expect(missing.map((m) => m.key)).toEqual(['budget.addCategory']);
  });

  it('FE-I18N-KEYS-005: fails a template no en key matches unless it is allowed with the keys it resolves to', () => {
    const scan = scanSource('t(`costs.filter.${f}`); t(`gone.prefix.${x}`); t(`${opt.label}Hint`)');
    expect(evaluate(scan, EN, []).unmatched.map((u) => u.template)).toEqual(['gone.prefix.${x}', '${opt.label}Hint']);
    const allowed = [{ file: '<source>', template: '${opt.label}Hint', because: 'test', resolves: ['budget.title'] }];
    const result = evaluate(scan, EN, allowed);
    expect(result.unmatched.map((u) => u.template)).toEqual(['gone.prefix.${x}']);
    expect(result.stale).toEqual([]);
  });

  it('FE-I18N-KEYS-006: refuses an allow-list entry nothing uses or whose keys en lacks', () => {
    const scan = scanSource('t(`${opt.label}Hint`)');
    const unused = [{ file: '<source>', template: '${gone}', because: 'test', resolves: ['budget.title'] }];
    expect(evaluate(scan, EN, unused).stale).toEqual(unused);
    const wrong = [{ file: '<source>', template: '${opt.label}Hint', because: 'test', resolves: ['share.nope'] }];
    expect(evaluate(scan, EN, wrong).stale).toEqual(wrong);
    const elsewhere = [
      { file: 'other.tsx', template: '${opt.label}Hint', because: 'test', resolves: ['budget.title'] },
    ];
    expect(evaluate(scan, EN, elsewhere).stale).toEqual(elsewhere);
    expect(evaluate(scan, EN, elsewhere).unmatched.map((u) => u.template)).toEqual(['${opt.label}Hint']);
  });

  it('FE-I18N-KEYS-007: reports en keys neither a literal nor a pattern reaches', () => {
    const scan = scanSource("t('budget.title'); t('places.count', { count }); t(`costs.filter.${f}`)");
    expect(evaluate(scan, EN, []).unused).toEqual(['trips.total.other', 'trips.total.one']);
  });

  it('FE-I18N-KEYS-008: every allow-list entry names its file and a reason, and a prefix-less one its keys', () => {
    for (const entry of DYNAMIC_ALLOWED) {
      expect(entry.file).toMatch(/\.tsx?$/);
      expect(entry.because.length).toBeGreaterThan(20);
      if (templatePattern(entry.template) === null)
        expect('resolves' in entry && entry.resolves.length).toBeGreaterThan(0);
    }
  });

  it('FE-I18N-KEYS-009: fails closed on a missing source tree or one without any key', () => {
    expect(() => scanTree(join(tmpdir(), 'trek-i18n-keys-does-not-exist'))).toThrow(/does not exist/);
    const empty = mkdtempSync(join(tmpdir(), 'trek-i18n-keys-'));
    try {
      expect(() => scanTree(empty)).toThrow(/scanner is broken/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it('FE-I18N-KEYS-010: the client source names no key en lacks today', async () => {
    const enKeys = await readEnKeys();
    const { missing, unmatched, broad, stale } = evaluate(scanTree(), enKeys);
    expect(missing).toEqual([]);
    expect(unmatched).toEqual([]);
    expect(broad).toEqual([]);
    expect(stale).toEqual([]);
  });

  // A table of en keys wider than the implicit bound: wide.k0 to wide.k<MAX>.
  const WIDE = new Set([...EN, ...Array.from({ length: MAX_IMPLICIT_MATCHES + 1 }, (_, i) => `wide.k${i}`)]);

  it('FE-I18N-KEYS-011: counts a plural group once when measuring what a template reaches', () => {
    expect(countMatches(templatePattern('trips.${x}')!, EN)).toBe(1);
    expect(countMatches(templatePattern('wide.${x}')!, WIDE)).toBe(MAX_IMPLICIT_MATCHES + 1);
  });

  it('FE-I18N-KEYS-012: fails a template wider than the bound unless its file has an entry for it', () => {
    const scan = scanSource('t(`wide.${x}`); t(`costs.filter.${f}`)', 'a.tsx');
    const { broad, unmatched } = evaluate(scan, WIDE, []);
    expect(broad.map((b) => [b.template, b.matches])).toEqual([['wide.${x}', MAX_IMPLICIT_MATCHES + 1]]);
    expect(unmatched).toEqual([]);
    const otherFile = [{ file: 'b.tsx', template: 'wide.${x}', because: 'test' }];
    expect(evaluate(scan, WIDE, otherFile).broad).toHaveLength(1);
    const ownFile = [{ file: 'a.tsx', template: 'wide.${x}', because: 'test' }];
    expect(evaluate(scan, WIDE, ownFile)).toMatchObject({ broad: [], stale: [] });
  });

  it('FE-I18N-KEYS-013: refuses an entry for a narrow template, and an allowed template that matches nothing', () => {
    const scan = scanSource('t(`costs.filter.${f}`); t(`gone.prefix.${x}`)', 'a.tsx');
    const narrow = [{ file: 'a.tsx', template: 'costs.filter.${f}', because: 'test' }];
    expect(evaluate(scan, EN, narrow).stale).toEqual(narrow);
    const gone = [{ file: 'a.tsx', template: 'gone.prefix.${x}', because: 'test' }];
    expect(evaluate(scan, EN, gone).unmatched.map((u) => u.template)).toEqual(['gone.prefix.${x}']);
  });

  it('FE-I18N-KEYS-014: checks each literal branch of a template as a key, so a typo in one fails', () => {
    const scan = scanSource("t(`costs.filter.${on ? 'all' : 'alll'}`)", 'a.tsx');
    expect(scan.dynamic).toEqual([]);
    expect(scan.literal.map((l) => l.key)).toEqual(['costs.filter.all', 'costs.filter.alll']);
    expect(evaluate(scan, EN, []).missing.map((m) => m.key)).toEqual(['costs.filter.alll']);
    // Nested ternaries, parentheses and optional chaining in the condition; a literal in a comparison is no result.
    expect(interpolationResults("(a?.b === 'x') ? 'p' : c ? ('q') : 'r'")).toEqual({
      literals: ['p', 'q', 'r'],
      complete: true,
    });
    expect(interpolationResults("fn('a.b')")).toEqual({ literals: [], complete: false });
  });

  it('FE-I18N-KEYS-015: keeps a template with data in it a pattern and still checks its literal fallback', () => {
    const scan = scanSource("t(`costs.filter.${role ?? 'nope'}`); t(`budget.${p === 'x' ? 'title' : p}`)", 'a.tsx');
    expect(scan.dynamic.map((d) => d.template)).toEqual([
      "costs.filter.${role ?? 'nope'}",
      "budget.${p === 'x' ? 'title' : p}",
    ]);
    expect(scan.literal.map((l) => l.key)).toEqual(['costs.filter.nope', 'budget.title']);
    expect(evaluate(scan, EN, []).missing.map((m) => m.key)).toEqual(['costs.filter.nope']);
    // A derived pattern is judged under its source template's allow-list entry.
    const two = scanSource("t(`wide.${a ?? 'k0'}.${b}`)", 'a.tsx');
    expect(two.dynamic.map((d) => d.site)).toEqual([undefined, "wide.${a ?? 'k0'}.${b}"]);
  });

  it('FE-I18N-KEYS-016: a key named only by the server counts as reached, and its references are not judged', () => {
    const dir = mkdtempSync(join(tmpdir(), 'i18n-elsewhere-'));
    try {
      mkdirSync(join(dir, 'registry'));
      writeFileSync(
        join(dir, 'registry', 'notices.ts'),
        "export const n = { titleKey: 'budget.title', bodyKey: 'no.such' }"
      );
      writeFileSync(join(dir, 'registry', 'notices.test.ts'), "const k = { titleKey: 'places.count' }");
      const elsewhere = scanElsewhere([dir, join(dir, 'missing')]);
      expect(elsewhere.literal.map((l) => l.key)).toEqual(['budget.title', 'no.such']);
      const verdict = evaluate({ literal: [], dynamic: [] }, EN, [], elsewhere);
      expect(verdict.unused).not.toContain('budget.title');
      expect(verdict.unused).toContain('places.count');
      expect(verdict.missing).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('FE-I18N-KEYS-017: counts unused keys per en file and holds them to a baseline that only shrinks', () => {
    const files = new Map([
      ['budget.title', 'budget.ts'],
      ['places.count', 'places.ts'],
      ['places.count.one', 'places.ts'],
    ]);
    const counts = unusedPerFile(['budget.title', 'places.count', 'places.count.one', 'not.in.en'], files);
    expect(counts).toEqual({ 'budget.ts': 1, 'places.ts': 2 });
    expect(compareUnused({ 'budget.ts': 1, 'places.ts': 2 }, counts)).toEqual({
      grown: [],
      stale: [],
      lowered: counts,
    });
    const grown = compareUnused({ 'budget.ts': 1, 'places.ts': 1 }, counts);
    expect(grown.grown).toEqual([['places.ts', 2]]);
    const stale = compareUnused({ 'budget.ts': 3, 'places.ts': 2, 'gone.ts': 1 }, counts);
    expect(stale.stale).toEqual([
      { file: 'budget.ts', allowed: 3, now: 1 },
      { file: 'gone.ts', allowed: 1, now: 0 },
    ]);
    expect(stale.lowered).toEqual({ 'budget.ts': 1, 'places.ts': 2 });
  });

  it('FE-I18N-KEYS-018: a missing or malformed unused baseline stops the check', () => {
    const dir = mkdtempSync(join(tmpdir(), 'i18n-baseline-'));
    try {
      expect(() => readUnusedBaseline(join(dir, 'none.json'))).toThrow(/cannot be read/);
      writeFileSync(join(dir, 'bad.json'), '{"a.ts": 0}');
      expect(() => readUnusedBaseline(join(dir, 'bad.json'))).toThrow(/positive count/);
      writeFileSync(join(dir, 'ok.json'), '{"a.ts": 2}');
      expect(readUnusedBaseline(join(dir, 'ok.json'))).toEqual({ 'a.ts': 2 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
