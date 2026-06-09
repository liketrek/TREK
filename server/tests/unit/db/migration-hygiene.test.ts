/**
 * Migration hygiene guardrails.
 *
 * These tests scan the migration source statically and fail when a NEW
 * destructive operation (DROP TABLE / DROP COLUMN / TRUNCATE / DELETE FROM /
 * ALTER ... DROP) is introduced, or when an empty/silent `catch` block creeps
 * back into the migration runner.
 *
 * Migrations 1..N are append-only and immutable once shipped (the live schema
 * has already applied them; rewriting an applied migration is a breaking
 * change). The destructive statements that already exist were each reviewed
 * and are legitimate — almost all are the standard SQLite "table rebuild"
 * pattern (create *_new, copy rows, DROP old, RENAME), plus a handful of
 * deliberate, data-preserving cleanups. They are recorded in
 * ALLOWED_DESTRUCTIVE below with the reason. Anything not on that list is
 * treated as a regression.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createTestDb } from '../../helpers/test-db';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_PATH = resolve(here, '../../../src/db/migrations.ts');
const migrationsSource = readFileSync(MIGRATIONS_PATH, 'utf8');

/**
 * Strip line and block comments so commented-out SQL (or prose mentioning
 * "DROP TABLE") is never flagged. String/template contents are preserved —
 * that is exactly where the real SQL lives.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const scannableSource = stripComments(migrationsSource);

interface DestructiveHit {
  /** Normalised signature used as the allowlist key, e.g. "DROP TABLE budget_items". */
  signature: string;
  /** The raw matched fragment, kept for diagnostics. */
  fragment: string;
}

/**
 * Detects destructive DDL/DML. For each match we build a normalised signature
 * of "<OPERATION> <TARGET>" so cosmetic whitespace/quoting changes don't churn
 * the allowlist, while a genuinely new target (or operation) shows up as a new
 * signature.
 */
function findDestructiveStatements(src: string): DestructiveHit[] {
  const hits: DestructiveHit[] = [];
  const norm = (s: string) => s.replace(/[`"'\[\]]/g, '').replace(/\s+/g, ' ').trim();

  // DROP TABLE [IF EXISTS] <name>
  for (const m of src.matchAll(/DROP\s+TABLE\s+(IF\s+EXISTS\s+)?[`"'\[]?([A-Za-z_][\w]*)/gi)) {
    hits.push({ signature: `DROP TABLE ${m[2]}`, fragment: norm(m[0]) });
  }
  // ALTER TABLE <t> DROP COLUMN <c>  (and bare ALTER ... DROP <c>)
  for (const m of src.matchAll(/ALTER\s+TABLE\s+[`"'\[]?([A-Za-z_][\w]*)[`"'\]]?\s+DROP\s+(COLUMN\s+)?[`"'\[]?([A-Za-z_][\w]*)/gi)) {
    hits.push({ signature: `ALTER TABLE ${m[1]} DROP COLUMN ${m[3]}`, fragment: norm(m[0]) });
  }
  // TRUNCATE <t>  (not valid SQLite, but guard anyway)
  for (const m of src.matchAll(/TRUNCATE\s+(TABLE\s+)?[`"'\[]?([A-Za-z_][\w]*)/gi)) {
    hits.push({ signature: `TRUNCATE ${m[2]}`, fragment: norm(m[0]) });
  }
  // DELETE FROM <t>
  for (const m of src.matchAll(/DELETE\s+FROM\s+[`"'\[]?([A-Za-z_][\w]*)/gi)) {
    hits.push({ signature: `DELETE FROM ${m[1]}`, fragment: norm(m[0]) });
  }
  return hits;
}

/**
 * Allowlist of destructive statements already present and reviewed as
 * legitimate. Keyed by normalised signature. NEVER add to this without a
 * code-review-level justification — that is the whole point of the guard.
 *
 * Rebuild = standard SQLite 12-step ALTER emulation: CREATE <t>_new,
 * INSERT ... SELECT to copy rows, DROP old <t>, ALTER ... RENAME <t>_new TO <t>.
 * Rows are preserved across the rebuild.
 */
const ALLOWED_DESTRUCTIVE: Record<string, string> = {
  // ── table rebuilds (data preserved) ──────────────────────────────────────
  'DROP TABLE budget_items':
    'Migration 12: rebuild to drop a stale NOT NULL DEFAULT on persons/days. Rows copied first.',
  'DROP TABLE oauth_clients':
    'Make oauth_clients.user_id nullable for anonymous DCR clients. Rebuild, rows copied.',
  'DROP TABLE idempotency_keys':
    'Widen PK to (key,user_id,method,path). Rebuild, rows copied (old PK is a subset).',
  'DROP TABLE day_accommodations':
    'Make place_id nullable + ON DELETE SET NULL. Rebuild, rows copied.',
  'DROP TABLE schema_version':
    'Add surrogate id PK to schema_version. Rebuild, version row copied.',

  // ── photo/journey table rebuilds (data preserved) ────────────────────────
  'DROP TABLE trip_photos':
    'trip_photos normalisation + later photo_id FK refactor. Rebuilds, rows copied.',
  'DROP TABLE trip_album_links':
    'Normalise trip_album_links to provider+album_id schema. Rebuild, rows copied.',
  'DROP TABLE journey_photos':
    'Journey photo provider support + photo_id FK refactor. Rebuilds, rows copied.',
  'DROP TABLE journey_photos_old':
    'Migration 121 gallery refactor: drops the temporary *_old backup after backfill.',
  'DROP TABLE journey_location_trail':
    'Migration 87 journey rebuild: old data SELECTed into memory and re-inserted into new schema.',
  'DROP TABLE journey_entries':
    'Migration 87 journey rebuild: old data SELECTed into memory and re-inserted into new schema.',
  'DROP TABLE journey_checkins':
    'Migration 87 journey rebuild: old data SELECTed into memory and re-inserted into new schema.',
  'DROP TABLE journey_members':
    'Migration 87 journey rebuild: old data SELECTed into memory and re-inserted into new schema.',
  'DROP TABLE journey_trips':
    'Migration 87 journey rebuild: old data SELECTed into memory and re-inserted into new schema.',
  'DROP TABLE journeys':
    'Migration 87 journey rebuild: old data SELECTed into memory and re-inserted into new schema.',

  // ── template/cache scaffolding drops (no user content lost) ──────────────
  'DROP TABLE packing_template_items':
    'IF EXISTS drop to recreate the template-items table with a category_id FK. Template scaffolding.',
  'DROP TABLE notification_preferences':
    'IF EXISTS drop AFTER migration 71 copied the data into notification_channel_preferences.',

  // ── guarded column drop ──────────────────────────────────────────────────
  'ALTER TABLE photo_providers DROP COLUMN config':
    'Drop generated-only config column; guarded by a PRAGMA table_info check that it exists.',

  // ── targeted, bounded DELETEs ────────────────────────────────────────────
  'DELETE FROM oauth_tokens':
    'SEC-H6: DELETE ... WHERE audience IS NULL — purge pre-audience-binding tokens that the MCP server now rejects.',
  'DELETE FROM journey_entries':
    "Migration 121: DELETE ... WHERE title IN ('Gallery','[Trip Photos]') — remove synthetic wrapper entries replaced by the gallery model.",
  'DELETE FROM place_regions':
    'Atlas enclave fix: DELETE ... WHERE place_id IN (places inside specific enclave boxes) — invalidate stale region cache; re-resolved on next request.',
  'DELETE FROM visited_regions':
    'Atlas geoBoundaries swap (#1119): DELETE ... WHERE id = ? — after UPDATE OR IGNORE re-codes a manually-marked region to its current code, drop only the single leftover row whose UNIQUE(user_id, region_code) collision caused the update to be skipped (a duplicate of a region the user already has).',
};

describe('migration hygiene — destructive operation guard', () => {
  it('introduces no destructive migration statement outside the reviewed allowlist', () => {
    const hits = findDestructiveStatements(scannableSource);
    const offenders = hits.filter((h) => !(h.signature in ALLOWED_DESTRUCTIVE));

    if (offenders.length > 0) {
      const detail = offenders
        .map((o) => `  • ${o.signature}   (matched: "${o.fragment}")`)
        .join('\n');
      throw new Error(
        `Found ${offenders.length} destructive migration statement(s) that are not on the ` +
          `reviewed allowlist in tests/unit/db/migration-hygiene.test.ts.\n` +
          `Migrations are append-only and destructive DDL/DML risks data loss on upgrade.\n` +
          `If the statement is genuinely safe (e.g. a SQLite table rebuild that copies rows ` +
          `first, or a tightly-bounded cache/cleanup DELETE), add its signature to ` +
          `ALLOWED_DESTRUCTIVE with a justification.\n\nOffending statement(s):\n${detail}`,
      );
    }

    expect(offenders).toEqual([]);
  });

  it('every allowlist entry still corresponds to a real statement (no dead allowlist rows)', () => {
    const present = new Set(findDestructiveStatements(scannableSource).map((h) => h.signature));
    const dead = Object.keys(ALLOWED_DESTRUCTIVE).filter((sig) => !present.has(sig));
    expect(dead, `Allowlist entries no longer found in migrations.ts: ${dead.join(', ')}`).toEqual([]);
  });
});

describe('migration hygiene — no silently swallowed errors', () => {
  it('contains no empty catch block (catch must at least log)', () => {
    // Matches `catch {}` and `catch (e) {}` where the body is only whitespace.
    const emptyCatch = scannableSource.match(/catch\s*(\([^)]*\))?\s*\{\s*\}/g) ?? [];
    expect(
      emptyCatch,
      `migrations.ts must not swallow errors silently. Give each catch a log line ` +
        `(e.g. console.warn('[migrations] ...', err)). Found: ${emptyCatch.length}`,
    ).toEqual([]);
  });
});

describe('migration hygiene — full chain smoke', () => {
  it('migrates a fresh in-memory database from zero to the latest version', () => {
    // createTestDb() runs createTables() + the entire runMigrations() chain.
    // This proves the logging edits in the previously-empty catch blocks do
    // not change control flow / break the migration runner.
    const db = createTestDb();
    try {
      const row = db.prepare('SELECT version FROM schema_version').get() as { version: number };
      expect(row.version).toBeGreaterThan(0);
    } finally {
      db.close();
    }
  });
});
