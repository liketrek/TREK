import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronUp, ExternalLink, File, FileImage, FileText, Info, MapPin, Mountain, Navigation, Pencil, Plus, Minus, Upload } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import type { TourListItem } from '@trek/shared'
import type { Assignment, AssignmentsMap, Day, Place, TripFile } from '../../types'
import { useTranslation, translateApiError } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useSettingsStore } from '../../store/settingsStore'
import { resolveTrackColor, inheritedTrackColor } from '../Map/trackColors'
import TrackColorPicker from '../shared/TrackColorPicker'
import DetailShell from '../shared/DetailShell'
import ElevationProfile from '../shared/ElevationProfile'
import { NavigationMenu } from '../shared/NavigationMenu'
import { markdownLinkComponents } from '../shared/markdownLink'
import { DeleteButton, DialogButton, DialogSection, FooterSpacer, fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import { BOX } from '../Planner/bookings/bookingParts'
import { SoftPill, TimePill, tintOf } from '../Planner/planParts'
import { analyzeRouteGeometry } from '../../utils/routeGeometry'
import { filesForPlace } from '../../utils/placeFiles'
import { openFile } from '../../utils/fileDownload'
import { getNavigationTargets, navigationTargetLabel, openNavigationTarget } from '../Planner/placeNavigation'
import { formatPlannedTourDuration, hikeSourceBadgeLabel, tourPlannedTimes, tourSource, tourWebsitePresentation } from './tourPresentation'
import { TourMetricFields, TourNotice, TourTile } from './tourParts'
import { useTourPermissions, type TourPermissionProps } from './useTourPermissions'

interface TourDetailDialogProps extends TourPermissionProps {
  tour: TourListItem
  place: Place
  days?: Day[]
  selectedDayId?: number | null
  selectedAssignmentId?: number | null
  assignments?: AssignmentsMap
  files?: TripFile[]
  onClose: () => void
  onUpdatePlace?: (placeId: number, data: Partial<Place>) => Promise<void> | void
  onFileUpload?: (formData: FormData) => Promise<unknown>
  onAssignToDay?: (placeId: number, dayId?: number) => void
  onRemoveAssignment?: (dayId: number, assignmentId: number) => void
  onDelete?: () => void
  leftWidth?: number
  rightWidth?: number
  desktopNonModal?: boolean
  readOnly?: boolean
  /** Desktop-only opener; the map detail stays non-modal and returns focus when closed. */
  desktopFocusReturnTarget?: HTMLElement | null
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function assignmentForSelectedDay(
  assignments: AssignmentsMap,
  selectedDayId: number | null,
  selectedAssignmentId: number | null,
  placeId: number,
): Assignment | null {
  if (selectedDayId == null) return null
  const dayAssignments = assignments[String(selectedDayId)] || []
  return (selectedAssignmentId ? dayAssignments.find(assignment => assignment.id === selectedAssignmentId) : null)
    ?? dayAssignments.find(assignment => assignment.place?.id === placeId)
    ?? null
}

/**
 * The card a tour opens over the map, in the place inspector's language: a head
 * band tinted by the track colour with the tile, the name and the facts as
 * pills, then each part of the tour under its own label, and the actions in a
 * footer that stays in reach.
 */
export default function TourDetailDialog({
  tour,
  place,
  selectedDayId = null,
  selectedAssignmentId = null,
  assignments = {},
  files = [],
  onClose,
  onUpdatePlace,
  onFileUpload,
  onAssignToDay,
  onRemoveAssignment,
  onDelete,
  leftWidth = 0,
  rightWidth = 0,
  desktopNonModal = false,
  readOnly = false,
  desktopFocusReturnTarget = null,
  canEdit: editPermission,
  canAssign: assignPermission,
}: TourDetailDialogProps) {
  const { canEdit: hasEditPermission, canAssign } = useTourPermissions({ tripId: place.trip_id, canEdit: editPermission, canAssign: assignPermission })
  const canEdit = hasEditPermission && !readOnly
  const { t } = useTranslation()
  const toast = useToast()
  const distanceUnit = useSettingsStore(state => state.settings.distance_unit)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(place.name)
  const [savingName, setSavingName] = useState(false)
  const [filesExpanded, setFilesExpanded] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [navigationOpen, setNavigationOpen] = useState(false)
  const navigationAnchorRef = useRef<HTMLSpanElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const focusReturnRef = useRef(desktopFocusReturnTarget)
  focusReturnRef.current = desktopFocusReturnTarget

  useEffect(() => {
    if (!desktopNonModal) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      closeRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const opener = focusReturnRef.current
      if (opener?.isConnected) opener.focus()
    }
  }, [desktopNonModal])

  const analysis = useMemo(() => analyzeRouteGeometry(place.route_geometry), [place.route_geometry])
  const trackColor = resolveTrackColor(place)
  const inheritedColor = inheritedTrackColor(place)
  const assignment = assignmentForSelectedDay(assignments, selectedDayId, selectedAssignmentId, place.id)
  const placeFiles = filesForPlace(files, place.id, [], assignment ? [assignment.id] : [])
  const navigationTargets = getNavigationTargets(place)
  const navigationLabel = navigationTargets.length === 1 ? navigationTargetLabel(navigationTargets[0], t) : t('inspector.navigation')
  const source = tourSource(tour)
  const tourTimes = tourPlannedTimes(tour)
  const description = tour.description !== undefined ? tour.description : place.description
  const website = tourWebsitePresentation(tour.website !== undefined ? tour.website : place.website)
  const colorLabel = place.route_color ? place.route_color.toUpperCase() : t('inspector.trackColorAuto')

  const saveName = async () => {
    if (!canEdit) return
    const name = nameDraft.trim()
    if (!name || name === place.name || !onUpdatePlace) { setEditingName(false); return }
    setSavingName(true)
    try {
      await onUpdatePlace(place.id, { name })
      setEditingName(false)
    } catch (error: unknown) {
      toast.error(translateApiError(t, error, 'common.error'))
    } finally {
      setSavingName(false)
    }
  }

  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''
    if (!canEdit || !onFileUpload || selectedFiles.length === 0) return
    setUploading(true)
    try {
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('place_id', String(place.id))
        await onFileUpload(formData)
      }
      setFilesExpanded(true)
    } catch (error: unknown) {
      toast.error(translateApiError(t, error, 'files.uploadError'))
    } finally {
      setUploading(false)
    }
  }

  const header = (
    <>
      <div className="flex-none rounded-full bg-surface-card p-[2.5px] shadow-sm">
        <TourTile size={52} color={trackColor} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        {canEdit && editingName ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={nameDraft}
              onChange={event => setNameDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') void saveName()
                if (event.key === 'Escape') { event.preventDefault(); setNameDraft(place.name); setEditingName(false) }
              }}
              aria-label={t('places.formName')}
              className="-mx-1.5 block min-w-0 flex-1 rounded-[8px] border-0 bg-surface-card px-1.5 py-0.5 font-bold tracking-[-0.01em] text-content shadow-sm outline-none"
              style={fs(17, 'subtitle')}
            />
            <Tooltip label={t('common.save')}>
              <button type="button" onClick={() => void saveName()} disabled={savingName} aria-label={t('common.save')}
                className="grid h-7 w-7 flex-none place-items-center rounded-full bg-accent text-accent-text disabled:opacity-50">
                <Check size={14} strokeWidth={2.4} />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="m-0 min-w-0 break-words font-bold leading-snug tracking-[-0.01em] text-content" style={fs(17, 'subtitle')}>{place.name}</h2>
            {canEdit && onUpdatePlace && (
              <Tooltip label={t('common.edit')}>
                <button type="button" onClick={() => { setNameDraft(place.name); setEditingName(true) }} aria-label={t('common.edit')}
                  className="grid h-6 w-6 flex-none place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-card hover:text-content">
                  <Pencil size={12} strokeWidth={2.2} />
                </button>
              </Tooltip>
            )}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <SoftPill icon={<Mountain size={11} strokeWidth={2} className="flex-none" style={{ color: trackColor }} />}>{t(`tourTypes.${tour.tour_type}`)}</SoftPill>
          {tour.difficulty && <SoftPill>{t('tours.detail.difficulty')}: {tour.difficulty}</SoftPill>}
          {tourTimes.walkingMinutes != null && (
            <TimePill>
              <span aria-label={`${t('tours.planner.inspector.duration')}: ${formatPlannedTourDuration(tourTimes.walkingMinutes)}`}>
                {t('tours.planner.inspector.duration')}: {formatPlannedTourDuration(tourTimes.walkingMinutes)}
              </span>
            </TimePill>
          )}
          {tourTimes.breakMinutes != null && (
            <TimePill>
              <span aria-label={`${t('tours.planner.breaksAdditional')}: ${formatPlannedTourDuration(tourTimes.breakMinutes)}`}>
                {t('tours.planner.breaksAdditional')}: {formatPlannedTourDuration(tourTimes.breakMinutes)}
              </span>
            </TimePill>
          )}
          {tourTimes.plannedTotalMinutes != null && (
            <TimePill>
              <span aria-label={`${t('tours.planner.plannedTotalDuration')}: ${formatPlannedTourDuration(tourTimes.plannedTotalMinutes)}${tourTimes.manuallyOverridden ? `, ${t('tours.planner.plannedTotalManual')}` : ''}`}>
                {t('tours.planner.plannedTotalDuration')}: {formatPlannedTourDuration(tourTimes.plannedTotalMinutes)}{tourTimes.manuallyOverridden ? ` · ${t('tours.planner.plannedTotalManual')}` : ''}
              </span>
            </TimePill>
          )}
          <SoftPill>{hikeSourceBadgeLabel(tour, t)}</SoftPill>
          {tour.caution && (
            <Tooltip label={t('tours.caution.tooltip')}>
              <span className="inline-flex">
                <SoftPill tone="warning" icon={<AlertTriangle size={11} strokeWidth={2} className="flex-none" />}>{t('tours.caution.badge')}</SoftPill>
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  )

  const footer = <>
    {canAssign && selectedDayId != null && (assignment ? onRemoveAssignment && (
      <DialogButton onClick={() => { if (canAssign) onRemoveAssignment(selectedDayId, assignment.id) }} icon={<Minus size={14} strokeWidth={2} />} aria-label={t('inspector.removeFromDay')}>
        <span className="max-sm:hidden">{t('inspector.removeFromDay')}</span>
      </DialogButton>
    ) : (
      onAssignToDay && (
        <DialogButton variant="primary" onClick={() => { if (canAssign) onAssignToDay(place.id) }} icon={<Plus size={14} strokeWidth={2} />}>
          {t('inspector.addToDay')}
        </DialogButton>
      )
    ))}
    {navigationTargets.length > 0 && (
      <>
        <span ref={navigationAnchorRef} className="inline-flex">
          <DialogButton
            onClick={() => {
              if (navigationTargets.length === 1) openNavigationTarget(navigationTargets[0])
              else setNavigationOpen(open => !open)
            }}
            aria-label={navigationLabel}
            aria-haspopup={navigationTargets.length > 1 ? 'menu' : undefined}
            aria-expanded={navigationTargets.length > 1 ? navigationOpen : undefined}
            icon={<Navigation size={14} strokeWidth={2} />}
          >
            <span className="max-sm:hidden">{navigationLabel}</span>
          </DialogButton>
        </span>
        {navigationOpen && <NavigationMenu targets={navigationTargets} anchor={navigationAnchorRef.current} onClose={() => setNavigationOpen(false)} />}
      </>
    )}
    <FooterSpacer />
    {canEdit && onDelete && <DeleteButton onClick={() => { if (canEdit) onDelete() }} />}
  </>

  return (
    <DetailShell header={header} footer={footer} onClose={onClose} closeLabel={t('common.close')} leftWidth={leftWidth} rightWidth={rightWidth}
      tint={tintOf(trackColor)}
      closeButtonClassName="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
      {source === 'gpx' && (
        <TourNotice icon={<Info size={13} strokeWidth={2} className="text-content-faint" />}>
          {t('tours.detail.gpxReadOnly')}
          {/* TODO(tours-roadmap): add the planned left-rail “Convert to TREK Tour” action here. */}
        </TourNotice>
      )}

      {analysis && (
        <DialogSection className="flex-none" label={t('inspector.trackStats')}>
          <div className="flex flex-col gap-2">
            <TourMetricFields analysis={analysis} unit={distanceUnit} />
            {analysis.distanceIndexedProfileSamples.length >= 2 && (
              <div className={`${BOX} p-2`}>
                <ElevationProfile samples={analysis.distanceIndexedProfileSamples} color={trackColor} gradientId={`tour-elevation-${place.id}`} />
              </div>
            )}
          </div>
        </DialogSection>
      )}

      <DialogSection className="flex-none" label={t('tours.detail.trackColor')}>
        {canEdit && onUpdatePlace ? (
          <div className={BOX}>
            <button type="button" onClick={() => setColorOpen(open => !open)} aria-expanded={colorOpen}
              className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-start transition-colors hover:bg-surface-hover">
              <span className="h-4 w-4 flex-none rounded-full ring-1 ring-inset ring-edge" style={{ backgroundColor: trackColor }} />
              <span className="min-w-0 flex-1 truncate font-medium text-content-secondary" style={fs(12, 'body')}>{colorLabel}</span>
              {colorOpen ? <ChevronUp size={13} className="flex-none text-content-faint" /> : <ChevronDown size={13} className="flex-none text-content-faint" />}
            </button>
            {colorOpen && (
              <div className="border-t border-edge-faint px-3 py-2.5">
                <TrackColorPicker value={place.route_color ?? null} inheritedColor={inheritedColor} onChange={color => { if (canEdit) void onUpdatePlace(place.id, { route_color: color }) }} />
              </div>
            )}
          </div>
        ) : (
          <div className={`${BOX} flex items-center gap-2 px-3 py-2`}>
            <span aria-label={t('tours.detail.trackColor')} className="h-4 w-4 flex-none rounded-full ring-1 ring-inset ring-edge" style={{ backgroundColor: trackColor }} />
            <span className="min-w-0 flex-1 truncate font-medium text-content-secondary" style={fs(12, 'body')}>{colorLabel}</span>
          </div>
        )}
      </DialogSection>

      {description && <DialogSection className="flex-none" label={t('places.formDescription')}><MarkdownBox>{description}</MarkdownBox></DialogSection>}
      {website && (
        <DialogSection className="flex-none" label={t('places.formWebsite')}>
          <a href={website.href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1.5 text-content hover:underline">
            <ExternalLink size={13} className="flex-none" />
            <span className="truncate">{website.provider ? `${website.provider} · ${website.domain}` : `${t('places.formWebsite')} · ${website.domain}`}</span>
          </a>
        </DialogSection>
      )}
      {place.notes && <DialogSection className="flex-none" label={t('places.formNotes')}><MarkdownBox>{place.notes}</MarkdownBox></DialogSection>}
      {assignment?.notes && <DialogSection className="flex-none" label={t('places.assignmentNotes')}><MarkdownBox>{assignment.notes}</MarkdownBox></DialogSection>}

      {(placeFiles.length > 0 || (canEdit && onFileUpload)) && (
        <DialogSection
          className="flex-none"
          label={t('inspector.files')}
          action={canEdit && onFileUpload && (
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-surface-card px-2 py-[2px] font-geist font-semibold text-content-muted shadow-sm transition-colors focus-within:ring-2 focus-within:ring-accent hover:text-content" style={fs(10.5)}>
              <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={uploadFiles} />
              {uploading ? <span aria-live="polite">…</span> : <><Upload size={11} strokeWidth={2} />{t('common.upload')}</>}
            </label>
          )}
        >
          <div className={BOX}>
            <button type="button" onClick={() => setFilesExpanded(expanded => !expanded)} aria-expanded={filesExpanded}
              className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-start transition-colors hover:bg-surface-hover">
              <FileText size={13} strokeWidth={2} className="flex-none text-content-faint" />
              <span className="min-w-0 flex-1 truncate font-medium text-content-secondary" style={fs(12, 'body')}>
                {placeFiles.length ? t('inspector.filesCount', { count: placeFiles.length }) : t('inspector.files')}
              </span>
              {filesExpanded ? <ChevronUp size={13} className="flex-none text-content-faint" /> : <ChevronDown size={13} className="flex-none text-content-faint" />}
            </button>
            {filesExpanded && placeFiles.length > 0 && (
              <div className="flex flex-col gap-0.5 border-t border-edge-faint p-1">
                {placeFiles.map(file => (
                  <button type="button" key={file.id} onClick={() => void openFile(file.url)}
                    className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-start transition-colors hover:bg-surface-hover">
                    {(file.mime_type || '').startsWith('image/')
                      ? <FileImage size={12} strokeWidth={2} className="flex-none text-content-muted" />
                      : <File size={12} strokeWidth={2} className="flex-none text-content-muted" />}
                    <span className="min-w-0 flex-1 truncate text-content-secondary" style={fs(12, 'body')}>{file.original_name}</span>
                    {file.file_size ? <span className="flex-none tabular-nums text-content-faint" style={fs(11)}>{formatFileSize(file.file_size)}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogSection>
      )}

      {navigationTargets.length > 0 && (
        <div className="flex flex-none items-center gap-1.5 text-content-faint" style={fs(11)}>
          <MapPin size={12} strokeWidth={2} className="flex-none" />
          {t('tours.detail.navigationHint')}
        </div>
      )}
    </DetailShell>
  )
}

/** Markdown in a framed box, like the inspector's; long words wrap instead of widening the card. */
function MarkdownBox({ children }: { children: string }) {
  return (
    <div className={`${BOX} collab-note-md px-3 py-2 text-content-secondary`}
      style={{ ...fs(12.5, 'body'), lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>{children}</Markdown>
    </div>
  )
}
