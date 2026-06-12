import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ImagePlus, Plus, Trash2, UserPlus, Archive, ArchiveRestore } from 'lucide-react'
import { useJourneyStore } from '../../store/journeyStore'
import { useTranslation } from '../../i18n'
import { journeyApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import ConfirmDialog from '../shared/ConfirmDialog'
import JourneyShareSection from './JourneyShareSection'
import type { JourneyDetail } from '../../store/journeyStore'
import { pickGradient } from '../../pages/journeyDetail/JourneyDetailPage.helpers'
import { AddTripDialog } from './JourneyDetailPageAddTripDialog'
import { normalizeImageFile } from '../../utils/convertHeic'

export function JourneySettingsDialog({ journey, onClose, onSaved, onOpenInvite, onRefresh }: {
  journey: JourneyDetail
  onClose: () => void
  onSaved: () => void
  onOpenInvite: () => void
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(journey.title)
  const [subtitle, setSubtitle] = useState(journey.subtitle || '')
  const [saving, setSaving] = useState(false)
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [unlinkTarget, setUnlinkTarget] = useState<{ trip_id: number; title: string } | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const isDirty = title !== journey.title || subtitle !== (journey.subtitle || '')
  const handleClose = () => { if (isDirty) setShowDiscardConfirm(true); else onClose() }
  const coverRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const navigate = useNavigate()
  const { updateJourney, deleteJourney } = useJourneyStore()

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateJourney(journey.id, { title, subtitle: subtitle || null })
      onSaved()
    } catch {
      toast.error(t('journey.settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('cover', await normalizeImageFile(file))
    try {
      await journeyApi.uploadCover(journey.id, formData)
      toast.success(t('journey.settings.coverUpdated'))
      onSaved()
    } catch {
      toast.error(t('journey.settings.coverFailed'))
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const handleArchiveToggle = async () => {
    setArchiving(true)
    try {
      const newStatus = journey.status === 'archived' ? 'active' : 'archived'
      await updateJourney(journey.id, { status: newStatus })
      toast.success(newStatus === 'archived' ? t('journey.settings.archived') : t('journey.settings.reopened'))
      onSaved()
    } catch {
      toast.error(t('journey.settings.saveFailed'))
    } finally {
      setArchiving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteJourney(journey.id)
      navigate('/journey')
    } catch {
      toast.error(t('journey.settings.failedToDelete'))
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-5 overscroll-none bg-[rgba(9,9,11,0.75)]" onClick={handleClose} onTouchMove={e => { if (e.target === e.currentTarget) e.preventDefault() }}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] max-w-[480px] w-full max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white">{t('journey.settings.title')}</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 flex flex-col gap-5">
          {/* Cover Image */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-2">{t('journey.settings.coverImage')}</label>
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            <button
              onClick={() => coverRef.current?.click()}
              className="w-full h-28 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-[12px] text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 overflow-hidden relative"
            >
              {journey.cover_image ? (
                <>
                  <img src={`/uploads/${journey.cover_image}`} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
                  <span className="relative z-10 flex items-center gap-1.5"><ImagePlus size={14} /> {t('journey.settings.changeCover')}</span>
                </>
              ) : (
                <span className="flex items-center gap-1.5"><ImagePlus size={14} /> {t('journey.settings.addCover')}</span>
              )}
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-1.5">{t('journey.settings.name')}</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[14px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-zinc-400"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-1.5">{t('journey.settings.subtitle')}</label>
            <input
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder={t('journey.settings.subtitlePlaceholder')}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[14px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-zinc-400"
            />
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-700" />

          {/* Synced Trips */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-2">{t('journey.detail.syncedTrips')}</label>
            <div className="flex flex-col gap-1.5">
              {journey.trips.map((trip: any) => (
                <div key={trip.trip_id} className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                  <div className="w-8 h-8 rounded-md flex-shrink-0" style={{ background: pickGradient(trip.trip_id) }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-zinc-900 dark:text-white">{trip.title}</div>
                    <div className="text-[10px] text-zinc-500">{trip.place_count || 0} {t('journey.synced.places')}</div>
                  </div>
                  <button
                    onClick={() => setUnlinkTarget({ trip_id: trip.trip_id, title: trip.title })}
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 dark:bg-red-500/15 dark:hover:bg-red-500/25 transition-colors"
                    title="Unlink trip"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {journey.trips.length === 0 && <p className="text-[11px] text-zinc-400">{t('journey.trips.noTripsLinkedSettings')}</p>}
              <button
                onClick={() => setShowAddTrip(true)}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 text-[12px] font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300 transition-colors"
              >
                <Plus size={14} /> {t('journey.trips.addTrip')}
              </button>
            </div>
          </div>

          {/* Contributors */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-2">{t('journey.detail.contributors')}</label>
            <div className="flex flex-col gap-2">
              {journey.contributors.map((c: any) => (
                <div key={c.user_id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-[11px] font-semibold">
                    {(c.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-[12px] font-medium text-zinc-900 dark:text-white">{c.username}</div>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${c.role === 'owner' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{c.role}</span>
                  {c.role !== 'owner' && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(t('journey.contributors.removeConfirm', { username: c.username }))) return
                        try {
                          await journeyApi.removeContributor(journey.id, c.user_id)
                          toast.success(t('journey.contributors.removed'))
                          onRefresh()
                        } catch {
                          toast.error(t('journey.contributors.removeFailed'))
                        }
                      }}
                      aria-label={t('journey.contributors.remove')}
                      title={t('journey.contributors.remove')}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={onOpenInvite}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 text-[12px] font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300 transition-colors"
              >
                <UserPlus size={14} /> {t('journey.contributors.invite')}
              </button>
            </div>
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-700" />

          {/* Public Share */}
          <JourneyShareSection journeyId={journey.id} />

        </div>

        {/* Footer */}
        <div className="flex items-center gap-1.5 px-4 md:px-6 py-4 pb-6 md:pb-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={t('journey.settings.delete')}
            title={t('journey.settings.delete')}
            className="flex items-center justify-center gap-1.5 h-9 min-w-9 px-2 md:px-2.5 text-[12px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <Trash2 size={14} />
            <span className="hidden md:inline">{t('journey.settings.delete')}</span>
          </button>
          <button
            onClick={handleArchiveToggle}
            disabled={archiving}
            aria-label={journey.status === 'archived' ? t('journey.settings.reopenJourney') : t('journey.settings.endJourney')}
            title={t('journey.settings.endDescription')}
            className="flex items-center justify-center gap-1.5 h-9 min-w-9 px-2 md:px-2.5 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg mr-auto disabled:opacity-40"
          >
            {journey.status === 'archived' ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            <span className="hidden md:inline">{journey.status === 'archived' ? t('journey.settings.reopenJourney') : t('journey.settings.endJourney')}</span>
          </button>
          <button onClick={handleClose} className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-600 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700">{t('common.cancel')}</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="h-9 px-3.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[13px] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40">
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Unlink Trip confirm */}
      <ConfirmDialog
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={async () => {
          if (!unlinkTarget) return
          try {
            await journeyApi.removeTrip(journey.id, unlinkTarget.trip_id)
            toast.success(t('journey.trips.tripUnlinked'))
            setUnlinkTarget(null)
            onSaved()
          } catch {
            toast.error(t('journey.trips.unlinkFailed'))
          }
        }}
        title={t('journey.trips.unlinkTrip')}
        message={t('journey.trips.unlinkMessage', { title: unlinkTarget?.title })}
        confirmLabel={t('journey.trips.unlink')}
        danger
      />

      {/* Add Trip */}
      {showAddTrip && (
        <AddTripDialog
          journeyId={journey.id}
          existingTripIds={journey.trips.map((t: any) => t.trip_id)}
          onClose={() => setShowAddTrip(false)}
          onAdded={() => { setShowAddTrip(false); onSaved() }}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('journey.settings.deleteJourney')}
        message={t('journey.settings.deleteMessage', { title: journey.title })}
        confirmLabel={t('common.delete')}
        danger
      />

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => { setShowDiscardConfirm(false); onClose() }}
        title={t('common.discardChanges')}
        message={t('journey.editor.discardChangesConfirm')}
        confirmLabel={t('common.discard')}
        danger
      />
    </div>
  )
}
