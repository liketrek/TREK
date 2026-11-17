import { MapPin, Tag } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { TileHeader } from '../sheets/MTripSheetUi'
import { getCategoryIcon } from '../../../../components/shared/categoryIcons'
import { useTranslation } from '../../../../i18n'
import type { Category } from '../../../../types'

interface MPlacesBulkCategorySheetProps {
  open: boolean
  count: number
  categories: Category[]
  onPick: (categoryId: number | null) => void
  onClose: () => void
}

/**
 * Category picker of the places-pool selection toolbar: one tap applies the
 * category to every selected place (mobile counterpart of
 * PlacesBulkCategoryModal).
 */
export default function MPlacesBulkCategorySheet({ open, count, categories, onPick, onClose }: MPlacesBulkCategorySheetProps) {
  const { t } = useTranslation()
  return (
    <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={t('places.changeCategory')}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<Tag size={19} strokeWidth={1.8} />}
          title={t('places.changeCategory')}
          sub={t('places.selectionCount', { count })}
          onClose={onClose}
          closeLabel={t('common.close')}
        />
      </div>
      <div className="m-scroll-fade mt-2 min-h-0 flex-1 overflow-y-auto px-[10px] pb-3 pt-[10px]">
        {categories.map(c => {
          const CatIcon = getCategoryIcon(c.icon)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-[11px] text-start text-[0.84375rem] font-medium text-m-ink"
            >
              <CatIcon size={16} strokeWidth={2} className="flex-none" style={{ color: c.color || 'var(--m-muted)' }} />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => onPick(null)}
          className={`flex w-full items-center gap-3 px-2 py-[11px] text-start text-[0.84375rem] font-medium text-m-muted ${
            categories.length > 0 ? 'border-t border-[color:var(--m-rowbr)]' : ''
          }`}
        >
          <MapPin size={16} strokeWidth={2} className="flex-none text-m-faint" />
          <span className="min-w-0 flex-1 truncate">{t('places.noCategory')}</span>
        </button>
      </div>
    </MSheet>
  )
}
