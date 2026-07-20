import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bookmark, Loader2, Plus, X } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MIconBtn from '../../../components/MIconBtn'
import { useTranslation } from '../../../../i18n'
import { useToast } from '../../../../components/shared/Toast'
import { collectionsApi } from '../../../../api/collections'
import { getApiErrorMessage } from '../../../../utils/apiError'
import type { Collection } from '@trek/shared'

interface MPlacesSaveToCollectionSheetProps {
  open: boolean
  tripId: number
  placeIds: number[]
  onClose: () => void
  /** Called after a successful save (clears the pool selection). */
  onDone: () => void
}

/**
 * Bulk "save to collection" of the places-pool selection toolbar: pick one of
 * the user's lists and copy every selected place into it (server dedups) —
 * mobile counterpart of SaveTripPlacesToListModal.
 */
export default function MPlacesSaveToCollectionSheet({ open, tripId, placeIds, onClose, onDone }: MPlacesSaveToCollectionSheetProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [lists, setLists] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setSearch('')
    collectionsApi.list()
      // Only lists the user can add to; the server still enforces this.
      .then(res => { if (!cancelled) setLists((res.collections ?? []).filter(c => c.is_owner !== false)) })
      .catch(() => { if (!cancelled) setLists([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? lists.filter(l => l.name.toLowerCase().includes(q)) : lists
  }, [lists, search])

  const pick = async (list: Collection) => {
    if (busyId != null || placeIds.length === 0) return
    setBusyId(list.id)
    try {
      const res = await collectionsApi.saveFromTripMany(list.id, tripId, placeIds)
      if (res.copied > 0) toast.success(t('collections.addedNToList', { count: res.copied, name: list.name }))
      if (res.skipped.length > 0) toast.info(t('collections.skippedDuplicates', { count: res.skipped.length }))
      if (res.copied === 0 && res.skipped.length === 0) toast.info(t('collections.copyNothing'))
      onDone()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <MSheet open={open} onClose={onClose} variant="card" ariaLabel={t('collections.saveNToList', { count: placeIds.length })}>
      <div className="flex flex-none items-center border-b border-[color:var(--m-rowbr)] px-[18px] pb-[11px] pt-4">
        <div className="min-w-0 flex-1 text-[1.03125rem] font-bold text-m-ink">
          {t('collections.saveNToList', { count: placeIds.length })}
        </div>
        <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={t('common.close')}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[14px] pb-[14px] pt-1">
        {lists.length > 5 && (
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="mt-2 box-border w-full rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[13px] py-[10px] text-[0.8125rem] font-medium text-m-ink outline-none placeholder:text-m-faint"
          />
        )}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-m-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center font-geist text-[0.71875rem] text-m-faint">{t('collections.noOwnLists')}</p>
        ) : (
          filtered.map(list => {
            const busy = busyId === list.id
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => pick(list)}
                disabled={busyId != null}
                className="mt-2 flex w-full items-center gap-[11px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px] text-left disabled:opacity-60"
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-white"
                  style={{ background: list.color || '#6366f1' }}
                >
                  <Bookmark size={15} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-semibold text-m-ink">{list.name}</span>
                  <span className="mt-px block font-geist text-[0.65625rem] text-m-muted">
                    {t('collections.placeCount', { count: list.place_count ?? 0 })}
                  </span>
                </span>
                {busy
                  ? <Loader2 size={15} className="flex-none animate-spin text-m-faint" />
                  : <ArrowRight size={15} strokeWidth={2} className="flex-none text-m-faint" />}
              </button>
            )
          })
        )}
        <p className="mt-3 flex items-center gap-[6px] font-geist text-[0.65625rem] text-m-muted">
          <Plus size={12} strokeWidth={2.2} className="flex-none" />
          {t('collections.saveToListHint')}
        </p>
      </div>
    </MSheet>
  )
}
