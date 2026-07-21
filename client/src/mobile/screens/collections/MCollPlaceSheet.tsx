import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Camera, Check, Copy, ExternalLink, Loader2, MapPin, Pencil, Trash2, X } from 'lucide-react'
import type { CollectionLabel, CollectionLink, CollectionPlace, CollectionStatus } from '@trek/shared'
import type { Category, TranslationFn } from '../../../types'
import { mapsApi } from '../../../api/client'
import { useToast } from '../../../components/shared/Toast'
import { normalizeImageFile } from '../../../utils/convertHeic'
import { getApiErrorMessage } from '../../../types'
import { normalizeLinkUrl, STATUS_ORDER } from '../../../pages/collections/collectionsModel'
import MSheet from '../../components/MSheet'
import PlaceRating from '../../../components/shared/StarRating'
import MCollCategoryPicker from './MCollCategoryPicker'
import MCollLinksEditor from './MCollLinksEditor'
import { STATUS_SPEC } from './collectionsMobileModel'
import { CancelPill, Eyebrow, INPUT_CLS, PrimaryPill, TEXTAREA_CLS } from './MCollSheetKit'

function linkHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

// Hero chrome sits on a photo/gradient — fixed white/black scrims in both themes.
const HERO_CAT_CHIP =
  'relative inline-flex items-center gap-1 rounded-full bg-[rgba(255,255,255,.9)] px-[10px] py-[3px] font-geist text-[0.59375rem] font-extrabold text-[#101013]' // theme-lint-disable
const HERO_CLOSE =
  'absolute right-[14px] top-[14px] z-[1] flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,0,0,.28)] text-white' // theme-lint-disable

interface MCollPlaceSheetProps {
  place: CollectionPlace | null
  canEdit: boolean
  canDelete: boolean
  categories: Category[]
  labels: CollectionLabel[]
  onClose: () => void
  onSetStatus: (status: CollectionStatus) => void
  onSave: (patch: { name?: string; description?: string | null; links?: CollectionLink[]; category_id?: number | null; label_ids?: number[]; image_url?: string | null }) => Promise<void>
  onUploadImage?: (file: File) => Promise<void>
  onCopyToTrip: () => void
  onRemove: () => void
  /** Cast/clear the current user's star vote (#1435); every member may vote. */
  onRate?: (rating: number | null) => Promise<void> | void
  t: TranslationFn
}

/**
 * Saved-place detail: auto-cover hero with the category chip, the live status
 * cycle (Idea → Want to go → Visited), markdown description, links, copy to
 * trip and remove. Edit mode swaps the body for name / category / labels /
 * description / links.
 */
export default function MCollPlaceSheet({
  place, canEdit, canDelete, categories, labels, onClose, onSetStatus, onSave, onUploadImage, onCopyToTrip, onRemove, onRate, t,
}: MCollPlaceSheetProps) {
  const toast = useToast()
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [imgBusy, setImgBusy] = useState(false)
  // Hold the last place through the exit animation.
  const [held, setHeld] = useState<CollectionPlace | null>(place)
  if (place && place !== held) setHeld(place)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState<CollectionLink[]>([])
  const [labelIds, setLabelIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [fetchedPhoto, setFetchedPhoto] = useState<string | null>(null)
  const heldId = held?.id

  // Reseed the form + cover fetch when a different place is opened.
  const seededId = useRef<number | null>(null)
  useEffect(() => {
    if (!held || seededId.current === held.id) return
    seededId.current = held.id
    setEditing(false)
    setName(held.name)
    setCategoryId(held.category_id ?? null)
    setDescription(held.description ?? '')
    setLinks(held.links ?? [])
    setLabelIds(held.label_ids ?? [])
    setFetchedPhoto(null)
    if (held.image_url) return
    const photoId = held.google_place_id || held.osm_id || (held.lat != null && held.lng != null ? `${held.lat},${held.lng}` : null)
    if (!photoId) return
    let cancelled = false
    mapsApi.placePhoto(photoId, held.lat ?? undefined, held.lng ?? undefined, held.name)
      .then(res => { if (!cancelled && res?.photoUrl) setFetchedPhoto(res.photoUrl) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [held, heldId])

  const save = async () => {
    if (!held) return
    const cleanLinks = links.map(l => ({ label: l.label?.trim() || undefined, url: normalizeLinkUrl(l.url) })).filter(l => l.url)
    setSaving(true)
    try {
      await onSave({ name: name.trim() || held.name, description: description.trim() || null, links: cleanLinks, category_id: categoryId, label_ids: labelIds })
      setEditing(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    if (!held) return
    setEditing(false)
    setName(held.name)
    setCategoryId(held.category_id ?? null)
    setDescription(held.description ?? '')
    setLinks(held.links ?? [])
    setLabelIds(held.label_ids ?? [])
  }

  const cover = held?.image_url || fetchedPhoto

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !held || !onUploadImage) return
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

  const assignedLabels = labels.filter(l => (held?.label_ids ?? []).includes(l.id))
  const toggleLabel = (id: number) => setLabelIds(labelIds.includes(id) ? labelIds.filter(x => x !== id) : [...labelIds, id])

  const actionBtn =
    'flex flex-1 items-center justify-center gap-[6px] rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-2 py-[11px] text-[0.78125rem] font-semibold text-m-ink'

  return (
    <MSheet open={place != null} onClose={onClose} material="opaque" className="!rounded-[24px]" ariaLabel={held?.name}>
      {held && (
        <>
          {/* Hero: auto cover (photo when available, the design gradient otherwise) */}
          <div
            className="relative flex-none px-[18px] py-4"
            style={cover ? undefined : { background: 'linear-gradient(120deg,#2FA9A0,#3B8C7E)' }}
          >
            {cover && (
              <>
                <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.44))]" />
              </>
            )}
            {held.category?.name && (
              <span className={HERO_CAT_CHIP}>
                <MapPin size={9} strokeWidth={2.6} /> {held.category.name}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className={HERO_CLOSE}
            >
              <X size={15} strokeWidth={2.2} />
            </button>
            {canEdit && onUploadImage && (
              <div className="absolute left-[14px] top-[14px] z-[1] flex gap-[6px]">
                <button
                  type="button"
                  onClick={() => { if (!imgBusy) imageInputRef.current?.click() }}
                  aria-label={held.image_url ? t('places.changeImage') : t('places.uploadImage')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,0,0,.4)] text-white" // theme-lint-disable
                >
                  {imgBusy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                </button>
                {held.image_url && !imgBusy && (
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    aria-label={t('places.removeImage')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,0,0,.4)] text-white" // theme-lint-disable
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,.heic,.heif" className="hidden" onChange={handleImagePick} />
              </div>
            )}
            <div className="relative mt-[10px] text-[1.3125rem] font-extrabold text-white">{held.name}</div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-[14px]">
            {!editing && held.address && (
              <div className="flex items-start gap-[6px] font-geist text-[0.75rem] leading-[1.5] text-m-muted">
                <MapPin size={13} strokeWidth={2} className="mt-[1px] flex-none" /> {held.address}
              </div>
            )}

            {/* Status cycle */}
            <div className="mt-3 flex gap-[6px]">
              {STATUS_ORDER.map(s => {
                const meta = STATUS_SPEC[s]
                const Icon = meta.icon
                const on = held.status === s
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => onSetStatus(s)}
                    aria-pressed={on}
                    className={`flex flex-1 items-center justify-center gap-[5px] rounded-[12px] py-[9px] text-[0.71875rem] font-bold ${
                      on ? 'bg-m-act text-m-actfg' : 'bg-m-sheetop text-m-ink shadow-[inset_0_0_0_1.5px_var(--m-rowbr)]'
                    }`}
                  >
                    <Icon size={13} strokeWidth={2.2} style={on ? undefined : { color: meta.color }} />
                    <span className="truncate">{t(meta.labelKey)}</span>
                  </button>
                )
              })}
            </div>

            {/* Collaborative rating (#1435) — tap a star to cast/clear your vote. */}
            {onRate && (
              <div className="mt-3">
                <PlaceRating ratings={held.ratings ?? []} ratingAvg={held.rating_avg} onRate={onRate} size={18} />
              </div>
            )}

            {editing ? (
              <>
                <Eyebrow className="mb-[6px] mt-4">{t('common.name').toUpperCase()}</Eyebrow>
                <input value={name} onChange={e => setName(e.target.value)} className={INPUT_CLS} />
                <Eyebrow className="mb-[6px] mt-[14px]">{t('collections.category').toUpperCase()}</Eyebrow>
                <MCollCategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} t={t} />
                {labels.length > 0 && (
                  <>
                    <Eyebrow className="mb-[6px] mt-[14px]">{t('collections.labels.title').toUpperCase()}</Eyebrow>
                    <div className="flex flex-wrap gap-[6px]">
                      {labels.map(l => {
                        const on = labelIds.includes(l.id)
                        const color = l.color || '#6366F1'
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => toggleLabel(l.id)}
                            aria-pressed={on}
                            className="flex items-center gap-[5px] rounded-full border px-3 py-[7px] text-[0.71875rem] font-bold"
                            style={on
                              ? { background: `${color}18`, color, borderColor: `${color}2e` }
                              : { background: 'var(--m-ic)', color: 'var(--m-ink)', borderColor: 'var(--m-rowbr)' }}
                          >
                            <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
                            {l.name}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
                <Eyebrow className="mb-[6px] mt-[14px]">{t('collections.description').toUpperCase()}</Eyebrow>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('collections.descriptionPlaceholder')} className={TEXTAREA_CLS} />
                <Eyebrow className="mb-[6px] mt-[14px]">{t('collections.links').toUpperCase()}</Eyebrow>
                <MCollLinksEditor links={links} onChange={setLinks} t={t} />
                <div className="mt-4 flex items-center gap-2">
                  <CancelPill className="ml-auto" onClick={cancelEdit}>{t('common.cancel')}</CancelPill>
                  <PrimaryPill onClick={save} disabled={saving}>
                    <Check size={14} strokeWidth={2.4} /> {t('common.save')}
                  </PrimaryPill>
                </div>
              </>
            ) : (
              <>
                {assignedLabels.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-[6px]">
                    {assignedLabels.map(l => {
                      const color = l.color || '#6366F1'
                      return (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-[5px] rounded-full px-[10px] py-[5px] font-geist text-[0.625rem] font-bold"
                          style={{ background: `${color}18`, color }}
                        >
                          <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
                          {l.name}
                        </span>
                      )
                    })}
                  </div>
                )}
                {held.description && (
                  <div className="collab-note-md mt-3 font-geist text-[0.78125rem] leading-[1.55] text-m-ink">
                    <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{held.description}</Markdown>
                  </div>
                )}
                {held.links && held.links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-[6px]">
                    {held.links.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-[5px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[7px] text-[0.71875rem] font-semibold text-m-ink"
                      >
                        <ExternalLink size={13} strokeWidth={2} className="text-m-muted" /> {l.label || linkHost(l.url)}
                      </a>
                    ))}
                  </div>
                )}
                <div className="mt-[14px] flex gap-2">
                  {canEdit && (
                    <button type="button" onClick={() => setEditing(true)} className={actionBtn}>
                      <Pencil size={13} strokeWidth={2.2} /> {t('common.edit')}
                    </button>
                  )}
                  <button type="button" onClick={onCopyToTrip} className={actionBtn}>
                    <Copy size={13} strokeWidth={2.2} /> {t('collections.copyToTrip')}
                  </button>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="mt-[10px] flex w-full items-center justify-center gap-[6px] rounded-[13px] p-[11px] text-[0.78125rem] font-bold text-[color:var(--m-st-danger)]"
                  >
                    <Trash2 size={14} strokeWidth={2} /> {t('collections.removeFromList')}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </MSheet>
  )
}
