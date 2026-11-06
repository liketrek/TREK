import { useRef, useState, type ReactNode } from 'react'
import { Image, Plus, Trash2, UserPlus, UserMinus, Unlink, Settings2, Link as LinkIcon, List, Grid3x3, MapPin, Route, Archive, ArchiveRestore, Undo2, Link2, ListChecks, RefreshCw } from 'lucide-react'
import MLinkField from '../../components/MLinkField'
import MSheet from '../../components/MSheet'
import {
  Eyebrow,
  SHEET_FIELD,
  SHEET_PILL,
  SHEET_PRIMARY,
  SHEET_ROUND,
  SHEET_SECONDARY,
  SheetSection,
  TileHeader,
} from '../trip/sheets/MTripSheetUi'
import MToggle from '../../components/MToggle'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import { useTranslation } from '../../../i18n'
import type { JourneyDetail, JourneyTripAccess } from '../../../store/journeyStore'
import { useJourneySettings, useJourneyTripLinking } from '../../../components/Journey/useJourneySettings'
import {
  SHARE_MAP_EXTRAS, useJourneyShareLink, type JourneyShareLink, type JourneyShareMapExtra,
} from '../../../components/Journey/useJourneyShareLink'
import type { JourneyRecordingPrepState } from '../../../components/Journey/useJourneyRecordingPrep'
import { pickGradient } from '../../../pages/journeyDetail/JourneyDetailPage.helpers'
import { journeyCoverSrc } from './mobileJourneyMeta'

interface MJourneySettingsSheetProps {
  journey: JourneyDetail
  onClose: () => void
  onSaved: () => void
  onOpenInvite: () => void
  onRefresh: () => void
  /** Bring back every suggestion waved away card by card. Absent for a viewer. */
  onRestoreSuggestions?: () => Promise<void> | void
  /** Preparing the recorded days (JRN-03); absent without the Dawarich addon. */
  recordingPrep?: JourneyRecordingPrepState
}

/**
 * shJSettings — cover, name/subtitle, synced trips, contributors, public link
 * with per-section toggles (timeline / gallery / map), archive and delete.
 */
export default function MJourneySettingsSheet({
  journey, onClose, onSaved, onOpenInvite, onRefresh, onRestoreSuggestions, recordingPrep,
}: MJourneySettingsSheetProps) {
  const { t } = useTranslation()
  const {
    title, setTitle, subtitle, setSubtitle, saving, archiving, unlinkTarget, setUnlinkTarget, showDeleteConfirm,
    setShowDeleteConfirm, savingTracks, savingField, handleSave, handleCoverUpload, handleArchiveToggle,
    handleTracksToggle, handleFieldToggle, handleDelete, handleRemoveContributor, confirmUnlink,
  } = useJourneySettings({ journey, onSaved, onRefresh, onContentChanged: onRefresh })
  const [addTripOpen, setAddTripOpen] = useState(false)
  const { availableTrips, linkingTripId, loadAvailableTrips, linkTrip } = useJourneyTripLinking({
    journeyId: journey.id,
    onLinked: () => { setAddTripOpen(false); onRefresh() },
  })
  const {
    link: shareLink, copied, shareUrl, createLink: createShareLink, togglePerm: toggleSharePerm,
    deleteLink: deleteShareLink, copyLink: copyShareUrl,
  } = useJourneyShareLink(journey.id)
  const coverRef = useRef<HTMLInputElement>(null)

  const coverSrc = journeyCoverSrc(journey.cover_image)

  const openAddTrip = async () => {
    setAddTripOpen(v => !v)
    if (availableTrips.length === 0) await loadAvailableTrips()
  }


  const linkedTripIds = journey.trips.map(tr => tr.trip_id)
  const unlinkedTrips = availableTrips.filter(tr => !linkedTripIds.includes(tr.id))

  return (
    <MSheet open onClose={onClose} variant="card" material="glass" ariaLabel={t('journey.settings.title')}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<Settings2 size={19} strokeWidth={1.8} />}
          title={t('journey.settings.title')}
          sub={journey.title}
          onClose={onClose}
          closeLabel={t('common.close')}
        />
      </div>

      <div className="m-scroll-fade mt-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-[18px] pb-[18px] pt-[14px]">
        <SheetSection title={t('journey.settings.coverImage')}>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          <div className="relative h-[120px] overflow-hidden rounded-[14px]">
            {coverSrc ? (
              <img src={coverSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: pickGradient(journey.id) }} />
            )}
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center gap-[6px] bg-black/30 text-caption font-bold text-white"
            >
              <Image size={14} strokeWidth={2.2} />
              {coverSrc ? t('journey.settings.changeCover') : t('journey.settings.addCover')}
            </button>
          </div>
        </SheetSection>

        <SheetSection title={t('journey.settings.name')}>
          <input value={title} onChange={e => setTitle(e.target.value)} aria-label={t('journey.settings.name')} className={`${SHEET_FIELD} w-full flex-none font-semibold`} />
          <Eyebrow className="mt-1 uppercase">{t('journey.settings.subtitle')}</Eyebrow>
          <input
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            placeholder={t('journey.settings.subtitlePlaceholder')}
            aria-label={t('journey.settings.subtitle')}
            className={`${SHEET_FIELD} w-full flex-none`}
          />
        </SheetSection>

        {/* Trip GPX tracks on the journey map (#2194) */}
        <SheetSection title={t('journey.settings.tracks')}>
          <ToggleRow
            icon={<Route size={16} strokeWidth={2} />}
            label={t('journey.settings.showTripTracks')}
            hint={t('journey.settings.showTripTracksHint')}
            checked={!!journey.show_trip_tracks}
            onChange={handleTracksToggle}
            disabled={savingTracks}
          />
        </SheetSection>

        {recordingPrep && (
          <SheetSection title={t('journey.settings.recordings')}>
            <MRecordingPrepRow prep={recordingPrep} enabled={!!journey.auto_prepare_recordings} />
          </SheetSection>
        )}

        {/* The three fields a journey may put away (discussion #2299) */}
        <SheetSection title={t('journey.settings.entryFields')} hint={t('journey.settings.entryFieldsHint')}>
          {([
            ['show_verdict', t('journey.settings.showVerdict')],
            ['show_mood', t('journey.settings.showMood')],
            ['show_weather', t('journey.settings.showWeather')],
          ] as const).map(([field, label]) => (
            <ToggleRow
              key={field}
              label={label}
              checked={journey[field] !== 0}
              onChange={next => handleFieldToggle(field, next)}
              disabled={savingField !== null}
            />
          ))}
          {/* Only when there is something to bring back */}
          {onRestoreSuggestions && (journey.dismissed_count ?? 0) > 0 && (
            <button type="button" onClick={() => { void onRestoreSuggestions() }} className={SHEET_SECONDARY}>
              <Undo2 size={14} strokeWidth={2.2} />
              {t('journey.suggestions.restore')}
              <span className="text-m-muted">{journey.dismissed_count ?? 0}</span>
            </button>
          )}
        </SheetSection>

        <SheetSection title={t('journey.detail.syncedTrips')} count={journey.trips.length || undefined}>
          {journey.trips.map(trip => (
            <div key={trip.trip_id} className="flex items-center gap-2.5">
              <span className="h-[42px] w-[42px] flex-none rounded-[13px]" style={{ background: pickGradient(trip.trip_id) }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-body font-semibold text-m-ink">{trip.title}</div>
                <div className="font-geist text-caption text-m-muted">
                  {t('mobileJourney.placesCount', { count: trip.place_count ?? 0 })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnlinkTarget({ trip_id: trip.trip_id, title: trip.title })}
                aria-label={t('journey.trips.unlinkTrip')}
                className={SHEET_ROUND}
              >
                <Unlink size={15} strokeWidth={2} />
              </button>
            </div>
          ))}
          {journey.trips.length === 0 && (
            <p className="font-geist text-caption text-m-faint">{t('journey.trips.noTripsLinkedSettings')}</p>
          )}
          <button type="button" onClick={openAddTrip} className={SHEET_SECONDARY}>
            <Plus size={14} strokeWidth={2.2} />
            {t('journey.trips.addTrip')}
          </button>
          {addTripOpen && (
            <div className="max-h-[200px] overflow-y-auto rounded-[14px] bg-[color:var(--m-ic)] p-1.5">
              {unlinkedTrips.length === 0 && (
                <p className="py-2 text-center font-geist text-caption text-m-faint">{t('journey.trips.noTripsAvailable')}</p>
              )}
              {unlinkedTrips.map(trip => (
                <div key={trip.id} className="flex items-center gap-2.5 rounded-[12px] px-1.5 py-1.5">
                  <span className="h-8 w-8 flex-none rounded-[10px]" style={{ background: pickGradient(trip.id) }} />
                  <span className="min-w-0 flex-1 truncate text-body font-semibold">{trip.title}</span>
                  <button
                    type="button"
                    onClick={() => linkTrip(trip.id)}
                    disabled={linkingTripId === trip.id}
                    className="flex h-8 flex-none items-center rounded-full bg-m-act px-3 text-caption font-semibold text-m-actfg disabled:opacity-40"
                  >
                    {t('journey.trips.link')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </SheetSection>

        <SheetSection title={t('journey.detail.contributors')} count={journey.contributors.length || undefined}>
          {journey.contributors.map(c => (
            <div key={c.user_id} className="flex items-center gap-2.5">
              <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-m-act text-body font-extrabold text-m-actfg">
                {(c.username || '?')[0].toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-body font-semibold text-m-ink">{c.username}</span>
              <span className={`${SHEET_PILL} ${c.role === 'owner' ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'}`}>
                {c.role}
              </span>
              {c.role !== 'owner' && (
                <button
                  type="button"
                  onClick={() => handleRemoveContributor(c)}
                  aria-label={t('journey.contributors.remove')}
                  className={SHEET_ROUND}
                >
                  <UserMinus size={15} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={onOpenInvite} className={SHEET_SECONDARY}>
            <UserPlus size={14} strokeWidth={2.2} />
            {t('journey.contributors.invite')}
          </button>
        </SheetSection>

        <MTripAccessList access={journey.trip_access} />

        <SheetSection title={t('journey.share.publicShare')}>
          {!shareLink ? (
            <button type="button" onClick={createShareLink} className={`${SHEET_PRIMARY} justify-center`}>
              <LinkIcon size={14} strokeWidth={2.2} />
              {t('journey.share.createLink')}
            </button>
          ) : (
            <>
              {shareUrl && (
                <MLinkField
                  url={shareUrl}
                  copied={copied}
                  onCopy={copyShareUrl}
                  copyLabel={t('journey.share.copy')}
                  copiedLabel={t('journey.share.copied')}
                  shareLabel={t('common.share')}
                />
              )}
              {([
                { key: 'share_timeline' as const, label: t('journey.share.timeline'), icon: List },
                { key: 'share_gallery' as const, label: t('journey.share.gallery'), icon: Grid3x3 },
                { key: 'share_map' as const, label: t('journey.share.map'), icon: MapPin },
              ]).map(({ key, label, icon: Icon }) => (
                <ToggleRow
                  key={key}
                  icon={<Icon size={16} strokeWidth={2} />}
                  label={label}
                  checked={shareLink[key]}
                  onChange={() => toggleSharePerm(key)}
                />
              ))}
              <MShareMapExtras link={shareLink} onToggle={toggleSharePerm} />
              <button
                type="button"
                onClick={deleteShareLink}
                className="flex h-[38px] w-full items-center justify-center gap-1.5 rounded-full text-[length:calc(12px*var(--fs-scale-body,1))] font-semibold text-[color:var(--m-st-danger)]"
              >
                <Trash2 size={13} strokeWidth={2.2} /> {t('journey.share.removeLink')}
              </button>
            </>
          )}
        </SheetSection>

        <button type="button" onClick={handleArchiveToggle} disabled={archiving} className={`${SHEET_SECONDARY} flex-none`}>
          {journey.status === 'archived' ? <ArchiveRestore size={14} strokeWidth={2.2} /> : <Archive size={14} strokeWidth={2.2} />}
          {journey.status === 'archived' ? t('journey.settings.reopenJourney') : t('journey.settings.endJourney')}
        </button>
      </div>

      <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          aria-label={t('journey.settings.delete')}
          className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[color:var(--m-st-danger)]"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
        <button type="button" onClick={onClose} className={`${SHEET_SECONDARY} ms-auto px-4`}>
          {t('common.cancel')}
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !title.trim()} className={SHEET_PRIMARY}>
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>

      <ConfirmDialog
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={confirmUnlink}
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

/** Who a trip's linked journal lets in (#2683): shown under the contributors, but changed in that trip. */
function MTripAccessList({ access }: { access: JourneyTripAccess[] | undefined }) {
  const { t } = useTranslation()
  if (!access?.length) return null
  return (
    <SheetSection title={t('journey.contributors.viaTrips')} hint={t('journey.contributors.viaTripsHint')} count={access.length}>
      {access.map(a => (
        <div key={`${a.user_id}-${a.trip_id}`} className="flex items-center gap-2.5">
          <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted">
            <Link2 size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-semibold text-m-ink">{a.username}</span>
            <span className="block truncate font-geist text-caption text-m-faint">{t('journey.contributors.viaTrip', { trip: a.trip_title })}</span>
          </span>
          <span className={`${SHEET_PILL} bg-[color:var(--m-ic)] text-m-muted`}>{a.role}</span>
        </div>
      ))}
    </SheetSection>
  )
}

/** A switch with its label, an optional icon in front and an optional line under the label. */
function ToggleRow({ icon, label, hint, checked, onChange, disabled }: {
  icon?: ReactNode
  label: string
  hint?: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-[11px] rounded-[14px] bg-[color:var(--m-ic)] px-3 py-[10px]">
      {icon && <span className="flex-none text-m-muted">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="text-body font-semibold text-m-ink">{label}</div>
        {hint && <div className="font-geist text-caption text-m-muted">{hint}</div>}
      </div>
      <MToggle checked={checked} onChange={onChange} disabled={disabled} ariaLabel={label} />
    </div>
  )
}

/** Preparing the recorded days (JRN-03): the owner's switch, the caller's own status and a fetch by hand. */
function MRecordingPrepRow({ prep, enabled }: { prep: JourneyRecordingPrepState; enabled: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-[14px] bg-[color:var(--m-ic)] px-3 py-[10px]">
      <div className="flex items-center gap-[11px]">
        <ListChecks size={16} strokeWidth={2} className="flex-none text-m-muted" />
        <div className="min-w-0 flex-1">
          <div className="text-body font-bold">{t('journey.settings.autoPrepare')}</div>
          <div className="font-geist text-caption text-m-muted">{t('journey.settings.autoPrepareHint')}</div>
        </div>
        <MToggle
          checked={enabled}
          onChange={next => { void prep.setEnabled(next) }}
          disabled={prep.saving}
          ariaLabel={t('journey.settings.autoPrepare')}
        />
      </div>
      {prep.statusLine && (
        <div className="mt-2 flex items-center gap-2 border-t border-[color:var(--m-rowbr)] pt-2">
          <div className={`min-w-0 flex-1 font-geist text-caption leading-[1.45] ${prep.statusLine.tone === 'warning' ? 'text-warning' : 'text-m-muted'}`}>
            {prep.statusLine.text}
          </div>
          {prep.canFetch && (
            <button
              type="button"
              onClick={() => { void prep.fetchNow() }}
              disabled={prep.fetching}
              aria-label={t('journey.prep.fetchNow')}
              className="grid h-8 w-8 flex-none place-items-center rounded-full bg-m-card text-m-muted disabled:opacity-50"
            >
              <RefreshCw size={14} strokeWidth={2.2} className={prep.fetching ? 'animate-spin' : undefined} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** What the shared map shows besides the entries (JRN-04), only while the map is shared. */
function MShareMapExtras({ link, onToggle }: { link: JourneyShareLink; onToggle: (key: JourneyShareMapExtra) => unknown }) {
  const { t } = useTranslation()
  return (
    // Hangs under the map row: a line from below its pin, smaller labels.
    <div className="mb-1 ms-[9px] border-s-2 border-[color:var(--m-rowbr)] ps-[16px]">
      {SHARE_MAP_EXTRAS.map(({ key, labelKey, hintKey }) => (
        <div key={key} className={`flex items-center gap-[11px] py-[7px] pe-[2px] ${link.share_map ? '' : 'opacity-50'}`}>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold">{t(labelKey)}</span>
            <span className="font-geist text-caption text-m-muted">
              {link.share_map ? t(hintKey) : t('journey.share.needsMap')}
            </span>
          </span>
          <MToggle
            checked={!!link.share_map && !!link[key]}
            onChange={() => { void onToggle(key) }}
            ariaLabel={t(labelKey)}
            disabled={!link.share_map}
          />
        </div>
      ))}
    </div>
  )
}
