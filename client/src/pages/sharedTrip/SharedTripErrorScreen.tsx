import { CloudOff, Loader2, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { SharedTripLoadError } from './sharedTripModel'

interface SharedTripErrorScreenProps {
  reason: SharedTripLoadError
  retrying: boolean
  onRetry: () => void
}

/**
 * The full-page state of a share link whose payload did not arrive. Only
 * 'expired' tells the viewer the link is dead; 'unavailable' says the load
 * failed and offers another go, since the same link usually works on the next
 * request (#2505).
 */
export function SharedTripErrorScreen({ reason, retrying, onRetry }: SharedTripErrorScreenProps) {
  const { t } = useTranslation()
  const expired = reason === 'expired'

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
      <div className="flex max-w-md flex-col items-center p-10 text-center" role={expired ? undefined : 'alert'}>
        {expired ? (
          <div aria-hidden style={{ fontSize: 'calc(48px * var(--fs-scale-title, 1))', marginBottom: 16 }}>
            🔒
          </div>
        ) : (
          <CloudOff size={44} strokeWidth={1.75} className="mb-4 text-content-muted" aria-hidden />
        )}
        <h1 className="text-balance text-subtitle font-bold text-content">{t(expired ? 'shared.expired' : 'shared.loadFailed')}</h1>
        <p className="mt-2 text-balance text-body text-content-muted">
          {t(expired ? 'shared.expiredHint' : 'shared.loadFailedHint')}
        </p>
        {!expired && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            aria-busy={retrying}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-body font-medium text-accent-text transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
          >
            {retrying ? (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            ) : (
              <RotateCcw size={15} aria-hidden />
            )}
            {t('shared.retry')}
          </button>
        )}
      </div>
    </div>
  )
}
