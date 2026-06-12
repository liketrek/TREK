import { RotateCw, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { Tooltip } from '../shared/Tooltip'
import { POI_CATEGORIES } from './poiCategories'

interface Props {
  active: Set<string>
  onToggle: (key: string) => void
  loadingKeys?: Set<string>
  /** categories whose last fetch failed → show a retry affordance */
  errorKeys?: Set<string>
  /** true when the map moved since the last search → offer "search this area" */
  moved?: boolean
  onSearchArea?: () => void
}

// Frosted, icon-only segmented control that floats over the map. Active segments
// fill with the category colour (matching their markers); the label shows in a
// custom tooltip on hover so the pill stays compact and never needs to scroll.
export default function PoiCategoryPill({ active, onToggle, loadingKeys, errorKeys, moved, onSearchArea }: Props) {
  const { t } = useTranslation()
  const anyError = !!errorKeys && Array.from(active).some(k => errorKeys.has(k))

  const frosted: React.CSSProperties = {
    background: 'var(--sidebar-bg)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: 'var(--sidebar-shadow, 0 4px 16px rgba(0,0,0,0.14))',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 999, pointerEvents: 'auto', ...frosted }}>
        {POI_CATEGORIES.map(cat => {
          const on = active.has(cat.key)
          const loading = loadingKeys?.has(cat.key)
          return (
            <Tooltip key={cat.key} label={t(cat.labelKey)} placement="bottom">
              <button
                type="button"
                onClick={() => onToggle(cat.key)}
                aria-pressed={on}
                aria-label={t(cat.labelKey)}
                className={on ? '' : 'text-content-muted'}
                style={{
                  position: 'relative',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: on ? cat.color : 'transparent',
                  color: on ? '#fff' : undefined,
                  transition: 'background 0.14s, color 0.14s',
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
              >
                {loading ? (
                  <span
                    className="animate-spin"
                    style={{
                      width: 14, height: 14, borderRadius: 999, display: 'inline-block',
                      border: '2px solid', borderColor: on ? 'rgba(255,255,255,0.45)' : 'var(--border-primary)',
                      borderTopColor: on ? '#fff' : 'var(--text-muted)',
                    }}
                  />
                ) : (
                  <cat.Icon size={16} strokeWidth={2} />
                )}
                {on && !loading && errorKeys?.has(cat.key) && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2, width: 8, height: 8,
                    borderRadius: 999, background: '#ef4444', border: '1.5px solid var(--sidebar-bg)',
                  }} />
                )}
              </button>
            </Tooltip>
          )
        })}
      </div>

      {(moved || anyError) && active.size > 0 && (
        <button
          type="button"
          onClick={onSearchArea}
          className="text-content"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 13px', borderRadius: 999, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: 'inherit', pointerEvents: 'auto',
            color: anyError ? '#ef4444' : undefined,
            ...frosted,
          }}
        >
          {anyError
            ? <AlertTriangle size={13} strokeWidth={2.4} />
            : <RotateCw size={13} strokeWidth={2.4} />}
          {t('poi.searchThisArea')}
        </button>
      )}
    </div>
  )
}
