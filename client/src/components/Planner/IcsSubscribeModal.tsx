import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw, Calendar } from 'lucide-react'
import { SubscribeLinks } from './SubscribeLinks'

interface IcsSubscribeModalProps {
  tripId: number
  onClose: () => void
}

export function IcsSubscribeModal({ tripId, onClose }: IcsSubscribeModalProps) {
  const [feedUrl, setFeedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  const httpsUrl = feedUrl ?? ''
  const webcalUrl = feedUrl ? feedUrl.replace(/^https?:\/\//, 'webcal://') : ''

  const loadToken = useCallback(async () => {
    setLoading(true)
    try {
      // Try to get existing token first
      let res = await fetch(`/api/trips/${tripId}/feed/token`, { credentials: 'include' })
      if (!res.ok) { setLoading(false); return }
      const data = await res.json() as { feed_url: string | null }
      if (data.feed_url) {
        setFeedUrl(data.feed_url)
      } else {
        // Lazily generate on first open
        res = await fetch(`/api/trips/${tripId}/feed/token`, {
          method: 'POST',
          credentials: 'include',
        })
        if (res.ok) {
          const gen = await res.json() as { feed_url: string }
          setFeedUrl(gen.feed_url)
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [tripId])

  useEffect(() => { loadToken() }, [loadToken])

  const regenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/feed/token`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json() as { feed_url: string }
        setFeedUrl(data.feed_url)
      }
    } catch { /* ignore */ }
    setRegenerating(false)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-card, white)',
        borderRadius: 14,
        padding: '22px 24px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
        border: '1px solid var(--border-faint)',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} strokeWidth={2} style={{ color: 'var(--accent, #6366f1)' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Subscribe to Calendar</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: 'var(--text-muted)', borderRadius: 6, display: 'flex',
            }}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          This link stays in sync with your trip automatically. Calendar apps re-fetch it every hour.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 12 }}>
            Generating link…
          </div>
        ) : !feedUrl ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 12 }}>
            Could not generate feed link.
          </div>
        ) : (
          <>
            <SubscribeLinks httpsUrl={httpsUrl} webcalUrl={webcalUrl} />

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-faint)' }}>
              <button
                onClick={regenerate}
                disabled={regenerating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: '1px solid var(--border-primary)',
                  borderRadius: 7, padding: '5px 10px',
                  fontSize: 11, color: 'var(--text-muted)',
                  cursor: regenerating ? 'default' : 'pointer',
                  fontFamily: 'inherit', opacity: regenerating ? 0.6 : 1,
                }}
              >
                <RefreshCw size={11} strokeWidth={2} style={{ animation: regenerating ? 'spin 0.8s linear infinite' : 'none' }} />
                Regenerate link
              </button>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                Regenerating creates a new link and invalidates the old one.
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
  document.body
  )
}
