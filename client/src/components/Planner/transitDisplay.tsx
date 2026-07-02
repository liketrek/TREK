import React from 'react'
import { Footprints, MoveRight } from 'lucide-react'

/**
 * Shared display bits for public-transit entries (#1065) — the timeline row,
 * the Transports-tab card and the journey modal all render the same language:
 * "A → B" titles with a real arrow icon, and the leg sequence as chips where
 * walks carry their minutes (🚶 3 › ⟨U2⟩ › 🚶 3) instead of a detached summary.
 */

export interface TransitLegDisplay {
  mode?: string
  line?: string | null
  line_color?: string | null
  line_text_color?: string | null
  duration?: number
}

/** Renders "From → To" titles with an arrow icon instead of the text glyph. */
export function TransitTitle({ title, iconSize = 12 }: { title: string; iconSize?: number }) {
  const parts = title.split(' → ')
  if (parts.length < 2) return <>{title}</>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: '100%' }}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <MoveRight size={iconSize} style={{ flexShrink: 0, opacity: 0.55 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p}</span>
        </React.Fragment>
      ))}
    </span>
  )
}

/**
 * The leg sequence as chips. Walk legs show their minutes right at the foot
 * icon (sub-minute walks are dropped); transit legs are line badges in their
 * colors. Optionally appends "· N transfers" — never a redundant "direct".
 */
export function TransitLegChips({ legs, transfers, size = 'sm', t }: {
  legs: TransitLegDisplay[]
  transfers?: number
  size?: 'sm' | 'md'
  t: (k: string, p?: Record<string, string | number>) => string
}) {
  const badgeFont = size === 'sm' ? 'calc(9.5px * var(--fs-scale-caption, 1))' : 'calc(10.5px * var(--fs-scale-caption, 1))'
  const walkIcon = size === 'sm' ? 10 : 12
  const shown = legs.filter(l => l.mode !== 'WALK' || (l.duration || 0) >= 60)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? 4 : 5, flexWrap: 'wrap' }}>
      {shown.map((leg, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-content-faint" style={{ fontSize: size === 'sm' ? 9 : 10 }}>›</span>}
          {leg.mode === 'WALK' ? (
            <span className="text-content-faint" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: badgeFont, fontWeight: 600 }}>
              <Footprints size={walkIcon} />
              {Math.round((leg.duration || 0) / 60)}
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', borderRadius: size === 'sm' ? 4 : 5,
              padding: size === 'sm' ? '0 5px' : '1px 7px', lineHeight: size === 'sm' ? '15px' : undefined,
              fontSize: badgeFont, fontWeight: 700,
              background: leg.line_color || 'var(--bg-tertiary)',
              color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--text-primary)',
            }}>
              {leg.line || leg.mode}
            </span>
          )}
        </React.Fragment>
      ))}
      {typeof transfers === 'number' && transfers > 0 && (
        <span className="text-content-faint" style={{ fontSize: badgeFont, marginLeft: 2 }}>
          · {t('transit.transfers', { count: transfers })}
        </span>
      )}
    </span>
  )
}
