import noPromiseAsValue from '../../../eslint-rules/no-promise-as-value.mjs';
import tsParser from '@typescript-eslint/parser';

import { RuleTester, type Rule } from 'eslint';
import path from 'path';

// The rule only exists because it is TYPE-aware, so the tester runs against a
// real TypeScript program: eslint-rules/fixtures/ holds a tsconfig whose single
// file is the one the tester feeds code into. It lives outside src/ and tests/
// so the deliberately-broken snippets below never reach tsc or the lint gates.
const fixtureRoot = path.resolve(__dirname, '../../../eslint-rules/fixtures');

// With CI=true typescript-eslint switches to single-run mode, which builds the
// program from the fixture file on disk and ignores the code each case hands
// it: every invalid case then reports nothing. The tester must stay in the
// per-file mode on CI as well.
const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: fixtureRoot,
      disallowAutomaticSingleRunInference: true,
    },
  },
});

const PRELUDE = `
declare function getSettings(id: number): Promise<Record<string, string>>;
declare function getName(id: number): Promise<string>;
declare function getCount(): Promise<number>;
declare function getRows(): Promise<string[]>;
declare function maybeSettings(id: number): Promise<Record<string, string>> | null;
declare function syncName(id: number): string;
declare const rows: { id: number; active: boolean }[];
declare const expect: (value: unknown) => {
  resolves: { toBe(value: unknown): void };
  rejects: { toThrow(value?: unknown): void };
  toBe(value: unknown): void;
  toBeNull(): void;
  toEqual(value: unknown): void;
  toBeInstanceOf(ctor: unknown): void;
};
declare const svc: { rosterIds(id: number): Promise<Set<number>> };
`;

/** Every case shares the declarations above; offsets never matter, only counts. */
const withPrelude = (code: string) => `${PRELUDE}${code}\n`;

const valid = [
  // Awaited first — the shape every finding is fixed into.
  `const s = await getSettings(1); const v = s['metric']; void v;`,
  `const hit = (await getName(1)) === 'x'; void hit;`,
  `const msg = \`\${await getCount()}\`; void msg;`,
  `const all = [...(await getRows())]; void all;`,
  `for (const r of await getRows()) { void r; }`,
  `const keys = Object.keys(await getSettings(1)); void keys;`,
  // Promise-shaped uses that are correct by construction.
  `const n = getName(1).then((x) => x.length); void n;`,
  `const both = await Promise.all([getName(1), getCount()]); void both;`,
  `const joined = \`\${(await Promise.all([getName(1)]))[0]}\`; void joined;`,
  `expect(getName(1)).resolves.toBe('x');`,
  `await expect(getName(1)).resolves.toBe('x');`,
  `await expect(getName(1)).rejects.toThrow();`,
  `expect(await getName(1)).toBe('x');`,
  // Asserting the VALUE is a Promise (a live AUTH-DB-024 pattern) is the assertion
  // itself, not a missing await — it stays exempt, unlike other matchers.
  `expect(getName(1)).toBeInstanceOf(Promise);`,
  // Identity between two promise references (the trek-photo-cache stampede-guard
  // pattern: `expect(svc.getInFlight(k)).toBe(fetch)`) — awaiting would compare a
  // resolved value against the unawaited Promise and always fail.
  `const p1 = getName(1); const p2 = getName(2); expect(p1).toBe(p2);`,
  `const isP = getName(1) instanceof Promise; void isP;`,
  // Existence / identity checks on a parked promise: the in-flight-map idiom the
  // server uses everywhere, and the one a truthiness test would get wrong.
  `const inflight = new Map<string, Promise<string>>(); const hit = inflight.get('k'); if (hit !== undefined) { void hit; }`,
  `let building: Promise<string> = getName(1); if (building === null) { void 0; }`,
  `const chains = new Map<number, Promise<void>>(); const next = Promise.resolve(); if (chains.get(1) === next) { void 0; }`,
  `const chains = new Map<number, Promise<void>>(); const prev = chains.get(1) ?? Promise.resolve(); void prev;`,
  `void getName(1);`,
  // Non-promise values, and the array callbacks a promise legitimately flows through.
  `const same = syncName(1) === 'x'; void same;`,
  `const active = rows.filter((r) => r.active); void active;`,
  `const pending = rows.map((r) => getName(r.id)); void pending;`,
].map((code) => ({ code: withPrelude(code), filename: path.join(fixtureRoot, 'file.ts') }));

const invalid = [
  // Element access: compiles to `any` with strict mode off — the live miss Task 2 found.
  `const v = getSettings(1)['metric']; void v;`,
  // Property access on a promise-typed object, bracket-free.
  `const v = getSettings(1).metric; void v;`,
  // Comparisons: always false, no error.
  `if (getName(1) === 'x') { void 0; }`,
  `const n = getCount() + 1; void n;`,
  `const has = 'metric' in getSettings(1); void has;`,
  // Interpolation: "[object Promise]".
  `const msg = \`\${getCount()}\`; void msg;`,
  // Spread: neither iterable nor enumerable at runtime.
  `const a = [...getRows()]; void a;`,
  `const o = { ...getSettings(1) }; void o;`,
  // Plain-value consumers.
  `Object.keys(getSettings(1));`,
  `JSON.stringify(getSettings(1));`,
  `Array.isArray(getRows());`,
  `const t = typeof getName(1); void t;`,
  // Iteration.
  `for (const r of getRows()) { void r; }`,
  `for (const k in getSettings(1)) { void k; }`,
  // Logical left operand: always truthy, so the fallback is dead code.
  `const v = getName(1) || 'x'; void v;`,
  // A predicate callback that returns a promise: every element passes.
  `const active = rows.filter((r) => getName(r.id)); void active;`,
  // `.has()` on a Promise<Set<...>> — the PackingService.updateBag shape (Task 9):
  // a member call is still just property access on a promise-typed object.
  `const s = svc.rosterIds(1); s.has(2);`,
  `svc.rosterIds(1).has(2);`,
].map((code) => ({
  code: withPrelude(code),
  filename: path.join(fixtureRoot, 'file.ts'),
  errors: [{ messageId: 'promiseAsValue' }],
}));

const invalidExpect = [
  // Bare `expect(promise)` without `.resolves`/`.rejects`: the assertion always
  // passes/fails independent of the resolved value — Task 9's vacuous-assertion bug.
  `const p = getName(1); expect(p).toBe('x');`,
  `expect(getName(1)).toBeNull();`,
  `expect(getCount()).toEqual(1);`,
  // `.toBeInstanceOf` is exempt only for the literal `Promise` constructor —
  // against anything else the promise itself never matches, still a bug.
  `expect(getName(1)).toBeInstanceOf(String);`,
].map((code) => ({
  code: withPrelude(code),
  filename: path.join(fixtureRoot, 'file.ts'),
  errors: [{ messageId: 'expectPromise' }],
}));

ruleTester.run('trek/no-promise-as-value', noPromiseAsValue as unknown as Rule.RuleModule, {
  valid,
  invalid: [...invalid, ...invalidExpect],
});

// Under strictNullChecks a promise-returning call can genuinely be nullable, and
// `p ?? x` / `p === null` are then real checks rather than missing awaits. The
// server compiles with `strict: false`, where that union collapses and these
// branches are unreachable — so they get their own project to be tested in.
const strictTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: './tsconfig.strict.json',
      tsconfigRootDir: fixtureRoot,
      disallowAutomaticSingleRunInference: true,
    },
  },
});

const strictFile = path.join(fixtureRoot, 'strict.ts');

strictTester.run('trek/no-promise-as-value (strictNullChecks)', noPromiseAsValue as unknown as Rule.RuleModule, {
  valid: [
    { code: withPrelude(`const f = maybeSettings(1) ?? null; void f;`), filename: strictFile },
    { code: withPrelude(`const missing = maybeSettings(1) === null; void missing;`), filename: strictFile },
  ],
  invalid: [
    {
      // Nullable or not, indexing it is still a missing await.
      code: withPrelude(`const v = maybeSettings(1)!['metric']; void v;`),
      filename: strictFile,
      errors: [{ messageId: 'promiseAsValue' }],
    },
    {
      // A union of `Promise<T> | null` is still a promise once the nullish
      // members are stripped — interpolating it is "[object Promise]".
      code: withPrelude(`const msg = \`\${maybeSettings(1)}\`; void msg;`),
      filename: strictFile,
      errors: [{ messageId: 'promiseAsValue' }],
    },
  ],
});
