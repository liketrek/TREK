# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: the **`@trek/shared`** workspace. See the repo-root `CLAUDE.md` for the monorepo picture, and `server/CLAUDE.md` / `client/CLAUDE.md` for the consumers. This package is the **single source of truth** for API contracts (Zod) and all i18n strings; both server and client import from it.

## Commands (run from `shared/`)

```bash
npm run build              # tsdown → dist/ (CJS + ESM + .d.ts). REQUIRED before server/client typecheck or run
npm run build:watch        # tsdown --watch --no-clean (the root `npm run dev` runs this)
npm run typecheck          # tsc --noEmit
npm run lint               # eslint --fix src/**/*.ts
npm run test               # vitest run
npm run i18n:parity        # audit locale drift, exits 0 (prints a per-locale report)
npm run i18n:parity:strict # CI gate — exits 1 on any drift
```

Single test:

```bash
npx vitest run src/sanitize/sanitize.spec.ts
npx vitest run src/i18n/i18n-parity.spec.ts
npx vitest run -t "rejects extra keys"
```

**Always rebuild after changing a schema or locale** — the consumers import the compiled `dist/`, not `src/`. If a server/client typecheck fails to see a new export, you probably forgot `npm run build` here.

## Build & exports

`tsdown.config.ts` emits **three kinds of entry**: the root barrel (`src/index.ts`), the i18n metadata barrel (`src/i18n/index.ts`), and **one entry per locale** (`src/i18n/*/index.ts`) so each locale becomes its own lazy-loadable chunk (the client dynamic-imports them). `zod` is never bundled (`deps.neverBundle`). Both CJS and ESM are emitted with `.d.ts`. The `exports` map in `package.json` exposes `@trek/shared` (contracts), `@trek/shared/i18n` (metadata/types), and `@trek/shared/i18n/<locale>` (a single locale).

## Contracts (`src/<domain>/<domain>.schema.ts`)

One folder per domain; each exports Zod schemas plus their inferred types (`export type X = z.infer<typeof xSchema>`). The root barrel `src/index.ts` re-exports every domain. Domain-agnostic primitives live in `src/common/` (`primitives.schema.ts`, `pagination.schema.ts`).

**`src/plugin-permissions.ts` is machine-generated** (by `server/scripts/gen-plugin-facts.ts` from the server's plugin protocol) — never hand-edit it; regenerate with `npm run gen:plugin-facts` from `server/`, where `check:plugin-facts` is the CI drift gate.

A route is considered "migrated" only once its contract lives here and **both** sides import the inferred types. Key convention seen across schemas (e.g. `weather/weather.schema.ts`): **schemas mirror the exact legacy wire behavior** — strings stay strings if the legacy route never coerced them, optional fields reflect partial response subsets, and **bespoke 4xx error strings are reproduced in the server controller, not derived from the schema**, so the error body stays byte-identical. Don't "tidy up" a schema to be stricter than the contract it documents.

## Direction (from the 2026 audit)

The parity rule above governs **existing** routes; it is not a license to mint new debt. For anything new:

- **The contract describes the wire, not the storage engine.** New boolean fields are `z.boolean()` — convert SQLite 0/1 at the service boundary, never add a new `z.union([z.boolean(), z.number()])`. New id fields use `idSchema`/`idParamSchema`, never `number | string` unions. A field's request and response types must agree (a write→read round trip must not change a type).
- **Use the shared primitives** in `src/common/` (`idSchema`, `nonEmptyString`, pagination, …) instead of re-declaring bare `z.number()`/`z.string()` per domain. Prefer narrowing an existing open object over adding a new `z.record(...)`/passthrough body — "any object" gives zero drift protection.
- **Add a schema, add a spec** — especially for lenient parsers fed by untrusted or LLM input.
- **This package stays lean and isomorphic**: zero imports from client/server, no `node:` APIs in `src/`, and effectively no new runtime dependencies (long-term the contract layer approaches `zod`-only; i18n is a separable concern with its own release cadence — don't couple new contract code to it).
- **Never hand-copy a locale list.** `SUPPORTED_LANGUAGES` in `languages.ts` is the one registry — derive everything (barrels, loaders, spec maps) from it; adding a locale should be one edit, not four.
- **`shared` is the monorepo's strict-TypeScript template** (`strict` + `noUncheckedIndexedAccess`). Hold that line: no new `any`, no new suppressions.

## i18n (`src/i18n/`)

- **`languages.ts`** — `SUPPORTED_LANGUAGES` (the `{ value, label, locale }` tuples) is the canonical language registry and the source of `SupportedLanguageCode`. Adding a language starts here.
- **`<locale>/`** — one folder per language, with one file per UI domain (`common.ts`, `admin.ts`, `budget.ts`, …) plus an `index.ts` barrel. Every file exports a flat map of **dot-namespaced string keys** typed as `TranslationStrings` (e.g. `'common.save': 'Save'`). The runtime `t(key)` only resolves these top-level keys.
- **`en/` is canonical.** Every other locale must have the **identical file set and identical top-level keys** — this is enforced by `i18n:parity:strict` (and `i18n-parity.spec.ts`) and is a CI gate (`chore: enforce i18n parity`). When you add or rename a key, update **every** locale, or parity fails.
- `types.ts` defines `TranslationStrings`; `index.ts` re-exports types + language metadata (not the strings themselves — those load per-locale).

## Sanitization (`src/sanitize/sanitize.ts`)

`isomorphic-dompurify` (same code in browser and Node, tree-shakes so the client bundle doesn't pull jsdom). Minimal inline-only allow-list today; it guards the few surfaces that interpolate user strings into markup (currently the Journey banner) and is the designated home if rich-text/Markdown ships later.
