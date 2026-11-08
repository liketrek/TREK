import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { HANDOFF_PATH, rememberHandoffReturn, requestHandoffCode, signInWithPasskey } from '../../native/browserSignIn';
import { APP_URL_SCHEME } from '../../native/trekShell';
import { useAuthStore } from '../../store/authStore';

const CHALLENGE = /^[0-9a-f]{64}$/;

/**
 * The system-browser end of the app's sign-in (see native/browserSignIn.ts).
 * Signs the user in here if needed, then hands the session to the app only
 * after an explicit tap: a link to this page with somebody else's challenge
 * must not be able to pass a session on silently.
 */
export function useNativeHandoff() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, userName, logout, loadUser } = useAuthStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      isLoading: s.isLoading,
      userName: s.user?.username ?? '',
      logout: s.logout,
      loadUser: s.loadUser,
    }))
  );
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const challenge = params.get('challenge') ?? '';
  const valid = CHALLENGE.test(challenge);
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle');
  // The app asked for a passkey: this page asks for it itself instead of showing
  // the whole login a second time, until the user picks another way to sign in.
  const [passkeyStep, setPasskeyStep] = useState(() => params.get('start') === 'passkey');

  // Back here once signed in, without `start`, so an SSO round trip cannot loop.
  const returnPath = `${HANDOFF_PATH}?challenge=${challenge}`;

  useEffect(() => {
    if (!valid || isLoading || isAuthenticated || passkeyStep) return;
    if (params.get('start') === 'oidc') {
      sessionStorage.setItem('oidc_redirect', returnPath);
      rememberHandoffReturn(returnPath);
      window.location.replace('/api/auth/oidc/login?remember=1');
      return;
    }
    void navigate(`/login?redirect=${encodeURIComponent(returnPath)}`, { replace: true });
  }, [valid, isLoading, isAuthenticated, passkeyStep, params, returnPath, navigate]);

  const openApp = async (): Promise<void> => {
    setStatus('sending');
    try {
      const code = await requestHandoffCode(challenge);
      window.location.href = `${APP_URL_SCHEME}://auth?code=${encodeURIComponent(code)}`;
    } catch {
      setStatus('failed');
    }
  };

  /**
   * The passkey prompt, then straight back to the app: the tap that started it
   * is the explicit consent the handoff asks for, so no second page follows.
   */
  const continueWithPasskey = async (): Promise<void> => {
    setStatus('sending');
    try {
      await signInWithPasskey();
      await loadUser({ silent: true });
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name;
      setStatus(name === 'NotAllowedError' || name === 'AbortError' ? 'idle' : 'failed');
      return;
    }
    await openApp();
  };

  const otherSignIn = (): void => {
    setStatus('idle');
    setPasskeyStep(false);
  };

  const switchAccount = async (): Promise<void> => {
    await logout();
    void navigate(`/login?redirect=${encodeURIComponent(returnPath)}`, { replace: true });
  };

  return {
    valid,
    passkeyStep: valid && !isLoading && !isAuthenticated && passkeyStep,
    continueWithPasskey,
    otherSignIn,
    ready: valid && !isLoading && isAuthenticated,
    userName,
    status,
    openApp,
    switchAccount,
  };
}
