import React from 'react'
import { Server } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { nativeServerHost } from '../../native/platform'
import { TrekShell } from '../../native/trekShell'
import Section from './Section'

/** Only inside the iOS/Android app: which server it talks to, and the way to another one. */
export default function NativeServerSection(): React.ReactElement | null {
  const { t } = useTranslation()
  const host = nativeServerHost()
  if (!host) return null
  return (
    <Section title={t('native.settings.server')} icon={Server}>
      <p className="text-body text-content-secondary">{t('native.settings.serverHint', { server: host })}</p>
      <button
        type="button"
        onClick={() => { void TrekShell.resetServer() }}
        className="rounded-lg border border-edge bg-surface-card px-4 py-2 text-body font-medium text-content hover:bg-surface-hover"
      >
        {t('native.changeServer')}
      </button>
    </Section>
  )
}
