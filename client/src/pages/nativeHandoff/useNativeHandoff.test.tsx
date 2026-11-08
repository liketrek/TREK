// FE-NATIVE-HANDOFF-001 to FE-NATIVE-HANDOFF-011
import { startAuthentication } from '@simplewebauthn/browser';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import { authApi } from '../../api/client';
import { rememberHandoffReturn, requestHandoffCode } from '../../native/browserSignIn';
import { useAuthStore } from '../../store/authStore';
import { useNativeHandoff } from './useNativeHandoff';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('../../native/browserSignIn', () => ({
  HANDOFF_PATH: '/native-handoff',
  rememberHandoffReturn: vi.fn(),
  requestHandoffCode: vi.fn(),
}));

vi.mock('@simplewebauthn/browser', () => ({ startAuthentication: vi.fn() }));
vi.mock('../../api/client', () => ({
  authApi: { passkey: { loginOptions: vi.fn(), loginVerify: vi.fn() } },
}));

const challenge = 'ab'.repeat(32);
const realLocation = window.location;
const logout = vi.fn(async () => {});

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { ...realLocation, search, href: 'http://localhost/native-handoff' + search, replace: vi.fn() },
  });
}

function renderHandoff() {
  return renderHook(() => useNativeHandoff(), {
    wrapper: ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>,
  });
}

beforeEach(() => {
  resetAllStores();
  mockNavigate.mockClear();
  logout.mockClear();
  vi.mocked(requestHandoffCode).mockReset();
  sessionStorage.clear();
  setSearch(`?challenge=${challenge}`);
  useAuthStore.setState({
    isLoading: false,
    isAuthenticated: true,
    user: { id: 1, username: 'maria' } as never,
    logout,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: realLocation });
});

describe('useNativeHandoff', () => {
  it('FE-NATIVE-HANDOFF-001: is ready for a signed-in user with a valid challenge', () => {
    const { result } = renderHandoff();
    expect(result.current.valid).toBe(true);
    expect(result.current.ready).toBe(true);
    expect(result.current.userName).toBe('maria');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('FE-NATIVE-HANDOFF-002: rejects a malformed challenge and does nothing with it', () => {
    setSearch('?challenge=nope');
    useAuthStore.setState({ isAuthenticated: false });
    const { result } = renderHandoff();
    expect(result.current.valid).toBe(false);
    expect(result.current.ready).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('FE-NATIVE-HANDOFF-003: sends a visitor to the login page and back here afterwards', () => {
    useAuthStore.setState({ isAuthenticated: false });
    renderHandoff();
    expect(mockNavigate).toHaveBeenCalledWith(
      `/login?redirect=${encodeURIComponent(`/native-handoff?challenge=${challenge}`)}`,
      { replace: true }
    );
  });

  it('FE-NATIVE-HANDOFF-004: starts SSO straight away when the app asked for it, without looping', () => {
    setSearch(`?challenge=${challenge}&start=oidc`);
    useAuthStore.setState({ isAuthenticated: false });
    renderHandoff();
    expect(window.location.replace).toHaveBeenCalledWith('/api/auth/oidc/login?remember=1');
    expect(sessionStorage.getItem('oidc_redirect')).toBe(`/native-handoff?challenge=${challenge}`);
    expect(rememberHandoffReturn).toHaveBeenCalledWith(`/native-handoff?challenge=${challenge}`);
  });

  it('FE-NATIVE-HANDOFF-005: waits while the session is still being checked', () => {
    useAuthStore.setState({ isAuthenticated: false, isLoading: true });
    const { result } = renderHandoff();
    expect(result.current.ready).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('FE-NATIVE-HANDOFF-006: only mints the code on the tap, then hands it to the app scheme', async () => {
    vi.mocked(requestHandoffCode).mockResolvedValue('c/1');
    const { result } = renderHandoff();
    expect(requestHandoffCode).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.openApp();
    });

    expect(requestHandoffCode).toHaveBeenCalledWith(challenge);
    expect(window.location.href).toBe('com.liketrek.trek://auth?code=c%2F1');
  });

  it('FE-NATIVE-HANDOFF-007: reports a failed hand-off', async () => {
    vi.mocked(requestHandoffCode).mockRejectedValue(new Error('401'));
    const { result } = renderHandoff();
    await act(async () => {
      await result.current.openApp();
    });
    expect(result.current.status).toBe('failed');
  });

  it('FE-NATIVE-HANDOFF-008: lets the user switch accounts and come back', async () => {
    const { result } = renderHandoff();
    await act(async () => {
      await result.current.switchAccount();
    });
    expect(logout).toHaveBeenCalled();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        `/login?redirect=${encodeURIComponent(`/native-handoff?challenge=${challenge}`)}`,
        { replace: true }
      )
    );
  });

  describe('when the app asked for a passkey', () => {
    const loadUser = vi.fn(async () => {
      useAuthStore.setState({ isAuthenticated: true });
    });

    beforeEach(() => {
      setSearch(`?challenge=${challenge}&start=passkey`);
      useAuthStore.setState({ isAuthenticated: false, loadUser });
      loadUser.mockClear();
      vi.mocked(authApi.passkey.loginOptions).mockReset().mockResolvedValue({ challenge: 'x' });
      vi.mocked(authApi.passkey.loginVerify).mockReset().mockResolvedValue({ token: '', user: {} });
      vi.mocked(startAuthentication)
        .mockReset()
        .mockResolvedValue({ id: 'cred' } as never);
    });

    it('FE-NATIVE-HANDOFF-009: asks for the passkey itself instead of sending the user to the login', () => {
      const { result } = renderHandoff();
      expect(result.current.passkeyStep).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('FE-NATIVE-HANDOFF-010: signs in with the passkey and goes straight back to the app', async () => {
      vi.mocked(requestHandoffCode).mockResolvedValue('c1');
      const { result } = renderHandoff();
      await act(async () => {
        await result.current.continueWithPasskey();
      });
      expect(authApi.passkey.loginVerify).toHaveBeenCalledWith({ id: 'cred' });
      expect(loadUser).toHaveBeenCalled();
      expect(requestHandoffCode).toHaveBeenCalledWith(challenge);
      expect(window.location.href).toBe('com.liketrek.trek://auth?code=c1');
    });

    it('FE-NATIVE-HANDOFF-011: stays quiet when the prompt is dismissed and offers the full login on request', async () => {
      vi.mocked(startAuthentication).mockRejectedValue(Object.assign(new Error('no'), { name: 'NotAllowedError' }));
      const { result } = renderHandoff();
      await act(async () => {
        await result.current.continueWithPasskey();
      });
      expect(result.current.status).toBe('idle');
      expect(requestHandoffCode).not.toHaveBeenCalled();

      act(() => result.current.otherSignIn());
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          `/login?redirect=${encodeURIComponent(`/native-handoff?challenge=${challenge}`)}`,
          { replace: true }
        )
      );
    });
  });
});
