import { useState, useEffect } from 'react'
import { collabApi } from '../../api/client'

/* ── Link Preview ── */
const previewCache = {}

interface LinkPreviewProps {
  url: string
  tripId: number
  own: boolean
  onLoad: (() => void) | undefined
}

export function LinkPreview({ url, tripId, own, onLoad }: LinkPreviewProps) {
  const [data, setData] = useState(previewCache[url] || null)
  const [loading, setLoading] = useState(!previewCache[url])

  useEffect(() => {
    if (previewCache[url]) return
    collabApi.linkPreview(tripId, url).then(d => {
      previewCache[url] = d
      setData(d)
      setLoading(false)
      if (d?.title || d?.description || d?.image) onLoad?.()
    }).catch(() => setLoading(false))
  }, [url, tripId])

  if (loading || !data || (!data.title && !data.description && !data.image)) return null

  const domain = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return '' } })()

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'block', textDecoration: 'none', marginTop: 6, borderRadius: 12, overflow: 'hidden',
      border: own ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border-faint)',
      background: own ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)',
      maxWidth: 280, transition: 'opacity 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {data.image && (
        <img src={data.image} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
          onError={e => e.currentTarget.style.display = 'none'} />
      )}
      <div style={{ padding: '8px 10px' }}>
        {domain && (
          <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: own ? 'rgba(255,255,255,0.5)' : 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>
            {data.site_name || domain}
          </div>
        )}
        {data.title && (
          <div style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: own ? '#fff' : 'var(--text-primary)', lineHeight: 1.3, marginBottom: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {data.title}
          </div>
        )}
        {data.description && (
          <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: own ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {data.description}
          </div>
        )}
      </div>
    </a>
  )
}
