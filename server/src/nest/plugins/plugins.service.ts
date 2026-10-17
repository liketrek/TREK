import { PluginActions } from '../../db/entities/PluginActions.entity';
import { PluginCapabilityAudit } from '../../db/entities/PluginCapabilityAudit.entity';
import { PluginEgressHosts } from '../../db/entities/PluginEgressHosts.entity';
import { PluginErrorLog } from '../../db/entities/PluginErrorLog.entity';
import { PluginSettingsFields } from '../../db/entities/PluginSettingsFields.entity';
import { PluginUserConfig } from '../../db/entities/PluginUserConfig.entity';
import { Plugins } from '../../db/entities/Plugins.entity';
import type { PluginActionsRepository } from '../../db/repositories/PluginActions.repository';
import type { PluginCapabilityAuditRepository } from '../../db/repositories/PluginCapabilityAudit.repository';
import type { PluginEgressHostsRepository } from '../../db/repositories/PluginEgressHosts.repository';
import type { PluginErrorLogRepository } from '../../db/repositories/PluginErrorLog.repository';
import type { PluginSettingsFieldsRepository } from '../../db/repositories/PluginSettingsFields.repository';
import type { PluginUserConfigRepository } from '../../db/repositories/PluginUserConfig.repository';
import type { PluginsRepository } from '../../db/repositories/Plugins.repository';
import { AddonsService } from '../addons/addons.service';
import { maybe_encrypt_api_key, decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import {
  parseDependencies,
  disabledRequiredAddons,
  resolveDependencyState,
  type PluginDepRow,
  type PluginDependencies,
  type VersionMismatch,
} from './dependencies';
import { devLinkEnabled } from './dev-link';
import { readAudit } from './host/plugin-audit';
import { pluginBudgetUsage } from './host/plugin-host-state';
import { bypassedRange, hostSatisfies, hostVersion, trekRangeBypassed } from './install/host-compat';
import type { TrekRangeBypass } from './install/host-compat';
import type { PluginDependency } from './install/manifest';
import { pluginsEnabled } from './kill-switch';
import { safeParseConfig as safeParse } from './plugin-config-parse';
import { isFilled, parseDefaultValue, settingDefaults } from './settings-defaults';
import { keyFingerprint } from './signature-status';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { PluginSettingsField } from '@trek/shared';

const SECRET_MASK = '••••••••';

export type PluginDependencyStatus = 'ok' | 'addonDisabled' | 'missingPlugin' | 'hostIncompatible';

/** A save that would leave a `required` settings field empty — mapped to 400 by both controllers. */
export class MissingRequiredSettingError extends Error {
  constructor(public readonly field: string) {
    super(`Missing required setting "${field}"`);
    this.name = 'MissingRequiredSettingError';
  }
}

/**
 * Read side of the plugin system (#plugins), M0 scaffold. Lists installed
 * plugins from the `plugins` registry table and reports whether the runtime is
 * enabled (TREK_PLUGINS_ENABLED). No execution here — the isolated runtime,
 * install pipeline and registry fetch land in later milestones.
 */

interface PluginRawRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  version: string | null;
  status: string;
  enabled: number;
  last_error: string | null;
  reviewed_at: string | null;
  source_repo: string | null;
  permissions: string;
  capabilities: string;
  dependencies: string | null;
  trek_range: string | null;
  author_pubkey: string | null;
  update_block_code: string | null;
  update_block_detail: string | null;
  update_block_version: string | null;
  update_hold: number;
}

export interface PluginListItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  version: string | null;
  status: string;
  enabled: number;
  last_error: string | null;
  reviewed_at: string | null;
  source_repo: string | null;
  /** Declared permissions (JSON string) — drives the "what this can access" chips. */
  permissions: string;
  /** Declared capabilities (JSON string) — e.g. widget slot. */
  capabilities: string;
  /** The plugin declared it needs OPERATOR-supplied egress hosts (a self-hosted target). */
  operatorEgress: boolean;
  /** How many hosts an admin has actually added — so the card can nudge when it's 0. */
  egressHostCount: number;
  /** How many `scope:'instance'` settings fields the plugin declares — gates the admin
   * settings menu item without a per-plugin fetch. */
  instanceSettingsCount: number;
  /** How many `scope:'instance'` actions the plugin declares — gates the admin settings
   * menu item together with instanceSettingsCount (a plugin can have actions and no fields). */
  instanceActionsCount: number;
  /** Declared dependencies (parsed) — required addons + plugin deps. */
  dependencies: PluginDependencies;
  /** Whether this plugin can currently activate, and why not if it can't. */
  dependencyStatus: PluginDependencyStatus;
  /** The TREK range the plugin declares it supports; null if it declared none. */
  trekRange: string | null;
  /** The running TREK, so the UI can say "needs X, you have Y" without doing semver. */
  hostVersion: string;
  /**
   * Non-null when the plugin is outside its declared range (or declared none) and only
   * TREK_PLUGINS_IGNORE_TREK_RANGE lets it activate. The card shows it as a warning
   * rather than a blocker: the admin chose this, but must keep seeing what they chose.
   */
  trekRangeBypassed: TrekRangeBypass | null;
  /** The concrete blockers, so the UI can render chips + the resolve dialog. */
  dependencyIssues: { disabledAddons: string[]; missing: PluginDependency[]; versionMismatch: VersionMismatch[] };
  /**
   * The author's signature was verified and their key TOFU-pinned at install.
   * False means the bytes matched the registry's sha256 pin and nothing more — one
   * fewer guarantee, not "insecure". Meaningless for a sideloaded/dev-linked plugin,
   * which sits outside the registry trust model entirely; the UI badges those instead.
   */
  signed: boolean;
  /** Short, human-comparable form of the pinned key — for reading out to the author. */
  keyFingerprint: string | null;
  /** Why an update was refused, if one was. `version` is the registry version that was
   * refused, so a caller can treat the block as stale once a newer one is on offer. */
  updateBlock: { code: string; detail: string | null; version: string | null } | null;
  /** A deliberate non-latest install paused updates: excluded from the banner/Update all
   * until the admin resumes, or an install lands back on the newest compatible version. */
  updateHold: boolean;
}

@Injectable()
export class PluginsService {
  constructor(
    private readonly addons: AddonsService,
    // Plan 3j Task 2 — PS1-PS13's own tables, injected as repositories. All 6
    // REQUIRED (not `@Optional()`), matching `PluginRuntimeService`'s own ruling
    // (Task 1's `PluginGuards`/`UsersRepository` precedent): virtually every method
    // on this class reaches one of these tables, so a hand-built test instance
    // needs real ones regardless (`sharedTestOrm(...).repo(Entity)`).
    @InjectRepository(Plugins) private readonly plugins: PluginsRepository,
    @InjectRepository(PluginEgressHosts) private readonly pluginEgressHosts: PluginEgressHostsRepository,
    @InjectRepository(PluginSettingsFields) private readonly pluginSettingsFields: PluginSettingsFieldsRepository,
    @InjectRepository(PluginActions) private readonly pluginActions: PluginActionsRepository,
    @InjectRepository(PluginUserConfig) private readonly pluginUserConfig: PluginUserConfigRepository,
    @InjectRepository(PluginErrorLog) private readonly pluginErrorLog: PluginErrorLogRepository,
    // Plan 3j Task 3 landed concurrently and converted `readAudit`/`pluginBudgetUsage`
    // (host/plugin-audit.ts, host/plugin-host-state.ts) to take this repository instead
    // of a raw connection — this service's own `auditLog`/`budget` delegate calls need
    // it too, not a new site of its own.
    @InjectRepository(PluginCapabilityAudit) private readonly pluginCapabilityAudit: PluginCapabilityAuditRepository,
  ) {}

  /** PS1 — Hosts an admin has added for a plugin (0 unless it declared operatorEgress). */
  private async egressHostCount(id: string): Promise<number> {
    try {
      return await this.pluginEgressHosts.countForPlugin(id);
    } catch {
      return 0; // table absent (a slimmed test app)
    }
  }

  /** PS2 */
  private async instanceSettingsCount(id: string): Promise<number> {
    try {
      return await this.pluginSettingsFields.countForPluginScope(id, 'instance');
    } catch {
      return 0; // table absent (a slimmed test app)
    }
  }

  /** PS3 */
  private async instanceActionsCount(id: string): Promise<number> {
    try {
      return await this.pluginActions.countForPluginScope(id, 'instance');
    } catch {
      return 0; // table absent (a slimmed test app)
    }
  }

  async list(): Promise<{ enabled: boolean; devLink: boolean; ignoreTrekRange: boolean; plugins: PluginListItem[] }> {
    const rows = (await this.plugins.listForAdmin()) as PluginRawRow[];
    const installed = new Map<string, PluginDepRow>(
      rows.map((r) => [r.id, { id: r.id, version: r.version, enabled: r.enabled, dependencies: r.dependencies }]),
    );
    // A `map` callback cannot await the addon gate, so the projection runs as an
    // explicit loop — same order, same rows.
    const plugins: PluginListItem[] = [];
    for (const r of rows) {
      const deps = parseDependencies(r.dependencies);
      const disabledAddons = await disabledRequiredAddons(deps, (id) => this.addons.isAddonEnabled(id));
      const state = resolveDependencyState(deps, installed);
      // Mirrors the order of assertActivatable's gate, so the card explains the same
      // blocker the activate call would hit rather than a second, lesser one.
      const trekBypass = bypassedRange(r.trek_range);
      const dependencyStatus: PluginDependencyStatus =
        !hostSatisfies(r.trek_range) && !trekBypass
          ? 'hostIncompatible'
          : disabledAddons.length
            ? 'addonDisabled'
            : state.missing.length || state.versionMismatch.length
              ? 'missingPlugin'
              : 'ok';
      const {
        dependencies: _raw,
        operator_egress: _oe,
        trek_range,
        author_pubkey,
        update_block_code,
        update_block_detail,
        update_block_version,
        update_hold,
        ...rest
      } = r as PluginRawRow & { operator_egress?: number };
      plugins.push({
        ...rest,
        operatorEgress: _oe === 1,
        egressHostCount: await this.egressHostCount(r.id),
        instanceSettingsCount: await this.instanceSettingsCount(r.id),
        instanceActionsCount: await this.instanceActionsCount(r.id),
        dependencies: deps,
        dependencyStatus,
        trekRange: trek_range,
        hostVersion: hostVersion(),
        trekRangeBypassed: trekBypass,
        dependencyIssues: { disabledAddons, missing: state.missing, versionMismatch: state.versionMismatch },
        signed: !!author_pubkey,
        keyFingerprint: keyFingerprint(author_pubkey),
        updateBlock: update_block_code
          ? { code: update_block_code, detail: update_block_detail, version: update_block_version }
          : null,
        updateHold: update_hold === 1,
      });
    }
    return { enabled: pluginsEnabled(), devLink: devLinkEnabled(), ignoreTrekRange: trekRangeBypassed(), plugins };
  }

  /**
   * Release a per-plugin update hold (set by a deliberate non-latest install).
   * Returns whether the plugin row existed — the controller answers 404 otherwise.
   */
  async resumeUpdates(id: string): Promise<boolean> {
    return await this.plugins.clearUpdateHold(id);
  }

  /**
   * Merge instance-scope settings into the plugin's config, encrypting fields
   * declared secret (unless the value is the unchanged mask sentinel). Only keys
   * declared as `scope:'instance'` fields are accepted, same as updateUserConfig.
   * Returns the config with secrets masked for the client.
   */
  async updateInstanceConfig(id: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const rowConfig = await this.plugins.findConfig(id);
    if (rowConfig === null) throw new Error(`plugin ${id} not found`);

    const secretKeys = new Set(await this.pluginSettingsFields.listSecretFieldKeys(id, 'instance'));
    const allowed = new Set(await this.pluginSettingsFields.listFieldKeys(id, 'instance'));

    const config = safeParse(rowConfig);
    for (const [k, v] of Object.entries(patch)) {
      if (!allowed.has(k)) continue; // never store an undeclared key
      if (secretKeys.has(k)) {
        if (v === SECRET_MASK) continue; // unchanged secret — keep stored ciphertext
        config[k] = maybe_encrypt_api_key(v);
      } else {
        config[k] = v;
      }
    }
    await this.assertRequiredFilled(id, 'instance', config);
    await this.plugins.setConfig(id, JSON.stringify(config));
    return maskSecrets(config, secretKeys);
  }

  /** The plugin's `scope:'user'` settings fields, in declared order (for the user form). */
  async userSettingsFields(id: string): Promise<PluginSettingsField[]> {
    return await this.settingsFields(id, 'user');
  }

  /** The plugin's `scope:'instance'` settings fields, in declared order (for the ADMIN form). */
  async instanceSettingsFields(id: string): Promise<PluginSettingsField[]> {
    return await this.settingsFields(id, 'instance');
  }

  private async settingsFields(id: string, scope: 'user' | 'instance'): Promise<PluginSettingsField[]> {
    const rows = await this.pluginSettingsFields.listFields(id, scope);
    return rows.map((row) => ({
      key: row.field_key,
      label: row.label,
      input_type: row.input_type,
      placeholder: row.placeholder,
      hint: row.hint,
      required: row.required === 1,
      secret: row.secret === 1,
      default: parseDefaultValue(row.default_value),
      // Stored as manifest-validated JSON ({value,label} pairs) — parse, don't re-check.
      options:
        typeof row.options === 'string' && row.options
          ? (safeArray(row.options) as PluginSettingsField['options'])
          : undefined,
    }));
  }

  private async userSecretKeys(id: string): Promise<Set<string>> {
    return new Set(await this.pluginSettingsFields.listSecretFieldKeys(id, 'user'));
  }

  /** A user's own config for a plugin, secrets masked (safe to send to the client). PS7. */
  async getUserConfig(id: string, userId: number): Promise<Record<string, unknown>> {
    const config = await this.pluginUserConfig.findConfig(id, userId);
    return maskSecrets(safeParse(config ?? '{}'), await this.userSecretKeys(id));
  }

  /** Merge a user's own settings, encrypting secret fields (SECRET_MASK = keep stored
   * ciphertext). Only keys declared as `scope:'user'` fields are accepted. Returns masked. */
  async updateUserConfig(id: string, userId: number, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const allowed = new Set(await this.pluginSettingsFields.listFieldKeys(id, 'user'));
    const secretKeys = await this.userSecretKeys(id);
    // PS9 — the pre-write existence check shares `PluginUserConfigRepository.findConfig`
    // with PS7/PS11 (the triple-duplicate text the brief names explicitly).
    const existingConfig = await this.pluginUserConfig.findConfig(id, userId);
    const config = safeParse(existingConfig ?? '{}');
    for (const [k, v] of Object.entries(patch)) {
      if (!allowed.has(k)) continue; // never store an undeclared key
      if (secretKeys.has(k)) {
        if (v === SECRET_MASK) continue; // unchanged secret — keep stored ciphertext
        config[k] = maybe_encrypt_api_key(v);
      } else {
        config[k] = v;
      }
    }
    await this.assertRequiredFilled(id, 'user', config);
    // PS10 — the composite-key upsert on (plugin_id, user_id).
    await this.pluginUserConfig.upsertConfig(id, userId, JSON.stringify(config));
    return maskSecrets(config, secretKeys);
  }

  /** A user's own config with secrets DECRYPTED — host-only, for runtime `ctx.settings`.
   * Never sent to a client; the acting user is resolved host-side. PS11. */
  async getUserConfigDecrypted(id: string, userId: number): Promise<Record<string, unknown>> {
    const rowConfig = await this.pluginUserConfig.findConfig(id, userId);
    const config = safeParse(rowConfig ?? '{}');
    const secretKeys = await this.userSecretKeys(id);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(config)) out[k] = secretKeys.has(k) && v ? decrypt_api_key(v) : v;
    return out;
  }

  /** A plugin's error log, newest first. */
  async errors(id: string): Promise<Array<{ ts: string; level: string; message: string }>> {
    return await this.pluginErrorLog.listRecent(id);
  }

  async clearErrors(id: string): Promise<void> {
    await this.pluginErrorLog.deleteAllForPlugin(id);
  }

  /** A plugin's hash-chained capability audit log, newest first. */
  async auditLog(id: string): Promise<unknown[]> {
    return await readAudit(this.pluginCapabilityAudit, id);
  }

  /** A plugin's broker budget usage for today (AI + notification counts vs caps). */
  async budget(id: string): ReturnType<typeof pluginBudgetUsage> {
    return await pluginBudgetUsage(id, this.pluginCapabilityAudit);
  }

  /** Read the instance config with secret fields masked. */
  async getInstanceConfig(id: string): Promise<Record<string, unknown>> {
    const rowConfig = await this.plugins.findConfig(id);
    if (rowConfig === null) throw new Error(`plugin ${id} not found`);
    const secretKeys = new Set(await this.pluginSettingsFields.listSecretFieldKeys(id, 'instance'));
    return maskSecrets(safeParse(rowConfig), secretKeys);
  }

  /**
   * `required` used to be a decorative asterisk (PR-87 feedback): the form rendered it, but
   * nothing refused a save. Enforced on the MERGED result so partial patches stay legal and a
   * stored secret (non-empty ciphertext) counts as filled. A `checkbox` is exempt — required
   * would demand `true`, which is a consent flow, not a settings field.
   */
  private async assertRequiredFilled(
    id: string,
    scope: 'instance' | 'user',
    config: Record<string, unknown>,
  ): Promise<void> {
    const required = await this.pluginSettingsFields.listRequiredFieldKeys(id, scope);
    const defaults = await settingDefaults(this.pluginSettingsFields, id, scope);
    for (const fieldKey of required) {
      // The runtime resolves the default too, so it counts as filled here as well.
      if (!isFilled(config[fieldKey] ?? defaults[fieldKey])) throw new MissingRequiredSettingError(fieldKey);
    }
  }
}

function safeArray(json: string): unknown[] | undefined {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

function maskSecrets(config: Record<string, unknown>, secretKeys: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    out[k] = secretKeys.has(k) && v ? SECRET_MASK : v;
  }
  return out;
}
