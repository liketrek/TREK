import { BellRing, BellOff, Send } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useWebPush } from '../../../hooks/useWebPush'
import { MSetButton, MSetEyebrow, MSetHint } from './MSettingsUi'

/**
 * Phone twin of the desktop `WebPushCard`: markup only, over the same
 * `useWebPush` hook. MSettingsNotifications renders it while the admin has the
 * push channel switched on.
 */
export default function MWebPushCard() {
  const { t } = useTranslation()
  const push = useWebPush()

  return (
    <div className="mb-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] p-3">
      <MSetEyebrow className="mb-1">{t('settings.webPush.title')}</MSetEyebrow>
      <MSetHint className="mb-2 mt-0">{t('settings.webPush.hint')}</MSetHint>
      {push.stateText && (
        <p role="status" className="mb-2 text-[0.75rem] font-semibold text-m-ink">
          {push.stateText}
        </p>
      )}
      {push.canSwitch && (
        <div className="flex flex-wrap gap-2">
          <MSetButton variant={push.on ? 'ghost' : 'primary'} onClick={push.toggle} disabled={push.busy}>
            {push.on ? <BellOff size={13} /> : <BellRing size={13} />}
            {push.switchLabel}
          </MSetButton>
          <MSetButton variant="ghost" onClick={push.sendTest} disabled={!push.canTest}>
            <Send size={13} />
            {t('settings.notificationPreferences.sendTest')}
          </MSetButton>
        </div>
      )}
    </div>
  )
}
