import React, { useEffect, useRef, useState } from 'react'
import { Archive, ArchiveRestore, Camera, Search, X } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { tripsApi } from '../../../api/client'
import { useCanDo } from '../../../store/permissionsStore'
import { useToast } from '../../../components/shared/Toast'
import { normalizeImageFile } from '../../../utils/convertHeic'
import { getApiErrorMessage } from '../../../types'
import { CustomDatePicker } from '../../../components/shared/CustomDateTimePicker'
import type { DashboardTrip } from '../../../pages/dashboard/dashboardModel'
import type { Trip, TripCreateRequest } from '@trek/shared'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import MListRow from '../../components/MListRow'

interface CoverSearchPhoto {
  id: string
  url: string
  thumb: string
  description?: string | null
  photographer?: string | null
}

interface MNewTripSheetProps {
  open: boolean
  /** null = create, otherwise edit */
  trip: DashboardTrip | null
  onClose: () => void
  onSave: (data: TripCreateRequest) => Promise<{ trip?: Trip } | void> | void
  onCoverUpdate?: (tripId: number, coverUrl: string | null) => void
  /** Edit mode only: archives (or restores) the trip — the grid cards have no archive button. */
  onArchive?: () => void
}

function FieldLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="font-geist text-[0.5625rem] font-bold uppercase tracking-[.1em] text-m-faint">{children}</div>
  )
}

/**
 * Create/edit trip sheet — the mobile counterpart of TripFormModal's core flow:
 * title, date range and Unsplash cover search (plus device upload). Archiving
 * lives here in edit mode, as decided for the grid cards.
 */
export default function MNewTripSheet({ open, trip, onClose, onSave, onCoverUpdate, onArchive }: MNewTripSheetProps): React.ReactElement {
  const isEditing = !!trip
  const { t } = useTranslation()
  const toast = useToast()
  const can = useCanDo()
  const fileRef = useRef<HTMLInputElement>(null)
  const coverSearchSeq = useRef(0)
  const canEditTrip = !isEditing || can('trip_edit', trip)
  const canUploadCover = !isEditing || can('trip_cover_upload', trip)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [pendingUnsplashUrl, setPendingUnsplashUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CoverSearchPhoto[]>([])
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(trip?.title || '')
    setDescription(trip?.description || '')
    setStartDate(trip?.start_date || '')
    setEndDate(trip?.end_date || '')
    setCoverPreview(trip?.cover_image || null)
    setPendingCoverFile(null)
    setPendingUnsplashUrl(null)
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
    setError('')
  }, [trip, open])

  // Moving the start keeps the trip length (same rule as TripFormModal).
  const changeStart = (value: string) => {
    if (value && endDate && startDate && endDate >= startDate) {
      const duration = Math.round((new Date(endDate + 'T00:00:00Z').getTime() - new Date(startDate + 'T00:00:00Z').getTime()) / 86400000)
      const newEnd = new Date(value + 'T00:00:00Z')
      newEnd.setDate(newEnd.getDate() + duration)
      setEndDate(newEnd.toISOString().split('T')[0])
    } else if (value && (!endDate || endDate < value)) {
      setEndDate(value)
    }
    setStartDate(value)
  }

  const handleSave = async () => {
    setError('')
    if (!title.trim()) { setError(t('dashboard.titleRequired')); return }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError(t('dashboard.endDateError')); return
    }
    setIsSaving(true)
    try {
      const result = await onSave({
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        ...(!startDate && !endDate && !isEditing ? { day_count: 7 } : {}),
      })
      const created = result ? result.trip : undefined
      if (pendingCoverFile && created?.id) {
        try {
          const fd = new FormData()
          fd.append('cover', pendingCoverFile)
          const data = await tripsApi.uploadCover(created.id, fd)
          onCoverUpdate?.(created.id, data.cover_image)
        } catch {
          toast.error(t('dashboard.coverUploadError'))
        }
      } else if (pendingUnsplashUrl && created?.id) {
        try {
          await tripsApi.update(created.id, { cover_image: pendingUnsplashUrl })
          onCoverUpdate?.(created.id, pendingUnsplashUrl)
        } catch {
          toast.error(t('dashboard.coverSaveError'))
        }
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('places.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCoverFile = async (file: File | undefined | null) => {
    if (!file) return
    const normalized = await normalizeImageFile(file)
    setPendingUnsplashUrl(null)
    if (isEditing && trip?.id) {
      setUploadingCover(true)
      try {
        const fd = new FormData()
        fd.append('cover', normalized)
        const data = await tripsApi.uploadCover(trip.id, fd)
        setCoverPreview(data.cover_image)
        onCoverUpdate?.(trip.id, data.cover_image)
        toast.success(t('dashboard.coverSaved'))
      } catch {
        toast.error(t('dashboard.coverUploadError'))
      } finally {
        setUploadingCover(false)
      }
    } else {
      setPendingCoverFile(normalized)
      setCoverPreview(URL.createObjectURL(normalized))
    }
  }

  const handleSearch = async () => {
    const query = searchQuery.trim() || title.trim()
    if (!query) { setSearchError(t('dashboard.unsplashQueryRequired')); return }
    // Only the latest search may apply its results (out-of-order guard).
    const seq = ++coverSearchSeq.current
    setSearching(true)
    setSearchError('')
    try {
      const data = await tripsApi.searchCoverImages(query)
      if (seq !== coverSearchSeq.current) return
      const photos: CoverSearchPhoto[] = data.photos || []
      setSearchResults(photos)
      if (photos.length === 0) setSearchError(t('dashboard.unsplashNoResults'))
    } catch (err: unknown) {
      if (seq !== coverSearchSeq.current) return
      setSearchError(getApiErrorMessage(err, t('dashboard.coverSearchError')))
    } finally {
      if (seq === coverSearchSeq.current) setSearching(false)
    }
  }

  const selectUnsplash = async (photo: CoverSearchPhoto) => {
    if (!photo.url) return
    setPendingCoverFile(null)
    if (isEditing && trip?.id) {
      setUploadingCover(true)
      try {
        await tripsApi.update(trip.id, { cover_image: photo.url })
        setCoverPreview(photo.url)
        onCoverUpdate?.(trip.id, photo.url)
        toast.success(t('dashboard.coverSaved'))
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, t('dashboard.coverSaveError')))
      } finally {
        setUploadingCover(false)
      }
    } else {
      setPendingUnsplashUrl(photo.url)
      setCoverPreview(photo.url)
    }
  }

  const removeCover = async () => {
    if (pendingCoverFile || pendingUnsplashUrl) {
      setPendingCoverFile(null)
      setPendingUnsplashUrl(null)
      setCoverPreview(null)
      return
    }
    if (!trip?.id) return
    try {
      await tripsApi.update(trip.id, { cover_image: null })
      setCoverPreview(null)
      onCoverUpdate?.(trip.id, null)
    } catch {
      toast.error(t('dashboard.coverRemoveError'))
    }
  }

  const boxCls = 'rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[11px_12px]'
  const inputCls = 'w-full border-none bg-transparent pt-[2px] font-[inherit] text-[0.9375rem] font-semibold text-m-ink outline-none placeholder:text-m-faint'

  return (
    <MSheet open={open} onClose={onClose} variant="card" material="opaque" ariaLabel={isEditing ? t('dashboard.editTrip') : t('dashboard.createTrip')}>
      <div className="flex items-center gap-[11px] p-[16px_16px_0]">
        <div className="min-w-0 flex-1 truncate text-[1.0625rem] font-bold">
          {isEditing ? t('dashboard.editTrip') : t('dashboard.createTrip')}
        </div>
        <MIconBtn ariaLabel={t('common.cancel')} variant="neutral" size={34} onClick={onClose}>
          <X size={16} strokeWidth={2.2} />
        </MIconBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-3 rounded-[14px] bg-[color:var(--m-ic)] p-[11px_12px] text-[0.75rem] font-semibold text-[color:var(--m-st-danger)]">
            {error}
          </div>
        )}

        <div className={boxCls}>
          <FieldLabel>{t('dashboard.tripTitle')}</FieldLabel>
          <input
            value={title}
            onChange={e => canEditTrip && setTitle(e.target.value)}
            readOnly={!canEditTrip}
            placeholder={t('dashboard.tripTitlePlaceholder')}
            className={inputCls}
          />
        </div>

        <div className={`${boxCls} mt-2`}>
          <FieldLabel>{t('dashboard.tripDescription')}</FieldLabel>
          <textarea
            value={description}
            onChange={e => canEditTrip && setDescription(e.target.value)}
            readOnly={!canEditTrip}
            placeholder={t('dashboard.tripDescriptionPlaceholder')}
            rows={2}
            className={`${inputCls} resize-none text-[0.8125rem] font-medium`}
          />
        </div>

        <div className="mt-2 flex gap-2">
          <div className={`${boxCls} min-w-0 flex-1`}>
            <FieldLabel>{t('dashboard.startDate')}</FieldLabel>
            <CustomDatePicker
              value={startDate}
              onChange={v => { if (canEditTrip) changeStart(v) }}
              placeholder={t('dashboard.startDate')}
              borderless
              style={{ marginTop: 3 }}
            />
          </div>
          <div className={`${boxCls} min-w-0 flex-1`}>
            <FieldLabel>{t('dashboard.endDate')}</FieldLabel>
            <CustomDatePicker
              value={endDate}
              onChange={v => { if (canEditTrip) setEndDate(v) }}
              placeholder={t('dashboard.endDate')}
              borderless
              style={{ marginTop: 3 }}
            />
          </div>
        </div>
        {!isEditing && !startDate && !endDate && (
          <div className="mt-[6px] px-1 font-geist text-[0.625rem] text-m-faint">{t('dashboard.noDateHint')}</div>
        )}

        {canUploadCover && (
          <div className="mt-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { handleCoverFile(e.target.files?.[0]); e.target.value = '' }}
            />
            {coverPreview ? (
              <div className="relative h-[130px] overflow-hidden rounded-[16px]">
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                <div className="absolute bottom-2 right-2 flex gap-[6px]">
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
                    onClick={removeCover}
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
              <div className={`${boxCls} min-w-0 flex-1 py-[9px]`}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
                  placeholder={t('dashboard.unsplashSearchPlaceholder')}
                  className={`${inputCls} pt-0 text-[0.8125rem] font-medium`}
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || (!searchQuery.trim() && !title.trim())}
                aria-label={t('dashboard.searchUnsplash')}
                className="flex h-auto w-[42px] flex-none items-center justify-center rounded-[14px] bg-m-act text-m-actfg disabled:opacity-50"
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
                    onClick={() => selectUnsplash(photo)}
                    aria-label={t('dashboard.useUnsplashPhoto', { photographer: photo.photographer || 'Unsplash' })}
                    className={`relative h-20 overflow-hidden rounded-[12px] border ${
                      coverPreview === photo.url ? 'border-[color:var(--m-act)]' : 'border-[color:var(--m-rowbr)]'
                    }`}
                  >
                    <img src={photo.thumb} alt={photo.description || ''} loading="lazy" className="h-full w-full object-cover" />
                    {photo.photographer && (
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-[6px] py-1 text-left font-geist text-[0.625rem] text-white">
                        {photo.photographer}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isEditing && onArchive && (
          <div className="mt-2 rounded-[14px] bg-[color:var(--m-ic)]">
            <MListRow
              icon={trip?.is_archived ? ArchiveRestore : Archive}
              label={trip?.is_archived ? t('dashboard.restore') : t('dashboard.archive')}
              onClick={() => { onArchive(); onClose() }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 p-[0_16px_16px]">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full bg-[color:var(--m-ic)] py-[10px] text-[0.8125rem] font-semibold text-m-ink"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 rounded-full bg-m-act py-[10px] text-[0.8125rem] font-semibold text-m-actfg disabled:opacity-50"
        >
          {isSaving ? t('common.saving') : isEditing ? t('common.update') : t('dashboard.createTrip')}
        </button>
      </div>
    </MSheet>
  )
}
