import React, { useEffect, useId, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Bookmark, Search, MapPin, MapPinned, Loader2, Trash2, Check, X } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, GRID_2, INPUT, PANEL, Segmented, TEXTAREA } from '../shared/dialogParts'
import { NumericInput } from '../shared/NumericInput'
import NoteFormatToolbar from '../shared/NoteFormatToolbar'
import { Tooltip } from '../shared/Tooltip'
import { mapsApi } from '../../api/client'
import { collectionsApi } from '../../api/collections'
import { getCategoryIcon } from '../shared/categoryIcons'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { getApiErrorMessage } from '../../types'
import { normalizeLinkUrl, STATUS_META, STATUS_ORDER } from '../../pages/collections/collectionsModel'
import type { Category, TranslationFn } from '../../types'
import type { CollectionLink, CollectionStatus } from '@trek/shared'
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage'

type MapsPlace = Record<string, unknown>
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)
const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : undefined)

/**
 * The search row, pinned to the top of the scrolling body. The dialog stays open
 * after an add, and the row used to sit above the viewport once the form was
 * scrolled, so it looked like the button had vanished (#1921). The negative
 * margins let its background cover the body's padding while it is stuck.
 */
const STICKY_SEARCH = 'sticky top-0 z-20 -mx-6 -mt-5 bg-surface-card px-6 pb-1 pt-5'
/** A chip of the category row; the picked one wears the category's own colour. */
const CHIP = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold'
const CHIP_OFF = 'border-edge-faint bg-surface-card text-content-muted hover:text-content'
const CHIP_NONE_ON = 'border-content bg-surface-card text-content'
const ROW_ACTION = 'grid h-8 w-8 flex-none place-items-center rounded-[9px] text-content-faint hover:bg-surface-secondary'

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
 * Add a place to the current list, everything in one view: the name typed into
 * the head band, a search that fills it and the location in when a result is
 * picked, plus status, category, a markdown description and links, all editable
 * together before saving. Stays open after each add so several places can be
 * added in a row.
 */
export default function AddPlaceToCollectionModal({ isOpen, collectionId, collectionName, categories, onClose, onAdded, t }: AddPlaceToCollectionModalProps): React.ReactElement {
  const { language } = useTranslation()
  const placeLang = usePlaceLanguage()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MapsPlace[]>([])
  const [searching, setSearching] = useState(false)
  // A search that came back empty used to render nothing at all, which reads as
  // "the dialog is dead". Say so instead (#1921).
  const [noResults, setNoResults] = useState(false)
  // The picked location (address/coords/ids) plus the editable fields.
  const [picked, setPicked] = useState<MapsPlace | null>(null)
  const [name, setName] = useState('')
  // Address + coordinates: prefilled from a picked result, but also directly
  // typeable so a place can be added by GPS without searching (#1435).
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState<CollectionLink[]>([])
  const [status, setStatus] = useState<CollectionStatus>('idea')
  const [saving, setSaving] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const labelId = useId()
  const fieldId = useId()

  const reset = () => { setQuery(''); setResults([]); setNoResults(false); setPicked(null); setName(''); setAddress(''); setLat(''); setLng(''); setCategoryId(null); setDescription(''); setLinks([]); setStatus('idea') }
  useEffect(() => { if (!isOpen) reset() }, [isOpen])

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    setNoResults(false)
    try {
      const res = await mapsApi.search(query, placeLang)
      const places = (res.places as MapsPlace[]) || []
      setResults(places)
      setNoResults(places.length === 0)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('places.mapsSearchError')))
    } finally {
      setSearching(false)
    }
  }

  const dismissResults = () => { setResults([]); setNoResults(false) }

  const pick = (r: MapsPlace) => {
    setPicked(r)
    setName(str(r.name) ?? '')
    setAddress(str(r.address) ?? '')
    const la = num(r.lat); const lo = num(r.lng)
    setLat(la != null ? String(la) : '')
    setLng(lo != null ? String(lo) : '')
    setResults([]); setNoResults(false); setQuery(str(r.name) ?? query)
  }
  const setLink = (i: number, patch: Partial<CollectionLink>) => setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const save = async () => {
    const cleanName = name.trim()
    if (!cleanName) return
    const cleanLinks = links.map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) })).filter(l => l.url)
    const latNum = lat.trim() ? Number(lat) : Number.NaN
    const lngNum = lng.trim() ? Number(lng) : Number.NaN
    setSaving(true)
    try {
      const res = await collectionsApi.savePlace({
        collection_id: collectionId,
        name: cleanName,
        address: address.trim() || null,
        lat: Number.isFinite(latNum) ? latNum : null,
        lng: Number.isFinite(lngNum) ? lngNum : null,
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
      // The dialog stays open for the next place, so hand the caret back to the
      // search field. The add button the user just clicked goes disabled with the
      // cleared name, which drops the focus to <body> and leaves the dialog dead
      // to the keyboard (#1921).
      searchRef.current?.focus()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const coordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim()
    // Same pairs as before, written so no two quantifiers can claim the same
    // character. In the old form `\d+\.?\d*` and `\s*[,;\s]\s*` were both ambiguous,
    // which backtracks in O(n^4): a pasted 2 kB of digits and spaces froze the tab.
    const match = text.match(/^(-?\d+(?:\.\d*)?)(?:\s*[,;]\s*|\s+)(-?\d+(?:\.\d*)?)$/)
    if (match) { e.preventDefault(); setLat(match[1]); setLng(match[2]) }
  }

  const header = (
    <DialogHeader
      tile={<DialogTile><MapPinned size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={labelId}
      onClose={onClose}
      eyebrow={t('collections.addPlace')}
      // Typed into the band, as in the planner's place dialog. It takes no focus
      // on opening: the dialog starts at the search, which fills the name in.
      titleInput={{ value: name, onChange: setName, label: t('common.name'), placeholder: t('common.name') }}
      sub={<><Bookmark size={11} strokeWidth={2.2} className="mr-1 inline-block align-[-1px]" />{collectionName}</>}
    />
  )

  const footer = (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      <DialogButton
        variant="primary"
        onClick={() => void save()}
        disabled={saving || !name.trim()}
        icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.2} />}
      >
        {t('common.add')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <DialogShell open={isOpen} onClose={onClose} labelledBy={labelId} width="detail" align="top" header={header} footer={footer}>
      {/* Search: picking a result fills the name and the location below. */}
      <div className={STICKY_SEARCH}>
        <div className="relative">
          <div className="flex items-stretch gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
              <input
                autoFocus
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setNoResults(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void search() } }}
                aria-label={t('collections.addPlaceSearch')}
                placeholder={t('collections.addPlaceSearch')}
                className={`${INPUT} pl-8`}
              />
            </div>
            <DialogButton
              variant="primary"
              onClick={() => void search()}
              disabled={!query.trim() || searching}
              icon={searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} strokeWidth={2.2} />}
            >
              {t('common.search')}
            </DialogButton>
          </div>
          {(results.length > 0 || noResults) && (
            <div
              role="group"
              aria-label={t('common.search')}
              className="absolute left-0 right-0 z-20 mt-1.5 flex max-h-[280px] flex-col gap-0.5 overflow-y-auto rounded-[12px] border border-edge-faint bg-surface-card p-1 shadow-dropdown"
            >
              <div className="flex items-center justify-between py-0.5 pl-2.5 pr-0.5">
                <span className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{t('common.search')}</span>
                <Tooltip label={t('common.close')}>
                  <button type="button" onClick={dismissResults} aria-label={t('common.close')}
                    className="grid h-7 w-7 place-items-center rounded-[8px] text-content-faint hover:bg-surface-hover hover:text-content">
                    <X size={13} />
                  </button>
                </Tooltip>
              </div>
              {noResults ? (
                <div className="px-2.5 py-3 text-center text-content-faint" style={fs(12.5, 'body')}>{t('planner.noPlacesFound')}</div>
              ) : results.map((r, i) => (
                <button key={i} type="button" onClick={() => pick(r)} className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left hover:bg-surface-hover">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-surface-secondary text-content-faint"><MapPin size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>{str(r.name)}</span>
                    {str(r.address) && <span className="block truncate text-content-faint" style={fs(11.5)}>{str(r.address)}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Where it is: filled in by a picked result, but also typeable, so a place
          can be added by GPS alone (#1435). */}
      <div className={PANEL}>
        <EditorField label={t('places.formAddress')} htmlFor={`${fieldId}-address`}>
          <input
            id={`${fieldId}-address`}
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={t('places.formAddressPlaceholder')}
            className={INPUT}
          />
        </EditorField>
        <div role="group" aria-label={t('collections.coordinates')} className={GRID_2}>
          <EditorField label={t('places.formLatLabel')} htmlFor={`${fieldId}-lat`}>
            <NumericInput id={`${fieldId}-lat`} mode="signed" value={lat} onValueChange={setLat} onPaste={coordPaste} placeholder={t('places.formLat')} className={INPUT} />
          </EditorField>
          <EditorField label={t('places.formLngLabel')} htmlFor={`${fieldId}-lng`}>
            <NumericInput id={`${fieldId}-lng`} mode="signed" value={lng} onValueChange={setLng} onPaste={coordPaste} placeholder={t('places.formLng')} className={INPUT} />
          </EditorField>
        </div>
      </div>

      <EditorField label={t('mobileCollections.status')}>
        <Segmented<CollectionStatus>
          label={t('mobileCollections.status')}
          value={status}
          onChange={setStatus}
          options={STATUS_ORDER.map(s => {
            const Icon = STATUS_META[s].icon
            return { value: s, label: t(STATUS_META[s].labelKey), icon: <Icon size={13} style={{ color: STATUS_META[s].color }} /> }
          })}
        />
      </EditorField>

      {categories.length > 0 && (
        <EditorField label={t('collections.category')}>
          <div role="group" aria-label={t('collections.category')} className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              aria-pressed={categoryId == null}
              className={`${CHIP} ${categoryId == null ? CHIP_NONE_ON : CHIP_OFF}`}
              style={fs(12, 'body')}
            >
              {t('collections.noCategory')}
            </button>
            {categories.map(cat => {
              const Icon = getCategoryIcon(cat.icon ?? undefined)
              const on = categoryId === cat.id
              const col = cat.color || '#6366f1' // theme-lint-disable: the category's own colour, and the default one without a colour is drawn in
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  aria-pressed={on}
                  className={`${CHIP} ${CHIP_OFF}`}
                  style={{ ...fs(12, 'body'), ...(on ? { color: col, background: `color-mix(in oklch, ${col} 15%, transparent)`, borderColor: `color-mix(in oklch, ${col} 40%, transparent)` } : {}) }}
                >
                  <Icon size={13} /> {cat.name}
                </button>
              )
            })}
          </div>
        </EditorField>
      )}

      <DialogSection
        label={<label htmlFor={`${fieldId}-description`}>{t('collections.description')}</label>}
        action={<NoteFormatToolbar textareaRef={descRef} onChange={setDescription} compact customTooltips />}
      >
        <textarea
          id={`${fieldId}-description`}
          ref={descRef}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder={t('collections.descriptionPlaceholder')}
          className={`${TEXTAREA} resize-y`}
        />
        {description.trim() && (
          <div className="collab-note-md mt-2 text-content-secondary" style={fs(13, 'body')}>
            <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{description}</Markdown>
          </div>
        )}
      </DialogSection>

      <DialogSection label={t('collections.links')}>
        <div className="flex flex-col gap-2">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-28 flex-none">
                <input value={l.label ?? ''} onChange={e => setLink(i, { label: e.target.value })} placeholder={t('collections.linkLabel')} className={INPUT} />
              </div>
              <input value={l.url} onChange={e => setLink(i, { url: e.target.value })} placeholder="https://…" className={`${INPUT} flex-1`} />
              <Tooltip label={t('common.delete')}>
                <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} aria-label={t('common.delete')} className={`${ROW_ACTION} hover:text-danger`}>
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            </div>
          ))}
          <AddRowButton onClick={() => setLinks([...links, { url: '' }])}>{t('collections.addLink')}</AddRowButton>
        </div>
      </DialogSection>
    </DialogShell>
  )
}
