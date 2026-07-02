import React from 'react'
import { Footprints, MoveRight, type LucideIcon } from 'lucide-react'

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
  headsign?: string | null
  stops?: number
  from?: { name?: string; time?: string | null; track?: string | null }
  to?: { name?: string; time?: string | null; track?: string | null }
}


/**
 * A walk leg as a one-line centred divider — dashed rules left and right,
 * the walk itself in the middle (🚶 Walk to X · 4 min). Used by the journey
 * modal and the day-plan inline itinerary.
 */
export function TransitWalkDivider({ leg, t, size = 'md' }: {
  leg: TransitLegDisplay
  t: (k: string, p?: Record<string, string | number>) => string
  size?: 'sm' | 'md'
}) {
  const mins = leg.duration ? Math.round(leg.duration / 60) : null
  const ruleStyle: React.CSSProperties = { flex: 1, borderTop: '1.5px dashed var(--text-faint)', opacity: 0.75, minWidth: 12 }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: size === 'sm' ? '1px 0' : '2px 0' }}>
      <span style={ruleStyle} />
      <span className="text-content-faint" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: size === 'sm' ? 'calc(10px * var(--fs-scale-caption, 1))' : 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
        <Footprints size={size === 'sm' ? 11 : 12} style={{ flexShrink: 0 }} />
        {t('transit.walkTo', { name: leg.to?.name || '' })}{mins ? ` · ${t('transit.min', { count: mins })}` : ''}
      </span>
      <span style={ruleStyle} />
    </div>
  )
}

/**
 * The itinerary folded out right inside the day-plan row (#1065): one compact
 * line per leg — time, badge or foot icon, stations — sized for the sidebar.
 */
export function TransitItineraryInline({ legs, t }: {
  legs: TransitLegDisplay[]
  t: (k: string, p?: Record<string, string | number>) => string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {legs.map((leg, i) => {
        if (leg.mode === 'WALK') return <TransitWalkDivider key={i} leg={leg} t={t} size="sm" />
        const mins = leg.duration ? Math.round(leg.duration / 60) : null
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <span className="text-content-muted" style={{ width: 34, flexShrink: 0, textAlign: 'right', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, paddingTop: 1 }}>
              {leg.from?.time || ''}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', borderRadius: 4, padding: '0 5px',
              fontSize: 'calc(9.5px * var(--fs-scale-caption, 1))', fontWeight: 700, lineHeight: '15px', flexShrink: 0,
              background: leg.line_color || 'var(--bg-tertiary)',
              color: leg.line_color ? (leg.line_text_color || '#fff') : 'var(--text-primary)',
            }}>
              {leg.line || leg.mode}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-content" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leg.from?.name}</span>
                <MoveRight size={10} className="text-content-faint" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leg.to?.name}</span>
              </div>
              <div className="text-content-faint" style={{ fontSize: 'calc(9.5px * var(--fs-scale-caption, 1))', marginTop: 1 }}>
                {[
                  mins ? t('transit.min', { count: mins }) : null,
                  leg.stops ? t('transit.stops', { count: leg.stops }) : null,
                  leg.from?.track ? t('transit.platform', { track: leg.from.track }) : null,
                ].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


/** "1 h 9 min" / "42 min" from seconds — shared by all transit surfaces. */
export function fmtTransitDuration(seconds: number, t: (k: string, p?: Record<string, string | number>) => string): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return t('transit.min', { count: mins })
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

export interface TransitMetaItem {
  icon?: LucideIcon
  text: string
  /** De-emphasised (operator names and the like). */
  dim?: boolean
}

/**
 * A quiet badge row replacing dot-joined meta text ("21:06 - 22:15 - 69 min -
 * 14 stops ..."): each fact becomes a small chip, optional icon in front.
 */
export function TransitMetaBadges({ items, size = 'md' }: { items: TransitMetaItem[]; size?: 'sm' | 'md' }) {
  const font = size === 'sm' ? 'calc(10px * var(--fs-scale-caption, 1))' : 'calc(10.5px * var(--fs-scale-caption, 1))'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
      {items.filter(i => i.text).map(({ icon: Icon, text, dim }, i) => (
        <span
          key={i}
          className={dim ? 'bg-surface-card text-content-faint' : 'bg-surface-card text-content-muted'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: size === 'sm' ? '1px 6px' : '2px 8px', borderRadius: 6,
            fontSize: font, fontWeight: 500, whiteSpace: 'nowrap',
            border: '1px solid var(--border-faint)',
          }}
        >
          {Icon && <Icon size={size === 'sm' ? 9 : 10} strokeWidth={2} />}
          {text}
        </span>
      ))}
    </span>
  )
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
