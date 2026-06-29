import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { collabApi } from '../../api/client'

// ── Website Thumbnail (fetches OG image) ────────────────────────────────────
const ogCache = {}

interface WebsiteThumbnailProps {
  url: string
  tripId: number
  color: string
}

export function WebsiteThumbnail({ url, tripId, color }: WebsiteThumbnailProps) {
  const [data, setData] = useState(ogCache[url] || null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (ogCache[url]) { setData(ogCache[url]); return }
    collabApi.linkPreview(tripId, url).then(d => { ogCache[url] = d; setData(d) }).catch(() => setFailed(true))
  }, [url, tripId])

  const domain = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return 'link' } })()

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={data?.title || url}
      style={{
        width: 48, height: 48, borderRadius: 8, cursor: 'pointer', overflow: 'hidden',
        background: data?.image ? 'none' : 'var(--bg-tertiary)', border: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        textDecoration: 'none', transition: 'transform 0.12s, box-shadow 0.12s', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}>
      {data?.image && !failed ? (
        <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setFailed(true)} />
      ) : (
        <>
          <ExternalLink size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 'calc(7px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', maxWidth: 42, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
            {domain}
          </span>
        </>
      )}
    </a>
  )
}
