// FE-PAGE-RESET-001 to FE-PAGE-RESET-011
import { act, renderHook, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { authApi } from '../../api/client';
import { useResetPassword } from './useResetPassword';

const navigate = vi.fn();
let search = new URLSearchParams('token=abc123');

vi.mock('react-router', () => ({
  useNavigate: () => navigate,
  useSearchParams: () => [search],
}));

// The hook resolves its copy through the real translation context; the page
// renders it verbatim, so assertions go against the English strings.
vi.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent;

/** Fills both password fields and submits. */
async function submit(result: { current: ReturnType<typeof useResetPassword> }, pw: string, pw2 = pw) {
  act(() => { result.current.setPw(pw); result.current.setPw2(pw2); });
  await act(() => result.current.handleSubmit(submitEvent()));
}

beforeEach(() => {
  navigate.mockClear();
  search = new URLSearchParams('token=abc123');
  vi.spyOn(authApi, 'resetPassword').mockResolvedValue({ success: true } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useResetPassword', () => {
  it('FE-PAGE-RESET-001: picks the token out of the query string', () => {
    const { result } = renderHook(() => useResetPassword());

    expect(result.current.token).toBe('abc123');
    expect(result.current.error).toBe('');
    expect(result.current.success).toBe(false);
  });

  it('FE-PAGE-RESET-002: complains immediately when the link carries no token', async () => {
    search = new URLSearchParams();
    const { result } = renderHook(() => useResetPassword());

    await waitFor(() => expect(result.current.error).toBe('login.resetPasswordInvalidLink'));
  });

  it('FE-PAGE-RESET-003: refuses to submit without a token', async () => {
    search = new URLSearchParams();
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'longenough1');
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it('FE-PAGE-RESET-004: rejects a password shorter than eight characters', async () => {
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'short1');
    expect(result.current.error).toBe('login.passwordMinLength');
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it('FE-PAGE-RESET-005: rejects a mismatched confirmation', async () => {
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'longenough1', 'longenough2');
    expect(result.current.error).toBe('login.passwordsDontMatch');
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it('FE-PAGE-RESET-006: sends token and password and reports success', async () => {
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'longenough1');

    expect(authApi.resetPassword).toHaveBeenCalledWith({ token: 'abc123', new_password: 'longenough1' });
    expect(result.current.success).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-PAGE-RESET-007: switches to the MFA step-up when the server asks for a code', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({ mfa_required: true } as never);
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'longenough1');

    expect(result.current.mfaRequired).toBe(true);
    expect(result.current.success).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-PAGE-RESET-008: sends the trimmed MFA code on the second attempt', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({ mfa_required: true } as never);
    const { result } = renderHook(() => useResetPassword());
    await submit(result, 'longenough1');

    act(() => result.current.setMfaCode('  123456  '));
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(authApi.resetPassword).toHaveBeenLastCalledWith({
      token: 'abc123', new_password: 'longenough1', mfa_code: '123456',
    });
    expect(result.current.success).toBe(true);
  });

  it('FE-PAGE-RESET-009: omits the MFA field while the code is still empty', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({ mfa_required: true } as never);
    const { result } = renderHook(() => useResetPassword());
    await submit(result, 'longenough1');

    await act(() => result.current.handleSubmit(submitEvent()));
    expect(authApi.resetPassword).toHaveBeenLastCalledWith({ token: 'abc123', new_password: 'longenough1' });
  });

  it('FE-PAGE-RESET-010: surfaces the server error message', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValueOnce({
      response: { data: { error: 'This link has expired' } },
    });
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'longenough1');

    expect(result.current.error).toBe('This link has expired');
    expect(result.current.success).toBe(false);
  });

  it('FE-PAGE-RESET-011: surfaces a plain Error message as-is', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValueOnce(new Error('Network Error'));
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'longenough1');
    expect(result.current.error).toBe('Network Error');
  });

  it('FE-PAGE-RESET-011a: falls back to the generic copy for a throw without a message', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValueOnce('nope');
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'longenough1');
    expect(result.current.error).toBe('login.resetPasswordFailed');
  });

  it('FE-PAGE-RESET-012: leaves success off when the server neither succeeds nor asks for MFA', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({ success: false } as never);
    const { result } = renderHook(() => useResetPassword());

    await submit(result, 'longenough1');
    expect(result.current.success).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-PAGE-RESET-013: ignores a second submit while one is in flight', async () => {
    let release: (() => void) | undefined;
    vi.mocked(authApi.resetPassword).mockReturnValue(
      new Promise(res => { release = () => res({ success: true } as never); }) as never,
    );

    const { result } = renderHook(() => useResetPassword());
    act(() => { result.current.setPw('longenough1'); result.current.setPw2('longenough1'); });

    let first: Promise<void>;
    act(() => { first = result.current.handleSubmit(submitEvent()) as Promise<void>; });
    expect(result.current.isLoading).toBe(true);

    await act(() => result.current.handleSubmit(submitEvent()));
    expect(authApi.resetPassword).toHaveBeenCalledTimes(1);

    await act(async () => { release!(); await first; });
    expect(result.current.success).toBe(true);
  });

  it('FE-PAGE-RESET-014: exposes the password visibility toggle', () => {
    const { result } = renderHook(() => useResetPassword());

    expect(result.current.showPw).toBe(false);
    act(() => result.current.setShowPw(true));
    expect(result.current.showPw).toBe(true);
  });
});
