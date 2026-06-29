import { useState } from 'react'
import { Copy, Check, CalendarPlus, Calendar } from 'lucide-react'

interface SubscribeLinksProps {
  httpsUrl: string
  webcalUrl: string
}

/**
 * Shared presentation for calendar subscription URLs. Renders one-click
 * subscribe actions (Google deep link + webcal handoff) plus a copy fallback.
 * Used by both the per-trip and all-trips subscribe modals.
 */
export function SubscribeLinks({ httpsUrl, webcalUrl }: SubscribeLinksProps) {
  const [copied, setCopied] = useState<'https' | 'webcal' | null>(null)

  // Google Calendar's add-by-URL deep link. The cid must carry the webcal://
  // scheme (not https), URL-encoded, and the feed must be served over HTTPS.
  const googleUrl = `https://www.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`

  const copy = async (url: string, which: 'https' | 'webcal') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for non-secure contexts (plain HTTP) where navigator.clipboard is unavailable
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div>
      {/* One-click subscribe actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px 14px', borderRadius: 9, textDecoration: 'none',
            background: 'var(--accent, #6366f1)', color: 'var(--accent-text, #fff)',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          }}
        >
          <CalendarPlus size={14} strokeWidth={2} />
          Add to Google Calendar
        </a>
        <a
          href={webcalUrl}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px 14px', borderRadius: 9, textDecoration: 'none',
            background: 'none', border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          }}
        >
          <Calendar size={14} strokeWidth={2} />
          Add to Apple Calendar / Outlook
        </a>
      </div>

      {/* Manual fallback — raw URLs for any other client / "From URL" boxes */}
      <details style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        <summary style={{ cursor: 'pointer', userSelect: 'none', marginBottom: 8 }}>
          Or copy a link manually
        </summary>
        <UrlRow
          label="Google Calendar"
          hint="paste into “From URL”"
          url={httpsUrl}
          copied={copied === 'https'}
          onCopy={() => copy(httpsUrl, 'https')}
        />
        <UrlRow
          label="Apple Calendar / Outlook"
          hint="webcal://"
          url={webcalUrl}
          copied={copied === 'webcal'}
          onCopy={() => copy(webcalUrl, 'webcal')}
        />
      </details>
    </div>
  )
}

function UrlRow({ label, hint, url, copied, onCopy }: {
  label: string; hint: string; url: string; copied: boolean; onCopy: () => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 5, color: 'var(--text-primary)' }}>
        {label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— {hint}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{
          flex: 1, fontSize: 10, fontFamily: 'monospace',
          padding: '5px 8px', borderRadius: 6,
          border: '1px solid var(--border-faint)',
          background: 'var(--bg-subtle, #f9fafb)',
          color: 'var(--text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {url}
        </div>
        <button
          onClick={onCopy}
          title="Copy"
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--border-primary)', background: 'none',
            cursor: 'pointer', color: copied ? 'var(--accent, #6366f1)' : 'var(--text-muted)',
            transition: 'color 0.15s',
          }}
        >
          {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
        </button>
      </div>
    </div>
  )
}
