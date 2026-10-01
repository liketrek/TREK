import { passwordProblem, type PasswordProblem } from '@trek/shared'

const PROBLEM_KEYS: Record<PasswordProblem, string> = {
  tooShort: 'settings.passwordTooShort',
  repetitive: 'settings.passwordRepetitive',
  common: 'settings.passwordCommon',
  weak: 'settings.passwordWeak',
}

/**
 * The translation key for why a new password would be refused, or null when the
 * server will take it (#1200). It runs the server's own policy from @trek/shared,
 * so a form says so before the request instead of after it.
 */
export function passwordErrorKey(password: string): string | null {
  const problem = passwordProblem(password)
  return problem ? PROBLEM_KEYS[problem] : null
}
