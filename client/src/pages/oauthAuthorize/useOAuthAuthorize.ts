import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { oauthApi } from '../../api/client'
import { SCOPE_GROUPS } from '../../api/oauthScopes'
import { useTranslation } from '../../i18n'

interface ValidateResult {
  valid: boolean
  error?: string
  error_description?: string
  client?: { name: string; allowed_scopes: string[] }
  scopes?: string[]
  consentRequired?: boolean
  loginRequired?: boolean
  scopeSelectable?: boolean
}

type PageState = 'loading' | 'login_required' | 'consent' | 'auto_approving' | 'error' | 'done'

/**
 * OAuth authorize/consent screen logic — owns the validate→consent state machine,
 * the requested-scope selection and the login/redirect plumbing. The page reads
 * the query string once here so the controller stays a pure renderer.
 * Behaviour is identical to the previous in-component logic.
 */
export function useOAuthAuthorize() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [validation, setValidation] = useState<ValidateResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])

  const params = new URLSearchParams(window.location.search)
  const clientId       = params.get('client_id') || ''
  const redirectUri    = params.get('redirect_uri') || ''
  const scope          = params.get('scope') || ''
  const state          = params.get('state') || ''
  const codeChallenge  = params.get('code_challenge') || ''
  const ccMethod       = params.get('code_challenge_method') || ''
  const resource       = params.get('resource') || undefined

  // Load auth state once, then validate
  useEffect(() => {
    loadUser({ silent: true }).catch(() => {})
  }, [loadUser])

  useEffect(() => {
    if (authLoading) return
    validateRequest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated])

  async function validateRequest() {
    setPageState('loading')
    try {
      const result = await oauthApi.validate({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: ccMethod,
        response_type: 'code',
        resource,
      })
      setValidation(result)

      if (!result.valid) {
        setPageState('error')
        setErrorMsg(result.error_description || result.error || 'Invalid authorization request')
        return
      }

      if (result.loginRequired) {
        setPageState('login_required')
        return
      }

      if (!result.consentRequired) {
        // Consent already on record — auto-approve silently with the full validated scope
        setPageState('auto_approving')
        await submitConsent(true, result.scopes ?? [])
        return
      }

      // Pre-select all scopes the client is requesting — user can deselect
      setSelectedScopes(result.scopes ?? [])
      setPageState('consent')
    } catch (err: unknown) {
      setPageState('error')
      setErrorMsg('Failed to validate authorization request. Please try again.')
    }
  }

  async function submitConsent(approved: boolean, scopes: string[] = selectedScopes) {
    setSubmitting(true)
    try {
      const result = await oauthApi.authorize({
        client_id: clientId,
        redirect_uri: redirectUri,
        // When approving, send only the scopes the user selected; deny uses original scope
        scope: approved ? scopes.join(' ') : scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: ccMethod,
        approved,
        resource,
      })
      setPageState('done')
      window.location.href = result.redirect
    } catch {
      setPageState('error')
      setErrorMsg('Authorization failed. Please try again.')
      setSubmitting(false)
    }
  }

  function toggleScope(s: string) {
    setSelectedScopes(prev =>
        prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  function toggleGroup(groupScopes: string[], allSelected: boolean) {
    setSelectedScopes(prev =>
        allSelected
            ? prev.filter(s => !groupScopes.includes(s))
            : [...new Set([...prev, ...groupScopes])]
    )
  }

  function handleLoginRedirect() {
    const next = '/oauth/consent?' + params.toString() + window.location.hash
    window.location.href = '/login?redirect=' + encodeURIComponent(next)
  }

  // Group requested scopes by their translated group name
  const scopesByGroup = useMemo(() => {
    const requested = validation?.scopes || []
    const groups: Record<string, string[]> = {}
    for (const s of requested) {
      const keys = SCOPE_GROUPS[s]
      const group = keys ? t(keys.groupKey) : 'Other'
      if (!groups[group]) groups[group] = []
      groups[group].push(s)
    }
    return groups
  }, [validation, t])

  return {
    pageState, validation, submitting, errorMsg, selectedScopes, clientId,
    scopesByGroup, submitConsent, toggleScope, toggleGroup, handleLoginRedirect,
  }
}
