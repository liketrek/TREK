/**
 * Pure dependency-reasoning helpers (#plugins). Parsing, addon/plugin gating,
 * dependent lookup, and cycle-safe enable ordering.
 */
import { describe, it, expect } from 'vitest';
import {
  parseDependencies,
  disabledRequiredAddons,
  resolveDependencyState,
  findDependents,
  findDependentsTransitive,
  enableOrder,
  DependencyCycleError,
  type PluginDepRow,
} from '../../../src/nest/plugins/dependencies';

const row = (id: string, opts: Partial<PluginDepRow> & { deps?: { requiredAddons?: string[]; pluginDependencies?: { id: string; version: string }[] } } = {}): PluginDepRow => ({
  id,
  version: opts.version ?? '1.0.0',
  enabled: opts.enabled ?? 0,
  dependencies: opts.deps ? JSON.stringify({ requiredAddons: opts.deps.requiredAddons ?? [], pluginDependencies: opts.deps.pluginDependencies ?? [] }) : (opts.dependencies ?? '{}'),
});
const map = (...rows: PluginDepRow[]) => new Map(rows.map((r) => [r.id, r]));

describe('parseDependencies', () => {
  it('returns empty lists for null/garbage/legacy blobs', () => {
    expect(parseDependencies(null)).toEqual({ requiredAddons: [], pluginDependencies: [] });
    expect(parseDependencies('not json')).toEqual({ requiredAddons: [], pluginDependencies: [] });
    expect(parseDependencies('{}')).toEqual({ requiredAddons: [], pluginDependencies: [] });
  });
  it('filters non-string addons and malformed deps', () => {
    const d = parseDependencies(JSON.stringify({ requiredAddons: ['budget', 5], pluginDependencies: [{ id: 'koffi', version: '^1' }, { id: 'x' }] }));
    expect(d.requiredAddons).toEqual(['budget']);
    expect(d.pluginDependencies).toEqual([{ id: 'koffi', version: '^1' }]);
  });
});

describe('disabledRequiredAddons', () => {
  it('lists only the disabled required addons', () => {
    const deps = parseDependencies(JSON.stringify({ requiredAddons: ['budget', 'journey'], pluginDependencies: [] }));
    expect(disabledRequiredAddons(deps, (a) => a === 'budget')).toEqual(['journey']);
    expect(disabledRequiredAddons(deps, () => true)).toEqual([]);
  });
});

describe('resolveDependencyState', () => {
  const deps = parseDependencies(JSON.stringify({ requiredAddons: [], pluginDependencies: [{ id: 'a', version: '>=1.0.0' }, { id: 'b', version: '^2.0.0' }, { id: 'c', version: '^1.0.0' }] }));
  it('classifies missing / mismatch / satisfied (active + disabled)', () => {
    const installed = map(
      row('a', { version: '1.5.0', enabled: 1 }), // satisfied + active
      row('b', { version: '1.0.0', enabled: 0 }), // installed but ^2 not satisfied → mismatch
      // c missing
    );
    const s = resolveDependencyState(deps, installed);
    expect(s.satisfiedActive).toEqual(['a']);
    expect(s.versionMismatch).toEqual([{ id: 'b', wanted: '^2.0.0', installed: '1.0.0' }]);
    expect(s.missing.map((m) => m.id)).toEqual(['c']);
    expect(s.satisfiedDisabled).toEqual([]);
  });
  it('reports a satisfied-but-disabled dep as an auto-enable candidate', () => {
    const s = resolveDependencyState(parseDependencies(JSON.stringify({ requiredAddons: [], pluginDependencies: [{ id: 'a', version: '^1.0.0' }] })), map(row('a', { version: '1.2.0', enabled: 0 })));
    expect(s.satisfiedDisabled).toEqual(['a']);
  });
});

describe('findDependents', () => {
  it('finds direct + transitive dependents', () => {
    const rows = [
      row('base'),
      row('mid', { deps: { pluginDependencies: [{ id: 'base', version: '*' }] } }),
      row('top', { deps: { pluginDependencies: [{ id: 'mid', version: '*' }] } }),
      row('unrelated'),
    ];
    expect(findDependents('base', rows)).toEqual(['mid']);
    expect(findDependentsTransitive('base', rows).sort()).toEqual(['mid', 'top']);
  });
});

describe('enableOrder', () => {
  it('orders dependencies before dependents', () => {
    const installed = map(
      row('base'),
      row('mid', { deps: { pluginDependencies: [{ id: 'base', version: '*' }] } }),
      row('top', { deps: { pluginDependencies: [{ id: 'mid', version: '*' }] } }),
    );
    expect(enableOrder(['top'], installed)).toEqual(['base', 'mid', 'top']);
  });
  it('ignores edges to uninstalled deps', () => {
    const installed = map(row('top', { deps: { pluginDependencies: [{ id: 'ghost', version: '*' }] } }));
    expect(enableOrder(['top'], installed)).toEqual(['top']);
  });
  it('dedupes across multiple roots', () => {
    const installed = map(
      row('base'),
      row('a', { deps: { pluginDependencies: [{ id: 'base', version: '*' }] } }),
      row('b', { deps: { pluginDependencies: [{ id: 'base', version: '*' }] } }),
    );
    expect(enableOrder(['a', 'b'], installed)).toEqual(['base', 'a', 'b']);
  });
  it('throws DependencyCycleError on a cycle', () => {
    const installed = map(
      row('a', { deps: { pluginDependencies: [{ id: 'b', version: '*' }] } }),
      row('b', { deps: { pluginDependencies: [{ id: 'a', version: '*' }] } }),
    );
    expect(() => enableOrder(['a'], installed)).toThrow(DependencyCycleError);
  });
});
