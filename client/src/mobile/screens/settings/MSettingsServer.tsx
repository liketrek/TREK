import { Server } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { nativeServerHost } from '../../../native/platform'
import { TrekShell } from '../../../native/trekShell'
import { MSetButton, MSetCard, MSetHint } from './MSettingsUi'

/** Only inside the iOS/Android app: which server it talks to, and the way to another one. */
export default function MSettingsServer() {
  const { t } = useTranslation()
  const host = nativeServerHost()
  if (!host) return null
  return (
    <MSetCard title={t('native.settings.server')} icon={Server} className="mb-3">
      <MSetHint className="mt-0 mb-3">{t('native.settings.serverHint', { server: host })}</MSetHint>
      <MSetButton variant="ghost" onClick={() => { void TrekShell.resetServer() }}>{t('native.changeServer')}</MSetButton>
    </MSetCard>
  )
}
