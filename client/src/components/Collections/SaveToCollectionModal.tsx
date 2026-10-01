import React, { useEffect, useId, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Bookmark, BookmarkCheck, Check, CheckCircle2, Loader2, Plus } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, PILL, fs } from '../shared/DialogShell'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { collectionsApi } from '../../api/collections'
import StatusBadge from './StatusBadge'
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore'
import { getApiErrorMessage } from '../../utils/apiError'
import type { Collection, CollectionMembership, CollectionStatus } from '@trek/shared'

/**
 * Globally-mounted list picker for the "Save to Collection" entry points
 * (PlaceInspector footer button + the two trip-sidebar context menus). Reads the
 * active target from saveToCollectionStore, shows every list the user owns or
 * co-owns, and toggles the place in/out of each — a check marks the lists that
 * already hold it. Each change refreshes membership and bumps the store version
 * so the inspector bookmark indicator stays in sync. One mount, no prop drilling.
 */
export default function SaveToCollectionModal(): React.ReactElement | null {
  const target = useSaveToCollectionStore(s => s.target)
  const close = useSaveToCollectionStore(s => s.close)
  const bumpVersion = useSaveToCollectionStore(s => s.bumpVersion)
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const labelId = useId()

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
      const m = await collectionsApi.membership(membershipQuery)
      setMembership(m)
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
    void Promise.all([collectionsApi.list().catch(() => ({ collections: [], incomingInvites: [] })), membershipQuery ? collectionsApi.membership(membershipQuery).catch(() => ({ saved: false, lists: [] as CollectionMembership['lists'] })) : Promise.resolve({ saved: false, lists: [] as CollectionMembership['lists'] })])
      .then(([listRes, m]) => {
        if (cancelled) return
        setLists(listRes.collections)
        setMembership(m)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  if (!target) return null

  const savedByCollection = new Map<number, CollectionMembership['lists'][number]>()
  for (const l of membership?.lists ?? []) savedByCollection.set(l.collection_id, l)

  /** Lists holding this place that the viewer may edit and that are not visited yet. */
  const unvisited = (membership?.lists ?? []).filter(l => l.can_edit && l.status !== 'visited')

  const handleStatus = async (entry: CollectionMembership['lists'][number], next: CollectionStatus) => {
    if (busyId != null) return
    setBusyId(entry.collection_id)
    try {
      await collectionsApi.setStatus(entry.place_id, next)
      await refreshMembership()
      bumpVersion()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusyId(null)
    }
  }

  const handleVisitedEverywhere = async () => {
    if (busyId != null || unvisited.length === 0) return
    setBusyId(-1)
    try {
      const { updated } = await collectionsApi.setStatusMany(unvisited.map(l => l.place_id), 'visited')
      toast.success(t('collections.markedVisited', { count: updated }))
      await refreshMembership()
      bumpVersion()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusyId(null)
    }
  }

  const handleToggle = async (list: Collection) => {
    if (busyId != null) return
    const savedPlaceId = savedByCollection.get(list.id)?.place_id
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

  const openCollections = () => { close(); navigate('/collections') }

  return (
    <DialogShell
      onClose={close}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><Bookmark size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          eyebrow={t('collections.pickList')}
          title={target.name}
          // One tap for "I have been here", however many lists hold it (#1469).
          pills={unvisited.length > 0 ? (
            <button type="button" onClick={handleVisitedEverywhere} disabled={busyId != null}
              className={`${PILL} hover:opacity-80 disabled:opacity-60`}>
              {busyId === -1 ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} strokeWidth={2.2} />}
              {unvisited.length > 1 ? t('collections.markVisitedAll') : t('collections.markVisited')}
            </button>
          ) : undefined}
        />
      )}
      footer={lists.length > 0 ? (
        <DialogFooter>
          <DialogButton onClick={openCollections} icon={<Bookmark size={14} strokeWidth={2.2} />}>{t('collections.viewInCollection')}</DialogButton>
          <FooterSpacer />
        </DialogFooter>
      ) : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8 text-content-faint">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-6 text-center">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-surface-secondary text-content-faint">
            <Bookmark size={20} />
          </div>
          <p className="m-0 mb-4 text-content-faint" style={fs(13, 'body')}>{t('collections.noListsYet')}</p>
          <DialogButton variant="primary" onClick={openCollections} icon={<Plus size={14} strokeWidth={2.2} />}>{t('collections.newList')}</DialogButton>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
          {lists.map(list => {
            const entry = savedByCollection.get(list.id)
            const saved = !!entry
            const busy = busyId === list.id
            return (
              <button
                key={list.id}
                type="button"
                aria-pressed={saved}
                onClick={() => handleToggle(list)}
                disabled={busyId != null}
                className={`flex min-h-[46px] items-center gap-3 rounded-[10px] px-3 py-2 text-left disabled:opacity-60 ${saved ? 'bg-surface-card shadow-sm' : 'hover:bg-surface-card'}`}
              >
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: list.color || 'var(--accent)' }} />
                <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>{list.name}</span>
                {list.is_owner === false && (
                  <span className="flex-none rounded-full bg-surface-tertiary px-2 py-[2px] font-semibold text-content-muted" style={fs(10.5)}>{t('collections.shared')}</span>
                )}
                {/* Per-list status, so one place can be an idea in one list and
                    visited in another. A role=button span, safe to nest here. */}
                {entry && (
                  <StatusBadge
                    status={entry.status}
                    showLabel={false}
                    size={12}
                    onChange={entry.can_edit ? next => { void handleStatus(entry, next) } : undefined}
                    t={t}
                  />
                )}
                <span className={`grid h-6 w-6 flex-none place-items-center rounded-[8px] ${saved ? 'bg-accent text-accent-text' : 'border border-edge bg-surface-card text-transparent'}`}>
                  {busy ? <Loader2 size={13} className="animate-spin text-content-faint" /> : saved ? <BookmarkCheck size={13} /> : <Check size={13} />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </DialogShell>
  )
}
