import React from 'react'
import { SettingsBlock, StatusPill } from '../../components/Settings/settingsKit'

interface GoogleOptionsProps {
  /** "Google options" — the heading of the fold. */
  title: string
  /** Right-hand summary while folded, e.g. "4 of 5 on". */
  summary: string
  children: React.ReactNode
}

/**
 * The fold that holds what a Google key is allowed to be spent on.
 *
 * Only these switches fold away. The key fields above stay visible: a field you
 * have to go looking for is worse than a long page, and the keys are the reason
 * an admin opens this card at all. The switches are the opposite — set once,
 * then never touched, and there are five of them.
 *
 * Shown open: the settings pages fold nothing away.
 */
export default function GoogleOptions({ title, summary, children }: GoogleOptionsProps): React.ReactElement {
  return (
    // A block of the card: its title and the count of switches on as the block's
    // head, its rows inside.
    <SettingsBlock title={title} badge={<StatusPill>{summary}</StatusPill>} flush>
      {children}
    </SettingsBlock>
  )
}
