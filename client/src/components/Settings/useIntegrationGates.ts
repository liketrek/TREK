import { useEffect } from 'react';
import { useAddonStore } from '../../store/addonStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

/**
 * Which integrations the settings shells offer: the addon flags behind each
 * integration section, whether any of them is on, and whether this is a managed
 * install. The desktop Integrations tab shows regardless, since its API keys need
 * no addon; the mobile one has no API keys and only shows when `hasIntegrations`.
 * With `reloadAddons` the addon list is fetched again on mount, as the
 * integrations tab on both shells does.
 */
export function useIntegrationGates({ reloadAddons }: { reloadAddons: boolean }) {
  const { isEnabled: addonEnabled, loadAddons } = useAddonStore();
  const managed = useAuthStore((s) => s.managed);

  const memoriesEnabled = addonEnabled('memories');
  const mcpEnabled = addonEnabled('mcp');
  const airtrailEnabled = addonEnabled('airtrail');
  const llmEnabled = addonEnabled('llm_parsing');
  const aiAssistantEnabled = addonEnabled('ai_assistant');
  const dawarichEnabled = addonEnabled('dawarich');
  // The wanderer connection feeds the Tours workspace, while the admin allows it there.
  const wandererEnabled = useAddonStore((s) => s.toursWanderer);
  // The AI connection serves the assistant and AI parsing alike.
  const aiConnectionEnabled = aiAssistantEnabled || llmEnabled;
  // A personal parsing model saved before parsing read with the AI connection;
  // its form stays for whoever has one, and is no longer offered to anyone else.
  const ownParsing = useSettingsStore((s) => !!(s.settings.llm_provider && s.settings.llm_model));
  const hasIntegrations =
    memoriesEnabled || mcpEnabled || airtrailEnabled || llmEnabled || aiAssistantEnabled || dawarichEnabled;

  useEffect(() => {
    if (reloadAddons) loadAddons();
  }, [loadAddons, reloadAddons]);

  return {
    memoriesEnabled,
    mcpEnabled,
    airtrailEnabled,
    llmEnabled,
    aiAssistantEnabled,
    aiConnectionEnabled,
    ownParsing,
    dawarichEnabled,
    wandererEnabled,
    hasIntegrations,
    managed,
    loadAddons,
  };
}
