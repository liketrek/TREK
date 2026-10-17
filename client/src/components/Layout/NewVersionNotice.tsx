/**
 * NewVersionNotice: a release was deployed while this page stayed open.
 *
 * The server names its version on every socket (re)connect, and a deploy
 * restarts it, so every open client hears of a new release within seconds. A
 * launch brings an outdated page onto the current build by itself
 * (versionHandover); a page in use is never reloaded under the user's hands, so
 * this offers the reload instead, for a version that changed while the page was
 * open, and the reload goes through the same handover.
 *
 * One notice for both shells, rendered once in App. Hidden offline, where a
 * reload could not fetch the new build, and once dismissed for that version.
 * It reads the error boundary's texts for the same situation, a tab that
 * outlived a deploy.
 */
import React, { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useServerVersionStore } from '../../store/serverVersionStore'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { offersNewBuild, switchToServerVersion } from '../../utils/versionHandover'
import { useTranslation } from '../../i18n'

export default function NewVersionNotice(): React.ReactElement | null {
  const { t } = useTranslation()
  const reported = useServerVersionStore(s => s.reported)
  const first = useServerVersionStore(s => s.first)
  const { offline } = useNetworkMode()
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)

  // Only a version that changed while this page was open: a different build at
  // launch is the launch handover's to fix, and an install whose server never
  // reports the bundle's version would otherwise be asked every session.
  if (offline || !reported || reported === first || reported === dismissed || !offersNewBuild(reported)) return null

  const reload = (): void => {
    setSwitching(true)
    void switchToServerVersion(reported)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      // Above the OfflineBanner pill, which sits 16px over the bottom nav.
      style={{ bottom: 'calc(var(--bottom-nav-h) + 56px)' }}
      className="fixed inset-x-4 z-[9999] flex items-center gap-3 rounded-xl border border-edge bg-surface-elevated px-4 py-3 text-content shadow-lg sm:inset-x-auto sm:start-4 sm:max-w-sm"
    >
      <RefreshCw size={16} className={`shrink-0 text-accent-on ${switching ? 'animate-spin' : ''}`} aria-hidden="true" />
      <span className="min-w-0 flex-1 text-sm">{t('common.errorUpdateTitle')}</span>
      <button
        type="button"
        onClick={reload}
        disabled={switching}
        className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-text hover:bg-accent-hover disabled:opacity-60"
      >
        {t('common.errorReload')}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(reported)}
        disabled={switching}
        aria-label={t('common.close')}
        className="shrink-0 rounded-md p-1 text-content-muted hover:bg-surface-hover disabled:opacity-60"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
