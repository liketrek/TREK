import React from 'react'
import { Zap } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { HelpGuideSize } from '../../help/types'
import HelpBadge from './HelpBadge'

/** "Quick", "Guide" or "Walkthrough": how much of a task the guide covers. */
export default function HelpSizeChip({ size }: { size: HelpGuideSize }): React.ReactElement {
  const { t } = useTranslation()
  const label = size === 'quick' ? t('help.center.quick') : size === 'tour' ? t('help.center.tour') : t('help.center.guide')
  return (
    <HelpBadge tone="accent" icon={Zap}>
      {label}
    </HelpBadge>
  )
}
