import type { PluginActionsRepository } from '../../../db/repositories/PluginActions.repository';
import type { PluginErrorLogRepository } from '../../../db/repositories/PluginErrorLog.repository';
import type { PluginSettingsFieldsRepository } from '../../../db/repositories/PluginSettingsFields.repository';
import type { PluginsRepository } from '../../../db/repositories/Plugins.repository';
import type { UnitOfWork } from '../../database/unit-of-work';
import { devLinkEnabled } from '../dev-link';
import { pluginsCodeRoot, pluginCodeDir } from '../paths';
import { parseJsonText, parseManifest, type PluginManifest } from './manifest';
import { scanForNativeBinaries } from './native-scan';

import fs from 'node:fs';
import path from 'node:path';

/** `discoverPlugins`/`upsert`'s repository set — "swap the parameter type" (plan3j-inputs.md
 * §0): the raw `BetterSqlite3.Database` parameter becomes this bundle of the four
 * repositories the scan actually writes through, plus the `UnitOfWork` `upsert`
 * uses to make its own delete-then-reinsert pairs (DI5–DI8, Plan 4 Task 8a)
 * atomic. Required (Plan 4 Task 4 — `PluginRuntimeService`'s own `uow` is no
 * longer `@Optional()` either): `upsert` always wraps the pair in
 * `uow.transactional`, never falls back to an un-transacted sequential run. */
export interface DiscoveryRepos {
  plugins: PluginsRepository;
  actions: PluginActionsRepository;
  settingsFields: PluginSettingsFieldsRepository;
  errorLog: PluginErrorLogRepository;
  uow: UnitOfWork;
}

/**
 * Discover plugins placed on the /plugins volume (#plugins, M4, "install from
 * disk"). Reads each subdir's trek-plugin.json and upserts a registry row as
 * INACTIVE — an existing plugin keeps its status / granted permissions / config,
 * so re-discovery never silently re-activates or wipes settings. A plugin whose
 * manifest is invalid or that ships native binaries is skipped (recorded to its
 * error log if it already existed).
 */
export async function discoverPlugins(repos: DiscoveryRepos): Promise<{ discovered: string[]; skipped: string[] }> {
  const root = pluginsCodeRoot();
  const discovered: string[] = [];
  const skipped: string[] = [];
  if (!fs.existsSync(root)) return { discovered, skipped };

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    // A dev-linked plugin is `<root>/<id>` as a symlink (POSIX) / junction (Windows)
    // pointing at the author's build dir — follow it so it discovers like a real dir.
    // stat() resolves the link; a dangling/broken link throws and is skipped.
    let isDir = entry.isDirectory();
    const full = path.join(root, entry.name);
    if (!isDir && entry.isSymbolicLink()) {
      // A dev-link symlink only loads in dev-link mode; a stale link left on the
      // volume must not be discovered/registered on a normal (non-dev) boot.
      if (!devLinkEnabled()) continue;
      try {
        isDir = fs.statSync(full).isDirectory();
      } catch {
        isDir = false;
      }
    } else if (isDir && !devLinkEnabled()) {
      // On Windows a dev-link is a junction, which Dirent reports as a plain
      // directory (isSymbolicLink() is false). Detect it the same way: if the
      // entry resolves outside the plugins volume it is a link, so skip it
      // unless dev-link mode is on. A normal dir realpaths back to itself.
      try {
        if (fs.realpathSync(full) !== path.join(fs.realpathSync(root), entry.name)) continue;
      } catch {
        /* unreadable target — leave as a normal dir and let discovery fail loudly */
      }
    }
    if (!isDir) continue;
    const dir = pluginCodeDir(entry.name);
    const manifestPath = path.join(dir, 'trek-plugin.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = parseManifest(parseJsonText(fs.readFileSync(manifestPath, 'utf8')));
      if (manifest.id !== entry.name) throw new Error(`manifest id "${manifest.id}" != directory "${entry.name}"`);
      if (scanForNativeBinaries(dir).length) throw new Error('directory contains native binaries');
      await upsert(repos, manifest);
      discovered.push(manifest.id);
    } catch (e) {
      skipped.push(entry.name);
      const msg = e instanceof Error ? e.message : 'invalid plugin';
      await repos.errorLog.insertLog(entry.name, 'error', `discovery: ${msg}`);
    }
  }
  return { discovered, skipped };
}

async function upsert(repos: DiscoveryRepos, m: PluginManifest): Promise<void> {
  const dependencies = JSON.stringify({ requiredAddons: m.requiredAddons, pluginDependencies: m.pluginDependencies });
  const manifestRow = {
    name: m.name,
    description: m.description ?? null,
    type: m.type,
    icon: m.icon ?? 'Blocks',
    version: m.version,
    api_version: m.apiVersion,
    min_trek_version: m.minTrekVersion ?? null,
    trek_range: m.trekRange,
    permissions: JSON.stringify(m.permissions),
    capabilities: JSON.stringify(m.capabilities),
    dependencies,
    operator_egress: m.operatorEgress ? 1 : 0,
  };
  const existing = await repos.plugins.existsById(m.id);
  if (existing) {
    await repos.plugins.updateManifestFields(m.id, manifestRow);
  } else {
    await repos.plugins.insertManifest({ id: m.id, ...manifestRow });
  }

  // Refresh the settings-page action and settings-field descriptors from the
  // manifest. DI5–DI8 (Plan 4 Task 8a — a deliberate behaviour change, named
  // for the user): each pair used to run its own delete then its own
  // re-insert with no transaction spanning them, so a crash between the two
  // (of either pair) left that plugin with an EMPTY actions or settings-field
  // set until the next discovery run, rather than its previous (still valid)
  // rows. Wrapped in one `uow.transactional` so a discovery refresh for a
  // single plugin's descriptors is all-or-nothing: either both pairs land
  // or neither does, and the plugin keeps its prior rows on any failure.
  const refreshDescriptors = async (): Promise<void> => {
    await repos.actions.deleteAllForPlugin(m.id);
    await repos.actions.insertActions(
      m.id,
      m.actions.map((a, i) => ({
        action_key: a.key,
        label: a.label,
        hint: a.hint ?? null,
        danger: a.danger ? 1 : 0,
        scope: a.scope,
        sort_order: i,
      })),
    );

    await repos.settingsFields.deleteAllForPlugin(m.id);
    await repos.settingsFields.insertFields(
      m.id,
      m.settings.map((f, i) => ({
        field_key: f.key,
        label: f.label ?? f.key,
        input_type: f.input_type ?? 'text',
        placeholder: f.placeholder ?? null,
        hint: f.hint ?? null,
        required: f.required ? 1 : 0,
        secret: f.secret ? 1 : 0,
        scope: f.scope ?? 'instance',
        options: f.options ? JSON.stringify(f.options) : null,
        oauth_config: f.oauth ? JSON.stringify(f.oauth) : null,
        default_value: f.default === undefined ? null : JSON.stringify(f.default),
        sort_order: i,
      })),
    );
  };
  await repos.uow.transactional(refreshDescriptors);
}
