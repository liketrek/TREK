import fs from 'node:fs';
import { Injectable } from '@nestjs/common';
import type { StorageAdminState, StorageBackend, StorageConfigPut, StorageTestResponse, StorageUsage } from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import {
  BACKENDS_KEY,
  CATEGORIES_KEY,
  VERSION_KEY,
  StorageRegistryService,
} from './storage-registry.service';
import { StorageService } from './storage.service';
import { SEED_CONFIG_PATH } from './storage-paths';
import {
  assertNoMaskSentinels,
  decryptBackendSecrets,
  encryptStorageSecrets,
  maskBackendOptions,
  unmaskStorageConfig,
} from './storage-secrets';
import { ephemeralDriverFor, probeDriver, type ProbeTargetResult } from './storage-probe';
import { StorageBackendError, StorageConflictError, type StorageCategory } from './storage.types';
import { StorageJobsService } from './storage-jobs.service';
import { StorageStatsService } from './storage-stats.service';

/**
 * Owner of the api/admin/storage read/write pipelines (spec:
 * docs/superpowers/specs/2026-08-19-storage-admin-config-design.md, Server).
 * Reads render from the registry's live snapshot; writes run
 * unmask → preview → encrypt → persist → reload, so an admin save either
 * fully applies or changes nothing — never the boot-time silent fallback.
 */
@Injectable()
export class StorageAdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly registry: StorageRegistryService,
    private readonly storage: StorageService,
    private readonly jobs: StorageJobsService,
    private readonly stats: StorageStatsService,
  ) {}

  /** The effective world — secrets masked, categories cross-referenced per backend. */
  state(): StorageAdminState {
    const snapshot = this.registry.snapshot();
    const assignments = Object.entries(snapshot.categories) as Array<
      [keyof typeof snapshot.categories, { backend: string; source: 'default' | 'settings' }]
    >;
    return {
      backends: snapshot.backends.map((backend) => ({
        name: backend.name,
        type: backend.type,
        source: backend.source,
        options: maskBackendOptions(backend.type, backend.options),
        categories: assignments.filter(([, a]) => a.backend === backend.name).map(([category]) => category),
      })),
      categories: snapshot.categories,
      health: { replicaFailures: this.storage.health().replicaFailures.map((f) => ({ ...f })) },
      seedFilePresent: fs.existsSync(SEED_CONFIG_PATH),
      usage: this.stats.readUsage(),
      backfills: this.jobs.statuses(),
      migrations: this.jobs.migrationStatuses(),
      version: this.registry.currentConfigVersion(),
      configError: this.registry.lastLoadError(),
    };
  }

  /**
   * Start a replica catch-up for a routed mirror. Delegates to the one-at-a-time
   * job registry; throws BackfillTargetError (404) / BackfillBusyError (409).
   */
  startBackfill(mirrorName: string): void {
    this.jobs.startBackfill(mirrorName);
  }

  /** True when an active run was cancelled; false when there was nothing to cancel. */
  cancelBackfill(mirrorName: string): boolean {
    return this.jobs.cancelBackfill(mirrorName);
  }

  /**
   * Start a category migration to a new backend. Delegates to the one-at-a-time
   * job registry; throws MigrationRequestError (400) / MigrationTargetError (404) /
   * BackfillBusyError (409).
   */
  startMigration(category: StorageCategory, to: string): void {
    this.jobs.startMigration(category, to);
  }

  /** True when an active migration was cancelled; false when there was nothing to cancel. */
  cancelMigration(category: string): boolean {
    return this.jobs.cancelMigration(category);
  }

  /** Runs and persists a fresh usage scan. Throws StatsBusyError (409) if one is already running. */
  refreshStats(): Promise<StorageUsage> {
    return this.stats.scan();
  }

  /**
   * Full-document replace of the two settings rows. Throws StorageBackendError
   * on any refusal, or StorageConflictError (audit #7) when `config.version`
   * no longer matches the stored counter — checked FIRST, before unmask/preview,
   * so a stale submit never even previews against (let alone overwrites) a
   * config that moved on since the form was loaded (e.g. a category
   * migration's flip, which bumps the same counter).
   */
  applyConfig(config: StorageConfigPut): void {
    const currentVersion = this.registry.currentConfigVersion();
    if (config.version !== currentVersion) {
      throw new StorageConflictError(currentVersion, config.version);
    }
    const unmasked = unmaskStorageConfig(config, this.storedBackendsRow());
    // unmask only resolves the secret fields it knows about; a mask sentinel
    // submitted in a non-secret field would otherwise pass through untouched
    // and get persisted verbatim as garbage-in.
    assertNoMaskSentinels(unmasked);
    this.registry.preview({ backends: unmasked.backends, categories: unmasked.categories });
    const encrypted = encryptStorageSecrets(unmasked);
    this.db.transaction(() => {
      const upsert = this.db.prepare(
        'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      );
      upsert.run(BACKENDS_KEY, JSON.stringify(encrypted.backends));
      upsert.run(CATEGORIES_KEY, JSON.stringify(encrypted.categories));
      upsert.run(VERSION_KEY, String(currentVersion + 1));
    });
    this.registry.reload();
    // Any running job whose backend the reloaded config no longer has ends
    // cancelled rather than running invisibly against a stale driver ref
    // (polish item 3) — see StorageJobsService.cancelJobsForMissingBackends.
    this.jobs.cancelJobsForMissingBackends();
  }

  /**
   * Probe an (unsaved or stored) candidate with ephemeral drivers. Mirrors are
   * expanded and probed per target — the probe bypasses MirrorDriver, which
   * hides replica failures by design. Registry state is never touched.
   */
  async testBackend(candidate: StorageBackend): Promise<StorageTestResponse> {
    const { backends } = unmaskStorageConfig(
      { backends: [candidate], categories: {} },
      this.storedBackendsRow(),
    );
    const backend = backends[0]!;
    const targets = this.probeTargetsFor(backend).map(decryptBackendSecrets) as Array<
      Extract<StorageBackend, { type: 'local' | 's3' }>
    >;
    const results: ProbeTargetResult[] = [];
    for (const target of targets) {
      results.push(await this.probeTarget(target));
    }
    return { ok: results.every((r) => r.ok), targets: results };
  }

  /** Expand a mirror candidate into its concrete targets via the live snapshot. */
  private probeTargetsFor(backend: StorageBackend): StorageBackend[] {
    if (backend.type !== 'mirror') return [backend];
    const byName = new Map(this.registry.snapshot().backends.map((b) => [b.name, b]));
    const names = [backend.options.primary, ...backend.options.replicas];
    return names.map((name) => {
      const resolved = byName.get(name);
      if (!resolved) {
        throw new StorageBackendError(`mirror '${backend.name}' references unknown backend '${name}'`);
      }
      if (resolved.type === 'mirror') {
        throw new StorageBackendError(`mirror '${backend.name}' nests mirror '${name}' — nesting is rejected`);
      }
      return { name: resolved.name, type: resolved.type, options: resolved.options } as StorageBackend;
    });
  }

  private async probeTarget(target: Extract<StorageBackend, { type: 'local' | 's3' }>): Promise<ProbeTargetResult> {
    let driver;
    try {
      driver = ephemeralDriverFor(target);
    } catch (err) {
      return { name: target.name, ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    return probeDriver(target.name, driver);
  }

  /** The raw stored backends row — the unmask source (tolerates absent/garbage rows). */
  private storedBackendsRow(): unknown {
    const row = this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', BACKENDS_KEY);
    if (!row?.value) return [];
    try {
      return JSON.parse(row.value) as unknown;
    } catch {
      return [];
    }
  }
}
