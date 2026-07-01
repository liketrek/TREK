import React, { useEffect, useState } from 'react'
import { Search, MapPin, Plus, Loader2 } from 'lucide-react'
import Modal from '../shared/Modal'
import { mapsApi } from '../../api/client'
import { collectionsApi } from '../../api/collections'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { getApiErrorMessage } from '../../types'
import type { TranslationFn } from '../../types'

type MapsPlace = Record<string, unknown>
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)
const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : undefined)

interface AddPlaceToCollectionModalProps {
  isOpen: boolean
  collectionId: number
  collectionName: string
  onClose: () => void
  onAdded: () => void
  t: TranslationFn
}

/**
 * Search for a place (OSM / Google via the maps service) and save it straight
 * into the current list. Stays open after each add so several places can be
 * added in one go.
 */
export default function AddPlaceToCollectionModal({ isOpen, collectionId, collectionName, onClose, onAdded, t }: AddPlaceToCollectionModalProps): React.ReactElement {
  const { language } = useTranslation()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MapsPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [addingIdx, setAddingIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) { setQuery(''); setResults([]); setAddingIdx(null) }
  }, [isOpen])

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await mapsApi.search(query, language)
      setResults((res.places as MapsPlace[]) || [])
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('places.mapsSearchError')))
    } finally {
      setSearching(false)
    }
  }

  const add = async (r: MapsPlace, idx: number) => {
    const name = str(r.name)
    if (!name) return
    setAddingIdx(idx)
    try {
      const res = await collectionsApi.savePlace({
        collection_id: collectionId,
        name,
        address: str(r.address) ?? null,
        lat: num(r.lat) ?? null,
        lng: num(r.lng) ?? null,
        google_place_id: str(r.google_place_id) ?? null,
        google_ftid: str(r.google_ftid) ?? null,
        osm_id: str(r.osm_id) ?? null,
        website: str(r.website) ?? null,
        phone: str(r.phone) ?? null,
      })
      if (res.duplicate) toast.info(t('collections.duplicateWarning'))
      else { toast.success(t('collections.addedToList', { name: collectionName })); onAdded() }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setAddingIdx(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('collections.addPlace')} size="md">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') search() }}
              placeholder={t('collections.addPlaceSearch')}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[14px] outline-none focus:border-accent"
            />
          </div>
          <button type="button" onClick={search} disabled={!query.trim() || searching} className="px-4 py-2 rounded-lg bg-accent text-accent-text text-[13px] font-semibold disabled:opacity-50 inline-flex items-center gap-2">
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {t('common.search')}
          </button>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto">
          {results.length === 0 && !searching && (
            <p className="text-[13px] text-content-faint py-6 text-center">{t('collections.addPlaceHint')}</p>
          )}
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-edge bg-surface-card">
              <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center text-content-faint shrink-0"><MapPin size={16} /></div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13.5px] font-semibold text-content truncate">{str(r.name)}</span>
                {str(r.address) && <span className="text-[12px] text-content-faint truncate">{str(r.address)}</span>}
              </div>
              <button type="button" onClick={() => add(r, i)} disabled={addingIdx === i} className="px-2.5 py-1.5 rounded-lg bg-inverse text-inverse-text text-[12px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 shrink-0">
                {addingIdx === i ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} {t('common.add')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
