import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { collabApi } from '../../api/client'
import { safeExternalHref } from '../../utils/safeUrl'

// ── Website Thumbnail (fetches OG image) ────────────────────────────────────
interface OgPreview { title?: string; image?: string }

// linkPreview is trip-scoped on the server, so the cache key has to be too.
// Capped like the chat preview's: a long session would otherwise keep every
// thumbnail it ever rendered for as long as the tab lives. The separator is a
// space because a trip id has none and a URL cannot contain a raw one - it used
// to be a NUL, which made git treat this whole file as binary and its diffs
// unreadable.
const ogCache = new Map<string, OgPreview>()
const cacheKey = (tripId: number, url: string): string => `${tripId} ${url}`
const MAX_CACHED_PREVIEWS = 200

interface WebsiteThumbnailProps {
  url: string
  tripId: number
  color: string
}

export function WebsiteThumbnail({ url, tripId, color }: WebsiteThumbnailProps) {
  const [data, setData] = useState<OgPreview | null>(null)
  const [failed, setFailed] = useState(false)
  // The note contract takes any string, so a stored javascript: URL would run in
  // this origin the moment someone clicks the tile. Refuse those, and leave a
  // bare host linkable - people paste them here the same way they do on a
  // booking. The tile still renders either way; it just is not a link.
  const href = safeExternalHref(url)

  useEffect(() => {
    if (!href) return
    const key = cacheKey(tripId, url)
    setFailed(false)
    const cached = ogCache.get(key)
    if (cached) { setData(cached); return }
    setData(null)
    let current = true
    collabApi.linkPreview(tripId, url)
      .then(d => {
        if (ogCache.size >= MAX_CACHED_PREVIEWS) ogCache.delete(ogCache.keys().next().value!)
        ogCache.set(key, d)
        if (current) setData(d)
      })
      .catch(() => { if (current) setFailed(true) })
    return () => { current = false }
  }, [url, tripId, href])

  const domain = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return 'link' } })()

  const tileStyle = {
    width: 48, height: 48, borderRadius: 8, cursor: href ? 'pointer' : 'default', overflow: 'hidden',
    background: data?.image ? 'none' : 'var(--bg-tertiary)', border: 'none',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 2,
    textDecoration: 'none', transition: 'transform 0.12s, box-shadow 0.12s', flexShrink: 0,
  }

  const tile = data?.image && !failed ? (
    <img src={data.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setFailed(true)} />
  ) : (
    <>
      <ExternalLink size={14} color="var(--text-muted)" />
      <span style={{ fontSize: 'calc(7px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', maxWidth: 42, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {domain}
      </span>
    </>
  )

  if (!href) return <span title={data?.title || url} style={tileStyle}>{tile}</span>

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={data?.title || url}
      style={tileStyle}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}>
      {tile}
    </a>
  )
}
