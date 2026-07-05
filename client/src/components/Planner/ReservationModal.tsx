import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import apiClient from '../../api/client'
import { useTripStore } from '../../store/tripStore'
import { useAddonStore } from '../../store/addonStore'
import Modal from '../shared/Modal'
import CustomSelect from '../shared/CustomSelect'
import { Hotel, Utensils, Ticket, FileText, Users, Paperclip, X, ExternalLink, Link2 } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import CustomTimePicker from '../shared/CustomTimePicker'
import { openFile } from '../../utils/fileDownload'
import { resolveDayId } from '../../utils/formatters'
import type { Day, Place, Reservation, TripFile, AssignmentsMap, Accommodation, BudgetItem } from '../../types'
import { BookingCostsSection } from './BookingCostsSection'
import type { BookingExpenseRequest } from './BookingCostsSection.types'
import type { BookingReviewDraft } from './parsedItemToDraft'
import { typeToCostCategory } from '@trek/shared'

const TYPE_OPTIONS = [
  { value: 'hotel',      labelKey: 'reservations.type.hotel',      Icon: Hotel },
  { value: 'restaurant', labelKey: 'reservations.type.restaurant', Icon: Utensils },
  { value: 'event',      labelKey: 'reservations.type.event',      Icon: Ticket },
  { value: 'tour',       labelKey: 'reservations.type.tour',       Icon: Users },
  { value: 'other',      labelKey: 'reservations.type.other',      Icon: FileText },
]

function buildAssignmentOptions(days, assignments, t, locale) {
  const options = []
  for (const day of (days || [])) {
    const da = (assignments?.[String(day.id)] || []).slice().sort((a, b) => a.order_index - b.order_index)
    if (da.length === 0) continue
    const dayLabel = day.title || t('dayplan.dayN', { n: day.day_number })
    const dateStr = day.date ? ` · ${formatDate(day.date, locale)}` : ''
    const groupLabel = `${dayLabel}${dateStr}`
    options.push({ value: `_header_${day.id}`, label: groupLabel, disabled: true, isHeader: true })
    for (let i = 0; i < da.length; i++) {
      const place = da[i].place
      if (!place) continue
      const timeStr = place.place_time ? ` · ${place.place_time}${place.end_time ? ' – ' + place.end_time : ''}` : ''
      options.push({
        value: da[i].id,
        label: `  ${i + 1}. ${place.name}${timeStr}`,
        searchLabel: place.name,
        groupLabel,
        dayDate: day.date || null,
      })
    }
  }
  return options
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
}

export function ReservationModal({ isOpen, onClose, onSave, reservation, days, places, assignments, selectedDayId, files = [], onFileUpload, onFileDelete, accommodations = [], defaultAssignmentId = null, onOpenExpense, prefill = null }: ReservationModalProps) {
  const { id: tripId } = useParams<{ id: string }>()
  const loadFiles = useTripStore(s => s.loadFiles)
  const toast = useToast()
  const { t, locale } = useTranslation()
  const fileInputRef = useRef(null)

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
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [linkedFileIds, setLinkedFileIds] = useState<number[]>([])

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

    if (reservation) {
      const meta = typeof reservation.metadata === 'string' ? JSON.parse(reservation.metadata || '{}') : (reservation.metadata || {})
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
        hotel_address: places.find(p => p.id == editAcc?.place_id)?.address || '',
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

  // Re-hydrate hotel day range when the accommodations prop arrives after the modal opens
  // (race: tripAccommodations fetch may complete after isOpen fires, leaving hotel fields empty)
  useEffect(() => {
    if (!isOpen || !reservation || reservation.type !== 'hotel' || !reservation.accommodation_id) return
    const acc = accommodations.find(a => a.id == reservation.accommodation_id)
    if (!acc) return
    setForm(prev => {
      if (prev.hotel_place_id !== '' || prev.hotel_start_day !== '' || prev.hotel_end_day !== '') return prev
      return { ...prev, hotel_place_id: acc.place_id, hotel_start_day: acc.start_day_id, hotel_end_day: acc.end_day_id }
    })
  }, [accommodations, isOpen, reservation])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const isEndBeforeStart = (() => {
    if (!form.end_date || !form.reservation_time) return false
    const startDate = form.reservation_time.split('T')[0]
    const startTime = form.reservation_time.split('T')[1] || '00:00'
    const endTime = form.reservation_end_time || '00:00'
    const startFull = `${startDate}T${startTime}`
    const endFull = `${form.end_date}T${endTime}`
    return endFull <= startFull
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
        location: form.location, confirmation_number: form.confirmation_number,
        notes: form.notes,
        url: form.url,
        assignment_id: (form.type === 'hotel' && !form.accommodation_id) ? null : (form.assignment_id || null),
        accommodation_id: form.type === 'hotel' ? (form.accommodation_id || null) : null,
        // Hotels link a place through the accommodation record; every other type links
        // the picked trip place/activity directly on the reservation (#1353).
        place_id: form.type === 'hotel' ? null : (form.place_id || null),
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        endpoints: [],
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
        const pmeta = prefill.metadata && typeof prefill.metadata === 'object' ? (prefill.metadata as Record<string, unknown>) : {}
        const price = Number(pmeta.price)
        if (Number.isFinite(price) && price > 0) {
          saveData.create_budget_entry = { total_price: price, category: typeToCostCategory(form.type) }
        }
      }
      const saved = await onSave(saveData)
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

  const handleCreateExpense = () => { expenseIntentRef.current = { create: true }; handleSubmit() }
  const handleEditExpense = (item: BudgetItem) => { expenseIntentRef.current = { editItem: item }; handleSubmit() }
  const handleRemoveExpense = async (item: BudgetItem) => {
    try { await deleteBudgetItem(Number(tripId), item.id) } catch { toast.error(t('common.unknownError')) }
  }

  // On an import review (not yet saved), preview the parsed price as the cost that will be linked.
  const prefillMeta = prefill?.metadata && typeof prefill.metadata === 'object' ? (prefill.metadata as Record<string, unknown>) : null
  const prefillPrice = Number(prefillMeta?.price)
  const pendingExpense = !reservation && Number.isFinite(prefillPrice) && prefillPrice > 0
    ? { total_price: prefillPrice, currency: (prefillMeta?.priceCurrency as string | null) ?? null, category: typeToCostCategory(form.type) }
    : null

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

  const inputClass = 'w-full border border-edge rounded-[10px] px-[12px] py-[8px] text-[13px] font-[inherit] outline-none box-border text-content bg-surface-input'
  const labelClass = 'block text-[11px] font-semibold text-content-faint mb-[5px] uppercase tracking-[0.03em]'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reservation ? t('reservations.editTitle') : t('reservations.newTitle')}
      size="2xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} className="text-content-muted" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('common.cancel')}
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSaving || !form.title.trim() || isEndBeforeStart} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: isSaving || !form.title.trim() || isEndBeforeStart ? 0.5 : 1 }}>
            {isSaving ? t('common.saving') : reservation ? t('common.update') : t('common.add')}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Type selector */}
        <div>
          <label className={labelClass}>{t('reservations.bookingType')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {TYPE_OPTIONS.map(({ value, labelKey, Icon }) => (
              <button key={value} type="button" onClick={() => set('type', value)} className={form.type === value ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-surface-card text-content-muted'} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 99, border: '1px solid',
                fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                borderColor: form.type === value ? 'var(--text-primary)' : 'var(--border-primary)',
              }}>
                <Icon size={11} /> {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>{t('reservations.titleLabel')} *</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} required
            placeholder={t('reservations.titlePlaceholder')} className={inputClass} />
        </div>

        {/* Assignment Picker (hidden for hotels) */}
        {form.type !== 'hotel' && assignmentOptions.length > 0 && (
          <div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className={labelClass}>
                <Link2 size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />
                {t('reservations.linkAssignment')}
              </label>
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
            </div>
          </div>
        )}

        {/* Start Date/Time + End Date/Time + Status (hidden for hotels) */}
        {form.type !== 'hotel' && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className={labelClass}>{t('reservations.date')}</label>
                <CustomDatePicker
                  value={(() => { const [d] = (form.reservation_time || '').split('T'); return d || '' })()}
                  onChange={d => {
                    const [, tm] = (form.reservation_time || '').split('T')
                    set('reservation_time', d ? (tm ? `${d}T${tm}` : d) : '')
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className={labelClass}>{t('reservations.startTime')}</label>
                <CustomTimePicker
                  value={(() => { const [, tm] = (form.reservation_time || '').split('T'); return tm || '' })()}
                  onChange={tm => {
                    const [d] = (form.reservation_time || '').split('T')
                    const selectedDay = days.find(dy => dy.id === selectedDayId)
                    const date = d || selectedDay?.date || new Date().toISOString().split('T')[0]
                    set('reservation_time', tm ? `${date}T${tm}` : date)
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className={labelClass}>{t('reservations.endDate')}</label>
                <CustomDatePicker
                  value={form.end_date}
                  onChange={d => set('end_date', d || '')}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className={labelClass}>{t('reservations.endTime')}</label>
                <CustomTimePicker value={form.reservation_end_time} onChange={v => set('reservation_end_time', v)} />
              </div>
            </div>
            {isEndBeforeStart && (
              <div className="text-[#ef4444]" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: -6 }}>{t('reservations.validation.endBeforeStart')}</div>
            )}
          </>
        )}

        {/* Location */}
        {/* Link an existing trip place/activity to any non-hotel booking (#1353). Hotels
            keep their own accommodation-based place picker below. */}
        {form.type !== 'hotel' && (
          <div>
            <label className={labelClass}>{t('reservations.meta.linkPlace')}</label>
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
          </div>
        )}

        {form.type !== 'hotel' && (
          <div>
            <label className={labelClass}>{t('reservations.locationAddress')}</label>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
              placeholder={t('reservations.locationPlaceholder')} className={inputClass} />
          </div>
        )}

        {/* Booking Code + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('reservations.confirmationCode')}</label>
            <input type="text" value={form.confirmation_number} onChange={e => set('confirmation_number', e.target.value)}
              placeholder={t('reservations.confirmationPlaceholder')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('reservations.status')}</label>
            <CustomSelect
              value={form.status}
              onChange={value => set('status', value)}
              options={[
                { value: 'pending', label: t('reservations.pending') },
                { value: 'confirmed', label: t('reservations.confirmed') },
              ]}
              size="sm"
            />
          </div>
        </div>

        {/* Hotel fields */}
        {form.type === 'hotel' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>{t('reservations.meta.hotelPlace')}</label>
                <CustomSelect
                  value={form.hotel_place_id}
                  onChange={value => {
                    const p = places.find(pl => pl.id === value)
                    setForm(prev => {
                      const next = { ...prev, hotel_place_id: value }
                      if (!value) {
                        next.location = ''
                      } else if (p) {
                        if (!prev.title) next.title = p.name
                        if (!prev.location && p.address) next.location = p.address
                      }
                      return next
                    })
                  }}
                  placeholder={t('reservations.meta.pickHotel')}
                  options={[
                    { value: '', label: '—' },
                    ...places.map(p => ({ value: p.id, label: p.name })),
                  ]}
                  searchable
                  size="sm"
                />
              </div>
              <div>
                <label className={labelClass}>{t('reservations.meta.fromDay')}</label>
                <CustomSelect
                  value={form.hotel_start_day}
                  onChange={value => setForm(prev => ({
                    ...prev,
                    hotel_start_day: value,
                    hotel_end_day: days.findIndex(d => d.id === value) > days.findIndex(d => d.id === prev.hotel_end_day)
                      ? value : prev.hotel_end_day,
                  }))}
                  placeholder={t('reservations.meta.selectDay')}
                  options={days.map(d => {
                    const dateBadge = d.date ? (formatDate(d.date, locale) ?? undefined) : undefined
                    const dayBadge = d.title ? t('dayplan.dayN', { n: d.day_number }) : undefined
                    return {
                      value: d.id,
                      label: d.title || t('dayplan.dayN', { n: d.day_number }),
                      badge: dateBadge ?? dayBadge,
                    }
                  })}
                  size="sm"
                />
              </div>
              <div>
                <label className={labelClass}>{t('reservations.meta.toDay')}</label>
                <CustomSelect
                  value={form.hotel_end_day}
                  onChange={value => setForm(prev => ({
                    ...prev,
                    hotel_start_day: days.findIndex(d => d.id === value) < days.findIndex(d => d.id === prev.hotel_start_day)
                      ? value : prev.hotel_start_day,
                    hotel_end_day: value,
                  }))}
                  placeholder={t('reservations.meta.selectDay')}
                  options={days.map(d => {
                    const dateBadge = d.date ? (formatDate(d.date, locale) ?? undefined) : undefined
                    const dayBadge = d.title ? t('dayplan.dayN', { n: d.day_number }) : undefined
                    return {
                      value: d.id,
                      label: d.title || t('dayplan.dayN', { n: d.day_number }),
                      badge: dateBadge ?? dayBadge,
                    }
                  })}
                  size="sm"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('reservations.locationAddress')}</label>
              <input type="text" value={form.hotel_address} onChange={e => set('hotel_address', e.target.value)}
                placeholder={t('reservations.locationPlaceholder')} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>{t('reservations.meta.checkIn')}</label>
                <CustomTimePicker value={form.meta_check_in_time} onChange={v => set('meta_check_in_time', v)} />
              </div>
              <div>
                <label className={labelClass}>{t('reservations.meta.checkInUntil')}</label>
                <CustomTimePicker value={form.meta_check_in_end_time} onChange={v => set('meta_check_in_end_time', v)} />
              </div>
              <div>
                <label className={labelClass}>{t('reservations.meta.checkOut')}</label>
                <CustomTimePicker value={form.meta_check_out_time} onChange={v => set('meta_check_out_time', v)} />
              </div>
            </div>
          </>
        )}

        {/* Link */}
        <div>
          <label className={labelClass}>{t('reservations.urlLabel')}</label>
          <div className="relative">
            <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" />
            <input type="url" value={form.url} onChange={e => set('url', e.target.value)}
              placeholder={t('reservations.urlPlaceholder')} className={inputClass} style={{ paddingLeft: 34 }} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>{t('reservations.notes')}</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            placeholder={t('reservations.notesPlaceholder')}
            className={inputClass} style={{ resize: 'none', lineHeight: 1.5 }} />
        </div>

        {/* Files */}
        <div>
          <label className={labelClass}>{t('files.title')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {attachedFiles.map(f => (
              <div key={f.id} className="bg-surface-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 8 }}>
                <FileText size={12} className="text-content-muted" style={{ flexShrink: 0 }} />
                <span className="text-content-secondary" style={{ flex: 1, fontSize: 'calc(12px * var(--fs-scale-body, 1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</span>
                <a href="#" onClick={(e) => { e.preventDefault(); openFile(f.url).catch(() => {}) }} className="text-content-faint" style={{ display: 'flex', flexShrink: 0, cursor: 'pointer' }}><ExternalLink size={11} /></a>
                <button type="button" onClick={async () => {
                  if (f.reservation_id === reservation?.id) {
                    try { await apiClient.put(`/trips/${tripId}/files/${f.id}`, { reservation_id: null }) } catch { toast.error(t('reservations.toast.updateError')) }
                  }
                  try {
                    const linksRes = await apiClient.get(`/trips/${tripId}/files/${f.id}/links`)
                    const link = (linksRes.data.links || []).find((l: any) => l.reservation_id === reservation?.id)
                    if (link) await apiClient.delete(`/trips/${tripId}/files/${f.id}/link/${link.id}`)
                  } catch { toast.error(t('reservations.toast.updateError')) }
                  setLinkedFileIds(prev => prev.filter(id => id !== f.id))
                  if (tripId) loadFiles(tripId)
                }} className="text-content-faint" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, flexShrink: 0 }}>
                  <X size={11} />
                </button>
              </div>
            ))}
            {pendingFiles.map((f, i) => (
              <div key={i} className="bg-surface-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 8 }}>
                <FileText size={12} className="text-content-muted" style={{ flexShrink: 0 }} />
                <span className="text-content-secondary" style={{ flex: 1, fontSize: 'calc(12px * var(--fs-scale-body, 1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                  className="text-content-faint" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, flexShrink: 0 }}>
                  <X size={11} />
                </button>
              </div>
            ))}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.pkpass,.pkpasses,image/*,application/vnd.apple.pkpass,application/vnd.apple.pkpasses" style={{ display: 'none' }} onChange={handleFileChange} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {onFileUpload && <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="text-content-faint" style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                border: '1px dashed var(--border-primary)', borderRadius: 8, background: 'none',
                fontSize: 'calc(11px * var(--fs-scale-caption, 1))', cursor: uploadingFile ? 'default' : 'pointer', fontFamily: 'inherit',
              }}>
                <Paperclip size={11} />
                {uploadingFile ? t('reservations.uploading') : t('reservations.attachFile')}
              </button>}
              {reservation?.id && files.filter(f => !f.deleted_at && !attachedFiles.some(af => af.id === f.id)).length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button type="button" onClick={() => setShowFilePicker(v => !v)} className="text-content-faint" style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                    border: '1px dashed var(--border-primary)', borderRadius: 8, background: 'none',
                    fontSize: 'calc(11px * var(--fs-scale-caption, 1))', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <Link2 size={11} /> {t('reservations.linkExisting')}
                  </button>
                  {showFilePicker && (
                    <div className="bg-surface-card" style={{
                      position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, zIndex: 50,
                      border: '1px solid var(--border-primary)', borderRadius: 10,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 220, maxHeight: 200, overflowY: 'auto',
                    }}>
                      {files.filter(f => !f.deleted_at && !attachedFiles.some(af => af.id === f.id)).map(f => (
                        <button key={f.id} type="button" onClick={async () => {
                          try {
                            await apiClient.post(`/trips/${tripId}/files/${f.id}/link`, { reservation_id: reservation.id })
                            setLinkedFileIds(prev => [...prev, f.id])
                            setShowFilePicker(false)
                            if (tripId) loadFiles(tripId)
                          } catch { toast.error(t('reservations.toast.updateError')) }
                        }}
                          className="text-content-secondary"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 10px',
                            background: 'none', border: 'none', cursor: 'pointer', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontFamily: 'inherit',
                            borderRadius: 7, textAlign: 'left',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <FileText size={12} className="text-content-faint" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.original_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Costs — create / view the expense linked to this booking */}
        {isBudgetEnabled && (
          <BookingCostsSection
            reservationId={reservation?.id ?? null}
            pendingExpense={pendingExpense}
            onCreate={handleCreateExpense}
            onEdit={handleEditExpense}
            onRemove={handleRemoveExpense}
          />
        )}

      </form>
    </Modal>
  )
}

function formatDate(dateStr, locale) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString(locale || undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
