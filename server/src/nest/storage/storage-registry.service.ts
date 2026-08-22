import fs from 'node:fs';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { STORAGE_BACKEND_TYPES, storageConfigSchema } from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { LocalDriver } from './drivers/local.driver';
import { MirrorDriver, type ReplicaFailure } from './drivers/mirror.driver';
import { S3Driver } from './drivers/s3.driver';
import { StorageEventsService } from './storage-events.service';
import { DEFAULT_BACKUPS_ROOT, DEFAULT_UPLOADS_ROOT, GLOBAL_TEMP_DIR, SEED_CONFIG_PATH } from './storage-paths';
import { assertNoMaskSentinels, encryptStorageSecrets } from './storage-secrets';
import {
  SERVED_CATEGORIES,
  STORAGE_CATEGORIES,
  StorageBackendError,
  type ServedCategory,
  type StorageCategory,
  type StorageDriver,
} from './storage.types';

export interface ResolvedCategory {
  driver: StorageDriver;
  keyPrefix: string;
  backendName: string;
}

export type BackendSource = 'built-in' | 'env' | 'settings';
export interface BackendSnapshot {
  name: string;
  type: 'local' | 's3' | 'mirror';
  source: BackendSource;
  /** Stored options — secret fields still encrypted; masking is the admin layer's job. */
  options: Record<string, string | number | string[]>;
}
export interface RegistrySnapshot {
  backends: BackendSnapshot[];
  categories: Record<StorageCategory, { backend: string; source: 'default' | 'settings' }>;
}

interface LocalBackendConfig {
  name: string;
  type: 'local';
  options: { root: string };
}
interface MirrorBackendConfig {
  name: string;
  type: 'mirror';
  options: { primary: string; replicas: string[] };
}
interface S3BackendConfig {
  name: string;
  type: 's3';
  options: {
    endpoint: string;
    region: string;
    bucket: string;
    keyPrefix: string;
    accessKeyId: string;
    secretAccessKey: string;
    retries: number;
    timeoutMs: number;
  };
}
type BackendConfig = LocalBackendConfig | MirrorBackendConfig | S3BackendConfig;

interface RegistryState {
  drivers: Map<string, StorageDriver>;
  categories: Map<ServedCategory, { backendName: string; keyPrefix: string }>;
  snapshot: RegistrySnapshot;
}

export const BACKENDS_KEY = 'storage.backends';
export const CATEGORIES_KEY = 'storage.categories';
/**
 * Optimistic-concurrency counter (audit #7): bumped inside the SAME
 * transaction by every writer of the two settings rows above — applyConfig
 * and the migration flip (assignCategory) — so a stale admin PUT can never
 * silently undo a flip that landed after the PUT's form was loaded.
 */
export const VERSION_KEY = 'storage.config_version';
const REPLICA_FAILURE_RING_SIZE = 50;

/**
 * Category prefixes mirror the current uploads layout 1:1 so local keys map
 * to existing paths and no data migration is required. `backups` is bare-key
 * (the backend root IS the backups dir — spec rev 3.1), and `photos-google`
 * flips to bare keys when it resolves to `place-photos-local` (the relocated
 * TREK_PLACE_PHOTO_DIR layout, place-photo-cache.service.ts).
 *
 * Exported for tests/unit/uploads-dirs.test.ts, which pins the Dockerfile's
 * `mkdir -p /app/uploads/...` list to these prefixes.
 */
export const CATEGORY_PREFIXES: Record<ServedCategory, string> = {
  files: 'files/',
  journey: 'journey/',
  covers: 'covers/',
  avatars: 'avatars/',
  places: 'places/',
  photos: 'photos/',
  'photos-google': 'photos/google/',
  'photos-trek': 'photos/trek/',
  backups: '',
};

/**
 * Named backend instances + the category→backend map, config-driven and
 * swappable — v1 groundwork for the future admin UI (which becomes a settings
 * editor plus a reload() call).
 *
 * Unlike the codebase default of uncached per-request reads
 * (allowed-file-types.service.ts documents that convention), the registry
 * holds its validated config in memory and swaps it on reload() — the
 * permissions-cache precedent. Rationale: this sits on every byte-serving hot
 * path and its config changes only via admin action. Nothing outside this
 * class may cache a driver reference; resolution happens per call.
 */
@Injectable()
export class StorageRegistryService implements OnModuleInit {
  private readonly logger = new Logger(StorageRegistryService.name);
  private state: RegistryState | null = null;
  private failures: ReplicaFailure[] = [];
  /**
   * Set by load() whenever the stored settings fail to parse/validate — the
   * message a failing load logs, kept around so the admin state can surface
   * it (audit minor: silently falling back masked a broken stored config, so
   * a later save looked like a no-op edit but actually replaced it). Cleared
   * on the next successful load/reload.
   */
  private loadFailure: string | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly env: RuntimeEnvService,
    private readonly events: StorageEventsService,
  ) {}

  onModuleInit(): void {
    this.seedFromFileOnce();
    this.load(true);
  }

  /** Re-read settings, validate, atomically swap. In-flight ops keep their resolved instances. */
  reload(): void {
    this.load(false);
  }

  /**
   * Validate a candidate config by running the real build() — merge over
   * built-ins → parse → validateConfig → driver construction (network-free) —
   * and discard the result. Throws exactly what a failing load would log;
   * never touches this.state (admin writes must not take the silent boot-time
   * fallback). Shares one side effect with any successful save: local roots
   * and prefix dirs are created — an uncreatable root is exactly the error to
   * surface before persisting. cleanSpool stays boot-only (boot=false here).
   */
  preview(candidate: { backends: unknown; categories: unknown }): void {
    void this.build(candidate, false);
  }

  resolve(category: ServedCategory): ResolvedCategory {
    if (!this.state) throw new StorageBackendError('storage registry not initialized');
    const assignment = this.state.categories.get(category);
    if (!assignment) throw new StorageBackendError(`unknown storage category: ${category}`);
    const driver = this.state.drivers.get(assignment.backendName);
    if (!driver) {
      throw new StorageBackendError(`storage backend '${assignment.backendName}' missing for category '${category}'`);
    }
    return { driver, keyPrefix: assignment.keyPrefix, backendName: assignment.backendName };
  }

  /** The effective world with provenance — the admin GET renders from this. */
  snapshot(): RegistrySnapshot {
    if (!this.state) throw new StorageBackendError('storage registry not initialized');
    return this.state.snapshot;
  }

  /** Driver-agnostic global scratch space (data/tmp). */
  tempDir(): string {
    return GLOBAL_TEMP_DIR;
  }

  /**
   * The key-prefix a category resolves to ON A GIVEN BACKEND — the same rule
   * build() applies when assigning categories to the CURRENT config, exposed
   * standalone so a caller can ask "what prefix would this category use on
   * backend X" without X being the category's current assignment. The
   * category migration job is exactly that caller: it must compute the
   * DESTINATION prefix (on `to`, before the flip) while `resolve()` can only
   * ever answer for the backend a category is assigned to right now.
   */
  keyPrefixFor(category: ServedCategory, backendName: string): string {
    return prefixFor(category, backendName);
  }

  /** Driver instance for a defined backend, assigned or not; null when unknown. */
  driverByName(name: string): StorageDriver | null {
    if (!this.state) return null;
    return this.state.drivers.get(name) ?? null;
  }

  /** Current optimistic-concurrency counter — 0 when never bumped (fresh install). */
  currentConfigVersion(): number {
    return readConfigVersion(this.db);
  }

  /** Non-null when the last load() fell back (last-good config or built-in defaults) — null once a load succeeds. */
  lastLoadError(): string | null {
    return this.loadFailure;
  }

  /**
   * Persist one category assignment and reload — the migration flip's write
   * path. Same transactional row write applyConfig uses, scoped to one key;
   * the current stored map is read through the existing parseCategoryMap
   * validator rather than re-parsing the raw row by hand. Bumps the shared
   * version counter in the SAME transaction (audit #7) — a concurrent admin
   * PUT built against the pre-flip version now conflicts instead of silently
   * overwriting this assignment.
   */
  assignCategory(category: StorageCategory, backend: string): void {
    // Belt-and-braces alongside the migration job's own pre-flip cancel guard:
    // never persist a category pointing at a backend that doesn't exist in
    // the current snapshot (e.g. a config save removed it mid-migration).
    const defined = this.state?.snapshot.backends ?? [];
    const names = new Set(defined.map((b) => b.name));
    if (!names.has(backend)) {
      throw new StorageBackendError(`cannot assign '${category}' to unknown backend '${backend}'`);
    }
    // The OTHER writer of the two settings rows, so it enforces the same
    // shared-replica rule validateConfig does (see assertNoSharedReplicas):
    // a mirror's sync sweep DELETES replica objects its primary doesn't hold,
    // so routing a category onto a backend that is somebody's replica would
    // hand this category's objects to that sweep.
    const target = defined.find((b) => b.name === backend);
    const owner = target?.type === 'mirror' ? String(target.options.primary) : backend;
    const holder = defined.find((b) => b.type === 'mirror' && replicaNamesOf(b.options).includes(owner));
    if (holder) {
      throw new StorageBackendError(
        `cannot assign '${category}' to '${backend}' — '${owner}' is a mirror replica of '${holder.name}', and that mirror's sync sweep would delete the category's objects`,
      );
    }
    const stored = new Map(parseCategoryMap(this.readSettings().categories));
    stored.set(category, backend);
    const next = Object.fromEntries(stored);
    this.db.transaction(() => {
      const upsert = this.db.prepare(
        'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      );
      upsert.run(CATEGORIES_KEY, JSON.stringify(next));
      upsert.run(VERSION_KEY, String(readConfigVersion(this.db) + 1));
    });
    this.reload();
  }

  recordReplicaFailure(failure: ReplicaFailure): void {
    this.failures.push(failure);
    if (this.failures.length > REPLICA_FAILURE_RING_SIZE) {
      this.failures = this.failures.slice(-REPLICA_FAILURE_RING_SIZE);
    }
    this.events.emitReplicaFailure(failure);
  }

  replicaFailures(): readonly ReplicaFailure[] {
    return this.failures;
  }

  /**
   * Seed-once boot provisioning (spec: 2026-08-19-storage-admin-config-design.md).
   * Imported only when NO storage.* row exists; runs the same validation the
   * PUT pipeline runs (encryption gate, then preview); secrets are encrypted
   * on import; the file is ignored (loudly) afterward. Every failure aborts
   * boot with the exact error — an actively-provisioning operator must see
   * it, so this deliberately runs OUTSIDE load()'s last-good safety net.
   * Recovery: stop the server, DELETE FROM app_settings WHERE key LIKE
   * 'storage.%', restart (documented in the README with slice 3).
   */
  private seedFromFileOnce(): void {
    const rowCount = this.db.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM app_settings WHERE key IN (?, ?)',
      BACKENDS_KEY,
      CATEGORIES_KEY,
    );
    const filePresent = fs.existsSync(SEED_CONFIG_PATH);
    if ((rowCount?.n ?? 0) > 0) {
      if (filePresent) {
        this.logger.log(`storage config rows exist — ignoring ${SEED_CONFIG_PATH}; manage storage in the admin UI`);
      }
      return;
    }
    if (!filePresent) return;

    const fail = (detail: string): never => {
      throw new Error(`invalid storage seed file ${SEED_CONFIG_PATH}: ${detail}`);
    };
    let json: unknown;
    try {
      json = JSON.parse(fs.readFileSync(SEED_CONFIG_PATH, 'utf8'));
    } catch (err) {
      return fail(err instanceof Error ? err.message : String(err));
    }
    const parsed = storageConfigSchema.safeParse(json);
    if (!parsed.success) {
      return fail(
        parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; '),
      );
    }
    const config = parsed.data;
    try {
      assertNoMaskSentinels(config);
      this.preview({ backends: config.backends, categories: config.categories });
    } catch (err) {
      return fail(err instanceof Error ? err.message : String(err));
    }
    const encrypted = encryptStorageSecrets(config);
    this.db.transaction(() => {
      const upsert = this.db.prepare(
        'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      );
      upsert.run(BACKENDS_KEY, JSON.stringify(encrypted.backends));
      upsert.run(CATEGORIES_KEY, JSON.stringify(encrypted.categories));
    });
    this.logger.log(
      `storage config seeded from ${SEED_CONFIG_PATH} — the file is now ignored; manage storage in the admin UI`,
    );
  }

  /**
   * Invalid settings never take the server down: on any failure the previous
   * state is kept (at boot, when there is no previous state, the built-in
   * defaults — which cannot be misconfigured — are loaded instead).
   */
  private load(boot: boolean): void {
    try {
      this.state = this.build(this.readSettings(), boot);
      this.loadFailure = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const keeping = this.state ? 'last-good config' : 'built-in defaults';
      this.logger.error(`invalid storage settings — keeping ${keeping}: ${message}`);
      this.loadFailure = message;
      if (!this.state) {
        this.state = this.build({ backends: [], categories: {} }, boot);
      }
    }
  }

  private readSettings(): { backends: unknown; categories: unknown } {
    const read = (key: string): unknown => {
      const row = this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key);
      if (!row?.value) return undefined;
      try {
        return JSON.parse(row.value) as unknown;
      } catch (err) {
        // JSON.parse's own SyntaxError can echo a snippet of the raw input
        // around the failure position (Node 24 V8, e.g. `Unexpected token
        // 'u', ..."cessKey": undefined_"... is not valid JSON`) — for a
        // hand-edited/corrupted row that snippet can contain a fragment of a
        // real secret, and load()'s catch stores err.message verbatim as
        // configError, which the admin panel renders. Substitute a generic
        // message; keep only the numeric position when the engine reports
        // one the old ("at position N") way — never any quoted content.
        const position = err instanceof Error ? /at position (\d+)/.exec(err.message)?.[1] : undefined;
        throw new StorageBackendError(
          `'${key}' contains malformed JSON` + (position ? ` (at position ${position})` : ''),
        );
      }
    };
    return { backends: read(BACKENDS_KEY), categories: read(CATEGORIES_KEY) };
  }

  private build(settings: { backends: unknown; categories: unknown }, boot: boolean): RegistryState {
    // 1. Env is read fresh on every load (never snapshotted — RuntimeEnvService rule).
    const placePhotoDir = this.env.env().paths.placePhotoDir;

    // 2. Built-in defaults; settings entries with the same name/category override.
    //    uploads-local's root is the computed default; relocation is a settings
    //    override row bearing the built-in's name.
    const backends = new Map<string, BackendConfig>();
    backends.set('uploads-local', { name: 'uploads-local', type: 'local', options: { root: DEFAULT_UPLOADS_ROOT } });
    backends.set('backups-local', { name: 'backups-local', type: 'local', options: { root: DEFAULT_BACKUPS_ROOT } });
    const backendSources = new Map<string, BackendSource>([
      ['uploads-local', 'built-in'],
      ['backups-local', 'built-in'],
    ]);
    if (placePhotoDir) {
      backends.set('place-photos-local', { name: 'place-photos-local', type: 'local', options: { root: placePhotoDir } });
      backendSources.set('place-photos-local', 'env');
    }
    for (const config of parseBackendList(settings.backends)) {
      backends.set(config.name, config);
      backendSources.set(config.name, 'settings');
    }

    const categoryBackends = new Map<ServedCategory, string>();
    for (const category of SERVED_CATEGORIES) categoryBackends.set(category, 'uploads-local');
    categoryBackends.set('backups', 'backups-local');
    if (placePhotoDir) categoryBackends.set('photos-google', 'place-photos-local');
    const categorySources = new Map<ServedCategory, 'default' | 'settings'>();
    for (const [category, backendName] of parseCategoryMap(settings.categories)) {
      categoryBackends.set(category, backendName);
      categorySources.set(category, 'settings');
    }

    // 3. Validate the merged config as a whole.
    validateConfig(backends, categoryBackends);

    // 4. Category prefixes (photos-google mode decided from the final map).
    const categories = new Map<ServedCategory, { backendName: string; keyPrefix: string }>();
    for (const [category, backendName] of categoryBackends) {
      categories.set(category, { backendName, keyPrefix: this.keyPrefixFor(category, backendName) });
    }

    // 5. Instantiate drivers: locals first (each ensures its own dirs; spool
    // cleanup at boot only — a reload() could delete an in-flight upload's
    // spool file), then mirrors over the local instances.
    const drivers = new Map<string, StorageDriver>();
    for (const config of backends.values()) {
      if (config.type !== 'local') continue;
      const driver = new LocalDriver({ id: config.name, root: config.options.root });
      const ensurePrefixes = [...categories.entries()]
        .filter(([, assignment]) => assignment.backendName === config.name)
        .map(([, assignment]) => assignment.keyPrefix)
        .filter((prefix) => prefix !== '');
      driver.init({ ensurePrefixes, cleanSpool: boot });
      drivers.set(config.name, driver);
    }
    for (const config of backends.values()) {
      if (config.type !== 's3') continue;
      drivers.set(
        config.name,
        new S3Driver({ id: config.name, ...config.options, secretAccessKey: decryptedSecret(config) }),
      );
    }
    for (const config of backends.values()) {
      if (config.type !== 'mirror') continue;
      drivers.set(
        config.name,
        new MirrorDriver({
          id: config.name,
          primary: drivers.get(config.options.primary)!,
          replicas: config.options.replicas.map((name) => drivers.get(name)!),
          tempDir: () => this.tempDir(),
          onReplicaFailure: (failure) => this.recordReplicaFailure(failure),
        }),
      );
    }
    fs.mkdirSync(GLOBAL_TEMP_DIR, { recursive: true });

    // 6. The effective world with provenance — assembled from the same merged
    // maps, so it always matches what drivers/categories actually resolve to.
    const snapshot: RegistrySnapshot = {
      backends: [...backends.values()].map((config) => ({
        name: config.name,
        type: config.type,
        source: backendSources.get(config.name) ?? 'settings',
        options: { ...config.options },
      })),
      categories: Object.fromEntries(
        [...categoryBackends.entries()]
          // photos is served-legacy, never configurable — the admin world
          // exposes only the 8 configurable categories.
          .filter(([category]) => (STORAGE_CATEGORIES as readonly string[]).includes(category))
          .map(([category, backendName]) => [
            category,
            { backend: backendName, source: categorySources.get(category) ?? 'default' },
          ]),
      ) as RegistrySnapshot['categories'],
    };

    // 7. Single-assignment swap — callers mid-operation keep their instances.
    return { drivers, categories, snapshot };
  }
}

// ── settings parsing / validation (pure helpers) ──────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Raw read of the version counter row — 0 for an absent/garbage row (fresh install, or a hand-edited DB). */
function readConfigVersion(db: DatabaseService): number {
  const row = db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', VERSION_KEY);
  const parsed = row?.value ? Number.parseInt(row.value, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBackendList(raw: unknown): BackendConfig[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new StorageBackendError(`'${BACKENDS_KEY}' must be a JSON array`);
  return raw.map((entry): BackendConfig => {
    if (!isRecord(entry) || typeof entry.name !== 'string' || !entry.name) {
      throw new StorageBackendError(`'${BACKENDS_KEY}' entries need a non-empty string 'name'`);
    }
    const options = isRecord(entry.options) ? entry.options : {};
    if (entry.type === 'local') {
      if (typeof options.root !== 'string' || !options.root) {
        throw new StorageBackendError(`local backend '${entry.name}' needs a non-empty 'options.root'`);
      }
      return { name: entry.name, type: 'local', options: { root: options.root } };
    }
    if (entry.type === 'mirror') {
      const replicas = Array.isArray(options.replicas) ? options.replicas : null;
      if (typeof options.primary !== 'string' || !replicas || replicas.some((r) => typeof r !== 'string')) {
        throw new StorageBackendError(`mirror backend '${entry.name}' needs 'options.primary' and 'options.replicas'`);
      }
      return { name: entry.name, type: 'mirror', options: { primary: options.primary, replicas: replicas as string[] } };
    }
    if (entry.type === 's3') {
      const parsed = STORAGE_BACKEND_TYPES.s3.optionsSchema.safeParse(options);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new StorageBackendError(
          `s3 backend '${entry.name}' has invalid options` +
            (first ? ` — ${first.path.join('.') || '(options)'}: ${first.message}` : ''),
        );
      }
      // secretAccessKey stays as stored (usually enc:v1:) — decrypted only at
      // driver construction, so config maps and snapshots never hold plaintext.
      return { name: entry.name, type: 's3', options: parsed.data };
    }
    throw new StorageBackendError(`backend '${entry.name}' has unknown type '${String(entry.type)}'`);
  });
}

function parseCategoryMap(raw: unknown): Array<[StorageCategory, string]> {
  if (raw === undefined) return [];
  if (!isRecord(raw)) throw new StorageBackendError(`'${CATEGORIES_KEY}' must be a JSON object`);
  return Object.entries(raw).map(([category, backendName]) => {
    if (!(STORAGE_CATEGORIES as readonly string[]).includes(category)) {
      throw new StorageBackendError(`'${CATEGORIES_KEY}' names unknown category '${category}'`);
    }
    if (typeof backendName !== 'string' || !backendName) {
      throw new StorageBackendError(`category '${category}' must map to a backend name`);
    }
    return [category as StorageCategory, backendName];
  });
}

/**
 * Secrets live encrypted inside the storage.backends JSON (admin-config spec);
 * plaintext passthrough is tolerated as belt-and-braces (decrypt_api_key's
 * legacy-plaintext rule), though seed and PUT always store encrypted.
 */
function decryptedSecret(config: S3BackendConfig): string {
  const plain = decrypt_api_key(config.options.secretAccessKey);
  if (plain === null) {
    throw new StorageBackendError(
      `s3 backend '${config.name}': could not decrypt 'secretAccessKey' — was ENCRYPTION_KEY changed or the row edited by hand?`,
    );
  }
  return plain;
}

/** The key-prefix a category uses on a given backend — see keyPrefixFor's doc comment. */
function prefixFor(category: ServedCategory, backendName: string): string {
  return category === 'photos-google' && backendName === 'place-photos-local' ? '' : CATEGORY_PREFIXES[category];
}

/** Replica names off a snapshot's loose options record (mirrors always carry a string[] there). */
function replicaNamesOf(options: Record<string, string | number | string[]>): string[] {
  return Array.isArray(options.replicas) ? options.replicas : [];
}

/** Human-readable prefix for an error message — '' is the backend's whole root. */
function describePrefix(prefix: string): string {
  return prefix === '' ? 'the backend root' : `'${prefix}'`;
}

/** First overlapping pair across two swept-prefix sets; '' (the root) overlaps everything. */
function overlappingPrefixes(a: ReadonlySet<string>, b: ReadonlySet<string>): [string, string] | null {
  for (const left of a) {
    for (const right of b) {
      if (left.startsWith(right) || right.startsWith(left)) return [left, right];
    }
  }
  return null;
}

/**
 * The shared-replica rule (audit critical — the backfill deletion sweep).
 *
 * A mirror's "Sync now" sweep makes each replica MATCH the primary: it lists
 * the replica under every prefix the mirror's categories occupy and deletes
 * the keys the primary doesn't hold. `backups` occupies prefix '' — the
 * replica's ENTIRE root — so a backend that is simultaneously a replica and a
 * category target would have that category's objects deleted by the first
 * sync (silent data loss from the flagship mirror flow). The sweep is
 * correct; what must not exist is a config that expresses the overlap. Hence
 * two refusals, both naming the backend and the conflict:
 *
 * 1. a backend that serves a category — directly, or as the PRIMARY of a
 *    mirror a category routes to — can never also be a mirror replica;
 * 2. a backend replicating two mirrors whose swept prefixes overlap (equal,
 *    nested, or either one '') would have each mirror's sweep delete the
 *    other's objects.
 *
 * Disjoint prefixes are fine: one backend may replicate `files` for one
 * mirror and `covers` for another. The admin UI keeps the replica picker in
 * step by never offering a backend that already serves a category.
 */
function assertNoSharedReplicas(
  backends: Map<string, BackendConfig>,
  categories: Map<ServedCategory, string>,
): void {
  const replicaOf = new Map<string, string[]>(); // backend → mirrors listing it as a replica
  for (const config of backends.values()) {
    if (config.type !== 'mirror') continue;
    for (const replica of config.options.replicas) {
      replicaOf.set(replica, [...(replicaOf.get(replica) ?? []), config.name]);
    }
  }
  if (replicaOf.size === 0) return;

  const servedBy = new Map<string, ServedCategory[]>(); // serving backend → its categories
  const sweptBy = new Map<string, Set<string>>(); // mirror → the prefixes its sweep covers
  for (const [category, backendName] of categories) {
    // Existence was checked by the caller, so this lookup cannot miss.
    const backend = backends.get(backendName)!;
    const owner = backend.type === 'mirror' ? backend.options.primary : backendName;
    servedBy.set(owner, [...(servedBy.get(owner) ?? []), category]);
    if (backend.type === 'mirror') {
      const prefixes = sweptBy.get(backendName) ?? new Set<string>();
      prefixes.add(prefixFor(category, backendName));
      sweptBy.set(backendName, prefixes);
    }
  }

  const empty: ReadonlySet<string> = new Set();
  for (const [replica, mirrors] of replicaOf) {
    const served = servedBy.get(replica);
    if (served) {
      throw new StorageBackendError(
        `backend '${replica}' is a mirror replica of '${mirrors[0]}' and also serves category '${served[0]}' — ` +
          `a backend can be a replica or a category target, not both (a sync sweep deletes replica objects the mirror's primary doesn't hold)`,
      );
    }
    for (let i = 0; i < mirrors.length; i += 1) {
      for (let j = i + 1; j < mirrors.length; j += 1) {
        const overlap = overlappingPrefixes(sweptBy.get(mirrors[i]!) ?? empty, sweptBy.get(mirrors[j]!) ?? empty);
        if (overlap) {
          throw new StorageBackendError(
            `backend '${replica}' replicates both '${mirrors[i]}' and '${mirrors[j]}', whose swept key prefixes overlap ` +
              `(${describePrefix(overlap[0])} and ${describePrefix(overlap[1])}) — one mirror's sync sweep would delete the other's objects`,
          );
        }
      }
    }
  }
}

function validateConfig(backends: Map<string, BackendConfig>, categories: Map<ServedCategory, string>): void {
  for (const config of backends.values()) {
    if (config.type !== 'mirror') continue;
    for (const target of [config.options.primary, ...config.options.replicas]) {
      const resolved = backends.get(target);
      if (!resolved) {
        throw new StorageBackendError(`mirror '${config.name}' references unknown backend '${target}'`);
      }
      if (resolved.type === 'mirror') {
        throw new StorageBackendError(`mirror '${config.name}' nests mirror '${target}' — nesting is rejected`);
      }
    }
  }
  for (const [category, backendName] of categories) {
    const backend = backends.get(backendName);
    if (!backend) {
      throw new StorageBackendError(`category '${category}' maps to unknown backend '${backendName}'`);
    }
  }
  assertNoSharedReplicas(backends, categories);
}
