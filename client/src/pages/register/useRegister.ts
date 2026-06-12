import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../i18n'

/**
 * Register data hook — owns the form state, the client-side validation and the
 * register → redirect flow. RegisterPage is a pure wiring container. Behaviour
 * is identical to the previous in-component logic.
 */
export function useRegister() {
  const { t } = useTranslation()
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'))
      return
    }

    if (password.length < 8) {
      setError(t('register.passwordTooShort'))
      return
    }

    setIsLoading(true)
    try {
      await register(username, email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('register.failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    username, setUsername, email, setEmail, password, setPassword,
    confirmPassword, setConfirmPassword, showPassword, setShowPassword,
    isLoading, error, handleSubmit,
  }
}
