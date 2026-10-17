import React from 'react'
import { BellRing } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useWebPush } from '../../hooks/useWebPush'
import { fs } from '../shared/DialogShell'
import { SettingsCard, SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY } from './settingsKit'

/**
 * The "Push notifications on this device" card of the Notifications tab. Only
 * markup: the logic is `useWebPush`, shared with the phone's `MWebPushCard`.
 * The tab renders it while the admin has the push channel switched on.
 */
export default function WebPushCard(): React.ReactElement {
  const { t } = useTranslation()
  const push = useWebPush()

  return (
    <SettingsCard icon={BellRing} title={t('settings.webPush.title')} hint={t('settings.webPush.hint')}>
      {(push.stateText || push.canSwitch) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3">
          {push.stateText
            ? (
              <p role="status" className="m-0 min-w-0 flex-1 basis-56 text-content-secondary" style={fs(12.5, 'body')}>
                {push.stateText}
              </p>
            )
            : <span className="flex-1" />}
          {push.canSwitch && (
            <div className="flex flex-none flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={push.sendTest}
                disabled={!push.canTest}
                className={SETTINGS_BUTTON}
                style={fs(13, 'body')}
              >
                {t('settings.notificationPreferences.sendTest')}
              </button>
              <button
                type="button"
                onClick={push.toggle}
                disabled={push.busy}
                className={push.on ? SETTINGS_BUTTON : SETTINGS_BUTTON_PRIMARY}
                style={fs(13, 'body')}
              >
                {push.switchLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </SettingsCard>
  )
}
