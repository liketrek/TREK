import { useId } from 'react'
import { MapPin, Tag } from 'lucide-react'
import { getCategoryIcon } from '../shared/categoryIcons'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { useTranslation } from '../../i18n'
import { tintOf } from './planParts'
import type { Category } from '../../types'

interface PlacesBulkCategoryModalProps {
  count: number
  categories: Category[]
  onPick: (categoryId: number | null) => void
  onClose: () => void
}

/**
 * A category's icon on a wash of its colour, the square the category lists of the
 * places column are made of. Without a category it is the neutral pin.
 */
export function CategoryTile({ category, size = 24 }: { category?: Pick<Category, 'icon' | 'color'> | null; size?: number }) {
  if (!category) {
    return (
      <span className="grid flex-none place-items-center rounded-[7px] bg-surface-tertiary text-content-faint" style={{ width: size, height: size }}>
        <MapPin size={Math.round(size * 0.5)} strokeWidth={2.2} />
      </span>
    )
  }
  const Icon = getCategoryIcon(category.icon)
  const color = category.color || 'var(--text-muted)'
  return (
    <span className="grid flex-none place-items-center rounded-[7px]" style={{ width: size, height: size, background: tintOf(color, 16) }}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.2} style={{ color }} />
    </span>
  )
}

const ROW = 'flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left hover:bg-surface-hover'

/**
 * Popup for the Places selection toolbar: pick one category to apply to every
 * currently-selected place. Clicking a row applies it at once and closes.
 */
export function PlacesBulkCategoryModal({ count, categories, onPick, onClose }: PlacesBulkCategoryModalProps) {
  const { t } = useTranslation()
  const titleId = useId()
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={titleId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><Tag size={20} strokeWidth={1.9} className="text-content" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={titleId}
          onClose={onClose}
          title={t('places.changeCategory')}
          sub={t('places.selectionCount', { count })}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
        </DialogFooter>
      )}
    >
      <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
        {categories.map(c => (
          <button type="button" key={c.id} onClick={() => onPick(c.id)} className={ROW} style={fs(13, 'body')}>
            <CategoryTile category={c} size={28} />
            <span className="min-w-0 flex-1 truncate font-medium text-content">{c.name}</span>
          </button>
        ))}
        {categories.length > 0 && <div className="mx-2 my-1 h-px bg-edge-faint" />}
        <button type="button" onClick={() => onPick(null)} className={ROW} style={fs(13, 'body')}>
          <CategoryTile size={28} />
          <span className="min-w-0 flex-1 truncate font-medium text-content-muted">{t('places.noCategory')}</span>
        </button>
      </div>
    </DialogShell>
  )
}
