import React, { useEffect, useId, useRef, useState } from 'react'
import { Bookmark, ImagePlus, Trash2, Search, Loader2 } from 'lucide-react'
import { DeleteButton, DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, INPUT, TEXTAREA } from '../shared/dialogParts'
import { Tooltip } from '../shared/Tooltip'
import { useCollectionStore } from '../../store/collectionStore'
import { useToast } from '../shared/Toast'
import { tripsApi } from '../../api/client'
import { getApiErrorMessage } from '../../utils/apiError'
import { normalizeLinkUrl } from '../../pages/collections/collectionsModel'
import type { TranslationFn } from '../../types'
import type { Collection, CollectionLink } from '@trek/shared'

interface CoverSearchPhoto {
  id: string
  url: string
  thumb: string
  description?: string | null
  photographer?: string | null
}

const SWATCHES = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#3b82f6', '#22c55e']

/** A photographer's name laid over the bottom of a result, on a wash of the card colour. */
const PHOTO_CREDIT = 'absolute inset-x-0 bottom-0 truncate bg-[color:color-mix(in_srgb,var(--bg-card)_85%,transparent)] px-1.5 py-1 text-content-muted'
const ROW_ACTION = 'grid h-8 w-8 flex-none place-items-center rounded-[9px] text-content-faint hover:bg-surface-secondary hover:text-danger'

interface ListEditorModalProps {
  /** null = closed, 'new' = create, a Collection = edit that list. */
  target: Collection | 'new' | null
  onClose: () => void
  onCreated: (id: number) => void
  /** Owner-only: hand off to the delete-confirm flow when editing a list. */
  onRequestDelete: (id: number) => void
  t: TranslationFn
}

/**
 * Create / edit a list — name, colour, an optional cover image (tinted with the
 * list colour in the hero), a description and a set of links. On create it makes
 * the list then uploads the cover to the new id; on edit it patches + re-uploads.
 */
export default function ListEditorModal({ target, onClose, onCreated, onRequestDelete, t }: ListEditorModalProps): React.ReactElement | null {
  const createCollection = useCollectionStore(s => s.createCollection)
  const updateCollection = useCollectionStore(s => s.updateCollection)
  const uploadCover = useCollectionStore(s => s.uploadCover)
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const labelId = useId()

  const editing = target && target !== 'new' ? target : null
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
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
  // Remembers a freshly created list id so a retry after a cover-upload failure
  // updates it instead of creating a duplicate list.
  const [createdId, setCreatedId] = useState<number | null>(null)
  const objectUrl = useRef<string | null>(null)

  const dropObjectUrl = () => { if (objectUrl.current) { URL.revokeObjectURL(objectUrl.current); objectUrl.current = null } }

  // (Re)seed the form whenever the target changes.
  useEffect(() => {
    if (!target) return
    setName(editing?.name ?? '')
    setColor(editing?.color ?? '#6366f1')
    setDescription(editing?.description ?? '')
    setLinks(editing?.links ?? [])
    setCoverFile(null)
    dropObjectUrl()
    setCoverPreview(editing?.cover_image ?? null)
    setPendingUnsplashUrl(null)
    setCoverQuery('')
    setCoverResults([])
    setCreatedId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  // Revoke the last preview blob on unmount.
  useEffect(() => () => dropObjectUrl(), [])

  if (!target) return null

  const pickCover = (file: File | undefined) => {
    if (!file) return
    dropObjectUrl()
    const url = URL.createObjectURL(file)
    objectUrl.current = url
    setCoverFile(file)
    setCoverPreview(url)
    setPendingUnsplashUrl(null) // an uploaded file wins over a picked Unsplash photo
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

  const setLink = (i: number, patch: Partial<CollectionLink>) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const save = async () => {
    const trimmed = name.trim()
    // Enter fires while the create is still in flight, and `createdId` is only
    // set once it comes back — without this the second one creates a second list.
    if (!trimmed || saving) return
    // Normalise + keep only links with a url; drop blank rows.
    const cleanLinks = links
      .map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) }))
      .filter(l => l.url)
    const payload = { name: trimmed, color, description: description.trim() || null, links: cleanLinks, ...(pendingUnsplashUrl ? { cover_image: pendingUnsplashUrl } : {}) }
    setSaving(true)
    try {
      // A prior create that failed at the cover step left `createdId` set — reuse
      // it so a retry updates that list instead of creating a duplicate.
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

  // The list's own colour runs through the dialog: the head band, its tile and the cover.
  const header = (
    <DialogHeader
      tile={<DialogTile><Bookmark size={20} strokeWidth={1.9} style={{ color }} /></DialogTile>}
      tint={`color-mix(in srgb, ${color} 12%, transparent)`}
      labelId={labelId}
      onClose={onClose}
      eyebrow={editing ? t('collections.editListTitle') : t('collections.newList')}
      titleInput={{
        value: name,
        onChange: setName,
        label: t('collections.listName'),
        placeholder: t('collections.listNamePlaceholder'),
        autoFocus: true,
        onKeyDown: e => { if (e.key === 'Enter' && name.trim()) void save() },
      }}
    />
  )

  const footer = (
    <DialogFooter>
      {editing && editing.is_owner !== false && (
        <DeleteButton label={t('collections.deleteList')} onClick={() => { onClose(); onRequestDelete(editing.id) }} />
      )}
      <FooterSpacer />
      <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      <DialogButton
        variant="primary"
        onClick={() => void save()}
        disabled={!name.trim() || saving}
        icon={saving ? <Loader2 size={14} className="animate-spin" /> : undefined}
      >
        {editing ? t('common.save') : t('collections.create')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    // Pinned at the top: the photo results grow the body under the search.
    <DialogShell onClose={onClose} labelledBy={labelId} width="detail" align="top" header={header} footer={footer}>
      <DialogSection label={t('collections.coverImage')}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-[14px] border border-edge-faint bg-surface-secondary transition-colors hover:border-content-faint"
        >
          {coverPreview && <img src={coverPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <span className="absolute inset-0" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 33%, transparent), transparent 70%)` }} />
          {/* A chip rather than bare text, so it reads the same on any photo. */}
          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1.5 font-semibold text-content shadow-sm" style={fs(12.5, 'body')}>
            <ImagePlus size={15} /> {coverPreview ? t('collections.changeCover') : t('collections.addCover')}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={e => pickCover(e.target.files?.[0])} />

        {/* Unsplash cover search, the same source as trip creation */}
        <div className="mt-2 flex gap-2">
          <input
            value={coverQuery}
            onChange={e => setCoverQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void searchCover() } }}
            aria-label={t('dashboard.unsplashSearchPlaceholder')}
            placeholder={t('dashboard.unsplashSearchPlaceholder')}
            className={`${INPUT} flex-1`}
          />
          <DialogButton
            onClick={() => void searchCover()}
            disabled={searchingCover || (!coverQuery.trim() && !name.trim())}
            icon={searchingCover ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} strokeWidth={2.2} />}
          >
            {t('dashboard.searchUnsplash')}
          </DialogButton>
        </div>
        {coverResults.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {coverResults.map(photo => {
              const on = coverPreview === photo.url
              return (
                <button
                  type="button"
                  key={photo.id}
                  onClick={() => pickUnsplash(photo)}
                  aria-label={photo.photographer || 'Unsplash'}
                  aria-pressed={on}
                  className={`relative h-20 overflow-hidden rounded-[10px] transition-shadow ${on ? 'ring-2 ring-accent' : 'ring-1 ring-edge-faint hover:ring-content-faint'}`}
                >
                  <img src={photo.thumb} alt={photo.description || ''} loading="lazy" className="h-full w-full object-cover" />
                  {photo.photographer && <span className={PHOTO_CREDIT} style={fs(10)}>{photo.photographer}</span>}
                </button>
              )
            })}
          </div>
        )}
      </DialogSection>

      <EditorField label={t('collections.listColor')}>
        <div role="group" aria-label={t('collections.listColor')} className="flex flex-wrap gap-2">
          {SWATCHES.map(col => (
            <button
              key={col}
              type="button"
              onClick={() => setColor(col)}
              aria-label={col}
              aria-pressed={color === col}
              className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${color === col ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-card' : ''}`}
              style={{ background: col }}
            />
          ))}
        </div>
      </EditorField>

      <EditorField label={t('collections.description')} htmlFor={`${labelId}-description`}>
        <textarea
          id={`${labelId}-description`}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder={t('collections.descriptionPlaceholder')}
          className={`${TEXTAREA} resize-y`}
        />
      </EditorField>

      <DialogSection label={t('collections.links')}>
        <div className="flex flex-col gap-2">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-32 flex-none">
                <input value={l.label ?? ''} onChange={e => setLink(i, { label: e.target.value })} placeholder={t('collections.linkLabel')} className={INPUT} />
              </div>
              <input value={l.url} onChange={e => setLink(i, { url: e.target.value })} placeholder="https://…" className={`${INPUT} flex-1`} />
              <Tooltip label={t('common.delete')}>
                <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} aria-label={t('common.delete')} className={ROW_ACTION}>
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
