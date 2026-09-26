import React from 'react'
import { useTranslation } from '../../i18n'
import { useWebPush } from '../../hooks/useWebPush'

/**
 * The "Push notifications on this device" card of the Notifications tab. Only
 * markup: the logic is `useWebPush`, shared with the phone's `MWebPushCard`.
 * The tab renders it while the admin has the push channel switched on.
 */
export default function WebPushCard(): React.ReactElement {
  const { t } = useTranslation()
  const push = useWebPush()

  return (
    <div className="mb-4 rounded-lg border border-edge bg-surface-secondary p-3">
      <p className="mb-1 text-caption font-semibold text-content-secondary">{t('settings.webPush.title')}</p>
      <p className="mb-2 text-caption text-content-faint">{t('settings.webPush.hint')}</p>
      {push.stateText && (
        <p role="status" className="mb-2 text-caption text-content-secondary">
          {push.stateText}
        </p>
      )}
      {push.canSwitch && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={push.toggle}
            disabled={push.busy}
            className={`rounded-md px-3 py-1.5 text-caption disabled:cursor-not-allowed disabled:opacity-60 ${
              push.on ? 'border border-edge bg-transparent text-content-secondary' : 'bg-accent text-accent-text'
            }`}
          >
            {push.switchLabel}
          </button>
          <button
            type="button"
            onClick={push.sendTest}
            disabled={!push.canTest}
            className="rounded-md border border-edge bg-transparent px-3 py-1.5 text-caption text-content-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('settings.notificationPreferences.sendTest')}
          </button>
        </div>
      )}
    </div>
  )
}
