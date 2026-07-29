// FE-MOB-SETINT-001 onwards
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { useAddonStore } from '../../../../src/store/addonStore';
import MSettingsIntegrations from '../../../../src/mobile/screens/settings/MSettingsIntegrations';

// The four sections are covered by their own suites — stub them so this file
// only exercises the addon gating and the initial loadAddons call.
vi.mock('../../../../src/mobile/screens/settings/MPhotoProvidersSection', () => ({
  default: () => <div data-testid="photo-providers" />,
}));
vi.mock('../../../../src/mobile/screens/settings/MAirTrailConnectionSection', () => ({
  default: () => <div data-testid="airtrail" />,
}));
vi.mock('../../../../src/mobile/screens/settings/MLlmConnectionSection', () => ({
  default: () => <div data-testid="llm" />,
}));
vi.mock('../../../../src/mobile/screens/settings/MSettingsMcp', () => ({
  default: () => <div data-testid="mcp" />,
}));

function seedAddons(ids: string[], loadAddons = vi.fn().mockResolvedValue(undefined)) {
  seedStore(useAddonStore, {
    addons: ids.map((id) => ({ id, name: id, type: 'integration', icon: '', enabled: true })),
    loaded: true,
    loadAddons,
  });
  return loadAddons;
}

describe('MSettingsIntegrations', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('FE-MOB-SETINT-001: only the photo providers render when no integration addon is on', () => {
    seedAddons([]);
    render(<MSettingsIntegrations />);

    expect(screen.getByTestId('photo-providers')).toBeInTheDocument();
    expect(screen.queryByTestId('airtrail')).not.toBeInTheDocument();
    expect(screen.queryByTestId('llm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mcp')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETINT-002: the airtrail addon reveals the AirTrail connection section', () => {
    seedAddons(['airtrail']);
    render(<MSettingsIntegrations />);

    expect(screen.getByTestId('airtrail')).toBeInTheDocument();
    expect(screen.queryByTestId('llm')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETINT-003: the llm_parsing addon reveals the AI connection section', () => {
    seedAddons(['llm_parsing']);
    render(<MSettingsIntegrations />);

    expect(screen.getByTestId('llm')).toBeInTheDocument();
    expect(screen.queryByTestId('airtrail')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETINT-004: the mcp addon reveals the MCP configuration', () => {
    seedAddons(['mcp']);
    render(<MSettingsIntegrations />);

    expect(screen.getByTestId('mcp')).toBeInTheDocument();
  });

  it('FE-MOB-SETINT-005: all three sections render together when every addon is on', () => {
    seedAddons(['airtrail', 'llm_parsing', 'mcp']);
    render(<MSettingsIntegrations />);

    expect(screen.getByTestId('airtrail')).toBeInTheDocument();
    expect(screen.getByTestId('llm')).toBeInTheDocument();
    expect(screen.getByTestId('mcp')).toBeInTheDocument();
  });

  it('FE-MOB-SETINT-006: a disabled addon row does not unlock its section', () => {
    seedStore(useAddonStore, {
      addons: [{ id: 'mcp', name: 'MCP', type: 'integration', icon: '', enabled: false }],
      loaded: true,
      loadAddons: vi.fn().mockResolvedValue(undefined),
    });
    render(<MSettingsIntegrations />);

    expect(screen.queryByTestId('mcp')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETINT-007: the addon list is refreshed once on mount', () => {
    const loadAddons = seedAddons([]);
    const { rerender } = render(<MSettingsIntegrations />);
    rerender(<MSettingsIntegrations />);

    expect(loadAddons).toHaveBeenCalledTimes(1);
  });
});
