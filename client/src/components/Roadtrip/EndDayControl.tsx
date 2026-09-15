import { useState } from 'react'
import { Moon } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import ToggleSwitch from '../Settings/ToggleSwitch'

export interface EndDayControlProps {
  active: boolean
  onToggle: () => Promise<void>
}

export default function EndDayControl({ active, onToggle }: EndDayControlProps) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  return (
    <fieldset disabled={pending} aria-busy={pending} className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] bg-surface-hover px-3 py-2 disabled:opacity-60">
      <span className="flex flex-1 items-center gap-1.5 text-[length:calc(12px*var(--fs-scale-body,1))] font-medium text-content-secondary"><Moon size={13} className={`shrink-0 ${active ? 'text-accent-on' : 'text-content-faint'}`} aria-hidden />{t('roadtrip.window.endHere')}</span>
      <ToggleSwitch on={active} label={t('roadtrip.window.endHere')} onToggle={async () => {
        if (pending) return
        setPending(true)
        try { await onToggle() } finally { setPending(false) }
      }} />
    </fieldset>
  )
}
