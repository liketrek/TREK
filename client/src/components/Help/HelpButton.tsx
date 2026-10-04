import React from 'react'
import { HelpCircle } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useHelpStore } from '../../store/helpStore'

/**
 * The `?` in the navbar. Same 32px footprint as the theme toggle beside it;
 * lit while the panel is open so the two read as one control.
 */
export default function HelpButton({ className }: { className?: string } = {}): React.ReactElement {
  const { t } = useTranslation()
  const open = useHelpStore(s => s.open)
  const toggleHelp = useHelpStore(s => s.toggleHelp)
  return (
    <button
      type="button"
      onClick={toggleHelp}
      title={t('help.center.button')}
      aria-label={t('help.center.button')}
      aria-pressed={open}
      data-help-button
      className={
        className ??
        `hidden sm:flex relative w-8 h-8 p-2 rounded-lg items-center justify-center flex-shrink-0 transition-colors ${
          open ? 'bg-surface-selected text-content' : 'text-content-muted hover:bg-surface-hover'
        }`
      }
    >
      <HelpCircle className="w-4 h-4" />
    </button>
  )
}
