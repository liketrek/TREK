// FE-COMP-INTEGRATION-GATES-001 to -004: which integrations the settings shells offer.
import { renderHook } from '@testing-library/react';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAddonStore } from '../../store/addonStore';
import { useAuthStore } from '../../store/authStore';
import { useIntegrationGates } from './useIntegrationGates';

function seedAddons(enabled: string[]) {
  const loadAddons = vi.fn().mockResolvedValue(undefined);
  seedStore(useAddonStore, { isEnabled: (id: string) => enabled.includes(id), loadAddons });
  return loadAddons;
}

beforeEach(() => {
  resetAllStores();
});

describe('useIntegrationGates', () => {
  it('FE-COMP-INTEGRATION-GATES-001: maps each addon to its flag', () => {
    seedAddons(['mcp', 'llm_parsing']);
    const { result } = renderHook(() => useIntegrationGates({ reloadAddons: false }));
    expect(result.current).toMatchObject({
      memoriesEnabled: false,
      mcpEnabled: true,
      airtrailEnabled: false,
      llmEnabled: true,
      dawarichEnabled: false,
      hasIntegrations: true,
    });
  });

  it('FE-COMP-INTEGRATION-GATES-002: any one integration addon opens the tab, none keeps it closed', () => {
    for (const id of ['memories', 'mcp', 'airtrail', 'llm_parsing', 'dawarich']) {
      seedAddons([id]);
      expect(renderHook(() => useIntegrationGates({ reloadAddons: false })).result.current.hasIntegrations).toBe(true);
    }
    seedAddons(['vacay', 'atlas']);
    expect(renderHook(() => useIntegrationGates({ reloadAddons: false })).result.current.hasIntegrations).toBe(false);
  });

  it('FE-COMP-INTEGRATION-GATES-003: reports a managed install', () => {
    seedAddons([]);
    seedStore(useAuthStore, { managed: true });
    expect(renderHook(() => useIntegrationGates({ reloadAddons: false })).result.current.managed).toBe(true);
  });

  it('FE-COMP-INTEGRATION-GATES-004: reloads the addon list on mount only when asked to', () => {
    const quiet = seedAddons([]);
    renderHook(() => useIntegrationGates({ reloadAddons: false }));
    expect(quiet).not.toHaveBeenCalled();
    const loud = seedAddons([]);
    renderHook(() => useIntegrationGates({ reloadAddons: true }));
    expect(loud).toHaveBeenCalledTimes(1);
  });
});
