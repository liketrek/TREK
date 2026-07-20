import { useMemo, useRef, useState } from 'react'
import {
  Bookmark, ExternalLink, Map as MapIcon, Navigation, Paperclip,
  Pencil, Phone, Plus, Trash2, Upload, X,
} from 'lucide-react'
import MSheet from '../../../components/MSheet'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation, translateApiError } from '../../../../i18n'
import { assignmentsApi } from '../../../../api/client'
import { useTripStore } from '../../../../store/tripStore'
import { useAddonStore } from '../../../../store/addonStore'
import { useSaveToCollectionStore } from '../../../../store/saveToCollectionStore'
import { collectionTargetFromPlace } from '../lib/collectionTarget'
import { getCategoryIcon } from '../../../../components/shared/categoryIcons'
import { avatarSrc } from '../../../../utils/avatarSrc'
import { openFile } from '../../../../utils/fileDownload'
import { getGoogleMapsUrlForPlace } from '../../../../components/Planner/placeGoogleMaps'
import type { Assignment, Day, TripMember } from '../../../../types'
import { ActionCircle, Eyebrow, INNER_CLS } from './MTripSheetUi'

/**
 * Place inspector sheet (glass card), opened by the current place selection —
 * timeline taps, map markers and the browse "View details" action all funnel
 * through planner.handlePlaceClick/handleMarkerClick. Shows photo + category,
 * contact/description/notes, day assignments, per-assignment participants and
 * attached files, plus the inspector action row.
 */
export default function MPlaceSheet({ planner, shell }: MTripSheetsProps) {
  const { t } = useTranslation()
  const place = planner.selectedPlace ?? null
  const open = !!place

  const canEditPlaces = planner.can('place_edit', planner.trip)
  const canEditDays = planner.can('day_edit', planner.trip)
  const collectionsEnabled = useAddonStore(s => s.isEnabled('collections'))
  const openSavePicker = useSaveToCollectionStore(s => s.open)

  const [filesExpanded, setFilesExpanded] = useState(false)
  const [dayPickerOpen, setDayPickerOpen] = useState(false)
  const [participantPickerOpen, setParticipantPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const close = () => {
    planner.setSelectedPlaceId(null)
    setFilesExpanded(false)
    setDayPickerOpen(false)
    setParticipantPickerOpen(false)
  }

  const category = place?.category
    ?? planner.categories.find(c => c.id === place?.category_id)
    ?? null
  const CatIcon = getCategoryIcon(category?.icon)

  // Every day this place is assigned to (the audit's day-assignment gap).
  const placeAssignments = useMemo(() => {
    if (!place) return [] as { day: Day; assignment: Assignment }[]
    const rows: { day: Day; assignment: Assignment }[] = []
    for (const day of planner.days) {
      for (const a of planner.assignments[String(day.id)] || []) {
        if (a.place?.id === place.id) rows.push({ day, assignment: a })
      }
    }
    return rows
  }, [place, planner.days, planner.assignments])

  const unassignedDays = planner.days.filter(d => !placeAssignments.some(r => r.day.id === d.id))

  // Participants belong to the assignment in the selected day (desktop parity).
  const dayAssignments = planner.selectedDayId ? (planner.assignments[String(planner.selectedDayId)] || []) : []
  const assignmentInDay = planner.selectedDayId
    ? ((planner.selectedAssignmentId ? dayAssignments.find(a => a.id === planner.selectedAssignmentId) : null)
      ?? dayAssignments.find(a => a.place?.id === place?.id))
    : null
  const participants = assignmentInDay?.participants || []
  const participantIds = participants.map(p => p.user_id)
  const allJoined = participants.length === 0
  const members = planner.tripMembers as TripMember[]
  const activeMembers = allJoined ? members : members.filter(m => participantIds.includes(m.id))
  const availableMembers = allJoined ? [] : members.filter(m => !participantIds.includes(m.id))

  const setParticipants = async (userIds: number[]) => {
    if (!assignmentInDay || !planner.selectedDayId) return
    const dayId = planner.selectedDayId
    try {
      const data = await assignmentsApi.setParticipants(planner.tripId, assignmentInDay.id, userIds)
      useTripStore.setState(state => ({
        assignments: {
          ...state.assignments,
          [String(dayId)]: (state.assignments[String(dayId)] || []).map(a =>
            a.id === assignmentInDay.id ? { ...a, participants: data.participants } : a,
          ),
        },
      }))
    } catch (err: unknown) {
      planner.toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }

  const removeParticipant = (userId: number) => {
    let next = allJoined ? members.filter(m => m.id !== userId).map(m => m.id) : participantIds.filter(id => id !== userId)
    if (next.length === members.length) next = []
    setParticipants(next)
  }

  const addParticipant = (userId: number) => {
    const next = [...participantIds, userId]
    setParticipants(next.length === members.length ? [] : next)
    setParticipantPickerOpen(false)
  }

  const placeFiles = (planner.files || []).filter(f =>
    !f.deleted_at && (String(f.place_id) === String(place?.id) || (f.linked_place_ids || []).includes(place?.id ?? -1)),
  )

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length || !place) return
    setUploading(true)
    try {
      for (const file of selected) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('place_id', String(place.id))
        await planner.tripActions.addFile(planner.tripId, fd)
      }
      setFilesExpanded(true)
    } catch (err: unknown) {
      planner.toast.error(translateApiError(t, err, 'files.uploadError'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const saveToCollection = () => {
    if (!place) return
    openSavePicker(collectionTargetFromPlace(place))
  }

  const showOnMap = () => {
    close()
    if (shell.trTab !== 'plan') shell.setTrTab('plan')
    if (shell.view !== 'map') shell.toggleView()
    planner.setFitKey(k => k + 1)
  }

  const openDirections = () => {
    const url = getGoogleMapsUrlForPlace(place)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <MSheet open={open} onClose={close} variant="card" material="glass" ariaLabel={place?.name}>
      {place && (
        <>
          <div className="flex-none px-[18px] pt-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-none flex-col items-center gap-[5px]">
                {place.image_url ? (
                  <div
                    className="h-[52px] w-[52px] rounded-[16px] border-[1.5px] border-[color:var(--m-avbr)] bg-cover bg-center"
                    style={{ backgroundImage: `url('${place.image_url}')` }}
                  />
                ) : (
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border-[1.5px] border-[color:var(--m-avbr)] bg-[color:var(--m-ic)]">
                    <CatIcon size={20} strokeWidth={1.8} className="text-m-muted" />
                  </div>
                )}
                {category && (
                  <span className="flex max-w-[76px] items-center gap-1 rounded-full border border-[color:var(--m-faint)] px-2 py-[2px] font-geist text-[0.625rem] font-semibold text-m-muted">
                    <CatIcon size={10} strokeWidth={2} className="flex-none" />
                    <span className="truncate">{category.name}</span>
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[1rem] font-bold leading-snug">{place.name}</div>
                {place.address && (
                  <div className="mt-[2px] font-geist text-[0.6875rem] leading-[1.4] text-m-muted">{place.address}</div>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label={t('common.close')}
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)]"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
            {place.phone && (
              <a href={`tel:${place.phone}`} className="mt-3 flex items-center gap-[7px] text-[0.78125rem] font-medium">
                <Phone size={13} strokeWidth={2} className="flex-none text-m-muted" />
                {place.phone}
              </a>
            )}

            {place.description && (
              <div className={`mt-[10px] rounded-[14px] px-3 py-[10px] ${INNER_CLS}`}>
                <div className="font-geist text-[0.75rem] leading-[1.5] text-m-muted">{place.description}</div>
              </div>
            )}

            {place.notes && (
              <>
                <Eyebrow className="mb-[6px] mt-3">{t('mobileTrip.notes')}</Eyebrow>
                <div className={`rounded-[14px] px-3 py-[10px] ${INNER_CLS}`}>
                  <div className="whitespace-pre-wrap font-geist text-[0.75rem] leading-[1.5] text-m-muted">{place.notes}</div>
                </div>
              </>
            )}

            {/* ── Day assignments ── */}
            <Eyebrow className="mb-[6px] mt-3">{t('mobileTrip.assignedDays')}</Eyebrow>
            <div className="flex flex-wrap items-center gap-[6px]">
              {placeAssignments.map(({ day, assignment }) => (
                <span
                  key={assignment.id}
                  className={`flex items-center gap-1 rounded-full py-1 pl-[10px] text-[0.75rem] font-semibold ${INNER_CLS} ${canEditDays ? 'pr-1' : 'pr-[10px]'}`}
                >
                  {day.title || t('planner.dayN', { n: (day.day_number ?? planner.days.indexOf(day) + 1) || '?' })}
                  {canEditDays && (
                    <button
                      type="button"
                      onClick={() => planner.handleRemoveAssignment(day.id, assignment.id)}
                      aria-label={t('inspector.removeFromDay')}
                      className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
                    >
                      <X size={10} strokeWidth={2.4} />
                    </button>
                  )}
                </span>
              ))}
              {canEditDays && unassignedDays.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDayPickerOpen(v => !v)}
                  aria-label={t('inspector.addToDay')}
                  aria-expanded={dayPickerOpen}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-dashed border-[color:var(--m-faint)] text-m-muted"
                >
                  <Plus size={13} strokeWidth={2.2} />
                </button>
              )}
            </div>
            {dayPickerOpen && (
              <div className="mt-[6px] max-h-[180px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[6px]">
                {unassignedDays.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => { planner.handleAssignToDay(place.id, d.id); setDayPickerOpen(false) }}
                    className="flex w-full items-center gap-2 rounded-[10px] px-[10px] py-[9px] text-left text-[0.78125rem] font-semibold"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {d.title || t('planner.dayN', { n: (d.day_number ?? planner.days.indexOf(d) + 1) || '?' })}
                    </span>
                    {d.date && (
                      <span className="flex-none font-geist text-[0.65625rem] text-m-faint">
                        {new Date(`${d.date.slice(0, 10)}T00:00:00Z`).toLocaleDateString(planner.language, { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── Participants of the selected day's assignment ── */}
            {assignmentInDay && members.length > 1 && (
              <>
                <Eyebrow className="mb-[6px] mt-3">{t('inspector.participants')}</Eyebrow>
                <div className="flex flex-wrap items-center gap-[6px]">
                  {activeMembers.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { if (activeMembers.length > 1) removeParticipant(m.id) }}
                      className={`flex items-center gap-[6px] rounded-full p-1 pr-[11px] ${INNER_CLS}`}
                    >
                      <span className="flex h-[22px] w-[22px] flex-none items-center justify-center overflow-hidden rounded-full bg-m-act text-[0.625rem] font-bold text-m-actfg">
                        {(m.avatar_url || m.avatar)
                          ? <img src={m.avatar_url || avatarSrc(m.avatar)!} alt="" className="h-full w-full object-cover" />
                          : m.username?.[0]?.toUpperCase()}
                      </span>
                      <span className="text-[0.75rem] font-semibold">{m.username}</span>
                    </button>
                  ))}
                  {availableMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setParticipantPickerOpen(v => !v)}
                      aria-label={t('common.add')}
                      aria-expanded={participantPickerOpen}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-dashed border-[color:var(--m-faint)] text-m-muted"
                    >
                      <Plus size={13} strokeWidth={2.2} />
                    </button>
                  )}
                </div>
                {participantPickerOpen && availableMembers.length > 0 && (
                  <div className="mt-[6px] max-h-[160px] overflow-y-auto rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[6px]">
                    {availableMembers.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => addParticipant(m.id)}
                        className="flex w-full items-center gap-2 rounded-[10px] px-[10px] py-2 text-left text-[0.78125rem] font-semibold"
                      >
                        <span className="flex h-[20px] w-[20px] flex-none items-center justify-center overflow-hidden rounded-full bg-[color:var(--m-ic)] text-[0.5625rem] font-bold text-m-muted">
                          {(m.avatar_url || m.avatar)
                            ? <img src={m.avatar_url || avatarSrc(m.avatar)!} alt="" className="h-full w-full object-cover" />
                            : m.username?.[0]?.toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{m.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Files ── */}
            <div className={`mt-3 rounded-[13px] px-3 py-[9px] ${INNER_CLS}`}>
              <div
                className="flex items-center gap-2"
                onClick={() => { if (placeFiles.length > 0) setFilesExpanded(v => !v) }}
              >
                <Paperclip size={14} strokeWidth={2} className="flex-none text-m-muted" />
                <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold">
                  {placeFiles.length > 0 ? t('inspector.filesCount', { count: placeFiles.length }) : t('inspector.files')}
                </span>
                {planner.canUploadFiles && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                    disabled={uploading}
                    className="flex flex-none items-center gap-[5px] rounded-full bg-m-act px-[11px] py-[5px] text-[0.6875rem] font-semibold text-m-actfg disabled:opacity-40"
                  >
                    <Upload size={12} strokeWidth={2.2} />
                    {t('common.upload')}
                  </button>
                )}
              </div>
              {filesExpanded && placeFiles.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {placeFiles.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => openFile(f.url, f.original_name)}
                      className="flex w-full items-center gap-2 rounded-[10px] bg-[color:var(--m-ic)] px-[10px] py-[7px] text-left"
                    >
                      <span className="min-w-0 flex-1 truncate text-[0.75rem] font-medium">{f.original_name}</span>
                      <ExternalLink size={11} strokeWidth={2} className="flex-none text-m-faint" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />

            {/* ── Action row ── */}
            <div className="mt-[14px] flex items-center gap-[7px]">
              {collectionsEnabled && (
                <ActionCircle onClick={saveToCollection} label={t('inspector.saveToCollection')}>
                  <Bookmark size={15} strokeWidth={2} />
                </ActionCircle>
              )}
              {place.lat != null && place.lng != null && (
                <ActionCircle onClick={openDirections} label={t('inspector.google')}>
                  <Navigation size={15} strokeWidth={2} />
                </ActionCircle>
              )}
              {place.lat != null && place.lng != null && (
                <ActionCircle onClick={showOnMap} label={t('mobileTrip.showOnMap')}>
                  <MapIcon size={15} strokeWidth={2} />
                </ActionCircle>
              )}
              {place.website && (
                <ActionCircle
                  onClick={() => window.open(place.website!, '_blank', 'noopener,noreferrer')}
                  label={t('inspector.website')}
                >
                  <ExternalLink size={15} strokeWidth={2} />
                </ActionCircle>
              )}
              {canEditPlaces && (
                <ActionCircle
                  onClick={() => { planner.openPlaceEditor(place, assignmentInDay?.id ?? null); close() }}
                  label={t('common.edit')}
                  primary
                  className="ml-auto"
                >
                  <Pencil size={15} strokeWidth={2} />
                </ActionCircle>
              )}
              {canEditPlaces && (
                <ActionCircle
                  onClick={() => { planner.handleDeletePlace(place.id); close() }}
                  label={t('common.delete')}
                  danger
                >
                  <Trash2 size={15} strokeWidth={2} />
                </ActionCircle>
              )}
            </div>
          </div>
        </>
      )}
    </MSheet>
  )
}
