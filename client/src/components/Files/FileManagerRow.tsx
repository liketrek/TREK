import { Trash2, ExternalLink, Download, MapPin, Ticket, StickyNote, Star, RotateCcw, Pencil } from 'lucide-react'
import type { TripFile } from '../../types'
import type { FileManagerState } from './useFileManager'
import { TRANSPORT_TYPES } from './FileManager.constants'
import { getFileIcon, isImage, formatSize, formatDateWithLocale, transportIcon, triggerDownload } from './FileManager.helpers'
import { AuthedImg } from './FileManagerAuthedImg'
import { AvatarChip } from './FileManagerAvatarChip'
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
    <div key={file.id} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 12,
      padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10,
      transition: 'border-color 0.12s',
      opacity: isTrash ? 0.7 : 1,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-faint)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
      className="group"
    >
      {/* Icon or thumbnail */}
      <div
        onClick={() => !isTrash && openFile(file)}
        style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 8,
          background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isTrash ? 'default' : 'pointer', overflow: 'hidden',
        }}
      >
        {isImage(file.mime_type)
          ? <AuthedImg src={file.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (() => {
              const ext = (file.original_name || '').split('.').pop()?.toUpperCase() || '?'
              const isPdf = file.mime_type === 'application/pdf'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: isPdf ? '#ef44441a' : 'var(--bg-tertiary)' }}>
                  <span style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700, color: isPdf ? '#ef4444' : 'var(--text-muted)', letterSpacing: 0.3 }}>{ext}</span>
                </div>
              )
            })()
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {file.uploaded_by_name && (
            <AvatarChip name={file.uploaded_by_name} avatarUrl={file.uploaded_by_avatar} size={20} />
          )}
          {!isTrash && file.starred ? <Star size={12} fill="#facc15" color="#facc15" style={{ flexShrink: 0 }} /> : null}
          <span
            onClick={() => !isTrash && openFile(file)}
            style={{ fontWeight: 500, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: isTrash ? 'default' : 'pointer' }}
          >
            {file.original_name}
          </span>
        </div>

        {file.description && (
          <p style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.description}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {file.file_size && <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{formatSize(file.file_size)}</span>}
          <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{formatDateWithLocale(file.created_at, locale)}</span>

          {linkedPlaces.map(p => (
            <SourceBadge key={p.id} icon={MapPin} label={`${t('files.sourcePlan')} · ${p.name}`} />
          ))}
          {linkedReservations.map(r => (
            TRANSPORT_TYPES.has(r.type)
              ? <SourceBadge key={r.id} icon={transportIcon(r.type)} label={`${t('files.sourceTransport')} · ${r.title || t('files.sourceTransport')}`} />
              : <SourceBadge key={r.id} icon={Ticket} label={`${t('files.sourceBooking')} · ${r.title || t('files.sourceBooking')}`} />
          ))}
          {file.note_id && (
            <SourceBadge icon={StickyNote} label={t('files.sourceCollab') || 'Collab Notes'} />
          )}
        </div>
      </div>

      {/* Actions — always visible on mobile, hover on desktop */}
      <div className="file-actions" style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {isTrash ? (
          <>
            {can('file_delete', trip) && <button onClick={() => handleRestore(file.id)} title={t('files.restore') || 'Restore'} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = '#22c55e'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <RotateCcw size={14} />
            </button>}
            {can('file_delete', trip) && <button onClick={() => handlePermanentDelete(file.id)} title={t('common.delete')} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Trash2 size={14} />
            </button>}
          </>
        ) : (
          <>
            <button onClick={() => handleStar(file.id)} title={file.starred ? t('files.unstar') || 'Unstar' : t('files.star') || 'Star'} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: file.starred ? '#facc15' : 'var(--text-faint)', borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => { if (!file.starred) e.currentTarget.style.color = '#facc15' }} onMouseLeave={e => { if (!file.starred) e.currentTarget.style.color = 'var(--text-faint)' }}>
              <Star size={14} fill={file.starred ? '#facc15' : 'none'} />
            </button>
            {can('file_edit', trip) && <button onClick={() => setAssignFileId(file.id)} title={t('files.assign') || 'Assign'} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Pencil size={14} />
            </button>}
            <button onClick={() => openFile(file)} title={t('common.open')} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <ExternalLink size={14} />
            </button>
            <button onClick={() => triggerDownload(file.url, file.original_name)} title={t('files.download') || 'Download'} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Download size={14} />
            </button>
            {can('file_delete', trip) && <button onClick={() => handleDelete(file.id)} title={t('common.delete')} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', borderRadius: 6, display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Trash2 size={14} />
            </button>}
          </>
        )}
      </div>
    </div>
  )
}
