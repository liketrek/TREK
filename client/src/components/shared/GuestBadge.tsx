import { UserRound } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { Tooltip } from './Tooltip'

/**
 * Small "Guest" pill (#1362) shown next to a member's name in assignment pickers
 * so it's clear the person is an accountless guest. Purely presentational.
 */
export default function GuestBadge({ size = 'sm', customTooltip = false }: { size?: 'sm' | 'xs'; customTooltip?: boolean }) {
  const { t } = useTranslation()
  const fs = size === 'xs' ? 9 : 10
  const badge = (
    <span
      title={customTooltip ? undefined : t('members.guestsHint')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
        fontSize: `calc(${fs}px * var(--fs-scale-caption, 1))`, fontWeight: 600,
        color: 'var(--text-muted)', background: 'var(--bg-tertiary)',
        padding: '1px 6px', borderRadius: 99,
      }}
    >
      <UserRound size={fs - 1} /> {t('members.guest')}
    </span>
  )
  return customTooltip ? <Tooltip label={t('members.guestsHint')}>{badge}</Tooltip> : badge
}
