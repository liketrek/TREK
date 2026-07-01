import React, { useEffect, useRef, useState } from 'react'
import { ImagePlus, Link2, Plus, Trash2 } from 'lucide-react'
import Modal from '../shared/Modal'
import { useCollectionStore } from '../../store/collectionStore'
import { useToast } from '../shared/Toast'
import { getApiErrorMessage } from '../../types'
import { normalizeLinkUrl } from '../../pages/collections/collectionsModel'
import type { TranslationFn } from '../../types'
import type { Collection, CollectionLink } from '@trek/shared'

const SWATCHES = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#3b82f6', '#22c55e']

interface ListEditorModalProps {
  /** null = closed, 'new' = create, a Collection = edit that list. */
  target: Collection | 'new' | null
  onClose: () => void
  onCreated: (id: number) => void
  t: TranslationFn
}

/**
 * Create / edit a list — name, colour, an optional cover image (tinted with the
 * list colour in the hero), a description and a set of links. On create it makes
 * the list then uploads the cover to the new id; on edit it patches + re-uploads.
 */
export default function ListEditorModal({ target, onClose, onCreated, t }: ListEditorModalProps): React.ReactElement | null {
  const createCollection = useCollectionStore(s => s.createCollection)
  const updateCollection = useCollectionStore(s => s.updateCollection)
  const uploadCover = useCollectionStore(s => s.uploadCover)
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const editing = target && target !== 'new' ? target : null
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState<CollectionLink[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
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
  }

  const setLink = (i: number, patch: Partial<CollectionLink>) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    // Normalise + keep only links with a url; drop blank rows.
    const cleanLinks = links
      .map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) }))
      .filter(l => l.url)
    const payload = { name: trimmed, color, description: description.trim() || null, links: cleanLinks }
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

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? t('collections.editListTitle') : t('collections.newList')}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-edge text-content-secondary text-[13px] hover:bg-surface-hover">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={save} disabled={!name.trim() || saving} className="px-3 py-1.5 rounded-lg bg-accent text-accent-text text-[13px] font-semibold disabled:opacity-50">
            {editing ? t('common.save') : t('collections.create')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Cover */}
        <div>
          <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('collections.coverImage')}</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-full h-32 rounded-xl overflow-hidden border border-edge bg-surface-secondary flex items-center justify-center text-content-faint hover:border-accent transition-colors"
          >
            {coverPreview && <img src={coverPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}55, transparent 70%)` }} />
            <span className="relative flex items-center gap-2 text-[13px] font-medium" style={{ color: coverPreview ? '#fff' : undefined, textShadow: coverPreview ? '0 1px 4px rgba(0,0,0,.5)' : undefined }}>
              <ImagePlus size={16} /> {coverPreview ? t('collections.changeCover') : t('collections.addCover')}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={e => pickCover(e.target.files?.[0])} />
        </div>

        {/* Name */}
        <div>
          <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('collections.listName')}</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) save() }}
            placeholder={t('collections.listNamePlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[14px] outline-none focus:border-accent"
          />
        </div>

        {/* Colour */}
        <div>
          <label className="block text-[12px] font-medium text-content-secondary mb-2">{t('collections.listColor')}</label>
          <div className="flex gap-2 flex-wrap">
            {SWATCHES.map(col => (
              <button
                key={col}
                type="button"
                onClick={() => setColor(col)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{ background: col, outline: color === col ? '2px solid var(--accent)' : 'none', outlineOffset: 2 }}
                aria-label={col}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('collections.description')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder={t('collections.descriptionPlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent resize-y"
          />
        </div>

        {/* Links */}
        <div>
          <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('collections.links')}</label>
          <div className="flex flex-col gap-2">
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={l.label ?? ''}
                  onChange={e => setLink(i, { label: e.target.value })}
                  placeholder={t('collections.linkLabel')}
                  className="w-32 shrink-0 px-2.5 py-1.5 rounded-lg border border-edge bg-surface-input text-content text-[12.5px] outline-none focus:border-accent"
                />
                <input
                  value={l.url}
                  onChange={e => setLink(i, { url: e.target.value })}
                  placeholder="https://…"
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-edge bg-surface-input text-content text-[12.5px] outline-none focus:border-accent"
                />
                <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="p-1.5 rounded-md text-content-faint hover:text-danger hover:bg-danger-soft" aria-label={t('common.delete')}>
                  <Trash2 size={14} />
                </button>
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
