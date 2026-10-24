import { Check, Circle } from 'lucide-react'
import { PASSWORD_RULES, passwordRuleStates } from '@trek/shared'
import { useTranslation } from '../../i18n'

// The sign-in and reset pages are always light, whatever the theme, so their
// list keeps fixed colours instead of the theme tokens.
const LIGHT_MET = { background: '#dcfce7', color: '#15803d' } // theme-lint-disable: the always-light sign-in card
const LIGHT_OPEN = { background: '#f3f4f6', color: '#6b7280' } // theme-lint-disable: the always-light sign-in card

/**
 * The rules under a new-password field, each ticked off as the password meets
 * it (#1200). Hidden until something is typed, so an empty form stays calm.
 */
export default function PasswordChecklist({ password, className = '', tone = 'theme' }: { password: string; className?: string; tone?: 'theme' | 'light' }) {
  const { t } = useTranslation()
  if (!password) return null
  const states = passwordRuleStates(password)
  return (
    <ul aria-label={t('settings.passwordRules')} className={`flex flex-wrap gap-1.5 ${className}`}>
      {PASSWORD_RULES.map(rule => {
        const met = states[rule]
        return (
          <li key={rule} data-met={met || undefined}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-caption font-medium ${tone === 'light' ? '' : met ? 'bg-success-soft text-success' : 'bg-surface-tertiary text-content-faint'}`}
            style={tone === 'light' ? (met ? LIGHT_MET : LIGHT_OPEN) : undefined}>
            {met ? <Check size={11} strokeWidth={2.6} aria-hidden /> : <Circle size={9} strokeWidth={2.4} aria-hidden />}
            <span>{t(`settings.passwordRule.${rule}`)}</span>
          </li>
        )
      })}
    </ul>
  )
}
