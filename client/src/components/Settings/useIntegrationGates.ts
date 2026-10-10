import { useEffect } from 'react';
import { useAddonStore } from '../../store/addonStore';
import { useAuthStore } from '../../store/authStore';

/**
 * Which integrations the settings shells offer: the addon flags behind each
 * integration section, whether any of them is on (the Integrations tab only shows
 * then), and whether this is a managed install. With `reloadAddons` the addon list
 * is fetched again on mount, as the integrations tab on both shells does.
 */
export function useIntegrationGates({ reloadAddons }: { reloadAddons: boolean }) {
  const { isEnabled: addonEnabled, loadAddons } = useAddonStore();
  const managed = useAuthStore((s) => s.managed);

  const memoriesEnabled = addonEnabled('memories');
  const mcpEnabled = addonEnabled('mcp');
  const airtrailEnabled = addonEnabled('airtrail');
  const llmEnabled = addonEnabled('llm_parsing');
  const dawarichEnabled = addonEnabled('dawarich');
  const hasIntegrations = memoriesEnabled || mcpEnabled || airtrailEnabled || llmEnabled || dawarichEnabled;

  useEffect(() => {
    if (reloadAddons) loadAddons();
  }, [loadAddons, reloadAddons]);

  return {
    memoriesEnabled,
    mcpEnabled,
    airtrailEnabled,
    llmEnabled,
    dawarichEnabled,
    hasIntegrations,
    managed,
    loadAddons,
  };
}
