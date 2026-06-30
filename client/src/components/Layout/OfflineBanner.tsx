/**
 * OfflineBanner — connectivity + sync state indicator.
 *
 * Priority (highest first):
 *   N failed     →  red pill    "Failed to sync: N"  (changes were dropped)
 *   N conflicts  →  purple pill "Conflicts: N"       (need resolving)
 *   offline      →  amber pill  "Offline" / "Offline mode" / "Offline · N queued"
 *   online + N   →  blue pill   "Syncing N…"
 *   online + 0   →  hidden
 *
 * Rendered as a small floating pill anchored to the bottom-center of the
 * viewport so it never competes with top navigation or sticky modal
 * headers. On mobile it hovers just above the bottom tab bar.
 */
import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, AlertTriangle, GitMerge } from 'lucide-react'
import { mutationQueue } from '../../sync/mutationQueue'
import { useNetworkMode } from '../../hooks/useNetworkMode'
import { useTranslation } from '../../i18n'

const POLL_MS = 3_000

export default function OfflineBanner(): React.ReactElement | null {
  const { t } = useTranslation()
  const { offline, forced } = useNetworkMode()
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [conflictCount, setConflictCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const [n, failed, conflicts] = await Promise.all([
        mutationQueue.pendingCount(),
        mutationQueue.failedCount(),
        mutationQueue.conflictCount(),
      ])
      if (!cancelled) {
        setPendingCount(n)
        setFailedCount(failed)
        setConflictCount(conflicts)
      }
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const hidden = !offline && pendingCount === 0 && failedCount === 0 && conflictCount === 0
  if (hidden) return null

  // Failed mutations are the most important signal — they mean data was dropped.
  // Conflicts come next (they still need a decision), then plain offline status.
  const failed = failedCount > 0
  const conflict = !failed && conflictCount > 0
  const bg = failed ? '#b91c1c' : conflict ? '#6d28d9' : offline ? '#92400e' : '#1e40af'

  let label: string
  let icon: React.ReactElement
  if (failed) {
    label = t('settings.offline.banner.failed', { count: failedCount })
    icon = <AlertTriangle size={12} />
  } else if (conflict) {
    label = t('settings.offline.banner.conflicts', { count: conflictCount })
    icon = <GitMerge size={12} />
  } else if (offline) {
    label = pendingCount > 0
      ? t('settings.offline.banner.queued', { count: pendingCount })
      : forced
        ? t('settings.offline.banner.forced')
        : t('settings.offline.banner.offline')
    icon = <WifiOff size={12} />
  } else {
    label = t('settings.offline.banner.syncing', { count: pendingCount })
    icon = <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        // Hover above the mobile bottom nav; on desktop --bottom-nav-h is 0,
        // so the pill sits 16px from the bottom.
        bottom: 'calc(var(--bottom-nav-h) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: bg,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.08)',
        fontSize: 'calc(12px * var(--fs-scale-body, 1))',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {icon}
      {label}
    </div>
  )
}
