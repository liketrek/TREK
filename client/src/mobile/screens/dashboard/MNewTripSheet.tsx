import React, { useEffect, useRef, useState } from 'react'
import { Archive, ArchiveRestore, Bell, Camera, Luggage, Search, X } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useCanDo } from '../../../store/permissionsStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useAuthStore } from '../../../store/authStore'
import MChip from '../../components/MChip'
import CustomSelect from '../../../components/shared/CustomSelect'
import { currenciesWith, SYMBOLS } from '../../../components/Budget/BudgetPanel.constants'
import type { DashboardTrip } from '../../../pages/dashboard/dashboardModel'
import { MAX_TRIP_DAYS, type Trip, type TripCreateRequest } from '@trek/shared'
import MSheet from '../../components/MSheet'
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetBody, FormSheetFooter, FormSheetHeader, SheetDateField } from '../trip/sheets/PlSheetChrome'
import { SHEET_FIELD, SHEET_ROUND_PRIMARY, SHEET_SECONDARY } from '../trip/sheets/MTripSheetUi'
import MDayImpactList from '../../components/MDayImpactList'
import MConfirmSheet from '../settings/MConfirmSheet'
import { useTripRangeGuard, type RangeRemoval } from '../../../hooks/useTripRangeGuard'
import { dayChips, shrinkTripLines } from '../../../utils/dayImpactLines'
import { useTripCoverPicker } from '../../../components/Trips/useTripCoverPicker'
import { endDateForNewStart, tripFormError } from '../../../components/Trips/tripFormModel'

interface MNewTripSheetProps {
  open: boolean
  /** null or undefined = create, otherwise edit (the planner may not have its trip yet) */
  trip: DashboardTrip | null | undefined
  onClose: () => void
  onSave: (data: TripCreateRequest) => Promise<{ trip?: Trip } | void> | void
  onCoverUpdate?: (tripId: number, coverUrl: string | null) => void
  /** Edit mode only: archives (or restores) the trip — the grid cards have no archive button. */
  onArchive?: () => void
}

/** The reminder presets the desktop form offers; anything else is a custom number of days. */
const REMINDER_PRESETS = [0, 1, 3, 9]


/**
 * Create/edit trip sheet — the mobile counterpart of TripFormModal's core flow:
 * title, date range (or a day count without one), the reminder and the
 * Unsplash cover search (plus device upload). The trip planner's More sheet
 * opens it for editing too. Archiving
 * lives here in edit mode, as decided for the grid cards.
 */
export default function MNewTripSheet({ open, trip: tripProp, onClose, onSave, onCoverUpdate, onArchive }: MNewTripSheetProps): React.ReactElement {
  const trip = tripProp ?? null
  const isEditing = !!trip
  const { t } = useTranslation()
  const can = useCanDo()
  const defaultCurrency = useSettingsStore(s => s.settings.default_currency) || 'EUR'
  const canEditTrip = !isEditing || can('trip_edit', trip)
  const canUploadCover = !isEditing || can('trip_cover_upload', trip)
  const currentUser = useAuthStore(s => s.user)
  const remindersEnabled = useAuthStore(s => s.tripRemindersEnabled)
  // As on the desktop: the reminder is the owner's (or an admin's), and set when creating.
  const showReminder = !isEditing || trip?.user_id === currentUser?.id || currentUser?.role === 'admin'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [dayCount, setDayCount] = useState<number | ''>(7)
  const [reminderDays, setReminderDays] = useState(0)
  const [customReminder, setCustomReminder] = useState(false)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const cover = useTripCoverPicker({ trip, title, onCoverUpdate, releasePreviewOnChange: true })
  // A save whose new dates remove days with something on them, held until the
  // traveller confirms. The phone has no shift step, so bookings keep their dates.
  const [pendingRemoval, setPendingRemoval] = useState<{ payload: TripCreateRequest; removal: RangeRemoval | 'unknown' } | null>(null)
  const rangeGuard = useTripRangeGuard()
  const busy = isSaving || rangeGuard.checking

  useEffect(() => {
    if (!open) return
    setTitle(trip?.title || '')
    setDescription(trip?.description || '')
    setStartDate(trip?.start_date || '')
    setEndDate(trip?.end_date || '')
    setCurrency(trip?.currency || defaultCurrency)
    setDayCount(trip?.day_count || 7)
    const reminder = trip ? (trip.reminder_days ?? 3) : (remindersEnabled ? 3 : 0)
    setReminderDays(reminder)
    setCustomReminder(!REMINDER_PRESETS.includes(reminder))
    cover.resetCover(trip?.cover_image || null)
    setError('')
    setPendingRemoval(null)
  }, [trip, open])

  // Moving the start keeps the trip length (same rule as TripFormModal). Every
  // edit clears the last save's complaint, as on the desktop form.
  const changeStart = (value: string) => {
    setError('')
    setEndDate(endDateForNewStart(startDate, endDate, value))
    setStartDate(value)
  }

  /** The payload the form stands for, or null after putting the reason on screen. */
  const validPayload = (): TripCreateRequest | null => {
    setError('')
    const formError = tripFormError({ title, startDate, endDate }, trip, t)
    if (formError) { setError(formError); return null }
    const dateless = !startDate && !endDate
    if (dateless && (dayCount === '' || dayCount < 1 || dayCount > MAX_TRIP_DAYS)) {
      setError(t('dashboard.dayCountRequired')); return null
    }
    // The count goes along only when it says something new: the trip's own one
    // goes stale in the planner, and sending it back would trim a day just added.
    const sendDayCount = dateless && (!isEditing || dayCount !== trip?.day_count)
    return {
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      currency,
      ...(showReminder ? { reminder_days: reminderDays } : {}),
      ...(sendDayCount ? { day_count: Number(dayCount) } : {}),
    }
  }

  const handleSave = async () => {
    const payload = validPayload()
    if (!payload) return
    // New dates that remove days with something on them ask first, the same
    // question the desktop dialog asks, with the same list.
    const removal = isEditing && trip ? await rangeGuard.check(trip, payload) : null
    if (removal) { setPendingRemoval({ payload, removal }); return }
    await save(payload)
  }

  const save = async (payload: TripCreateRequest) => {
    setIsSaving(true)
    try {
      const result = await onSave(payload)
      const created = result ? result.trip : undefined
      await cover.applyToCreatedTrip(created?.id)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('places.saveError'))
    } finally {
      setIsSaving(false)
    }
  }


  const removalList = pendingRemoval && pendingRemoval.removal !== 'unknown' ? pendingRemoval.removal : null

  return (
    <>
    <MSheet open={open} onClose={onClose} form ariaLabel={isEditing ? t('dashboard.editTrip') : t('dashboard.createTrip')}>
      <FormSheetHeader
        icon={Luggage}
        title={isEditing ? t('dashboard.editTrip') : t('dashboard.createTrip')}
        subtitle={isEditing ? trip?.title : undefined}
        onClose={onClose}
        closeLabel={t('common.cancel')}
      />

      {/* Flat fields under their labels, as in every other form sheet: no
          cards inside the card. */}
      <FormSheetBody>
        {error && (
          <div className="mt-2 rounded-[14px] bg-[color:var(--m-ic)] px-3 py-[10px] text-caption font-semibold text-[color:var(--m-st-danger)]">
            {error}
          </div>
        )}

        <Eyebrow className="mb-[5px] mt-2 uppercase">{t('dashboard.tripTitle')}</Eyebrow>
        <input
          value={title}
          onChange={e => { if (canEditTrip) { setError(''); setTitle(e.target.value) } }}
          readOnly={!canEditTrip}
          placeholder={t('dashboard.tripTitlePlaceholder')}
          aria-label={t('dashboard.tripTitle')}
          className={`${FIELD_CLS} font-semibold`}
        />
        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('dashboard.tripDescription')}</Eyebrow>
        <textarea
          value={description}
          onChange={e => { if (canEditTrip) { setError(''); setDescription(e.target.value) } }}
          readOnly={!canEditTrip}
          placeholder={t('dashboard.tripDescriptionPlaceholder')}
          aria-label={t('dashboard.tripDescription')}
          rows={2}
          className={FIELD_AREA_CLS}
        />

        {/* Side by side. A placeholder longer than its field ("Дата окончания")
            ends in an ellipsis inside it rather than running past its edge. */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <Eyebrow className="mb-[5px] truncate uppercase">{t('dashboard.startDate')}</Eyebrow>
            <SheetDateField
              value={startDate}
              onChange={v => { if (canEditTrip) changeStart(v) }}
              placeholder={t('dashboard.startDate')}
            />
          </div>
          <div className="min-w-0">
            <Eyebrow className="mb-[5px] truncate uppercase">{t('dashboard.endDate')}</Eyebrow>
            <SheetDateField
              value={endDate}
              onChange={v => { if (canEditTrip) { setError(''); setEndDate(v) } }}
              placeholder={t('dashboard.endDate')}
            />
          </div>
        </div>
        {!startDate && !endDate && (
          <>
            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('dashboard.dayCount')}</Eyebrow>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_TRIP_DAYS}
              value={dayCount}
              onChange={e => {
                if (!canEditTrip) return
                setError('')
                const raw = e.target.value
                setDayCount(raw === '' ? '' : Math.min(MAX_TRIP_DAYS, Math.max(1, Math.floor(Number(raw)) || 1)))
              }}
              readOnly={!canEditTrip}
              aria-label={t('dashboard.dayCount')}
              className={FIELD_CLS}
            />
            {!isEditing && <p className="mt-[6px] px-1 font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] text-m-faint">{t('dashboard.noDateHint')}</p>}
          </>
        )}

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('dashboard.currency')}</Eyebrow>
        <CustomSelect
          value={currency}
          onChange={v => { if (canEditTrip) { setError(''); setCurrency(String(v)) } }}
          disabled={!canEditTrip}
          searchable
          size="sm"
          options={currenciesWith(currency).map(c => ({ value: c, label: `${c} (${SYMBOLS[c] || c})` }))}
          style={{ width: '100%' }}
        />

        {showReminder && (
          <div className="mt-3">
            <ReminderField
              enabled={remindersEnabled}
              days={reminderDays}
              custom={customReminder}
              onPreset={days => { setError(''); setReminderDays(days); setCustomReminder(false) }}
              onCustom={() => { setCustomReminder(true); if (REMINDER_PRESETS.includes(reminderDays)) setReminderDays(7) }}
              onDays={setReminderDays}
            />
          </div>
        )}

        {canUploadCover && (
          <>
            <Eyebrow className="mt-3 uppercase">{t('dashboard.coverImage')}</Eyebrow>
            <CoverField cover={cover} title={title} />
          </>
        )}

        {isEditing && onArchive && (
          <button
            type="button"
            onClick={() => { onArchive(); onClose() }}
            className={`${SHEET_SECONDARY} mt-4 w-full`}
          >
            {trip?.is_archived ? <ArchiveRestore size={14} strokeWidth={2.2} /> : <Archive size={14} strokeWidth={2.2} />}
            {trip?.is_archived ? t('dashboard.restore') : t('dashboard.archive')}
          </button>
        )}
      </FormSheetBody>

      <FormSheetFooter
        onCancel={onClose}
        cancelLabel={t('common.cancel')}
        onSubmit={handleSave}
        submitLabel={busy ? t('common.saving') : isEditing ? t('common.update') : t('dashboard.createTrip')}
        submitDisabled={busy}
      />
    </MSheet>

    {/* After the sheet, so it opens on top of it. */}
    <MConfirmSheet
      open={pendingRemoval != null}
      onClose={() => setPendingRemoval(null)}
      title={t('dashboard.shrinkTitle')}
      message={t(removalList ? 'dashboard.shrinkIntro' : 'dashboard.shrinkUnknown')}
      confirmLabel={t('dashboard.shrinkConfirm')}
      cancelLabel={t('common.cancel')}
      danger
      busy={isSaving}
      onConfirm={() => {
        if (!pendingRemoval) return
        const { payload } = pendingRemoval
        setPendingRemoval(null)
        void save(payload)
      }}
    >
      {removalList && (
        <MDayImpactList
          lines={shrinkTripLines(removalList, t)}
          days={dayChips(removalList.dayLabels, t)}
          label={t('dashboard.shrinkTitle')}
        />
      )}
    </MConfirmSheet>
    </>
  )
}

/** The trip's reminder: the presets, or a number of days of one's own; a hint while reminders are off. */
function ReminderField({ enabled, days, custom, onPreset, onCustom, onDays }: {
  enabled: boolean
  days: number
  custom: boolean
  onPreset: (days: number) => void
  onCustom: () => void
  onDays: (days: number) => void
}): React.ReactElement {
  const { t } = useTranslation()
  return (
    <div>
      <Eyebrow className="uppercase">
        <span className="inline-flex items-center gap-1"><Bell size={10} strokeWidth={2.4} />{t('trips.reminder')}</span>
      </Eyebrow>
      {!enabled ? (
        <p className="mt-1 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] leading-snug text-m-muted">{t('trips.reminderDisabledHint')}</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REMINDER_PRESETS.map(preset => (
              <MChip key={preset} pressable active={!custom && days === preset} onClick={() => onPreset(preset)}>
                {preset === 0 ? t('trips.reminderNone') : `${preset} ${t(preset === 1 ? 'trips.reminderDay' : 'trips.reminderDays')}`}
              </MChip>
            ))}
            <MChip pressable active={custom} onClick={onCustom}>
              {t('trips.reminderCustom')}
            </MChip>
          </div>
          {custom && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
                value={days}
                onChange={e => onDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                aria-label={t('trips.reminderDaysBefore')}
                className="h-[34px] w-16 rounded-full border border-[color:var(--m-rowbr)] bg-transparent px-3 text-center text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink outline-none"
              />
              <span className="font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-muted">{t('trips.reminderDaysBefore')}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** The cover: a photo from the device or from Unsplash, with its preview. */
function CoverField({ cover, title }: { cover: ReturnType<typeof useTripCoverPicker>; title: string }): React.ReactElement {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const { coverPreview, uploadingCover, searchQuery, setSearchQuery, searchResults, searchError, searching } = cover
  return (
    <div className="mt-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { void cover.selectFile(e.target.files?.[0]); e.target.value = '' }}
      />
      {coverPreview ? (
        <div className="relative h-[130px] overflow-hidden rounded-[16px]">
          <img src={coverPreview} alt="" className="h-full w-full object-cover" />
          <div className="absolute bottom-2 end-2 flex gap-[6px]">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingCover}
              className="flex h-[34px] items-center gap-1 rounded-full border border-white/30 bg-white/[.22] px-3 text-[0.6875rem] font-semibold text-white backdrop-blur-[8px]"
            >
              <Camera size={13} strokeWidth={2.1} />
              {uploadingCover ? t('common.uploading') : t('common.change')}
            </button>
            <button
              type="button"
              onClick={cover.removeCover}
              aria-label={t('common.delete')}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/30 bg-white/[.22] text-white backdrop-blur-[8px]"
            >
              <X size={14} strokeWidth={2.1} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadingCover}
          className="flex w-full items-center justify-center gap-[6px] rounded-[14px] border border-dashed border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[18px] text-[0.8125rem] font-medium text-m-muted"
        >
          <Camera size={15} strokeWidth={2} />
          {uploadingCover ? t('common.uploading') : t('dashboard.mobile.addCoverImage')}
        </button>
      )}

      <div className="mt-2 flex gap-2">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void cover.search() } }}
          placeholder={t('dashboard.unsplashSearchPlaceholder')}
          aria-label={t('dashboard.unsplashSearchPlaceholder')}
          className={SHEET_FIELD}
        />
        <button
          type="button"
          onClick={cover.search}
          disabled={searching || (!searchQuery.trim() && !title.trim())}
          aria-label={t('dashboard.searchUnsplash')}
          className={SHEET_ROUND_PRIMARY}
        >
          <Search size={15} strokeWidth={2.2} />
        </button>
      </div>
      {searchError && <p className="mt-[6px] px-1 text-[0.6875rem] font-medium text-[color:var(--m-st-danger)]">{searchError}</p>}
      {searchResults.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {searchResults.map(photo => (
            <button
              key={photo.id}
              type="button"
              onClick={() => cover.selectPhoto(photo)}
              aria-label={t('dashboard.useUnsplashPhoto', { photographer: photo.photographer || 'Unsplash' })}
              className={`relative h-20 overflow-hidden rounded-[12px] border ${
                coverPreview === photo.url ? 'border-[color:var(--m-act)]' : 'border-[color:var(--m-rowbr)]'
              }`}
            >
              <img src={photo.thumb} alt={photo.description || ''} loading="lazy" className="h-full w-full object-cover" />
              {photo.photographer && (
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-[6px] py-1 text-start font-geist text-[0.625rem] text-white">
                  {photo.photographer}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
