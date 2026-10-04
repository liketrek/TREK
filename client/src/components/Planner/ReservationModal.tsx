import { useState, useEffect, useRef, useMemo, useId } from 'react'
import { localIsoDate } from '../../utils/localDate'
import { useParams } from 'react-router'
import { useTripStore } from '../../store/tripStore'
import { useAddonStore } from '../../store/addonStore'
import CustomSelect from '../shared/CustomSelect'
import { BookingCodeInput } from '../shared/BookingCode'
import { buildAssignmentOptions } from './assignmentOptions'
import AddressInput from './AddressInput'
import { Hotel, Utensils, Ticket, FileText, Users, Link2, ParkingSquare } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import CustomTimePicker from '../shared/CustomTimePicker'
import { parseReservationMetadata } from '../../utils/flightLegs'
import { resolveDayId } from '../../utils/formatters'
import type { Day, Place, Reservation, TripFile, AssignmentsMap, Accommodation, BudgetItem } from '../../types'
import { BookingCostsSection } from './BookingCostsSection'
import { BookingLinkAndFiles } from './BookingLinkAndFiles'
import { importedPriceEntry } from './importedPrice'
import { TravelerPicker } from './TravelerPicker'
import type { TripMember } from '../Budget/BudgetPanelMemberChips'
import type { BookingExpenseRequest } from './BookingCostsSection.types'
import type { BookingReviewDraft } from './parsedItemToDraft'
import { typeToCostCategory } from '@trek/shared'
import { stayPlaces } from '../../utils/stayPlaces'
import { BookingDialogHeader, StatusPill } from './bookings/BookingDialogShell'
import { DialogShell, DialogFooter, FooterSpacer, DialogButton } from '../shared/DialogShell'
import { INPUT, TEXTAREA, LABEL, GRID_2, GRID_3, EditorField, PillSelect } from '../shared/dialogParts'
import { typeInfo } from './bookings/bookingsModel'
import type { StatusTone } from './bookings/bookingParts'

const TYPE_OPTIONS = [
  { value: 'hotel',      labelKey: 'reservations.type.hotel',      Icon: Hotel },
  { value: 'restaurant', labelKey: 'reservations.type.restaurant', Icon: Utensils },
  { value: 'event',      labelKey: 'reservations.type.event',      Icon: Ticket },
  { value: 'tour',       labelKey: 'reservations.type.tour',       Icon: Users },
  { value: 'parking',    labelKey: 'reservations.type.parking',    Icon: ParkingSquare },
  { value: 'other',      labelKey: 'reservations.type.other',      Icon: FileText },
]

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, string | number | null> & { title: string }) => Promise<Reservation | undefined>
  reservation: Reservation | null
  days: Day[]
  places: Place[]
  assignments: AssignmentsMap
  selectedDayId: number | null
  files?: TripFile[]
  onFileUpload?: (fd: FormData) => Promise<unknown>
  onFileDelete: (fileId: number) => Promise<void>
  accommodations?: Accommodation[]
  defaultAssignmentId?: number | null
  onOpenExpense?: (req: BookingExpenseRequest) => void
  // Pre-fill a brand-new booking from a parsed import item (review-before-save).
  // Distinct from `reservation`: the form is populated but stays in create mode.
  prefill?: BookingReviewDraft | null
  /** Trip members + guests, for the traveler picker (#1517). */
  tripMembers?: TripMember[]
}

export function ReservationModal({ isOpen, onClose, onSave, reservation, days, places, assignments, selectedDayId, files = [], onFileUpload, onFileDelete, accommodations = [], defaultAssignmentId = null, onOpenExpense, prefill = null, tripMembers = [] }: ReservationModalProps) {
  const { id: tripId } = useParams<{ id: string }>()
  const setReservationTravelers = useTripStore(s => s.setReservationTravelers)
  const toast = useToast()
  const { t, locale } = useTranslation()
  const fileInputRef = useRef(null)
  const titleId = useId()

  const isBudgetEnabled = useAddonStore(s => s.isEnabled('budget'))
  const deleteBudgetItem = useTripStore(s => s.deleteBudgetItem)
  // Set right before submit when the user clicked create/edit expense (see TransportModal).
  const expenseIntentRef = useRef<{ editItem?: BudgetItem; create?: boolean } | null>(null)

  const [form, setForm] = useState({
    title: '', type: 'other', status: 'pending',
    reservation_time: '', reservation_end_time: '', end_date: '', location: '', confirmation_number: '',
    notes: '', url: '', assignment_id: '' as string | number, accommodation_id: '' as string | number,
    place_id: '' as string | number,
    meta_check_in_time: '', meta_check_in_end_time: '', meta_check_out_time: '',
    hotel_place_id: '' as string | number, hotel_start_day: '' as string | number, hotel_end_day: '' as string | number,
    hotel_address: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [linkedFileIds, setLinkedFileIds] = useState<number[]>([])
  // Travelers assigned to this booking (#1517) — seeded on open, persisted after the save resolves.
  const [travelerIds, setTravelerIds] = useState<Set<number>>(new Set())

  const assignmentOptions = useMemo(
    () => buildAssignmentOptions(days, assignments, t, locale),
    [days, assignments, t, locale]
  )

  // Restrict non-hotel booking dates to the trip's span (#1662). Hotels already
  // constrain to trip days via their day dropdowns. Falls back to no limit when
  // the trip has no dated days.
  const tripDateRange = useMemo(() => {
    const dates = (days || []).map(d => d.date).filter((d): d is string => !!d).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    return { min: dates[0], max: dates[dates.length - 1] }
  }, [days])

  useEffect(() => {
    // Match an existing place by name (exact, then loose contains) for hotels.
    const matchPlaceId = (name: string | undefined): string | number => {
      const n = (name || '').trim().toLowerCase()
      if (!n) return ''
      const exact = places.find(p => p.name?.trim().toLowerCase() === n)
      if (exact) return exact.id
      const loose = places.find(p => p.name && (p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase())))
      return loose?.id ?? ''
    }

    setTravelerIds(new Set((reservation?.travelers || []).map(tv => tv.user_id)))
    if (reservation) {
      const meta = parseReservationMetadata(reservation)
      const rawEnd = reservation.reservation_end_time || ''
      let endDate = ''
      let endTime = rawEnd
      if (rawEnd.includes('T')) {
        endDate = rawEnd.split('T')[0]
        endTime = rawEnd.split('T')[1]?.slice(0, 5) || ''
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawEnd)) {
        endDate = rawEnd
        endTime = ''
      }
      const editAcc = accommodations.find(a => a.id == reservation.accommodation_id)
      setForm({
        title: reservation.title || '',
        type: reservation.type || 'other',
        status: reservation.status || 'pending',
        reservation_time: reservation.reservation_time ? reservation.reservation_time.slice(0, 16) : '',
        reservation_end_time: endTime,
        end_date: endDate,
        location: reservation.location || '',
        confirmation_number: reservation.confirmation_number || '',
        notes: reservation.notes || '',
        url: reservation.url || '',
        assignment_id: reservation.assignment_id || '',
        accommodation_id: reservation.accommodation_id || '',
        place_id: reservation.place_id || '',
        meta_check_in_time: meta.check_in_time || '',
        meta_check_in_end_time: meta.check_in_end_time || '',
        meta_check_out_time: meta.check_out_time || '',
        hotel_place_id: editAcc?.place_id || '',
        hotel_start_day: editAcc?.start_day_id || '',
        hotel_end_day: editAcc?.end_day_id || '',
        // The linked place carries the address; reservations saved without a
        // place (or before the accommodation existed) keep it in location.
        hotel_address: places.find(p => p.id == editAcc?.place_id)?.address || reservation.location || '',
      })
    } else if (prefill) {
      // Review-before-save: populate from a parsed import item, stay in create mode.
      const meta = (prefill.metadata && typeof prefill.metadata === 'object' ? prefill.metadata : {}) as Record<string, string>
      const rawEnd = typeof prefill.reservation_end_time === 'string' ? prefill.reservation_end_time : ''
      let endDate = ''
      let endTime = rawEnd
      if (rawEnd.includes('T')) { endDate = rawEnd.split('T')[0]; endTime = rawEnd.split('T')[1]?.slice(0, 5) || '' }
      else if (/^\d{4}-\d{2}-\d{2}$/.test(rawEnd)) { endDate = rawEnd; endTime = '' }
      setForm({
        title: prefill.title || '',
        type: prefill.type || 'other',
        status: prefill.status || 'pending',
        reservation_time: typeof prefill.reservation_time === 'string' ? prefill.reservation_time.slice(0, 16) : '',
        reservation_end_time: endTime,
        end_date: endDate,
        location: prefill.location || '',
        confirmation_number: prefill.confirmation_number || '',
        notes: prefill.notes || '',
        url: (prefill as { url?: string }).url || '',
        assignment_id: defaultAssignmentId ?? '',
        accommodation_id: '',
        place_id: '',
        meta_check_in_time: meta.check_in_time || '',
        meta_check_in_end_time: meta.check_in_end_time || '',
        meta_check_out_time: meta.check_out_time || '',
        hotel_place_id: matchPlaceId(prefill._venue?.name || prefill.title),
        hotel_start_day: resolveDayId(days, prefill._accommodation?.check_in),
        hotel_end_day: resolveDayId(days, prefill._accommodation?.check_out),
        hotel_address: prefill._venue?.address || '',
      })
      // Seed the booking's Files with the document this item was parsed from.
      setPendingFiles(prefill._sourceFiles ?? [])
    } else {
      setForm({
        title: '', type: 'other', status: 'pending',
        reservation_time: '', reservation_end_time: '', end_date: '', location: '', confirmation_number: '',
        notes: '', url: '', assignment_id: defaultAssignmentId ?? '', accommodation_id: '', place_id: '',
        meta_check_in_time: '', meta_check_in_end_time: '', meta_check_out_time: '',
        hotel_place_id: '', hotel_start_day: '', hotel_end_day: '', hotel_address: '',
      })
      setPendingFiles([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation, prefill, isOpen, selectedDayId, defaultAssignmentId, days, places, accommodations])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleTraveler = (id: number) => setTravelerIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  // Mirrors the mobile sheet, which has had this shape since 72a82b3c while the
  // desktop copy was never pulled across (#2107). Filling a missing clock with '00:00' made a
  // day-long booking compare as midnight against midnight, and the comparison is
  // strict, so an all-day permit on a single date was refused. It also left every
  // booking with a date-only end time uneditable here, which is the shape the booking
  // import and the mobile sheet both write.
  //
  // The hotel guard matters for the same reason it does on mobile: the date panel is
  // hidden for hotels, so a type switch after typing dates would leave the save button
  // dead with its explanation inside the hidden block.
  const isEndBeforeStart = (() => {
    if (form.type === 'hotel' || !form.end_date || !form.reservation_time) return false
    const startDate = form.reservation_time.split('T')[0]
    const startTime = form.reservation_time.split('T')[1] || ''
    const endTime = form.reservation_end_time || ''
    // Without a time on either side the booking is all-day, so an end on the
    // start day is fine — only compare the dates there.
    if (!startTime || !endTime) return form.end_date < startDate
    return `${form.end_date}T${endTime}` <= `${startDate}T${startTime}`
  })()

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.()
    if (!form.title.trim()) return
    if (isEndBeforeStart) { toast.error(t('reservations.validation.endBeforeStart')); return }
    setIsSaving(true)
    try {
      const metadata: Record<string, string> = {}
      if (form.type === 'hotel') {
        if (form.meta_check_in_time) metadata.check_in_time = form.meta_check_in_time
        if (form.meta_check_in_end_time) metadata.check_in_end_time = form.meta_check_in_end_time
        if (form.meta_check_out_time) metadata.check_out_time = form.meta_check_out_time
      }
      let combinedEndTime = form.reservation_end_time
      if (form.end_date) {
        combinedEndTime = form.reservation_end_time ? `${form.end_date}T${form.reservation_end_time}` : form.end_date
      } else if (form.reservation_end_time && form.reservation_time) {
        combinedEndTime = `${form.reservation_time.split('T')[0]}T${form.reservation_end_time}`
      }
      const saveData: Record<string, any> & { title: string } = {
        title: form.title, type: form.type, status: form.status,
        reservation_time: form.type === 'hotel' ? null : (form.reservation_time || null),
        reservation_end_time: form.type === 'hotel' ? null : (combinedEndTime || null),
        // Hotels show the address field instead of location — persist it on the
        // reservation itself so it survives even without days/place (#1496).
        location: form.type === 'hotel' ? form.hotel_address : form.location,
        confirmation_number: form.confirmation_number,
        notes: form.notes,
        url: form.url,
        assignment_id: (form.type === 'hotel' && !form.accommodation_id) ? null : (form.assignment_id || null),
        accommodation_id: form.type === 'hotel' ? (form.accommodation_id || null) : null,
        // Hotels link a place through the accommodation record; every other type links
        // the picked trip place/activity directly on the reservation (#1353).
        place_id: form.type === 'hotel' ? null : (form.place_id || null),
        // An empty object, not null: null clears the column outright, and that
        // took the mirrored booking price with it on every edit of a type that
        // fills no metadata of its own — restaurant, event, tour, parking, other,
        // a hotel without check-in times (#2233). An object still clears what the
        // form dropped, and lets the server carry the price across.
        metadata,
        // Omitted on an edit: the server replaces the endpoint set whenever the
        // key is present, and this form never edits endpoints, so sending an
        // empty list would drop a transit booking's stations (#2216).
        ...(reservation?.id ? {} : { endpoints: [] }),
        needs_review: false,
      }
      if (form.type === 'hotel' && (form.hotel_start_day || form.hotel_end_day)) {
        saveData.create_accommodation = {
          place_id: form.hotel_place_id || null,
          // No existing place picked but we have an address/name (e.g. a reviewed
          // import) → the save handler geocodes it and creates the place.
          venue: (!form.hotel_place_id && (form.hotel_address || form.title))
            ? { name: form.title, address: form.hotel_address || null }
            : null,
          // The typed address, so the save handler can write it through to a
          // linked place — an edited address used to be silently dropped (#1496).
          address: form.hotel_address || null,
          // Tolerate a single resolved end of the range (a one-night stay or a date
          // that only matched one trip day) so the accommodation is still created.
          start_day_id: form.hotel_start_day || form.hotel_end_day,
          end_day_id: form.hotel_end_day || form.hotel_start_day,
          check_in: form.meta_check_in_time || null,
          check_in_end: form.meta_check_in_end_time || null,
          check_out: form.meta_check_out_time || null,
          confirmation: form.confirmation_number || null,
        }
      }
      // Imported booking → auto-create the linked cost from the parsed price (what the
      // old direct import did). Only on create (not edit) and only when there's a price.
      if (!reservation && prefill && isBudgetEnabled) {
        const entry = importedPriceEntry(prefill.metadata, form.type)
        if (entry) saveData.create_budget_entry = entry
      }
      const saved = await onSave(saveData)
      // Persist the traveler assignment once we have the reservation id (create → save
      // result, edit → existing reservation), and only when it actually changed (#1517).
      const savedId = saved?.id ?? reservation?.id
      if (savedId && tripId) {
        const original = (reservation?.travelers || []).map(tv => tv.user_id)
        const nextIds = [...travelerIds]
        const changed = original.length !== nextIds.length || nextIds.some(id => !original.includes(id))
        if (changed) {
          try { await setReservationTravelers(tripId, savedId, nextIds) } catch { toast.error(t('common.unknownError')) }
        }
      }
      if (!reservation?.id && saved?.id && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('reservation_id', String(saved.id))
          fd.append('description', form.title)
          await onFileUpload(fd)
        }
      }
      // Open the Costs editor for the saved booking when the user asked to
      // create/edit its linked expense (gated on saved?.id).
      const intent = expenseIntentRef.current
      expenseIntentRef.current = null
      if (intent && onOpenExpense && saved?.id) {
        if (intent.editItem) onOpenExpense({ editItem: intent.editItem })
        else onOpenExpense({ prefill: { reservationId: saved.id, name: form.title, category: typeToCostCategory(form.type) } })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateExpense = () => { expenseIntentRef.current = { create: true }; void handleSubmit() }
  const handleEditExpense = (item: BudgetItem) => { expenseIntentRef.current = { editItem: item }; void handleSubmit() }
  const handleRemoveExpense = async (item: BudgetItem) => {
    try { await deleteBudgetItem(Number(tripId), item.id) } catch { toast.error(t('common.unknownError')) }
  }

  // On an import review (not yet saved), preview the parsed price as the cost that will be
  // linked: the same entry the save sends, so the two cannot name different currencies.
  const importedEntry = !reservation && prefill ? importedPriceEntry(prefill.metadata, form.type) : null
  const pendingExpense = importedEntry ? { ...importedEntry, currency: importedEntry.currency ?? null } : null

  const handleFileChange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    if (reservation?.id) {
      setUploadingFile(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('reservation_id', String(reservation.id))
        fd.append('description', reservation.title)
        await onFileUpload(fd)
        toast.success(t('reservations.toast.fileUploaded'))
      } catch {
        toast.error(t('reservations.toast.uploadError'))
      } finally {
        setUploadingFile(false)
        e.target.value = ''
      }
    } else {
      setPendingFiles(prev => [...prev, file])
      e.target.value = ''
    }
  }

  const attachedFiles = reservation?.id
    ? files.filter(f =>
        f.reservation_id === reservation.id ||
        linkedFileIds.includes(f.id) ||
        (f.linked_reservation_ids && f.linked_reservation_ids.includes(reservation.id))
      )
    : []

  const status = form.status === 'confirmed' ? 'confirmed' : 'pending'
  const tone: StatusTone = form.type === 'transit' ? 'transit' : status
  const shownType = typeInfo(form.type)
  const saveDisabled = isSaving || !form.title.trim() || isEndBeforeStart
  const dayOptions = days.map(d => {
    const dateBadge = d.date ? (formatDate(d.date, locale) ?? undefined) : undefined
    const dayBadge = d.title ? t('dayplan.dayN', { n: d.day_number }) : undefined
    return {
      value: d.id,
      label: d.title || t('dayplan.dayN', { n: d.day_number }),
      badge: dateBadge ?? dayBadge,
    }
  })

  const header = (
    <BookingDialogHeader
      tone={tone}
      type={form.type}
      labelId={titleId}
      onClose={onClose}
      eyebrow={reservation ? t('reservations.editTitle') : t('reservations.newTitle')}
      titleInput={{
        value: form.title,
        onChange: v => set('title', v),
        label: t('reservations.titleLabel'),
        placeholder: t('reservations.titlePlaceholder'),
        required: true,
      }}
      pills={(
        <>
          <StatusPill status={status} onToggle={() => set('status', status === 'confirmed' ? 'pending' : 'confirmed')} />
          <PillSelect
            label={t('reservations.bookingType')}
            value={form.type}
            onChange={value => set('type', value)}
            options={TYPE_OPTIONS.map(o => ({
              value: o.value,
              label: t(o.labelKey),
              icon: <o.Icon size={14} style={{ color: typeInfo(o.value).color }} />,
            }))}
            fallback={{ label: t(shownType.chipKey), icon: <shownType.Icon size={14} style={{ color: shownType.color }} /> }}
          />
        </>
      )}
    />
  )

  const footer = (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      <DialogButton variant="primary" onClick={handleSubmit} disabled={saveDisabled}>
        {isSaving ? t('common.saving') : reservation ? t('common.update') : t('common.add')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <DialogShell
      open={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      width="editor"
      align="top"
      // A stray click beside the editor asks before the typing is lost (#2253).
      discardGuard={{ form, files: pendingFiles.length, travelers: [...travelerIds] }}
      onSubmit={handleSubmit}
      header={header}
      footer={footer}
    >
      {/* When: the plan stop it belongs to, then start and end (hidden for hotels) */}
      {form.type !== 'hotel' && (
        <div className="flex flex-col gap-3">
          {assignmentOptions.length > 0 && (
            <EditorField label={<><Link2 size={10} className="mr-[3px] inline align-[-1px]" />{t('reservations.linkAssignment')}</>}>
              <CustomSelect
                value={form.assignment_id}
                onChange={value => {
                  set('assignment_id', value)
                  const opt = assignmentOptions.find(o => o.value === value)
                  if (opt?.dayDate) {
                    setForm(prev => {
                      if (prev.reservation_time) return prev
                      return { ...prev, reservation_time: opt.dayDate }
                    })
                  }
                }}
                placeholder={t('reservations.pickAssignment')}
                options={[
                  { value: '', label: t('reservations.noAssignment') },
                  ...assignmentOptions,
                ]}
                searchable
                size="sm"
              />
            </EditorField>
          )}
          <div className={GRID_2}>
            <EditorField label={t('reservations.date')}>
              <CustomDatePicker
                value={(() => { const [d] = (form.reservation_time || '').split('T'); return d || '' })()}
                onChange={d => {
                  const [, tm] = (form.reservation_time || '').split('T')
                  set('reservation_time', d ? (tm ? `${d}T${tm}` : d) : '')
                }}
                min={tripDateRange.min}
                max={tripDateRange.max}
              />
            </EditorField>
            <EditorField label={t('reservations.startTime')}>
              <CustomTimePicker
                value={(() => { const [, tm] = (form.reservation_time || '').split('T'); return tm || '' })()}
                onChange={tm => {
                  const [d] = (form.reservation_time || '').split('T')
                  const selectedDay = days.find(dy => dy.id === selectedDayId)
                  const date = d || selectedDay?.date || localIsoDate()
                  set('reservation_time', tm ? `${date}T${tm}` : date)
                }}
              />
            </EditorField>
            <EditorField label={t('reservations.endDate')} error={isEndBeforeStart ? t('reservations.validation.endBeforeStart') : undefined}>
              <CustomDatePicker
                value={form.end_date}
                onChange={d => set('end_date', d || '')}
                min={tripDateRange.min}
                max={tripDateRange.max}
              />
            </EditorField>
            <EditorField label={t('reservations.endTime')}>
              <CustomTimePicker value={form.reservation_end_time} onChange={v => set('reservation_end_time', v)} />
            </EditorField>
          </div>
        </div>
      )}

      {/* Where: a trip place/activity (#1353) and the address. Hotels pick their
          place through the accommodation below. */}
      {form.type !== 'hotel' && (
        <div className={GRID_2}>
          <EditorField label={t('reservations.meta.linkPlace')}>
            <CustomSelect
              value={form.place_id}
              onChange={value => {
                const p = places.find(pl => pl.id === value)
                setForm(prev => {
                  const next = { ...prev, place_id: value }
                  if (value && p) {
                    if (!prev.title) next.title = p.name
                    if (!prev.location && p.address) next.location = p.address
                  }
                  return next
                })
              }}
              placeholder={t('reservations.meta.pickPlace')}
              options={[
                { value: '', label: '—' },
                ...places.map(p => ({ value: p.id, label: p.name })),
              ]}
              searchable
              size="sm"
            />
          </EditorField>
          <EditorField label={t('reservations.locationAddress')}>
            <AddressInput value={form.location} onChange={v => set('location', v)}
              placeholder={t('reservations.locationPlaceholder')} className={INPUT} />
          </EditorField>
        </div>
      )}

      {/* The stay: place and nights, then the check-in window */}
      {form.type === 'hotel' && (
        <>
          <div className="flex flex-col gap-3">
            <div className={GRID_3}>
              <EditorField label={t('reservations.meta.hotelPlace')}>
                <CustomSelect
                  value={form.hotel_place_id}
                  onChange={value => {
                    const p = places.find(pl => pl.id === value)
                    setForm(prev => {
                      const next = { ...prev, hotel_place_id: value }
                      if (value && p) {
                        if (!prev.title) next.title = p.name
                        // Show the picked hotel's address; keep a hand-typed one
                        // if the place has none.
                        next.hotel_address = p.address || prev.hotel_address
                      }
                      return next
                    })
                  }}
                  placeholder={t('reservations.meta.pickHotel')}
                  options={[
                    { value: '', label: '—' },
                    ...stayPlaces(places, form.hotel_place_id).map(p => ({ value: p.id, label: p.name })),
                  ]}
                  searchable
                  size="sm"
                />
              </EditorField>
              <EditorField label={t('reservations.meta.fromDay')}>
                <CustomSelect
                  value={form.hotel_start_day}
                  onChange={value => setForm(prev => ({
                    ...prev,
                    hotel_start_day: value,
                    hotel_end_day: days.findIndex(d => d.id === value) > days.findIndex(d => d.id === prev.hotel_end_day)
                      ? value : prev.hotel_end_day,
                  }))}
                  placeholder={t('reservations.meta.selectDay')}
                  options={dayOptions}
                  size="sm"
                />
              </EditorField>
              <EditorField label={t('reservations.meta.toDay')}>
                <CustomSelect
                  value={form.hotel_end_day}
                  onChange={value => setForm(prev => ({
                    ...prev,
                    hotel_start_day: days.findIndex(d => d.id === value) < days.findIndex(d => d.id === prev.hotel_start_day)
                      ? value : prev.hotel_start_day,
                    hotel_end_day: value,
                  }))}
                  placeholder={t('reservations.meta.selectDay')}
                  options={dayOptions}
                  size="sm"
                />
              </EditorField>
            </div>
            <div className={GRID_3}>
              <EditorField label={t('reservations.meta.checkIn')}>
                <CustomTimePicker value={form.meta_check_in_time} onChange={v => set('meta_check_in_time', v)} />
              </EditorField>
              <EditorField label={t('reservations.meta.checkInUntil')}>
                <CustomTimePicker value={form.meta_check_in_end_time} onChange={v => set('meta_check_in_end_time', v)} />
              </EditorField>
              <EditorField label={t('reservations.meta.checkOut')}>
                <CustomTimePicker value={form.meta_check_out_time} onChange={v => set('meta_check_out_time', v)} />
              </EditorField>
            </div>
          </div>
          <EditorField label={t('reservations.locationAddress')}>
            <AddressInput value={form.hotel_address} onChange={v => set('hotel_address', v)}
              placeholder={t('reservations.locationPlaceholder')} className={INPUT} />
          </EditorField>
        </>
      )}

      {/* The booking code, and the trip members and guests on this booking (#1517) */}
      <div className={GRID_2}>
        <EditorField label={t('reservations.confirmationCode')}>
          <BookingCodeInput value={form.confirmation_number} onChange={e => set('confirmation_number', e.target.value)}
            placeholder={t('reservations.confirmationPlaceholder')} className={INPUT} />
        </EditorField>
        <EditorField label={t('reservations.travelers.label')}>
          <TravelerPicker tripMembers={tripMembers} selectedIds={travelerIds} onToggle={toggleTraveler} />
        </EditorField>
      </div>

      <EditorField label={t('reservations.notes')}>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder={t('reservations.notesPlaceholder')} className={TEXTAREA} />
      </EditorField>

      <BookingLinkAndFiles
        url={form.url}
        onUrlChange={value => set('url', value)}
        labelClass={LABEL}
        inputClass={INPUT}
        reservationId={reservation?.id}
        tripFiles={files}
        attachedFiles={attachedFiles}
        pendingFiles={pendingFiles}
        onRemovePending={index => setPendingFiles(prev => prev.filter((_, j) => j !== index))}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        canAttach={!!onFileUpload}
        uploading={uploadingFile}
        onLinked={fileId => setLinkedFileIds(prev => [...prev, fileId])}
        onDetached={fileId => setLinkedFileIds(prev => prev.filter(id => id !== fileId))}
      />

      {/* Costs — create / view the expense linked to this booking */}
      {isBudgetEnabled && (
        <BookingCostsSection
          reservationId={reservation?.id ?? null}
          pendingExpense={pendingExpense}
          onCreate={handleCreateExpense}
          onEdit={handleEditExpense}
          onRemove={handleRemoveExpense}
          labelClassName={LABEL}
          customTooltips
        />
      )}
    </DialogShell>
  )
}

function formatDate(dateStr, locale) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString(locale || undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
