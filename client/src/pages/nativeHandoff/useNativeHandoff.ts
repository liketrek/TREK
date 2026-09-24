import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../../store/authStore'
import { nativeAuthApi } from '../../api/nativeAuth'
import { APP_URL_SCHEME } from '../../native/trekShell'
import { HANDOFF_PATH } from '../../native/browserSignIn'

const CHALLENGE = /^[0-9a-f]{64}$/

/**
 * The system-browser end of the app's sign-in (see native/browserSignIn.ts).
 * Signs the user in here if needed, then hands the session to the app only
 * after an explicit tap: a link to this page with somebody else's challenge
 * must not be able to pass a session on silently.
 */
export function useNativeHandoff() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, userName, logout } = useAuthStore(useShallow((s) => ({
    isAuthenticated: s.isAuthenticated,
    isLoading: s.isLoading,
    userName: s.user?.username ?? '',
    logout: s.logout,
  })))
  const [params] = useState(() => new URLSearchParams(window.location.search))
  const challenge = params.get('challenge') ?? ''
  const valid = CHALLENGE.test(challenge)
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle')

  // Back here once signed in, without `start`, so an SSO round trip cannot loop.
  const returnPath = `${HANDOFF_PATH}?challenge=${challenge}`

  useEffect(() => {
    if (!valid || isLoading || isAuthenticated) return
    if (params.get('start') === 'oidc') {
      sessionStorage.setItem('oidc_redirect', returnPath)
      window.location.replace('/api/auth/oidc/login?remember=1')
      return
    }
    navigate(`/login?redirect=${encodeURIComponent(returnPath)}`, { replace: true })
  }, [valid, isLoading, isAuthenticated, params, returnPath, navigate])

  const openApp = async (): Promise<void> => {
    setStatus('sending')
    try {
      const { code } = await nativeAuthApi.handoff(challenge)
      window.location.href = `${APP_URL_SCHEME}://auth?code=${encodeURIComponent(code)}`
    } catch {
      setStatus('failed')
    }
  }

  const switchAccount = async (): Promise<void> => {
    await logout()
    navigate(`/login?redirect=${encodeURIComponent(returnPath)}`, { replace: true })
  }

  return {
    valid,
    ready: valid && !isLoading && isAuthenticated,
    userName,
    status,
    openApp,
    switchAccount,
  }
}
