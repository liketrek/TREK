import { useEffect, useRef, useState } from 'react'
import { Image, Loader2, Search, Trash2 } from 'lucide-react'
import type { Collection, CollectionLink } from '@trek/shared'
import type { TranslationFn } from '../../../types'
import { tripsApi } from '../../../api/client'
import { useCollectionStore } from '../../../store/collectionStore'
import { useToast } from '../../../components/shared/Toast'
import { getApiErrorMessage } from '../../../types'
import { normalizeLinkUrl } from '../../../pages/collections/collectionsModel'
import MSheet from '../../components/MSheet'
import MCollLinksEditor from './MCollLinksEditor'
import { listCoverGradient, SWATCH_COLORS } from './collectionsMobileModel'
import { CancelPill, PrimaryPill, SheetFooter, SheetHeader, TEXTAREA_CLS } from './MCollSheetKit'

interface CoverSearchPhoto {
  id: string
  url: string
  thumb: string
  description?: string | null
  photographer?: string | null
}

// Scrims over the cover photo / Unsplash thumbs — fixed dark overlays in both themes.
const COVER_OVERLAY =
  'absolute inset-0 flex items-center justify-center gap-[6px] bg-[rgba(0,0,0,.28)] text-[0.78125rem] font-bold text-white' // theme-lint-disable
const PHOTO_CREDIT =
  'absolute inset-x-0 bottom-0 truncate bg-[rgba(0,0,0,.55)] px-[6px] py-1 text-left text-[0.625rem] text-white' // theme-lint-disable

interface MCollEditSheetProps {
  /** null = closed, 'new' = create, a Collection = edit that list. */
  target: Collection | 'new' | null
  onClose: () => void
  onCreated: (id: number) => void
  /** Owner-only: hands the id to the delete-confirm flow (sheet closes first). */
  onRequestDelete: (id: number) => void
  t: TranslationFn
}

/**
 * Create / edit a list: cover (upload or Unsplash search), name, colour,
 * description and links. Deleting goes through the shared confirm flow.
 */
export default function MCollEditSheet({ target, onClose, onCreated, onRequestDelete, t }: MCollEditSheetProps) {
  const createCollection = useCollectionStore(s => s.createCollection)
  const updateCollection = useCollectionStore(s => s.updateCollection)
  const uploadCover = useCollectionStore(s => s.uploadCover)
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  // Hold the last target through the exit animation.
  const [held, setHeld] = useState<Collection | 'new' | null>(target)
  if (target && target !== held) setHeld(target)
  const editing = held && held !== 'new' ? held : null

  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCH_COLORS[0])
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState<CollectionLink[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [pendingUnsplashUrl, setPendingUnsplashUrl] = useState<string | null>(null)
  const [coverQuery, setCoverQuery] = useState('')
  const [coverResults, setCoverResults] = useState<CoverSearchPhoto[]>([])
  const [searchingCover, setSearchingCover] = useState(false)
  const coverSeq = useRef(0)
  const [saving, setSaving] = useState(false)
  // A create that failed at the cover step keeps its id so a retry updates it.
  const [createdId, setCreatedId] = useState<number | null>(null)
  const objectUrl = useRef<string | null>(null)

  const dropObjectUrl = () => {
    if (objectUrl.current) { URL.revokeObjectURL(objectUrl.current); objectUrl.current = null }
  }

  // (Re)seed the form whenever the sheet opens on a target.
  useEffect(() => {
    if (!target) return
    const edit = target !== 'new' ? target : null
    setName(edit?.name ?? '')
    setColor(edit?.color ?? SWATCH_COLORS[0])
    setDescription(edit?.description ?? '')
    setLinks(edit?.links ?? [])
    setCoverFile(null)
    dropObjectUrl()
    setCoverPreview(edit?.cover_image ?? null)
    setPendingUnsplashUrl(null)
    setCoverQuery('')
    setCoverResults([])
    setCreatedId(null)
  }, [target])

  useEffect(() => () => dropObjectUrl(), [])

  const pickCover = (file: File | undefined) => {
    if (!file) return
    dropObjectUrl()
    const url = URL.createObjectURL(file)
    objectUrl.current = url
    setCoverFile(file)
    setCoverPreview(url)
    setPendingUnsplashUrl(null)
  }

  const searchCover = async () => {
    const query = coverQuery.trim() || name.trim()
    if (!query) return
    const seq = ++coverSeq.current
    setSearchingCover(true)
    try {
      const data = await tripsApi.searchCoverImages(query)
      if (seq !== coverSeq.current) return
      setCoverResults(data.photos || [])
    } catch {
      if (seq === coverSeq.current) setCoverResults([])
    } finally {
      if (seq === coverSeq.current) setSearchingCover(false)
    }
  }

  const pickUnsplash = (photo: CoverSearchPhoto) => {
    if (!photo.url) return
    dropObjectUrl()
    setCoverFile(null)
    setPendingUnsplashUrl(photo.url)
    setCoverPreview(photo.url)
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    const cleanLinks = links
      .map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) }))
      .filter(l => l.url)
    const payload = {
      name: trimmed,
      color,
      description: description.trim() || null,
      links: cleanLinks,
      ...(pendingUnsplashUrl ? { cover_image: pendingUnsplashUrl } : {}),
    }
    setSaving(true)
    try {
      let id = editing?.id ?? createdId
      if (id != null) {
        await updateCollection(id, payload)
      } else {
        const created = await createCollection(payload)
        id = created?.id ?? null
        setCreatedId(id)
      }
      if (id != null && coverFile) await uploadCover(id, coverFile)
      if (!editing && id != null) onCreated(id)
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const label = 'mb-[5px] font-geist text-[0.6875rem] font-bold text-m-muted'
  const canDeleteList = editing != null && editing.is_owner !== false

  return (
    <MSheet
      open={target != null}
      onClose={onClose}
      material="opaque"
      ariaLabel={editing ? t('collections.editListTitle') : t('collections.newList')}
    >
      <SheetHeader
        title={editing ? t('collections.editListTitle') : t('collections.newList')}
        onClose={onClose}
        closeLabel={t('common.close')}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[14px]">
        <div className={label}>{t('collections.coverImage')}</div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative block h-[120px] w-full overflow-hidden rounded-[14px]"
          style={coverPreview ? undefined : { background: listCoverGradient(color) }}
        >
          {coverPreview && <img src={coverPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <span className={COVER_OVERLAY}>
            <Image size={14} strokeWidth={2.2} /> {coverPreview ? t('collections.changeCover') : t('collections.addCover')}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={e => pickCover(e.target.files?.[0])}
        />
        <div className="mt-2 flex gap-2">
          <input
            value={coverQuery}
            onChange={e => setCoverQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); searchCover() } }}
            placeholder={t('dashboard.unsplashSearchPlaceholder')}
            className="min-w-0 flex-1 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[10px] font-geist text-[0.71875rem] text-m-ink outline-none placeholder:text-m-faint"
          />
          <button
            type="button"
            onClick={searchCover}
            disabled={searchingCover || (!coverQuery.trim() && !name.trim())}
            className="flex flex-none items-center gap-[5px] rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[10px] text-[0.71875rem] font-semibold text-m-ink disabled:opacity-40"
          >
            {searchingCover ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} strokeWidth={2} />} Unsplash
          </button>
        </div>
        {coverResults.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {coverResults.map(photo => (
              <button
                key={photo.id}
                type="button"
                onClick={() => pickUnsplash(photo)}
                aria-label={photo.photographer || 'Unsplash'}
                className="relative h-20 overflow-hidden rounded-[10px] border border-[color:var(--m-rowbr)]"
                style={coverPreview === photo.url ? { boxShadow: 'inset 0 0 0 2px var(--m-act)' } : undefined}
              >
                <img src={photo.thumb} alt={photo.description || ''} loading="lazy" className="h-full w-full object-cover" />
                {photo.photographer && (
                  <span className={PHOTO_CREDIT}>
                    {photo.photographer}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className={`${label} mt-[14px]`}>{t('collections.listName')}</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('collections.listNamePlaceholder')}
          className="w-full box-border rounded-[12px] border-[1.5px] border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px] py-[11px] font-[inherit] text-[0.84375rem] font-semibold text-m-ink outline-none placeholder:text-m-faint"
        />

        <div className={`${label} mt-[14px] mb-[6px]`}>{t('collections.listColor')}</div>
        <div className="flex flex-wrap gap-2">
          {SWATCH_COLORS.map(col => (
            <button
              key={col}
              type="button"
              onClick={() => setColor(col)}
              aria-label={col}
              aria-pressed={color === col}
              className={`h-[26px] w-[26px] rounded-full ${color === col ? 'outline outline-2 outline-offset-2 outline-[color:var(--m-act)]' : ''}`}
              style={{ background: col }}
            />
          ))}
        </div>

        <div className={`${label} mt-[14px]`}>{t('collections.description')}</div>
        <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('collections.descriptionPlaceholder')} className={TEXTAREA_CLS} />

        <div className={`${label} mt-[14px]`}>{t('collections.links')}</div>
        <MCollLinksEditor links={links} onChange={setLinks} t={t} />
      </div>
      <SheetFooter>
        {canDeleteList && (
          <button
            type="button"
            onClick={() => { onClose(); onRequestDelete(editing!.id) }}
            className="flex items-center gap-[5px] text-[0.75rem] font-bold text-[color:var(--m-st-danger)]"
          >
            <Trash2 size={13} strokeWidth={2} /> {t('collections.deleteList')}
          </button>
        )}
        <CancelPill className="ml-auto" onClick={onClose}>{t('common.cancel')}</CancelPill>
        <PrimaryPill onClick={save} disabled={!name.trim() || saving}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {editing ? t('common.save') : t('collections.create')}
        </PrimaryPill>
      </SheetFooter>
    </MSheet>
  )
}
