import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/client'

/**
 * Forgot-password data hook — owns the form state, the SMTP-availability probe
 * and the enumeration-safe submit. ForgotPasswordPage is a pure wiring
 * container that renders what this returns. Behaviour is identical to the
 * previous in-component logic.
 */
export function useForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    // Probe whether SMTP is configured so we can warn the user up-front that the
    // link will land in the server console instead of their inbox. Null while
    // pending — hint is hidden until we know.
    authApi.getAppConfig?.()
      .then((cfg: { available_channels?: { email?: boolean } } | null) => {
        setSmtpConfigured(!!cfg?.available_channels?.email)
      })
      .catch(() => setSmtpConfigured(null))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    try {
      await authApi.forgotPassword({ email: email.trim() })
    } catch {
      // Enumeration-safe: success UX regardless of server outcome.
    }
    setSubmitted(true)
    setIsLoading(false)
  }

  return { navigate, email, setEmail, submitted, isLoading, smtpConfigured, handleSubmit }
}
