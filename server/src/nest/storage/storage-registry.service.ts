import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { DataPathsService } from '../app-config/data-paths.service';
import { storageConfig } from '../app-config/tokens';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { withRequestContext } from '../database/request-context';
import { UnitOfWork } from '../database/unit-of-work';
import { LocalDriver } from './drivers/local.driver';
import { MirrorDriver, type ReplicaFailure } from './drivers/mirror.driver';
import { S3Driver } from './drivers/s3.driver';
import { StorageEventsService } from './storage-events.service';
import { getSeedConfigPath } from './storage-paths';
import { assertNoMaskSentinels, encryptStorageSecrets } from './storage-secrets';
import {
  SERVED_CATEGORIES,
  STORAGE_CATEGORIES,
  StorageBackendError,
  type ServedCategory,
  type StorageCategory,
  type StorageDriver,
} from './storage.types';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { STORAGE_BACKEND_TYPES, storageConfigSchema } from '@trek/shared';

import fs from 'node:fs';

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
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    @Inject(storageConfig.KEY) private readonly storageEnv: ConfigType<typeof storageConfig>,
    private readonly events: StorageEventsService,
    private readonly uow: UnitOfWork,
    private readonly orm: MikroORM,
    // The built-in roots and the scratch dir. A hand-built registry (the unit
    // suites) resolves the same layout the container's provider does.
    private readonly dataPaths: DataPathsService = new DataPathsService(),
  ) {}

  /**
   * `onModuleInit` is a DIFFERENT boot hook than the `CronRegistrarService`/
   * `runOnBoot` machinery every job file in this plan otherwise relies on
   * (Plan 3i's own BOOT GATE note): it fires at Nest's MODULE-INIT lifecycle
   * stage, before `app.init()` wires up `@mikro-orm/nestjs`'s per-request
   * middleware — a repository call here has no per-request `EntityManager`
   * fork to resolve through and would hit MikroORM's `cannotUseGlobalContext`
   * refusal (confirmed against a real `createNestApplication()` boot, not
   * only the test ORMs' `allowGlobalContext: true` default, which silently
   * hides this). This opens its own request context, the same shape
   * `StorageHealthNotifierService`'s `onApplicationBootstrap` hook uses.
   */
  async onModuleInit(): Promise<void> {
    await withRequestContext(this.orm, async () => {
      await this.seedFromFileOnce();
      await this.load(true);
    });
  }

  /** Re-read settings, validate, atomically swap. In-flight ops keep their resolved instances. */
  async reload(): Promise<void> {
    await this.load(false);
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
    return this.dataPaths.tmpDir;
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
  async currentConfigVersion(): Promise<number> {
    return await readConfigVersion(this.appSettings);
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
  async assignCategory(category: StorageCategory, backend: string): Promise<void> {
    // Belt-and-braces alongside the migration job's own pre-flip cancel guard:
    // never persist a category pointing at a backend that doesn't exist in
    // the current snapshot (e.g. a config save removed it mid-migration).
    const defined = this.state?.snapshot.backends ?? [];
    const names = new Set(defined.map((b) => b.name));
    if (!names.has(backend)) {
      throw new StorageBackendError(`cannot assign '${category}' to unknown backend '${backend}'`);
    }
    // R5 defect 2 fix (2026-09-25 ORM Plan 3i, storage task): this used to
    // run its OWN, narrower inline check here — whether the flip's direct
    // target (or, for a mirror target, that mirror's primary) is itself a
    // replica of some OTHER mirror. That covers only the first of
    // assertNoSharedReplicas's two documented refusal cases and misses the
    // second (a backend replicating two mirrors whose swept key prefixes
    // overlap) — a flip could persist a config that the very next
    // build()/reload() would then refuse (or silently mis-sweep). Calling
    // the SAME predicate validateConfig() runs on every load — over the
    // merged backend/category maps with THIS flip applied — catches both
    // cases before the write, not merely on the next reload. Genuine
    // behavior change, not parity — see the task report's "For the user"
    // note.
    const settings = await this.readSettings();
    const { backends: mergedBackends, categoryBackends: mergedCategories } = this.mergeBackendsAndCategories(settings);
    mergedCategories.set(category, backend);
    assertNoSharedReplicas(mergedBackends, mergedCategories);

    const stored = new Map(parseCategoryMap(settings.categories));
    stored.set(category, backend);
    const next = Object.fromEntries(stored);
    await this.uow.transactional(async () => {
      await this.appSettings.setValue(CATEGORIES_KEY, JSON.stringify(next));
      await this.appSettings.setValue(VERSION_KEY, String((await readConfigVersion(this.appSettings)) + 1));
    });
    await this.reload();
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
  private async seedFromFileOnce(): Promise<void> {
    const seedPath = getSeedConfigPath();
    const rowCount = await this.appSettings.countKeysPresent([BACKENDS_KEY, CATEGORIES_KEY]);
    const filePresent = fs.existsSync(seedPath);
    if (rowCount > 0) {
      if (filePresent) {
        this.logger.log(`storage config rows exist — ignoring ${seedPath}; manage storage in the admin UI`);
      }
      return;
    }
    if (!filePresent) return;

    const fail = (detail: string): never => {
      throw new Error(`invalid storage seed file ${seedPath}: ${detail}`);
    };
    let json: unknown;
    try {
      json = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
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
    await this.uow.transactional(async () => {
      await this.appSettings.setValue(BACKENDS_KEY, JSON.stringify(encrypted.backends));
      await this.appSettings.setValue(CATEGORIES_KEY, JSON.stringify(encrypted.categories));
    });
    this.logger.log(`storage config seeded from ${seedPath} — the file is now ignored; manage storage in the admin UI`);
  }

  /**
   * Invalid settings never take the server down: on any failure the previous
   * state is kept (at boot, when there is no previous state, the built-in
   * defaults — which cannot be misconfigured — are loaded instead).
   */
  private async load(boot: boolean): Promise<void> {
    try {
      this.state = this.build(await this.readSettings(), boot);
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

  private async readSettings(): Promise<{ backends: unknown; categories: unknown }> {
    const read = async (key: string): Promise<unknown> => {
      const value = await this.appSettings.getValue(key);
      if (!value) return undefined;
      try {
        return JSON.parse(value) as unknown;
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
    return { backends: await read(BACKENDS_KEY), categories: await read(CATEGORIES_KEY) };
  }

  /**
   * The merged backend/category maps build() computes as its own steps 1–2
   * (env defaults + built-ins + settings overrides), without the driver
   * construction/validation side effects that follow — the shared basis
   * both build() and assignCategory()'s pre-write assertNoSharedReplicas
   * check need (R5 defect 2), so the two never compute two different
   * answers for "what does this instance's config resolve to."
   */
  private mergeBackendsAndCategories(settings: { backends: unknown; categories: unknown }): {
    backends: Map<string, BackendConfig>;
    backendSources: Map<string, BackendSource>;
    categoryBackends: Map<ServedCategory, string>;
    categorySources: Map<ServedCategory, 'default' | 'settings'>;
  } {
    // 1. TREK_PLACE_PHOTO_DIR is boot-stable: the storageConfig token owns it and
    //    every load of one built app sees the same value.
    const placePhotoDir = this.storageEnv.placePhotoDir;

    // 2. Built-in defaults; settings entries with the same name/category override.
    //    uploads-local's root is the computed default; relocation is a settings
    //    override row bearing the built-in's name.
    const backends = new Map<string, BackendConfig>();
    backends.set('uploads-local', {
      name: 'uploads-local',
      type: 'local',
      options: { root: this.dataPaths.uploadsDir },
    });
    backends.set('backups-local', {
      name: 'backups-local',
      type: 'local',
      options: { root: this.dataPaths.backupsDir },
    });
    const backendSources = new Map<string, BackendSource>([
      ['uploads-local', 'built-in'],
      ['backups-local', 'built-in'],
    ]);
    if (placePhotoDir) {
      backends.set('place-photos-local', {
        name: 'place-photos-local',
        type: 'local',
        options: { root: placePhotoDir },
      });
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
    return { backends, backendSources, categoryBackends, categorySources };
  }

  private build(settings: { backends: unknown; categories: unknown }, boot: boolean): RegistryState {
    const { backends, backendSources, categoryBackends, categorySources } = this.mergeBackendsAndCategories(settings);

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
    fs.mkdirSync(this.dataPaths.tmpDir, { recursive: true });

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
async function readConfigVersion(appSettings: AppSettingsRepository): Promise<number> {
  const value = await appSettings.getValue(VERSION_KEY);
  const parsed = value ? Number.parseInt(value, 10) : 0;
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
      return {
        name: entry.name,
        type: 'mirror',
        options: { primary: options.primary, replicas: replicas as string[] },
      };
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
function assertNoSharedReplicas(backends: Map<string, BackendConfig>, categories: Map<ServedCategory, string>): void {
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
