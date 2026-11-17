import React from 'react'
import { SettingsBlock, StatusPill } from '../../components/Settings/settingsKit'

interface ProviderBlockProps {
  title: string
  /** Optional pill beside the title, like the one on the TREK block. */
  badge?: string
  /**
   * `accent` marks the recommended path, `muted` a neutral one, `caution` a
   * provider that costs something other than money. Deliberately not `danger`:
   * using a Google key is a legitimate choice, and a red badge would be the
   * settings page shouting at the person who made it.
   */
  tone?: 'muted' | 'caution'
  children: React.ReactNode
}

/**
 * One provider inside the API card: its name in a head row, a pill beside it,
 * its fields below, as one rounded block of the card (SettingsBlock), so the
 * card reads as a list of comparable options.
 */
export default function ProviderBlock({
  title, badge, tone = 'muted', children,
}: ProviderBlockProps): React.ReactElement {
  return (
    <SettingsBlock title={title} badge={badge ? <StatusPill tone={tone === 'caution' ? 'warning' : 'neutral'}>{badge}</StatusPill> : undefined}>
      {children}
    </SettingsBlock>
  )
}
