// FE-MOB-SET-NAV-001 onwards
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { usePluginStore } from '../../../../src/store/pluginStore';
import MSettings from '../../../../src/mobile/screens/settings/MSettings';

describe('MSettings', () => {
  beforeEach(() => {
    resetAllStores();
    seedStore(useSettingsStore, { settings: buildSettings({ language: 'en' }) });
    usePluginStore.setState({ plugins: [], loaded: true });
  });

  it('FE-MOB-SET-NAV-001: opens on General with the section switcher pill', () => {
    render(<MSettings />, { initialEntries: ['/settings'] });

    expect(screen.getByRole('button', { name: /General/ })).toBeInTheDocument();
    expect(screen.getByText('Language & region')).toBeInTheDocument();
  });

  it('FE-MOB-SET-NAV-002: the dropdown lists the sections and switches on tap', async () => {
    const user = userEvent.setup();
    render(<MSettings />, { initialEntries: ['/settings'] });

    await user.click(screen.getByRole('button', { name: /General/ }));
    expect(screen.getByRole('button', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    // Pill now shows the active section; the General card is gone.
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
    expect(screen.queryByText('Language & region')).not.toBeInTheDocument();
  });
});
