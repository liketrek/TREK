// FE-MOB-SET-NAV-001 onwards
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildSettings } from '../../../helpers/factories';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { usePluginStore } from '../../../../src/store/pluginStore';
import MSettings from '../../../../src/mobile/screens/settings/MSettings';
import * as platform from '../../../../src/native/platform';

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

  it('FE-MOB-SET-NAV-003: the sections stand under "Your account" and "This device", with Offline on the device', async () => {
    const user = userEvent.setup();
    render(<MSettings />, { initialEntries: ['/settings'] });

    await user.click(screen.getByRole('button', { name: /General/ }));
    const account = screen.getByText('Your account');
    const device = screen.getByText('This device');
    const offline = screen.getByRole('button', { name: 'Offline' });
    const accountRow = screen.getByRole('button', { name: 'Account' });
    // Account settings first, then what stays on this device.
    expect(account.compareDocumentPosition(accountRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(accountRow.compareDocumentPosition(device) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(device.compareDocumentPosition(offline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The app's own section exists only in the app.
    expect(screen.queryByRole('button', { name: 'App' })).not.toBeInTheDocument();
  });

  it('FE-MOB-SET-NAV-004: in the app, "App" joins This device', async () => {
    const native = vi.spyOn(platform, 'isNativeApp').mockReturnValue(true);
    try {
      const user = userEvent.setup();
      render(<MSettings />, { initialEntries: ['/settings'] });

      await user.click(screen.getByRole('button', { name: /General/ }));
      const device = screen.getByText('This device');
      const app = screen.getByRole('button', { name: 'App' });
      expect(device.compareDocumentPosition(app) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    } finally {
      native.mockRestore();
    }
  });
});
