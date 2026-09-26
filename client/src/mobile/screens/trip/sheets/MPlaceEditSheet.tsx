import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react'
import { MapPin } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import {
  DEFAULT_FORM,
  mergeResult,
  type PlaceFormData,
  type ResultField,
} from '../../../../components/Planner/PlaceFormModal.helpers'
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetFooter, FormSheetHeader } from './PlSheetChrome'
import { useAddonStore } from '../../../../store/addonStore'
import type { BookingExpenseRequest } from '../../../../components/Planner/BookingCostsSection.types'
import PlPlaceSearch, { type PlSearchPick } from './PlPlaceSearch'
import PlCategoryPicker from './PlCategoryPicker'
import PlTimeFields from './PlTimeFields'
import PlFileAttach from './PlFileAttach'
import MLinkedCosts from './MLinkedCosts'
import PlaceDetailsColumn, { type PlaceDetailsSelection } from '../../../../components/Planner/PlaceDetailsColumn'
import { useTranslation } from '../../../../i18n'
import { useAuthStore } from '../../../../store/authStore'
import { useSettingsStore } from '../../../../store/settingsStore'
import type { Assignment, AssignmentsMap, Place } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { useLocationBias } from '../../../../hooks/useLocationBias'

export interface MPlaceEditSheetProps {
  planner: TripPlanner
  /** Opens the Costs editor for this place's linked expense (#1298). */
  onOpenExpense: (req: BookingExpenseRequest) => void
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
  const lat = form.lat ? Number.parseFloat(form.lat) : null
  const lng = form.lng ? Number.parseFloat(form.lng) : null
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
 * The visit the editor was opened on, looked up in the planner's STORED list.
 *
 * Not planner.assignments: the phone filters booked nights (always) and service stops
 * (while the day lists hide them) out of that one, and the road trip stop sheet opens
 * this editor on exactly those visits. Looked up there the visit was not found, Start
 * prefilled from the pool place, and a plain save wrote that over the time the stop was
 * pinned to; the day note was dropped the same way. Every visit the plan tab shows is in
 * the stored list as well, so its entry points resolve exactly as they did.
 */
function findVisit(stored: AssignmentsMap, assignmentId: number | null): Assignment | null {
  if (!assignmentId) return null
  return Object.values(stored).flat().find(a => a.id === assignmentId) ?? null
}

/**
 * Add/edit place sheet — the mobile counterpart of PlaceFormModal, driven by
 * the planner's own editor flags (showPlaceForm / editingPlace / prefillCoords /
 * editingAssignmentId) so every entry point (timeline edit, browser context
 * menu, map long-press, ?create=place) opens it unchanged. Saving goes through
 * planner.handleSavePlace, which owns the assignment-time split, pending-file
 * upload and undo.
 */
export default function MPlaceEditSheet({ planner, onOpenExpense }: MPlaceEditSheetProps) {
  const {
    t, toast, places, assignments, storedAssignments, canUploadFiles,
    showPlaceForm, setShowPlaceForm,
    editingPlace, setEditingPlace,
    prefillCoords, setPrefillCoords,
    editingAssignmentId, setEditingAssignmentId,
    handleSavePlace, setDeletePlaceId, confirmDeletePlace,
  } = planner

  const [form, setForm] = useState<PlaceFormData>(DEFAULT_FORM)
  // Which fields the last picked search result wrote. See mergeResult.
  const autoFilledRef = useRef<Set<ResultField>>(new Set())
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [resolvingPick, setResolvingPick] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const isBudgetEnabled = useAddonStore(s => s.isEnabled('budget'))
  // Set right before submit: the place has to exist before an expense can point
  // at it, exactly like MReservationSheet does it.
  const expenseIntentRef = useRef(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  // Open-time snapshot: closing clears the planner flags immediately, but the
  // sheet still shows through its exit animation — render off the snapshot so
  // the edit chrome doesn't flip to "add" while fading out.
  const [sheetPlace, setSheetPlace] = useState<Place | null>(null)
  const [sheetAssignmentId, setSheetAssignmentId] = useState<number | null>(null)

  // The details block under the search field follows the same selection rules
  // as the desktop dialog's left column: the picked search result, else the
  // place being edited, else whatever a map POI prefilled.
  const [detailsSelection, setDetailsSelection] = useState<PlaceDetailsSelection | null>(null)
  const placesEnrichEnabled = useAuthStore(s => s.placesEnrichEnabled)
  const { language, locale } = useTranslation()
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'

  // Live rather than the open-time snapshot, so the note's dirty check compares against
  // the note as it stands when Save is tapped.
  const ctxAssignment = useMemo(
    () => (sheetPlace ? findVisit(storedAssignments, sheetAssignmentId) : null),
    [sheetPlace, storedAssignments, sheetAssignmentId],
  )

  // The overlap warning keeps to what the day lists show: on the plan tab a clash with a
  // pump or a booked night the list does not draw would name a stop nobody can see there.
  // The visit under edit joins when the lists hide it, because the warning reads the day
  // to compare against off that very row.
  const dayAssignments = useMemo(() => {
    if (!sheetPlace) return []
    const listed = Object.values(assignments).flat()
    return ctxAssignment && !listed.some(a => a.id === ctxAssignment.id) ? [...listed, ctxAssignment] : listed
  }, [sheetPlace, assignments, ctxAssignment])

  // Prefill on open — same source order as the desktop form: editing place
  // (times off the in-context assignment), map/POI prefill coords, blank.
  useEffect(() => {
    if (!showPlaceForm) return
    setSheetPlace(editingPlace)
    setSheetAssignmentId(editingAssignmentId)
    if (editingPlace) {
      const assignment = findVisit(storedAssignments, editingAssignmentId)
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
        // The day-specific note rides only with an assignment in context (#2163);
        // otherwise the key stays absent so submit never sends a notes write.
        ...(assignment ? { assignment_notes: assignment.notes || '' } : {}),
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
    // Same source order as the desktop dialog: an existing place's provider id
    // and coordinates, a map POI's prefill, or nothing. Without this the block
    // would keep showing the previous sheet's place.
    if (editingPlace && editingPlace.lat != null && editingPlace.lng != null) {
      setDetailsSelection({
        placeId: editingPlace.google_place_id || editingPlace.amap_poi_id || editingPlace.osm_id || undefined,
        lat: Number(editingPlace.lat),
        lng: Number(editingPlace.lng),
        name: editingPlace.name || '',
      })
    } else if (prefillCoords) {
      setDetailsSelection({
        placeId: prefillCoords.osm_id || undefined,
        lat: prefillCoords.lat,
        lng: prefillCoords.lng,
        name: prefillCoords.name || '',
      })
    } else {
      setDetailsSelection(null)
    }
    // A fresh sheet owns nothing yet; one opened on a map POI owns whatever
    // that POI filled in. An existing place being edited owns nothing either —
    // everything on that form came out of the database.
    autoFilledRef.current = new Set(
      !editingPlace && prefillCoords
        ? (['name', 'address', 'lat', 'lng', 'website', 'phone', 'osm_id'] as ResultField[]).filter(
            (field) => !!prefillCoords[field as keyof typeof prefillCoords],
          )
        : [],
    )
    setPendingFiles([])
    setDuplicateWarning(null)
    setDeleteArmed(false)
    // storedAssignments is a fresh map each load, so it is read at open time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPlaceForm, editingPlace, prefillCoords, editingAssignmentId])

  // The area being planned, as a hint for search and autocomplete. Same helper
  // as the desktop dialog: the day currently open first, the whole trip only
  // while it still fits inside one region.
  const { box: locationBias } = useLocationBias()

  const handleChange = (field: keyof PlaceFormData, value: string) => {
    // Typed by hand, so the next pick must leave it alone.
    autoFilledRef.current.delete(field as ResultField)
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Same fix as the desktop dialog, same helper. `?? prev.X` cannot tell a
  // value the user typed from one the previous pick wrote, so searching an
  // airport and then a station left the airport's website in the field.
  const applyPick = (pick: PlSearchPick) => {
    setForm(prev => mergeResult(prev, pick as unknown as Record<string, unknown>, autoFilledRef.current))
    // The details block hangs off the same pick, like the desktop column. A
    // pick without usable coordinates leaves the previous selection alone.
    const lat = Number.parseFloat(pick.lat ?? '')
    const lng = Number.parseFloat(pick.lng ?? '')
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setDetailsSelection({
        placeId: pick.google_place_id || pick.amap_poi_id || pick.osm_id || undefined,
        lat,
        lng,
        name: pick.name || '',
        // Hand the record along: the server needs the same record for the
        // enrichment call, and looking it up again costs a provider round trip.
        details: pick.details,
      })
    }
  }

  const handleClose = () => {
    setShowPlaceForm(false)
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setPrefillCoords(null)
    planner.setPlaceFormDayId(null)
    if (deleteArmed) setDeletePlaceId(null)
  }

  const handleCoordPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim()
    // Same grammar as before, spelled without the overlapping quantifiers pasted text
    // could make backtrack: the separator is either a comma/semicolon with optional
    // padding or pure whitespace, and a decimal is digits with an optional ".digits".
    const match = text.match(/^(-?\d+(?:\.\d*)?)(?:\s*[,;]\s*|\s+)(-?\d+(?:\.\d*)?)$/)
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

  // End before start blocks the save — tied to the values, not to which entry
  // point opened the sheet.
  const hasTimeError = Boolean(
    form.place_time && form.end_time &&
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
    const withExpense = expenseIntentRef.current
    expenseIntentRef.current = false
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        lat: form.lat ? Number.parseFloat(form.lat) : null,
        lng: form.lng ? Number.parseFloat(form.lng) : null,
        category_id: form.category_id || null,
        _pendingFiles: pendingFiles.length > 0 ? pendingFiles : undefined,
      }
      // #2163: the per-assignment note only travels when an assignment is in
      // context AND the value actually changed — same dirty-check as the
      // desktop form, so an untouched note never produces a PUT.
      if (!ctxAssignment || (form.assignment_notes ?? '') === (ctxAssignment.notes ?? '')) {
        delete payload.assignment_notes
      }
      const saved = await handleSavePlace(payload)
      const savedId = saved?.id ?? sheetPlace?.id ?? null
      if (withExpense && savedId) {
        onOpenExpense({ prefill: { placeId: savedId, name: form.name.trim(), category: 'activities' } })
      }
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

        {placesEnrichEnabled && (
          <div className="mt-3">
            <PlaceDetailsColumn
              selection={detailsSelection}
              selectedImageUrl={form.image_url}
              onPickImage={(url) => setForm(prev => ({ ...prev, image_url: url ?? undefined }))}
              onAdoptDescription={(text) => setForm(prev => ({ ...prev, description: text }))}
              hasDescription={!!form.description.trim()}
              language={language}
              timeFormat={timeFormat}
              locale={locale}
              fluid
              t={t}
            />
          </div>
        )}

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

        {/* Times live per day-assignment — only editable when one is in context.
            Same for the day-specific note (#2163). */}
        {sheetPlace && sheetAssignmentId && (
          <>
            <PlTimeFields
              planner={planner}
              startTime={form.place_time}
              endTime={form.end_time}
              onChange={handleChange}
              assignmentId={sheetAssignmentId}
              dayAssignments={dayAssignments}
              hasTimeError={hasTimeError}
            />
            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('places.assignmentNotes')}</Eyebrow>
            <textarea
              value={form.assignment_notes ?? ''}
              onChange={e => handleChange('assignment_notes', e.target.value)}
              rows={2}
              placeholder={t('places.assignmentNotesPlaceholder')}
              className={FIELD_AREA_CLS}
            />
          </>
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

        {/* COSTS — same block, same flow as the booking sheet (#1298) */}
        {isBudgetEnabled && (
          <MLinkedCosts
            placeId={sheetPlace?.id}
            hintKey="places.createExpenseHint"
            createDisabled={!form.name.trim() || isSaving}
            onCreate={() => { expenseIntentRef.current = true; handleSubmit() }}
            onEdit={item => onOpenExpense({ editItem: item })}
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
