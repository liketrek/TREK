// FE-ADMIN-PLUGIN-MODEL-001 to -014: the pure plugin helpers both admin shells share.
import {
  blockIsCurrent,
  dependencyRows,
  deriveDeps,
  errBody,
  filterInstalled,
  filterRegistry,
  fingerprint,
  formatCompactCount,
  installOffer,
  isNewer,
  isRegistrySourced,
  isUpdateAvailable,
  parseJson,
  signatureBlockView,
  sortLabel,
  statusLabel,
  type PluginRow,
  type RegistryItem,
} from './pluginModel';

const t = (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key);

function row(over: Partial<PluginRow> = {}): PluginRow {
  return {
    id: 'alpha',
    name: 'Alpha',
    description: null,
    type: 'widget',
    icon: null,
    version: '1.0.0',
    status: 'active',
    enabled: 1,
    last_error: null,
    reviewed_at: null,
    source_repo: 'org/alpha',
    permissions: '[]',
    capabilities: '{}',
    ...over,
  };
}

function item(over: Partial<RegistryItem> = {}): RegistryItem {
  return {
    id: 'alpha',
    name: 'Alpha',
    author: 'someone',
    description: 'does things',
    repo: 'org/alpha',
    type: 'widget',
    latest: '1.0.0',
    minTrekVersion: null,
    reviewedAt: null,
    screenshotUrl: null,
    ...over,
  };
}

describe('pluginModel', () => {
  it('FE-ADMIN-PLUGIN-MODEL-001: isNewer compares three numeric parts and ranks a release over its prerelease', () => {
    expect(isNewer('1.2.0', '1.1.9')).toBe(true);
    expect(isNewer('1.10.0', '1.9.0')).toBe(true);
    expect(isNewer('1.0.0', '1.0.0')).toBe(false);
    expect(isNewer('1.0.0', '1.0.0-beta.1')).toBe(true);
    expect(isNewer('1.0.0-beta.1', '1.0.0')).toBe(false);
  });

  it('FE-ADMIN-PLUGIN-MODEL-002: parseJson falls back on null, empty and broken input', () => {
    expect(parseJson('["a"]', [])).toEqual(['a']);
    expect(parseJson(null, ['x'])).toEqual(['x']);
    expect(parseJson('null', ['x'])).toEqual(['x']);
    expect(parseJson('{oops', {})).toEqual({});
  });

  it('FE-ADMIN-PLUGIN-MODEL-003: errBody reads the server envelope and tolerates anything else', () => {
    expect(errBody({ response: { data: { error: 'nope', code: 'X' } } })).toEqual({ error: 'nope', code: 'X' });
    expect(errBody(new Error('boom'))).toEqual({});
    expect(errBody(undefined)).toEqual({});
  });

  it('FE-ADMIN-PLUGIN-MODEL-004: only registry plugins count as registry sourced', () => {
    expect(isRegistrySourced('org/alpha')).toBe(true);
    expect(isRegistrySourced('local:upload')).toBe(false);
    expect(isRegistrySourced('local:link')).toBe(false);
    expect(isRegistrySourced(null)).toBe(false);
  });

  it('FE-ADMIN-PLUGIN-MODEL-005: an update block stands until the registry offers something else', () => {
    const blocked = row({ updateBlock: { code: 'SIGNATURE_INVALID', detail: null, version: '1.1.0' } });
    expect(blockIsCurrent(row(), '1.1.0')).toBe(false);
    expect(blockIsCurrent(blocked, '1.1.0')).toBe(true);
    expect(blockIsCurrent(blocked, undefined)).toBe(true);
    expect(blockIsCurrent(blocked, '1.2.0')).toBe(false);
    expect(blockIsCurrent({ ...blocked, source_repo: 'local:upload' }, '1.1.0')).toBe(false);
  });

  it('FE-ADMIN-PLUGIN-MODEL-006: formatCompactCount and fingerprint shorten for display', () => {
    expect(formatCompactCount(999)).toBe('999');
    expect(formatCompactCount(1234)).toBe('1.2k');
    expect(formatCompactCount(999_950)).toBe('1M');
    expect(fingerprint(null)).toBeNull();
    expect(fingerprint('untrusted comment: key\nshort')).toBe('short');
    expect(fingerprint('untrusted comment: key\nABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe('ABCDEFGH…STUVWXYZ');
  });

  it('FE-ADMIN-PLUGIN-MODEL-007: installOffer installs, falls back to a compatible version, or refuses', () => {
    expect(installOffer(item(), t)).toEqual({ blocked: false, label: 'admin.plugins.install' });
    const incompatible = item({ compatible: false, trek: '>=9', hostVersion: '4.0.0' });
    expect(installOffer({ ...incompatible, latestCompatible: '0.9.0' }, t)).toMatchObject({
      blocked: false,
      version: '0.9.0',
    });
    expect(installOffer(incompatible, t)).toMatchObject({ blocked: true, label: 'admin.plugins.incompatible' });
    expect(installOffer(incompatible, t, true)).toMatchObject({ blocked: false, label: 'admin.plugins.installAnyway' });
  });

  it('FE-ADMIN-PLUGIN-MODEL-008: deriveDeps marks the blockers among the declared dependencies', () => {
    const chips = deriveDeps(
      row({
        dependencyStatus: 'hostIncompatible',
        trekRange: '>=9',
        hostVersion: '4.0.0',
        dependencies: { requiredAddons: ['budget'], pluginDependencies: [{ id: 'beta', version: '^1' }] },
        dependencyIssues: { disabledAddons: ['budget'], missing: [], versionMismatch: [] },
      }),
      t
    );
    expect(chips.map((c) => c.blocked)).toEqual([true, true, false]);
    expect(chips[2]!.label).toBe('admin.plugins.cap.dependsOn {"id":"beta","version":"^1"}');
  });

  it('FE-ADMIN-PLUGIN-MODEL-009: a held plugin or an older offer is no update', () => {
    const latest = { alpha: '1.1.0' };
    expect(isUpdateAvailable(row(), latest)).toBe(true);
    expect(isUpdateAvailable(row({ updateHold: true }), latest)).toBe(false);
    expect(isUpdateAvailable(row({ version: '1.1.0' }), latest)).toBe(false);
    expect(isUpdateAvailable(row(), {})).toBe(false);
  });

  it('FE-ADMIN-PLUGIN-MODEL-010: filterInstalled searches, filters by status and puts updates first', () => {
    const plugins = [
      row({ id: 'c', name: 'Charlie', enabled: 0 }),
      row({ id: 'b', name: 'Bravo', description: 'maps' }),
      row({ id: 'a', name: 'Alpha', status: 'error' }),
    ];
    const base = { q: '', typeFilter: 'all' as const, statusFilter: 'all' as const, sort: 'name' as const };
    expect(filterInstalled(plugins, base, {}).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(filterInstalled(plugins, { ...base, q: 'MAPS' }, {}).map((p) => p.id)).toEqual(['b']);
    expect(filterInstalled(plugins, { ...base, statusFilter: 'on' }, {}).map((p) => p.id)).toEqual(['b']);
    expect(filterInstalled(plugins, { ...base, statusFilter: 'off' }, {}).map((p) => p.id)).toEqual(['c']);
    expect(filterInstalled(plugins, { ...base, statusFilter: 'err' }, {}).map((p) => p.id)).toEqual(['a']);
    expect(filterInstalled(plugins, { ...base, sort: 'updates' }, { c: '2.0.0' }).map((p) => p.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('FE-ADMIN-PLUGIN-MODEL-011: filterRegistry searches, filters by type and sorts', () => {
    expect(filterRegistry(null, { q: '', typeFilter: 'all', sort: 'name' })).toBeNull();
    const items = [
      item({ id: 'b', name: 'Bravo', downloadCount: 5, reviewedAt: '2026-01-01' }),
      item({ id: 'a', name: 'Alpha', type: 'page', downloadCount: 50, reviewedAt: '2025-01-01' }),
    ];
    expect(filterRegistry(items, { q: '', typeFilter: 'all', sort: 'name' })!.map((i) => i.id)).toEqual(['a', 'b']);
    expect(filterRegistry(items, { q: '', typeFilter: 'all', sort: 'downloads' })!.map((i) => i.id)).toEqual([
      'a',
      'b',
    ]);
    expect(filterRegistry(items, { q: '', typeFilter: 'all', sort: 'recent' })!.map((i) => i.id)).toEqual(['b', 'a']);
    expect(filterRegistry(items, { q: '', typeFilter: 'page', sort: 'name' })!.map((i) => i.id)).toEqual(['a']);
    expect(filterRegistry(items, { q: 'BRAV', typeFilter: 'all', sort: 'name' })!.map((i) => i.id)).toEqual(['b']);
  });

  it('FE-ADMIN-PLUGIN-MODEL-012: signatureBlockView offers a re-trust only for a rotated key it can send', () => {
    const entry = item({ authorPublicKey: 'KEY', latest: '2.0.0' });
    expect(signatureBlockView('SIGNATURE_KEY_CHANGED', entry)).toEqual({
      canRetrust: true,
      newKey: 'KEY',
      retrust: { newKey: 'KEY', version: '2.0.0' },
      bodyKey: 'admin.plugins.sig.keyChangedBody',
    });
    expect(signatureBlockView('SIGNATURE_KEY_CHANGED', undefined).retrust).toBeNull();
    expect(signatureBlockView('SIGNATURE_MISSING', entry)).toMatchObject({
      canRetrust: false,
      retrust: null,
      bodyKey: 'admin.plugins.sig.missingBody',
    });
    expect(signatureBlockView('SIGNATURE_INCOMPLETE', entry).bodyKey).toBe('admin.plugins.sig.incompleteBody');
    expect(signatureBlockView('SIGNATURE_INVALID', entry).bodyKey).toBe('admin.plugins.sig.invalidBody');
  });

  it('FE-ADMIN-PLUGIN-MODEL-013: dependencyRows lists the missing dependencies before the outdated ones', () => {
    expect(
      dependencyRows({
        missing: [{ id: 'a', version: '^1' }],
        versionMismatch: [{ id: 'b', wanted: '^2', installed: '1.0.0' }],
      })
    ).toEqual([
      { id: 'a', constraint: '^1' },
      { id: 'b', constraint: '^2', installed: '1.0.0' },
    ]);
  });

  it('FE-ADMIN-PLUGIN-MODEL-014: statusLabel and sortLabel name each choice', () => {
    expect(statusLabel('all', t)).toBe('admin.plugins.allStatuses');
    expect(statusLabel('err', t)).toBe('admin.plugins.status.error');
    expect(sortLabel('downloads', t)).toBe('admin.plugins.sortDownloads');
    expect(sortLabel('updates', t)).toBe('admin.plugins.sortUpdates');
  });
});
