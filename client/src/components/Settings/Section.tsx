import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { SettingsCard } from './settingsKit'

interface SectionProps {
  title: string
  /**
   * A lucide icon, or anything that takes the same `className` — a brand mark
   * standing in for a glyph gets sized by the same utilities.
   */
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  badge?: React.ReactNode
  /** One line under the title in the head band. */
  hint?: React.ReactNode
  /** A control on the right of the head band. */
  action?: React.ReactNode
  children: React.ReactNode
}

/** A settings group: the planner's card with a head band (see settingsKit). */
export default function Section({ title, icon, badge, hint, action, children }: SectionProps): React.ReactElement {
  return (
    <SettingsCard icon={icon} title={title} badge={badge} hint={hint} action={action}>
      {children}
    </SettingsCard>
  )
}
