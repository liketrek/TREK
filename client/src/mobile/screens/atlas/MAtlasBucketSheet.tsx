import { MapPin, Plus, Search, Star, Trash2, X } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import { A2_TO_A3 } from '../../../pages/atlas/atlasModel'
import type { BucketItem } from '../../../pages/atlas/atlasModel'
import type { AtlasController } from './atlasController'

interface MAtlasBucketSheetProps {
  atlas: AtlasController
  open: boolean
  onClose: () => void
}

const inputCls =
  'w-full rounded-[14px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] px-[14px] py-[11px] text-[0.84375rem] font-medium text-m-ink outline-none placeholder:text-m-faint'

function itemCountryA2(item: BucketItem): string | null {
  const code = item.country_code
  if (!code) return null
  if (code.length === 2) return code
  return Object.entries(A2_TO_A3).find(([, v]) => v === code)?.[0] ?? null
}

/**
 * Bucket-list sheet, entered via the chip on the stats card. Lists every
 * bucket item with country, target month, coordinates and notes, and carries
 * the full add flow (POI search or free name, notes, target month).
 */
export default function MAtlasBucketSheet({ atlas, open, onClose }: MAtlasBucketSheetProps) {
  const {
    t,
    language,
    resolveName,
    bucketList,
    showBucketAdd,
    setShowBucketAdd,
    bucketForm,
    setBucketForm,
    bucketSearch,
    setBucketSearch,
    bucketSearchResults,
    setBucketSearchResults,
    bucketSearching,
    handleBucketPoiSearch,
    handleAddBucketItem,
    handleDeleteBucketItem,
  } = atlas

  const resetForm = (): void => {
    setShowBucketAdd(false)
    setBucketForm({ name: '', notes: '', lat: '', lng: '', target_date: '' })
    setBucketSearch('')
    setBucketSearchResults([])
  }

  const close = (): void => {
    resetForm()
    onClose()
  }

  // Own POI pick instead of the hook's handleSelectBucketPoi: keeps the notes
  // and target month the user may already have typed into the form.
  const pickPoi = (result: { name?: string; lat?: number; lng?: number }): void => {
    setBucketForm({ ...bucketForm, name: result.name || bucketSearch, lat: String(result.lat ?? ''), lng: String(result.lng ?? '') })
    setBucketSearchResults([])
    setBucketSearch('')
  }

  const fmtTarget = (targetDate: string): string => {
    const [y, m] = targetDate.split('-')
    return m ? new Date(Number(y), Number(m) - 1).toLocaleDateString(language, { month: 'short', year: 'numeric' }) : y
  }

  const itemSub = (item: BucketItem): string => {
    const a2 = itemCountryA2(item)
    return [
      a2 ? resolveName(a2) : null,
      item.target_date ? fmtTarget(item.target_date) : null,
      item.lat != null && item.lng != null ? `${item.lat.toFixed(2)}, ${item.lng.toFixed(2)}` : null,
      item.notes || null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  return (
    <MSheet open={open} onClose={close} variant="bottom" material="glass" ariaLabel={t('atlas.bucketTab')}>
      <div className="flex min-h-0 flex-col p-4">
        <div className="flex items-center gap-[10px] px-1 pb-3">
          <Star size={17} strokeWidth={2.2} className="flex-none text-[color:var(--m-st-pending)]" />
          <div className="min-w-0 flex-1 truncate text-[0.9375rem] font-extrabold text-m-ink">
            {t('atlas.bucketTab')}
            {bucketList.length > 0 && (
              <span className="ml-[6px] font-geist text-[0.75rem] font-semibold tabular-nums text-m-faint">{bucketList.length}</span>
            )}
          </div>
          <MIconBtn variant="neutral" size={34} onClick={close} ariaLabel={t('common.close')}>
            <X size={16} strokeWidth={2.2} />
          </MIconBtn>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {bucketList.length === 0 && !showBucketAdd && (
            <div className="px-4 py-8 text-center">
              <div className="text-[0.84375rem] font-semibold text-m-muted">{t('atlas.bucketEmpty')}</div>
              <div className="mt-1 font-geist text-[0.6875rem] text-m-faint">{t('atlas.bucketEmptyHint')}</div>
            </div>
          )}
          {bucketList.map((item) => {
            const a2 = itemCountryA2(item)
            const sub = itemSub(item)
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-[18px] bg-[color:var(--m-ic)] px-[14px] py-[11px]">
                {a2 ? (
                  <img
                    src={`https://flagcdn.com/w40/${a2.toLowerCase()}.png`}
                    alt=""
                    className="h-[17px] w-6 flex-none rounded-[3px] object-cover shadow-[0_1px_3px_rgba(0,0,0,.25)]"
                  />
                ) : (
                  <Star size={16} strokeWidth={2.2} className="flex-none text-[color:var(--m-st-pending)]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.84375rem] font-semibold text-m-ink">{item.name}</div>
                  {sub && <div className="mt-[1px] truncate font-geist text-[0.6875rem] text-m-muted">{sub}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteBucketItem(item.id)}
                  aria-label={t('atlas.unmark')}
                  className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-m-faint active:bg-[color:var(--m-ic)]"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            )
          })}
        </div>

        {showBucketAdd ? (
          <div className="space-y-2 pt-3">
            <div className="relative">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={bucketForm.name || bucketSearch}
                  onChange={(e) => {
                    const v = e.target.value
                    if (bucketForm.name) setBucketForm({ ...bucketForm, name: v })
                    else setBucketSearch(v)
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return
                    if (bucketForm.name) handleAddBucketItem()
                    else handleBucketPoiSearch()
                  }}
                  placeholder={t('atlas.bucketNamePlaceholder')}
                  className={`${inputCls} min-w-0 flex-1`}
                />
                {bucketForm.name ? (
                  <MIconBtn
                    variant="neutral"
                    size={40}
                    onClick={() => {
                      setBucketForm({ ...bucketForm, name: '', lat: '', lng: '' })
                      setBucketSearch('')
                    }}
                    ariaLabel={t('common.cancel')}
                  >
                    <X size={15} strokeWidth={2.2} />
                  </MIconBtn>
                ) : (
                  <button
                    type="button"
                    onClick={handleBucketPoiSearch}
                    disabled={bucketSearching}
                    aria-label={t('common.search')}
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-[14px] bg-m-act text-m-actfg disabled:opacity-50"
                  >
                    <Search size={16} strokeWidth={2.2} />
                  </button>
                )}
              </div>
              {bucketSearchResults.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 z-10 mb-2 max-h-40 divide-y divide-[color:var(--m-rowbr)] overflow-y-auto rounded-[16px] border border-[color:var(--m-shbr)] bg-[color:var(--m-sheetop)] shadow-[0_12px_30px_-14px_rgba(0,0,0,.4)]">
                  {bucketSearchResults.slice(0, 6).map((result, i) => (
                    <button key={i} type="button" onClick={() => pickPoi(result)} className="flex w-full flex-col px-[14px] py-[9px] text-left active:bg-[color:var(--m-ic)]">
                      <span className="text-[0.8125rem] font-semibold text-m-ink">{result.name}</span>
                      {result.address && <span className="font-geist text-[0.625rem] text-m-faint">{result.address}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {bucketForm.lat && bucketForm.lng && (
              <div className="flex items-center gap-1 px-1 font-geist text-[0.625rem] text-m-faint">
                <MapPin size={10} strokeWidth={2.2} />
                {Number(bucketForm.lat).toFixed(4)}, {Number(bucketForm.lng).toFixed(4)}
              </div>
            )}
            <input
              value={bucketForm.notes}
              onChange={(e) => setBucketForm({ ...bucketForm, notes: e.target.value })}
              placeholder={t('atlas.bucketNotesPlaceholder')}
              className={inputCls}
            />
            <input
              type="month"
              value={bucketForm.target_date}
              onChange={(e) => setBucketForm({ ...bucketForm, target_date: e.target.value })}
              aria-label={t('atlas.bucketWhen')}
              className={inputCls}
            />
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={resetForm} className="flex-1 rounded-full bg-[color:var(--m-ic)] py-[11px] text-[0.8125rem] font-bold text-m-ink">
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddBucketItem}
                disabled={!bucketForm.name.trim()}
                className="flex-1 rounded-full bg-m-act py-[11px] text-[0.8125rem] font-bold text-m-actfg disabled:opacity-50"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowBucketAdd(true)}
            className="mt-3 flex w-full flex-none items-center justify-center gap-[6px] rounded-full border border-dashed border-[color:var(--m-rowbr)] py-[10px] font-geist text-[0.75rem] font-semibold text-m-muted"
          >
            <Plus size={13} strokeWidth={2.4} />
            {t('atlas.addPoi')}
          </button>
        )}
      </div>
    </MSheet>
  )
}
