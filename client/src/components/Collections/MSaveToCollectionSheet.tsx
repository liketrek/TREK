import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Check, Loader2, Plus, X } from 'lucide-react'
import MSheet from '../../mobile/components/MSheet'
import MIconBtn from '../../mobile/components/MIconBtn'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { collectionsApi } from '../../api/collections'
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore'
import { getApiErrorMessage } from '../../utils/apiError'
import type { Collection, CollectionMembership } from '@trek/shared'

/**
 * Mobile counterpart of SaveToCollectionModal — the same store-driven list
 * picker (load lists + membership, toggle the place in/out of each), dressed in
 * the mobile design language (MSheet card, m-* tokens) so it matches the place
 * detail sheet. Rendered instead of the desktop modal on phones (see App.tsx).
 */
export default function MSaveToCollectionSheet() {
  const target = useSaveToCollectionStore(s => s.target)
  const close = useSaveToCollectionStore(s => s.close)
  const bumpVersion = useSaveToCollectionStore(s => s.bumpVersion)
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()

  const [lists, setLists] = useState<Collection[]>([])
  const [membership, setMembership] = useState<CollectionMembership | null>(null)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const membershipQuery = useMemo(() => {
    if (!target) return null
    return {
      google_place_id: target.google_place_id ?? undefined,
      google_ftid: target.google_ftid ?? undefined,
      name: target.name,
      lat: target.lat ?? undefined,
      lng: target.lng ?? undefined,
    }
  }, [target])

  const refreshMembership = useCallback(async () => {
    if (!membershipQuery) return
    try {
      setMembership(await collectionsApi.membership(membershipQuery))
    } catch {
      setMembership({ saved: false, lists: [] })
    }
  }, [membershipQuery])

  // Load lists + membership whenever the picker opens for a new target.
  useEffect(() => {
    if (!target) return
    let cancelled = false
    setLoading(true)
    setMembership(null)
    Promise.all([
      collectionsApi.list().catch(() => ({ collections: [], incomingInvites: [] })),
      membershipQuery
        ? collectionsApi.membership(membershipQuery).catch(() => ({ saved: false, lists: [] as CollectionMembership['lists'] }))
        : Promise.resolve({ saved: false, lists: [] as CollectionMembership['lists'] }),
    ])
      .then(([listRes, m]) => {
        if (cancelled) return
        setLists(listRes.collections)
        setMembership(m)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  const savedByCollection = new Map<number, number>()
  for (const l of membership?.lists ?? []) savedByCollection.set(l.collection_id, l.place_id)

  const handleToggle = async (list: Collection) => {
    if (busyId != null || !target) return
    const savedPlaceId = savedByCollection.get(list.id)
    setBusyId(list.id)
    try {
      if (savedPlaceId != null) {
        await collectionsApi.deletePlace(savedPlaceId)
        toast.success(t('collections.removedFromList', { name: list.name }))
      } else {
        await collectionsApi.savePlace({
          collection_id: list.id,
          source_trip_id: target.source_trip_id ?? null,
          source_place_id: target.source_place_id ?? null,
          name: target.name,
          description: target.description ?? null,
          lat: target.lat ?? null,
          lng: target.lng ?? null,
          address: target.address ?? null,
          category_id: target.category_id ?? null,
          price: target.price ?? null,
          currency: target.currency ?? null,
          notes: target.notes ?? null,
          image_url: target.image_url ?? null,
          google_place_id: target.google_place_id ?? null,
          google_ftid: target.google_ftid ?? null,
          osm_id: target.osm_id ?? null,
          website: target.website ?? null,
          phone: target.phone ?? null,
          force: true,
        })
        toast.success(t('collections.addedToList', { name: list.name }))
      }
      await refreshMembership()
      bumpVersion()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <MSheet open={!!target} onClose={close} variant="card" material="glass" ariaLabel={t('collections.pickList')}>
      {/* Header — mirrors the place detail sheet: icon + title + target name + close */}
      <div className="flex-none px-[18px] pt-4">
        <div className="flex items-start gap-3">
          <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-[color:var(--m-ic)] text-m-muted">
            <Bookmark size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[1rem] font-bold leading-snug">{t('collections.pickList')}</div>
            {target?.name && (
              <div className="mt-[2px] truncate font-geist text-[0.6875rem] text-m-muted">{target.name}</div>
            )}
          </div>
          <MIconBtn variant="neutral" size={34} onClick={close} ariaLabel={t('common.close')}>
            <X size={15} strokeWidth={2.2} />
          </MIconBtn>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[14px] pb-[16px] pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-m-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--m-ic)] text-m-faint">
              <Bookmark size={20} strokeWidth={2} />
            </span>
            <p className="mb-3 font-geist text-[0.75rem] text-m-faint">{t('collections.noListsYet')}</p>
            <button
              type="button"
              onClick={() => { close(); navigate('/collections') }}
              className="inline-flex items-center gap-1.5 rounded-full bg-m-act px-4 py-[9px] text-[0.75rem] font-semibold text-m-actfg"
            >
              <Plus size={14} strokeWidth={2.2} /> {t('collections.newList')}
            </button>
          </div>
        ) : (
          lists.map(list => {
            const saved = savedByCollection.has(list.id)
            const busy = busyId === list.id
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => handleToggle(list)}
                disabled={busyId != null}
                className={`mt-2 flex w-full items-center gap-[11px] rounded-[14px] border px-3 py-[10px] text-left disabled:opacity-60 ${
                  saved
                    ? 'border-[color:var(--m-act)] bg-[color:var(--m-inner)]'
                    : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]'
                }`}
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
                {list.is_owner === false && (
                  <span className="flex-none font-geist text-[0.5625rem] font-bold uppercase tracking-[.05em] text-m-faint">
                    {t('collections.shared')}
                  </span>
                )}
                <span
                  className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full ${
                    saved ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] text-m-faint'
                  }`}
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : saved ? <BookmarkCheck size={14} strokeWidth={2} /> : <Check size={14} strokeWidth={2} />}
                </span>
              </button>
            )
          })
        )}
      </div>

      {lists.length > 0 && (
        <div className="flex flex-none items-center justify-between gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] py-3">
          <button
            type="button"
            onClick={() => { close(); navigate('/collections') }}
            className="text-[0.78125rem] font-semibold text-[color:var(--m-act)]"
          >
            {t('collections.viewInCollection')}
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-[color:var(--m-ic)] px-4 py-[8px] text-[0.78125rem] font-semibold text-m-ink"
          >
            {t('common.close')}
          </button>
        </div>
      )}
    </MSheet>
  )
}
