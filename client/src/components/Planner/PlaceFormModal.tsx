import { useState, useEffect, useRef, useMemo, useCallback, useId, type ReactNode } from 'react'
import type { RoadtripStopType } from '@trek/shared'
import NoteFormatToolbar from '../shared/NoteFormatToolbar'
import { useAuthStore } from '../../store/authStore'
import { useAddonStore } from '../../store/addonStore'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { useSettingsStore } from '../../store/settingsStore'
import CollectionPicker from '../Collections/CollectionPicker'
import PlaceDetailsColumn from './PlaceDetailsColumn'
import { useToast } from '../shared/Toast'
import { Tooltip } from '../shared/Tooltip'
import { Search, Paperclip, X, AlertTriangle, Loader2, Plus, RotateCcw, MapPin, Navigation, LocateFixed, PencilLine } from 'lucide-react'
import { useTranslation } from '../../i18n'
import CustomTimePicker from '../shared/CustomTimePicker'
import { PlaceContactFields } from './PlaceContactFields'
import { weekFromPeriods } from './placeHours'
import type { PlaceOpeningHours } from '@trek/shared'
import {
  DEFAULT_FORM, endsBeforeStart, findDuplicatePlace, formPin, mergeResult, parseCoordinatePair, placeEditForm, placeFormPayload,
  prefillForm, timeCollisions, type PlaceFormData,
} from './PlaceFormModal.helpers'
import { useNewCategory, usePlaceForm } from './usePlaceForm'
import { usePlaceSearch } from './usePlaceSearch'
import { guessCategoryId } from './placeCategoryGuess'
import { getNavigationTargets, openNavigationTarget } from './placeNavigation'
import { NavigationMenu } from '../shared/NavigationMenu'
import { offersGoogleRetry } from '../../utils/placeSource'
import { safeHexColor } from '../../utils/safeColor'
import { useLocationBias } from '../../hooks/useLocationBias'
import { BookingCostsSection } from './BookingCostsSection'
import type { BookingExpenseRequest } from './BookingCostsSection.types'
import type { Place, Category, Assignment, BudgetItem } from '../../types'
import { NumericInput } from '../shared/NumericInput'
import { formatDistance } from '../../utils/units'
import ServiceStopSection from '../Roadtrip/ServiceStopSection'
import { DEFAULT_SERVICE_KIND, serviceStopChoice, type ServiceStopMode } from '../Roadtrip/manualStop'
import { STOP_KIND_BY_KEY, type StopKind } from '../Roadtrip/stopKinds'
import { getCategoryIcon } from '../shared/categoryIcons'
import {
  DialogShell, DialogHeader, DialogTile, DialogSection, DialogFooter, FooterSpacer, DialogButton, NEUTRAL_TINT, PILL, fs,
} from '../shared/DialogShell'
import { EditorField, GRID_2, INPUT, LABEL, PANEL, PillSelect, TEXTAREA } from '../shared/dialogParts'
import { SoftPill, tintOf } from './planParts'
import { WHITE_BUTTON } from './placeDialogParts'

// The submit payload mirrors the form, but lat/lng are parsed to numbers and
// category_id is normalised, plus any files chosen before the place existed.
export interface PlaceSubmitData extends Omit<PlaceFormData, 'lat' | 'lng' | 'category_id'> {
  lat: number | null
  lng: number | null
  category_id: string | null
  _pendingFiles?: File[]
  /**
   * Where a road-trip service stop belongs on the drive, worked out from the
   * coordinates being saved. Travels the same way `_pendingFiles` does: the planner
   * reads it, strips it, and assigns the new place at that position.
   */
  _serviceStop?: { dayId: number; position: number; offRouteKm: number } | null
}

interface PlaceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: PlaceSubmitData, files?: File[]) => Promise<{ id: number } | void> | void
  place: Place | null
  prefillCoords?: { lat: number; lng: number; name?: string; address?: string; website?: string; phone?: string; osm_id?: string; stop_type?: RoadtripStopType | null; duration_minutes?: number; category?: string } | null
  tripId: number
  categories: Category[]
  onCategoryCreated: (category: { name: string; color?: string; icon?: string }) => Promise<Category> | undefined
  assignmentId: number | null
  dayAssignments?: Assignment[]
  /** Mobile keeps the untouched single-column form; desktop adds the saved-place
   *  picker column when the Collections addon is enabled. Sourced from the trip
   *  planner's useIsPhone(). */
  isMobile?: boolean
  /** Opens the Costs editor for this place's linked expense (#1298) — the same
   *  seam the booking and transport modals use. */
  onOpenExpense?: (req: BookingExpenseRequest) => void
  /**
   * Turns this into the form a road trip's service stop is added on: the category
   * control becomes the kind of stop, the costs section goes, and a row asks which leg
   * of the drive it belongs on. Absent, nothing about the form changes.
   */
  serviceStop?: ServiceStopMode | null
  /** Road trip mode is on, where a visit's End is when the drive leaves it. */
  roadtripActive?: boolean
}


/** The mark itself. Quiet on purpose: it answers a question, it does not advertise. */
function SourceBadge({ label }: { label: string | null }) {
  if (!label) return null
  return <SoftPill>{label}</SoftPill>
}

/** Place create/edit form state: maps search + Google-URL resolve + autocomplete,
 * category creation, file attachments and submit. Keeps PlaceFormModal a thin
 * render over the form fields. */
function usePlaceFormModal(props: PlaceFormModalProps) {
  const {
  isOpen, onClose, onSave, place, prefillCoords, tripId, categories,
  onCategoryCreated, assignmentId, dayAssignments = [], isMobile = false,
  onOpenExpense, serviceStop = null,
  } = props
  // Hidden while the addon is off, because the kinds only mean anything to the road trip
  // rail: on an instance without it they would be six labels that change nothing.
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit) || 'metric'
  const toast = useToast()
  const { t, locale } = useTranslation()
  const { placesEnrichEnabled } = useAuthStore()
  const can = useCanDo()
  const timeFormat = useSettingsStore((s) => s.settings.time_format) || '24h'
  const tripObj = useTripStore((s) => s.trip)
  const canUploadFiles = can('file_upload', tripObj)
  const collectionsEnabled = useAddonStore((s) => s.isEnabled('collections'))
  const isBudgetEnabled = useAddonStore((s) => s.isEnabled('budget'))
  const deleteBudgetItem = useTripStore((s) => s.deleteBudgetItem)
  const {
    form, setForm, autoFilledRef, pendingFiles, addFilesFromInput, removeFile, handlePaste, isSaving, setIsSaving,
    duplicateWarning, detailsSelection, setDetailsSelection, openForm, handleChange: changeField, pickImage,
    adoptDescription, warnIfDuplicate,
  } = usePlaceForm({ t, toast, canUploadFiles })
  // The index the picked place came from, as its row named it, shown as a pill
  // in the head band. Null for a place typed by hand or taken from the saved list.
  const [pickedSource, setPickedSource] = useState<string | null>(null)
  // Whether the category was preselected from a search result rather than chosen, so
  // the next pick may replace it and a hand choice is never overwritten (#2282).
  const categoryGuessedRef = useRef(false)
  const guessedCategory = (result: Record<string, unknown>): string => {
    const id = guessCategoryId(result, categories || [])
    categoryGuessedRef.current = id != null
    return id != null ? String(id) : ''
  }
  // The hours the details column looked up, as a week the contact block can take over (#2472).
  const [detailsHours, setDetailsHours] = useState<PlaceOpeningHours | null>(null)
  /**
   * The leg of the drive the traveller picked, or empty while the projection's own
   * answer stands. Empty rather than seeded, because there is nothing to project onto
   * until a place has been chosen and the answer has to follow the coordinates.
   */
  const [serviceStopLeg, setServiceStopLeg] = useState('')
  const fileRef = useRef(null)
  // Set right before submit when the user clicked create/edit expense — the
  // place has to exist before an expense can point at it (see ReservationModal).
  const expenseIntentRef = useRef<{ editItem?: BudgetItem; create?: boolean } | null>(null)
  const newCategory = useNewCategory({
    variant: 'dialog',
    create: category => onCategoryCreated?.(category),
    onCreated: categoryId => setForm(prev => ({ ...prev, category_id: categoryId })),
    t,
    toast,
  })

  useEffect(() => {
    categoryGuessedRef.current = false
    let next: PlaceFormData
    if (place) {
      const assignment = assignmentId ? dayAssignments.find(a => a.id === assignmentId) : null
      next = placeEditForm(place, assignment, {
        // Shown in the contact block now (#2472), so an edit carries what is there.
        phone: place.phone || '',
        email: place.email || '',
        opening_hours: place.opening_hours || '',
        // Carried through every edit. Without it, opening a fuel stop to fix a typo
        // submits an empty kind and turns it back into a numbered destination.
        // duration_minutes deliberately stays out: how long a stay takes belongs to the
        // rail's own dialog, and sending it from here would overwrite what was set there.
        stop_type: place.stop_type ?? null,
      })
    } else if (prefillCoords) {
      next = prefillForm(prefillCoords, {
        category_id: guessedCategory(prefillCoords),
        stop_type: prefillCoords.stop_type ?? null,
        duration_minutes: prefillCoords.duration_minutes,
      })
    } else if (serviceStop) {
      // A stop on a drive is a kind and a dwell before it is anything else, so the form
      // opens on one rather than on nothing: a service stop left without a kind is a
      // numbered destination that counts in every total, which is the very thing this
      // path exists to avoid. Read out of the closure rather than watched, because the
      // mode is fixed for the life of one opening and a rebuilt drive must not reset a
      // half-filled form.
      // What the corridor panel was looking for when the button was pressed, because
      // that is the traveller's own answer to what they are adding; only a panel with
      // nothing selected falls back to the constant. The dwell follows the kind, the
      // same way picking one by hand moves it.
      const kind = serviceStop.defaultKind ?? DEFAULT_SERVICE_KIND
      next = {
        ...DEFAULT_FORM,
        stop_type: kind,
        duration_minutes: STOP_KIND_BY_KEY[kind].defaultMinutes,
      }
    } else {
      next = DEFAULT_FORM
    }
    // The column follows whatever the dialog was opened with, not only a search
    // pick: a POI tapped on the map and a right-click place arrive as
    // prefillCoords, and editing an existing place arrives as `place`.
    openForm(next, place, prefillCoords)
    setServiceStopLeg('')
    setPickedSource(null)
    // A fresh dialog owns no intention either. The ref is armed by a click on the Costs
    // section and spent by the save that follows it; a save that never happened leaves it
    // armed, and the next opening would consume it for a place nobody linked an expense
    // to. In service-stop mode that opening has no Costs section at all, so the editor
    // would arrive out of nowhere, on a petrol stop, filed as an activity.
    expenseIntentRef.current = null
    // dayAssignments is a fresh array each render; read it at open-time only and
    // re-run on identity changes (place/assignmentId/open), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place, prefillCoords, isOpen, assignmentId])

  const places = useTripStore((s) => s.places)
  // Where the trip is happening — the hint that tells the search which of a
  // thousand identically named places is meant. Autocomplete wants a box, the
  // search wants a point; both are derived from the same places.
  const { box: locationBias } = useLocationBias()

  /**
   * The one point every pick flows through, so the detail column hangs here: a
   * search row, a suggestion's place, or a place from the saved-place picker.
   * `label` is the name the picked row's badge carried; a saved place names none.
   */
  const applyPickedPlace = (result: Record<string, unknown>, label: string | null) => {
    setForm(prev => {
      const merged = mergeResult(prev, result, autoFilledRef.current)
      if (prev.category_id && !categoryGuessedRef.current) return merged
      return { ...merged, category_id: guessedCategory(result) }
    })
    setPickedSource(label)
    // A new pick drops whatever hero image belonged to the previous place.
    const lat = Number(result.lat)
    const lng = Number(result.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setDetailsSelection({
        placeId: (result.google_place_id || result.amap_poi_id || result.osm_id || undefined) as string | undefined,
        lat,
        lng,
        name: (result.name as string) || '',
        // Hand the record along: the server needs the same OSM tags, and
        // looking them up again costs an Overpass round trip it can skip.
        details: result,
      })
      setForm(prev => ({ ...prev, image_url: undefined }))
    }
  }

  const search = usePlaceSearch({
    variant: 'dialog',
    locationBias,
    t,
    toast,
    // The planner keeps this dialog mounted while it is closed (the shell only
    // stops drawing it), so the search block is reset when it closes, apart from
    // the opening effect above: that one also reruns while the dialog is open, when
    // a right-click's reverse lookup fills prefillCoords, and must not wipe a
    // search the user has started since.
    open: isOpen,
    onPlace: applyPickedPlace,
    onSuggestionName: name => setForm(prev => ({ ...prev, name })),
    onMapLink: resolved => {
      setForm(prev => ({
        ...prev,
        name: resolved.name || prev.name,
        address: resolved.address || prev.address,
        lat: String(resolved.lat),
        lng: String(resolved.lng),
        google_ftid: resolved.google_ftid || prev.google_ftid,
      }))
      // The fields are the link's now, not the last picked result's.
      setPickedSource(null)
    },
  })

  /**
   * What a stop on a drive might be a second copy of, said while the form is being filled.
   *
   * By the map record and by where it stands, never by its name: two Arals on one
   * motorway are two petrol stations, and a check that called them one refused the save
   * the first time it was pressed. This one refuses nothing: it is a note beside the
   * name, and the reader decides.
   */
  const serviceStopDuplicate = useMemo(() => {
    if (!serviceStop || place) return null
    return findDuplicatePlace(form, places, { byName: false, byOsmId: true })?.name ?? null
  }, [serviceStop, place, form, places])

  const handleChange = (field: string, value: string) => {
    if (field === 'category_id') categoryGuessedRef.current = false
    changeField(field, value)
  }

  // What is around the pin the form holds (#976).
  const pin = formPin(form)
  const handleNearby = () => search.searchNearby(pin)

  /**
   * The kind of stop, and with it how long that kind usually takes.
   *
   * Picking a kind is also picking a dwell, until the user says otherwise: a charge is
   * not a fuel stop. Only ever called for a kind that is not already on, so a dwell set
   * by hand survives a second click on the same pill.
   */
  const handleStopKind = useCallback((kind: RoadtripStopType) => {
    setForm(prev => ({ ...prev, stop_type: kind, duration_minutes: STOP_KIND_BY_KEY[kind].defaultMinutes }))
  }, [setForm])

  const handleStopMinutes = useCallback((minutes: number) => {
    setForm(prev => ({ ...prev, duration_minutes: minutes }))
  }, [setForm])

  const hasTimeError = !!place && endsBeforeStart(form.place_time, form.end_time)

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.()
    if (!form.name.trim()) {
      // Nothing was saved, so an expense intent from a previous click is stale —
      // otherwise the next plain Save would open a Costs editor out of nowhere.
      expenseIntentRef.current = null
      toast.error(t('places.nameRequired'))
      return
    }
    // #1152: only for new places, and only on the first attempt — a second click
    // (with the warning already showing) is the explicit "add anyway" confirmation.
    //
    // Never for a stop on a drive. Most of what that check catches is a repeated name,
    // and on a motorway a repeated name is the normal case: the second Aral is four
    // hundred kilometres from the first and is a different petrol station. The popup this
    // path replaced compared the OSM object for exactly that reason and never gated the
    // save on it, only noted it. So the note is shown beside the name while the form is
    // being filled (see serviceStopDuplicate), which is the earlier word anyway, and the
    // press that saves is the press that saves.
    if (!place && !serviceStop && !duplicateWarning && warnIfDuplicate(places)) {
      // Nothing was saved, so an expense intent from a previous click is stale, and
      // the next plain Save would otherwise open a Costs editor out of nowhere.
      expenseIntentRef.current = null
      return
    }
    setIsSaving(true)
    try {
      const ctxAssignment = assignmentId ? dayAssignments.find(a => a.id === assignmentId) : null
      const payload = placeFormPayload(form, pendingFiles, ctxAssignment, (lat, lng) => ({
        // An explicit null is how a stop stops being a fuel stop; the service reads it
        // that way rather than as "leave alone", which is what a missing key means.
        stop_type: form.stop_type || null,
        // Only on the way in, and only with a kind: it is the popup's suggestion for how
        // long that kind of pause takes. On an edit it is left out entirely, because the
        // stay belongs to the rail's dialog and sending it here would overwrite it.
        ...(!place && form.stop_type && form.duration_minutes
          ? { duration_minutes: form.duration_minutes }
          : {}),
        // Where on the drive it goes, worked out HERE and not when the dialog opened: a
        // stop added by hand has no coordinates at all until a place has been chosen in
        // it, so the answer has to follow what is actually being saved.
        ...(serviceStop
          ? { _serviceStop: serviceStopChoice(serviceStop, lat, lng, serviceStopLeg).placement }
          : {}),
      }))
      const saved = await onSave(payload)
      // Open the Costs editor for the saved place when the user asked to
      // create/edit its linked expense — gated on an id, so a create that the
      // server refused never opens an editor pointing at nothing (#1298).
      const intent = expenseIntentRef.current
      expenseIntentRef.current = null
      const savedId = (saved && 'id' in saved ? saved.id : null) ?? place?.id ?? null
      if (intent && onOpenExpense && savedId) {
        if (intent.editItem) onOpenExpense({ editItem: intent.editItem })
        else onOpenExpense({ prefill: { placeId: savedId, name: form.name.trim(), category: 'activities' } })
      }
      onClose()
    } catch (err: unknown) {
      // The save did not happen, so the intent behind it cannot be honoured: the place
      // the expense would point at does not exist. Left armed it would ride along to
      // whatever the next press saves.
      expenseIntentRef.current = null
      toast.error(err instanceof Error ? err.message : t('places.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateExpense = () => { expenseIntentRef.current = { create: true }; void handleSubmit() }
  const handleEditExpense = (item: BudgetItem) => { expenseIntentRef.current = { editItem: item }; void handleSubmit() }
  const handleRemoveExpense = async (item: BudgetItem) => {
    try { await deleteBudgetItem(Number(tripId), item.id) } catch { toast.error(t('common.unknownError')) }
  }

  return {
    isOpen,
    onClose,
    place,
    prefillCoords,
    categories,
    assignmentId,
    dayAssignments,
    isMobile,
    collectionsEnabled,
    form,
    mapsSearch: search.query,
    setMapsSearch: search.setQuery,
    mapsResults: search.results,
    isSearchingMaps: search.searching,
    newCategoryName: newCategory.name,
    setNewCategoryName: newCategory.setName,
    showNewCategory: newCategory.open,
    setShowNewCategory: newCategory.setOpen,
    isSaving,
    pendingFiles,
    emptySearch: search.emptySearch, setEmptySearch: search.setEmptySearch,
    detailsHours, setDetailsHours,
    fileRef,
    acSuggestions: search.suggestions,
    setAcSuggestions: search.setSuggestions,
    acSource: search.acSource,
    searchSource: search.searchSource,
    acHighlight: search.highlight,
    setAcHighlight: search.setHighlight,
    t,
    language: search.language,
    locale,
    timeFormat,
    googleAnswers: search.googleAnswers,
    placesEnrichEnabled,
    canUploadFiles,
    locationBias,
    fetchSuggestions: search.fetchSuggestions,
    sourceLabel: search.sourceLabel,
    handleChange,
    handleMapsSearch: search.runSearch,
    handleNearby,
    pin,
    nearbyList: search.nearbyList,
    distanceUnit,
    handleSelectMapsResult: search.pickPlace,
    handleSelectSuggestion: search.selectSuggestion,
    handleSearchKeyDown: search.handleKeyDown,
    handleCreateCategory: newCategory.submit,
    handleFileAdd: addFilesFromInput,
    handleRemoveFile: removeFile,
    handlePaste,
    pickImage,
    adoptDescription,
    hasTimeError,
    handleSubmit,
    duplicateWarning,
    pickedSource,
    detailsSelection,
    isBudgetEnabled,
    handleCreateExpense,
    handleEditExpense,
    handleRemoveExpense,
    serviceStop,
    serviceStopDuplicate,
    serviceStopLeg,
    setServiceStopLeg,
    handleStopKind,
    handleStopMinutes,
  }
}

/**
 * Detail column, form and saved places side by side, inside the scrolling body
 * rather than as it: a row that scrolled itself would stretch the side columns
 * to the visible height only, and they would end halfway down the form.
 */
const ROW = 'flex items-stretch gap-5'
const STACK = 'flex flex-col gap-5'
const FORM_COLUMN = 'flex min-w-0 flex-1 flex-col gap-4'
/** A row of the typed-ahead list or of the search results. */
const PICK_ROW = 'flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-start'
const WARNING_BANNER = 'flex items-start gap-1.5 rounded-[10px] bg-warning-soft px-2.5 py-1.5 text-warning'
/** The small accent square beside a field that runs its action, sized by the row it sits in. */
const SIDE_BUTTON = 'grid w-[38px] flex-none place-items-center rounded-[10px] transition-colors disabled:cursor-default disabled:opacity-60'
/**
 * ServiceStopSection draws its labels in the old form's look and takes no class
 * for them; this gives them the eyebrow every other field here has.
 */
const SERVICE_STOP_LABELS = '[&_label]:mb-[5px] [&_label]:block [&_label]:font-geist [&_label]:text-[length:calc(9.5px*var(--fs-scale-caption,1))] [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-[.08em] [&_label]:text-content-faint'
/** A round white button in the head band's pill row, as tall as the pills beside it. */
const ROUND_PILL_BUTTON = 'grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm ring-1 ring-edge-faint transition-colors hover:text-content'

type Translate = (key: string, params?: Record<string, string | number>) => string

export default function PlaceFormModal(props: PlaceFormModalProps) {
  const S = usePlaceFormModal(props)
  const {
    isOpen, onClose, place, prefillCoords, categories, isMobile, collectionsEnabled, form,
    mapsSearch, setMapsSearch, mapsResults, isSearchingMaps, acSuggestions, setAcSuggestions, acSource,
    searchSource, acHighlight, setAcHighlight, t, language, googleAnswers, placesEnrichEnabled,
    canUploadFiles, fetchSuggestions, sourceLabel, handleChange, handleMapsSearch, handleSelectMapsResult,
    handleNearby, pin, nearbyList, distanceUnit,
    handleSelectSuggestion, handleSearchKeyDown, hasTimeError, handleSubmit, isSaving, duplicateWarning,
    detailsSelection, serviceStop, serviceStopDuplicate,
  } = S
  const titleId = useId()
  const fieldId = useId()
  // Desktop + Collections addon → the saved-place picker on the right. Mobile
  // always keeps the original single-column form untouched.
  const twoColumn = !isMobile && collectionsEnabled
  // The detail column sits on the left on desktop whenever enrichment is on; on
  // mobile it stacks above the form. It stays mounted with the selection null
  // rather than appearing on the first pick — otherwise the dialog would jump
  // sideways mid-typing.
  const showDetails = placesEnrichEnabled
  const inRow = !isMobile && (showDetails || twoColumn)
  // The form keeps about the same width whichever columns flank it: 552 px
  // alone, 572 px beside one 320 px column, 552 px between two.
  const width = inRow && showDetails && twoColumn ? 'xwide' : inRow ? 'wide' : 'detail'

  // A stop on a drive is not an activity, and the title is the first thing that says
  // which of the two this dialog is asking about. It is the band's eyebrow, and the
  // place's own name is typed into the band under it, as on a booking.
  const title = place ? t('places.editPlace') : serviceStop ? t('roadtrip.stop.addTitle') : t('places.addPlace')
  // The tile wears what the place is: the kind of stop on a drive, otherwise
  // the chosen category, otherwise a plain pin.
  const kind = serviceStop && form.stop_type ? STOP_KIND_BY_KEY[form.stop_type] : undefined
  const category = serviceStop ? undefined : (categories || []).find(c => String(c.id) === form.category_id)
  const tone = kind?.color ?? (category ? safeHexColor(category.color, '') : '')
  const TileIcon = kind?.Icon ?? getCategoryIcon(category?.icon)

  // The line under the name. A stop on a drive that looks like one already on the
  // trip says so here, while the form is being filled, and never as a condition of
  // saving: the press that saves is the press that saves. Otherwise, until there is
  // a name, that one is required, since the save refuses without it.
  let headerSub: ReactNode
  if (serviceStopDuplicate) {
    headerSub = <span className="text-warning">{t('roadtrip.stop.duplicate', { name: serviceStopDuplicate })}</span>
  } else if (!form.name.trim()) {
    headerSub = `${t('places.formName')} *`
  }

  const header = (
    <DialogHeader
      tile={<DialogTile><TileIcon size={20} strokeWidth={1.9} style={{ color: tone || 'var(--text-muted)' }} /></DialogTile>}
      tint={tone ? tintOf(tone) : NEUTRAL_TINT}
      labelId={titleId}
      onClose={onClose}
      eyebrow={title}
      // Not autoFocused itself: a new place starts at the search, and otherwise the
      // dialog's own first-field focus lands here on a desktop (#1302), so a place
      // brought in from the map or opened to edit is ready for its name.
      titleInput={{
        value: form.name,
        onChange: value => handleChange('name', value),
        label: `${t('places.formName')} *`,
        placeholder: t('places.formNamePlaceholder'),
        required: true,
      }}
      sub={headerSub}
      subWraps={!!serviceStopDuplicate}
      pills={(
        <HeaderPills
          kind={kind}
          categories={categories}
          categoryId={form.category_id}
          onCategory={value => handleChange('category_id', value)}
          newCategory={{
            open: S.showNewCategory,
            setOpen: S.setShowNewCategory,
            name: S.newCategoryName,
            setName: S.setNewCategoryName,
            create: S.handleCreateCategory,
            inputId: `${fieldId}-new-category`,
          }}
          pickedSource={S.pickedSource}
          busy={isSearchingMaps}
          navPlace={form.lat && form.lng ? {
            name: form.name, address: form.address, lat: Number(form.lat), lng: Number(form.lng),
            google_place_id: form.google_place_id || null, google_ftid: form.google_ftid || null,
          } : null}
          t={t}
        />
      )}
    />
  )

  const footer = (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      {/* The only way to save: Enter in a field never submits this form. */}
      <DialogButton variant="primary" onClick={() => void handleSubmit()} disabled={isSaving || hasTimeError}>
        {isSaving ? t('common.saving') : place ? t('common.update') : duplicateWarning ? t('places.addAnyway') : t('common.add')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <DialogShell
      open={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      width={width}
      align="top"
      // A stray click beside the editor asks before the typing is lost (#2253).
      discardGuard={{ form, files: S.pendingFiles.length }}
      onPaste={S.handlePaste}
      header={header}
      footer={footer}
    >
      <div className={inRow ? ROW : STACK}>
        {showDetails && (
          <PlaceDetailsColumn
            selection={detailsSelection}
            selectedImageUrl={form.image_url}
            onPickImage={S.pickImage}
            onAdoptDescription={S.adoptDescription}
            onHours={(hours) => S.setDetailsHours(weekFromPeriods(hours.periods))}
            hasDescription={!!form.description.trim()}
            language={language}
            timeFormat={S.timeFormat}
            locale={S.locale}
            variant="dialog"
            // Stacked above the form in a narrow window, it takes the form's width.
            fluid={isMobile}
            t={t}
          />
        )}
        <form onSubmit={handleSubmit} className={FORM_COLUMN}>

          {/* Place search: typed-ahead suggestions, a full search, and a pasted map link. */}
          <div className={PANEL}>
            <EditorField label={t('common.search')} htmlFor={`${fieldId}-search`}>
              <div className="relative">
                <div className="flex items-stretch gap-2">
                  <input
                    id={`${fieldId}-search`}
                    type="text"
                    // A new place starts at the search; an edit or a place brought
                    // in from the map already has what the search would give.
                    autoFocus={!place && !prefillCoords}
                    value={mapsSearch}
                    onChange={e => { setMapsSearch(e.target.value); S.setEmptySearch(null) }}
                    onKeyDown={handleSearchKeyDown}
                    onBlur={() => setTimeout(() => setAcSuggestions([]), 150)}
                    onFocus={() => {
                      if (mapsSearch.trim().length >= 2 && acSuggestions.length === 0 && mapsResults.length === 0) {
                        fetchSuggestions(mapsSearch.trim())
                      }
                    }}
                    placeholder={t('places.mapsSearchPlaceholder')}
                    className={`${INPUT} flex-1`}
                  />
                  <Tooltip label={t('common.search')}>
                    <button
                      type="button"
                      onClick={() => { setAcSuggestions([]); void handleMapsSearch() }}
                      disabled={isSearchingMaps}
                      aria-label={t('common.search')}
                      className={`${SIDE_BUTTON} bg-accent text-accent-text hover:opacity-90`}
                      style={fs(13, 'body')}
                    >
                      {isSearchingMaps ? '...' : <Search size={15} strokeWidth={2.2} aria-hidden="true" />}
                    </button>
                  </Tooltip>
                  {pin && (
                    <Tooltip label={t('places.nearby')}>
                      <button
                        type="button"
                        onClick={handleNearby}
                        disabled={isSearchingMaps}
                        aria-label={t('places.nearby')}
                        className={`${SIDE_BUTTON} border border-edge bg-surface-card text-content-secondary hover:bg-surface-hover`}
                      >
                        <LocateFixed size={15} strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    </Tooltip>
                  )}
                </div>

                {/* Autocomplete dropdown. Capped and scrolling, because plugin rows can
                    follow the core ones (#2221) and the list must stay inside the dialog;
                    the row the arrow keys land on is scrolled into view. */}
                {acSuggestions.length > 0 && (
                  <div className="absolute inset-x-0 z-20 mt-1 max-h-96 overflow-y-auto rounded-[12px] border border-edge-faint bg-surface-card p-1 shadow-dropdown">
                    {acSuggestions.map((s, idx) => (
                      <button
                        key={s.placeId}
                        ref={idx === acHighlight ? (el) => el?.scrollIntoView?.({ block: 'nearest' }) : undefined}
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(s)}
                        onMouseEnter={() => setAcHighlight(idx)}
                        className={`${PICK_ROW} ${idx === acHighlight ? 'bg-surface-tertiary' : 'hover:bg-surface-hover'}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-content" style={fs(13, 'body')}>{s.mainText}</span>
                          {s.secondaryText && (
                            <span className="block truncate text-content-muted" style={fs(11.5)}>{s.secondaryText}</span>
                          )}
                        </span>
                        <SourceBadge label={sourceLabel(s, acSource)} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </EditorField>

            {/* Nothing found (#2472): say so, and offer the hand-made way in, taking
                the query as the name when there is none yet. */}
            {S.emptySearch && mapsResults.length === 0 && !isSearchingMaps && (
              <div className="flex items-center gap-3 rounded-[12px] border border-dashed border-edge bg-surface-card px-3 py-2.5">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-tertiary text-content-muted">
                  <PencilLine size={15} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-content" style={fs(12.5, 'body')}>{t('places.searchNothing', { query: S.emptySearch })}</span>
                  <span className="block text-content-muted" style={fs(11.5)}>{t('places.searchNothingHint')}</span>
                </span>
                <button type="button"
                  onClick={() => {
                    if (!form.name.trim()) handleChange('name', S.emptySearch!)
                    S.setEmptySearch(null)
                    document.getElementById(`${fieldId}-contact`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
                  }}
                  className="flex-none rounded-full bg-accent px-3 py-1.5 font-semibold text-accent-text hover:opacity-90"
                  style={fs(12, 'body')}>
                  {t('places.addByHand')}
                </button>
              </div>
            )}

            {/* Search results (populated after full search) */}
            {mapsResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-[10px] border border-edge-faint bg-surface-card p-1">
                {mapsResults.map((result, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectMapsResult(result, { mode: 'search', rank: idx, count: mapsResults.length })}
                    className={`${PICK_ROW} hover:bg-surface-hover`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-content" style={fs(13, 'body')}>{result.name}</span>
                      {result.address && <span className="block truncate text-content-muted" style={fs(11.5)}>{result.address}</span>}
                    </span>
                    {nearbyList && typeof result.distance_m === 'number' && (
                      <SoftPill>{formatDistance(result.distance_m / 1000, distanceUnit)}</SoftPill>
                    )}
                    <SourceBadge label={sourceLabel(result, searchSource)} />
                  </button>
                ))}
              </div>
            )}
            {/* The index answers first and Google only when it finds nothing, so a
                list with the wrong place on it never reaches Google by itself. One
                quiet line under the list sends the same query there, on an instance
                where Google holds the key slot and for a list Google did not
                already produce. */}
            {mapsResults.length > 0 && !nearbyList && offersGoogleRetry(searchSource, googleAnswers) && (
              <button
                type="button"
                onClick={() => handleMapsSearch('google')}
                disabled={isSearchingMaps}
                className="inline-flex items-center gap-1 self-start text-content-faint transition-colors hover:text-content disabled:opacity-50"
                style={fs(12)}
              >
                <RotateCcw size={11} strokeWidth={2} aria-hidden="true" />
                {t('places.searchGoogleInstead')}
              </button>
            )}
          </div>

          {/* Where it is: what a pick, a pasted link or the map filled in, or typed by hand. */}
          <div className={PANEL}>
            <EditorField label={t('places.formAddress')} htmlFor={`${fieldId}-address`}>
              <input
                id={`${fieldId}-address`}
                type="text"
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder={t('places.formAddressPlaceholder')}
                className={INPUT}
              />
            </EditorField>
            <div role="group" aria-label={t('collections.coordinates')} className={GRID_2}>
              <EditorField label={t('places.formLatLabel')} htmlFor={`${fieldId}-lat`}>
                <NumericInput
                  id={`${fieldId}-lat`}
                  mode="signed"
                  value={form.lat}
                  onValueChange={v => handleChange('lat', v)}
                  onPaste={e => {
                    // "48.85, 2.35" pasted into the latitude fills both halves.
                    const pair = parseCoordinatePair(e.clipboardData.getData('text'))
                    if (pair) {
                      e.preventDefault()
                      handleChange('lat', pair[0])
                      handleChange('lng', pair[1])
                    }
                  }}
                  placeholder={t('places.formLat')}
                  className={INPUT}
                />
              </EditorField>
              <EditorField label={t('places.formLngLabel')} htmlFor={`${fieldId}-lng`}>
                <NumericInput
                  id={`${fieldId}-lng`}
                  mode="signed"
                  value={form.lng}
                  onValueChange={v => handleChange('lng', v)}
                  placeholder={t('places.formLng')}
                  className={INPUT}
                />
              </EditorField>
            </div>
          </div>

          {/* For a stop on a drive: the kind of stop, how long, and where it belongs.
              The category it replaces is gone from the head band too: refuelling is
              not a taste, it is a fact about the place, so it lives in
              `places.stop_type` and not in the trip's own editable category list. */}
          {serviceStop && (
            <div className={`${PANEL} ${SERVICE_STOP_LABELS}`}>
              <ServiceStopSection
                mode={serviceStop}
                stopType={form.stop_type ?? null}
                onStopType={S.handleStopKind}
                minutes={form.duration_minutes ?? 0}
                onMinutes={S.handleStopMinutes}
                leg={S.serviceStopLeg}
                onLeg={S.setServiceStopLeg}
                lat={form.lat ? Number.parseFloat(form.lat) : null}
                lng={form.lng ? Number.parseFloat(form.lng) : null}
              />
            </div>
          )}


          {/* The day in context: its times and its own note. Both live on the
              day-assignment, not on the pool place (#2163), so they are only shown
              when a single assignment is in context (itinerary edit, or a
              single-assignment pool edit). Hidden when creating, and for unassigned
              or multi-day pool edits where a single time is ambiguous and would not
              persist. */}
          {!!(place && S.assignmentId) && (
            <div className={PANEL}>
              <TimeSection
                form={form}
                handleChange={handleChange}
                assignmentId={S.assignmentId}
                dayAssignments={S.dayAssignments}
                hasTimeError={hasTimeError}
                endIsLeave={!!props.roadtripActive}
                t={t}
              />
              <EditorField label={t('places.assignmentNotes')} htmlFor={`${fieldId}-day-notes`}>
                <textarea
                  id={`${fieldId}-day-notes`}
                  value={form.assignment_notes ?? ''}
                  onChange={e => handleChange('assignment_notes', e.target.value)}
                  rows={2}
                  placeholder={t('places.assignmentNotesPlaceholder')}
                  className={`${TEXTAREA} resize-y`}
                />
              </EditorField>
            </div>
          )}

          <MarkdownField
            id={`${fieldId}-description`}
            label={t('places.formDescription')}
            value={form.description}
            onChange={v => handleChange('description', v)}
            placeholder={t('places.formDescriptionPlaceholder')}
          />

          {/* Notes — Markdown, same as the description, and rendered as such in the
              inspector. The bar is how anyone finds that out. */}
          <MarkdownField
            id={`${fieldId}-notes`}
            label={t('places.formNotes')}
            value={form.notes}
            onChange={v => handleChange('notes', v)}
            placeholder={t('places.formNotesPlaceholder')}
            maxLength={2000}
          />

          {/* The link and the files side by side, as on a booking. */}
          <div className={canUploadFiles ? GRID_2 : ''}>
            <EditorField label={t('places.formWebsite')} htmlFor={`${fieldId}-website`}>
              <input
                id={`${fieldId}-website`}
                type="url"
                value={form.website}
                onChange={e => handleChange('website', e.target.value)}
                placeholder="https://..."
                className={INPUT}
              />
            </EditorField>
            {canUploadFiles && (
              <PendingFiles
                files={S.pendingFiles}
                fileRef={S.fileRef}
                onAdd={S.handleFileAdd}
                onRemove={S.handleRemoveFile}
                t={t}
              />
            )}
          </div>

          {/* Phone, e-mail and the place's own hours, for what the search did not
              know or a place nobody has listed (#2472). */}
          <PlaceContactFields
            id={`${fieldId}-contact`}
            phone={form.phone ?? ''}
            email={form.email ?? ''}
            openingHours={form.opening_hours ?? ''}
            suggestedHours={S.detailsHours}
            onChange={(field, value) => handleChange(field, value)}
          />

          {/* Costs — create / view the expense linked to this place (#1298).
              Same block, same flow as a booking: save first, then the editor.

              Never for a stop on a drive: a petrol stop is not an activity with a budget
              line, and the fuel it buys is an expense of the trip rather than of a place. */}
          {S.isBudgetEnabled && !serviceStop && (
            <BookingCostsSection
              placeId={place?.id ?? null}
              reservationId={null}
              hintKey="places.createExpenseHint"
              onCreate={S.handleCreateExpense}
              onEdit={S.handleEditExpense}
              onRemove={S.handleRemoveExpense}
              labelClassName={LABEL}
              customTooltips
              whiteButtons
            />
          )}
        </form>
        {twoColumn && (
          <CollectionPicker bias={S.locationBias} onSelect={handleSelectMapsResult} t={t} />
        )}
      </div>
    </DialogShell>
  )
}

interface NewCategoryRow {
  open: boolean
  setOpen: (open: boolean) => void
  name: string
  setName: (name: string) => void
  create: () => Promise<void>
  inputId: string
}

/**
 * The head band's pill row. The category to pick, with a round + beside it that
 * turns the two into a field for a new one; for a stop on a drive, its kind in
 * place of both. Then where the picked place came from, and a spinner while a
 * pick is still being looked up.
 */
function HeaderPills({ kind, categories, categoryId, onCategory, newCategory, pickedSource, busy, navPlace, t }: {
  kind?: StopKind
  categories: Category[] | null
  categoryId: string
  onCategory: (id: string) => void
  newCategory: NewCategoryRow
  pickedSource: string | null
  busy: boolean
  /** The place as the form holds it, once it has a position: opens it in a map app (#2178). */
  navPlace: NavigablePlace | null
  t: Translate
}) {
  // When the new-category field closes, the field or the button that closed it
  // goes with it, and the focus would drop out of the dialog. It comes back to
  // the + that opened the field, as a picker's focus comes back to its pill.
  const plusRef = useRef<HTMLButtonElement | null>(null)
  const wasOpen = useRef(newCategory.open)
  useEffect(() => {
    const closed = wasOpen.current && !newCategory.open
    wasOpen.current = newCategory.open
    if (!closed) return
    const active = document.activeElement
    if (!active || active === document.body || !active.isConnected) plusRef.current?.focus()
  }, [newCategory.open])

  const noCategory = { label: t('places.noCategory'), icon: <MapPin size={13} strokeWidth={2.2} className="text-content-faint" /> }
  const options = [
    { value: '', ...noCategory },
    ...(categories || []).map(c => {
      const Icon = getCategoryIcon(c.icon)
      // A string like form.category_id, so the picked option hands back the same
      // kind of value the form already keeps.
      return { value: String(c.id), label: c.name, icon: <Icon size={13} strokeWidth={2.2} style={{ color: safeHexColor(c.color, '') || 'var(--text-muted)' }} /> }
    }),
  ]

  let lead: ReactNode
  if (kind) {
    lead = <span className={PILL}><kind.Icon size={13} strokeWidth={2.2} style={{ color: kind.color }} />{t(kind.labelKey)}</span>
  } else if (newCategory.open) {
    lead = <NewCategoryField {...newCategory} t={t} />
  } else {
    lead = (
      <>
        <PillSelect label={t('places.formCategory')} value={categoryId} onChange={onCategory} options={options} fallback={noCategory} />
        <Tooltip label={t('places.newCategory')}>
          <button ref={plusRef} type="button" onClick={() => newCategory.setOpen(true)} aria-label={t('places.newCategory')} className={ROUND_PILL_BUTTON}>
            <Plus size={13} strokeWidth={2.4} />
          </button>
        </Tooltip>
      </>
    )
  }

  return (
    <>
      {lead}
      {pickedSource && (
        <span className={PILL}>
          <Search size={12} strokeWidth={2.2} className="text-content-faint" aria-hidden="true" />
          {pickedSource}
        </span>
      )}
      {navPlace && <OpenInMapsPill place={navPlace} t={t} />}
      {busy && (
        <span className={PILL} role="status" aria-label={t('places.loadingDetails')}>
          <Loader2 size={13} className="animate-spin text-content-faint" aria-hidden="true" />
          <span className="font-medium text-content-muted">{t('places.loadingDetails')}</span>
        </span>
      )}
    </>
  )
}

type NavigablePlace = Pick<Place, 'name' | 'address' | 'lat' | 'lng' | 'google_place_id' | 'google_ftid'>

/**
 * A look at the picked place in a real map before it is saved (#2178): its reviews, its
 * photos, whether it is the right branch. The same apps the inspector offers, one tap
 * straight away when only one applies.
 */
function OpenInMapsPill({ place, t }: { place: NavigablePlace; t: Translate }) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const targets = getNavigationTargets(place)
  if (targets.length === 0) return null
  return (
    <span ref={anchorRef} className="inline-flex">
      <Tooltip label={t('places.openInMaps')}>
        <button type="button" aria-label={t('places.openInMaps')} aria-haspopup={targets.length > 1 ? 'menu' : undefined}
          aria-expanded={targets.length > 1 ? open : undefined}
          onClick={() => { if (targets.length === 1) openNavigationTarget(targets[0]); else setOpen(o => !o) }}
          className={ROUND_PILL_BUTTON}>
          <Navigation size={13} strokeWidth={2.2} />
        </button>
      </Tooltip>
      {open && <NavigationMenu targets={targets} anchor={anchorRef.current} onClose={() => setOpen(false)} />}
    </span>
  )
}

/** The new category's name, typed where the category pill was, with its OK and Cancel beside it. */
function NewCategoryField({ inputId, name, setName, create, setOpen, t }: NewCategoryRow & { t: Translate }) {
  return (
    // One parent for the field and both of its buttons.
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <input
        id={inputId}
        type="text"
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          // Enter confirms the name, like OK; it never reaches the place's own save.
          if (e.key === 'Enter') { e.preventDefault(); void create() }
          // Escape closes the field, like Cancel, and only the field: marked
          // handled, the dialog around it leaves it alone and keeps what is typed.
          if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
        }}
        aria-label={t('places.newCategory')}
        placeholder={t('places.categoryNamePlaceholder')}
        className="w-48 min-w-0 rounded-full bg-surface-card px-3 py-1 text-content shadow-sm outline-none ring-1 ring-edge-faint placeholder:text-content-faint focus:ring-2 focus:ring-[color:var(--text-primary)]"
      />
      <button type="button" onClick={() => void create()} className="rounded-full bg-accent px-3 py-1 font-semibold text-accent-text hover:opacity-90">
        {t('common.ok')}
      </button>
      <button type="button" onClick={() => setOpen(false)} className={`${PILL} hover:opacity-80`}>
        {t('common.cancel')}
      </button>
    </span>
  )
}

/** A Markdown field: its label, the formatting bar on the same line, the text under both. */
function MarkdownField({ id, label, value, onChange, placeholder, maxLength }: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  maxLength?: number
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  return (
    <DialogSection
      className="min-w-0"
      label={<label htmlFor={id}>{label}</label>}
      action={<NoteFormatToolbar textareaRef={ref} onChange={onChange} compact customTooltips />}
    >
      <textarea
        id={id}
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`${TEXTAREA} resize-y`}
      />
    </DialogSection>
  )
}

/** Files chosen before the place exists: they are uploaded once the save has given it an id. */
function PendingFiles({ files, fileRef, onAdd, onRemove, t }: {
  files: File[]
  fileRef: React.RefObject<HTMLInputElement | null>
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
  t: Translate
}) {
  return (
    <div className="min-w-0">
      <div className={LABEL}>{t('files.title')}</div>
      <input ref={fileRef} type="file" multiple className="hidden" onChange={onAdd} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={WHITE_BUTTON}
        style={fs(13, 'body')}
      >
        <Paperclip size={14} aria-hidden="true" />
        {t('files.attach')}
      </button>
      {files.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-1" data-testid="pending-files">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-[8px] border border-edge-faint bg-surface-card px-2.5 py-1.5" style={fs(12, 'body')}>
              <Paperclip size={11} className="flex-none text-content-faint" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-content-secondary">{file.name}</span>
              <Tooltip label={t('common.delete')}>
                <button type="button" onClick={() => onRemove(idx)} aria-label={t('common.delete')}
                  className="flex flex-none text-content-faint transition-colors hover:text-danger">
                  <X size={12} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TimeSectionProps {
  form: PlaceFormData
  handleChange: (field: string, value: string) => void
  assignmentId: number | null
  dayAssignments: Assignment[]
  hasTimeError: boolean
  /** On a road trip the End is when the drive leaves, which the field says. In Days it
   *  stays the plain label it has always been: nothing is scheduled off it there. */
  endIsLeave: boolean
  t: Translate
}

function TimeSection({ form, handleChange, assignmentId, dayAssignments, hasTimeError, endIsLeave, t }: TimeSectionProps) {
  const collisions = useMemo(
    () => timeCollisions(assignmentId, dayAssignments, form.place_time, form.end_time),
    [assignmentId, dayAssignments, form.place_time, form.end_time],
  )
  const errorId = useId()

  return (
    <div className="flex flex-col gap-2">
      <div className={GRID_2}>
        <EditorField label={t('places.startTime')}>
          <CustomTimePicker
            value={form.place_time}
            onChange={v => handleChange('place_time', v)}
            aria-label={t('places.startTime')}
          />
        </EditorField>
        <EditorField label={t('places.endTime')} hint={endIsLeave ? t('roadtrip.stop.endIsLeave') : undefined}>
          <CustomTimePicker
            value={form.end_time}
            onChange={v => handleChange('end_time', v)}
            aria-label={t('places.endTime')}
            aria-invalid={hasTimeError}
            aria-describedby={hasTimeError ? errorId : undefined}
          />
        </EditorField>
      </div>
      {hasTimeError && (
        <div id={errorId} className={WARNING_BANNER} style={fs(12, 'body')}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('places.endTimeBeforeStart')}
        </div>
      )}
      {collisions.length > 0 && (
        <div className={WARNING_BANNER} style={fs(12, 'body')}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {t('places.timeCollision')}{' '}
            {collisions.map(a => a.place?.name).filter(Boolean).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}
