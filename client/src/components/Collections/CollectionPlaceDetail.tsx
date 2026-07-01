import React, { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { X, Pencil, Copy, Trash2, MapPin, Link2, Plus, ExternalLink, Check } from 'lucide-react'
import type { CollectionPlace, CollectionStatus, CollectionLink } from '@trek/shared'
import type { TranslationFn } from '../../types'
import MarkdownToolbar from '../Journey/MarkdownToolbar'
import StatusBadge from './StatusBadge'
import { entityGradient } from '../../utils/gradients'
import { normalizeLinkUrl } from '../../pages/collections/collectionsModel'
import { useToast } from '../shared/Toast'
import { getApiErrorMessage } from '../../types'

function linkHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

interface CollectionPlaceDetailProps {
  place: CollectionPlace
  canEdit: boolean
  onClose: () => void
  onSetStatus: (status: CollectionStatus) => void
  onSave: (patch: { name?: string; description?: string | null; links?: CollectionLink[] }) => Promise<void>
  onCopyToTrip: () => void
  onRemove: () => void
  t: TranslationFn
}

/**
 * Bottom detail sheet for a saved place — a glassy card docked to the bottom
 * (full-width on mobile). Read mode renders the description as markdown + link
 * chips; edit mode swaps in a name field, a markdown editor (toolbar + textarea)
 * and a links editor, saving via collectionsApi.updatePlace. Also cycles the
 * status, copies the place to a trip and removes it from the list.
 */
export default function CollectionPlaceDetail({
  place, canEdit, onClose, onSetStatus, onSave, onCopyToTrip, onRemove, t,
}: CollectionPlaceDetailProps): React.ReactElement {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(place.name)
  const [description, setDescription] = useState(place.description ?? '')
  const [links, setLinks] = useState<CollectionLink[]>(place.links ?? [])
  const [saving, setSaving] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)

  // Reset the form only when a DIFFERENT place is opened (keyed on id, not on
  // every field change — otherwise a save would clobber in-flight edits).
  useEffect(() => {
    setEditing(false)
    setName(place.name)
    setDescription(place.description ?? '')
    setLinks(place.links ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.id])

  const sub = place.category?.name || place.address
  const banner = place.image_url

  const setLink = (i: number, patch: Partial<CollectionLink>) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const save = async () => {
    const cleanLinks = links.map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) })).filter(l => l.url)
    setSaving(true)
    try {
      await onSave({ name: name.trim() || place.name, description: description.trim() || null, links: cleanLinks })
      setEditing(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="col-detail" onClick={e => e.stopPropagation()}>
      <div className="col-detail-cover" style={banner ? undefined : { backgroundImage: entityGradient(place.id) }}>
        {banner && <img src={banner} alt="" />}
        <div className="col-detail-cover-scrim" />
        <button type="button" className="col-detail-close" onClick={onClose} aria-label={t('common.close')}><X size={16} /></button>
        <div className="col-detail-head">
          {editing ? (
            <input value={name} onChange={e => setName(e.target.value)} className="col-detail-name-input" autoFocus />
          ) : (
            <h2 className="col-detail-name">{place.name}</h2>
          )}
          {sub && <div className="col-detail-sub">{!place.category?.name && <MapPin size={12} />}{sub}</div>}
        </div>
      </div>

      <div className="col-detail-body">
        <div className="col-detail-actions">
          <StatusBadge status={place.status} onChange={onSetStatus} t={t} />
          <div className="col-detail-actions-spacer" />
          {canEdit && !editing && (
            <button type="button" className="col-detail-btn" onClick={() => setEditing(true)}><Pencil size={14} /> {t('common.edit')}</button>
          )}
          <button type="button" className="col-detail-btn" onClick={onCopyToTrip}><Copy size={14} /> {t('collections.copyToTrip')}</button>
          {canEdit && (
            <button type="button" className="col-detail-btn danger" onClick={onRemove}><Trash2 size={14} /> {t('collections.removeFromList')}</button>
          )}
        </div>

        {editing ? (
          <div className="col-detail-edit">
            <label className="col-detail-label">{t('collections.description')}</label>
            <MarkdownToolbar textareaRef={descRef} onUpdate={setDescription} />
            <textarea
              ref={descRef}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder={t('collections.descriptionPlaceholder')}
              className="col-detail-textarea"
            />

            <label className="col-detail-label">{t('collections.links')}</label>
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

            <div className="col-detail-edit-actions">
              <button type="button" onClick={() => { setEditing(false); setName(place.name); setDescription(place.description ?? ''); setLinks(place.links ?? []) }} className="col-detail-btn">{t('common.cancel')}</button>
              <button type="button" onClick={save} disabled={saving} className="col-detail-btn primary"><Check size={14} /> {t('common.save')}</button>
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
            {!place.description && (!place.links || place.links.length === 0) && canEdit && (
              <button type="button" className="col-detail-empty" onClick={() => setEditing(true)}>
                <Plus size={14} /> {t('collections.addDetails')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
