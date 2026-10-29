import { Smartphone } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useNativeHandoff } from './nativeHandoff/useNativeHandoff';

export default function NativeHandoffPage() {
  const { t } = useTranslation();
  const { valid, ready, userName, status, openApp, switchAccount } = useNativeHandoff();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary p-6">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-edge bg-surface-card p-7 text-center">
        <Smartphone className="mx-auto text-content-muted" size={32} aria-hidden />
        {!valid ? (
          <p className="text-body text-content">{t('native.login.failed')}</p>
        ) : !ready ? (
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-edge border-t-accent"
            aria-label={t('common.loading')}
          />
        ) : (
          <>
            <h1 className="text-title font-semibold text-content">{t('native.handoff.title')}</h1>
            <p className="text-body text-content-muted">{t('native.handoff.hint', { name: userName })}</p>
            {status === 'failed' && (
              <p role="alert" className="text-body text-danger">
                {t('native.login.failed')}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                void openApp();
              }}
              disabled={status === 'sending'}
              className="w-full rounded-lg bg-accent py-3 font-semibold text-accent-on disabled:opacity-60"
            >
              {t('native.handoff.open')}
            </button>
            <button
              type="button"
              onClick={() => {
                void switchAccount();
              }}
              className="py-1 text-caption text-content-muted"
            >
              {t('native.handoff.switchAccount')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
