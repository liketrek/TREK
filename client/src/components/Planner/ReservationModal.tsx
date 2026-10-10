import { useEffect, useRef, useMemo, useId } from 'react'
import { localIsoDate } from '../../utils/localDate'
import { useParams } from 'react-router'
import { useTripStore } from '../../store/tripStore'
import { useAddonStore } from '../../store/addonStore'
import CustomSelect from '../shared/CustomSelect'
import { BookingCodeInput } from '../shared/BookingCode'
import { buildAssignmentOptions } from './assignmentOptions'
import AddressInput from './AddressInput'
import { Link2 } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import CustomTimePicker from '../shared/CustomTimePicker'
import type { Day, Place, Reservation, TripFile, AssignmentsMap, Accommodation } from '../../types'
import { BookingNotesFilesCosts } from './BookingNotesFilesCosts'
import { importedPriceEntry } from './importedPrice'
import { TravelerPicker } from './TravelerPicker'
import type { TripMember } from '../Budget/BudgetPanelMemberChips'
import type { BookingExpenseRequest } from './BookingCostsSection.types'
import type { BookingReviewDraft } from './parsedItemToDraft'
import { stayPlaces } from '../../utils/stayPlaces'
import { BookingDialogHeader, StatusPill } from './bookings/BookingDialogShell'
import { DialogShell, DialogFooter, FooterSpacer, DialogButton } from '../shared/DialogShell'
import { INPUT, GRID_2, GRID_3, EditorField, PillSelect } from '../shared/dialogParts'
import { typeInfo } from './bookings/bookingsModel'
import type { StatusTone } from './bookings/bookingParts'
import { RESERVATION_TYPE_OPTIONS as TYPE_OPTIONS, reservationFieldsFrom, reservationFieldsFromPrefill } from './reservationFormModel'
import { useReservationForm } from './useReservationForm'
import { expenseRequestAfterSave, pendingImportExpense, travelerIdsOf, travelersChanged, uploadBookingFiles } from './bookingFormModel'
import { useBookingExpenseIntent } from './useBookingExpenseIntent'
import { useBookingFileAttach } from './useBookingFileAttach'

const EMPTY_FORM = {
  title: '', type: 'other', status: 'pending',
  reservation_time: '', reservation_end_time: '', end_date: '', location: '', confirmation_number: '',
  notes: '', url: '', assignment_id: '' as string | number, accommodation_id: '' as string | number,
  place_id: '' as string | number,
  meta_check_in_time: '', meta_check_in_end_time: '', meta_check_out_time: '',
  hotel_place_id: '' as string | number, hotel_start_day: '' as string | number, hotel_end_day: '' as string | number,
  hotel_address: '',
}

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
  // Set right before submit when the user clicked create/edit expense.
  const expense = useBookingExpenseIntent(() => handleSubmit(), {
    remove: item => deleteBudgetItem(Number(tripId), item.id),
    onError: () => toast.error(t('common.unknownError')),
  })

  const {
    form, setForm, set, isSaving, setIsSaving, pendingFiles, setPendingFiles, travelerIds, setTravelerIds, toggleTraveler,
    isEndBeforeStart, dateBounds: tripDateRange, startDate, startTime, setStartDate, setStartTime, takeStopDay,
    pickPlace, pickHotelPlace, pickHotelStart, pickHotelEnd, saveData: buildSaveData,
  } = useReservationForm(EMPTY_FORM, days, places)
  const attach = useBookingFileAttach({ reservation, files, onFileUpload, setPendingFiles, toast, t })

  const assignmentOptions = useMemo(
    () => buildAssignmentOptions(days, assignments, t, locale),
    [days, assignments, t, locale]
  )

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

    setTravelerIds(travelerIdsOf(reservation))
    if (reservation) {
      setForm({ ...reservationFieldsFrom(reservation, accommodations, places, true), assignment_id: reservation.assignment_id || '' })
    } else if (prefill) {
      // Review-before-save: populate from a parsed import item, stay in create mode.
      setForm({
        ...reservationFieldsFromPrefill(prefill, days, true),
        assignment_id: defaultAssignmentId ?? '',
        accommodation_id: '',
        place_id: '',
        hotel_place_id: matchPlaceId(prefill._venue?.name || prefill.title),
      })
      // Seed the booking's Files with the document this item was parsed from.
      setPendingFiles(prefill._sourceFiles ?? [])
    } else {
      setForm({ ...EMPTY_FORM, assignment_id: defaultAssignmentId ?? '' })
      setPendingFiles([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation, prefill, isOpen, selectedDayId, defaultAssignmentId, days, places, accommodations])

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.()
    if (!form.title.trim()) return
    if (isEndBeforeStart) { toast.error(t('reservations.validation.endBeforeStart')); return }
    setIsSaving(true)
    try {
      const saveData = buildSaveData({ assignmentId: form.assignment_id, isEdit: !!reservation?.id, withCheckInEnd: true })
      // Imported booking → auto-create the linked cost from the parsed price (what the
      // old direct import did). Only on create (not edit) and only when there's a price.
      if (!reservation && prefill && isBudgetEnabled) {
        const entry = importedPriceEntry(prefill.metadata, form.type)
        if (entry) saveData.create_budget_entry = entry
      }
      const saved = await onSave(saveData as Record<string, string | number | null> & { title: string })
      // Persist the traveler assignment once we have the reservation id (create → save
      // result, edit → existing reservation), and only when it actually changed (#1517).
      const savedId = saved?.id ?? reservation?.id
      if (savedId && tripId) {
        const { changed, nextIds } = travelersChanged(reservation, travelerIds)
        if (changed) {
          try { await setReservationTravelers(tripId, savedId, nextIds) } catch { toast.error(t('common.unknownError')) }
        }
      }
      if (!reservation?.id && saved?.id && pendingFiles.length > 0) {
        await uploadBookingFiles(onFileUpload, saved.id, pendingFiles, form.title)
      }
      // Open the Costs editor for the saved booking when the user asked to
      // create/edit its linked expense (gated on saved?.id).
      const expenseRequest = expenseRequestAfterSave(expense.take(), saved?.id, form)
      if (expenseRequest && onOpenExpense) onOpenExpense(expenseRequest)
    } finally {
      setIsSaving(false)
    }
  }

  // On an import review (not yet saved), preview the parsed price as the cost that will be
  // linked: the same entry the save sends, so the two cannot name different currencies.
  const pendingExpense = pendingImportExpense(reservation, prefill, form.type)

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
            <EditorField label={<><Link2 size={10} className="me-[3px] inline align-[-1px]" />{t('reservations.linkAssignment')}</>}>
              <CustomSelect
                value={form.assignment_id}
                onChange={value => {
                  set('assignment_id', value)
                  const opt = assignmentOptions.find(o => o.value === value)
                  if (opt?.dayDate) takeStopDay(opt.dayDate)
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
                value={startDate}
                onChange={setStartDate}
                min={tripDateRange.min}
                max={tripDateRange.max}
              />
            </EditorField>
            <EditorField label={t('reservations.startTime')}>
              <CustomTimePicker
                value={startTime}
                onChange={tm => setStartTime(tm, days.find(dy => dy.id === selectedDayId)?.date || localIsoDate())}
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
              onChange={pickPlace}
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
                  onChange={pickHotelPlace}
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
                  onChange={pickHotelStart}
                  placeholder={t('reservations.meta.selectDay')}
                  options={dayOptions}
                  size="sm"
                />
              </EditorField>
              <EditorField label={t('reservations.meta.toDay')}>
                <CustomSelect
                  value={form.hotel_end_day}
                  onChange={pickHotelEnd}
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

      <BookingNotesFilesCosts
        notes={form.notes}
        onNotesChange={value => set('notes', value)}
        url={form.url}
        onUrlChange={value => set('url', value)}
        reservationId={reservation?.id}
        tripFiles={files}
        pendingFiles={pendingFiles}
        fileInputRef={fileInputRef}
        attach={attach}
        canAttach={!!onFileUpload}
        showCosts={isBudgetEnabled}
        pendingExpense={pendingExpense}
        expense={expense}
      />
    </DialogShell>
  )
}

function formatDate(dateStr, locale) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString(locale || undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
