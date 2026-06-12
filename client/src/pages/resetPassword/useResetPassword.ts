import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/client'
import { getApiErrorMessage } from '../../types'
import { useTranslation } from '../../i18n'

/**
 * Reset-password data hook — owns the token lookup, the form state, the
 * client-side validation and the submit (incl. the MFA step-up branch).
 * ResetPasswordPage is a pure wiring container. Behaviour is identical to the
 * previous in-component logic.
 */
export function useResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) setError(t('login.resetPasswordInvalidLink'))
  }, [token, t])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setError('')
    if (!token) return
    if (pw.length < 8) { setError(t('login.passwordMinLength')); return }
    if (pw !== pw2) { setError(t('login.passwordsDontMatch')); return }
    setIsLoading(true)
    try {
      const res = await authApi.resetPassword({
        token,
        new_password: pw,
        ...(mfaRequired && mfaCode ? { mfa_code: mfaCode.trim() } : {}),
      })
      if (res.mfa_required) {
        setMfaRequired(true)
        setIsLoading(false)
        return
      }
      if (res.success) {
        setSuccess(true)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t('login.resetPasswordFailed')))
    }
    setIsLoading(false)
  }

  return {
    navigate, token,
    pw, setPw, pw2, setPw2, showPw, setShowPw,
    mfaCode, setMfaCode, mfaRequired, error, success, isLoading,
    handleSubmit,
  }
}
