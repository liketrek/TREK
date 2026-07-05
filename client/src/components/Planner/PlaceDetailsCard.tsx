import React, { useEffect, useState } from 'react'
import { Star, Phone, Globe, Clock, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { mapsApi } from '../../api/client'
import { useTranslation } from '../../i18n'

type PoiPhoto = { photoUrl: string | null; attribution?: string | null }

export interface PoiRef { osm_id: string; name: string; lat: number; lng: number }

const poiDetailsCache = new Map<string, { details: Record<string, unknown> | null; photo: PoiPhoto | null }>()

function readSession(key: string) {
  try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : undefined } catch { return undefined }
}
function writeSession(key: string, value: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* quota */ }
}

export function usePoiDetails(poi: PoiRef | null, language: string): { details: Record<string, unknown> | null; photo: PoiPhoto | null; loading: boolean } {
  const [state, setState] = useState<{ details: Record<string, unknown> | null; photo: PoiPhoto | null; loading: boolean }>({ details: null, photo: null, loading: false })

  useEffect(() => {
    if (!poi) { setState({ details: null, photo: null, loading: false }); return }
    const key = `poidetails_${poi.osm_id}_${language}`
    const cached = poiDetailsCache.get(key) ?? readSession(key)
    if (cached) { poiDetailsCache.set(key, cached); setState({ ...cached, loading: false }); return }
    let cancelled = false
    setState({ details: null, photo: null, loading: true })
    ;(async () => {
      let details: Record<string, unknown> | null = null
      try { details = (await mapsApi.poiDetails(poi.osm_id, poi.name, poi.lat, poi.lng, language)).place } catch { /* degrade */ }
      let photo: PoiPhoto | null = null
      try {
        const photoId = (details?.google_place_id as string) || `coords:${poi.lat},${poi.lng}`
        photo = await mapsApi.placePhoto(photoId, poi.lat, poi.lng, poi.name)
      } catch { /* degrade */ }
      if (cancelled) return
      const value = { details, photo }
      poiDetailsCache.set(key, value)
      writeSession(key, value)
      setState({ ...value, loading: false })
    })()
    return () => { cancelled = true }
  }, [poi?.osm_id, language])

  return state
}

function getWeekdayIndex(): number {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

interface ChipProps {
  icon: React.ReactNode
  text: React.ReactNode
  color?: string
  bg?: string
}

function Chip({ icon, text, color = 'var(--text-secondary)', bg = 'var(--bg-hover)' }: ChipProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, background: bg, color, fontSize: 'calc(12px * var(--fs-scale-body, 1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

export default function PlaceDetailsCard({ name, details, photo, loading }: {
  name: string
  details: Record<string, unknown> | null
  photo: PoiPhoto | null
  loading: boolean
}) {
  const { t, locale } = useTranslation()
  const [hoursExpanded, setHoursExpanded] = useState(false)
  const d = details ?? {}
  const rating = d.rating as number | undefined
  const ratingCount = d.rating_count as number | undefined
  const openNow = d.open_now as boolean | undefined
  const hours = d.opening_hours as string[] | null | undefined
  const summary = d.summary as string | undefined
  const reviews = (d.reviews as { author: string | null; rating: number | null; text: string | null; time: string | null; photo: string | null }[] | undefined) ?? []
  const website = d.website as string | undefined
  const phone = d.phone as string | undefined
  const googleMapsUrl = d.google_maps_url as string | undefined
  const weekdayIndex = getWeekdayIndex()

  return (
    <div style={{ fontFamily: 'var(--font-system)' }}>
      {/* Hero photo */}
      {photo?.photoUrl && (
        <div style={{ position: 'relative' }}>
          <img
            src={photo.photoUrl}
            alt={name}
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          />
          {photo.attribution && (
            <span style={{
              position: 'absolute', bottom: 6, right: 8,
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(0,0,0,0.35)',
              padding: '1px 5px', borderRadius: 4,
            }}>{photo.attribution}</span>
          )}
        </div>
      )}

      {/* Name + loading */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="text-content" style={{ fontWeight: 600, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', flex: 1, minWidth: 0 }}>{name}</span>
          {loading && <Loader2 size={14} className="animate-spin" style={{ flexShrink: 0, color: 'var(--text-faint)' }} />}
        </div>

        {/* Rating chip */}
        {rating !== undefined && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <Chip
              icon={<Star size={12} fill="#facc15" color="#facc15" />}
              text={<>
                {rating.toFixed(1)}
                {ratingCount ? <span style={{ opacity: 0.5 }}> ({ratingCount.toLocaleString(locale)})</span> : ''}
              </>}
              color="var(--text-secondary)"
              bg="var(--bg-hover)"
            />
          </div>
        )}

        {/* Open now / closed */}
        {openNow !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
              fontWeight: 600,
              color: openNow ? '#16a34a' : '#dc2626',
              background: openNow ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)',
              padding: '2px 8px', borderRadius: 99,
            }}>
              {openNow ? t('poi.details.openNow') : t('poi.details.closed')}
            </span>
          </div>
        )}

        {/* Opening hours */}
        {hours && hours.length > 0 && (
          <div className="bg-surface-hover" style={{ borderRadius: 10, overflow: 'hidden' }}>
            <button
              onClick={() => setHoursExpanded(h => !h)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="#9ca3af" />
                <span className="text-content-secondary" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500 }}>
                  {hoursExpanded ? t('poi.details.hours') : (hours[weekdayIndex] || t('poi.details.hours'))}
                </span>
              </div>
              {hoursExpanded ? <ChevronUp size={13} color="#9ca3af" /> : <ChevronDown size={13} color="#9ca3af" />}
            </button>
            {hoursExpanded && (
              <div style={{ padding: '0 12px 10px' }}>
                {hours.map((line, i) => (
                  <div key={i} className={i === weekdayIndex ? 'text-content' : 'text-content-muted'} style={{
                    fontSize: 'calc(12px * var(--fs-scale-body, 1))',
                    fontWeight: i === weekdayIndex ? 600 : 400,
                    padding: '2px 0',
                  }}>{line}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <p className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: '1.5', margin: 0, wordBreak: 'break-word' }}>
            {summary}
          </p>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="text-content-faint" style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {t('poi.details.reviews')}
            </span>
            {reviews.slice(0, 5).map((rev, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {rev.author && (
                    <span className="text-content" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{rev.author}</span>
                  )}
                  {rev.rating !== null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Star size={10} fill="#facc15" color="#facc15" />
                      <span className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>{rev.rating}</span>
                    </span>
                  )}
                  {rev.time && (
                    <span className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>{rev.time}</span>
                  )}
                </div>
                {rev.text && (
                  <p className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: '1.4', margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {rev.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {(website || phone || googleMapsUrl) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer"
                className="text-content-secondary bg-surface-hover"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', textDecoration: 'none' }}>
                <Globe size={12} /> {t('poi.details.website')}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`}
                className="text-content-secondary bg-surface-hover"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', textDecoration: 'none' }}>
                <Phone size={12} /> {phone}
              </a>
            )}
            {googleMapsUrl && (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="text-content-secondary bg-surface-hover"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', textDecoration: 'none' }}>
                <ExternalLink size={12} /> {t('poi.details.viewOnGoogleMaps')}
              </a>
            )}
          </div>
        )}

        {/* Fallback: no details, not loading */}
        {!details && !loading && (
          <p className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', margin: 0 }}>
            {t('poi.details.noDetails')}
          </p>
        )}
      </div>
    </div>
  )
}
