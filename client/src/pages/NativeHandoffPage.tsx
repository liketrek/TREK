import { Smartphone } from 'lucide-react'
import { useTranslation } from '../i18n'
import { useNativeHandoff } from './nativeHandoff/useNativeHandoff'

export default function NativeHandoffPage() {
  const { t } = useTranslation()
  const { valid, ready, userName, status, openApp, switchAccount } = useNativeHandoff()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-6">
      <div className="w-full max-w-sm rounded-xl bg-surface-card border border-edge p-7 flex flex-col gap-4 text-center">
        <Smartphone className="mx-auto text-content-muted" size={32} aria-hidden />
        {!valid ? (
          <p className="text-body text-content">{t('native.login.failed')}</p>
        ) : !ready ? (
          <div className="mx-auto w-8 h-8 border-4 border-edge border-t-accent rounded-full animate-spin" aria-label={t('common.loading')} />
        ) : (
          <>
            <h1 className="text-title font-semibold text-content">{t('native.handoff.title')}</h1>
            <p className="text-body text-content-muted">{t('native.handoff.hint', { name: userName })}</p>
            {status === 'failed' && <p role="alert" className="text-body text-danger">{t('native.login.failed')}</p>}
            <button
              type="button"
              onClick={openApp}
              disabled={status === 'sending'}
              className="w-full rounded-lg bg-accent text-accent-on py-3 font-semibold disabled:opacity-60"
            >
              {t('native.handoff.open')}
            </button>
            <button type="button" onClick={switchAccount} className="text-caption text-content-muted py-1">
              {t('native.handoff.switchAccount')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
