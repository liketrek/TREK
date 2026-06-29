import { useState, useEffect, useRef } from 'react'
import Modal from '../shared/Modal'
import { Calendar, Camera, Search, X, UserPlus, Bell } from 'lucide-react'
import { tripsApi, authApi } from '../../api/client'
import CustomSelect from '../shared/CustomSelect'
import { useAuthStore } from '../../store/authStore'
import { useCanDo } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import { normalizeImageFile } from '../../utils/convertHeic'
import { getApiErrorMessage, type Trip } from '../../types'
import type { TripCreateRequest } from '@trek/shared'

interface TripFormModalProps {
  isOpen: boolean
  onClose: () => void
  // Create returns the new trip (so we can attach members / upload the cover);
  // update resolves without a payload.
  onSave: (data: TripCreateRequest) => Promise<{ trip?: Trip } | void> | void
  trip: Trip | null
  onCoverUpdate?: (tripId: number, coverUrl: string | null) => void
}

interface CoverSearchPhoto {
  id: string
  url: string
  thumb: string
  description?: string | null
  photographer?: string | null
  link?: string | null
}

export default function TripFormModal({ isOpen, onClose, onSave, trip, onCoverUpdate }: TripFormModalProps) {
  const isEditing = !!trip
  const fileRef = useRef(null)
  const coverSearchSeq = useRef(0)
  const toast = useToast()
  const { t } = useTranslation()
  const currentUser = useAuthStore(s => s.user)
  const tripRemindersEnabled = useAuthStore(s => s.tripRemindersEnabled)
  const setTripRemindersEnabled = useAuthStore(s => s.setTripRemindersEnabled)
  const can = useCanDo()
  const canUploadCover = !isEditing || can('trip_cover_upload', trip)
  const canEditTrip = !isEditing || can('trip_edit', trip)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    reminder_days: 0 as number,
    day_count: 7 as number | '',
  })
  const [customReminder, setCustomReminder] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
  const [pendingUnsplashUrl, setPendingUnsplashUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverSearchQuery, setCoverSearchQuery] = useState('')
  const [coverSearchResults, setCoverSearchResults] = useState<CoverSearchPhoto[]>([])
  const [coverSearchError, setCoverSearchError] = useState('')
  const [searchingCover, setSearchingCover] = useState(false)
  const [allUsers, setAllUsers] = useState<{ id: number; username: string }[]>([])
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [existingMembers, setExistingMembers] = useState<{ id: number; username: string }[]>([])
  const [memberSelectValue, setMemberSelectValue] = useState('')

  useEffect(() => {
    if (trip) {
      const rd = trip.reminder_days ?? 3
      setFormData({
        title: trip.title || '',
        description: trip.description || '',
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        reminder_days: rd,
        day_count: trip.day_count || 7,
      })
      setCustomReminder(![0, 1, 3, 9].includes(rd))
      setCoverPreview(trip.cover_image || null)
      setCoverSearchQuery('')
    } else {
      setFormData({ title: '', description: '', start_date: '', end_date: '', reminder_days: tripRemindersEnabled ? 3 : 0, day_count: 7 })
      setCustomReminder(false)
      setCoverPreview(null)
      setCoverSearchQuery('')
    }
    setPendingCoverFile(null)
    setPendingUnsplashUrl(null)
    setCoverSearchResults([])
    setCoverSearchError('')
    setSelectedMembers([])
    setError('')
    if (isOpen) {
      authApi.getAppConfig().then((c: { trip_reminders_enabled?: boolean }) => {
        if (c?.trip_reminders_enabled !== undefined) setTripRemindersEnabled(c.trip_reminders_enabled)
      }).catch(() => {})
    }
    authApi.listUsers().then(d => setAllUsers(d.users || [])).catch(() => {})
    if (trip) {
      tripsApi.getMembers(trip.id).then(d => setExistingMembers(d.members || [])).catch(() => {})
    } else {
      setExistingMembers([])
    }
  }, [trip, isOpen])

  useEffect(() => {
    if (!trip && isOpen) {
      setFormData(prev => ({ ...prev, reminder_days: tripRemindersEnabled ? 3 : 0 }))
    }
  }, [tripRemindersEnabled])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.title.trim()) { setError(t('dashboard.titleRequired')); return }
    if (formData.start_date && formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      setError(t('dashboard.endDateError')); return
    }
    if (!formData.start_date && !formData.end_date) {
      const dc = Number(formData.day_count)
      if (formData.day_count === '' || !Number.isInteger(dc) || dc < 1 || dc > 365) {
        setError(t('dashboard.dayCountRequired')); return
      }
    }
    setIsLoading(true)
    try {
      const result = await onSave({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        reminder_days: formData.reminder_days,
        ...(!formData.start_date && !formData.end_date ? { day_count: Number(formData.day_count) } : {}),
      })
      const createdTrip = result ? result.trip : undefined
      // Add selected members for newly created trips
      if (selectedMembers.length > 0 && createdTrip?.id) {
        let memberAddFailed = false
        for (const userId of selectedMembers) {
          const user = allUsers.find(u => u.id === userId)
          if (user) {
            try { await tripsApi.addMember(createdTrip.id, user.username) } catch { memberAddFailed = true }
          }
        }
        if (memberAddFailed) toast.error(t('trips.memberAddError'))
      }
      // Upload pending cover for newly created trips
      if (pendingCoverFile && createdTrip?.id) {
        try {
          const fd = new FormData()
          fd.append('cover', pendingCoverFile)
          const data = await tripsApi.uploadCover(createdTrip.id, fd)
          onCoverUpdate?.(createdTrip.id, data.cover_image)
        } catch {
          // Cover upload failed but trip was created — surface it without blocking the create
          toast.error(t('dashboard.coverUploadError'))
        }
      } else if (pendingUnsplashUrl && createdTrip?.id) {
        try {
          await tripsApi.update(createdTrip.id, { cover_image: pendingUnsplashUrl })
          onCoverUpdate?.(createdTrip.id, pendingUnsplashUrl)
        } catch {
          toast.error(t('dashboard.coverSaveError'))
        }
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('places.saveError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCoverSelect = async (file) => {
    if (!file) return
    // HEIC/HEIF from iOS can't be rendered or stored as-is — convert to JPEG first
    const normalized = await normalizeImageFile(file)
    setPendingUnsplashUrl(null)
    if (isEditing && trip?.id) {
      // Existing trip: upload immediately
      uploadCoverNow(normalized)
    } else {
      // New trip: stage for upload after creation
      setPendingCoverFile(normalized)
      setCoverPreview(URL.createObjectURL(normalized))
    }
  }

  const handleCoverChange = (e) => {
    handleCoverSelect((e.target as HTMLInputElement).files?.[0])
    e.target.value = ''
  }

  const uploadCoverNow = async (file) => {
    setUploadingCover(true)
    try {
      const fd = new FormData()
      fd.append('cover', file)
      const data = await tripsApi.uploadCover(trip.id, fd)
      setCoverPreview(data.cover_image)
      onCoverUpdate?.(trip.id, data.cover_image)
      toast.success(t('dashboard.coverSaved'))
    } catch {
      toast.error(t('dashboard.coverUploadError'))
    } finally {
      setUploadingCover(false)
    }
  }

  const handleCoverSearch = async () => {
    const query = coverSearchQuery.trim() || formData.title.trim()
    if (!query) {
      setCoverSearchError(t('dashboard.unsplashQueryRequired'))
      return
    }
    // Guard against out-of-order responses: only the latest search applies its
    // results, so a slow earlier query can't overwrite a newer one. #1277 review
    const seq = ++coverSearchSeq.current
    setSearchingCover(true)
    setCoverSearchError('')
    try {
      const data = await tripsApi.searchCoverImages(query)
      if (seq !== coverSearchSeq.current) return
      const photos = data.photos || []
      setCoverSearchResults(photos)
      if (photos.length === 0) setCoverSearchError(t('dashboard.unsplashNoResults'))
    } catch (err: unknown) {
      if (seq !== coverSearchSeq.current) return
      setCoverSearchError(getApiErrorMessage(err, t('dashboard.coverSearchError')))
    } finally {
      if (seq === coverSearchSeq.current) setSearchingCover(false)
    }
  }

  const handleUnsplashSelect = async (photo: CoverSearchPhoto) => {
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

  const handleRemoveCover = async () => {
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

  // Paste support for cover image
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!canUploadCover) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) handleCoverSelect(file)
        return
      }
    }
  }

  const update = (field, value) => setFormData(prev => {
    const next = { ...prev, [field]: value }
    if (field === 'start_date' && value) {
      if (!prev.end_date || prev.end_date < value) {
        next.end_date = value
      } else if (prev.start_date) {
        const oldStart = new Date(prev.start_date + 'T00:00:00Z')
        const oldEnd = new Date(prev.end_date + 'T00:00:00Z')
        const duration = Math.round((oldEnd.getTime() - oldStart.getTime()) / 86400000)
        const newEnd = new Date(value + 'T00:00:00Z')
        newEnd.setDate(newEnd.getDate() + duration)
        next.end_date = newEnd.toISOString().split('T')[0]
      }
    }
    return next
  })

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent text-sm"

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('dashboard.editTrip') : t('dashboard.createTrip')}
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg transition-colors flex items-center gap-2">
            {isLoading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('common.saving')}</>
              : isEditing ? t('common.update') : t('dashboard.createTrip')}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" onPaste={handlePaste}>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {/* Cover image — gated by trip_cover_upload permission */}
        {canUploadCover && <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('dashboard.coverImage')}</label>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
          {coverPreview ? (
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 130 }}>
              <img src={coverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingCover}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                  <Camera size={12} /> {uploadingCover ? t('common.uploading') : t('common.change')}
                </button>
                <button type="button" onClick={handleRemoveCover}
                  style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingCover}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'none' }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'none'; const file = e.dataTransfer.files?.[0]; if (file?.type.startsWith('image/')) handleCoverSelect(file) }}
              style={{ width: '100%', padding: '18px', border: '2px dashed #e5e7eb', borderRadius: 10, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: '#9ca3af', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#9ca3af' }}>
              <Camera size={15} /> {uploadingCover ? t('common.uploading') : t('dashboard.addCoverImage')}
            </button>
          )}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={coverSearchQuery}
              onChange={e => setCoverSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCoverSearch() } }}
              placeholder={t('dashboard.unsplashSearchPlaceholder')}
              className={inputCls}
            />
            <button type="button" onClick={handleCoverSearch} disabled={searchingCover || (!coverSearchQuery.trim() && !formData.title.trim())}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap">
              {searchingCover ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" /> : <Search size={14} />}
              {t('dashboard.searchUnsplash')}
            </button>
          </div>
          {coverSearchError && <p className="text-xs text-red-500 mt-1.5">{coverSearchError}</p>}
          {coverSearchResults.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {coverSearchResults.map(photo => (
                <button
                  type="button"
                  key={photo.id}
                  onClick={() => handleUnsplashSelect(photo)}
                  aria-label={t('dashboard.useUnsplashPhoto', { photographer: photo.photographer || 'Unsplash' })}
                  className={`relative h-20 overflow-hidden rounded-lg border transition-colors ${coverPreview === photo.url ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-200 hover:border-slate-400'}`}
                >
                  <img src={photo.thumb} alt={photo.description || ''} loading="lazy" className="w-full h-full object-cover" />
                  {photo.photographer && (
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-1 text-[10px] text-white">
                      {photo.photographer}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {t('dashboard.tripTitle')} <span className="text-red-500">*</span>
          </label>
          <input type="text" value={formData.title} onChange={e => canEditTrip && update('title', e.target.value)}
            required readOnly={!canEditTrip} placeholder={t('dashboard.tripTitlePlaceholder')} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('dashboard.tripDescription')}</label>
          <textarea value={formData.description} onChange={e => canEditTrip && update('description', e.target.value)}
            readOnly={!canEditTrip} placeholder={t('dashboard.tripDescriptionPlaceholder')} rows={3}
            className={`${inputCls} resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Calendar className="inline w-4 h-4 mr-1" />{t('dashboard.startDate')}
            </label>
            <CustomDatePicker value={formData.start_date} onChange={v => update('start_date', v)} placeholder={t('dashboard.startDate')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Calendar className="inline w-4 h-4 mr-1" />{t('dashboard.endDate')}
            </label>
            <CustomDatePicker value={formData.end_date} onChange={v => update('end_date', v)} placeholder={t('dashboard.endDate')} />
          </div>
        </div>

        {!formData.start_date && !formData.end_date && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('dashboard.dayCount')}
            </label>
            <input type="number" min={1} max={365} value={formData.day_count}
              onChange={e => {
                const raw = e.target.value
                if (raw === '') { update('day_count', ''); return }
                const n = Math.floor(Number(raw))
                if (Number.isFinite(n)) update('day_count', Math.min(365, Math.max(1, n)))
              }}
              className={inputCls} />
            <p className="text-xs text-slate-400 mt-1.5">{t('dashboard.dayCountHint')}</p>
          </div>
        )}

        {/* Reminder — only visible to owner (or when creating) */}
        {(!isEditing || trip?.user_id === currentUser?.id || currentUser?.role === 'admin') && (
        <div className={!tripRemindersEnabled ? 'opacity-50' : ''}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Bell className="inline w-4 h-4 mr-1" />{t('trips.reminder')}
          </label>
          {!tripRemindersEnabled ? (
            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
              {t('trips.reminderDisabledHint')}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 0, label: t('trips.reminderNone') },
                  { value: 1, label: `1 ${t('trips.reminderDay')}` },
                  { value: 3, label: `3 ${t('trips.reminderDays')}` },
                  { value: 9, label: `9 ${t('trips.reminderDays')}` },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => { update('reminder_days', opt.value); setCustomReminder(false) }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      !customReminder && formData.reminder_days === opt.value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
                <button type="button"
                  onClick={() => { setCustomReminder(true); if ([0, 1, 3, 9].includes(formData.reminder_days)) update('reminder_days', 7) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    customReminder
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}>
                  {t('trips.reminderCustom')}
                </button>
              </div>
              {customReminder && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" min={1} max={30}
                    value={formData.reminder_days}
                    onChange={e => update('reminder_days', Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                    className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300" />
                  <span className="text-xs text-slate-500">{t('trips.reminderDaysBefore')}</span>
                </div>
              )}
            </>
          )}
        </div>
        )}

        {/* Members */}
        {allUsers.filter(u => u.id !== currentUser?.id).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <UserPlus className="inline w-4 h-4 mr-1" />{isEditing ? t('dashboard.addMembers') : t('dashboard.addMembers')}
            </label>
            {/* Existing members (editing mode) */}
            {isEditing && existingMembers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {existingMembers.map(m => (
                  <span key={m.id}
                    className="bg-surface-secondary text-content border border-edge"
                    onClick={async () => {
                      if (m.id === currentUser?.id) return
                      try {
                        await tripsApi.removeMember(trip!.id, m.id)
                        setExistingMembers(prev => prev.filter(x => x.id !== m.id))
                        toast.success(t('trips.memberRemoved', { username: m.username }))
                      } catch { toast.error(t('trips.memberRemoveError')) }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99,
                      fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500,
                      cursor: m.id === currentUser?.id ? 'default' : 'pointer',
                    }}>
                    {m.username}
                    {m.id !== currentUser?.id && <X size={11} className="text-content-faint" />}
                  </span>
                ))}
              </div>
            )}
            {/* Newly selected members (both modes) */}
            {selectedMembers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {selectedMembers.map(uid => {
                  const user = allUsers.find(u => u.id === uid)
                  if (!user) return null
                  return (
                    <span key={uid} onClick={() => setSelectedMembers(prev => prev.filter(id => id !== uid))}
                      className="bg-surface-secondary text-content border border-edge cursor-pointer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99,
                        fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500,
                      }}>
                      {user.username}
                      <X size={11} className="text-content-faint" />
                    </span>
                  )
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <CustomSelect
                value={memberSelectValue}
                onChange={async value => {
                  if (!value) return
                  if (isEditing && trip?.id) {
                    const user = allUsers.find(u => u.id === Number(value))
                    if (user) {
                      try {
                        await tripsApi.addMember(trip.id, user.username)
                        setExistingMembers(prev => [...prev, { id: user.id, username: user.username }])
                        toast.success(t('trips.memberAdded', { username: user.username }))
                      } catch { toast.error(t('trips.memberAddError')) }
                    }
                  } else {
                    setSelectedMembers(prev => prev.includes(Number(value)) ? prev : [...prev, Number(value)])
                  }
                  setMemberSelectValue('')
                }}
                placeholder={t('dashboard.addMember')}
                options={allUsers.filter(u => u.id !== currentUser?.id && !selectedMembers.includes(u.id) && !existingMembers.some(m => m.id === u.id)).map(u => ({ value: u.id, label: u.username }))}
                searchable
                size="sm"
              />
            </div>
          </div>
        )}

      </form>
    </Modal>
  )
}
