import { useEffect, useMemo, useState, type ClipboardEvent } from 'react'
import { MapPin } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { DEFAULT_FORM, type PlaceFormData } from '../../../../components/Planner/PlaceFormModal.helpers'
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetFooter, FormSheetHeader } from './PlSheetChrome'
import PlPlaceSearch, { type PlSearchPick } from './PlPlaceSearch'
import PlCategoryPicker from './PlCategoryPicker'
import PlTimeFields from './PlTimeFields'
import PlFileAttach from './PlFileAttach'
import type { Place } from '../../../../types'
import type { TripPlanner } from '../MTripShell'

export interface MPlaceEditSheetProps {
  planner: TripPlanner
}

// #1152: same duplicate heuristic as the desktop form — shared Google Place ID,
// case-insensitive name match, or near-identical coordinates (~11 m).
const DUP_COORD_TOLERANCE = 0.0001

function findDuplicateName(
  form: PlaceFormData,
  places: { name?: string | null; lat?: number | string | null; lng?: number | string | null; google_place_id?: string | null }[],
): string | null {
  const name = form.name.trim().toLowerCase()
  const gid = (form.google_place_id || '').trim()
  const lat = form.lat ? parseFloat(form.lat) : null
  const lng = form.lng ? parseFloat(form.lng) : null
  for (const p of places || []) {
    if (gid && p.google_place_id && p.google_place_id === gid) return p.name || form.name
    if (name && p.name && p.name.trim().toLowerCase() === name) return p.name
    if (
      lat != null && lng != null && p.lat != null && p.lng != null &&
      Math.abs(Number(p.lat) - lat) <= DUP_COORD_TOLERANCE &&
      Math.abs(Number(p.lng) - lng) <= DUP_COORD_TOLERANCE
    ) return p.name || form.name
  }
  return null
}

/**
 * Add/edit place sheet — the mobile counterpart of PlaceFormModal, driven by
 * the planner's own editor flags (showPlaceForm / editingPlace / prefillCoords /
 * editingAssignmentId) so every entry point (timeline edit, browser context
 * menu, map long-press, ?create=place) opens it unchanged. Saving goes through
 * planner.handleSavePlace, which owns the assignment-time split, pending-file
 * upload and undo.
 */
export default function MPlaceEditSheet({ planner }: MPlaceEditSheetProps) {
  const {
    t, toast, places, assignments, canUploadFiles,
    showPlaceForm, setShowPlaceForm,
    editingPlace, setEditingPlace,
    prefillCoords, setPrefillCoords,
    editingAssignmentId, setEditingAssignmentId,
    handleSavePlace, setDeletePlaceId, confirmDeletePlace,
  } = planner

  const [form, setForm] = useState<PlaceFormData>(DEFAULT_FORM)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [resolvingPick, setResolvingPick] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [deleteArmed, setDeleteArmed] = useState(false)
  // Open-time snapshot: closing clears the planner flags immediately, but the
  // sheet still shows through its exit animation — render off the snapshot so
  // the edit chrome doesn't flip to "add" while fading out.
  const [sheetPlace, setSheetPlace] = useState<Place | null>(null)
  const [sheetAssignmentId, setSheetAssignmentId] = useState<number | null>(null)

  const dayAssignments = useMemo(
    () => (sheetPlace ? Object.values(assignments).flat() : []),
    [sheetPlace, assignments],
  )

  // Prefill on open — same source order as the desktop form: editing place
  // (times off the in-context assignment), map/POI prefill coords, blank.
  useEffect(() => {
    if (!showPlaceForm) return
    setSheetPlace(editingPlace)
    setSheetAssignmentId(editingAssignmentId)
    if (editingPlace) {
      const assignment = editingAssignmentId
        ? Object.values(assignments).flat().find(a => a.id === editingAssignmentId)
        : null
      const timeSource = assignment?.place ?? editingPlace
      setForm({
        name: editingPlace.name || '',
        description: editingPlace.description || '',
        address: editingPlace.address || '',
        lat: editingPlace.lat != null ? String(editingPlace.lat) : '',
        lng: editingPlace.lng != null ? String(editingPlace.lng) : '',
        category_id: editingPlace.category_id != null ? String(editingPlace.category_id) : '',
        place_time: timeSource.place_time || '',
        end_time: timeSource.end_time || '',
        notes: editingPlace.notes || '',
        transport_mode: editingPlace.transport_mode || 'walking',
        website: editingPlace.website || '',
      })
    } else if (prefillCoords) {
      setForm({
        ...DEFAULT_FORM,
        lat: String(prefillCoords.lat),
        lng: String(prefillCoords.lng),
        name: prefillCoords.name || '',
        address: prefillCoords.address || '',
        website: prefillCoords.website || '',
        phone: prefillCoords.phone || '',
        osm_id: prefillCoords.osm_id,
      })
    } else {
      setForm(DEFAULT_FORM)
    }
    setPendingFiles([])
    setDuplicateWarning(null)
    setDeleteArmed(false)
    // assignments is a fresh map each load — read at open time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPlaceForm, editingPlace, prefillCoords, editingAssignmentId])

  // Trip-centre bias for search/autocomplete, skipped past ~500 km diagonal.
  const locationBias = useMemo(() => {
    const withCoords = (places || []).filter(p => p.lat != null && p.lng != null)
    if (withCoords.length === 0) return undefined
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
    for (const p of withCoords) {
      const lat = Number(p.lat), lng = Number(p.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
    }
    if (!Number.isFinite(minLat)) return undefined
    const avgLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180)
    const diagKm = Math.sqrt(((maxLat - minLat) * 111) ** 2 + ((maxLng - minLng) * 111 * Math.cos(avgLatRad)) ** 2)
    if (diagKm > 500) return undefined
    return { low: { lat: minLat, lng: minLng }, high: { lat: maxLat, lng: maxLng } }
  }, [places])

  const handleChange = (field: keyof PlaceFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const applyPick = (pick: PlSearchPick) => {
    setForm(prev => ({
      ...prev,
      name: pick.name ?? prev.name,
      address: pick.address ?? prev.address,
      lat: pick.lat ?? prev.lat,
      lng: pick.lng ?? prev.lng,
      google_place_id: pick.google_place_id ?? prev.google_place_id,
      google_ftid: pick.google_ftid ?? prev.google_ftid,
      osm_id: pick.osm_id ?? prev.osm_id,
      website: pick.website ?? prev.website,
      phone: pick.phone ?? prev.phone,
    }))
  }

  const handleClose = () => {
    setShowPlaceForm(false)
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setPrefillCoords(null)
    if (deleteArmed) setDeletePlaceId(null)
  }

  const handleCoordPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim()
    const match = text.match(/^(-?\d+\.?\d*)\s*[,;\s]\s*(-?\d+\.?\d*)$/)
    if (match) {
      e.preventDefault()
      setForm(prev => ({ ...prev, lat: match[1], lng: match[2] }))
    }
  }

  // Clipboard images/PDFs from any focused field become pending attachments.
  const handlePaste = (e: ClipboardEvent) => {
    if (!canUploadFiles) return
    for (const item of Array.from(e.clipboardData?.items || [])) {
      if (item.type.startsWith('image/') || item.type === 'application/pdf') {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) setPendingFiles(prev => [...prev, file])
        return
      }
    }
  }

  const hasTimeError = Boolean(
    sheetPlace && form.place_time && form.end_time &&
    form.place_time.length >= 5 && form.end_time.length >= 5 &&
    form.end_time <= form.place_time,
  )

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(t('places.nameRequired'))
      return
    }
    // #1152: first save of a new place warns on likely duplicates; a second
    // tap with the warning showing is the explicit "add anyway".
    if (!sheetPlace && !duplicateWarning) {
      const dup = findDuplicateName(form, places)
      if (dup) {
        setDuplicateWarning(dup)
        toast.warning(t('places.duplicateExists', { name: dup }))
        return
      }
    }
    setIsSaving(true)
    try {
      await handleSavePlace({
        ...form,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        category_id: form.category_id || null,
        _pendingFiles: pendingFiles.length > 0 ? pendingFiles : undefined,
      })
      handleClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('places.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!sheetPlace) return
    if (!deleteArmed) {
      // Two-tap confirm: arming also stages the id the planner's confirm reads.
      setDeletePlaceId(sheetPlace.id)
      setDeleteArmed(true)
      toast.warning(t('mobileTrip.tapAgainToDelete'))
      return
    }
    await confirmDeletePlace()
    handleClose()
  }

  const submitLabel = isSaving
    ? t('common.saving')
    : sheetPlace
      ? t('common.save')
      : duplicateWarning
        ? t('places.addAnyway')
        : t('common.add')

  return (
    <MSheet open={showPlaceForm} onClose={handleClose} material="opaque" ariaLabel={sheetPlace ? t('places.editPlace') : t('places.addPlace')}>
      <FormSheetHeader
        icon={MapPin}
        title={sheetPlace ? t('places.editPlace') : t('places.addPlace')}
        onClose={handleClose}
        closeLabel={t('common.close')}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-[2px]" onPaste={handlePaste}>
        <PlPlaceSearch planner={planner} locationBias={locationBias} onPick={applyPick} onResolvingChange={setResolvingPick} />

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('places.formName')} *</Eyebrow>
        <input
          type="text"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder={t('places.formNamePlaceholder')}
          className={`${FIELD_CLS} ${resolvingPick ? 'opacity-60' : ''}`}
        />

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('places.formDescription')}</Eyebrow>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          rows={2}
          placeholder={t('places.formDescriptionPlaceholder')}
          className={FIELD_AREA_CLS}
        />

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('places.formNotes')}</Eyebrow>
        <textarea
          value={form.notes}
          onChange={e => handleChange('notes', e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder={t('places.formNotesPlaceholder')}
          className={FIELD_AREA_CLS}
        />

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('places.formAddress')}</Eyebrow>
        <input
          type="text"
          value={form.address}
          onChange={e => handleChange('address', e.target.value)}
          placeholder={t('places.formAddressPlaceholder')}
          className={FIELD_CLS}
        />
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={form.lat}
            onChange={e => handleChange('lat', e.target.value.replace(/[^0-9.-]/g, ''))}
            onPaste={handleCoordPaste}
            placeholder={t('places.formLat')}
            className={`${FIELD_CLS} flex-1 text-[0.8125rem] [font-variant-numeric:tabular-nums]`}
          />
          <input
            type="text"
            inputMode="decimal"
            value={form.lng}
            onChange={e => handleChange('lng', e.target.value.replace(/[^0-9.-]/g, ''))}
            placeholder={t('places.formLng')}
            className={`${FIELD_CLS} flex-1 text-[0.8125rem] [font-variant-numeric:tabular-nums]`}
          />
        </div>

        <Eyebrow className="mb-[6px] mt-3 uppercase">{t('places.formCategory')}</Eyebrow>
        <PlCategoryPicker planner={planner} value={form.category_id} onChange={id => handleChange('category_id', id)} />

        {/* Times live per day-assignment — only editable when one is in context. */}
        {sheetPlace && sheetAssignmentId && (
          <PlTimeFields
            planner={planner}
            startTime={form.place_time}
            endTime={form.end_time}
            onChange={handleChange}
            assignmentId={sheetAssignmentId}
            dayAssignments={dayAssignments}
            hasTimeError={hasTimeError}
          />
        )}

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('places.formWebsite')}</Eyebrow>
        <input
          type="url"
          value={form.website}
          onChange={e => handleChange('website', e.target.value)}
          placeholder="https://"
          className={FIELD_CLS}
        />

        {canUploadFiles && (
          <PlFileAttach
            planner={planner}
            files={pendingFiles}
            onAdd={files => setPendingFiles(prev => [...prev, ...files])}
            onRemove={idx => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
          />
        )}
      </div>

      <FormSheetFooter
        onDelete={sheetPlace ? handleDelete : undefined}
        deleteLabel={t('common.delete')}
        deleteArmed={deleteArmed}
        onCancel={handleClose}
        cancelLabel={t('common.cancel')}
        onSubmit={handleSubmit}
        submitLabel={submitLabel}
        submitDisabled={isSaving || hasTimeError}
      />
    </MSheet>
  )
}
