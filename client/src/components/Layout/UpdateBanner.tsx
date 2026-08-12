import React, { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from '../../pwaRegistration'
import { useTranslation } from '../../i18n'

/**
 * Persistent, user-controlled prompt for a waiting Workbox service worker.
 * Updates never reload an in-progress edit until the user explicitly accepts.
 */
export default function UpdateBanner(): React.ReactElement | null {
  const { t } = useTranslation()
  const [isApplying, setIsApplying] = useState(false)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  async function applyUpdate(): Promise<void> {
    if (isApplying) return
    setIsApplying(true)
    try {
      await updateServiceWorker(true)
    } catch {
      // A transient registration failure should leave the prompt usable so the
      // user can retry rather than producing an unhandled promise rejection.
      setIsApplying(false)
    }
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 14,
        right: 14,
        // Leave the bottom slot available for OfflineBanner. Its failed-sync
        // state is more urgent and must remain visible while an update waits.
        bottom: 'calc(var(--bottom-nav-h) + 64px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        border: '1px solid color-mix(in srgb, #d97706 35%, var(--border-primary))',
        borderRadius: 15,
        background: 'color-mix(in srgb, #f59e0b 14%, var(--bg-primary))',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        fontFamily: 'var(--font-system)',
      }}
    >
      <RefreshCw size={18} aria-hidden="true" style={{ color: '#b45309', flexShrink: 0 }} />
      <span style={{ flex: 1, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.35, fontWeight: 550 }}>
        {t('common.updateAvailable')}
      </span>
      <button
        type="button"
        onClick={() => void applyUpdate()}
        disabled={isApplying}
        aria-busy={isApplying}
        style={{
          minHeight: 44,
          border: 0,
          borderRadius: 11,
          padding: '0 15px',
          color: '#fff',
          background: '#b45309',
          fontWeight: 700,
          cursor: 'pointer',
          opacity: isApplying ? 0.7 : 1,
          flexShrink: 0,
        }}
      >
        {t('common.reload')}
      </button>
    </aside>
  )
}
