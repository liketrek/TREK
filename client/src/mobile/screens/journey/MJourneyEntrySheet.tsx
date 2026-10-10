import { useEffect, useMemo, useRef, useState } from 'react'
import { Briefcase, Camera, Plus, Image, Images, X, MapPin, Locate, Trash2, CheckCircle2, MinusCircle, ChevronUp, ChevronDown, EyeOff, Play } from 'lucide-react'
import MSheet from '../../components/MSheet'
import MIconBtn from '../../components/MIconBtn'
import MToggle from '../../components/MToggle'
import { useTranslation } from '../../../i18n'
import CustomTimePicker from '../../../components/shared/CustomTimePicker'
import { CustomDatePicker } from '../../../components/shared/CustomDateTimePicker'
import { isVideoFile } from '../../../utils/videoPoster'
import type { ResilientResult, UploadProgress } from '../../../utils/uploadQueue'
import type { JourneyEntry, JourneyPhoto, GalleryPhoto, JourneyTrip } from '../../../store/journeyStore'
import { useAddonStore } from '../../../store/addonStore'
import { photoUrl, posterlessVideo } from '../../../pages/journeyDetail/JourneyDetailPage.helpers'
import JournalBody from '../../../components/Journey/JournalBody'
import { ProviderPicker } from '../../../components/Journey/JourneyDetailPageProviderPicker'
import { MOBILE_MOODS, MOBILE_WEATHERS } from './mobileJourneyMeta'
import { useJourneyEntryForm, type PendingProviderGroup } from '../../../components/Journey/useJourneyEntryForm'

const PRO_COLOR = '#2FA37A'
const CON_COLOR = '#D6273B'

// A clip with no poster to show: the tinted tile and play mark the gallery grid
// gives it, since an <img> asked for its thumbnail draws the broken glyph (#2341).
function ClipTile() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-[color:var(--m-ic)]">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
        <Play size={12} className="ml-[1px]" fill="currentColor" />
      </span>
    </span>
  )
}

interface MJourneyEntrySheetProps {
  entry: JourneyEntry
  galleryPhotos: GalleryPhoto[]
  quickCapture?: boolean
  readOnly?: boolean
  userId?: number
  trips?: JourneyTrip[]
  /** The optional fields this journey still keeps (discussion #2299). Values are never cleared. */
  showVerdict?: boolean
  showMood?: boolean
  showWeather?: boolean
  /**
   * Move this entry within its day.
   *
   * The desktop feed has arrows beside every card; the phone had no way to
   * reorder at all, so a day's stops stayed in whatever order they were written
   * (discussion #2299). Absent when the entry is alone on its day, is a
   * suggestion, or the reader cannot edit.
   */
  onMoveEarlier?: () => void
  onMoveLater?: () => void
  /** Wave a trip-derived suggestion away. Only ever passed for a skeleton. */
  onDismiss?: () => void
  onClose: () => void
  onSave: (data: Record<string, unknown>, existingEntryId?: number) => Promise<number>
  onUploadPhotos: (entryId: number, files: File[], cbs?: { onProgress?: (p: UploadProgress) => void }) => Promise<ResilientResult<JourneyPhoto>>
  onAddProviderPhotos?: (entryId: number, group: PendingProviderGroup) => Promise<void>
  onDelete?: () => void
  onDone: () => void
}

/**
 * shJEntry — the journey entry sheet: title, photos (upload / from gallery /
 * connected provider), markdown story, pros & cons, date + time, location
 * search, mood (4), weather (6) and tags. Read-only for viewer contributors.
 */
export default function MJourneyEntrySheet({
  entry, galleryPhotos, quickCapture = false, readOnly = false, userId = 0, trips = [],
  showVerdict = true, showMood = true, showWeather = true, onMoveEarlier, onMoveLater, onDismiss,
  onClose, onSave, onUploadPhotos, onAddProviderPhotos, onDelete, onDone,
}: MJourneyEntrySheetProps) {
  const { t } = useTranslation()
  const {
    title, setTitle, story, setStory, entryDate, setEntryDate, entryTime, setEntryTime,
    locationName, locationLat, locationQuery, locationResults, showLocationResults, setShowLocationResults,
    locating, locationError, mood, setMood, weather, setWeather, statsExcluded, setStatsExcluded, tripSuggestion,
    isDraft, setIsDraft, pros, setPros, cons, setCons, tags, setTags, tagInput, setTagInput, saving, uploadProgress,
    photos, photoOrder, pendingFiles, setPendingFiles, pendingPreviews, setPendingProviderGroups,
    showGalleryPick, setShowGalleryPick, isDirty, availableGalleryPhotos, queuedProviderPhotos, providerAssetIds,
    contextLocation, offersStatsToggle, addVerdictRow, verdictRowRef, addTag, handleSave, handleFileChange,
    pickGalleryPhoto, removePhoto, searchLocation, pickLocation, handleUseCurrentLocation,
  } = useJourneyEntryForm({
    entry, journeyId: entry.journey_id, trips, galleryPhotos, onSave, onUploadPhotos, onAddProviderPhotos, onDone,
    readOnly, quickCapture, withTags: true, inlineLocateError: true,
  })
  const [showExternal, setShowExternal] = useState(false)
  const [externalProvider, setExternalProvider] = useState<string | null>(null)
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([])
  const [captureOnly, setCaptureOnly] = useState(quickCapture)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // The addon list is already in the store — this only probes which of the
  // photo providers is actually connected for this user.
  const addons = useAddonStore(s => s.addons)
  const addonsLoaded = useAddonStore(s => s.loaded)
  const photoProviders = useMemo(
    () => addons.filter(a => a.type === 'photo_provider' && a.enabled).map(a => ({ id: a.id, name: a.name })),
    [addons],
  )

  useEffect(() => {
    if (readOnly) return
    // App.tsx loads the addon list on boot, so this only reacts to it. Kicking off
    // a second load from here would race the other consumers, and loadAddons
    // overwrites the list unconditionally when it lands.
    if (!addonsLoaded) return
    if (photoProviders.length === 0) { setProviders([]); return }
    let active = true
    ;void (async () => {
      const connected: { id: string; name: string }[] = []
      for (const provider of photoProviders) {
        try {
          const res = await fetch(`/api/integrations/memories/${provider.id}/status`, { credentials: 'include' })
          if (res.ok && (await res.json()).connected) connected.push(provider)
        } catch { /* provider stays hidden */ }
      }
      if (active) setProviders(connected)
    })()
    return () => { active = false }
  }, [readOnly, addonsLoaded, photoProviders])

  const activeProvider = externalProvider || providers[0]?.id || null
  const providerExistingAssetIds = providerAssetIds(activeProvider)

  const handleClose = () => {
    if (!captureOnly && !readOnly && isDirty && !window.confirm(t('journey.editor.discardChangesConfirm'))) return
    onClose()
  }

  const eyebrow = 'font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint'
  const fieldShell = 'rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]'

  return (
    <MSheet
      open
      onClose={handleClose}
      variant="card"
      material="opaque"
      ariaLabel={entry.id === 0 ? t('journey.detail.newEntry') : t('journey.detail.editEntry')}
    >
      <div className="flex flex-none items-center border-b border-[color:var(--m-rowbr)] px-[18px] pb-[10px] pt-4">
        <span className="flex-1 text-[1.0625rem] font-bold">
          {entry.id === 0 ? t('journey.detail.newEntry') : t('journey.detail.editEntry')}
        </span>
        {(onMoveEarlier || onMoveLater) && (
          <span className="me-1 flex items-center gap-1">
            <MIconBtn variant="neutral" size={34} onClick={() => onMoveEarlier?.()} disabled={!onMoveEarlier} ariaLabel={t('dayplan.moveUp')}>
              <ChevronUp size={15} strokeWidth={2.4} />
            </MIconBtn>
            <MIconBtn variant="neutral" size={34} onClick={() => onMoveLater?.()} disabled={!onMoveLater} ariaLabel={t('dayplan.moveDown')}>
              <ChevronDown size={15} strokeWidth={2.4} />
            </MIconBtn>
          </span>
        )}
        <MIconBtn variant="neutral" size={34} onClick={handleClose} ariaLabel={t('common.cancel')}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-3">
        {/* Quick capture had no title field at all: it asked for a note and nothing
            else, so every entry caught on the move arrived nameless and the day's
            list read as a column of identical placeholders (discussion #2299). The
            name is the one thing that makes an entry findable later, and it is one
            line to type, so it comes first here too. */}
        {readOnly ? (
          <div className="pb-[10px] pt-1 text-[1.25rem] font-extrabold">{title || t('journey.editor.titlePlaceholder')}</div>
        ) : (
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('journey.editor.titlePlaceholder')}
            className="w-full bg-transparent pb-[10px] pt-1 text-[1.25rem] font-extrabold text-m-ink outline-none placeholder:text-m-faint"
          />
        )}

        {!readOnly && (
          <>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} onClick={e => { (e.target as HTMLInputElement).value = '' }} />
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} onClick={e => { (e.target as HTMLInputElement).value = '' }} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (captureOnly ? cameraRef : fileRef).current?.click()}
                disabled={saving}
                className="flex min-w-0 flex-1 items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[color:var(--m-rowbr)] p-3 text-center text-[0.75rem] font-semibold text-m-muted disabled:opacity-50"
              >
                {uploadProgress ? (
                  <>
                    <span className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-m-muted" />
                    {t('journey.editor.uploadingProgress', { done: String(uploadProgress.done), total: String(uploadProgress.total) })}
                  </>
                ) : (
                  <>
                    {captureOnly ? <Camera size={14} strokeWidth={2.2} /> : <Plus size={14} strokeWidth={2.2} />}
                    {captureOnly ? t('journey.photo.add') : t('journey.editor.uploadPhotos')}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (captureOnly) { fileRef.current?.click(); return }
                  setShowGalleryPick(v => !v)
                  setShowExternal(false)
                }}
                disabled={!captureOnly && galleryPhotos.length === 0}
                className={`flex min-w-0 flex-1 items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] p-3 text-center text-[0.75rem] font-semibold disabled:opacity-40 ${
                  !captureOnly && showGalleryPick
                    ? 'border-[color:var(--m-act)] text-m-ink'
                    : 'border-dashed border-[color:var(--m-rowbr)] text-m-muted'
                }`}
              >
                <Image size={14} strokeWidth={2} />
                {captureOnly ? t('journey.share.gallery') : t('journey.editor.fromGallery')}
              </button>
              {/* Immich/Synology, the same source the desktop editor offers (#1808).
                  Only shown once a provider is actually connected — on a phone a
                  button that can only say "nothing connected" is not worth its width. */}
              {!captureOnly && providers.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setShowExternal(v => !v); setShowGalleryPick(false) }}
                  disabled={saving}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] p-3 text-center text-[0.75rem] font-semibold disabled:opacity-50 ${
                    showExternal
                      ? 'border-[color:var(--m-act)] text-m-ink'
                      : 'border-dashed border-[color:var(--m-rowbr)] text-m-muted'
                  }`}
                >
                  <Images size={14} strokeWidth={2} />
                  {t('journey.editor.externalPhotos')}
                </button>
              )}
            </div>

            {/* Outside the panel: picking collapses it again, and the queue has
                to stay visible until the save actually writes it. */}
            {!captureOnly && queuedProviderPhotos > 0 && (
              <button
                type="button"
                onClick={() => setPendingProviderGroups([])}
                className="mt-2 rounded-full border border-[color:var(--m-rowbr)] px-3 py-[5px] font-geist text-[0.65625rem] font-semibold text-m-muted"
              >
                {queuedProviderPhotos} {t('journey.editor.externalPhotosQueued')} · {t('common.clear')}
              </button>
            )}

            {!captureOnly && showExternal && activeProvider && (
              <div
                className="mt-2 flex flex-col overflow-hidden rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]"
                style={{ height: 'min(46vh, 420px)' }}
              >
                <div className="flex flex-none items-center gap-2 border-b border-[color:var(--m-rowbr)] px-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] font-semibold text-m-muted">
                    {contextLocation?.name
                      ? `${t('journey.editor.externalPhotosNearby')} · ${contextLocation.name}`
                      : t('journey.editor.externalPhotosNoLocation')}
                  </span>
                </div>
                {providers.length > 1 && (
                  <div className="flex flex-none gap-1 overflow-x-auto border-b border-[color:var(--m-rowbr)] px-3 py-2">
                    {providers.map(provider => (
                      <button
                        key={provider.id}
                        type="button"
                        data-testid={`journey-external-provider-${provider.id}`}
                        onClick={() => setExternalProvider(provider.id)}
                        className={`whitespace-nowrap rounded-full px-[10px] py-[4px] text-[0.6875rem] font-bold ${
                          activeProvider === provider.id ? 'bg-m-act text-m-actfg' : 'text-m-muted'
                        }`}
                      >
                        {provider.name}
                      </button>
                    ))}
                  </div>
                )}
                {/* `embedded` is load-bearing: the standalone picker is
                    position:fixed, which the transformed MSheet panel would
                    anchor to itself and then clip. */}
                <div className="min-h-0 flex-1">
                  <ProviderPicker
                    key={`${activeProvider}-${entryDate}`}
                    provider={activeProvider}
                    userId={userId}
                    entries={[entry]}
                    trips={trips}
                    existingAssetIds={providerExistingAssetIds}
                    initialDate={entryDate}
                    contextLocation={contextLocation}
                    initialEntryId={entry.id || null}
                    embedded
                    onClose={() => setShowExternal(false)}
                    onAdd={async groups => {
                      setPendingProviderGroups(previous => {
                        const next = [...previous]
                        for (const group of groups) {
                          const existing = next.find(item => item.provider === activeProvider && item.passphrase === group.passphrase)
                          if (existing) {
                            const seen = new Set(existing.assetIds)
                            group.assetIds.forEach((assetId, index) => {
                              if (seen.has(assetId)) return
                              seen.add(assetId)
                              existing.assetIds.push(assetId)
                              existing.mediaTypes?.push(group.mediaTypes?.[index] || 'image')
                            })
                          } else {
                            next.push({ ...group, provider: activeProvider })
                          }
                        }
                        return next
                      })
                      setShowExternal(false)
                    }}
                  />
                </div>
              </div>
            )}

            {!captureOnly && showGalleryPick && (
              <div className="mt-2 max-h-[160px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-2">
                <div className="grid grid-cols-5 gap-[6px]">
                  {availableGalleryPhotos.map(gp => (
                    <button
                      key={gp.id}
                      type="button"
                      className="relative w-full overflow-hidden rounded-lg"
                      style={{ paddingTop: '100%' }}
                      onClick={() => pickGalleryPhoto(gp)}
                    >
                      {posterlessVideo(gp) ? (
                        <ClipTile />
                      ) : (
                        <img src={photoUrl(gp)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                    </button>
                  ))}
                  {availableGalleryPhotos.length === 0 && (
                    <div className="col-span-full py-3 text-center font-geist text-[0.6875rem] text-m-faint">
                      {t('journey.editor.allPhotosAdded')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {(photos.length > 0 || pendingFiles.length > 0) && (
          <div className="mt-[10px] flex flex-wrap gap-2">
            {photos.map((p, idx) => (
              <div key={p.id} className="relative h-16 w-16 overflow-hidden rounded-[13px]">
                {posterlessVideo(p) ? (
                  <ClipTile />
                ) : (
                  <img src={photoUrl(p)} alt="" className="h-full w-full object-cover" />
                )}
                {!readOnly && idx > 0 && photos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => photoOrder.makeFirst(idx)}
                    className="absolute bottom-[3px] start-[3px] rounded-full bg-black/60 px-[6px] py-[1px] font-geist text-[0.5rem] font-bold text-white"
                  >
                    {t('journey.editor.photoFirst')}
                  </button>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removePhoto(p)}
                    aria-label={t('common.delete')}
                    className="absolute end-[3px] top-[3px] flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
            {pendingFiles.map((f, i) => (
              <div key={`pending-${i}`} className="relative h-16 w-16 overflow-hidden rounded-[13px]">
                {/* A clip in an <img> is a broken-image glyph (issue #2341). */}
                {isVideoFile(f) ? (
                  <video src={pendingPreviews[i]} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={pendingPreviews[i]} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                  aria-label={t('common.delete')}
                  className="absolute end-[3px] top-[3px] flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Quick capture keeps a note field: the ask was "photos *or* quick notes"
            unterwegs, and a moment without a picture is still worth catching. Two
            rows rather than three — it is a note, not the story, which is written
            later in the full sheet. */}
        {captureOnly && !readOnly && (
          <textarea
            rows={2}
            value={story}
            onChange={e => setStory(e.target.value)}
            placeholder={t('journey.editor.writeStory')}
            className={`mt-[10px] w-full resize-none px-[14px] py-3 font-geist text-[0.8125rem] leading-[1.5] text-m-ink outline-none placeholder:text-m-faint ${fieldShell} rounded-[14px]`}
          />
        )}

        {!captureOnly && <>
          {readOnly ? (
            story && (
              <div className="mt-[10px] font-geist text-[0.8125rem] leading-[1.5] text-m-ink">
                <JournalBody text={story} />
              </div>
            )
          ) : (
            <textarea
              rows={3}
              value={story}
              onChange={e => setStory(e.target.value)}
              placeholder={t('journey.editor.writeStory')}
              className={`mt-[10px] w-full resize-none px-[14px] py-3 font-geist text-[0.8125rem] leading-[1.5] text-m-ink outline-none placeholder:text-m-faint ${fieldShell} rounded-[14px]`}
            />
          )}

          {/* Pros & Cons — gone when the journey has put the verdict away (#2299) */}
          {showVerdict && (!readOnly || pros.length > 0 || cons.length > 0) && (
          <div className="mt-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[13px]">
            <div className={`${eyebrow} mb-2`}>{t('journey.editor.prosCons')}</div>
            <div className="flex gap-[10px]">
              <div className="min-w-0 flex-1">
                <div className="mb-[6px] flex items-center gap-[5px] text-[0.75rem] font-bold" style={{ color: PRO_COLOR }}>
                  <CheckCircle2 size={13} strokeWidth={2.2} />
                  {t('journey.editor.pros')}
                </div>
                {pros.map((p, i) => (
                  <div key={i} className="mb-[6px] flex items-center gap-[6px] rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-sheetop px-2 py-[6px]">
                    <span className="h-[5px] w-[5px] flex-none rounded-full" style={{ background: PRO_COLOR }} />
                    <input
                      ref={verdictRowRef(`pros-${i}`)}
                      value={p}
                      readOnly={readOnly}
                      onChange={e => { const next = [...pros]; next[i] = e.target.value; setPros(next) }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVerdictRow('pros', i) } }}
                      placeholder={t('journey.editor.proPlaceholder')}
                      className="min-w-0 flex-1 bg-transparent font-geist text-[0.6875rem] font-semibold text-m-ink outline-none placeholder:text-m-faint"
                    />
                    {!readOnly && (
                      <button type="button" onClick={() => setPros(pros.filter((_, j) => j !== i))} aria-label={t('common.delete')} className="flex-none text-m-faint">
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => addVerdictRow('pros', pros.length - 1)}
                    className="block w-full rounded-[10px] border border-dashed py-[9px] text-center font-geist text-[0.6875rem] font-semibold"
                    style={{ borderColor: 'rgba(47,163,122,.35)', color: PRO_COLOR }}
                  >
                    + {t('journey.editor.addAnother')}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-[6px] flex items-center gap-[5px] text-[0.75rem] font-bold" style={{ color: CON_COLOR }}>
                  <MinusCircle size={13} strokeWidth={2.2} />
                  {t('journey.editor.cons')}
                </div>
                {cons.map((c, i) => (
                  <div key={i} className="mb-[6px] flex items-center gap-[6px] rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-sheetop px-2 py-[6px]">
                    <span className="h-[5px] w-[5px] flex-none rounded-full" style={{ background: CON_COLOR }} />
                    <input
                      ref={verdictRowRef(`cons-${i}`)}
                      value={c}
                      readOnly={readOnly}
                      onChange={e => { const next = [...cons]; next[i] = e.target.value; setCons(next) }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVerdictRow('cons', i) } }}
                      placeholder={t('journey.editor.conPlaceholder')}
                      className="min-w-0 flex-1 bg-transparent font-geist text-[0.6875rem] font-semibold text-m-ink outline-none placeholder:text-m-faint"
                    />
                    {!readOnly && (
                      <button type="button" onClick={() => setCons(cons.filter((_, j) => j !== i))} aria-label={t('common.delete')} className="flex-none text-m-faint">
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => addVerdictRow('cons', cons.length - 1)}
                    className="block w-full rounded-[10px] border border-dashed py-[9px] text-center font-geist text-[0.6875rem] font-semibold"
                    style={{ borderColor: 'rgba(214,39,59,.35)', color: CON_COLOR }}
                  >
                    + {t('journey.editor.addAnother')}
                  </button>
                )}
              </div>
            </div>
          </div>
          )}
        </>}

        {/* Date + Time. Split in the date's favour: a localized date needs the
            room ("10. Sept. 2026"), a clock never does. */}
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_104px] gap-2">
          <div className="min-w-0">
            <div className={`${eyebrow} mb-[5px]`}>{t('journey.editor.date')}</div>
            {/* TREK's own picker, like the time field beside it: a native
                `<input type="date">` paints itself from the OS locale and takes
                no theme, so the two sat in one row looking like two apps. */}
            <CustomDatePicker value={entryDate} onChange={setEntryDate} disabled={readOnly} />
          </div>
          <div className="min-w-0">
            <div className={`${eyebrow} mb-[5px]`}>{t('mobileJourney.time')}</div>
            {/* A native <input type="time"> paints 12h or 24h from the browser
                locale, whatever the user picked in settings (#2067). The picker
                brings its own shell, so fieldShell goes with the input. */}
            <CustomTimePicker value={entryTime} onChange={setEntryTime} disabled={readOnly} />
          </div>
        </div>

        {tripSuggestion.trip && (
          <div className={`mt-3 flex items-center gap-3 px-3 py-[10px] ${fieldShell}`}>
            <Briefcase size={15} strokeWidth={2} className="flex-none text-m-muted" />
            <div className="min-w-0 flex-1">
              <div className="text-[0.75rem] font-semibold text-m-ink [overflow-wrap:anywhere]">{tripSuggestion.trip.title}</div>
              <div className="mt-[2px] font-geist text-[0.65625rem] leading-[1.4] text-m-muted">{t('journey.editor.tripSuggestionHint')}</div>
            </div>
            <button type="button" onClick={() => void tripSuggestion.link()} disabled={tripSuggestion.linking}
              className="flex-none rounded-full bg-m-act px-3 py-[6px] text-[0.6875rem] font-bold text-m-actfg disabled:opacity-50">
              {t('journey.trips.linkTrip')}
            </button>
          </div>
        )}

        {/* Location */}
        <div className="relative mt-3">
          <div className={`${eyebrow} mb-[5px]`}>{t('journey.editor.location')}</div>
          <div className={`flex items-center gap-2 px-3 py-[10px] ${fieldShell}`}>
            <input
              value={locationQuery || locationName}
              readOnly={readOnly}
              onChange={e => searchLocation(e.target.value)}
              onFocus={() => { if (locationResults.length > 0) setShowLocationResults(true) }}
              placeholder={t('journey.editor.searchLocation')}
              className="min-w-0 flex-1 bg-transparent font-geist text-[0.75rem] text-m-ink outline-none placeholder:text-m-faint"
            />
            {locationLat != null && <MapPin size={13} className="flex-none text-m-muted" />}
            {!readOnly && (
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                aria-label={t('journey.editor.useCurrentLocation')}
                className="flex-none p-1 -m-1 text-m-muted disabled:opacity-50"
              >
                {locating
                  ? <span className="block h-[13px] w-[13px] animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-m-muted" />
                  : <Locate size={13} strokeWidth={2.2} />}
              </button>
            )}
          </div>
          {showLocationResults && locationResults.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-[200px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-m-sheetop shadow-[0_16px_40px_-18px_rgba(0,0,0,.5)]">
              {locationResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickLocation(r)}
                  className="flex w-full items-start gap-2 border-b border-[color:var(--m-rowbr)] px-3 py-[10px] text-start last:border-0"
                >
                  <MapPin size={13} className="mt-[2px] flex-none text-m-faint" />
                  <span className="min-w-0">
                    <span className="block truncate text-[0.78125rem] font-semibold">{r.name}</span>
                    {r.address && <span className="block truncate font-geist text-[0.65625rem] text-m-muted">{r.address}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
          {locating && <div className="mt-[5px] font-geist text-[0.65625rem] text-m-muted">{t('common.loading')}</div>}
          {locationError && <div className="mt-[5px] font-geist text-[0.65625rem] text-[color:var(--m-st-danger)]">{locationError}</div>}
        </div>

        {/* Off the route: the same switch the desktop editor and the Studio
            travel panel offer (#2064). Read-only keeps it visible but locked,
            like the date and the mood above and below it. */}
        {offersStatsToggle && (
          <div className={`mt-3 flex items-center gap-3 px-3 py-[10px] ${fieldShell}`}>
            <div className="min-w-0 flex-1">
              <div className="text-[0.75rem] font-semibold text-m-ink">{t('journey.editor.statsExcluded')}</div>
              <div className="mt-[2px] font-geist text-[0.65625rem] leading-[1.4] text-m-muted">{t('journey.editor.statsExcludedHint')}</div>
            </div>
            <MToggle checked={statsExcluded} onChange={setStatsExcluded} disabled={readOnly} ariaLabel={t('journey.editor.statsExcluded')} />
          </div>
        )}

        {/* Kept among the contributors until it is ready (#696). */}
        <div className={`mt-3 flex items-center gap-3 px-3 py-[10px] ${fieldShell}`}>
          <div className="min-w-0 flex-1">
            <div className="text-[0.75rem] font-semibold text-m-ink">{t('journey.editor.draft')}</div>
            <div className="mt-[2px] font-geist text-[0.65625rem] leading-[1.4] text-m-muted">{t('journey.editor.draftHint')}</div>
          </div>
          <MToggle checked={isDraft} onChange={setIsDraft} disabled={readOnly} ariaLabel={t('journey.editor.draft')} />
        </div>

        {/* Mood */}
        {showMood && !captureOnly && <>
          <div className={`${eyebrow} mb-[6px] mt-3`}>{t('journey.editor.mood')}</div>
          <div className="flex flex-wrap gap-[6px]">
            {MOBILE_MOODS.map(m => {
              const active = mood === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setMood(active ? '' : m.id)}
                  className={`flex items-center gap-[5px] rounded-full border px-3 py-[7px] text-[0.71875rem] font-semibold ${
                    active ? '' : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
                  }`}
                  style={active ? { background: `${m.color}24`, color: m.color, borderColor: `${m.color}4D` } : undefined}
                >
                  <m.icon size={13} strokeWidth={2.2} />
                  {t(m.labelKey)}
                </button>
              )
            })}
          </div>
        </>}

        {/* Weather */}
        {showWeather && <>
        <div className={`${eyebrow} mb-[6px] mt-3`}>{t('journey.editor.weather')}</div>
        <div className="flex flex-wrap gap-[6px]">
          {MOBILE_WEATHERS.map(w => {
            const active = weather === w.id
            return (
              <button
                key={w.id}
                type="button"
                disabled={readOnly}
                onClick={() => setWeather(active ? '' : w.id)}
                className={`flex items-center gap-[5px] rounded-full border px-3 py-[7px] text-[0.71875rem] font-semibold ${
                  active
                    ? 'border-[color:var(--m-act)] bg-m-act text-m-actfg'
                    : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
                }`}
              >
                <w.icon size={13} strokeWidth={2.2} />
                {t(w.labelKey)}
              </button>
            )
          })}
        </div>
        </>}

        {/* Tags */}
        {!captureOnly && (!readOnly || tags.length > 0) && (
          <>
            <div className={`${eyebrow} mb-[6px] mt-3`}>{t('mobileJourney.tags')}</div>
            <div className={`flex flex-wrap items-center gap-[6px] px-3 py-2 ${fieldShell} rounded-[14px]`}>
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-m-sheetop px-[10px] py-[5px] font-geist text-[0.6875rem] font-semibold">
                  {tag}
                  {!readOnly && (
                    <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== tag))} aria-label={t('common.delete')} className="text-m-faint">
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  )}
                </span>
              ))}
              {!readOnly && (
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  onBlur={addTag}
                  placeholder={t('mobileJourney.addTag')}
                  className="min-w-[100px] flex-1 bg-transparent py-[3px] font-geist text-[0.71875rem] text-m-ink outline-none placeholder:text-m-faint"
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* A suggestion is not deleted, it is put down: the row survives so the trip
          sync does not offer the same place again (discussion #2299).

          Its own row above the buttons rather than among them: the sentence is
          longer than a button label and wrapped into two lines between Delete and
          Cancel. Full width, it reads as what it is, an alternative to saving this
          suggestion rather than a fourth thing competing with them. */}
      {!readOnly && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="mx-[18px] mt-1 mb-[10px] flex flex-none items-center gap-[9px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[13px] py-[10px] text-start"
        >
          <EyeOff size={15} strokeWidth={2} className="flex-none text-m-muted" />
          <span className="min-w-0 flex-1 text-[0.8125rem] font-semibold">{t('journey.suggestions.dismiss')}</span>
        </button>
      )}

      <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
        {!readOnly && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-[5px] text-[0.75rem] font-bold text-[color:var(--m-st-danger)]"
          >
            <Trash2 size={13} strokeWidth={2} />
            {t('common.delete')}
          </button>
        )}
        {!readOnly && captureOnly && (
          <button
            type="button"
            onClick={() => setCaptureOnly(false)}
            className="whitespace-nowrap rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold"
          >
            {t('journey.editor.addDetails')}
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          className="ms-auto rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold"
        >
          {t('common.cancel')}
        </button>
        {!readOnly && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-m-act px-[18px] py-[9px] text-[0.78125rem] font-semibold text-m-actfg disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        )}
      </div>
    </MSheet>
  )
}
