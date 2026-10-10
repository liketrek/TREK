import { useId, useState, useRef, type ReactNode } from 'react'
import { X, ImagePlus, Trash2, Archive, ArchiveRestore, Undo2, Settings, Crown } from 'lucide-react'
import { useTranslation } from '../../i18n'
import ConfirmDialog from '../shared/ConfirmDialog'
import { Tooltip } from '../shared/Tooltip'
import { DeleteButton, DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, INPUT, Segmented } from '../shared/dialogParts'
import JourneyShareSection from './JourneyShareSection'
import { useJourneySettings } from './useJourneySettings'
import type { JourneyContributor, JourneyDetail } from '../../store/journeyStore'
import { pickGradient } from '../../pages/journeyDetail/JourneyDetailPage.helpers'
import { AddTripDialog } from './JourneyDetailPageAddTripDialog'
import ToggleSwitch from '../Settings/ToggleSwitch'
import { TripMemberAvatar } from '../Trips/TripMemberAvatar'
import { avatarSrc } from '../../utils/avatarSrc'

// The share dialogs' roster, so a journey's people read like a trip's.
const ROWS = 'flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5'
const ROW = 'flex min-h-[48px] items-center gap-3 rounded-[10px] px-2.5 py-1.5'
const BADGE = 'inline-flex flex-none items-center gap-1 rounded-full px-2 py-[2px] font-semibold'

/** A round icon button of a row, named by its tooltip; faint until the pointer is on it. */
function RowAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onClick} aria-label={label}
        className="grid h-8 w-8 flex-none place-items-center rounded-[9px] text-content-faint hover:bg-surface-card hover:text-danger">
        {children}
      </button>
    </Tooltip>
  )
}

export function JourneySettingsDialog({ journey, onClose, onSaved, onOpenInvite, onRefresh, onRestoreSuggestions }: {
  journey: JourneyDetail
  onClose: () => void
  onSaved: () => void
  onOpenInvite: () => void
  onRefresh: () => void
  /** Bring back every suggestion waved away card by card. Absent for a viewer. */
  onRestoreSuggestions?: () => Promise<void> | void
}) {
  const { t } = useTranslation()
  const labelId = useId()
  const {
    title, setTitle, subtitle, setSubtitle, saving, isDirty, archiving, unlinkTarget, setUnlinkTarget,
    showDeleteConfirm, setShowDeleteConfirm, savingTracks, savingField, savingPhotoLocation, savingStatus, statusChoice,
    handleSave, handleCoverUpload, handleArchiveToggle, handleTracksToggle, handleFieldToggle, handlePhotoLocationToggle,
    handleStatusChange, handleDelete, handleRemoveContributor, confirmUnlink,
  } = useJourneySettings({ journey, onSaved, onRefresh, onContentChanged: onSaved })
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const handleClose = () => { if (isDirty) setShowDiscardConfirm(true); else onClose() }
  const coverRef = useRef<HTMLInputElement>(null)

  const archived = journey.status === 'archived'
  const archiveLabel = archived ? t('journey.settings.reopenJourney') : t('journey.settings.endJourney')
  const roleLabel = (role: JourneyContributor['role']) => (role === 'owner' ? t('members.owner') : t(`journey.invite.${role}`))

  const header = (
    <DialogHeader
      tile={<DialogTile><Settings size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={labelId}
      onClose={handleClose}
      eyebrow={t('journey.settings.title')}
      titleInput={{
        value: title,
        onChange: setTitle,
        label: t('journey.settings.name'),
        placeholder: t('journey.frontpage.namePlaceholder'),
        onKeyDown: e => { if (e.key === 'Enter' && title.trim() && !saving) void handleSave() },
      }}
    />
  )

  const footer = (
    <DialogFooter>
      <DeleteButton label={t('journey.settings.delete')} onClick={() => setShowDeleteConfirm(true)} />
      <Tooltip label={t('journey.settings.endDescription')} placement="top">
        <DialogButton
          onClick={handleArchiveToggle}
          disabled={archiving}
          icon={archived ? <ArchiveRestore size={14} strokeWidth={2.2} /> : <Archive size={14} strokeWidth={2.2} />}
        >
          {archiveLabel}
        </DialogButton>
      </Tooltip>
      <FooterSpacer />
      <DialogButton onClick={handleClose}>{t('common.cancel')}</DialogButton>
      <DialogButton variant="primary" onClick={handleSave} disabled={saving || !title.trim()}>
        {saving ? t('common.saving') : t('common.save')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <>
      <DialogShell
        onClose={handleClose}
        labelledBy={labelId}
        width="wide"
        // The share section below grows once its link exists, so the upper edge stays put.
        align="top"
        // While a question or the link-trip dialog is up, Escape and the backdrop belong to it.
        blocked={showAddTrip || !!unlinkTarget || showDeleteConfirm || showDiscardConfirm}
        header={header}
        footer={footer}
      >
        <div className="grid grid-cols-2 items-start gap-6 max-md:grid-cols-1">
          <div className="flex flex-col gap-5">
            <DialogSection label={t('journey.settings.coverImage')}>
              <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-[14px] border border-edge-faint bg-surface-secondary transition-colors hover:border-content-faint"
              >
                {journey.cover_image && <img src={`/uploads/${journey.cover_image}`} className="absolute inset-0 h-full w-full object-cover" alt="" />}
                {/* A chip rather than bare text, so it reads the same on any photo. */}
                <span className="relative inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1.5 font-semibold text-content shadow-sm" style={fs(12.5, 'body')}>
                  <ImagePlus size={15} /> {journey.cover_image ? t('journey.settings.changeCover') : t('journey.settings.addCover')}
                </span>
              </button>
            </DialogSection>

            <EditorField label={t('journey.settings.subtitle')} htmlFor={`${labelId}-subtitle`}>
              <input
                id={`${labelId}-subtitle`}
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder={t('journey.settings.subtitlePlaceholder')}
                className={INPUT}
              />
            </EditorField>

            {/* The journey's state, by hand or from the trips (#762) */}
            <DialogSection label={t('journey.settings.status')}>
              <div className={savingStatus ? 'opacity-60' : undefined}>
                <Segmented<'auto' | 'draft' | 'live' | 'completed'>
                  label={t('journey.settings.status')}
                  value={statusChoice}
                  onChange={next => { void handleStatusChange(next) }}
                  fill
                  options={[
                    { value: 'auto', label: t('journey.settings.statusAuto') },
                    { value: 'draft', label: t('journey.status.draft') },
                    { value: 'live', label: t('journey.frontpage.live') },
                    { value: 'completed', label: t('journey.status.completed') },
                  ]}
                />
              </div>
              <p className="m-0 mt-2 leading-normal text-content-faint" style={fs(11.5)}>
                {t(statusChoice === 'auto' ? 'journey.settings.statusAutoHint' : 'journey.settings.statusManualHint')}
              </p>
            </DialogSection>

            {/* Trip GPX tracks on the journey map (#2194) */}
            <DialogSection label={t('journey.settings.tracks')}>
              <div className={ROWS}>
                <div className={`${ROW}${savingTracks ? ' opacity-60' : ''}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-content" style={fs(13, 'body')}>{t('journey.settings.showTripTracks')}</span>
                    <span className="block text-content-faint" style={fs(11.5)}>{t('journey.settings.showTripTracksHint')}</span>
                  </span>
                  <ToggleSwitch
                    on={!!journey.show_trip_tracks}
                    onToggle={() => { if (!savingTracks) void handleTracksToggle() }}
                    label={t('journey.settings.showTripTracks')}
                  />
                </div>
              </div>
            </DialogSection>

            {/* Places from photos (#1003): the GPS a picture carries puts its entry on the map */}
            <DialogSection label={t('journey.settings.photosSection')}>
              <div className={ROWS}>
                <div className={`${ROW}${savingPhotoLocation ? ' opacity-60' : ''}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-content" style={fs(13, 'body')}>{t('journey.settings.photoLocation')}</span>
                    <span className="block text-content-faint" style={fs(11.5)}>{t('journey.settings.photoLocationHint')}</span>
                  </span>
                  <ToggleSwitch
                    on={!!journey.photo_location}
                    onToggle={() => { if (!savingPhotoLocation) void handlePhotoLocationToggle() }}
                    label={t('journey.settings.photoLocation')}
                  />
                </div>
              </div>
            </DialogSection>

            {/* The three fields a journey may put away (discussion #2299) */}
            <DialogSection label={t('journey.settings.entryFields')}>
              <p className="m-0 mb-2.5 leading-normal text-content-faint" style={fs(11.5)}>{t('journey.settings.entryFieldsHint')}</p>
              <div className={ROWS}>
                {([
                  ['show_verdict', t('journey.settings.showVerdict')],
                  ['show_mood', t('journey.settings.showMood')],
                  ['show_weather', t('journey.settings.showWeather')],
                ] as const).map(([field, label]) => (
                  <div key={field} className={`${ROW}${savingField !== null ? ' opacity-60' : ''}`}>
                    <span className="min-w-0 flex-1 text-content" style={fs(13, 'body')}>{label}</span>
                    <ToggleSwitch
                      on={journey[field] !== 0}
                      onToggle={() => { if (savingField === null) void handleFieldToggle(field) }}
                      label={label}
                    />
                  </div>
                ))}
              </div>
            </DialogSection>

            {/* The way back from dismissing suggestions one at a time. Only ever shown
                when there is something to bring back, so it is not a permanent row
                about a feature most journeys never touch. */}
            {onRestoreSuggestions && (journey.dismissed_count ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => { void onRestoreSuggestions() }}
                className="flex w-full items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary px-3.5 py-2.5 text-start transition-colors hover:bg-surface-card"
              >
                <Undo2 size={15} className="flex-none text-content-faint" />
                <span className="min-w-0 flex-1">
                  <span className="block text-content" style={fs(13, 'body')}>{t('journey.suggestions.restore')}</span>
                  <span className="block text-content-faint" style={fs(11.5)}>
                    {t('journey.suggestions.restoreCount', { count: journey.dismissed_count ?? 0 })}
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <DialogSection label={t('journey.detail.syncedTrips')}>
              {journey.trips.length > 0 ? (
                <div className={`${ROWS} mb-2.5`}>
                  {journey.trips.map(trip => (
                    <div key={trip.trip_id} className={ROW}>
                      <span className="h-8 w-8 flex-none rounded-[9px]" style={{ background: pickGradient(trip.trip_id) }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-content" style={fs(13, 'body')}>{trip.title}</div>
                        <div className="text-content-faint" style={fs(11.5)}>{trip.place_count || 0} {t('journey.synced.places', { count: trip.place_count || 0 })}</div>
                      </div>
                      <RowAction label={t('journey.trips.unlinkTrip')} onClick={() => setUnlinkTarget({ trip_id: trip.trip_id, title: trip.title })}>
                        <Trash2 size={14} />
                      </RowAction>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="m-0 mb-2.5 text-content-faint" style={fs(11.5)}>{t('journey.trips.noTripsLinkedSettings')}</p>
              )}
              <AddRowButton onClick={() => setShowAddTrip(true)}>{t('journey.trips.addTrip')}</AddRowButton>
            </DialogSection>

            <DialogSection label={t('journey.detail.contributors')}>
              <div className={`${ROWS} mb-2.5`}>
                {journey.contributors.map(c => (
                  <div key={c.user_id} className={ROW}>
                    <TripMemberAvatar username={c.username} avatarUrl={avatarSrc(c.avatar)} size={28} />
                    <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>{c.username}</span>
                    {c.role === 'owner' ? (
                      <span className={`${BADGE} bg-warning-soft text-warning`} style={fs(10.5)}>
                        <Crown size={10} strokeWidth={2.4} />{roleLabel(c.role)}
                      </span>
                    ) : (
                      <span className={`${BADGE} bg-surface-tertiary text-content-muted`} style={fs(10.5)}>{roleLabel(c.role)}</span>
                    )}
                    {c.role !== 'owner' && (
                      <RowAction label={t('journey.contributors.remove')} onClick={() => { void handleRemoveContributor(c) }}>
                        <X size={14} />
                      </RowAction>
                    )}
                  </div>
                ))}
              </div>
              <AddRowButton onClick={onOpenInvite}>{t('journey.contributors.invite')}</AddRowButton>
            </DialogSection>
          </div>
        </div>

        <JourneyShareSection journeyId={journey.id} />
      </DialogShell>

      <ConfirmDialog
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={confirmUnlink}
        title={t('journey.trips.unlinkTrip')}
        message={t('journey.trips.unlinkMessage', { title: unlinkTarget?.title })}
        confirmLabel={t('journey.trips.unlink')}
        danger
      />

      {showAddTrip && (
        <AddTripDialog
          journeyId={journey.id}
          existingTripIds={journey.trips.map(trip => trip.trip_id)}
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
    </>
  )
}
