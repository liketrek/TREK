import React, { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Search, MapPin, Plus, Loader2, Link2, Trash2, Check, X } from 'lucide-react'
import Modal from '../shared/Modal'
import MarkdownToolbar from '../Journey/MarkdownToolbar'
import { mapsApi } from '../../api/client'
import { collectionsApi } from '../../api/collections'
import { getCategoryIcon } from '../shared/categoryIcons'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { getApiErrorMessage } from '../../types'
import { normalizeLinkUrl, STATUS_META, STATUS_ORDER } from '../../pages/collections/collectionsModel'
import type { Category, TranslationFn } from '../../types'
import type { CollectionLink, CollectionStatus } from '@trek/shared'

type MapsPlace = Record<string, unknown>
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)
const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : undefined)

interface AddPlaceToCollectionModalProps {
  isOpen: boolean
  collectionId: number
  collectionName: string
  categories: Category[]
  onClose: () => void
  onAdded: () => void
  t: TranslationFn
}

/**
 * Add a place to the current list — everything in one view: a search field that
 * fills in the location when a result is picked, plus name / category / status /
 * markdown description / links, all editable together before saving. Stays open
 * after each add so several places can be added in a row.
 */
export default function AddPlaceToCollectionModal({ isOpen, collectionId, collectionName, categories, onClose, onAdded, t }: AddPlaceToCollectionModalProps): React.ReactElement {
  const { language } = useTranslation()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MapsPlace[]>([])
  const [searching, setSearching] = useState(false)
  // The picked location (address/coords/ids) plus the editable fields.
  const [picked, setPicked] = useState<MapsPlace | null>(null)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState<CollectionLink[]>([])
  const [status, setStatus] = useState<CollectionStatus>('idea')
  const [saving, setSaving] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)

  const reset = () => { setQuery(''); setResults([]); setPicked(null); setName(''); setCategoryId(null); setDescription(''); setLinks([]); setStatus('idea') }
  useEffect(() => { if (!isOpen) reset() }, [isOpen])

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

  const pick = (r: MapsPlace) => { setPicked(r); setName(str(r.name) ?? ''); setResults([]); setQuery(str(r.name) ?? query) }
  const setLink = (i: number, patch: Partial<CollectionLink>) => setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const save = async () => {
    const cleanName = name.trim()
    if (!cleanName) return
    const cleanLinks = links.map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) })).filter(l => l.url)
    setSaving(true)
    try {
      const res = await collectionsApi.savePlace({
        collection_id: collectionId,
        name: cleanName,
        address: (picked && str(picked.address)) ?? null,
        lat: (picked && num(picked.lat)) ?? null,
        lng: (picked && num(picked.lng)) ?? null,
        google_place_id: (picked && str(picked.google_place_id)) ?? null,
        google_ftid: (picked && str(picked.google_ftid)) ?? null,
        osm_id: (picked && str(picked.osm_id)) ?? null,
        website: (picked && str(picked.website)) ?? null,
        phone: (picked && str(picked.phone)) ?? null,
        category_id: categoryId,
        description: description.trim() || null,
        links: cleanLinks,
        status,
        force: true,
      })
      if (res.duplicate) toast.info(t('collections.duplicateWarning'))
      else { toast.success(t('collections.addedToList', { name: collectionName })); onAdded() }
      reset()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const address = picked ? str(picked.address) : undefined

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('collections.addPlace')}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-edge text-content-secondary text-[13px] hover:bg-surface-hover">{t('common.cancel')}</button>
          <button type="button" onClick={save} disabled={saving || !name.trim()} className="px-3 py-1.5 rounded-lg bg-accent text-accent-text text-[13px] font-semibold disabled:opacity-50 inline-flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('common.add')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Search — picking a result fills the location below */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search() } }}
                placeholder={t('collections.addPlaceSearch')}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[14px] outline-none focus:border-accent"
              />
            </div>
            <button type="button" onClick={search} disabled={!query.trim() || searching} className="px-4 py-2 rounded-lg bg-accent text-accent-text text-[13px] font-semibold disabled:opacity-50 inline-flex items-center gap-2">
              {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {t('common.search')}
            </button>
          </div>
          {results.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1.5 max-h-[280px] overflow-y-auto rounded-xl border border-edge bg-surface-card shadow-lg p-1.5 flex flex-col gap-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-content-faint">{t('common.search')}</span>
                <button type="button" onClick={() => setResults([])} className="p-1 rounded-md text-content-faint hover:text-content hover:bg-surface-hover" aria-label={t('common.close')}><X size={13} /></button>
              </div>
              {results.map((r, i) => (
                <button key={i} type="button" onClick={() => pick(r)} className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-surface-hover transition-colors">
                  <div className="w-8 h-8 min-w-[32px] rounded-lg bg-surface-secondary flex items-center justify-center text-content-faint shrink-0"><MapPin size={15} /></div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-content truncate">{str(r.name)}</span>
                    {str(r.address) && <span className="text-[11.5px] text-content-faint truncate">{str(r.address)}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('common.name')}</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('common.name')} className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[14px] outline-none focus:border-accent" />
          {address && <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-content-faint"><MapPin size={12} /> {address}</div>}
        </div>

        {/* Status */}
        <div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map(s => {
              const Icon = STATUS_META[s].icon
              const on = status === s
              return (
                <button key={s} type="button" onClick={() => setStatus(s)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${on ? 'bg-inverse text-inverse-text border-transparent' : 'bg-surface-card text-content-secondary border-edge hover:bg-surface-hover'}`}>
                  <Icon size={13} style={{ color: on ? undefined : STATUS_META[s].color }} /> {t(STATUS_META[s].labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('collections.category')}</label>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setCategoryId(null)} className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${categoryId == null ? 'bg-inverse text-inverse-text border-transparent' : 'bg-surface-card text-content-secondary border-edge hover:bg-surface-hover'}`}>
                {t('collections.noCategory')}
              </button>
              {categories.map(cat => {
                const Icon = getCategoryIcon(cat.icon ?? undefined)
                const on = categoryId === cat.id
                const col = cat.color || '#6366f1'
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors bg-surface-card border-edge hover:bg-surface-hover"
                    style={on ? { color: col, background: `color-mix(in oklch, ${col} 15%, transparent)`, borderColor: `color-mix(in oklch, ${col} 40%, transparent)` } : undefined}
                  >
                    <Icon size={13} /> {cat.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('collections.description')}</label>
          <MarkdownToolbar textareaRef={descRef} onUpdate={setDescription} />
          <textarea ref={descRef} value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={t('collections.descriptionPlaceholder')} className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent resize-y" />
          {description.trim() && (
            <div className="collab-note-md mt-2 text-[13px] text-content-secondary"><Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{description}</Markdown></div>
          )}
        </div>

        {/* Links */}
        <div>
          <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('collections.links')}</label>
          <div className="flex flex-col gap-2">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={l.label ?? ''} onChange={e => setLink(i, { label: e.target.value })} placeholder={t('collections.linkLabel')} className="w-28 shrink-0 px-2.5 py-1.5 rounded-lg border border-edge bg-surface-input text-content text-[12.5px] outline-none focus:border-accent" />
                <input value={l.url} onChange={e => setLink(i, { url: e.target.value })} placeholder="https://…" className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-edge bg-surface-input text-content text-[12.5px] outline-none focus:border-accent" />
                <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="p-1.5 rounded-md text-content-faint hover:text-danger hover:bg-danger-soft" aria-label={t('common.delete')}><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setLinks([...links, { url: '' }])} className="inline-flex items-center gap-1.5 self-start px-2.5 py-1.5 rounded-lg border border-dashed border-edge text-content-secondary text-[12.5px] font-medium hover:bg-surface-hover">
              <Plus size={14} /> <Link2 size={13} /> {t('collections.addLink')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
