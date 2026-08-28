import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore, hasStoredLanguage } from '../../store/settingsStore'
import { useTranslation, detectBrowserLanguage } from '../../i18n'
import { startAuthentication } from '@simplewebauthn/browser'
import { wasSignedOut } from '../../utils/signedOut'
import { authApi, configApi } from '../../api/client'
import { getApiErrorMessage } from '../../types'
import { START_DESTINATION_ROUTE } from '../../utils/startDestination'

interface AppConfig {
  has_users: boolean
  allow_registration: boolean
  setup_complete: boolean
  managed?: boolean
  demo_mode: boolean
  oidc_configured: boolean
  oidc_display_name?: string
  oidc_only_mode: boolean
  password_login: boolean
  password_registration: boolean
  oidc_login: boolean
  oidc_registration: boolean
  passkey_login?: boolean
  passkey_configured?: boolean
  env_override_oidc_only: boolean
}

/**
 * Login data hook — owns the whole auth surface: login/register/demo, the MFA
 * step-up, the must-change-password step, the OIDC code exchange + error
 * handling, the app-config probe (with cache fallback) and the language
 * detection chain. LoginPage is a pure wiring container that renders what this
 * returns. Behaviour is identical to the previous in-component logic.
 */
export function useLogin() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  // Set when the server signals it just issued a Secure cookie over plain HTTP —
  // the browser drops it, so we explain the fix instead of a bare 401 later.
  const [insecureCookie, setInsecureCookie] = useState(false)
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null)
  const [inviteToken, setInviteToken] = useState<string>('')
  const [inviteValid, setInviteValid] = useState<boolean>(false)
  const exchangeInitiated = useRef(false)

  const [langDropdownOpen, setLangDropdownOpen] = useState<boolean>(false)

  const [showTakeoff, setShowTakeoff] = useState<boolean>(false)
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [passwordChangeStep, setPasswordChangeStep] = useState(false)
  const [savedLoginPassword, setSavedLoginPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { login, register, demoLogin, completeMfaLogin, loadUser } = useAuthStore()
  const { setLanguageLocal, setLanguageTransient, loadSettings } = useSettingsStore()
  const navigate = useNavigate()
  const location = useLocation()
  // Location state alone is not enough: a deliberate sign-out loses it to
  // ProtectedRoute's stateless <Navigate replace>, and to any full document
  // load. The per-tab marker survives both — see utils/signedOut (#2123).
  const noRedirect = !!(location.state as { noRedirect?: boolean } | null)?.noRedirect || wasSignedOut()

  const redirectTarget = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    // Only allow relative paths starting with / to prevent open redirect attacks
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.startsWith('/\\')) {
      return redirect
    }
    // No page to return to: hand the choice to RootRedirect, which is the one
    // place that knows whether this user starts on the dashboard or in a trip.
    return START_DESTINATION_ROUTE
  }, [])

  useEffect(() => {
    if (redirectTarget !== START_DESTINATION_ROUTE) {
      sessionStorage.setItem('oidc_redirect', redirectTarget)
    }
  }, [redirectTarget])

  /**
   * Start the takeoff animation, and spend those 2.6 seconds fetching the
   * settings instead of letting them sit idle. Whoever we hand over to then
   * already has them — which matters for the startup destination, decided the
   * moment we navigate, and otherwise racing this exact request.
   */
  const takeOff = (): void => {
    setShowTakeoff(true)
    loadSettings()
    setTimeout(() => navigate(redirectTarget), 2600)
  }

  useEffect(() => {
    // Hoisted out of the `oidcCode` branch below (#2126). An exchange in flight
    // owns this page, but it strips `oidc_code` from the URL before it navigates
    // away — so while it waits on /api/auth/me and IndexedDB, a re-run of this
    // effect read an empty search, fell past the branch that used to hold the
    // guard, and reached the auto-redirect at the bottom. That bounced to the
    // IdP, which answered silently, which landed back here: the loop the
    // reporter saw flashing. Guarding on the ref alone closes it whatever
    // re-triggers the effect.
    if (exchangeInitiated.current) return

    const params = new URLSearchParams(window.location.search)

    const invite = params.get('invite')
    const oidcCode = params.get('oidc_code')
    const oidcError = params.get('oidc_error')

    if (invite) {
      setInviteToken(invite)
      setMode('register')
      authApi.validateInvite(invite).then(() => {
        setInviteValid(true)
      }).catch(() => {
        setError(t('login.invalidInviteLink'))
      })
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (oidcCode) {
      exchangeInitiated.current = true
      setIsLoading(true)
      fetch('/api/auth/oidc/exchange?code=' + encodeURIComponent(oidcCode), { credentials: 'include' })
        .then(r => r.json())
        .then(async data => {
          window.history.replaceState({}, '', '/login')
          if (data.token) {
            await loadUser()
            const savedRedirect = sessionStorage.getItem('oidc_redirect') || START_DESTINATION_ROUTE
            sessionStorage.removeItem('oidc_redirect')
            navigate(savedRedirect, { replace: true })
          } else {
            setError(data.error || t('login.oidcFailed'))
          }
        })
        .catch(() => {
          window.history.replaceState({}, '', '/login')
          setError(t('login.oidcFailed'))
        })
        .finally(() => setIsLoading(false))
      return
    }

    if (oidcError) {
      const errorMessages: Record<string, string> = {
        registration_disabled: t('login.oidc.registrationDisabled'),
        no_email: t('login.oidc.noEmail'),
        token_failed: t('login.oidc.tokenFailed'),
        invalid_state: t('login.oidc.invalidState'),
      }
      setError(errorMessages[oidcError] || oidcError)
      sessionStorage.removeItem('oidc_redirect')
      window.history.replaceState({}, '', '/login')
      return
    }

    const CONFIG_CACHE_KEY = 'trek_app_config_cache'
    authApi.getAppConfig?.()
      .then((config: AppConfig) => {
        try { localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config)) } catch { /* ignore quota errors */ }
        return { config, fromCache: false }
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(CONFIG_CACHE_KEY)
          return raw ? { config: JSON.parse(raw) as AppConfig, fromCache: true } : { config: null as AppConfig | null, fromCache: false }
        } catch { return { config: null as AppConfig | null, fromCache: false } }
      })
      .then(({ config, fromCache }) => {
        if (config) {
          setAppConfig(config)
          if (!config.has_users) setMode('register')
          // Skip auto-redirect when config is from cache — network is unreliable
          // and auto-redirecting to the IdP could loop if the proxy changed.
          if (!fromCache && !config.password_login && config.oidc_login && config.oidc_configured && config.has_users && !invite && !noRedirect) {
            window.location.href = '/api/auth/oidc/login'
          }
        }
      })
  }, [navigate, t, noRedirect])

  // Language detection chain (runs once on mount, only if user has no saved preference):
  // 1. localStorage → already in store initial state, skip
  // 2. Browser/OS language (navigator.languages)
  // 3. Server default (DEFAULT_LANGUAGE env var)
  // 4. 'en' → hardcoded fallback already in store
  useEffect(() => {
    if (hasStoredLanguage()) return

    const detected = detectBrowserLanguage()
    if (detected) {
      setLanguageTransient(detected)
      return
    }

    configApi.getPublicConfig()
      .then(({ defaultLanguage }) => { if (defaultLanguage) setLanguageTransient(defaultLanguage) })
      .catch((err) => console.warn('Failed to fetch default language config:', err))
  }, [setLanguageTransient])

  useEffect(() => {
    if (!langDropdownOpen) return
    const close = () => setLangDropdownOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [langDropdownOpen])

  const handleDemoLogin = async (): Promise<void> => {
    setError('')
    setIsLoading(true)
    try {
      await demoLogin()
      takeOff()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('login.demoFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasskeyLogin = async (): Promise<void> => {
    setError('')
    setIsLoading(true)
    try {
      const options = await authApi.passkey.loginOptions()
      const assertion = await startAuthentication({ optionsJSON: options })
      await authApi.passkey.loginVerify(assertion)
      await loadUser({ silent: true })
      takeOff()
    } catch (err: unknown) {
      // The user dismissing the native prompt isn't an error worth surfacing.
      const name = (err as { name?: string })?.name
      if (name === 'NotAllowedError' || name === 'AbortError') {
        setIsLoading(false)
        return
      }
      setError(getApiErrorMessage(err, t('login.passkey.failed')))
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    setInsecureCookie(false)
    setIsLoading(true)
    try {
      if (passwordChangeStep) {
        if (!newPassword) { setError(t('settings.passwordRequired')); setIsLoading(false); return }
        if (newPassword.length < 8) { setError(t('settings.passwordTooShort')); setIsLoading(false); return }
        if (newPassword !== confirmPassword) { setError(t('settings.passwordMismatch')); setIsLoading(false); return }
        await authApi.changePassword({ current_password: savedLoginPassword, new_password: newPassword })
        await loadUser({ silent: true })
        takeOff()
        return
      }
      if (mode === 'login' && mfaStep) {
        if (!mfaCode.trim()) {
          setError(t('login.mfaCodeRequired'))
          setIsLoading(false)
          return
        }
        const mfaResult = await completeMfaLogin(mfaToken, mfaCode, rememberMe)
        if ('user' in mfaResult && mfaResult.user?.must_change_password) {
          setSavedLoginPassword(password)
          setPasswordChangeStep(true)
          setIsLoading(false)
          return
        }
        takeOff()
        return
      }
      if (mode === 'register') {
        if (!username.trim()) { setError(t('login.usernameRequired')); setIsLoading(false); return }
        if (password.length < 8) { setError(t('login.passwordMinLength')); setIsLoading(false); return }
        await register(username, email, password, inviteToken || undefined)
      } else {
        const result = await login(email, password, rememberMe)
        if ((result as { insecureCookie?: boolean }).insecureCookie) {
          // Credentials were correct, but the secure cookie won't survive plain
          // HTTP — proceeding would just dead-end on "Access token required".
          setInsecureCookie(true)
          setIsLoading(false)
          return
        }
        if ('mfa_required' in result && result.mfa_required && 'mfa_token' in result) {
          setMfaToken(result.mfa_token)
          setMfaStep(true)
          setMfaCode('')
          setIsLoading(false)
          return
        }
        if ('user' in result && result.user?.must_change_password) {
          setSavedLoginPassword(password)
          setPasswordChangeStep(true)
          setIsLoading(false)
          return
        }
      }
      takeOff()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t('login.error')))
      setIsLoading(false)
    }
  }

  const showRegisterOption = (appConfig?.password_registration || !appConfig?.has_users || inviteValid) && (appConfig?.setup_complete !== false || !appConfig?.has_users)

  // In OIDC-only mode, show a minimal page that redirects directly to the IdP
  const oidcOnly = !appConfig?.password_login && appConfig?.oidc_login && appConfig?.oidc_configured

  return {
    navigate,
    mode, setMode,
    username, setUsername, email, setEmail, password, setPassword, rememberMe, setRememberMe, showPassword, setShowPassword,
    isLoading, error, setError, insecureCookie, appConfig, inviteToken,
    langDropdownOpen, setLangDropdownOpen, setLanguageLocal,
    showTakeoff, mfaStep, setMfaStep, mfaToken, setMfaToken, mfaCode, setMfaCode,
    passwordChangeStep, newPassword, setNewPassword, confirmPassword, setConfirmPassword,
    noRedirect, showRegisterOption, oidcOnly,
    handleDemoLogin, handleSubmit, handlePasskeyLogin,
  }
}
