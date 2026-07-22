import React, { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { X, Pencil, Copy, Trash2, MapPin, Link2, Plus, ExternalLink, Check, Tag, Tags, Camera, Loader2 } from 'lucide-react'
import type { CollectionPlace, CollectionStatus, CollectionLink, CollectionLabel } from '@trek/shared'
import type { Category, TranslationFn } from '../../types'
import MarkdownToolbar from '../Journey/MarkdownToolbar'
import { NumericInput } from '../shared/NumericInput'
import { mapsApi } from '../../api/client'
import { entityGradient } from '../../utils/gradients'
import { getCategoryIcon } from '../shared/categoryIcons'
import { STATUS_META, STATUS_ORDER, normalizeLinkUrl } from '../../pages/collections/collectionsModel'
import { useToast } from '../shared/Toast'
import { Tooltip } from '../shared/Tooltip'
import PlaceRating from '../shared/StarRating'
import { normalizeImageFile } from '../../utils/convertHeic'
import { getApiErrorMessage } from '../../types'

function linkHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

interface CollectionPlaceDetailProps {
  place: CollectionPlace
  canEdit: boolean
  canDelete: boolean
  categories: Category[]
  /** The active list's custom labels, for the assign chips. */
  labels: CollectionLabel[]
  /** When set, dock the sheet over that column (desktop split) instead of centred. */
  anchorRect?: { left: number; width: number } | null
  onClose: () => void
  onSetStatus: (status: CollectionStatus) => void
  onSave: (patch: { name?: string; description?: string | null; links?: CollectionLink[]; category_id?: number | null; label_ids?: number[]; image_url?: string | null; lat?: number | null; lng?: number | null }) => Promise<void>
  /** Upload a custom cover image (#1136); enables the cover change/remove controls. */
  onUploadImage?: (file: File) => Promise<void>
  onCopyToTrip: () => void
  onRemove: () => void
  /** Cast/clear the current user's star vote (#1435); every member may vote. */
  onRate?: (rating: number | null) => Promise<void> | void
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
  place, canEdit, canDelete, categories, labels, anchorRect, onClose, onSetStatus, onSave, onUploadImage, onCopyToTrip, onRemove, onRate, t,
}: CollectionPlaceDetailProps): React.ReactElement {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [imgBusy, setImgBusy] = useState(false)
  const [name, setName] = useState(place.name)
  const [categoryId, setCategoryId] = useState<number | null>(place.category_id ?? null)
  const [description, setDescription] = useState(place.description ?? '')
  const [links, setLinks] = useState<CollectionLink[]>(place.links ?? [])
  const [labelIds, setLabelIds] = useState<number[]>(place.label_ids ?? [])
  const [lat, setLat] = useState(place.lat != null ? String(place.lat) : '')
  const [lng, setLng] = useState(place.lng != null ? String(place.lng) : '')
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
    setLabelIds(place.label_ids ?? [])
    setLat(place.lat != null ? String(place.lat) : '')
    setLng(place.lng != null ? String(place.lng) : '')
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

  const handleCoverPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onUploadImage) return
    setImgBusy(true)
    try {
      await onUploadImage(await normalizeImageFile(file))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('places.imageUploadError')))
    } finally {
      setImgBusy(false)
    }
  }

  const handleImageRemove = async () => {
    setImgBusy(true)
    try {
      await onSave({ image_url: null })
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('places.imageUploadError')))
    } finally {
      setImgBusy(false)
    }
  }

  const setLink = (i: number, patch: Partial<CollectionLink>) => setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const toggleLabel = (id: number) => setLabelIds(labelIds.includes(id) ? labelIds.filter(x => x !== id) : [...labelIds, id])
  const resetForm = () => { setEditing(false); setName(place.name); setCategoryId(place.category_id ?? null); setDescription(place.description ?? ''); setLinks(place.links ?? []); setLabelIds(place.label_ids ?? []); setLat(place.lat != null ? String(place.lat) : ''); setLng(place.lng != null ? String(place.lng) : '') }
  const coordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim()
    const match = text.match(/^(-?\d+\.?\d*)\s*[,;\s]\s*(-?\d+\.?\d*)$/)
    if (match) { e.preventDefault(); setLat(match[1]); setLng(match[2]) }
  }
  const assignedLabels = labels.filter(l => (place.label_ids ?? []).includes(l.id))

  const save = async () => {
    const cleanLinks = links.map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) })).filter(l => l.url)
    const latNum = lat.trim() ? Number(lat) : NaN
    const lngNum = lng.trim() ? Number(lng) : NaN
    setSaving(true)
    try {
      await onSave({ name: name.trim() || place.name, description: description.trim() || null, links: cleanLinks, category_id: categoryId, label_ids: labelIds, lat: Number.isFinite(latNum) ? latNum : null, lng: Number.isFinite(lngNum) ? lngNum : null })
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
        {canEdit && onUploadImage && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, zIndex: 2 }}>
            <Tooltip label={place.image_url ? t('places.changeImage') : t('places.uploadImage')} placement="bottom">
              <button
                type="button"
                onClick={() => { if (!imgBusy) coverInputRef.current?.click() }}
                aria-label={place.image_url ? t('places.changeImage') : t('places.uploadImage')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: 'none', cursor: imgBusy ? 'default' : 'pointer', background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}
              >
                {imgBusy ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
              </button>
            </Tooltip>
            {place.image_url && !imgBusy && (
              <Tooltip label={t('places.removeImage')} placement="bottom">
                <button
                  type="button"
                  onClick={handleImageRemove}
                  aria-label={t('places.removeImage')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}
                >
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            )}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,.heic,.heif" style={{ display: 'none' }} onChange={handleCoverPick} />
          </div>
        )}
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

        {/* Collaborative rating (#1435) — every member votes; the average shows. */}
        {onRate && (
          <div style={{ padding: '2px 0' }}>
            <PlaceRating ratings={place.ratings ?? []} ratingAvg={place.rating_avg} onRate={onRate} />
          </div>
        )}

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
            {/* Coordinates */}
            <div className="col-detail-field">
              <div className="col-detail-label"><MapPin size={12} /> {t('collections.coordinates')}</div>
              <div className="col-detail-link-row">
                <NumericInput mode="signed" value={lat} onValueChange={setLat} onPaste={coordPaste} placeholder={t('places.formLat')} className="col-detail-input flex-1" />
                <NumericInput mode="signed" value={lng} onValueChange={setLng} placeholder={t('places.formLng')} className="col-detail-input flex-1" />
              </div>
            </div>
            {/* Labels */}
            {labels.length > 0 && (
              <div className="col-detail-field">
                <div className="col-detail-label"><Tags size={12} /> {t('collections.labels.title')}</div>
                <div className="col-detail-cats">
                  {labels.map(l => {
                    const on = labelIds.includes(l.id)
                    return (
                      <button key={l.id} type="button" onClick={() => toggleLabel(l.id)} className={`col-detail-cat${on ? ' on' : ''}`} style={{ ['--cat' as string]: l.color || '#6366f1' }}>
                        <span className="col-labelchip-dot" /> {l.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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
            {assignedLabels.length > 0 && (
              <div className="col-detail-labels">
                {assignedLabels.map(l => (
                  <span key={l.id} className="col-labelchip on static" style={{ ['--label' as string]: l.color || 'var(--accent)' }}>
                    <span className="col-labelchip-dot" /> {l.name}
                  </span>
                ))}
              </div>
            )}
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
