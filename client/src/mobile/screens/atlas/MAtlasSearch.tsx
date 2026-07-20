import { useEffect, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { useTranslation } from '../../../i18n'

interface CountryOption {
  code: string
  label: string
}

interface MAtlasSearchProps {
  open: boolean
  onClose: () => void
  /** All searchable countries (code + localized label). */
  options: CountryOption[]
  /** Shown while the query is empty: recently visited + bucket countries. */
  suggestions: CountryOption[]
  isVisited: (code: string) => boolean
  isOnBucketList: (code: string) => boolean
  onSelect: (code: string) => void
}

const statusCls = 'flex-none font-geist text-[0.625rem] font-bold uppercase tracking-[.04em] text-m-faint'

/**
 * Full-screen country search on a blurred scrim. Typing filters the country
 * list; while empty the suggestion list (visited + bucket countries) fills
 * the result card. Selecting a row flies the map to the country.
 */
export default function MAtlasSearch({
  open,
  onClose,
  options,
  suggestions,
  isVisited,
  isOnBucketList,
  onSelect,
}: MAtlasSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  if (!open) return null

  const q = query.trim().toLowerCase()
  const rows = q ? options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 6) : suggestions

  const scrimCls = 'm-fade-in fixed inset-0 z-[70] flex flex-col bg-[rgba(16,16,19,.28)] px-[18px] pt-[calc(var(--m-safe-top,12px)+12px)] backdrop-blur-[22px] backdrop-saturate-[1.6]' // theme-lint-disable — fixed scrim value from the design

  return (
    <div className={scrimCls} onClick={onClose}>
      <div className="flex items-center gap-[10px]" onClick={(e) => e.stopPropagation()}>
        <label className="flex min-w-0 flex-1 items-center gap-[10px] rounded-[18px] border border-[color:var(--m-gbr)] bg-[color:var(--m-sheetop)] px-4 py-[14px] shadow-[0_12px_30px_-14px_rgba(0,0,0,.4)]">
          <Search size={18} strokeWidth={2.2} className="flex-none text-m-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'Enter' && rows.length > 0) onSelect(rows[0].code)
            }}
            placeholder={t('atlas.searchCountry')}
            className="min-w-0 flex-1 bg-transparent font-geist text-[0.9375rem] font-semibold text-m-ink outline-none placeholder:font-normal placeholder:text-m-faint"
          />
        </label>
        <button type="button" onClick={onClose} className="flex-none px-1 font-geist text-[0.9375rem] font-semibold text-white">
          {t('common.cancel')}
        </button>
      </div>

      {rows.length > 0 && (
        <div
          className="m-pop-in mt-[14px] divide-y divide-[color:var(--m-rowbr)] overflow-hidden rounded-[20px] border border-[color:var(--m-gbr)] bg-[color:var(--m-sheetop)] shadow-[0_20px_44px_-18px_rgba(0,0,0,.4)]"
          onClick={(e) => e.stopPropagation()}
        >
          {rows.map((r) => (
            <button
              key={r.code}
              type="button"
              onClick={() => onSelect(r.code)}
              className="flex w-full items-center gap-3 px-4 py-[14px] text-left active:bg-[color:var(--m-ic)]"
            >
              <img
                src={`https://flagcdn.com/w40/${r.code.toLowerCase()}.png`}
                alt=""
                className="h-6 w-[34px] flex-none rounded-[5px] object-cover shadow-[0_1px_3px_rgba(0,0,0,.25)]"
              />
              <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-extrabold text-m-ink">{r.label}</span>
              {isVisited(r.code) ? (
                <span className={statusCls}>{t('mobileAtlas.visited')}</span>
              ) : isOnBucketList(r.code) ? (
                <span className={statusCls}>{t('atlas.bucketTab')}</span>
              ) : null}
              <ChevronRight size={17} strokeWidth={2} className="flex-none text-m-faint" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
