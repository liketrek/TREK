# CLAUDE.md

Scope: the **`@trek/shared`** workspace — the **single source of truth** for API contracts (Zod) and all i18n strings; server and client both import from it. See the repo-root `CLAUDE.md` for the monorepo picture.

## Commands (run from `shared/`)

```bash
npm run build              # tsdown → dist/ (CJS + ESM + .d.ts). REQUIRED before server/client typecheck or run
npm run build:watch        # what the root `npm run dev` runs
npm run typecheck          # tsc --noEmit
npm run lint               # eslint, check-only (lint-prettier.yml)
npm run lint:fix           # eslint --fix
npm run lint:format        # Prettier outside scripts/format-baseline.json, which only shrinks (lint-prettier.yml)
npm run test               # vitest run — co-located *.spec.ts files
npm run i18n:parity        # audit locale drift, exits 0
npm run i18n:parity:strict # CI gate, exits 1 on any drift (also runs the untranslated ratchet below)
npm run i18n:untranslated  # the untranslated-strings ratchet on its own
npm run i18n:untranslated:update # lower scripts/i18n-untranslated-baseline.json after translating; never raises it
npm run contracts:open     # CI gate (after build): open shapes in request schemas may only shrink
```

Single test: `npx vitest run src/i18n/i18n-parity.spec.ts`, or `npx vitest run -t "rejects extra keys"`.

**Always rebuild after changing a schema or locale** — the consumers import the compiled `dist/`, not `src/`. If a server/client typecheck can't see a new export, you forgot `npm run build` here.

## Build & exports

`tsdown.config.ts` emits the root barrel, the i18n metadata barrel, and **one entry per locale** so each locale is its own lazy-loadable chunk (the client dynamic-imports them). `zod` is never bundled. The `exports` map exposes `@trek/shared` (contracts), `@trek/shared/i18n` (metadata/types) and `@trek/shared/i18n/<locale>`.

## Contracts (`src/<domain>/<domain>.schema.ts`)

One folder per domain exporting Zod schemas plus inferred types (`export type X = z.infer<typeof xSchema>`), re-exported from the root barrel. Domain-agnostic primitives (`idSchema`, `idParamSchema`, `nonEmptyString`, pagination) live in `src/common/`. A few pure isomorphic helpers live beside the schemas because both sides need the same answer; they follow the same rules as everything here.

**`src/plugin-permissions.ts` is machine-generated** from the server's plugin protocol — never hand-edit it; `npm run gen:plugin-facts` from `server/` regenerates it and `check:plugin-facts` is the CI drift gate.

**Schemas mirror the exact wire behavior of existing routes** (`weather/weather.schema.ts` is the example): strings stay strings if the route never coerced them, optional fields reflect partial response subsets, and bespoke 4xx error strings are reproduced in the server controller, not derived from the schema. Don't "tidy up" a schema to be stricter than the contract it documents.

**Response schemas** (`<x>ResponseSchema`, with the row schemas they are built from) describe what a route answers, and the server checks them: a handler declares one with `@ResponseContract(schema)` (`server/src/nest/common/response-contract.ts`), and under `NODE_ENV=test` every response it sends is parsed against it, so the e2e and integration suites fail on drift. They follow the wire exactly as the routes have always sent it, flags as 0/1 and times as stored where that is what goes out, booleans where the service converts. Objects are not strict: an extra key passes, a declared one that is missing or of another type fails. `successResponseSchema` (`{ success: true }`) and `emptyResponseSchema` (a 204) live in `src/common/`. They are exported from the barrel for the client to type its calls with; the client's own copies in `types.ts` have not moved onto them yet.

## Rules for new contracts

The parity rule governs **existing** routes; it is not a license to mint new debt:

- **The contract describes the wire, not the storage engine.** New booleans are `z.boolean()` — convert SQLite 0/1 at the service boundary, never add a `z.union([z.boolean(), z.number()])`. New ids use `idSchema`/`idParamSchema`, never `number | string`. Request and response types for a field must agree.
- **Use the shared primitives** instead of re-declaring bare `z.number()`/`z.string()` per domain. Narrow an existing open object rather than adding a new `z.record(...)`/passthrough body, because "any object" gives zero drift protection. `contracts:open` (`scripts/open-request-schemas.mjs`) counts the open shapes in every exported `*RequestSchema` (a loose object, a record of unknown, a `z.unknown()`/`z.any()` field or body, a `z.custom()`/`z.instanceof()`, each counted once per path it sits at) against `scripts/open-request-schemas-baseline.json`: a new request schema may hold none, an existing one no more than its entry. It reads the built `dist/`; `src/open-request-schemas.spec.ts` runs the same check over `src/` in `npm test`. After narrowing a schema, `npm run contracts:open -- --update` lowers the baseline (it never raises or adds an entry). The suffix is only a convention, so the server holds the schemas it really binds to the same count: `npm run contracts:dto-open --workspace=server` walks every `createZodDto` class, whatever its schema is called, against `server/scripts/dto-open-shapes-baseline.json`.
- **Add a schema, add a spec** — especially for lenient parsers fed by untrusted or LLM input.
- **Stay lean and isomorphic**: zero imports from client/server, no `node:` APIs, effectively no new runtime dependencies (the contract layer approaches `zod`-only; i18n is a separable concern — don't couple new contract code to it).
- **Never hand-copy a locale list.** `SUPPORTED_LANGUAGES` in `src/i18n/languages.ts` is the one registry — derive barrels, loaders and spec maps from it.
- **This is the monorepo's strict-TypeScript template** (`strict` + `noUncheckedIndexedAccess`). No new `any`, no new suppressions.

## i18n (`src/i18n/`)

- **`languages.ts`** — `SUPPORTED_LANGUAGES` is the canonical registry and the source of `SupportedLanguageCode`. Adding a language starts here.
- **`<locale>/`** — one folder per language, one file per UI domain plus an `index.ts` barrel; each file exports a flat map of dot-namespaced keys typed as `TranslationStrings`. The runtime `t(key)` only resolves these top-level keys.
- **`en/` is canonical.** Every other locale must have the identical file set and top-level keys — `i18n:parity:strict` enforces it in CI. When you add or rename a key, update every locale.
- **Every locale gets a real translation; an English placeholder is not acceptable.** Write native phrasing with the locale's own punctuation and the same `{placeholders}` as `en`; if you genuinely cannot translate one, say so instead of filling it with English. Parity only checks that the key exists, so `i18n:parity:strict` also runs a ratchet (`scripts/i18n-untranslated.mjs`): per locale and file, the `// en-fallback` markers and the unmarked values identical to `en` may not grow past `scripts/i18n-untranslated-baseline.json`. An identical value is excused only when, after dropping placeholders, markup, URLs/e-mail/paths, the product names in `BRAND_NAMES` (Google Maps, Atlas, Immich) and the unit symbols in `UNITS`, no plain word is left (a word with a capital after its first letter, an acronym or a single letter does not count), so "{count} km", "GPX", "OAuth" and "Atlas" pass while "Settings" and "Source code" count. A single ordinary word that really is the locale's own (German "Status", French "Transport") carries `// same-as-en` on its declaration; the marker is honoured only on a value holding one plain word once the excused parts are dropped (on a phrase it is ignored, so it cannot wave a copied sentence through) and only in Latin-script locales (`LATIN_LOCALES`), because a Latin word in Japanese or Arabic is English whatever it says. A plural form en has no key for (Russian `.few`, Arabic `.two`) counts when it equals any form en spells out for that group. Every locale folder must be on `LATIN_LOCALES` or `NON_LATIN_LOCALES`, so a new language is classified there first. Deleting a marker without translating moves the string from one count to the other and still fails. After translating, run `npm run i18n:untranslated:update` to lower the baseline; nothing raises it.
- **Count-bearing strings use plural forms, never `count === 1` in the caller.** The key holds the general form (the CLDR "other" category) and `key.zero|one|two|few|many` hold the forms the language's `Intl.PluralRules` selects for whole numbers (`plural.ts`); `t(key, { count })` (or `{ n }`) picks one. Pass the count as a number. Russian needs `.one`, `.few` and `.many`, Arabic all five, Japanese none. `i18n:parity` checks that every locale has exactly the forms its language reaches with whole numbers and none it never selects. A form may spell the number out (Arabic "ملف واحد") only where its category is that one number; French `one` also covers 0 and Russian `one` covers 21, so they keep `{count}`. A string whose wording changes with the number (the old "Copy to trip" for one place, "Copy {count} to trip" for more) is a plural group whose `one` drops the number where the language allows it, not two keys switched in the caller.
- **An `en` string carrying `{count}` or `{n}` must be a plural group**, even when the forms read the same (a label such as "Notes: {count}"), so every language can inflect. **A quantity is always named `{count}` (or `{n}`)**, the only params `t()` picks a form by: "All {days} days" read "Все 3 дней" in Russian. `i18n:parity` refuses an ungrouped string carrying `{count}`, `{n}` or one of the quantity names in `QUANTITY_PARAMS` (`{days}`, `{minutes}`, `{objects}`, `{max}` …), unless `NOT_PLURAL` in `scripts/i18n-parity.mjs` lists it with a reason: only for a number that is never a quantity (a day number, a step, a multiplier) or one followed by nothing but a unit symbol ("{minutes} min", "{max} MB"). A second number in the same string keeps its own name ("{over} of {count} days"). An entry that stops matching fails too.
- **Further i18n specs run in `npm test`** and fail changes that parity lets through: placeholder parity (every `{placeholder}` in an `en` string must appear in each translation), no `en` string may call TREK "self-hosted" (the same build runs on managed installs; exemptions live in the spec), and a wording regression test for plugin permission descriptions (currently one string; add a case there when a permission's real behavior changes). None of these are part of `i18n:parity`, which checks key sets, plural forms, count strings and the untranslated ratchet.
- **The i18n scripts read the tables as text** through `scripts/i18n-catalog.mjs`: a value must be one string literal on the key's line or the next, and anything else (a concatenation, a template literal) is an error rather than a skipped key. Their specs use the fixtures in `scripts/fixtures/`. That en holds every key the client names is checked on the client side (`npm run lint:i18n-keys` in `client/`).

## Sanitization (`src/sanitize/sanitize.ts`)

`isomorphic-dompurify` with a minimal inline-only allow-list (a rich-text variant already exists there for when rich text ships). `sanitizeInlineHtml` backs the client's HTML translation path; `escapeHtml` is used wherever the client builds markup from user strings (map popups, account screens). This is meant to be the one home for escaping. No lint rule enforces that yet and a handful of client files still carry a local `escapeHtml` — that is debt to fold in, not a pattern to copy.

## Money (`src/money/money.ts`)

`toMinor`, `sumMinor`, `splitEqualShares` and `currencyDecimals` are the budget arithmetic both sides must agree on to the cent: amounts are netted in whole hundredths, equal splits hand the leftover hundredths out by rotation from `itemId % n`, and the shares always sum back to the total. The server's settlement uses these directly; `money.spec.ts` holds the share table that used to be duplicated between the server and client tests. The client still carries its own `splitEqualShares` (in euros, `CostsPanel.helpers.ts`) and `currencyDecimals` (`utils/formatters.ts`); folding them onto these is client work, not a second implementation to copy.

## Permissions (`src/permissions/permissions.ts`)

`PERMISSION_ACTIONS` is the catalog of configurable trip permissions (key, default level, the levels an admin may pick), `PermissionKey` the union of its keys and `evaluatePermission(level, { isAdmin, isOwner, isMember })` the one decision rule. The server's `PermissionsService` and `@RequirePermission(action: PermissionKey)` are built on them, so a new action starts here and a misspelt key fails to compile. The client still evaluates in its own `useCanDo` (with "not configured = allow"); moving it onto `evaluatePermission` is client work.

## Reservation types (`src/reservation/reservation-types.ts`)

`RESERVATION_TYPES` is the catalog of reservation types in picker order, each with its flags (`isTransport`, `isCarrier`, `isRental`, `isStay`, `hasLegs`, `creatableViaMcp`). The named subsets (`TRANSPORT_RESERVATION_TYPES`, `MCP_CREATABLE_TRANSPORT_TYPES`, `BOOKING_RESERVATION_TYPES`, `CARRIER_RESERVATION_TYPES`, `TRAVEL_RESERVATION_TYPES`, …) are derived from it in that order, so an MCP enum built from one lists its values as the UI does. A new type is added here once; the spec pins every subset. The column stays free text: `reservationTypeSchema` and `reservationStatusSchema` accept the catalog values or any stored string, and the request schemas stay as tolerant as before. Inside `reservationSchema` the two fields are strings described by the catalog rather than the union, because Zod 4 types a union field as optional for a consumer compiled without strictNullChecks (the client), which would loosen `Reservation`. The client's own type lists (`TRANSPORT_TYPES` and the `cable_car` lists) have not moved onto it yet.
