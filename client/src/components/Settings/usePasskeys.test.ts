// FE-COMP-PASSKEYS-HOOK-001 to -012: the passkey logic the desktop section and the phone card share.
import { act, renderHook, waitFor } from '@testing-library/react';
import { authApi, type PasskeyCredential } from '../../api/client';
import { fmtDate, isWebauthnAbort, usePasskeys } from './usePasskeys';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
const startRegistration = vi.hoisted(() => vi.fn());
vi.mock('@simplewebauthn/browser', () => ({ startRegistration }));

const CRED: PasskeyCredential = {
  id: 1,
  name: 'MacBook',
  device_type: 'multiDevice',
  backed_up: true,
  created_at: '2025-05-01 08:30:00',
  last_used_at: null,
};

function serve(config: { passkey_login?: boolean; passkey_configured?: boolean }, creds: PasskeyCredential[] = [CRED]) {
  vi.spyOn(authApi, 'getAppConfig').mockResolvedValue(config as Awaited<ReturnType<typeof authApi.getAppConfig>>);
  vi.spyOn(authApi.passkey, 'list').mockResolvedValue({ credentials: creds });
}

async function loaded() {
  const hook = renderHook(() => usePasskeys());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('passkey helpers', () => {
  it('FE-COMP-PASSKEYS-HOOK-001: reads a SQLite UTC timestamp and rejects nonsense', () => {
    expect(fmtDate(null)).toBeNull();
    expect(fmtDate('nope')).toBeNull();
    expect(fmtDate('2025-05-01 08:30:00')).toBe(new Date('2025-05-01T08:30:00Z').toLocaleDateString());
    expect(fmtDate('2025-05-01T08:30:00Z')).toBe(new Date('2025-05-01T08:30:00Z').toLocaleDateString());
  });

  it('FE-COMP-PASSKEYS-HOOK-002: only the cancel and abort DOMExceptions count as a cancelled ceremony', () => {
    expect(isWebauthnAbort({ name: 'NotAllowedError' })).toBe(true);
    expect(isWebauthnAbort({ name: 'AbortError' })).toBe(true);
    expect(isWebauthnAbort({ name: 'InvalidStateError' })).toBe(false);
    expect(isWebauthnAbort(null)).toBe(false);
  });
});

describe('usePasskeys', () => {
  it('FE-COMP-PASSKEYS-HOOK-003: loads the instance flags and the credentials', async () => {
    serve({ passkey_login: true, passkey_configured: true });
    const { result } = await loaded();
    expect(result.current.creds).toEqual([CRED]);
    expect(result.current.enabled).toBe(true);
    expect(result.current.canAdd).toBe(true);
    expect(result.current.nothingToShow).toBe(false);
  });

  it('FE-COMP-PASSKEYS-HOOK-004: adding needs the toggle and a usable RP ID', async () => {
    serve({ passkey_login: true, passkey_configured: false });
    const { result } = await loaded();
    await waitFor(() => expect(result.current.enabled).toBe(true));
    expect(result.current.canAdd).toBe(false);
  });

  it('FE-COMP-PASSKEYS-HOOK-005: with the feature off and no credentials there is nothing to show', async () => {
    serve({ passkey_login: false }, []);
    const { result } = await loaded();
    expect(result.current.nothingToShow).toBe(true);
  });

  it('FE-COMP-PASSKEYS-HOOK-006: adding runs the step-up and the ceremony, then resets the form and reloads', async () => {
    serve({ passkey_login: true, passkey_configured: true });
    vi.spyOn(authApi.passkey, 'registerOptions').mockResolvedValue({ challenge: 'c' });
    vi.spyOn(authApi.passkey, 'registerVerify').mockResolvedValue({});
    startRegistration.mockResolvedValue({ id: 'att' });
    const { result } = await loaded();
    act(() => result.current.setAddOpen(true));
    act(() => result.current.setAddPwd('pw'));
    act(() => result.current.setAddName('  Phone  '));
    vi.mocked(authApi.passkey.list).mockClear();
    await act(() => result.current.handleAdd());
    expect(authApi.passkey.registerOptions).toHaveBeenCalledWith('pw');
    expect(startRegistration).toHaveBeenCalledWith({ optionsJSON: { challenge: 'c' } });
    expect(authApi.passkey.registerVerify).toHaveBeenCalledWith({ id: 'att' }, 'Phone');
    expect(toast.success).toHaveBeenCalledWith('settings.passkey.addedToast');
    expect(result.current.addOpen).toBe(false);
    expect(result.current.addPwd).toBe('');
    expect(authApi.passkey.list).toHaveBeenCalledTimes(1);
    expect(result.current.busy).toBe(false);
  });

  it('FE-COMP-PASSKEYS-HOOK-007: a cancelled ceremony and a refused step-up toast differently', async () => {
    serve({ passkey_login: true, passkey_configured: true });
    vi.spyOn(authApi.passkey, 'registerOptions').mockResolvedValue({});
    startRegistration.mockRejectedValueOnce({ name: 'NotAllowedError' });
    const { result } = await loaded();
    await act(() => result.current.handleAdd());
    expect(toast.error).toHaveBeenLastCalledWith('settings.passkey.cancelled');
    vi.mocked(authApi.passkey.registerOptions).mockRejectedValueOnce({
      response: { data: { error: 'Wrong password' } },
    });
    await act(() => result.current.handleAdd());
    expect(toast.error).toHaveBeenLastCalledWith('Wrong password');
  });

  it('FE-COMP-PASSKEYS-HOOK-008: a blank rename just closes the editor, a name is saved trimmed', async () => {
    serve({ passkey_login: true });
    const rename = vi.spyOn(authApi.passkey, 'rename').mockResolvedValue({});
    const { result } = await loaded();
    act(() => result.current.startRename(CRED));
    expect(result.current.renamingId).toBe(1);
    expect(result.current.renameVal).toBe('MacBook');
    act(() => result.current.setRenameVal('   '));
    await act(() => result.current.handleRename(1));
    expect(rename).not.toHaveBeenCalled();
    expect(result.current.renamingId).toBeNull();
    act(() => result.current.startRename(CRED));
    act(() => result.current.setRenameVal(' Work '));
    await act(() => result.current.handleRename(1));
    expect(rename).toHaveBeenCalledWith(1, 'Work');
    expect(result.current.renamingId).toBeNull();
  });

  it('FE-COMP-PASSKEYS-HOOK-009: a failed rename keeps the editor open and toasts', async () => {
    serve({ passkey_login: true });
    vi.spyOn(authApi.passkey, 'rename').mockRejectedValue({});
    const { result } = await loaded();
    act(() => result.current.startRename(CRED));
    await act(() => result.current.handleRename(1));
    expect(result.current.renamingId).toBe(1);
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-COMP-PASSKEYS-HOOK-010: delete sends the step-up password, then closes the confirm and reloads', async () => {
    serve({ passkey_login: true });
    const del = vi.spyOn(authApi.passkey, 'delete').mockResolvedValue({});
    const { result } = await loaded();
    act(() => result.current.startDelete(1));
    expect(result.current.deletingId).toBe(1);
    act(() => result.current.setDeletePwd('pw'));
    await act(() => result.current.handleDelete(1));
    expect(del).toHaveBeenCalledWith(1, 'pw');
    expect(toast.success).toHaveBeenCalledWith('settings.passkey.deleted');
    expect(result.current.deletingId).toBeNull();
    expect(result.current.deletePwd).toBe('');
  });

  it('FE-COMP-PASSKEYS-HOOK-011: the cancel helpers clear their step-up', async () => {
    serve({ passkey_login: true });
    const { result } = await loaded();
    act(() => result.current.startDelete(1));
    act(() => result.current.setDeletePwd('x'));
    act(() => result.current.cancelDelete());
    expect(result.current.deletingId).toBeNull();
    expect(result.current.deletePwd).toBe('');
    act(() => result.current.setAddOpen(true));
    act(() => result.current.setAddPwd('x'));
    act(() => result.current.setAddName('y'));
    act(() => result.current.cancelAdd());
    expect(result.current.addOpen).toBe(false);
    expect(result.current.addPwd).toBe('');
    expect(result.current.addName).toBe('');
  });

  it('FE-COMP-PASSKEYS-HOOK-012: a refused delete toasts the server reason and keeps the confirm open', async () => {
    serve({ passkey_login: true });
    vi.spyOn(authApi.passkey, 'delete').mockRejectedValue({ response: { data: { error: 'Wrong password' } } });
    const { result } = await loaded();
    act(() => result.current.startDelete(1));
    act(() => result.current.setDeletePwd('bad'));
    await act(() => result.current.handleDelete(1));
    expect(toast.error).toHaveBeenCalledWith('Wrong password');
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.deletingId).toBe(1);
    expect(result.current.deletePwd).toBe('bad');
    expect(result.current.busy).toBe(false);
  });

  it('FE-COMP-PASSKEYS-HOOK-013: demo mode hides the view, otherwise it hides only with nothing to show', async () => {
    serve({ passkey_login: true, passkey_configured: true });
    const demo = renderHook(() => usePasskeys({ demoMode: true }));
    await waitFor(() => expect(demo.result.current.loading).toBe(false));
    expect(demo.result.current.hidden).toBe(true);
    expect(demo.result.current.creds).toEqual([CRED]);

    const live = await loaded();
    expect(live.result.current.hidden).toBe(false);

    serve({ passkey_login: false }, []);
    const empty = await loaded();
    expect(empty.result.current.hidden).toBe(true);
  });

  it('FE-COMP-PASSKEYS-HOOK-014: the not configured warning needs the toggle on and no usable RP ID', async () => {
    serve({ passkey_login: true, passkey_configured: false });
    const missing = await loaded();
    await waitFor(() => expect(missing.result.current.enabled).toBe(true));
    expect(missing.result.current.notConfigured).toBe(true);

    serve({ passkey_login: true, passkey_configured: true });
    const ready = await loaded();
    await waitFor(() => expect(ready.result.current.configured).toBe(true));
    expect(ready.result.current.notConfigured).toBe(false);

    serve({ passkey_login: false, passkey_configured: false });
    const off = await loaded();
    expect(off.result.current.notConfigured).toBe(false);
  });
});
