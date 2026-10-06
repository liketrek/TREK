/**
 * Re-runnable entity generator wrapper (ORM migration Plan 2, Task 2).
 *
 * `@mikro-orm/entity-generator` 7.2.1 already produces the Phase 0 shape
 * (`Days`/`DayNotes`/`Trips`, see `docs/superpowers/specs/2026-09-21-orm-repository-migration-design.md`
 * D1/D2) from the migrated schema once configured with a naming strategy whose
 * `columnNameToProperty` is the identity — every scalar and FK twin comes out
 * named exactly like its column. What it does NOT do on its own (verified by
 * reading `node_modules/@mikro-orm/entity-generator/*.js` and by running this
 * wrapper against the real schema, not by assumption):
 *
 *   - it leaves multi-word relation names snake_case and inverse-collection
 *     names camelCase (the opposite of what Phase 0 does for each);
 *   - it never marks a relation `.hidden()`;
 *   - it emits `p.datetime()` / `p.unknown().columnType('REAL')` instead of
 *     `p.type(DbTimestampType)` / `p.double()`;
 *   - it leaves `updateRule('no action')` / `deleteRule('no action')` noise
 *     (SQLite reports "NO ACTION" for every FK that never named a rule);
 *   - integer autoincrement primary keys come out `.primary().nullable()`
 *     (SQLite's `PRAGMA table_info` carries no AUTOINCREMENT flag);
 *   - it never binds a `repository:`;
 *   - the "collision class" (an FK column with no `_id` suffix, e.g.
 *     `country`, `created_by`) gets a relation named after the column AND a
 *     same-named scalar twin — colliding — and even once renamed, the
 *     generator's own override mechanism for a to-one relation only ever
 *     emits `.name(<column>)`, which Task 0/1 proved is inert for a relation
 *     (`.joinColumn(<column>)` is the only thing that actually pins the FK
 *     column; see `.superpowers/sdd/2026-09-22-orm-phase2-entity-rewrite/task-0-report.md`
 *     and `task-1-report.md`, fact (c)).
 *
 * Each gap above is closed by a single named rule function, applied either at
 * the metadata level (`onProcessedMetadata`, preferred — the MikroORM-
 * documented hook for this exact purpose) or, only where the metadata cannot
 * carry the fix into the rendered `defineEntity` call (traced against the
 * actual renderer in `SourceFile.js`/`DefineEntitySourceFile.js`, not
 * guessed), as a small text pass over the generated source. See
 * `task-2-report.md` for which rule lives at which level and why.
 *
 * This script never writes into `src/db/entities/` on its own — `--write` is
 * accepted (Task 3 uses it) but this task never passes it. It never opens
 * `data/travel.db` either: it migrates a throwaway temp file (via the same
 * `Migrator` extension `buildApp()` uses, configured directly rather than by
 * importing `src/db/orm.ts` — that module transitively imports
 * `src/db/database.ts`, which opens `resolveDbPath()` — i.e. the real
 * database file — as a side effect of being imported at all).
 *
 * Usage:
 *   node --import tsx scripts/generate-entities.ts --out <dir>
 *   node --import tsx scripts/generate-entities.ts --write   # Task 3 only
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ReferenceKind,
  UnderscoreNamingStrategy,
  type Connection,
  type EntityMetadata,
  type EntityProperty,
  type ImportsResolver,
  type Platform,
} from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { Migrator } from '@mikro-orm/migrations';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** `server/` — every relative path below (migrations, repositories, entities) is anchored here. */
const SERVER_ROOT = path.join(__dirname, '..');
const ENTITIES_DIR = path.join(SERVER_ROOT, 'src/db/entities');
const REPOSITORIES_DIR = path.join(SERVER_ROOT, 'src/db/repositories');

// ---------------------------------------------------------------------------
// Naming strategy — D1: scalars and FK twins are named exactly like their
// column (`day_id`, `sort_order`), never camelCased. Only `columnNameToProperty`
// is overridden; table names and everything else (`classToTableName`,
// `joinKeyColumnName`, `inverseSideName`, `manyToManyPropertyName`, …) stay the
// stock `UnderscoreNamingStrategy` behaviour, which is what lets the renamed
// relations below still compute the *same* FK column the schema already has
// (see RULE5_renameOwningRelations).
// ---------------------------------------------------------------------------
export class SnakeProps extends UnderscoreNamingStrategy {
  override columnNameToProperty(column: string): string {
    return column;
  }
}

// ---------------------------------------------------------------------------
// KNOWN_DIFFS — the only allowed differences between this wrapper's output
// (into a scratch dir) and the five hand-written reference entities
// (`Days`, `DayNotes`, `Trips`, `BudgetCategoryOrder`, `VacayUserSettings`).
// Anything else in the diff is a rule bug, not an entry to add here.
// ---------------------------------------------------------------------------
export const KNOWN_DIFFS = `
1. Index duplicated onto the FK twin. The generator carries a relation's named
   index (".index('idx_days_trip_id')") onto BOTH the owning relation AND its
   persist(false) scalar twin; the hand-written files only ever declare it on
   the relation. Harmless (SQLite would just create the same index once) —
   verified against the actual generated output, not assumed.
2. Class-field TS annotation on an integer autoincrement primary key. The
   hand-written files declare it "id?: number | null;" as an ergonomic hint
   (you can build the entity before an id is assigned); the generator's own
   renderer ties both the "?" and the "| null" suffix to metadata property
   "nullable" (see SourceFile.js#getPropertyDefinition), and rule 3 below sets
   nullable=false on this exact property so the metadata BUILDER CHAIN has no
   stray ".nullable()" (matching the reference's *metadata*, which is what the
   parity tests and the ORM itself read) — at the cost of the class field
   rendering "id!: number & Opt;" instead (and the resulting "type Opt" import).
   Purely a TypeScript-side annotation; it does not change runtime behaviour,
   hydration, or the metadata the schema parity test compares. Confirmed by
   generating the real schema, not assumed. It is also safe at the database
   level despite the metadata's builder chain having no explicit
   ".autoincrement()" call for this property: MikroORM's own
   MetadataDiscovery#initAutoincrement (node_modules/@mikro-orm/core/metadata/MetadataDiscovery.js)
   defaults "autoincrement ??= true" for any single numeric PK at discovery
   time, so the ORM treats the generated and hand-written metadata
   identically once loaded — confirmed by generating the real schema and
   inserting through the written entity (Days.repository.test.ts's insert
   passes). Task 3 should have its own parity test (a PARITY-010 or sibling)
   asserting "autoincrement === true" in the *discovered* metadata for every
   integer PK, so this inference is pinned rather than assumed going
   forward.
3. Method-call order within a builder chain (e.g. ".deleteRule('cascade').hidden().index(...)"
   vs the hand-written files' ".hidden().deleteRule('cascade').index(...)").
   The renderer assembles each property's options in its OWN fixed sequence
   (kind-specific options — fieldName/deleteRule/updateRule/primary/generated —
   then common flags — nullable/hidden/etc. — then index/unique), which the
   hand-written files, authored before this generator produced this shape, did
   not follow. Cosmetic only: every option present is the same, only the
   textual order of independent chained calls differs.
4. "defaultRaw" renders as a backtick template literal ("\`CURRENT_TIMESTAMP\`")
   rather than a single-quoted string ("'CURRENT_TIMESTAMP'"). SourceFile.js's
   own renderer always uses a template literal for defaultRaw specifically (so
   raw SQL containing "\${" is escaped rather than interpolated) — the
   hand-written files predate this generator and used a plain string.
   Semantically identical TypeScript.
5. A nullable column's DB-level default. Phase 0's own hand-written files are
   not internally consistent about restating a NULLABLE column's default in
   metadata at all: "DayNotes.sort_order" (nullable, "REAL DEFAULT 0") has
   ".default(0)"; "DayNotes.icon" (nullable, "TEXT DEFAULT '📝'") has none
   at all, relying only on the class-field initialiser. The wrapper's default
   rule (RULE_normalizeLiteralDefaults) deliberately scopes itself to NOT
   NULL columns only — see that rule's doc comment — and leaves whatever the
   generator's own (occasionally "defaultRaw" instead of "default", or
   entirely absent) rendering produces for a nullable column. This is exactly
   Task 0's skipped PARITY-005 (column defaults) territory, not this task's.
6. Trailing blank line / whitespace at end of file, if any — a generator
   formatting convention, immaterial to the parsed module.

Fix round 1 (task-2-fix-brief.md) resolved the former #6 (the
VacayUserSettings.user_id PK-twin nullability judgment call) by taking the
generator's answer as correct and updating the hand-written file to match
(see .superpowers/sdd/2026-09-22-orm-phase2-entity-rewrite/task-2-review.md,
"#6 — generator or hand-written file?") — it is no longer a diff at all, so
it is no longer listed here.
`.trim();

// ---------------------------------------------------------------------------
// JSON columns — SQLite has no JSON storage class, so PRAGMA table_info can
// never tell the generator "this TEXT column is JSON-shaped"; that's always a
// judgement call an entity author made (today: exactly one column in the
// whole schema, `addons.config`, declared `p.json<AddonConfig>()`, grepped
// from src/db/entities). `JSON_COLUMNS` maps `table.column` -> the TypeScript
// type name to render (`p.json<AddonConfig>()`, never a bare `p.json()` or
// `p.json<unknown>()` — Fix round 1, task-2-review.md C3: a stale
// `runtimeType` left the class field as `IType<string, any>`, a new `any` in
// generated output). Every value here needs a matching declaration in
// `JSON_INTERFACES` below — `injectJsonInterfaces` throws otherwise.
// ---------------------------------------------------------------------------
export const JSON_COLUMNS: ReadonlyMap<string, string> = new Map([['addons.config', 'AddonConfig']]);

/**
 * The interface declaration text `injectJsonInterfaces` inserts into a
 * generated file for every `JSON_COLUMNS` type name it references. Not
 * reconstructable from the schema (SQLite has no notion of a JSON column's
 * shape) — this is a maintained list, the same shape as `JSON_COLUMNS`
 * itself. `AddonConfig`'s shape is carried forward from the current
 * hand-written `Addons.entity.ts`.
 */
const JSON_INTERFACES: Readonly<Record<string, string>> = {
  AddonConfig: 'export interface AddonConfig {\n  [key: string]: unknown;\n}\n',
};

// ---------------------------------------------------------------------------
// Boolean columns — same problem as JSON, the opposite direction: SQLite has
// no BOOLEAN storage class either (every "boolean" column is really
// INTEGER-affinity), so a plain `p.boolean()` column re-introspects as
// `p.integer()` and the class field silently degrades `boolean` -> `number`
// (Fix round 1, task-2-review.md I4). One column in the whole schema today
// (`addons.enabled`, grepped from src/db/entities — the only `p.boolean()` in
// the tree) — a maintained allow-list, same shape as `JSON_COLUMNS`.
// ---------------------------------------------------------------------------
export const BOOLEAN_COLUMNS: ReadonlySet<string> = new Set(['addons.enabled']);

// ---------------------------------------------------------------------------
// Rule 1 (metadata level): scalar type mapping.
//
// The naming strategy already makes every scalar/twin property name equal its
// column (no rule needed for that half of D1). What's left is the TYPE: the
// generator leaves a column it can't map cleanly as `p.unknown().columnType(<T>)`.
// On the current schema the only such family is SQLite's REAL affinity
// (MikroORM's SQLite platform never overrides `getDoubleDeclarationSQL`, so it
// stays abstract — confirmed in task-0-report.md while building the parity
// test's own normaliser). Anything else is unexpected: fail loudly, naming the
// column, rather than silently emitting a wrong or lossy type.
// ---------------------------------------------------------------------------
const UNKNOWN_COLUMN_TYPE_MAP: Readonly<Record<string, { type: string; runtimeType: string }>> = {
  real: { type: 'double', runtimeType: 'number' },
};

/**
 * `prop.runtimeType` must move with `prop.type` here, not just the type name.
 * Left stale (introspection sets it to `'unknown'` alongside `type: 'unknown'`),
 * `SourceFile.js#breakdownOfIType` sees `prop.runtimeType !== rawType` (the
 * freshly-retyped `'double'`'s own runtime, `'number'`) and treats that
 * mismatch as genuine type ambiguity — it wraps the class field in
 * `IType<unknown, number>` and, separately, `needsExplicitColumnType()` also
 * disagrees with itself and adds a redundant `.columnType('REAL')`. Both
 * disappear once `runtimeType` is corrected. Confirmed by generating the real
 * schema (`DayNotes.sort_order`) before and after this fix, not assumed.
 */
/** A scalar this run retyped (Rule 1's `p.unknown()` fix or Rule 2's `DbTimestampType`) — its metadata line may carry a redundant `.columnType()` (see below). */
export interface RetypedScalarFixup {
  className: string;
  propName: string;
}

export function RULE1_fixUnknownScalarTypes(metadata: EntityMetadata[]): RetypedScalarFixup[] {
  const fixups: RetypedScalarFixup[] = [];
  for (const meta of metadata) {
    for (const prop of Object.values(meta.properties)) {
      if (prop.kind !== undefined && prop.kind !== ReferenceKind.SCALAR) continue;
      if (prop.type !== 'unknown') continue;
      const columnType = (prop.columnTypes?.[0] ?? '').toLowerCase();
      const mapped = UNKNOWN_COLUMN_TYPE_MAP[columnType];
      if (!mapped) {
        throw new Error(
          `generate-entities: ${meta.tableName}.${prop.fieldNames.join(',')} has an unmapped column type ` +
            `"${prop.columnTypes?.[0]}" (property "${meta.className}.${prop.name}"). Add it to ` +
            'UNKNOWN_COLUMN_TYPE_MAP once you know what it should render as — never guess.',
        );
      }
      prop.type = mapped.type;
      prop.runtimeType = mapped.runtimeType;
      fixups.push({ className: meta.className, propName: prop.name });
    }
  }
  return fixups;
}

/**
 * A JSON column this run marked — like `RetypedScalarFixup` (it needs the
 * same `.columnType()` strip and is folded into `retypedScalars`) plus the
 * TypeScript type name to render.
 */
export interface JsonColumnFixup extends RetypedScalarFixup {
  typeName: string;
}

/**
 * Rule 1b (metadata level): mark known JSON columns so they render
 * `p.json()` (see JSON_COLUMNS above). `prop.runtimeType` must move with
 * `prop.type` here for the same reason Rule 1's doc comment gives — left at
 * its introspected value (`'string'`, since SQLite stores JSON as TEXT), the
 * mismatch against `JsonType`'s own always-`'any'` runtime type would still
 * make `SourceFile.js#breakdownOfIType` treat the property as ambiguous and
 * wrap the class field in `IType<..., any>`. `fixJsonClassFieldTypes` (a text
 * pass, see below) closes what setting `runtimeType` here does not: MikroORM
 * has no metadata escape from `IType<T, any>` for a JSON-typed property at
 * all (`JsonType#runtimeType` is a hardcoded getter, not derived from the
 * property) — confirmed by generating the real schema and reading
 * `JsonType.js`, not assumed.
 */
export function RULE1b_markJsonColumns(metadata: EntityMetadata[]): JsonColumnFixup[] {
  const fixups: JsonColumnFixup[] = [];
  for (const meta of metadata) {
    for (const prop of Object.values(meta.properties)) {
      if (prop.kind !== undefined && prop.kind !== ReferenceKind.SCALAR) continue;
      const typeName = JSON_COLUMNS.get(`${meta.tableName}.${prop.fieldNames[0]}`);
      if (!typeName) continue;
      prop.type = 'json';
      prop.runtimeType = typeName;
      fixups.push({ className: meta.className, propName: prop.name, typeName });
    }
  }
  return fixups;
}

/** Rule 1c (metadata level): mark known boolean columns so they render `p.boolean()` (see BOOLEAN_COLUMNS above). */
export function RULE1c_markBooleanColumns(metadata: EntityMetadata[]): RetypedScalarFixup[] {
  const fixups: RetypedScalarFixup[] = [];
  for (const meta of metadata) {
    for (const prop of Object.values(meta.properties)) {
      if (prop.kind !== undefined && prop.kind !== ReferenceKind.SCALAR) continue;
      if (!BOOLEAN_COLUMNS.has(`${meta.tableName}.${prop.fieldNames[0]}`)) continue;
      prop.type = 'boolean';
      // `runtimeType` must move with `type` here too, for the same reason
      // Rule 1's doc comment gives: left at its introspected value
      // (`'number'`, SQLite has no BOOLEAN storage class), the mismatch
      // against `BooleanType`'s own runtime type ('boolean') would make
      // `breakdownOfIType` treat the property as ambiguous and wrap the
      // class field in `IType<number, boolean>` — confirmed by generating
      // the real schema before this fix, not assumed.
      prop.runtimeType = 'boolean';
      // The introspected DB default is always the raw SQLite value (`0`/`1`,
      // a number, since SQLite has no boolean storage class either) —
      // coerce it to a real boolean so a `p.boolean()` column's `.default()`
      // renders `.default(false)`, not the now ill-typed `.default(0)`.
      if (typeof prop.default === 'number') prop.default = prop.default !== 0;
      if (typeof prop.defaultRaw === 'string' && /^-?\d+$/.test(prop.defaultRaw)) {
        prop.defaultRaw = prop.defaultRaw !== '0' ? 'true' : 'false';
      }
      fixups.push({ className: meta.className, propName: prop.name });
    }
  }
  return fixups;
}

/**
 * Rule 1d (metadata level): a numeric scalar's class-field initialiser must
 * never render `NaN`.
 *
 * `@mikro-orm/sql`'s own introspection (`DatabaseTable.js#getPropertyDeclaration`
 * -> `getPropertyDefaultValue`) computes a NUMERIC column's `prop.default` as
 * `+defaultValue` — a plain unary-plus coercion of the raw SQLite default
 * text — whenever that text doesn't equal the literal, lowercase string
 * `'null'`. SQLite reports the DDL's exact casing back through
 * `PRAGMA table_info` (`'NULL'`, not `'null'`, for `DEFAULT NULL`), and
 * `SchemaHelper#normalizeDefaultValue`'s own `'null'` check
 * (`DatabaseTable.js` line ~869) is the same case-sensitive comparison — so
 * neither the `DEFAULT NULL` case NOR a non-literal expression default
 * (`DEFAULT (strftime('%s','now'))`) is ever recognised as "no usable
 * numeric value", and `+'NULL'` / `+"(strftime('%s','now'))"` both evaluate
 * to `NaN`. That `NaN` becomes `prop.default`, which
 * `SourceFile.js#getPropertyDefinition` then treats as a genuine, usable
 * default (`NaN` is neither `undefined` nor `null`) and renders `= NaN` as
 * the class-field initialiser — confirmed by generating the real schema
 * (`BudgetItems.persons`/`.days`, `IdempotencyKeys.created_at`,
 * `BudgetItems.place_id`/`.reservation_id`, `PackingBags.user_id`) and by
 * reading `node_modules/@mikro-orm/sql/schema/DatabaseTable.js`, not
 * assumed. `prop.defaultRaw` itself is unaffected — it is threaded straight
 * through to `.defaultRaw(...)` in the rendered schema and is correct there;
 * only the class-field initialiser is wrong, and it is wrong specifically
 * because the upstream library's `NaN` looks like "a real number" to the
 * renderer's own `useDefault` check.
 *
 * Clearing `prop.default` back to `undefined` (never `null` — `null` would
 * make the renderer's `hasUsableNullDefault` branch fire and print `= null`,
 * which is still an initialiser this rule must not emit) makes the
 * renderer's `useDefault` check naturally false, so NO initialiser is
 * emitted at all: the class field falls back to nullability alone —
 * `?: number | null` for a nullable column, `!: number` for a NOT NULL one
 * (matching every other scalar's fallback shape in this generator).
 *
 * A `defaultRaw` that IS a finite numeric literal (`'0'`, `'1'`) is left
 * completely alone: `Number(raw)` is correct there, `prop.default` already
 * holds the right value, and nothing needs fixing.
 */
export function RULE1d_fixNaNNumericDefaults(metadata: EntityMetadata[]): void {
  for (const meta of metadata) {
    for (const prop of Object.values(meta.properties)) {
      if (prop.kind !== undefined && prop.kind !== ReferenceKind.SCALAR) continue;
      if (typeof prop.defaultRaw !== 'string') continue;
      if (Number.isFinite(Number(prop.defaultRaw))) continue; // a genuine numeric literal — untouched
      if (typeof prop.default !== 'number' || !Number.isNaN(prop.default)) continue; // nothing broken here
      prop.default = undefined;
    }
  }
}

// ---------------------------------------------------------------------------
// Rule 2 (metadata level): p.datetime() -> p.type(DbTimestampType).
//
// `prop.type = 'DbTimestampType'` (a plain string that is NOT a key in
// @mikro-orm/core's `types` registry) makes the renderer emit `p.type(DbTimestampType)`
// verbatim (DefineEntitySourceFile#getPropertyBuilder: `!(options.type in types)`
// -> `p.type(${options.type})`), and it auto-adds 'DbTimestampType' to the
// file's entityImports (SourceFile#getScalarPropertyDecoratorOptions,
// isTypeStringMissingFromMap branch) — the IMPORT PATH for that identifier
// (`../types`) is resolved by the onImport hook below, also metadata/config
// level, not a text pass. `.nullable()`/`.defaultRaw(...)` come from the
// already-introspected `prop.nullable`/`prop.defaultRaw` and need no rule;
// introspection never invents an `onCreate` hook (there is nothing in a
// PRAGMA to discover one from), so "never onCreate" needs no enforcement here.
// ---------------------------------------------------------------------------
/** A scalar this run retyped to `DbTimestampType` — the class field's type still needs a text fix (see below). */
export type TimestampFixup = RetypedScalarFixup;

export function RULE2_datetimeToDbTimestampType(metadata: EntityMetadata[]): TimestampFixup[] {
  const fixups: TimestampFixup[] = [];
  for (const meta of metadata) {
    for (const prop of Object.values(meta.properties)) {
      if (prop.kind !== undefined && prop.kind !== ReferenceKind.SCALAR) continue;
      if (prop.type !== 'datetime') continue;
      prop.type = 'DbTimestampType';
      fixups.push({ className: meta.className, propName: prop.name });
    }
  }
  return fixups;
}

// ---------------------------------------------------------------------------
// Rule 3 (metadata level): integer `id` PK -> p.integer().primary().autoincrement().
//
// All 122 integer PKs in the migrations are AUTOINCREMENT (inputs.md), but
// SQLite's PRAGMA table_info carries no such flag, so the generator always
// emits `.primary().nullable()` for one. `nullable = false` is what removes
// the stray `.nullable()` from the metadata BUILDER CHAIN (SourceFile's
// getCommonDecoratorOptions emits `.nullable()` whenever `prop.nullable` is
// true, unconditionally) — the one place this creates a *textual*, not
// semantic, difference from the hand-written files is documented as
// KNOWN_DIFFS #2 above. Composite and text PKs are untouched, per the plan
// ("`.nullable()` on text PKs is parity-correct — keep").
// ---------------------------------------------------------------------------
export function RULE3_integerPkAutoincrement(metadata: EntityMetadata[]): void {
  for (const meta of metadata) {
    if (meta.getPrimaryProps().length !== 1) continue; // composite PK — untouched
    const [pk] = meta.getPrimaryProps();
    if (pk.kind !== undefined && pk.kind !== ReferenceKind.SCALAR) continue; // a relation PK — untouched
    const columnType = (pk.columnTypes?.[0] ?? '').toLowerCase();
    if (columnType !== 'integer') continue; // a text PK — untouched
    pk.autoincrement = true;
    pk.nullable = false;
  }
}

// ---------------------------------------------------------------------------
// Rule 4 (metadata level): every relation, owning and inverse, any kind, hidden().
// ---------------------------------------------------------------------------
export function RULE4_hideAllRelations(metadata: EntityMetadata[]): void {
  for (const meta of metadata) {
    for (const prop of meta.relations) {
      prop.hidden = true;
    }
  }
}

function isOwningToOne(prop: EntityProperty): boolean {
  if (prop.kind === ReferenceKind.MANY_TO_ONE) return true;
  return prop.kind === ReferenceKind.ONE_TO_ONE && !prop.mappedBy;
}

function isInverseSide(prop: EntityProperty): boolean {
  if (prop.kind === ReferenceKind.ONE_TO_MANY) return true;
  if (prop.kind === ReferenceKind.ONE_TO_ONE && !!prop.mappedBy) return true;
  if (prop.kind === ReferenceKind.MANY_TO_MANY && !!prop.mappedBy) return true;
  return false;
}

function toCamelCase(snake: string): string {
  return snake.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

function toSnakeCase(camel: string): string {
  return camel.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/** A collision-class relation this run renamed: needs an explicit `.joinColumn()` text fix. */
export interface JoinColumnFixup {
  className: string;
  propName: string;
  column: string;
}

/**
 * Renames don't just need `properties[newName] = prop` (what `addProperty`
 * does) — `EntityGenerator`'s `DefineEntitySourceFile` renders the
 * `properties: {...}` object by iterating `Object.entries(meta.properties)`
 * directly (not the sorted `meta.props`/`propertyOrder` MikroORM otherwise
 * uses), so `removeProperty` + `addProperty`'s delete-then-reinsert always
 * moves a renamed property to the END of the file (Fix round 1,
 * task-2-review.md M7). This rebuilds the dict's key order to match
 * `originalOrder` (captured before any renames), substituting each renamed
 * key for its old one — same prop objects, just re-keyed and reordered in
 * place, so `propertyOrder`/`props`/`relations` (already correct from
 * `addProperty`'s own `sync()`) are untouched.
 */
function restorePropertyOrder(meta: EntityMetadata, originalOrder: readonly string[], renameMap: ReadonlyMap<string, string>): void {
  const keyOrder = originalOrder.map((oldName) => renameMap.get(oldName) ?? oldName);
  const values = keyOrder.map((key) => meta.properties[key]);
  for (const key of keyOrder) delete meta.properties[key];
  keyOrder.forEach((key, i) => {
    meta.properties[key] = values[i];
  });
}

/** Stock `UnderscoreNamingStrategy` behaviour (our `SnakeProps` override never touches it) — used by RULE5 to verify a rename's round trip (see I2 below). No state, safe to share. */
const namingStrategy = new SnakeProps();

/**
 * Rule 5 (metadata level for the rename; text level for the join column — see
 * task-2-report.md "rule 5"): owning relation property name = camelCase of
 * (column minus a trailing `_id`). A "collision class" column (no `_id`
 * suffix: `created_by`, `country`, … — the FK twin would otherwise be named
 * identically to the relation) gets `<camel>Ref` instead, and — because the
 * renderer for a to-one relation only ever knows how to emit `.name(<column>)`
 * as an override, which Task 0/1 proved does not actually pin the FK column —
 * this function also records the (className, newPropName, column) triple for
 * `injectJoinColumns` to turn into an explicit `.joinColumn(<column>)` in the
 * generated text afterwards.
 *
 * A multi-column FK (`prop.fieldNames.length !== 1`) throws rather than
 * silently keeping the raw snake_case name (Fix round 1, task-2-review.md
 * I1 — the schema has zero of these today; the plan's D1 camelCase-relations
 * rule has no shape for one, and nothing else would catch the drift, since
 * `fieldNames` themselves stay correct).
 *
 * For a NORMAL (non-collision-class) rename, this also verifies the round
 * trip: `namingStrategy.joinKeyColumnName(newName, referencedColumn)` must
 * reproduce the real `column`, or the renderer's implicit FK-column inference
 * (nothing pins it explicitly for this case) would silently point at the
 * wrong column the moment a future migration's naming breaks the assumption
 * (Fix round 1, task-2-review.md I2). A mismatch gets the exact same
 * `JoinColumnFixup` treatment as a collision class — no separate code path.
 *
 * Every inverse `mappedBy` across the whole metadata array that pointed at
 * the OLD owning name is fixed up to the new one in the same pass (mappedBy
 * is a plain string on the inverse side; nothing else references an owning
 * relation by name).
 */
export function RULE5_renameOwningRelations(metadata: EntityMetadata[]): JoinColumnFixup[] {
  const fixups: JoinColumnFixup[] = [];
  const renames = new Map<EntityMetadata, Map<string, string>>(); // meta -> oldName -> newName

  for (const meta of metadata) {
    const originalOrder = Object.keys(meta.properties);
    const renameMap = new Map<string, string>();
    for (const prop of [...meta.relations]) {
      if (!isOwningToOne(prop)) continue;
      if (prop.fieldNames.length !== 1) {
        throw new Error(
          `generate-entities: ${meta.className}.${prop.name} is a multi-column FK ` +
            `(${prop.fieldNames.join(', ')}) — RULE5 only knows how to rename a single-column owning ` +
            'relation. Add explicit handling for this relation before regenerating this entity.',
        );
      }
      const column = prop.fieldNames[0];
      const isCollisionClass = !column.endsWith('_id');
      const stripped = isCollisionClass ? column : column.slice(0, -'_id'.length);
      const newName = isCollisionClass ? `${toCamelCase(stripped)}Ref` : toCamelCase(stripped);
      if (newName === prop.name) continue;
      if (meta.properties[newName]) {
        throw new Error(
          `generate-entities: renaming ${meta.className}.${prop.name} to "${newName}" would collide with an ` +
            `existing property of that name. Column: ${column}.`,
        );
      }
      const oldName = prop.name;
      meta.removeProperty(oldName, false);
      prop.name = newName;
      meta.addProperty(prop);
      renameMap.set(oldName, newName);
      if (isCollisionClass) {
        fixups.push({ className: meta.className, propName: newName, column });
      } else {
        const referencedColumn = prop.referencedColumnNames?.[0];
        const derivedColumn = namingStrategy.joinKeyColumnName(newName, referencedColumn);
        if (derivedColumn !== column) {
          fixups.push({ className: meta.className, propName: newName, column });
        }
      }
    }
    if (renameMap.size > 0) {
      renames.set(meta, renameMap);
      restorePropertyOrder(meta, originalOrder, renameMap);
    }
  }

  // Fix up every inverse `mappedBy` that pointed at a renamed owning property.
  for (const meta of metadata) {
    for (const prop of meta.relations) {
      if (!prop.mappedBy) continue;
      const targetMeta = metadata.find((m) => m.className === prop.type);
      if (!targetMeta) continue;
      const renameMap = renames.get(targetMeta);
      const renamed = renameMap?.get(prop.mappedBy);
      if (renamed) prop.mappedBy = renamed;
    }
  }

  return fixups;
}

/**
 * Rule 6 (metadata level): inverse collections and inverse one-to-ones are
 * named snake_case of whatever `bidirectionalRelations` generated (always
 * camelCase, from `namingStrategy.inverseSideName`, a naming-strategy method
 * our `SnakeProps` override does not touch) — matches Phase 0
 * (`day_notes_collection`). Pure case conversion: `dayAccommodationsCollection1`
 * -> `day_accommodations_collection1` (the disambiguating digit the generator
 * itself appends on a naming collision, e.g. two FKs from the same table,
 * survives untouched — the regex only inserts an underscore before an
 * uppercase letter, never before a digit).
 */
export function RULE6_renameInverseCollections(metadata: EntityMetadata[]): void {
  for (const meta of metadata) {
    const originalOrder = Object.keys(meta.properties);
    const renameMap = new Map<string, string>();
    for (const prop of [...meta.relations]) {
      if (!isInverseSide(prop)) continue;
      const newName = toSnakeCase(prop.name);
      if (newName === prop.name) continue;
      if (meta.properties[newName]) {
        throw new Error(
          `generate-entities: renaming ${meta.className}.${prop.name} to "${newName}" would collide with an ` +
            'existing property of that name.',
        );
      }
      const oldName = prop.name;
      meta.removeProperty(oldName, false);
      prop.name = newName;
      meta.addProperty(prop);
      renameMap.set(oldName, newName);
    }
    // Same rendering-order fix as RULE5 (see `restorePropertyOrder`'s doc comment) — M7.
    if (renameMap.size > 0) restorePropertyOrder(meta, originalOrder, renameMap);
  }
}

/**
 * Rule 7 (metadata level): drop `updateRule('no action')` / `deleteRule('no action')`
 * noise. SQLite's `PRAGMA foreign_key_list` reports "NO ACTION" for every FK
 * that never named an ON UPDATE/ON DELETE clause — that's "no information",
 * not a real rule the migration stated, so the generator's raw introspection
 * carries it as noise on nearly every relation. Every other value (cascade,
 * set null, restrict) is real and kept.
 */
export function RULE7_dropNoActionRules(metadata: EntityMetadata[]): void {
  for (const meta of metadata) {
    for (const prop of meta.relations) {
      if (prop.updateRule?.toLowerCase() === 'no action') delete prop.updateRule;
      if (prop.deleteRule?.toLowerCase() === 'no action') delete prop.deleteRule;
    }
  }
}

/**
 * Rule 8 (metadata level): `repository: () => XRepository` + its import.
 * Setting `meta.repositoryClass` is the whole rule — SourceFile's
 * getEntityDeclOptions() (shared by defineEntity/entitySchema output) turns a
 * truthy `repositoryClass` into both the `repository: () => X` option AND an
 * auto-added import for that identifier; the onImport hook below resolves it
 * to `../repositories/X.repository`. Whether the *file* on disk actually gets
 * written (only when missing, never overwritten) is write-mode's job in
 * `writeRepositoriesIfMissing`, not this metadata rule.
 */
export function RULE8_bindRepositories(metadata: EntityMetadata[]): void {
  for (const meta of metadata) {
    meta.repositoryClass = `${meta.className}Repository`;
  }
}

/**
 * Rule 9 (metadata level; DB-dependent — see `collectImplicitUniqueIndexes`
 * below for the half that actually queries the schema): every column-set an
 * inline `UNIQUE(...)` table constraint (or a column-level `UNIQUE`) names
 * gets a matching `uniques: [{ properties: [...] }]` entry.
 *
 * Why this is needed at all: SQLite backs every such constraint with an
 * unnamed `sqlite_autoindex_<table>_<n>` index, and `@mikro-orm/sql`'s own
 * `SqliteSchemaHelper.getIndexes()` calls `isImplicitIndex(name)` — true for
 * any index whose name starts with `sqlite_` — to filter exactly these out
 * before `entity-generator` ever sees them (read directly out of
 * `node_modules/@mikro-orm/sql/dialects/sqlite/SqliteSchemaHelper.js`, not
 * assumed): "Ignore indexes with reserved names, e.g. autoindexes". A NAMED
 * `CREATE UNIQUE INDEX` (`Trips.idx_trips_feed_token`, `Reservations.
 * idx_reservations_external`, …) survives that filter and already renders
 * correctly with no help from this rule — only the inline/unnamed spelling is
 * silently dropped. `settings`'s `UNIQUE(user_id, key)` is the ruling's
 * trigger case (metadata FIDELITY for the constraint `em.upsert`'s conflict
 * target is documented against — see below for what that entry does and
 * does not buy), but the same gap exists on ~40 other tables in the schema
 * (grep `UNIQUE(` across `db/migrations/*.ts`), so this rule is general —
 * every table, not just `settings` — and this task's report says which
 * entities' `uniques:` this adds where none existed in the hand-written
 * baseline before.
 *
 * `implicitUniques` is precomputed once per generator run and handed in as
 * plain data (table name -> one string[] of column names per implicit unique
 * index) specifically so this rule itself stays a pure, fixture-testable
 * function like every other rule in this file — it never opens a connection
 * itself.
 *
 * A column that IS a single-column FK's join column (the `persist(false)`
 * twin's column, e.g. `settings.user_id`) is emitted as the RELATION
 * property name (`user`), never the twin (`user_id`) — looked up from
 * `meta.relations` (already renamed by RULE5 by the time this rule runs, so
 * this sees the final, post-rename property name) by matching an owning
 * to-one relation's single `fieldNames[0]` against the column. Every other
 * column doubles as its own property name with no naming-strategy lookup
 * (`SnakeProps.columnNameToProperty` is the identity, D1).
 *
 * This is a deliberate DIVERGENCE from the pre-existing hand-written/
 * generated composite `uniques:` blocks elsewhere in the schema
 * (`Reservations`/`DocumentSyncItems`/`TrekPhotos`/`FileLinks` all reference
 * the twin — `['file_id', 'budget_item_id']`, never `['file', 'budgetItem']`
 * — because those are NAMED `CREATE UNIQUE INDEX`es MikroORM's own
 * introspection already renders, untouched by this rule, and it always uses
 * column names there). The reason for the divergence: unlike the twin
 * spelling, the relation-property spelling is actually consumable by
 * `em.upsert`'s own conflict-target inference — `getWhereCondition` in
 * `@mikro-orm/core/utils/upsert-utils.js` matches a `uniques` entry's
 * `properties` against the upsert payload's own keys, which are PROPERTY
 * names (`data.user`, never `data.user_id`, since nobody passes a
 * `persist(false)` twin into `em.upsert`'s data). Proven directly:
 * `Settings.repository.test.ts`'s SETTINGSREPO-014 calls `em.upsert` on
 * `Settings` with no `onConflictFields` at all and still gets
 * `on conflict (\`user_id\`, \`key\`)`.
 *
 * That said, this rule's job is METADATA FIDELITY — the generated entity
 * matching what the migrated schema actually constrains — not a functional
 * dependency any caller has on it: `SettingsRepository.upsertForUser` keeps
 * its `onConflictFields: ['user', 'key']` explicit regardless (clearer at
 * the call site than relying on inference from metadata), and every other
 * `uniques:` entry this rule adds has no `em.upsert` caller at all yet. A
 * column an implicit index names that has no matching property AND no
 * matching relation twin (naming-strategy mismatch, or a typo in the
 * migration) throws, naming the table/columns/entity, rather than silently
 * emitting a `uniques:` entry the ORM would reject at discovery time.
 *
 * A column set that is exactly the table's own primary key is skipped: a
 * non-`INTEGER` (or composite) PRIMARY KEY gets the identical kind of
 * unnamed `sqlite_autoindex_` entry a table-level `UNIQUE(...)` does
 * (`AppSettings.key`, `Addons.id` — both `TEXT PRIMARY KEY`, confirmed by
 * running this rule unfiltered against the real schema before adding this
 * check), and it is already unique by construction and already `.primary()`
 * on every one of its columns — a `uniques:` entry for it is pure noise, not
 * a second constraint.
 */
export function RULE9_addImplicitUniqueConstraints(
  metadata: EntityMetadata[],
  implicitUniques: ReadonlyMap<string, string[][]>,
): void {
  for (const meta of metadata) {
    const indexes = implicitUniques.get(meta.tableName);
    if (!indexes) continue;
    const primaryKeys = new Set(meta.primaryKeys);
    // A single-column owning to-one relation's join column, keyed by that
    // column so a FK twin (`user_id`) resolves to the relation's own
    // (post-RULE5-rename) property name (`user`) — see the doc comment above
    // for why this, rather than the twin, is what gets emitted.
    const relationNameByColumn = new Map<string, string>();
    for (const prop of meta.relations) {
      if (!isOwningToOne(prop) || prop.fieldNames.length !== 1) continue;
      relationNameByColumn.set(prop.fieldNames[0], prop.name);
    }
    for (const columns of indexes) {
      if (columns.length === primaryKeys.size && columns.every((column) => primaryKeys.has(column))) continue;
      const properties = columns.map((column) => {
        const relationName = relationNameByColumn.get(column);
        if (relationName) return relationName;
        if (!meta.properties[column]) {
          throw new Error(
            `generate-entities: implicit unique index on ${meta.tableName}(${columns.join(', ')}) references ` +
              `column "${column}", which has no matching property on ${meta.className} (naming-strategy mismatch?).`,
          );
        }
        return column;
      });
      meta.uniques.push({ properties });
    }
  }
}

/** A repository-type marker to inject into one entity class — Rule 10. */
export interface RepositoryTypeMarkerFixup {
  className: string;
  repositoryClassName: string;
}

/**
 * Rule 10 (metadata level: which class needs a marker and what to name it;
 * text level: the actual insertion, see `injectRepositoryTypeMarker` below —
 * this split, and why it cannot be a pure metadata rule, mirrors Rule 5's
 * `.joinColumn()` injection): every entity class gets
 * `[EntityRepositoryType]?: XRepository;` as its FIRST member, so
 * `em.getRepository(X)` — and `t.repo(X)` in `tests/helpers/test-orm.ts`,
 * whose `repo<T>` already returns `GetRepository<T, EntityRepository<T>>` —
 * resolves to the entity's own repository type instead of the generic
 * `SqlEntityRepository<X>` fallback. `GetRepository<Entity, Fallback>`
 * (`@mikro-orm/core`'s `typings.d.ts`, installed version 7.2.1) reads
 * exactly this symbol-keyed member off the entity type
 * (`Entity[typeof EntityRepositoryType]`) — confirmed against the installed
 * typings, not assumed.
 *
 * `@mikro-orm/entity-generator`'s OWN renderer already knows how to emit this
 * marker, but only for the decorator-based `@Entity()` shape
 * (`SourceFile.js#generate()`, guarded by `if (this.meta.repositoryClass)`).
 * Our `defineEntity` output goes through a different method entirely —
 * `EntitySchemaSourceFile.generateClassDefinition()` (shared by
 * `DefineEntitySourceFile`, read directly out of
 * `node_modules/@mikro-orm/entity-generator/EntitySchemaSourceFile.js`) —
 * which only ever consults `PrimaryKeyProp`/`EagerProps`/`Config` for the
 * class head, never `repositoryClass`. No `GenerateOptions` flag changes
 * that, so — exactly like Rule 5's join column — the metadata alone cannot
 * carry this into the rendered class body; only a text pass can.
 *
 * The metadata half below does not mutate anything: `meta.repositoryClass`
 * is already set for every entity by Rule 8 (which always runs first, see
 * `applyRules`) — this is purely a collector, so the text pass has
 * (className, repositoryClassName) pairs to work from without re-deriving
 * the "<ClassName>Repository" naming convention a second time.
 *
 * The marker is a type-only declaration (`?:`, never assigned a value) — NOT
 * a real entity property. It must never go through `meta.addProperty`:
 * MikroORM would then treat it as a genuine, unmapped column.
 * `tests/unit/db/entity-class-fields.test.ts` (CLASSFIELD-003) pins that this
 * stays true — the marker never shows up in `meta.props` and is never
 * counted by CLASSFIELD-002's class-field census.
 */
export function RULE10_repositoryTypeMarker(metadata: EntityMetadata[]): RepositoryTypeMarkerFixup[] {
  const fixups: RepositoryTypeMarkerFixup[] = [];
  for (const meta of metadata) {
    if (!meta.repositoryClass) continue; // Rule 8 always sets this — defensive only, never observed empty
    fixups.push({ className: meta.className, repositoryClassName: meta.repositoryClass });
  }
  return fixups;
}

/** An owning relation whose FK targets a non-PK column on its target entity — Rule 11. */
export interface ReferencedColumnsFixup {
  className: string;
  propName: string;
  referencedColumnNames: readonly string[];
}

/**
 * Rule 11 (metadata level: detection only, no mutation; text level: the
 * actual insertion — see `injectReferencedColumns` below. This split, and why
 * it cannot be a pure metadata rule, mirrors Rule 5's `.joinColumn()`
 * injection and Rule 10's repository marker.
 *
 * `@mikro-orm/sql`'s SQLite introspection (`SqliteSchemaHelper.js`, straight
 * from `PRAGMA foreign_key_list`'s `to` column) already sets
 * `prop.referencedColumnNames` correctly for every owning to-one relation —
 * confirmed empirically with a throwaway `onProcessedMetadata` probe against
 * the real migrated schema, BEFORE any rule in this file runs:
 * `OauthTokens.client`/`OauthConsents.client` already carry
 * `referencedColumnNames: ['client_id']` (the schema's real FK target,
 * `Migration20200101012500_oauth_2.ts`'s `REFERENCES oauth_clients(client_id)`
 * — a UNIQUE natural key, not `OauthClients`'s PK, `id`), while every other
 * owning relation in the whole schema (`OauthTokens.user`, `.parentToken`,
 * `SchoolHolidayRegions.countryRef` -> `school_holiday_countries(code)`,
 * which IS that table's PK, …) already carries `referencedColumnNames` equal
 * to its target's own PK.
 *
 * The generator's own RENDERER never emits this correct, already-introspected
 * fact into the generated text, though — it is not something an earlier rule
 * in this file drops. Read directly out of
 * `node_modules/@mikro-orm/entity-generator/{EntityGenerator,SourceFile}.js`,
 * not assumed: `SourceFile.js#getForeignKeyDecoratorOptions` (shared by every
 * output mode, including `defineEntity`, through
 * `EntitySchemaSourceFile.getPropertyOptions` -> `DefineEntitySourceFile`)
 * only ever emits `.referencedColumnNames([...])` when
 * `prop.ownColumns && prop.ownColumns.length !== prop.fieldNames.length` — a
 * COMPOSITE-FK partial-ownership column-COUNT mismatch, never a check of
 * whether the referenced column differs from the target's PK. `prop.ownColumns`
 * itself is only ever set by `EntityGenerator.js#generate()` when
 * `targetPrimaryColumns.length !== prop.referencedColumnNames.length` — again
 * a length comparison, not a content comparison. For a single-column FK
 * against a single-column PK (exactly the `client_id` case here), both
 * lengths are 1 either way, so `ownColumns` is never set and the renderer's
 * emission check never fires, no matter which column is actually referenced.
 * This is a real gap in `@mikro-orm/entity-generator` 7.2.1's own renderer,
 * not a defect our earlier text passes introduce or could avoid at the
 * metadata level.
 *
 * Detection compares `prop.referencedColumnNames` (already correct) against
 * the target entity's OWN primary-key field names
 * (`targetMeta.getPrimaryProps().flatMap(pk => pk.fieldNames)`) — never a
 * hard-coded table list, so a future migration adding another FK against a
 * non-PK column is caught automatically the next time this generator runs,
 * not silently missed.
 */
export function RULE11_referencedColumns(metadata: EntityMetadata[]): ReferencedColumnsFixup[] {
  const fixups: ReferencedColumnsFixup[] = [];
  for (const meta of metadata) {
    for (const prop of meta.relations) {
      if (!isOwningToOne(prop)) continue;
      const targetMeta = metadata.find((m) => m.className === prop.type);
      if (!targetMeta) continue; // unresolved relation target — nothing this rule can compare against
      const targetPk = targetMeta.getPrimaryProps().flatMap((pk) => pk.fieldNames);
      const referenced = prop.referencedColumnNames ?? [];
      const matchesTargetPk = referenced.length === targetPk.length && referenced.every((column, i) => column === targetPk[i]);
      if (matchesTargetPk) continue;
      fixups.push({ className: meta.className, propName: prop.name, referencedColumnNames: [...referenced] });
    }
  }
  return fixups;
}

/** A CHECK constraint this run repaired — its introspected expression had swallowed trailing DDL text. */
export interface CheckExpressionFixup {
  className: string;
  checkName: string | undefined;
}

/**
 * RULE12 (metadata level): repair a CHECK expression that MikroORM's own
 * SQLite introspection over-captured from a trailing table-level constraint
 * (Plan 3d Task 0, R10 — `roadtrip_day_boundaries.fraction`).
 *
 * `SqliteSchemaHelper#getChecks` (verified directly against
 * `node_modules/@mikro-orm/sql/dialects/sqlite/SqliteSchemaHelper.js`, not
 * assumed) extracts a column's inline CHECK with `/ (check \((.*)\))/i`
 * against that column's own slice of `PRAGMA table_xinfo`'s definition text.
 * The regex's greedy `.*` runs to the LAST `)` in that slice — correct when
 * the checked column is followed only by other columns, wrong when it is the
 * last column before a table-level constraint with its own parens. The
 * migration (`Migration20200101040100_the_road_trip_day_boundaries_carried_the.ts`)
 * declares exactly that shape:
 *
 *   fraction REAL NOT NULL CHECK (fraction BETWEEN 0 AND 1),
 *   PRIMARY KEY (trip_id, day_number)
 *
 * — so the introspected expression comes back as
 * `"fraction BETWEEN 0 AND 1),        PRIMARY KEY (trip_id, day_number"`,
 * not the DDL's `"fraction BETWEEN 0 AND 1"`. This is a third-party
 * introspection defect (the migration's own DDL is correct, and
 * `day_number`'s sibling CHECK on the same table — not the last column
 * before the table constraint — introspects cleanly), so it is repaired
 * here rather than by touching the migration or hand-editing the entity.
 *
 * The fix walks the captured expression tracking parenthesis depth,
 * starting at 1 (the string has already had its own OUTER, matching
 * `CHECK (...)` parens stripped by the upstream regex): `(` increments,
 * `)` decrements. The first time depth returns to 0 is where the check's
 * OWN expression actually closes — the DDL's CHECK is, by definition,
 * itself a balanced parenthesised expression, so that is exactly its end;
 * everything captured after it is the swallowed trailing constraint text,
 * discarded. An expression whose parens never rebalance to 0 before the
 * string ends (no parens at all — `day_number >= 1`,
 * `end_date >= start_date` — or balanced-but-never-closing nested ones) is
 * left byte-identical: this only fires on the specific over-capture shape,
 * never on a clean expression.
 *
 * The walk skips a `(`/`)` that falls inside a single-quoted SQL string
 * literal (a doubled `''` is SQLite's escape for a literal quote *inside*
 * the literal, so it does not end the string) — an expression like
 * `status IN ('confirmed)', 'tentative')` has a literal `)` inside its first
 * string value that is not a real closing paren; without this tracking the
 * scanner would hit depth 0 at that spurious character and truncate a
 * perfectly clean expression (losing its own genuine trailing `)` in the
 * process, corrupting otherwise-valid SQL), not just leave RULE12-003's kind
 * of case ambiguous the way a false paren-count fires here (Task 8a's own
 * carry — "nothing affected today" per 3d's ledger, a latent-bug fix, not an
 * active one — no shipped entity's CHECK expression has hit this shape yet).
 */
export function RULE12_fixGarbledCheckExpressions(metadata: EntityMetadata[]): CheckExpressionFixup[] {
  const fixups: CheckExpressionFixup[] = [];
  for (const meta of metadata) {
    for (const check of meta.checks) {
      if (typeof check.expression !== 'string') continue;
      const expr = check.expression;
      let depth = 1;
      let cut = -1;
      let inString = false;
      for (let i = 0; i < expr.length; i++) {
        const ch = expr[i];
        if (inString) {
          if (ch === "'") {
            if (expr[i + 1] === "'") {
              i++; // a doubled '' is an escaped quote inside the literal, not its end
              continue;
            }
            inString = false;
          }
          continue;
        }
        if (ch === "'") {
          inString = true;
          continue;
        }
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) {
            cut = i;
            break;
          }
        }
      }
      if (cut === -1) continue; // parens never rebalance to 0 — a clean expression, nothing swallowed
      const fixed = expr.slice(0, cut).trimEnd();
      if (fixed === expr) continue;
      check.expression = fixed;
      fixups.push({ className: meta.className, checkName: check.name });
    }
  }
  return fixups;
}

/** A relation whose `deleteRule` RULE13 had to pin explicitly because MikroORM's own runtime default would otherwise disagree with `PRAGMA foreign_key_list`. */
export interface DeleteRuleFixup {
  className: string;
  propName: string;
  from: string | undefined;
  to: string;
}

/**
 * RULE13 (metadata level; DB-dependent — see `collectForeignKeyDeleteRules`
 * below for the half that queries the schema): every owning to-one
 * relation's EFFECTIVE `deleteRule` — explicit if the entity sets one,
 * otherwise whatever `@mikro-orm/core`'s `MetadataDiscovery` infers by
 * default at runtime — must equal `PRAGMA foreign_key_list`'s `on_delete`
 * for its column. Plan 4 Task 7's own measurement
 * (`tests/unit/db/entity-schema-parity.test.ts`, PARITY-009b) found exactly
 * 10 owning relations across 120 entities where it does not.
 *
 * The root cause, read directly out of
 * `node_modules/@mikro-orm/core/metadata/MetadataDiscovery.js` (not
 * assumed): a nullable owning relation defaults to `deleteRule ??= 'set
 * null'` (`initManyToOneFields`/`initOneToOneFields`); separately, when
 * EVERY one of an entity's primary keys is itself a relation (composite or
 * single FK-as-PK), each of those relations defaults to `deleteRule ??=
 * 'cascade'` (`processEntity`'s `fkPks` block) — and the nullable check runs
 * FIRST, so a relation that is both nullable and part of an all-FK PK still
 * gets `'set null'`, never `'cascade'`. Neither default is announced by the
 * generated source when the introspected value happens to equal it — Rule 7
 * above strips the redundant `deleteRule('no action')` noise, and
 * `@mikro-orm/entity-generator`'s OWN `cleanUpReferentialIntegrityRules`
 * (`EntityGenerator.js`) strips a redundant `'cascade'`/`'set null'` the
 * same way for the FK-as-PK, fixed-order-pivot and nullable-relation shapes
 * — but neither cleanup step re-derives the SAME default this rule computes
 * here, so when the physical schema's real `on_delete` differs from what
 * MikroORM would infer left implicit, the generated entity silently carries
 * the wrong effective rule. Concretely, of the 10: 5 are a nullable relation
 * whose column has no `ON DELETE` clause at all in its migration (SQLite ⇒
 * `NO ACTION`) — `trip_members.invited_by`, `oauth_tokens.parent_token_id`,
 * `budget_settlements.created_by_user_id`, `budget_items.paid_by_user_id`,
 * and `roadtrip_day_tracks.day_id` (nullable AND the table's sole PK — its
 * migration DOES say `ON DELETE CASCADE`, so this one goes the other way:
 * physical is `cascade`, the nullable default silently gives `set null`);
 * `journey_contributors.user_id` is a composite-PK member whose migration
 * has no `ON DELETE` (physical `no action`) while its FK-as-PK sibling
 * relation, `journey_id`, DOES say `ON DELETE CASCADE` (so its own implicit
 * `cascade` default is correct — only `user_id` disagrees); the remaining 4
 * (`reservation_travelers.reservation_id`/`.user_id`,
 * `assignment_participants.assignment_id`/`.user_id`) are plain non-nullable
 * relations on a table with its own `id INTEGER PRIMARY KEY AUTOINCREMENT`
 * — no implicit default applies to them at all (MikroORM has none for that
 * shape) — but `@mikro-orm/entity-generator`'s pivot-shaped-table cleanup
 * (Case 2: a single autoincrement PK + exactly 2 many-to-one relations and
 * no other columns) strips their introspected `'cascade'` on the mistaken
 * assumption that MikroORM would restore it as a default, which it does not
 * for a non-composite-PK entity; their migrations DO say `ON DELETE CASCADE`.
 *
 * Every one of the 10 is, per the task's own ruling, an entity that never
 * matched its migration's physical FK to begin with — not a migration
 * defect — so this rule always fixes the ENTITY side: it pins an explicit
 * `deleteRule` equal to the physical value whenever leaving the property
 * alone (explicit-if-set, else the same implicit default computed above)
 * would produce the wrong effective rule, and otherwise leaves the property
 * untouched — matching Rule 7's own "no noise where the implicit default is
 * already correct" intent instead of stamping every relation explicitly.
 *
 * One more wrinkle, found empirically (probed `t.orm.getMetadata()` against
 * the real `ALL_ENTITIES`, not assumed): a relation that is BOTH nullable
 * AND its entity's sole/composite FK-as-PK member — `RoadtripDayTracks.day`,
 * `DawarichConnections.user`, `PlaceRegions.place`, `VacayUserSettings.user`,
 * every one of them shaped exactly like `.primary().ref().nullable()` with
 * no explicit `deleteRule` — is where BOTH candidate defaults above apply at
 * once, and the doc comment's "nullable runs first" precedence is only true
 * WITHIN a single `processEntity(meta)` call. Across entities, `Days`'/
 * `Users`'/`Places`' own inverse `.mappedBy(...)` side of the same relation
 * also runs `initManyToOneFields`, and depending on `ALL_ENTITIES`
 * discovery order that can re-touch the owning prop before ITS OWN
 * `processEntity` runs — measured outcome: `RoadtripDayTracks.day` really
 * does resolve to `'set null'` at runtime (matching this task's 10), while
 * the other three resolve to `'cascade'` (NOT in the 10) despite identical
 * source. That order dependency is exactly the kind of fact a future entity
 * addition could silently flip, so this rule does not trust "already
 * correct" for this one shape — `isAmbiguousNullablePrimaryFk` below always
 * pins an explicit `deleteRule` on it, matching physical, even on the three
 * that happen to already be correct today.
 */
export function RULE13_pinDeleteRuleDrift(
  metadata: EntityMetadata[],
  fkDeleteRules: ReadonlyMap<string, ReadonlyMap<string, string>>,
): DeleteRuleFixup[] {
  const fixups: DeleteRuleFixup[] = [];
  for (const meta of metadata) {
    const byColumn = fkDeleteRules.get(meta.tableName);
    if (!byColumn) continue;
    const pks = meta.getPrimaryProps().filter((pk): pk is EntityProperty => pk !== undefined);
    const allPksAreFk = pks.length > 0 && pks.every((pk) => pk.kind !== undefined && pk.kind !== ReferenceKind.SCALAR);
    for (const prop of meta.relations) {
      if (!isOwningToOne(prop) || prop.fieldNames.length !== 1) continue;
      const physical = byColumn.get(prop.fieldNames[0]);
      if (physical === undefined) continue; // no db FK on this column at all — PARITY-009 proper's job, not this rule's
      // The two candidate implicit defaults collide on this one shape — see
      // the doc comment's "one more wrinkle" — so never trust "already
      // correct" here; always pin it explicitly.
      const isAmbiguousNullablePrimaryFk = !!prop.nullable && !!prop.primary && allPksAreFk;
      if (!isAmbiguousNullablePrimaryFk) {
        // The same precedence MetadataDiscovery applies at runtime within a single
        // entity's own processEntity() call: nullable wins over FK-as-PK.
        const implicitDefault = prop.nullable ? 'set null' : prop.primary && allPksAreFk ? 'cascade' : 'no action';
        const effectiveIfLeftAsIs = (prop.deleteRule ?? implicitDefault).toLowerCase();
        if (effectiveIfLeftAsIs === physical) continue; // already correct, explicit or by the implicit default alike
      } else if ((prop.deleteRule ?? '').toLowerCase() === physical) {
        continue; // already pinned explicitly to the right value — nothing to change
      }
      fixups.push({ className: meta.className, propName: prop.name, from: prop.deleteRule, to: physical });
      prop.deleteRule = physical;
    }
  }
  return fixups;
}

/** A scalar property whose literal default the renderer's own heuristic drops or mis-renders — see below. */
export interface DefaultFixup {
  className: string;
  propName: string;
  /** Valid TS source for the literal, e.g. `0`, `'calendar'`. */
  literal: string;
}

/** A raw SQL default that is a plain literal (number or single-quoted string) rather than an expression like `CURRENT_TIMESTAMP`. */
// Numbers, quoted strings and the booleans RULE1c coerces a NOT NULL boolean default into.
const PLAIN_LITERAL_DEFAULT_RE = /^-?\d+(\.\d+)?$|^'.*'$|^(?:true|false)$/;

/**
 * Rule (metadata level for detection + clearing `defaultRaw`; text level for
 * the render itself — see task-2-report.md "the defaults rule"): a scalar
 * column with a literal `DEFAULT` (`sort_order INTEGER NOT NULL DEFAULT 0`,
 * `year_type TEXT NOT NULL DEFAULT 'calendar'`) is exactly what
 * `DayNotes`/`BudgetCategoryOrder`/`VacayUserSettings` render as
 * `.default(0)`/`.default('calendar')` — plain JS defaults, never
 * `.defaultRaw()`. The stock renderer instead either (a) renders
 * `.defaultRaw('0')` whenever introspection only populated `defaultRaw` and
 * left `prop.default` unset (observed for columns whose declared type the
 * generator leaves `unknown`, e.g. REAL, before Rule 1 retypes them), or (b)
 * for a column where BOTH are populated and consistent, renders *neither*:
 * traced to `SourceFile.js#getCommonDecoratorOptions`'s `.default()` branch,
 * which additionally requires `breakdownOfIType(prop) !== undefined` — true
 * only when the property's type is "ambiguous" in some way, which a boring,
 * unambiguous `INTEGER NOT NULL DEFAULT 0` column never is. Confirmed by
 * generating the real schema and inspecting the metadata mid-hook, not
 * assumed. Since nothing in `GenerateOptions` can force that branch to fire,
 * this is unavoidably a two-part rule: clear the raw default here (so the
 * renderer's OTHER branch, `.defaultRaw()`, never fires either) and record
 * a (className, propName, literal) triple for `injectMissingDefaults` to
 * append `.default(<literal>)` in the rendered text whenever the property's
 * line ends up with neither call. A genuine SQL expression default
 * (`CURRENT_TIMESTAMP`, `datetime('now')`) never matches
 * `PLAIN_LITERAL_DEFAULT_RE` and is left completely alone — that path
 * already renders correctly today (Rule 2's `DbTimestampType` columns).
 */
export function RULE_normalizeLiteralDefaults(metadata: EntityMetadata[]): DefaultFixup[] {
  const fixups: DefaultFixup[] = [];
  for (const meta of metadata) {
    for (const prop of Object.values(meta.properties)) {
      if (prop.kind !== undefined && prop.kind !== ReferenceKind.SCALAR) continue;
      // Nullable columns are Task 3's PARITY-005 territory (still `it.skip`d,
      // see task-0-report.md): Phase 0's own hand-written files are not
      // internally consistent about restating a nullable column's DB default
      // in metadata at all (`DayNotes.icon` — nullable, `TEXT DEFAULT '📝'` —
      // has none; `DayNotes.sort_order` — nullable, `REAL DEFAULT 0` — has
      // `.default(0)`). Guessing a rule to match that inconsistency would be
      // exactly the kind of drift Task 0 deferred; only a NOT NULL column
      // is unambiguous — there, the default is not cosmetic, it is the only
      // thing that makes the property optional at all (see this rule's doc
      // comment above).
      if (prop.nullable) continue;
      if (typeof prop.defaultRaw !== 'string') continue;
      if (!PLAIN_LITERAL_DEFAULT_RE.test(prop.defaultRaw)) continue; // an expression — leave to Rule 2's defaultRaw path
      if (prop.default === undefined || prop.default === null) continue; // introspection gave us no typed value — nothing safe to render
      const literal =
        typeof prop.default === 'string' ? `'${prop.default.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : String(prop.default);
      delete prop.defaultRaw;
      fixups.push({ className: meta.className, propName: prop.name, literal });
    }
  }
  return fixups;
}

export interface RuleFixups {
  joinColumns: JoinColumnFixup[];
  defaults: DefaultFixup[];
  timestamps: TimestampFixup[];
  jsonColumns: JsonColumnFixup[];
  /** Rule 1's + Rule 1b's + Rule 2's retyped scalars together — all three need the same `.columnType()` strip (see `stripRedundantColumnType`). */
  retypedScalars: RetypedScalarFixup[];
  /** Rule 10's repository-type markers — one per entity class. */
  repositoryMarkers: RepositoryTypeMarkerFixup[];
  /** Rule 11's non-PK FK referenced-column fixups. */
  referencedColumns: ReferencedColumnsFixup[];
  /** Rule 12's garbled-CHECK-expression repairs. */
  checkExpressions: CheckExpressionFixup[];
  /** Rule 13's deleteRule-drift pins — reporting only, no text pass depends on it (the renderer already emits an explicit `.deleteRule(...)` from `prop.deleteRule` alone). */
  deleteRules: DeleteRuleFixup[];
}

/**
 * Every rule above, composed into the single hook MikroORM calls. Order
 * matters (see comments). `implicitUniques`/`fkDeleteRules` default to empty
 * so a caller (the fixture tests) that doesn't care about Rule 9/Rule 13
 * need not pass them.
 */
export function applyRules(
  metadata: EntityMetadata[],
  _platform: Platform,
  implicitUniques: ReadonlyMap<string, string[][]> = new Map(),
  fkDeleteRules: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map(),
): RuleFixups {
  const retypedByRule1 = RULE1_fixUnknownScalarTypes(metadata);
  const jsonColumns = RULE1b_markJsonColumns(metadata);
  // Unlike Rule 1's/Rule 1b's retypes, a boolean column's own declaration
  // matches its raw INTEGER column type cleanly on SQLite (BooleanType's
  // getColumnType() returns the same spelling needsExplicitColumnType()
  // compares against) — confirmed by generating the real schema: no stray
  // `.columnType()` appears, so RULE1c's fixups do NOT belong in
  // `retypedScalars` (stripRedundantColumnType's "found no .columnType() to
  // strip" throw catches this immediately if that ever stops being true).
  RULE1c_markBooleanColumns(metadata);
  RULE1d_fixNaNNumericDefaults(metadata);
  const timestamps = RULE2_datetimeToDbTimestampType(metadata);
  RULE3_integerPkAutoincrement(metadata);
  RULE4_hideAllRelations(metadata);
  const joinColumns = RULE5_renameOwningRelations(metadata);
  RULE6_renameInverseCollections(metadata);
  RULE7_dropNoActionRules(metadata);
  RULE8_bindRepositories(metadata);
  RULE9_addImplicitUniqueConstraints(metadata, implicitUniques);
  const defaults = RULE_normalizeLiteralDefaults(metadata);
  const repositoryMarkers = RULE10_repositoryTypeMarker(metadata);
  // Runs after RULE5 so it reads the FINAL (post-rename) owning-relation
  // property names — the same names the text pass below must find in the
  // rendered `properties: {...}` block.
  const referencedColumns = RULE11_referencedColumns(metadata);
  // Independent of every rule above (it only touches `meta.checks`, which
  // the renderer dumps verbatim — no text pass depends on it, same as
  // RULE7/RULE9); placed last only by convention (highest rule number).
  const checkExpressions = RULE12_fixGarbledCheckExpressions(metadata);
  // Must run after RULE7 (which already dropped the genuinely redundant
  // `deleteRule('no action')` noise) so `prop.deleteRule` reflects what the
  // generated source would actually carry before this rule decides whether
  // that's still wrong against the live schema.
  const deleteRules = RULE13_pinDeleteRuleDrift(metadata, fkDeleteRules);
  return {
    joinColumns,
    defaults,
    timestamps,
    jsonColumns,
    retypedScalars: [...retypedByRule1, ...timestamps, ...jsonColumns],
    repositoryMarkers,
    referencedColumns,
    checkExpressions,
    deleteRules,
  };
}

/**
 * DB-dependent half of Rule 9: for every table name given, finds its implicit
 * (`sqlite_autoindex_...`) UNIQUE indexes via the same two PRAGMAs
 * `SqliteSchemaHelper.getIndexes()` itself uses (`index_list`, `index_info`),
 * and returns their column sets in declared order (`index_info.seqno`).
 *
 * Kept separate from `RULE9_addImplicitUniqueConstraints` so that rule stays
 * a pure function over plain data — this is the only piece of Rule 9 that
 * touches a `Connection`, and it is exercised end-to-end (not unit-tested in
 * isolation) by `generateEntities()`'s own tests against the real migrated
 * schema.
 */
export async function collectImplicitUniqueIndexes(
  connection: Connection,
  tableNames: readonly string[],
): Promise<Map<string, string[][]>> {
  const result = new Map<string, string[][]>();
  for (const tableName of tableNames) {
    const indexList = (await connection.execute(`pragma index_list(\`${tableName}\`)`, [], 'all')) as {
      name: string;
      unique: number;
    }[];
    const autoUniques = indexList.filter((idx) => idx.unique && idx.name.startsWith('sqlite_autoindex_'));
    if (autoUniques.length === 0) continue;
    const perTable: string[][] = [];
    for (const idx of autoUniques) {
      const info = (await connection.execute(`pragma index_info(\`${idx.name}\`)`, [], 'all')) as {
        seqno: number;
        cid: number;
        name: string;
      }[];
      perTable.push([...info].sort((a, b) => a.seqno - b.seqno).map((c) => c.name));
    }
    result.set(tableName, perTable);
  }
  return result;
}

/**
 * DB-dependent half of Rule 13: for every table name given, `PRAGMA
 * foreign_key_list`'s `on_delete` per `from` (owning) column, lowercased —
 * the same physical fact `tests/unit/db/entity-schema-parity.test.ts`'s
 * PARITY-009b reads at test time, queried once here so `RULE13_pinDeleteRuleDrift`
 * stays a pure function over plain data, same shape as Rule 9's split.
 */
export async function collectForeignKeyDeleteRules(
  connection: Connection,
  tableNames: readonly string[],
): Promise<Map<string, Map<string, string>>> {
  const result = new Map<string, Map<string, string>>();
  for (const tableName of tableNames) {
    const fkRows = (await connection.execute(`pragma foreign_key_list(\`${tableName}\`)`, [], 'all')) as {
      from: string;
      on_delete: string;
    }[];
    if (fkRows.length === 0) continue;
    const byColumn = new Map<string, string>();
    for (const row of fkRows) byColumn.set(row.from, row.on_delete.toLowerCase());
    result.set(tableName, byColumn);
  }
  return result;
}

// ---------------------------------------------------------------------------
// onImport — resolves the two identifiers the rules above add to a file's
// entityImports that are NOT sibling `*.entity.ts` classes: `DbTimestampType`
// (rule 2) and any `<X>Repository` (rule 8). Everything else (another entity
// class) falls through to the generator's own default resolution.
// ---------------------------------------------------------------------------
export const onImport: ImportsResolver = (alias) => {
  if (alias === 'DbTimestampType') return { path: '../types', name: 'DbTimestampType' };
  if (alias.endsWith('Repository')) {
    const entityName = alias.slice(0, -'Repository'.length);
    return { path: `../repositories/${entityName}.repository`, name: alias };
  }
  return undefined;
};

// ---------------------------------------------------------------------------
// Text-level passes — only for what the metadata cannot carry into the
// rendered `defineEntity` call (see the doc comment at the top of this file
// and task-2-report.md for why each of these specifically cannot be a rule
// on the metadata).
// ---------------------------------------------------------------------------

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The property's line inside `properties: {...}` — i.e. the metadata builder
 * call (`propName: p.integer()...` or `propName: () => p.manyToOne(...)...`),
 * never the class-field declaration above it. The two can share an identical
 * `propName:` prefix (an `& Opt`-style field like `sort_order: number & Opt = 0;`
 * has no `!`/`?`/parens between the name and the colon, same as the metadata
 * line `sort_order: p.integer(),` — anchoring on `propName:.*` alone matches
 * whichever comes first in the file, which is always the class field).
 *
 * The leading padding is `[ \t]*`, not `\s*` — `\s` matches a newline too, so
 * on a property preceded by a blank line (common: one blank line separates
 * the class body from the `properties: {...}` block, or separates unrelated
 * groups within it) `\s*^` could swallow that blank line into the captured
 * "line", handing every caller a string with a leading `\n` embedded in it.
 * `appendCallBeforeTrailingComma`'s own `^…$` anchors (Fix round 1, I3) are
 * not `/m`-flagged and silently fail to match a string shaped like that —
 * caught by `TEXT-DEFAULTS-001`, which has exactly that blank line between
 * the class field and the metadata line.
 */
function findPropertyBuilderLine(source: string, propName: string): RegExpExecArray | null {
  const lineRe = new RegExp(`^([ \\t]*${escapeRegExp(propName)}: (?:\\(\\) => )?p\\..*)$`, 'm');
  return lineRe.exec(source);
}

/** The class-field declaration line for a scalar property — the mirror image of `findPropertyBuilderLine` (same `[ \t]*` reasoning). */
function findClassFieldLine(source: string, propName: string): RegExpExecArray | null {
  const lineRe = new RegExp(`^([ \\t]*${escapeRegExp(propName)}[?!]?: (?!\\(\\) => p\\.|p\\.).*)$`, 'm');
  return lineRe.exec(source);
}

/**
 * `DbTimestampType.runtimeType` is `'string'` (it stores the SQLite wire text
 * verbatim, never a JS `Date` — see `src/db/types/db-timestamp.type.ts`), but
 * the generator has no way to know that: `prop.type` is just the plain string
 * `'DbTimestampType'` (Rule 2), unrecognised by `@mikro-orm/core`'s `types`
 * registry, and `SourceFile.js#breakdownOfIType`'s fallback for an
 * unrecognised declared type re-derives the class field's TS type from the
 * COLUMN's own mapped type instead (`DATETIME` -> `DateTimeType` -> `'Date'`)
 * — a fallback that, unlike the metadata builder's `p.type(DbTimestampType)`
 * output, never consults `prop.runtimeType` at all. Confirmed by generating
 * the real schema (`DayNotes.created_at`, `Trips.created_at`/`updated_at`)
 * and inspecting the rendered class field, not assumed; there is no metadata
 * option that changes this fallback's source. Rewriting `Date` to `string` on
 * exactly the class-field line for each Rule-2-retyped property is therefore
 * a text pass, not a rule.
 */
export function fixDbTimestampClassFieldTypes(source: string, fixups: readonly TimestampFixup[]): string {
  let result = source;
  for (const { className, propName } of fixups) {
    const match = findClassFieldLine(result, propName);
    if (!match) {
      throw new Error(`generate-entities: fixDbTimestampClassFieldTypes could not find the class field line for "${className}.${propName}".`);
    }
    const line = match[1];
    const newLine = line.replace(/\bDate\b/g, 'string');
    if (newLine === line) {
      throw new Error(
        `generate-entities: fixDbTimestampClassFieldTypes found the class field for "${className}.${propName}" but it had no "Date" to rewrite — check the renderer shape.`,
      );
    }
    result = result.slice(0, match.index) + newLine + result.slice(match.index + line.length);
  }
  return result;
}

/**
 * Every property Rule 1 or Rule 2 retyped (`p.unknown()` -> `p.double()`,
 * `p.datetime()` -> `p.type(DbTimestampType)`) picks up a spurious explicit
 * `.columnType(<raw SQL type>)` from `SourceFile.js#needsExplicitColumnType()`:
 * that check compares the introspected raw column spelling (`'REAL'`,
 * `'DATETIME'`, verbatim from the migration) against the abstract type's OWN
 * declaration string (`DoubleType`/base `Platform#getDoubleDeclarationSQL()`
 * literally returns `'double'`; `DbTimestampType` has no declaration of its
 * own so the comparison falls back the same way) — they can never textually
 * match, so the "is this ambiguous" check is always true for exactly these
 * two retyped families, even though `double`/`DbTimestampType` already
 * correctly mean `REAL`/`DATETIME` on SQLite. Confirmed by generating the
 * real schema (`DayNotes.sort_order`/`.created_at`) and reading
 * `getColumnType()`, not assumed. No `GenerateOptions` flag skips this check,
 * so the explicit call is stripped here rather than never emitted.
 */
export function stripRedundantColumnType(source: string, fixups: readonly RetypedScalarFixup[]): string {
  let result = source;
  for (const { className, propName } of fixups) {
    const match = findPropertyBuilderLine(result, propName);
    if (!match) {
      throw new Error(`generate-entities: stripRedundantColumnType could not find the property line for "${className}.${propName}".`);
    }
    const line = match[1];
    const newLine = line.replace(/\.columnType\('[^']*'\)/, '');
    if (newLine === line) {
      throw new Error(
        `generate-entities: stripRedundantColumnType found the property line for "${className}.${propName}" but it had no .columnType() to strip — check the renderer shape.`,
      );
    }
    result = result.slice(0, match.index) + newLine + result.slice(match.index + line.length);
  }
  return result;
}

/**
 * Inserts `injected` right before a builder line's trailing comma, tolerating
 * a trailing line comment after it (`.ref(), // pins country`) — the plain
 * `line.replace(/,\s*$/, …)` this replaced only matched a comma at the very
 * end of the line, so a trailing comment made the append silently do nothing
 * (Fix round 1, task-2-review.md I3, adversarial fixture A6). Greedy `.*`
 * anchors on the LAST comma on the line (the statement terminator), not the
 * first one a string-literal default might contain earlier in the chain.
 * Returns `undefined` if the line has no trailing comma to anchor on at all.
 */
function appendCallBeforeTrailingComma(line: string, injected: string): string | undefined {
  const match = /^(.*)(,)(\s*(?:\/\/.*)?)$/.exec(line);
  if (!match) return undefined;
  return `${match[1]}${injected}${match[2]}${match[3]}`;
}

/**
 * For every collision-class relation Rule 5 renamed, turns the renderer's own
 * (inert, for a relation) `.name('<column>')` override into the
 * `.joinColumn('<column>')` that actually pins the FK column — or appends
 * `.joinColumn(...)` if the renderer decided no override was needed at all
 * (belt and braces; not observed in practice, but the rule must not silently
 * do nothing if the renderer's heuristic ever changes). Every branch either
 * makes an edit or throws (Fix round 1, task-2-review.md I3) — a fixup was
 * recorded specifically because this relation's FK column pin is not
 * otherwise correct, so a no-op here would ship a wrong/missing FK silently.
 */
export function injectJoinColumns(source: string, fixups: readonly JoinColumnFixup[]): string {
  let result = source;
  for (const { className, propName, column } of fixups) {
    const quotedColumn = `'${column}'`;
    const match = findPropertyBuilderLine(result, propName);
    if (!match) {
      throw new Error(
        `generate-entities: injectJoinColumns could not find the property line for "${className}.${propName}" — the recorded joinColumn fixup produced no edit.`,
      );
    }
    const line = match[1];
    const nameCallRe = new RegExp(`\\.name\\(${escapeRegExp(quotedColumn)}\\)`);
    let newLine: string;
    if (nameCallRe.test(line)) {
      newLine = line.replace(nameCallRe, `.joinColumn(${quotedColumn})`);
    } else if (line.includes('.joinColumn(')) {
      newLine = line; // already explicit — legitimately nothing to do, not a no-op bug
    } else {
      const appended = appendCallBeforeTrailingComma(line, `.joinColumn(${quotedColumn})`);
      if (appended === undefined) {
        throw new Error(
          `generate-entities: injectJoinColumns found the property line for "${className}.${propName}" but could not append .joinColumn(${quotedColumn}) to it — check the renderer shape.`,
        );
      }
      newLine = appended;
    }
    result = result.slice(0, match.index) + newLine + result.slice(match.index + line.length);
  }
  return result;
}

/**
 * The text half of `RULE_normalizeLiteralDefaults`: appends `.default(<literal>)`
 * to a property's line when it has neither `.default(` nor `.defaultRaw(` —
 * the exact gap that rule's doc comment traces.
 */
export function injectMissingDefaults(source: string, fixups: readonly DefaultFixup[]): string {
  let result = source;
  for (const { className, propName, literal } of fixups) {
    const match = findPropertyBuilderLine(result, propName);
    if (!match) {
      throw new Error(`generate-entities: injectMissingDefaults could not find the property line for "${className}.${propName}".`);
    }
    const line = match[1];
    if (line.includes('.default(') || line.includes('.defaultRaw(')) continue; // already renders one — legitimately nothing to do
    const appended = appendCallBeforeTrailingComma(line, `.default(${literal})`);
    if (appended === undefined) {
      throw new Error(
        `generate-entities: injectMissingDefaults found the property line for "${className}.${propName}" but could not append .default(${literal}) to it — check the renderer shape.`,
      );
    }
    result = result.slice(0, match.index) + appended + result.slice(match.index + line.length);
  }
  return result;
}

/**
 * `p.json()` has no metadata-level channel for a TypeScript generic type
 * parameter (see `JSON_COLUMNS`/`JSON_INTERFACES` above) — this inserts the
 * recorded type name after each known JSON column's bare `p.json(` call, on
 * exactly that property's line (Fix round 1, task-2-review.md M4/I3: the
 * previous blanket `source.replace(/\bp\.json\(\)/g, …)` also rewrote a
 * `p.json()` mentioned inside a comment — adversarial fixture A2). Already
 * being generic (`p.json<Something>()`) is a legitimate no-op, not a bug;
 * anything else finding no bare call throws.
 */
export function injectJsonTypeParams(source: string, fixups: readonly JsonColumnFixup[]): string {
  let result = source;
  for (const { className, propName, typeName } of fixups) {
    const match = findPropertyBuilderLine(result, propName);
    if (!match) {
      throw new Error(`generate-entities: injectJsonTypeParams could not find the property line for "${className}.${propName}".`);
    }
    const line = match[1];
    if (/p\.json<[^>]*>\(/.test(line)) continue; // already explicitly typed
    const newLine = line.replace(/\bp\.json\(\)/, `p.json<${typeName}>()`);
    if (newLine === line) {
      throw new Error(
        `generate-entities: injectJsonTypeParams found the property line for "${className}.${propName}" but it had no bare p.json() call to type — check the renderer shape.`,
      );
    }
    result = result.slice(0, match.index) + newLine + result.slice(match.index + line.length);
  }
  return result;
}

/**
 * `JsonType#runtimeType` (`@mikro-orm/core/types/JsonType.js`) is a hardcoded
 * getter that always returns `'any'`, never consulting the property at all —
 * so even with `prop.runtimeType` correctly set to the interface name (Rule
 * 1b), `SourceFile.js#breakdownOfIType` still sees `prop.runtimeType
 * ('AddonConfig') !== rawType ('any')` and wraps the class field in
 * `IType<AddonConfig, any>` (confirmed by generating the real schema and
 * reading the rendered field, not assumed — there is no metadata option that
 * changes this). `any` in generated output is not acceptable (Fix round 1,
 * task-2-review.md C3), so this text pass simplifies the class field's
 * `IType<TypeName, any>` down to the plain `TypeName`, the same shape a
 * hand-written entity uses. A field already rendering the plain type name is
 * a legitimate no-op; anything else finding neither shape throws.
 */
export function fixJsonClassFieldTypes(source: string, fixups: readonly JsonColumnFixup[]): string {
  let result = source;
  for (const { className, propName, typeName } of fixups) {
    const match = findClassFieldLine(result, propName);
    if (!match) {
      throw new Error(`generate-entities: fixJsonClassFieldTypes could not find the class field line for "${className}.${propName}".`);
    }
    const line = match[1];
    const iTypeRe = new RegExp(`IType<${escapeRegExp(typeName)}(?:\\s*,\\s*any)?>`);
    const newLine = line.replace(iTypeRe, typeName);
    if (newLine === line) {
      if (line.includes(typeName) && !line.includes('any')) continue; // already the plain type — nothing to fix
      throw new Error(
        `generate-entities: fixJsonClassFieldTypes found the class field for "${className}.${propName}" but no IType<${typeName}, any> to simplify — check the renderer shape.`,
      );
    }
    result = result.slice(0, match.index) + newLine + result.slice(match.index + line.length);
  }
  return result;
}

/**
 * Inserts the `JSON_INTERFACES` declaration for every distinct type name this
 * file's JSON columns reference, right before `export class <Name>` — the
 * same position a hand-written file like the current `Addons.entity.ts` uses.
 * Throws if `JSON_COLUMNS` ever references a type name with no matching
 * `JSON_INTERFACES` entry (a maintenance gap, never a schema fact to guess
 * at) or if the file has no `export class` line to anchor on.
 *
 * Also strips the bogus self-import the renderer adds for the type name:
 * `breakdownOfIType`'s import-collection step (`SourceFile.js`) treats any
 * non-primitive `prop.runtimeType` as if it names a sibling entity class and
 * adds it to `entityImports` — `onImport` has no "this identifier needs no
 * import, it is declared right here" signal, so the generator's default
 * resolution guesses `import { AddonConfig } from './AddonConfig.entity';`,
 * a file that does not exist. Confirmed by generating the real schema, not
 * assumed.
 */
export function injectJsonInterfaces(source: string, fixups: readonly JsonColumnFixup[]): string {
  if (fixups.length === 0) return source;
  const typeNames = [...new Set(fixups.map((f) => f.typeName))];
  const blocks: string[] = [];
  let result = source;
  for (const typeName of typeNames) {
    const decl = JSON_INTERFACES[typeName];
    if (!decl) {
      throw new Error(`generate-entities: JSON_COLUMNS references type "${typeName}" but JSON_INTERFACES has no declaration for it.`);
    }
    blocks.push(decl);
    const escaped = escapeRegExp(typeName);
    const bogusImportRe = new RegExp(`^import \\{ ${escaped} \\} from '\\./${escaped}\\.entity';\\n`, 'm');
    result = result.replace(bogusImportRe, '');
    // The generator resolves an unknown type name to a sibling entity import;
    // nothing else may still import the interface from a file that never exists.
    if (new RegExp(`from '\\./${escaped}\\.entity'`).test(result)) {
      throw new Error(`generate-entities: injectJsonInterfaces left an import of "${typeName}" from a nonexistent ./${typeName}.entity file.`);
    }
  }
  const classRe = /^export class \w+ /m;
  const match = classRe.exec(result);
  if (!match) {
    throw new Error('generate-entities: injectJsonInterfaces could not find "export class" to insert the interface declaration before.');
  }
  return result.slice(0, match.index) + blocks.join('\n') + '\n' + result.slice(match.index);
}

/**
 * Removes `identifier` from the `@mikro-orm/core` named import line if
 * nothing after that line still references it as a bare word — shared by
 * `stripHiddenTypeAnnotation` (`Hidden`) and `fixJsonClassFieldTypes`'s
 * caller (`IType`), both of which can make an import genuinely unused.
 */
function removeUnusedCoreImportIfUnused(source: string, identifier: string): string {
  const importLineRe = /^import \{[^}]*\} from '@mikro-orm\/core';$/m;
  const coreImportLine = importLineRe.exec(source)?.[0];
  if (!coreImportLine) return source;
  const bodyAfterImports = source.slice(source.indexOf(coreImportLine) + coreImportLine.length);
  if (new RegExp(`\\b${escapeRegExp(identifier)}\\b`).test(bodyAfterImports)) return source; // still used elsewhere
  const escaped = escapeRegExp(identifier);
  const cleaned = coreImportLine.replace(new RegExp(`type ${escaped}, `), '').replace(new RegExp(`, type ${escaped}\\b`), '');
  return source.replace(coreImportLine, cleaned);
}

/**
 * Strips the class-field `& Hidden` TypeScript annotation the renderer adds,
 * unconditionally, to every field whose property is `.hidden()`
 * (`SourceFile.js#getPropertyDefinition`: `if (prop.hidden) { hiddenType += ' & Hidden'; }`
 * — there is no metadata option that suppresses it; it does not read a
 * config flag, it reads `prop.hidden` directly). Phase 0's hand-written files
 * never use this marker on any of their many hidden relations/collections —
 * the runtime source of truth is `defineEntity`'s own `.hidden()` call kept
 * on the property builder (rule 4), which this text pass never touches; the
 * class field is compile-time-only TypeScript, so dropping the redundant
 * annotation changes nothing observable.
 *
 * A `Collection<T>` field only gets an explicit `: Collection<T>` type
 * annotation in the first place *because* of `& Hidden` (the same ternary);
 * once the marker is gone the whole annotation is dropped too, reverting to
 * plain `field = new Collection<T>(this);` — Phase 0's actual style.
 *
 * Scoped to the CLASS BODY only — everything from the start of the file up
 * to (not including) `export const <Name>Schema = defineEntity(` — never the
 * `properties: {...}` block that follows it. Fix round 1 (task-2-review.md
 * M3/I3): the previous whole-file `/ & Hidden/g` also matched a string
 * literal default containing that exact text (adversarial fixture A1,
 * `note: p.text().default('a & Hidden b')`), corrupting the default's value;
 * that text only ever appears in the schema block, which this scoping never
 * touches. The `Collection<T>` pattern is also anchored to a single line
 * (`[^=\n]*`, not `[^=]*`) so it cannot span two adjacent field declarations
 * where the first has no initialiser (fixture A3) — unreachable against
 * today's renderer (every hidden `Collection` field DOES get an initialiser,
 * see rule 4's doc comment), but no longer exploitable either way.
 */
export function stripHiddenTypeAnnotation(source: string): string {
  const boundaryRe = /^export const \w+Schema = defineEntity\(/m;
  const boundaryMatch = boundaryRe.exec(source);
  const splitIndex = boundaryMatch ? boundaryMatch.index : source.length;
  const classBody = source.slice(0, splitIndex);
  const rest = source.slice(splitIndex);

  const strippedClassBody = classBody
    // Collection<T> & Hidden = new Collection<T>(this); -> = new Collection<T>(this);
    .replace(/: Collection<[^=\n]*> & Hidden = /g, ' = ')
    // (Ref<X> | null) & Hidden -> Ref<X> | null  (parenthesised nullable ref)
    .replace(/\(([^()\n]*)\) & Hidden/g, '$1')
    // trip!: Ref<Trips> & Hidden; -> trip!: Ref<Trips>;  (everything else, one class-field line at a time)
    .replace(/^(\s*\S[^\n]*?) & Hidden/gm, '$1');

  if (/&\s*Hidden\b/.test(strippedClassBody)) {
    throw new Error('generate-entities: stripHiddenTypeAnnotation left an "& Hidden" marker unstripped in the class body — check the renderer shape.');
  }

  return removeUnusedCoreImportIfUnused(strippedClassBody + rest, 'Hidden');
}

/**
 * Case-sensitive alpha sort key for a `@mikro-orm/core` named-import entry —
 * matches `@mikro-orm/entity-generator`'s own `generateImports()` (sorts the
 * raw identifiers, THEN prepends `type ` to whichever ones need it), read
 * directly out of `SourceFile.js`. Ignoring any existing `type ` prefix for
 * ordering purposes is what keeps this idempotent against the generator's
 * own output — re-running `--write` after this pass must never reorder what
 * the generator already got right.
 */
function coreImportSortKey(entry: string): string {
  return entry.replace(/^type /, '');
}

/**
 * Adds `identifier` (a VALUE import — never `type`-prefixed; see callers) to
 * the file's `@mikro-orm/core` named import line, re-sorting the whole list
 * with `coreImportSortKey` so the result is byte-identical to what
 * `@mikro-orm/entity-generator` would have rendered had it known about this
 * identifier itself. A no-op if the identifier is already present (every
 * generated file has exactly one `@mikro-orm/core` import line — `defineEntity`
 * and `p` are unconditional — so "no import line at all" is a renderer-shape
 * change, not a legitimate input, and throws rather than silently doing
 * nothing.
 */
function addNamedCoreImport(source: string, identifier: string): string {
  const importLineRe = /^import \{ ([^}]*) \} from '@mikro-orm\/core';$/m;
  const match = importLineRe.exec(source);
  if (!match) {
    throw new Error(`generate-entities: addNamedCoreImport could not find the "@mikro-orm/core" import line to add "${identifier}" to.`);
  }
  const entries = match[1].split(',').map((e) => e.trim());
  if (entries.some((e) => coreImportSortKey(e) === identifier)) return source; // already present
  entries.push(identifier);
  entries.sort((a, b) => {
    const ka = coreImportSortKey(a);
    const kb = coreImportSortKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const newLine = `import { ${entries.join(', ')} } from '@mikro-orm/core';`;
  return source.slice(0, match.index) + newLine + source.slice(match.index + match[0].length);
}

/**
 * The text half of Rule 10: inserts `[EntityRepositoryType]?: XRepository;`
 * as the class's FIRST member — before an existing `[PrimaryKeyProp]`/
 * `[EagerProps]` marker, if either is present (`generateClassDefinition()`
 * only ever emits those two, plus `[Config]` for a custom base entity this
 * codebase does not use) — and adds `EntityRepositoryType` to the
 * `@mikro-orm/core` named import line.
 *
 * `EntityRepositoryType` is a real runtime `unique symbol` const, not an
 * erased type (`POSSIBLE_TYPE_IMPORTS` in the installed entity-generator's
 * `CoreImportsHelper.js` does not list it), so this is a VALUE import, never
 * `import type` — the same way the generator's own decorator-mode renderer
 * imports it, and the same way every existing `[PrimaryKeyProp]` marker in
 * this tree already imports `PrimaryKeyProp` as a value (see e.g.
 * `AppSettings.entity.ts`).
 */
export function injectRepositoryTypeMarker(source: string, fixups: readonly RepositoryTypeMarkerFixup[]): string {
  let result = source;
  for (const { className, repositoryClassName } of fixups) {
    const classOpenRe = new RegExp(`^(export class ${escapeRegExp(className)} \\{)$`, 'm');
    const match = classOpenRe.exec(result);
    if (!match) {
      throw new Error(
        `generate-entities: injectRepositoryTypeMarker could not find "export class ${className} {" to insert the marker after.`,
      );
    }
    const insertAt = match.index + match[0].length;
    const marker = `\n  [EntityRepositoryType]?: ${repositoryClassName};`;
    result = result.slice(0, insertAt) + marker + result.slice(insertAt);
    result = addNamedCoreImport(result, 'EntityRepositoryType');
  }
  return result;
}

/**
 * The text half of Rule 11: appends `.referencedColumnNames(<col>, …)` to a
 * FK relation's property line whenever the renderer left it out despite the
 * metadata already carrying the real (non-PK) referenced column — see
 * `RULE11_referencedColumns`'s doc comment for why the renderer never emits
 * this itself for a single-column FK. `p.manyToOne(...)`'s
 * `.referencedColumnNames(...)` is a rest-args method (confirmed against the
 * installed `node_modules/@mikro-orm/core/entity/defineEntity.d.ts`), so this
 * renders bare comma-separated quoted column names, never a `[...]` array
 * literal. A property line that already has an explicit
 * `.referencedColumnNames(` call is a legitimate no-op (never observed today
 * — the renderer's own emission path never fires for this shape, see the
 * rule's doc comment — but a future generator upgrade could change that);
 * anything else finding no trailing comma to anchor on throws.
 */
export function injectReferencedColumns(source: string, fixups: readonly ReferencedColumnsFixup[]): string {
  let result = source;
  for (const { className, propName, referencedColumnNames } of fixups) {
    const match = findPropertyBuilderLine(result, propName);
    if (!match) {
      throw new Error(`generate-entities: injectReferencedColumns could not find the property line for "${className}.${propName}".`);
    }
    const line = match[1];
    if (line.includes('.referencedColumnNames(')) continue; // already explicit — nothing to do
    const quoted = referencedColumnNames.map((column) => `'${column}'`).join(', ');
    const appended = appendCallBeforeTrailingComma(line, `.referencedColumnNames(${quoted})`);
    if (appended === undefined) {
      throw new Error(
        `generate-entities: injectReferencedColumns found the property line for "${className}.${propName}" but could not append ` +
          `.referencedColumnNames(${quoted}) to it — check the renderer shape.`,
      );
    }
    result = result.slice(0, match.index) + appended + result.slice(match.index + line.length);
  }
  return result;
}

/** Every text pass, applied in order. */
export function applyTextPasses(source: string, fixups: RuleFixups): string {
  let result = injectJoinColumns(source, fixups.joinColumns);
  result = injectMissingDefaults(result, fixups.defaults);
  result = fixDbTimestampClassFieldTypes(result, fixups.timestamps);
  result = stripRedundantColumnType(result, fixups.retypedScalars);
  result = injectJsonTypeParams(result, fixups.jsonColumns);
  result = fixJsonClassFieldTypes(result, fixups.jsonColumns);
  result = injectJsonInterfaces(result, fixups.jsonColumns);
  result = removeUnusedCoreImportIfUnused(result, 'IType');
  result = stripHiddenTypeAnnotation(result);
  result = injectRepositoryTypeMarker(result, fixups.repositoryMarkers);
  result = injectReferencedColumns(result, fixups.referencedColumns);
  return result;
}

// ---------------------------------------------------------------------------
// Temp database — a throwaway file, migrated the same way buildApp() does
// (same Migrator extension, same migrations path/pathTs), never data/travel.db.
//
// This deliberately does NOT import src/db/orm.ts / src/db/database.ts /
// src/mikro-orm.config.ts: database.ts opens resolveDbPath() (real
// data/travel.db, absent an env override) as a side effect of being imported
// at all, and orm.ts/mikro-orm.config.ts both pull that in transitively. A
// self-contained MikroORM.init() against our own temp path has no such
// side effect and needs nothing from those modules.
// ---------------------------------------------------------------------------

function tempDbPath(): string {
  return path.join(os.tmpdir(), `trek-gen-entities-${crypto.randomUUID()}.db`);
}

async function migrateTempDb(dbPath: string): Promise<void> {
  const orm = await SqliteMikroORM.init({
    entities: [],
    discovery: { warnWhenNoEntities: false },
    dbName: dbPath,
    extensions: [Migrator],
    // Anchored to SERVER_ROOT (__dirname-based), not process.cwd() — Fix
    // round 1, task-2-review.md I5: run from the repo root instead of
    // server/, the old relative paths silently resolved to nothing and
    // `generator.generate()` produced zero files with exit 0. `assertFilesGenerated`
    // below is the second half of the fix: even if some future refactor
    // reintroduces a cwd-relative path, a zero-file run throws instead of
    // looking like a quiet success.
    // silent: the 260 `[migrator] Processing/Applied` lines are the migrator's own
    // progress log, not this script's output; check:entities and the generator test
    // report in their own words and a failure still throws.
    migrations: { path: path.join(SERVER_ROOT, 'dist/db/migrations'), pathTs: path.join(SERVER_ROOT, 'src/db/migrations'), snapshot: false, silent: true },
  });
  try {
    const migrator = orm.config.getExtension<Migrator>('@mikro-orm/migrator');
    await migrator.up();
  } finally {
    await orm.close(true);
  }
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export interface GenerateResult {
  /** `X.entity.ts` -> final, post-text-pass file content. */
  files: Map<string, string>;
}

/**
 * Throws if `files` is empty — a zero-entity run is never a legitimate
 * result of this wrapper (the migrated schema always has tables), only a
 * silent path-resolution failure (Fix round 1, task-2-review.md I5:
 * `node --import tsx server/scripts/generate-entities.ts --out …` run from
 * the repo root instead of `server/` printed `dumped 0 files`, exit 0,
 * before the migrations path was anchored to `SERVER_ROOT`). Exported so it
 * can be pinned by a fixture test independent of a real schema/cwd.
 */
export function assertFilesGenerated(files: ReadonlyMap<string, string>): void {
  if (files.size === 0) {
    throw new Error(
      'generate-entities: generated zero entity files — check the migrations path/cwd (should be anchored to SERVER_ROOT) and that the schema actually has tables.',
    );
  }
}

/**
 * Generates every entity from the migrated schema into memory (nothing is
 * written to disk by this function alone — see `writeEntities`/`main` below
 * for the on-disk half `--write` uses).
 */
export async function generateEntities(): Promise<GenerateResult> {
  const dbPath = tempDbPath();
  try {
    await migrateTempDb(dbPath);

    const orm = await SqliteMikroORM.init({
      entities: [],
      discovery: { warnWhenNoEntities: false },
      dbName: dbPath,
      namingStrategy: SnakeProps,
      extensions: [EntityGenerator],
    });
    try {
      const generator = orm.config.getExtension<EntityGenerator>('@mikro-orm/entity-generator');
      let fixups: RuleFixups = {
        joinColumns: [],
        defaults: [],
        timestamps: [],
        jsonColumns: [],
        retypedScalars: [],
        repositoryMarkers: [],
        referencedColumns: [],
        checkExpressions: [],
        deleteRules: [],
      };
      const rawFiles = await generator.generate({
        entityDefinition: 'defineEntity',
        scalarPropertiesForRelations: 'always',
        identifiedReferences: true,
        bidirectionalRelations: true,
        forceUndefined: false,
        undefinedDefaults: true,
        skipTables: ['mikro_orm_migrations'],
        fileName: (className: string) => `${className}.entity`,
        onImport,
        onProcessedMetadata: async (metadata, platform) => {
          // Same connection the generator itself just introspected the schema
          // through (`orm`, in scope from just above) — Rule 9/Rule 13 need
          // no second connection or a second migrated temp DB.
          const tableNames = metadata.map((meta) => meta.tableName);
          const implicitUniques = await collectImplicitUniqueIndexes(orm.em.getConnection(), tableNames);
          const fkDeleteRules = await collectForeignKeyDeleteRules(orm.em.getConnection(), tableNames);
          fixups = applyRules(metadata, platform, implicitUniques, fkDeleteRules);
        },
      });

      const files = new Map<string, string>();
      for (const raw of rawFiles) {
        const classMatch = /\nexport class (\w+) /.exec(raw) ?? /^export class (\w+) /.exec(raw);
        if (!classMatch) continue; // a routine/enum file, no class of its own — nothing to text-pass
        const className = classMatch[1];
        const relevantFixups: RuleFixups = {
          joinColumns: fixups.joinColumns.filter((f) => f.className === className),
          defaults: fixups.defaults.filter((f) => f.className === className),
          timestamps: fixups.timestamps.filter((f) => f.className === className),
          jsonColumns: fixups.jsonColumns.filter((f) => f.className === className),
          retypedScalars: fixups.retypedScalars.filter((f) => f.className === className),
          repositoryMarkers: fixups.repositoryMarkers.filter((f) => f.className === className),
          referencedColumns: fixups.referencedColumns.filter((f) => f.className === className),
          checkExpressions: fixups.checkExpressions.filter((f) => f.className === className),
          deleteRules: fixups.deleteRules.filter((f) => f.className === className),
        };
        files.set(`${className}.entity.ts`, applyTextPasses(raw, relevantFixups));
      }
      assertFilesGenerated(files);
      return { files };
    } finally {
      await orm.close(true);
    }
  } finally {
    fs.rmSync(dbPath, { force: true });
  }
}

/** Writes `files` into `dir` (creating it if needed). Used for the scratch dump and by `--write`. */
export function dumpEntities(dir: string, files: ReadonlyMap<string, string>): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const [fileName, content] of files) {
    fs.writeFileSync(path.join(dir, fileName), content);
  }
}

/**
 * For every generated entity, writes `src/db/repositories/<X>.repository.ts`
 * if (and only if) it does not already exist — Rule 8's file-system half.
 * Returns the list of newly-created files.
 */
export function writeRepositoriesIfMissing(repositoriesDir: string, files: ReadonlyMap<string, string>): string[] {
  const created: string[] = [];
  fs.mkdirSync(repositoriesDir, { recursive: true });
  for (const fileName of files.keys()) {
    const className = fileName.replace(/\.entity\.ts$/, '');
    const repoFile = path.join(repositoriesDir, `${className}.repository.ts`);
    if (fs.existsSync(repoFile)) continue;
    // `TrekRepository`, never the raw `EntityRepository` (program RULING,
    // Plan 3b Task 1 — every repository validates the request context and
    // defaults reads to `disableIdentityMap: true`; Task 7 review H2): a
    // scaffold on the bare base class silently opts the next table out of
    // both guarantees, with nothing to catch it. See
    // `_shared/trek-repository.ts` and the `instanceof TrekRepository`
    // ratchet in `tests/unit/db/entities-index.test.ts`.
    const content =
      `import type { ${className} } from '../entities/${className}.entity';\n` +
      `import { TrekRepository } from './_shared/trek-repository';\n\n` +
      `export class ${className}Repository extends TrekRepository<${className}> {}\n`;
    fs.writeFileSync(repoFile, content);
    created.push(repoFile);
  }
  return created;
}

/** Builds `src/db/entities/index.ts`'s source for a given, already-sorted class-name list. */
export function buildEntitiesIndexSource(classNames: readonly string[]): string {
  const imports = classNames.map((name) => `import { ${name}Schema } from './${name}.entity';`).join('\n');
  const exportList = classNames.map((name) => `  ${name}Schema,`).join('\n');
  return (
    `import type { EntitySchema } from '@mikro-orm/core';\n${imports}\n\n` +
    `export const ALL_ENTITIES: readonly EntitySchema[] = [\n${exportList}\n];\n`
  );
}

/** Regenerates `src/db/entities/index.ts` from the directory, sorted, exporting `ALL_ENTITIES`. */
export function regenerateEntitiesIndex(entitiesDir: string): string {
  const classNames = fs
    .readdirSync(entitiesDir)
    .filter((f) => f.endsWith('.entity.ts'))
    .sort()
    .map((f) => f.replace(/\.entity\.ts$/, ''));
  return buildEntitiesIndexSource(classNames);
}

/** What `--check` found: every generated file (entity + `index.ts`) that differs from — or is missing from — disk, and every repository `--write` would create. Read-only; never touches disk. */
export interface CheckReport {
  /** `X.entity.ts` (or `'index.ts'`) for every generated file whose on-disk content differs, byte-for-byte, from what the generator produces now. */
  differingFiles: string[];
  /** `src/db/repositories/<X>.repository.ts` for every entity with no repository file yet — `--write` would create these. */
  missingRepositories: string[];
}

/**
 * The read-only half of `--check` (I1 in `task-4-review-gates.md`): compares
 * `files` (already generated in memory by `generateEntities()`) plus the
 * `index.ts` they imply against `entitiesDir`, and reports which
 * `repositoriesDir/<X>.repository.ts` files `writeRepositoriesIfMissing`
 * would create. Never reads `regenerateEntitiesIndex`'s directory-listing
 * variant — the *expected* index is built straight from `files`' own key
 * set, not from whatever happens to already be on disk, so a stray or
 * missing entity file cannot mask itself out of the index comparison.
 */
export function checkEntities(entitiesDir: string, repositoriesDir: string, files: ReadonlyMap<string, string>): CheckReport {
  const differingFiles: string[] = [];
  for (const [fileName, content] of files) {
    const onDiskPath = path.join(entitiesDir, fileName);
    const onDisk = fs.existsSync(onDiskPath) ? fs.readFileSync(onDiskPath, 'utf8') : undefined;
    if (onDisk !== content) differingFiles.push(fileName);
  }

  const classNames = [...files.keys()].map((f) => f.replace(/\.entity\.ts$/, '')).sort();
  const expectedIndex = buildEntitiesIndexSource(classNames);
  const indexPath = path.join(entitiesDir, 'index.ts');
  const onDiskIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : undefined;
  if (onDiskIndex !== expectedIndex) differingFiles.push('index.ts');

  // The comparison must also run the other way: a hand-added `*.entity.ts`
  // that the generator does not produce would be folded into index.ts by the
  // next --write, so it is drift too.
  const generated = new Set(files.keys());
  const onDiskEntityFiles = fs.existsSync(entitiesDir)
    ? fs.readdirSync(entitiesDir).filter((f) => f.endsWith('.entity.ts')).sort()
    : [];
  for (const fileName of onDiskEntityFiles) {
    if (!generated.has(fileName)) differingFiles.push(`${fileName} (not produced by the generator)`);
  }

  const missingRepositories: string[] = [];
  for (const fileName of files.keys()) {
    const className = fileName.replace(/\.entity\.ts$/, '');
    const repoFile = path.join(repositoriesDir, `${className}.repository.ts`);
    if (!fs.existsSync(repoFile)) missingRepositories.push(repoFile);
  }

  return { differingFiles, missingRepositories };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const check = args.includes('--check');
  const outIndex = args.indexOf('--out');
  const outDir = outIndex >= 0 ? args[outIndex + 1] : undefined;

  const { files } = await generateEntities();

  if (check) {
    const { differingFiles, missingRepositories } = checkEntities(ENTITIES_DIR, REPOSITORIES_DIR, files);
    for (const fileName of differingFiles) {
      console.error(`[generate-entities] DRIFT: src/db/entities/${fileName} does not match the generator.`);
    }
    for (const repoFile of missingRepositories) {
      console.error(`[generate-entities] MISSING: ${path.relative(SERVER_ROOT, repoFile)} would be created by --write.`);
    }
    if (differingFiles.length > 0 || missingRepositories.length > 0) {
      console.error('[generate-entities] --check failed. Run: node --import tsx scripts/generate-entities.ts --write');
      process.exit(1);
    }
    console.log('[generate-entities] --check: entity files match the generator');
    return;
  }

  if (write) {
    dumpEntities(ENTITIES_DIR, files);
    const created = writeRepositoriesIfMissing(REPOSITORIES_DIR, files);
    fs.writeFileSync(path.join(ENTITIES_DIR, 'index.ts'), regenerateEntitiesIndex(ENTITIES_DIR));
    console.log(`[generate-entities] wrote ${files.size} entities, ${created.length} new repositories, index.ts`);
    return;
  }

  const target = outDir ?? path.join(os.tmpdir(), `trek-generated-entities-${crypto.randomUUID()}`);
  dumpEntities(target, files);
  console.log(`[generate-entities] dumped ${files.size} files to ${target}`);
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error('[generate-entities] failed:', err);
    process.exit(1);
  });
}
