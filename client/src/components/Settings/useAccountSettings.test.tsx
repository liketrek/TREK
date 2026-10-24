// FE-COMP-ACCOUNT-HOOK-001 to -016: the account settings logic the desktop tab and the phone screen share.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { buildUser } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { adminApi, authApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { MFA_BACKUP_SESSION_KEY, stripTrailingSlashes, useAccountSettings } from './useAccountSettings';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigate };
});

const STRONG = 'Correct-Horse-9-Battery';

function seedAuth(over: Record<string, unknown> = {}) {
  const store = {
    user: buildUser({ username: 'ann', email: 'ann@example.com', role: 'user', mfa_enabled: false }),
    demoMode: false,
    appRequireMfa: false,
    updateProfile: vi.fn().mockResolvedValue(undefined),
    uploadAvatar: vi.fn().mockResolvedValue({}),
    deleteAvatar: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    loadUser: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
  seedStore(useAuthStore, store);
  return store;
}

function render(opts: { desktop?: boolean; url?: string } = {}) {
  const desktop = opts.desktop ?? true;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[opts.url ?? '/settings']}>{children}</MemoryRouter>
  );
  return renderHook(
    () =>
      useAccountSettings({
        avatarRemoveErrorKey: desktop ? 'settings.avatarError' : 'settings.avatarRemoveError',
        ignoreEmptyBackupCodes: desktop,
      }),
    { wrapper }
  );
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.spyOn(authApi, 'getAppConfig').mockResolvedValue({} as Awaited<ReturnType<typeof authApi.getAppConfig>>);
});
afterEach(() => vi.restoreAllMocks());

describe('stripTrailingSlashes', () => {
  it('FE-COMP-ACCOUNT-HOOK-001: drops every trailing slash and nothing else', () => {
    expect(stripTrailingSlashes('id.example.com///')).toBe('id.example.com');
    expect(stripTrailingSlashes('a/b')).toBe('a/b');
    expect(stripTrailingSlashes('///')).toBe('');
  });
});

describe('useAccountSettings', () => {
  it('FE-COMP-ACCOUNT-HOOK-002: fills the profile from the user and follows it', async () => {
    seedAuth();
    const { result } = render();
    expect(result.current.username).toBe('ann');
    expect(result.current.email).toBe('ann@example.com');
    act(() => useAuthStore.setState({ user: buildUser({ username: 'bob', email: 'b@x.io' }) }));
    await waitFor(() => expect(result.current.username).toBe('bob'));
    expect(result.current.email).toBe('b@x.io');
  });

  it('FE-COMP-ACCOUNT-HOOK-003: an OIDC only instance hides the password change', async () => {
    seedAuth();
    vi.mocked(authApi.getAppConfig).mockResolvedValue({ oidc_only_mode: true } as Awaited<
      ReturnType<typeof authApi.getAppConfig>
    >);
    const { result } = render();
    await waitFor(() => expect(result.current.oidcOnlyMode).toBe(true));
  });

  it('FE-COMP-ACCOUNT-HOOK-004: MFA is required by the URL or the instance policy, never in demo mode', () => {
    seedAuth();
    expect(render({ url: '/settings?mfa=required' }).result.current.mfaRequiredByPolicy).toBe(true);
    seedAuth({ appRequireMfa: true });
    expect(render().result.current.mfaRequiredByPolicy).toBe(true);
    seedAuth({ appRequireMfa: true, demoMode: true });
    expect(render().result.current.mfaRequiredByPolicy).toBe(false);
  });

  it('FE-COMP-ACCOUNT-HOOK-005: saving the profile toasts success, or the error message', async () => {
    const store = seedAuth();
    const { result } = render();
    act(() => result.current.setUsername('ann2'));
    await act(() => result.current.saveProfile());
    expect(store.updateProfile).toHaveBeenCalledWith({ username: 'ann2', email: 'ann@example.com' });
    expect(toast.success).toHaveBeenCalledWith('settings.toast.profileSaved');
    store.updateProfile.mockRejectedValueOnce(new Error('Taken'));
    await act(() => result.current.saveProfile());
    expect(toast.error).toHaveBeenCalledWith('Taken');
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-ACCOUNT-HOOK-006: the password change checks each field before it sends anything', async () => {
    seedAuth();
    const change = vi.spyOn(authApi, 'changePassword').mockResolvedValue({});
    const { result } = render();
    await act(() => result.current.changePassword());
    expect(toast.error).toHaveBeenLastCalledWith('settings.currentPasswordRequired');
    act(() => result.current.setCurrentPassword('old'));
    await act(() => result.current.changePassword());
    expect(toast.error).toHaveBeenLastCalledWith('settings.passwordRequired');
    act(() => result.current.setNewPassword(STRONG));
    act(() => result.current.setConfirmPassword('other'));
    await act(() => result.current.changePassword());
    expect(toast.error).toHaveBeenLastCalledWith('settings.passwordMismatch');
    expect(change).not.toHaveBeenCalled();
  });

  it('FE-COMP-ACCOUNT-HOOK-007: a valid password change sends, clears the fields and reloads the user', async () => {
    const store = seedAuth();
    const change = vi.spyOn(authApi, 'changePassword').mockResolvedValue({});
    const { result } = render();
    act(() => result.current.setCurrentPassword('old'));
    act(() => result.current.setNewPassword(STRONG));
    act(() => result.current.setConfirmPassword(STRONG));
    await act(() => result.current.changePassword());
    expect(change).toHaveBeenCalledWith({ current_password: 'old', new_password: STRONG });
    expect(toast.success).toHaveBeenCalledWith('settings.passwordChanged');
    expect(result.current.currentPassword).toBe('');
    expect(result.current.newPassword).toBe('');
    expect(store.loadUser).toHaveBeenCalledWith({ silent: true });
  });

  it('FE-COMP-ACCOUNT-HOOK-008: MFA setup shows the QR and secret, cancel clears them', async () => {
    seedAuth();
    vi.spyOn(authApi, 'mfaSetup').mockResolvedValue({ qr_svg: '<svg/>', secret: 'SECRET' });
    const { result } = render();
    await act(() => result.current.startMfaSetup());
    expect(result.current.mfaQr).toBe('<svg/>');
    expect(result.current.mfaSecret).toBe('SECRET');
    expect(result.current.mfaLoading).toBe(false);
    act(() => result.current.cancelMfaSetup());
    expect(result.current.mfaQr).toBeNull();
    expect(result.current.mfaSecret).toBeNull();
  });

  it('FE-COMP-ACCOUNT-HOOK-009: enabling MFA keeps the backup codes for the session and reloads the user', async () => {
    const store = seedAuth();
    vi.spyOn(authApi, 'mfaEnable').mockResolvedValue({ success: true, mfa_enabled: true, backup_codes: ['a1', 'b2'] });
    const { result } = render();
    act(() => result.current.setMfaSetupCode('123456'));
    await act(() => result.current.enableMfa());
    expect(authApi.mfaEnable).toHaveBeenCalledWith({ code: '123456' });
    expect(result.current.backupCodes).toEqual(['a1', 'b2']);
    expect(result.current.backupCodesText).toBe('a1\nb2');
    expect(sessionStorage.getItem(MFA_BACKUP_SESSION_KEY)).toBe('["a1","b2"]');
    expect(store.loadUser).toHaveBeenCalledWith({ silent: true });
    act(() => result.current.dismissBackupCodes());
    expect(result.current.backupCodes).toBeNull();
    expect(sessionStorage.getItem(MFA_BACKUP_SESSION_KEY)).toBeNull();
  });

  it('FE-COMP-ACCOUNT-HOOK-010: pending backup codes come back from the session once MFA is on', async () => {
    sessionStorage.setItem(MFA_BACKUP_SESSION_KEY, '["x9"]');
    seedAuth({ user: buildUser({ mfa_enabled: true }) });
    const { result } = render();
    await waitFor(() => expect(result.current.backupCodes).toEqual(['x9']));
  });

  it('FE-COMP-ACCOUNT-HOOK-011: disabling MFA sends password and code and forgets the codes', async () => {
    seedAuth({ user: buildUser({ mfa_enabled: true }) });
    sessionStorage.setItem(MFA_BACKUP_SESSION_KEY, '["x9"]');
    vi.spyOn(authApi, 'mfaDisable').mockResolvedValue({});
    const { result } = render();
    act(() => result.current.setMfaDisablePwd('pw'));
    act(() => result.current.setMfaDisableCode('654321'));
    await act(() => result.current.disableMfa());
    expect(authApi.mfaDisable).toHaveBeenCalledWith({ password: 'pw', code: '654321' });
    expect(toast.success).toHaveBeenCalledWith('settings.mfa.toastDisabled');
    expect(sessionStorage.getItem(MFA_BACKUP_SESSION_KEY)).toBeNull();
  });

  it('FE-COMP-ACCOUNT-HOOK-012: a failed avatar removal names the error each shell asks for', async () => {
    seedAuth({ deleteAvatar: vi.fn().mockRejectedValue(new Error('x')) });
    const desktop = render({ desktop: true });
    await act(() => desktop.result.current.handleAvatarRemove());
    expect(toast.error).toHaveBeenLastCalledWith('settings.avatarError');
    const phone = render({ desktop: false });
    await act(() => phone.result.current.handleAvatarRemove());
    expect(toast.error).toHaveBeenLastCalledWith('settings.avatarRemoveError');
  });

  it('FE-COMP-ACCOUNT-HOOK-013: the last admin is blocked from deleting, others reach the confirm', async () => {
    seedAuth({ user: buildUser({ role: 'admin' }) });
    vi.spyOn(adminApi, 'stats').mockResolvedValue({});
    const users = vi.spyOn(adminApi, 'users').mockResolvedValue({ users: [{ role: 'admin' }, { role: 'user' }] });
    const { result } = render();
    await act(() => result.current.requestDelete());
    expect(result.current.showDeleteConfirm).toBe('blocked');
    users.mockResolvedValue({ users: [{ role: 'admin' }, { role: 'admin' }] });
    await act(() => result.current.requestDelete());
    expect(result.current.showDeleteConfirm).toBe(true);
  });

  it('FE-COMP-ACCOUNT-HOOK-014: deleting the account logs out and leaves for the login page', async () => {
    const store = seedAuth();
    vi.spyOn(authApi, 'deleteOwnAccount').mockResolvedValue({});
    const { result } = render();
    await act(() => result.current.deleteAccount());
    expect(store.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login', { state: { noRedirect: true } });
  });

  it('FE-COMP-ACCOUNT-HOOK-015: with codes, copy, download and print hand over the code text', async () => {
    sessionStorage.setItem(MFA_BACKUP_SESSION_KEY, '["a1","b<2"]');
    seedAuth({ user: buildUser({ mfa_enabled: true }) });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true });
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:codes');
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const printWindow = {
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    };
    const open = vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);
    const { result } = render({ desktop: true });
    await waitFor(() => expect(result.current.backupCodesText).toBe('a1\nb<2'));

    await act(() => result.current.copyBackupCodes());
    expect(writeText).toHaveBeenCalledWith('a1\nb<2');
    expect(toast.success).toHaveBeenCalledWith('settings.mfa.backupCopied');
    writeText.mockRejectedValueOnce(new Error('denied'));
    await act(() => result.current.copyBackupCodes());
    expect(toast.error).toHaveBeenCalledWith('common.error');

    act(() => result.current.downloadBackupCodes());
    expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeUrl).toHaveBeenCalledWith('blob:codes');

    act(() => result.current.printBackupCodes());
    expect(open).toHaveBeenCalledWith('', '_blank', 'width=900,height=700');
    expect(printWindow.document.write).toHaveBeenCalledWith(expect.stringContaining('<pre>a1\nb&lt;2</pre>'));
    expect(printWindow.print).toHaveBeenCalled();
  });

  it('FE-COMP-ACCOUNT-HOOK-016: without codes the desktop skips the code actions, the phone still runs them', async () => {
    seedAuth();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true });
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:codes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    const desktop = render({ desktop: true }).result;
    expect(desktop.current.backupCodesText).toBe('');
    await act(() => desktop.current.copyBackupCodes());
    act(() => desktop.current.downloadBackupCodes());
    act(() => desktop.current.printBackupCodes());
    expect(writeText).not.toHaveBeenCalled();
    expect(createUrl).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();

    const phone = render({ desktop: false }).result;
    await act(() => phone.current.copyBackupCodes());
    act(() => phone.current.downloadBackupCodes());
    act(() => phone.current.printBackupCodes());
    expect(writeText).toHaveBeenCalledWith('');
    expect(toast.success).toHaveBeenCalledWith('settings.mfa.backupCopied');
    expect(createUrl).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
