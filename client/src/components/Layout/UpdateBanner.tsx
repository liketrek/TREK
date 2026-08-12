import React from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from '../../pwaRegistration'
import { useTranslation } from '../../i18n'

/**
 * Persistent, user-controlled prompt for a waiting Workbox service worker.
 * Updates never reload an in-progress edit until the user explicitly accepts.
 */
export default function UpdateBanner(): React.ReactElement | null {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <aside
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 14,
        right: 14,
        bottom: 'calc(var(--bottom-nav-h) + 14px)',
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
        onClick={() => void updateServiceWorker(true)}
        style={{
          minHeight: 44,
          border: 0,
          borderRadius: 11,
          padding: '0 15px',
          color: '#fff',
          background: '#b45309',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {t('common.reload')}
      </button>
    </aside>
  )
}
