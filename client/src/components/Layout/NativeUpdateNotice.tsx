/**
 * NativeUpdateNotice: this server's UI needs a newer app binary than the one
 * installed (native/capabilities.ts, minNativeShellApi). The UI updates with
 * the server, the binary only through the store, so the two can drift; the
 * notice says so and leads to the store instead of leaving native calls to
 * fail one by one. Rendered once in App, inside the app only.
 */
import { Download, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useNativeCapabilities } from '../../native/capabilities';

const STORE_URL = {
  ios: 'https://apps.apple.com/app/id6831237775',
  android: 'https://play.google.com/store/apps/details?id=com.liketrek.trek',
} as const;

export default function NativeUpdateNotice(): React.ReactElement | null {
  const { t } = useTranslation();
  const { caps, updateRequired } = useNativeCapabilities();
  const [dismissed, setDismissed] = useState(false);
  if (!updateRequired || dismissed || caps.platform === 'web') return null;
  const store = caps.platform === 'android' ? STORE_URL.android : STORE_URL.ios;

  return (
    <div
      role="status"
      style={{ bottom: 'calc(var(--bottom-nav-h) + 56px)' }}
      className="fixed inset-x-4 z-[9999] flex items-center gap-3 rounded-2xl border border-edge bg-surface-elevated px-4 py-3 text-content shadow-lg"
    >
      <Download size={18} className="shrink-0 text-content-muted" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="text-body font-semibold">{t('native.update.title')}</div>
        <div className="text-caption text-content-secondary">{t('native.update.body')}</div>
      </div>
      <a
        href={store}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-caption font-semibold text-accent-text"
      >
        {t('native.update.open')}
      </a>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('common.close')}
        className="shrink-0 rounded-full p-1 text-content-muted"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
