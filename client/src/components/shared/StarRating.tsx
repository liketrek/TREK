import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { Star } from 'lucide-react'
import { avatarSrc } from '../../utils/avatarSrc'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../i18n'
import type { PlaceRatingVote } from '@trek/shared'

const STAR_FILL = '#facc15'

interface StarsProps {
  /** Value the stars visualize (average for display, own vote while hovering). */
  value: number
  size?: number
  /** Interactive mode: hover previews, click casts/clears the own vote. */
  onRate?: (rating: number | null) => void
  myRating?: number | null
  ariaLabel?: string
}

/** Five stars with fractional fill; interactive when onRate is set (#1435).
 *  Clicking the star matching the own vote clears it. */
export function Stars({ value, size = 15, onRate, myRating = null, ariaLabel }: StarsProps) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value

  return (
    <div
      role={onRate ? 'radiogroup' : undefined}
      aria-label={ariaLabel}
      style={{ display: 'inline-flex', gap: 2, cursor: onRate ? 'pointer' : 'default' }}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map(i => {
        // Fractional fill for averages: full below, empty above, clipped between.
        const fill = Math.max(0, Math.min(1, shown - (i - 1)))
        const star = (
          <span key={i} style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
            <Star size={size} color={STAR_FILL} fill="none" style={{ position: 'absolute', inset: 0 }} />
            {fill > 0 && (
              <span style={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, overflow: 'hidden' }}>
                <Star size={size} color={STAR_FILL} fill={STAR_FILL} />
              </span>
            )}
          </span>
        )
        if (!onRate) return star
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={myRating === i}
            aria-label={`${i}`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onClick={() => onRate(myRating === i ? null : i)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex' }}
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}

interface PlaceRatingProps {
  ratings: PlaceRatingVote[]
  ratingAvg: number | null | undefined
  onRate?: (rating: number | null) => void
  size?: number
  /** Hide the voter avatar strip (compact mobile rows). */
  compact?: boolean
}

/**
 * The collaborative rating row (#1435): interactive stars (hover previews the
 * own vote, the average fill shows otherwise), the numeric average, and the
 * voter avatars. Hovering reveals a custom tooltip listing every voter with
 * their stars.
 */
export default function PlaceRating({ ratings, ratingAvg, onRate, size = 16, compact = false }: PlaceRatingProps) {
  const { t } = useTranslation()
  const currentUserId = useAuthStore(s => s.user?.id)
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)
  const myRating = ratings.find(r => r.user_id === currentUserId)?.rating ?? null
  const avg = ratingAvg ?? null

  const showTip = (e: React.MouseEvent) => {
    if (ratings.length === 0) return
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ top: r.top, left: r.left + r.width / 2 })
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: size + 4 }}
      onMouseEnter={showTip}
      onMouseLeave={() => setTip(null)}
    >
      <Stars value={avg ?? 0} size={size} onRate={onRate} myRating={myRating} ariaLabel={t('places.yourRating')} />
      {avg !== null ? (
        <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {(Math.round(avg * 10) / 10).toLocaleString()} <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>({ratings.length})</span>
        </span>
      ) : (
        <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{t('places.notRated')}</span>
      )}

      {/* Who voted — avatar strip. */}
      {!compact && ratings.length > 0 && (
        <span style={{ display: 'inline-flex', marginLeft: 'auto' }}>
          {ratings.slice(0, 6).map((r, i) => (
            <span key={r.user_id} className="bg-surface-tertiary text-content-muted" style={{
              width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 700,
              marginLeft: i ? -5 : 0, border: '1.5px solid var(--bg-elevated, #fff)',
            }}>
              {r.avatar ? <img src={avatarSrc(r.avatar)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : r.username?.[0]?.toUpperCase()}
            </span>
          ))}
        </span>
      )}

      {/* Custom voter tooltip — fixed at the root so nothing clips it. */}
      {tip && ratings.length > 0 && ReactDOM.createPortal(
        <div
          role="tooltip"
          className="bg-surface-card text-content border border-edge-faint"
          style={{
            position: 'fixed', top: tip.top - 8, left: tip.left, transform: 'translate(-50%, -100%)',
            zIndex: 100000, pointerEvents: 'none', borderRadius: 10, padding: '8px 11px', minWidth: 140,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', fontFamily: 'var(--font-system)',
          }}
        >
          {ratings.map(r => (
            <div key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
              <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.username}{r.user_id === currentUserId ? ` (${t('vacay.you')})` : ''}
              </span>
              <Stars value={r.rating} size={11} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
