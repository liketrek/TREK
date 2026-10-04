import { Trash2, ExternalLink, Download, MapPin, Ticket, StickyNote, Star, RotateCcw, Pencil } from 'lucide-react'
import type { TripFile } from '../../types'
import type { FileManagerState } from './useFileManager'
import { TRANSPORT_TYPES } from './FileManager.constants'
import { getFileIcon, isImage, formatSize, formatDateWithLocale, transportIcon, triggerDownload } from './FileManager.helpers'
import { AuthedImg } from './FileManagerAuthedImg'
import { AvatarChip } from './FileManagerAvatarChip'
import { Tooltip } from '../shared/Tooltip'
import { SourceBadge } from './FileManagerSourceBadge'

export function FileRow(p: FileManagerState & { file: TripFile; isTrash?: boolean }) {
  const {
    file, isTrash = false, places, reservations, t, locale, can, trip,
    handleStar, handleRestore, handlePermanentDelete, handleDelete, openFile, setAssignFileId,
  } = p
  const FileIcon = getFileIcon(file.mime_type)
  const allLinkedPlaceIds = new Set<number>()
  if (file.place_id) allLinkedPlaceIds.add(file.place_id)
  for (const pid of (file.linked_place_ids || [])) allLinkedPlaceIds.add(pid)
  const linkedPlaces = [...allLinkedPlaceIds].map(pid => places?.find(p => p.id === pid)).filter(Boolean)
  // All linked reservations (primary + file_links)
  const allLinkedResIds = new Set<number>()
  if (file.reservation_id) allLinkedResIds.add(file.reservation_id)
  for (const rid of (file.linked_reservation_ids || [])) allLinkedResIds.add(rid)
  const linkedReservations = [...allLinkedResIds].map(rid => reservations?.find(r => r.id === rid)).filter(Boolean)
  return (
    <div key={file.id} className="group flex items-start gap-2.5 rounded-[14px] border border-edge-faint bg-surface-secondary px-3 py-2.5 transition-colors hover:border-edge"
      style={{ opacity: isTrash ? 0.7 : 1 }}
    >
      {/* Icon or thumbnail */}
      <button
        type="button"
        disabled={isTrash}
        aria-label={file.original_name}
        onClick={() => !isTrash && openFile(file)}
        style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 10, padding: 0,
          background: 'var(--bg-card)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isTrash ? 'default' : 'pointer', overflow: 'hidden',
        }}
      >
        {isImage(file.mime_type)
          ? <AuthedImg src={file.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (() => {
              const ext = (file.original_name || '').split('.').pop()?.toUpperCase() || '?'
              const isPdf = file.mime_type === 'application/pdf'
              return (
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: isPdf ? 'var(--danger-soft)' : 'var(--bg-card)' }}>
                  <span style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700, color: isPdf ? 'var(--danger)' : 'var(--text-muted)', letterSpacing: 0.3 }}>{ext}</span>
                </span>
              )
            })()
        }
      </button>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {file.uploaded_by_name && (
            <AvatarChip name={file.uploaded_by_name} avatarUrl={file.uploaded_by_avatar} size={20} />
          )}
          {!isTrash && file.starred ? <Star size={12} fill="#facc15" color="#facc15" style={{ flexShrink: 0 }} /> : null}
          <button
            type="button"
            disabled={isTrash}
            onClick={() => !isTrash && openFile(file)}
            style={{ fontWeight: 500, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: isTrash ? 'default' : 'pointer', textAlign: 'left', minWidth: 0 }}
          >
            {file.original_name}
          </button>
        </div>

        {file.description && (
          <p style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.description}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {!!file.file_size && <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{formatSize(file.file_size)}</span>}
          <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{formatDateWithLocale(file.created_at, locale)}</span>

          {linkedPlaces.map(p => (
            <SourceBadge key={p.id} icon={MapPin} kind={t('files.sourcePlan')} label={p.name} />
          ))}
          {linkedReservations.map(r => (
            TRANSPORT_TYPES.has(r.type)
              ? <SourceBadge key={r.id} icon={transportIcon(r.type)} kind={t('files.sourceTransport')} label={r.title || t('files.sourceTransport')} />
              : <SourceBadge key={r.id} icon={Ticket} kind={t('files.sourceBooking')} label={r.title || t('files.sourceBooking')} />
          ))}
          {!!file.note_id && (
            <SourceBadge icon={StickyNote} label={t('files.sourceCollab') || 'Collab Notes'} />
          )}
        </div>
      </div>

      {/* Actions — always visible on mobile, hover on desktop */}
      <div className="file-actions" style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {isTrash ? (
          <>
            {can('file_delete', trip) && <RowAction label={t('files.restore') || 'Restore'} tone="success" onClick={() => handleRestore(file.id)}><RotateCcw size={14} /></RowAction>}
            {can('file_delete', trip) && <RowAction label={t('common.delete')} tone="danger" onClick={() => handlePermanentDelete(file.id)}><Trash2 size={14} /></RowAction>}
          </>
        ) : (
          <>
            <RowAction label={file.starred ? t('files.unstar') || 'Unstar' : t('files.star') || 'Star'} tone="star" active={!!file.starred} onClick={() => handleStar(file.id)}>
              <Star size={14} fill={file.starred ? '#facc15' : 'none'} /* theme-lint-disable: the star keeps its gold */ />
            </RowAction>
            {can('file_edit', trip) && <RowAction label={t('files.assign') || 'Assign'} onClick={() => setAssignFileId(file.id)}><Pencil size={14} /></RowAction>}
            <RowAction label={t('common.open')} onClick={() => openFile(file)}><ExternalLink size={14} /></RowAction>
            <RowAction label={t('files.download') || 'Download'} onClick={() => triggerDownload(file.url, file.original_name)}><Download size={14} /></RowAction>
            {can('file_delete', trip) && <RowAction label={t('common.delete')} tone="danger" onClick={() => handleDelete(file.id)}><Trash2 size={14} /></RowAction>}
          </>
        )}
      </div>
    </div>
  )
}

const STAR_ON = 'text-[#facc15]' // theme-lint-disable: the star keeps its gold
const TONE_HOVER = { plain: 'hover:text-content', success: 'hover:text-success', danger: 'hover:text-danger', star: 'hover:text-[#facc15]' } as const // theme-lint-disable: the star keeps its gold

/** A small action at the end of a file row, named by its tooltip. */
function RowAction({ label, onClick, tone = 'plain', active = false, children }: {
  label: string; onClick: () => void; tone?: keyof typeof TONE_HOVER; active?: boolean; children: React.ReactNode
}) {
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onClick} aria-label={label}
        className={`flex rounded-md p-1.5 transition-colors ${active ? STAR_ON : 'text-content-faint'} ${TONE_HOVER[tone]}`}>
        {children}
      </button>
    </Tooltip>
  )
}
