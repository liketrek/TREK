// FE-COMP-ACCOUNT-APPS-001 to FE-COMP-ACCOUNT-APPS-002
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { buildSettings, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { render, screen } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { isNativeApp } from '../../native/platform';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import AccountTab from './AccountTab';

vi.mock('../../sync/syncTriggers', () => ({ registerSyncTriggers: vi.fn(), unregisterSyncTriggers: vi.fn() }));
vi.mock('../../native/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../native/platform')>()),
  isNativeApp: vi.fn(() => false),
}));

beforeEach(() => {
  resetAllStores();
  server.use(http.get('/api/auth/app-config', () => HttpResponse.json({ version: '5.2.1', mfa_enabled: false })));
  seedStore(useAuthStore, { user: buildUser({ username: 'testuser', role: 'user' }), isAuthenticated: true });
  seedStore(useSettingsStore, { settings: buildSettings() });
});

describe('AccountTab app stores', () => {
  it('FE-COMP-ACCOUNT-APPS-001: in a browser it offers both app stores with their QR codes', () => {
    render(<AccountTab />);
    expect(screen.getByText('TREK app')).toBeInTheDocument();
    expect(screen.getByText('Scan a code with your phone, then connect the app to this server.')).toBeInTheDocument();
    expect(document.querySelectorAll('a.asc-card')).toHaveLength(2);
  });

  it('FE-COMP-ACCOUNT-APPS-002: inside the app itself there is nothing to download', () => {
    vi.mocked(isNativeApp).mockReturnValue(true);
    render(<AccountTab />);
    expect(screen.queryByText('TREK app')).toBeNull();
    expect(document.querySelector('a.asc-card')).toBeNull();
    vi.mocked(isNativeApp).mockReturnValue(false);
  });
});
