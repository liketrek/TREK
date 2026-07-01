import React, { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { X, Pencil, Copy, Trash2, MapPin, Link2, Plus, ExternalLink, Check, Tag } from 'lucide-react'
import type { CollectionPlace, CollectionStatus, CollectionLink } from '@trek/shared'
import type { Category, TranslationFn } from '../../types'
import MarkdownToolbar from '../Journey/MarkdownToolbar'
import { mapsApi } from '../../api/client'
import { entityGradient } from '../../utils/gradients'
import { getCategoryIcon } from '../shared/categoryIcons'
import { STATUS_META, STATUS_ORDER, normalizeLinkUrl } from '../../pages/collections/collectionsModel'
import { useToast } from '../shared/Toast'
import { getApiErrorMessage } from '../../types'

function linkHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

interface CollectionPlaceDetailProps {
  place: CollectionPlace
  canEdit: boolean
  canDelete: boolean
  categories: Category[]
  /** When set, dock the sheet over that column (desktop split) instead of centred. */
  anchorRect?: { left: number; width: number } | null
  onClose: () => void
  onSetStatus: (status: CollectionStatus) => void
  onSave: (patch: { name?: string; description?: string | null; links?: CollectionLink[]; category_id?: number | null }) => Promise<void>
  onCopyToTrip: () => void
  onRemove: () => void
  t: TranslationFn
}

function StatusSegment({ status, onSet, t }: { status: CollectionStatus; onSet: (s: CollectionStatus) => void; t: TranslationFn }): React.ReactElement {
  return (
    <div className="col-detail-seg" role="group">
      {STATUS_ORDER.map(s => {
        const Icon = STATUS_META[s].icon
        const on = status === s
        return (
          <button key={s} type="button" aria-pressed={on} onClick={() => onSet(s)} className={on ? 'on' : ''}>
            <Icon size={14} style={{ color: on ? STATUS_META[s].color : undefined }} /> {t(STATUS_META[s].labelKey)}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Bottom detail sheet for a saved place — an opaque, clearly-sectioned card
 * (cover → meta → status → description → links) docked over the list column.
 * Read mode renders the description as markdown + link chips; edit mode swaps in
 * name / category / markdown description / links, saving via updatePlace. Status
 * is an always-live segmented control (auto-saves).
 */
export default function CollectionPlaceDetail({
  place, canEdit, canDelete, categories, anchorRect, onClose, onSetStatus, onSave, onCopyToTrip, onRemove, t,
}: CollectionPlaceDetailProps): React.ReactElement {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(place.name)
  const [categoryId, setCategoryId] = useState<number | null>(place.category_id ?? null)
  const [description, setDescription] = useState(place.description ?? '')
  const [links, setLinks] = useState<CollectionLink[]>(place.links ?? [])
  const [saving, setSaving] = useState(false)
  // A higher-res photo pulled from the maps provider when the place has none of
  // its own — the list avatar's little thumbnail is too low-res for the cover.
  const [fetchedPhoto, setFetchedPhoto] = useState<string | null>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  // Reset only when a DIFFERENT place is opened (keyed on id, not on every field).
  useEffect(() => {
    setEditing(false)
    setName(place.name)
    setCategoryId(place.category_id ?? null)
    setDescription(place.description ?? '')
    setLinks(place.links ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.id])

  // Fetch a cover photo when the place doesn't carry its own image.
  useEffect(() => {
    setFetchedPhoto(null)
    if (place.image_url) return
    const photoId = place.google_place_id || place.osm_id || (place.lat != null && place.lng != null ? `${place.lat},${place.lng}` : null)
    if (!photoId) return
    let cancelled = false
    mapsApi.placePhoto(photoId, place.lat ?? undefined, place.lng ?? undefined, place.name)
      .then(res => { if (!cancelled && res?.photoUrl) setFetchedPhoto(res.photoUrl) })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.id])

  const banner = place.image_url || fetchedPhoto
  const setLink = (i: number, patch: Partial<CollectionLink>) => setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const resetForm = () => { setEditing(false); setName(place.name); setCategoryId(place.category_id ?? null); setDescription(place.description ?? ''); setLinks(place.links ?? []) }

  const save = async () => {
    const cleanLinks = links.map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) })).filter(l => l.url)
    setSaving(true)
    try {
      await onSave({ name: name.trim() || place.name, description: description.trim() || null, links: cleanLinks, category_id: categoryId })
      setEditing(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const dockStyle = anchorRect ? { left: anchorRect.left, width: anchorRect.width, transform: 'none' as const } : undefined
  const CatIcon = getCategoryIcon(place.category?.icon)

  return (
    <div className={`col-detail${anchorRect ? ' docked' : ''}`} style={dockStyle} onClick={e => e.stopPropagation()}>
      <div className="col-detail-cover" style={banner ? undefined : { backgroundImage: entityGradient(place.id) }}>
        {banner && <img src={banner} alt="" />}
        <div className="col-detail-cover-scrim" />
        {place.category?.name && (
          <span className="col-detail-cover-cat" style={{ ['--cat' as string]: place.category.color || '#6366f1' }}>
            <CatIcon size={12} /> {place.category.name}
          </span>
        )}
        <button type="button" className="col-detail-close" onClick={onClose} aria-label={t('common.close')}><X size={16} /></button>
        <div className="col-detail-head">
          {editing
            ? <input value={name} onChange={e => setName(e.target.value)} className="col-detail-name-input" autoFocus aria-label={t('collections.listName')} />
            : <h2 className="col-detail-name">{place.name}</h2>}
        </div>
      </div>

      <div className="col-detail-body">
        {/* Meta (view only) */}
        {!editing && place.address && (
          <div className="col-detail-meta">
            <span className="col-detail-addr"><MapPin size={12} /> {place.address}</span>
          </div>
        )}

        {/* Status — live for editors, read-only for viewers */}
        <StatusSegment status={place.status} onSet={canEdit ? onSetStatus : () => {}} t={t} />

        {editing ? (
          <div className="col-detail-edit">
            {/* Category */}
            <div className="col-detail-field">
              <div className="col-detail-label"><Tag size={12} /> {t('collections.category')}</div>
              <div className="col-detail-cats">
                <button type="button" onClick={() => setCategoryId(null)} className={`col-detail-cat${categoryId == null ? ' on' : ''}`}>{t('collections.noCategory')}</button>
                {categories.map(cat => {
                  const Icon = getCategoryIcon(cat.icon ?? undefined)
                  const on = categoryId === cat.id
                  return (
                    <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)} className={`col-detail-cat${on ? ' on' : ''}`} style={{ ['--cat' as string]: cat.color || '#6366f1' }}>
                      <Icon size={12} /> {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Description */}
            <div className="col-detail-field">
              <div className="col-detail-label">{t('collections.description')}</div>
              <MarkdownToolbar textareaRef={descRef} onUpdate={setDescription} />
              <textarea ref={descRef} value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder={t('collections.descriptionPlaceholder')} className="col-detail-textarea" />
            </div>
            {/* Links */}
            <div className="col-detail-field">
              <div className="col-detail-label">{t('collections.links')}</div>
              <div className="col-detail-links-edit">
                {links.map((l, i) => (
                  <div key={i} className="col-detail-link-row">
                    <input value={l.label ?? ''} onChange={e => setLink(i, { label: e.target.value })} placeholder={t('collections.linkLabel')} className="col-detail-input w-28" />
                    <input value={l.url} onChange={e => setLink(i, { url: e.target.value })} placeholder="https://…" className="col-detail-input flex-1" />
                    <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="col-detail-icon-btn" aria-label={t('common.delete')}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setLinks([...links, { url: '' }])} className="col-detail-add-link"><Plus size={13} /> <Link2 size={12} /> {t('collections.addLink')}</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {place.description && (
              <div className="col-detail-md collab-note-md">
                <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{place.description}</Markdown>
              </div>
            )}
            {place.links && place.links.length > 0 && (
              <div className="col-detail-links">
                {place.links.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="col-detail-link">
                    <ExternalLink size={13} /> {l.label || linkHost(l.url)}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="col-detail-footer">
        {editing ? (
          <>
            <button type="button" onClick={resetForm} className="col-detail-btn">{t('common.cancel')}</button>
            <button type="button" onClick={save} disabled={saving} className="col-detail-btn primary"><Check size={14} /> {t('common.save')}</button>
          </>
        ) : (
          <>
            {canEdit && <button type="button" onClick={() => setEditing(true)} className="col-detail-btn"><Pencil size={14} /> {t('common.edit')}</button>}
            <button type="button" onClick={onCopyToTrip} className="col-detail-btn"><Copy size={14} /> {t('collections.copyToTrip')}</button>
            <div className="col-detail-footer-spacer" />
            {canDelete && <button type="button" onClick={onRemove} className="col-detail-btn danger"><Trash2 size={14} /> {t('collections.removeFromList')}</button>}
          </>
        )}
      </div>
    </div>
  )
}
