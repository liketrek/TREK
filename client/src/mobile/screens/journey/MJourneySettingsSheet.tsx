import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Image, Plus, Trash2, UserPlus, Link as LinkIcon,
  List, Grid3x3, MapPin, Archive, ArchiveRestore,
} from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import MToggle from '../../components/MToggle'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { journeyApi } from '../../../api/client'
import { useJourneyStore } from '../../../store/journeyStore'
import type { JourneyDetail } from '../../../store/journeyStore'
import { normalizeImageFile } from '../../../utils/convertHeic'
import { pickGradient } from '../../../pages/journeyDetail/JourneyDetailPage.helpers'
import { journeyCoverSrc } from './mobileJourneyMeta'

interface ShareLink {
  token: string
  share_timeline: boolean
  share_gallery: boolean
  share_map: boolean
}

interface AvailableTrip {
  id: number
  title: string
  destination?: string
  start_date?: string
}

interface MJourneySettingsSheetProps {
  journey: JourneyDetail
  onClose: () => void
  onSaved: () => void
  onOpenInvite: () => void
  onRefresh: () => void
}

/**
 * shJSettings — cover, name/subtitle, synced trips, contributors, public link
 * with per-section toggles (timeline / gallery / map), archive and delete.
 */
export default function MJourneySettingsSheet({
  journey, onClose, onSaved, onOpenInvite, onRefresh,
}: MJourneySettingsSheetProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const { updateJourney, deleteJourney } = useJourneyStore()

  const [title, setTitle] = useState(journey.title)
  const [subtitle, setSubtitle] = useState(journey.subtitle || '')
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [unlinkTarget, setUnlinkTarget] = useState<{ trip_id: number; title: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [addTripOpen, setAddTripOpen] = useState(false)
  const [availableTrips, setAvailableTrips] = useState<AvailableTrip[]>([])
  const [linkingTripId, setLinkingTripId] = useState<number | null>(null)
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [copied, setCopied] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    journeyApi.getShareLink(journey.id).then(d => setShareLink(d.link || null)).catch(() => {})
  }, [journey.id])

  const coverSrc = journeyCoverSrc(journey.cover_image)
  const shareUrl = shareLink ? `${window.location.origin}/public/journey/${shareLink.token}` : ''

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
      onRefresh()
    } catch {
      toast.error(t('journey.settings.coverFailed'))
    }
  }

  const openAddTrip = async () => {
    setAddTripOpen(v => !v)
    if (availableTrips.length === 0) {
      try {
        const data = await journeyApi.availableTrips()
        setAvailableTrips(data.trips || [])
      } catch { /* row stays empty */ }
    }
  }

  const linkTrip = async (tripId: number) => {
    setLinkingTripId(tripId)
    try {
      await journeyApi.addTrip(journey.id, tripId)
      toast.success(t('journey.trips.tripLinked'))
      setAddTripOpen(false)
      onRefresh()
    } catch {
      toast.error(t('journey.trips.linkFailed'))
    } finally {
      setLinkingTripId(null)
    }
  }

  const createShareLink = async () => {
    try {
      const res = await journeyApi.createShareLink(journey.id, { share_timeline: true, share_gallery: true, share_map: true })
      setShareLink({ token: res.token, share_timeline: true, share_gallery: true, share_map: true })
      toast.success(t('journey.share.linkCreated'))
    } catch {
      toast.error(t('journey.share.createFailed'))
    }
  }

  const toggleSharePerm = async (key: 'share_timeline' | 'share_gallery' | 'share_map') => {
    if (!shareLink) return
    const updated = { ...shareLink, [key]: !shareLink[key] }
    setShareLink(updated)
    try {
      await journeyApi.createShareLink(journey.id, {
        share_timeline: updated.share_timeline,
        share_gallery: updated.share_gallery,
        share_map: updated.share_map,
      })
    } catch {
      setShareLink(shareLink)
      toast.error(t('journey.share.updateFailed'))
    }
  }

  const deleteShareLink = async () => {
    try {
      await journeyApi.deleteShareLink(journey.id)
      setShareLink(null)
      toast.success(t('journey.share.linkDeleted'))
    } catch {
      toast.error(t('journey.share.deleteFailed'))
    }
  }

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

  const eyebrow = 'font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint'
  const inputShell = 'w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[13px] py-[11px] text-m-ink outline-none placeholder:text-m-faint'
  const dashedBtn = 'flex w-full items-center justify-center gap-[6px] rounded-xl border border-dashed border-[color:var(--m-rowbr)] p-[11px] text-[0.75rem] font-semibold text-m-muted'
  const solidBtn = 'flex w-full items-center justify-center gap-[6px] rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[11px] text-[0.75rem] font-semibold'

  const linkedTripIds = journey.trips.map(tr => tr.trip_id)
  const unlinkedTrips = availableTrips.filter(tr => !linkedTripIds.includes(tr.id))

  return (
    <MSheet open onClose={onClose} variant="card" material="opaque" ariaLabel={t('journey.settings.title')}>
      <div className="flex flex-none items-center border-b border-[color:var(--m-rowbr)] px-[18px] pb-[10px] pt-4">
        <span className="flex-1 text-[1.0625rem] font-bold">{t('journey.settings.title')}</span>
        <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={t('common.cancel')}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-3">
        {/* Cover */}
        <div className={`${eyebrow} mb-[6px]`}>{t('journey.settings.coverImage')}</div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        <div className="relative h-[120px] overflow-hidden rounded-2xl">
          {coverSrc ? (
            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: pickGradient(journey.id) }} />
          )}
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center gap-[6px] bg-black/30 text-[0.78125rem] font-bold text-white"
          >
            <Image size={14} strokeWidth={2.2} />
            {coverSrc ? t('journey.settings.changeCover') : t('journey.settings.addCover')}
          </button>
        </div>

        {/* Name + subtitle */}
        <div className={`${eyebrow} mb-[5px] mt-[14px]`}>{t('journey.settings.name')}</div>
        <input value={title} onChange={e => setTitle(e.target.value)} className={`${inputShell} text-[0.84375rem] font-semibold`} />
        <div className={`${eyebrow} mb-[5px] mt-3`}>{t('journey.settings.subtitle')}</div>
        <input
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          placeholder={t('journey.settings.subtitlePlaceholder')}
          className={`${inputShell} text-[0.8125rem] font-medium`}
        />

        {/* Synced trips */}
        <div className={`${eyebrow} mb-[6px] mt-[14px]`}>{t('journey.detail.syncedTrips')}</div>
        {journey.trips.map(trip => (
          <div key={trip.trip_id} className="mb-[6px] flex items-center gap-[11px] rounded-[14px] bg-[color:var(--m-ic)] px-3 py-[10px]">
            <span className="h-9 w-9 flex-none rounded-[10px]" style={{ background: pickGradient(trip.trip_id) }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.8125rem] font-bold">{trip.title}</div>
              <div className="font-geist text-[0.625rem] text-m-muted">
                {t('mobileJourney.placesCount', { count: trip.place_count ?? 0 })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUnlinkTarget({ trip_id: trip.trip_id, title: trip.title })}
              aria-label={t('journey.trips.unlinkTrip')}
              className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[rgba(214,39,59,.1)] text-[color:var(--m-st-danger)]"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
        {journey.trips.length === 0 && (
          <p className="mb-[6px] font-geist text-[0.6875rem] text-m-faint">{t('journey.trips.noTripsLinkedSettings')}</p>
        )}
        <button type="button" onClick={openAddTrip} className={`${dashedBtn} mt-2`}>
          <Plus size={13} strokeWidth={2.2} />
          {t('journey.trips.addTrip')}
        </button>
        {addTripOpen && (
          <div className="mt-2 max-h-[180px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-2">
            {unlinkedTrips.length === 0 && (
              <p className="py-2 text-center font-geist text-[0.6875rem] text-m-faint">{t('journey.trips.noTripsAvailable')}</p>
            )}
            {unlinkedTrips.map(trip => (
              <div key={trip.id} className="flex items-center gap-[10px] rounded-[10px] px-2 py-[7px]">
                <span className="h-7 w-7 flex-none rounded-lg" style={{ background: pickGradient(trip.id) }} />
                <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold">{trip.title}</span>
                <button
                  type="button"
                  onClick={() => linkTrip(trip.id)}
                  disabled={linkingTripId === trip.id}
                  className="rounded-full bg-m-act px-3 py-[5px] font-geist text-[0.65625rem] font-bold text-m-actfg disabled:opacity-50"
                >
                  {t('journey.trips.link')}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Contributors */}
        <div className={`${eyebrow} mb-[6px] mt-[14px]`}>{t('journey.detail.contributors')}</div>
        {journey.contributors.map(c => (
          <div key={c.user_id} className="flex items-center gap-[10px] px-[2px] py-1">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-m-act text-[0.75rem] font-extrabold text-m-actfg">
              {(c.username || '?')[0].toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-bold">{c.username}</span>
            <span
              className={`rounded-full px-[10px] py-[3px] font-geist text-[0.5625rem] font-extrabold ${
                c.role === 'owner' ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
              }`}
            >
              {c.role}
            </span>
            {c.role !== 'owner' && (
              <button
                type="button"
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
                className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-m-faint"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={onOpenInvite} className={`${solidBtn} mt-2`}>
          <UserPlus size={13} strokeWidth={2.2} />
          {t('journey.contributors.invite')}
        </button>

        {/* Public share */}
        <div className={`${eyebrow} mb-[6px] mt-[14px]`}>{t('journey.share.publicShare')}</div>
        {!shareLink ? (
          <button type="button" onClick={createShareLink} className={solidBtn}>
            <LinkIcon size={13} strokeWidth={2.2} />
            {t('journey.share.createLink')}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-[14px] bg-[color:var(--m-ic)] px-3 py-[10px]">
              <LinkIcon size={13} className="flex-none text-m-faint" />
              <span className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] text-m-muted">{shareUrl}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="flex-none rounded-full bg-m-act px-3 py-[5px] font-geist text-[0.65625rem] font-bold text-m-actfg"
              >
                {copied ? t('journey.share.copied') : t('journey.share.copy')}
              </button>
            </div>
            {([
              { key: 'share_timeline' as const, label: t('journey.share.timeline'), icon: List },
              { key: 'share_gallery' as const, label: t('journey.share.gallery'), icon: Grid3x3 },
              { key: 'share_map' as const, label: t('journey.share.map'), icon: MapPin },
            ]).map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center gap-[11px] px-[2px] py-[10px]">
                <Icon size={16} strokeWidth={2} className="flex-none text-m-muted" />
                <span className="min-w-0 flex-1 text-[0.84375rem] font-bold">{label}</span>
                <MToggle checked={shareLink[key]} onChange={() => toggleSharePerm(key)} ariaLabel={label} />
              </div>
            ))}
            <button
              type="button"
              onClick={deleteShareLink}
              className="mt-1 font-geist text-[0.6875rem] font-semibold text-[color:var(--m-st-danger)]"
            >
              {t('journey.share.removeLink')}
            </button>
          </>
        )}

        {/* Archive */}
        <button type="button" onClick={handleArchiveToggle} disabled={archiving} className={`${solidBtn} mt-[14px] disabled:opacity-40`}>
          {journey.status === 'archived' ? <ArchiveRestore size={13} strokeWidth={2.2} /> : <Archive size={13} strokeWidth={2.2} />}
          {journey.status === 'archived' ? t('journey.settings.reopenJourney') : t('journey.settings.endJourney')}
        </button>
      </div>

      <div className="flex flex-none items-center gap-3 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-[5px] text-[0.75rem] font-bold text-[color:var(--m-st-danger)]"
        >
          <Trash2 size={13} strokeWidth={2} />
          {t('journey.settings.delete')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="rounded-full bg-m-act px-[18px] py-[9px] text-[0.78125rem] font-semibold text-m-actfg disabled:opacity-40"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>

      <ConfirmDialog
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={async () => {
          if (!unlinkTarget) return
          try {
            await journeyApi.removeTrip(journey.id, unlinkTarget.trip_id)
            toast.success(t('journey.trips.tripUnlinked'))
            setUnlinkTarget(null)
            onRefresh()
          } catch {
            toast.error(t('journey.trips.unlinkFailed'))
          }
        }}
        title={t('journey.trips.unlinkTrip')}
        message={t('journey.trips.unlinkMessage', { title: unlinkTarget?.title })}
        confirmLabel={t('journey.trips.unlink')}
        danger
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('journey.settings.deleteJourney')}
        message={t('journey.settings.deleteMessage', { title: journey.title })}
        confirmLabel={t('common.delete')}
        danger
      />
    </MSheet>
  )
}
