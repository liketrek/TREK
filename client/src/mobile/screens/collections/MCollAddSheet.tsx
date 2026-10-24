import { Check, Loader2, MapPin, Search, X } from 'lucide-react'
import type { Category, TranslationFn } from '../../../types'
import { STATUS_ORDER } from '../../../pages/collections/collectionsModel'
import MSheet from '../../components/MSheet'
import MCollCategoryPicker from './MCollCategoryPicker'
import { STATUS_SPEC } from './collectionsMobileModel'
import { CancelPill, Eyebrow, INPUT_CLS, PrimaryPill, SheetFooter, SheetHeader, TEXTAREA_CLS } from './MCollSheetKit'
import { str } from '../../../components/Collections/addPlaceModel'
import { useAddPlaceToCollection } from '../../../components/Collections/useAddPlaceToCollection'

interface MCollAddSheetProps {
  open: boolean
  collectionId: number | null
  collectionName: string
  /** Pickable target lists — used when opened without a fixed collectionId. */
  lists: { id: number; name: string; color?: string | null }[]
  categories: Category[]
  onClose: () => void
  onAdded: () => void
  t: TranslationFn
}

/**
 * "Add a place": maps search that fills the location, then name / category /
 * status / description before saving into the active list (duplicates are
 * reported by the server and surfaced as a toast).
 */
export default function MCollAddSheet({ open, collectionId, collectionName, lists, categories, onClose, onAdded, t }: MCollAddSheetProps) {
  const {
    query, setQuery, results, setResults, searching, name, setName, address, setAddress, categoryId, setCategoryId,
    status, setStatus, description, setDescription, saving, targetId, setTargetId, search, pick, save,
  } = useAddPlaceToCollection({ variant: 'sheet', open, collectionId, collectionName, lists, t, onClose, onAdded })

  return (
    <MSheet open={open} onClose={onClose} material="opaque" ariaLabel={t('collections.addPlace')}>
      <SheetHeader title={t('collections.addPlace')} onClose={onClose} closeLabel={t('common.close')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[14px]">
        {/* List picker — only when opened without a fixed target list */}
        {collectionId == null && (
          <div className="mb-[14px]">
            <Eyebrow className="mb-[6px]">{t('collections.pickList').toUpperCase()}</Eyebrow>
            {lists.length === 0 ? (
              <p className="font-geist text-[0.6875rem] text-m-muted">{t('collections.noListsYet')}</p>
            ) : (
              <div className="flex flex-wrap gap-[6px]">
                {lists.map(l => {
                  const on = targetId === l.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setTargetId(l.id)}
                      aria-pressed={on}
                      className={`flex items-center gap-[6px] rounded-full px-3 py-2 text-[0.71875rem] font-bold ${
                        on ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
                      }`}
                    >
                      <span className="h-[8px] w-[8px] flex-none rounded-full" style={{ background: l.color || '#6366F1' }} />
                      {l.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {/* Search — picking a result fills the location */}
        <div className="flex items-center gap-2 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] py-1 ps-[13px] pe-[6px]">
          <Search size={15} strokeWidth={2.2} className="flex-none text-m-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void search() } }}
            placeholder={t('collections.addPlaceSearch')}
            className="min-w-0 flex-1 bg-transparent py-2 font-[inherit] text-[0.8125rem] text-m-ink outline-none placeholder:text-m-faint"
          />
          <button
            type="button"
            onClick={search}
            disabled={!query.trim() || searching}
            className="flex h-8 flex-none items-center gap-[5px] rounded-[10px] bg-m-act px-[14px] text-[0.75rem] font-bold text-m-actfg disabled:opacity-40"
          >
            {searching ? <Loader2 size={13} className="animate-spin" /> : null}
            {t('common.search')}
          </button>
        </div>
        {results.length > 0 && (
          <div className="mt-[6px] max-h-[210px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-m-sheetop shadow-[0_20px_44px_-18px_rgba(0,0,0,.45)]">
            <div className="flex items-center justify-between px-[13px] pt-2">
              <Eyebrow>{t('common.search').toUpperCase()}</Eyebrow>
              <button type="button" onClick={() => setResults([])} aria-label={t('common.close')} className="text-m-faint">
                <X size={13} strokeWidth={2.2} />
              </button>
            </div>
            {results.map((r, i) => (
              <button key={i} type="button" onClick={() => pick(r)} className="flex w-full items-center gap-[10px] px-[13px] py-[10px] text-start">
                <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg bg-[color:var(--m-ic)] text-m-faint">
                  <MapPin size={14} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-semibold text-m-ink">{str(r.name)}</span>
                  {str(r.address) && <span className="block truncate font-geist text-[0.625rem] text-m-muted">{str(r.address)}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        <Eyebrow className="mb-[6px] mt-4">{t('common.name').toUpperCase()}</Eyebrow>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={t('common.name')} className={INPUT_CLS} />

        {/* Address (#1870): a picked hit fills it, but it stays editable so a
            hand-typed place can carry one too (the desktop dialog always could). */}
        <Eyebrow className="mb-[6px] mt-[14px]">{t('places.formAddress').toUpperCase()}</Eyebrow>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder={t('places.formAddressPlaceholder')} className={INPUT_CLS} />

        <Eyebrow className="mb-[6px] mt-[14px]">{t('collections.category').toUpperCase()}</Eyebrow>
        <MCollCategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} t={t} />

        <Eyebrow className="mb-[6px] mt-[14px]">{t('mobileCollections.status').toUpperCase()}</Eyebrow>
        <div className="flex gap-[6px]">
          {STATUS_ORDER.map(s => {
            const meta = STATUS_SPEC[s]
            const Icon = meta.icon
            const on = status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={on}
                className={`flex flex-1 items-center justify-center gap-[5px] rounded-full py-2 text-[0.71875rem] font-bold ${
                  on ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
                }`}
              >
                <Icon size={13} strokeWidth={2.2} style={on ? undefined : { color: meta.color }} />
                <span className="truncate">{t(meta.labelKey)}</span>
              </button>
            )
          })}
        </div>

        <Eyebrow className="mb-[6px] mt-[14px]">{t('collections.description').toUpperCase()}</Eyebrow>
        <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('collections.descriptionPlaceholder')} className={TEXTAREA_CLS} />
      </div>
      <SheetFooter>
        <CancelPill className="ms-auto" onClick={onClose}>{t('common.cancel')}</CancelPill>
        <PrimaryPill onClick={save} disabled={saving || !name.trim() || targetId == null}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.4} />} {t('common.add')}
        </PrimaryPill>
      </SheetFooter>
    </MSheet>
  )
}
