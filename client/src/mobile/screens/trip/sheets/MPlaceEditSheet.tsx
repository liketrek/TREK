import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react'
import { MapPin } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import {
  DEFAULT_FORM,
  endsBeforeStart,
  mergeResult,
  parseCoordinatePair,
  placeEditForm,
  placeFormPayload,
  prefillForm,
  type PlaceFormData,
} from '../../../../components/Planner/PlaceFormModal.helpers'
import { usePlaceForm } from '../../../../components/Planner/usePlaceForm'
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetFooter, FormSheetHeader } from './PlSheetChrome'
import { useAddonStore } from '../../../../store/addonStore'
import type { BookingExpenseRequest } from '../../../../components/Planner/BookingCostsSection.types'
import PlPlaceSearch, { type PlSearchPick } from './PlPlaceSearch'
import PlCategoryPicker from './PlCategoryPicker'
import PlTimeFields from './PlTimeFields'
import PlFileAttach from './PlFileAttach'
import MLinkedCosts from './MLinkedCosts'
import PlaceDetailsColumn from '../../../../components/Planner/PlaceDetailsColumn'
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

  // The fields, which of them the last picked search result wrote (see mergeResult), the
  // pending files and the details block follow the same rules as the desktop dialog.
  const {
    form, setForm, autoFilledRef, pendingFiles, addFiles, removeFile, handlePaste, isSaving, setIsSaving,
    duplicateWarning, detailsSelection, setDetailsSelection, openForm, handleChange, pickImage, adoptDescription,
    warnIfDuplicate,
  } = usePlaceForm({ t, toast, canUploadFiles })
  const [resolvingPick, setResolvingPick] = useState(false)
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
  // (times off the in-context assignment), map/POI prefill coords, blank. The
  // details block follows the same order, so it never keeps showing the previous
  // sheet's place.
  useEffect(() => {
    if (!showPlaceForm) return
    setSheetPlace(editingPlace)
    setSheetAssignmentId(editingAssignmentId)
    let next: PlaceFormData
    if (editingPlace) next = placeEditForm(editingPlace, findVisit(storedAssignments, editingAssignmentId))
    else if (prefillCoords) next = prefillForm(prefillCoords)
    else next = DEFAULT_FORM
    openForm(next, editingPlace, prefillCoords)
    setDeleteArmed(false)
    // storedAssignments is a fresh map each load, so it is read at open time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPlaceForm, editingPlace, prefillCoords, editingAssignmentId])

  // The area being planned, as a hint for search and autocomplete. Same helper
  // as the desktop dialog: the day currently open first, the whole trip only
  // while it still fits inside one region.
  const { box: locationBias } = useLocationBias()

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
    const pair = parseCoordinatePair(e.clipboardData.getData('text'))
    if (pair) {
      e.preventDefault()
      setForm(prev => ({ ...prev, lat: pair[0], lng: pair[1] }))
    }
  }

  // End before start blocks the save — tied to the values, not to which entry
  // point opened the sheet.
  const hasTimeError = endsBeforeStart(form.place_time, form.end_time)

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(t('places.nameRequired'))
      return
    }
    // #1152: first save of a new place warns on likely duplicates; a second
    // tap with the warning showing is the explicit "add anyway".
    if (!sheetPlace && !duplicateWarning && warnIfDuplicate(places)) return
    const withExpense = expenseIntentRef.current
    expenseIntentRef.current = false
    setIsSaving(true)
    try {
      const saved = await handleSavePlace(placeFormPayload(form, pendingFiles, ctxAssignment))
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
      toast.warning(planner.isTourPlace(sheetPlace.id)
        ? t('tours.delete.confirmBody')
        : t('mobileTrip.tapAgainToDelete'))
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
    <MSheet
      open={showPlaceForm}
      onClose={handleClose}
      material="opaque"
      ariaLabel={sheetPlace ? t('places.editPlace') : t('places.addPlace')}
      discardGuard={showPlaceForm ? { form, files: pendingFiles.length } : undefined}
    >
      <FormSheetHeader
        icon={MapPin}
        title={sheetPlace ? t('places.editPlace') : t('places.addPlace')}
        onClose={handleClose}
        closeLabel={t('common.close')}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-[2px]" onPaste={handlePaste}>
        <PlPlaceSearch
          planner={planner}
          locationBias={locationBias}
          onPick={applyPick}
          onSuggestionName={name => setForm(prev => ({ ...prev, name }))}
          onResolvingChange={setResolvingPick}
        />

        {placesEnrichEnabled && (
          <div className="mt-3">
            <PlaceDetailsColumn
              selection={detailsSelection}
              selectedImageUrl={form.image_url}
              onPickImage={pickImage}
              onAdoptDescription={adoptDescription}
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
            onAdd={addFiles}
            onRemove={removeFile}
          />
        )}

        {/* COSTS — same block, same flow as the booking sheet (#1298) */}
        {isBudgetEnabled && (
          <MLinkedCosts
            placeId={sheetPlace?.id}
            hintKey="places.createExpenseHint"
            createDisabled={!form.name.trim() || isSaving}
            onCreate={() => { expenseIntentRef.current = true; void handleSubmit() }}
            onEdit={item => onOpenExpense({ editItem: item })}
          />
        )}
      </div>

      <FormSheetFooter
        onDelete={sheetPlace ? handleDelete : undefined}
        deleteLabel={deleteArmed && sheetPlace && planner.isTourPlace(sheetPlace.id)
          ? t('tours.delete.confirmAction')
          : t('common.delete')}
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
