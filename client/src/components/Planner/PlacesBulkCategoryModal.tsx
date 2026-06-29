import { createPortal } from 'react-dom'
import { X, MapPin } from 'lucide-react'
import { getCategoryIcon } from '../shared/categoryIcons'
import { useTranslation } from '../../i18n'
import type { Category } from '../../types'

interface PlacesBulkCategoryModalProps {
  count: number
  categories: Category[]
  onPick: (categoryId: number | null) => void
  onClose: () => void
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
  padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 'calc(13px * var(--fs-scale-body, 1))', textAlign: 'left',
}
const hoverOn = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' }
const hoverOff = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent' }

/**
 * Popup for the Places selection toolbar: pick one category to apply to every
 * currently-selected place. Reuses the category swatch styling from the header's
 * filter dropdown; clicking a row applies immediately and closes.
 */
export function PlacesBulkCategoryModal({ count, categories, onPick, onClose }: PlacesBulkCategoryModalProps) {
  const { t } = useTranslation()
  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div className="bg-surface-card text-content" style={{
        borderRadius: 14, padding: '18px 20px', width: '100%', maxWidth: 380,
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)', border: '1px solid var(--border-faint)', fontFamily: 'inherit',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{t('places.changeCategory')}</span>
          <button onClick={onClose} aria-label={t('common.close')} className="text-content-muted" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        <p className="text-content-faint" style={{ fontSize: 12, marginBottom: 12 }}>{t('places.selectionCount', { count })}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflowY: 'auto' }}>
          {categories.map(c => {
            const CatIcon = getCategoryIcon(c.icon)
            return (
              <button key={c.id} onClick={() => onPick(c.id)} className="text-content bg-transparent" style={rowStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                <CatIcon size={14} strokeWidth={2} color={c.color || 'var(--text-muted)'} />
                <span style={{ flex: 1 }}>{c.name}</span>
              </button>
            )
          })}
          <button onClick={() => onPick(null)} className="text-content-muted bg-transparent" style={{ ...rowStyle, borderTop: categories.length > 0 ? '1px solid var(--border-faint)' : 'none', marginTop: categories.length > 0 ? 2 : 0 }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            <MapPin size={14} strokeWidth={2} color="var(--text-faint)" />
            <span style={{ flex: 1 }}>{t('places.noCategory')}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
