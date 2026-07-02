import { useState, useCallback } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Trash2, Pin, PinOff, Pencil, Maximize2 } from 'lucide-react'
import { FONT } from './CollabNotes.constants'
import { AuthedImg } from './CollabNotesAuthedImg'
import { UserAvatar } from './CollabNotesUserAvatar'
import { WebsiteThumbnail } from './CollabNotesWebsiteThumbnail'
import type { CollabNote, NoteFile } from './CollabNotes.types'
import type { User } from '../../types'

// ── Note Card ───────────────────────────────────────────────────────────────
interface NoteCardProps {
  note: CollabNote
  currentUser: User
  canEdit: boolean
  onUpdate: (noteId: number, data: Partial<CollabNote>) => Promise<void>
  onDelete: (noteId: number) => void
  onEdit: (note: CollabNote) => void
  onView: (note: CollabNote) => void
  onPreviewFile: (file: NoteFile) => void
  getCategoryColor: (category: string) => string
  tripId: number
  t: (key: string) => string
}

export function NoteCard({ note, currentUser, canEdit, onUpdate, onDelete, onEdit, onView, onPreviewFile, getCategoryColor, tripId, t }: NoteCardProps) {
  const [hovered, setHovered] = useState(false)

  const author = note.author || note.user || { username: note.username, avatar: note.avatar_url || avatarSrc(note.avatar) }
  const color = getCategoryColor ? getCategoryColor(note.category) : (note.color || '#6366f1')

  const handleTogglePin = useCallback(() => {
    onUpdate(note.id, { pinned: !note.pinned })
  }, [note.id, note.pinned, onUpdate])

  const handleDelete = useCallback(() => {
    onDelete(note.id)
  }, [note.id, onDelete])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${note.pinned ? color + '40' : color + '25'}`,
        background: note.pinned ? `${color}08` : 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        transition: 'transform 0.12s, box-shadow 0.12s',
        ...(hovered ? { transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } : {}),
      }}
    >
      {/* Header bar — like reservation cards */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
        background: `${color}0d`,
      }}>
        {!!note.pinned && <Pin size={9} color={color} style={{ flexShrink: 0 }} />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {note.title}
          </span>
          {note.category && (
            <span style={{ fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 600, color, background: `${color}18`, padding: '2px 6px', borderRadius: 99, flexShrink: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {note.category}
            </span>
          )}
        </span>

        {/* Hover actions in header */}
        {(
          <div style={{
            display: 'flex', gap: 2,
          }}>
            {note.content && (
              <button onClick={() => onView?.(note)} title={t('collab.notes.expand') || 'Expand'}
                style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                <Maximize2 size={10} />
              </button>
            )}
            {canEdit && <button onClick={handleTogglePin} title={note.pinned ? t('collab.notes.unpin') : t('collab.notes.pin')}
              style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = color}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              {note.pinned ? <PinOff size={10} /> : <Pin size={10} />}
            </button>}
            {canEdit && <button onClick={() => onEdit?.(note)} title={t('collab.notes.edit')}
              style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Pencil size={10} />
            </button>}
            {canEdit && <button onClick={handleDelete} title={t('collab.notes.delete')}
              style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Trash2 size={10} />
            </button>}
            <div style={{ width: 1, height: 12, background: 'var(--border-faint)', flexShrink: 0, marginLeft: 1, marginRight: 1 }} />
            {/* Author avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}
              onMouseEnter={e => { const tip = e.currentTarget.querySelector<HTMLElement>('[data-tip]'); if (tip) tip.style.opacity = '1' }}
              onMouseLeave={e => { const tip = e.currentTarget.querySelector<HTMLElement>('[data-tip]'); if (tip) tip.style.opacity = '0' }}>
              <UserAvatar user={author} size={16} />
              <div data-tip style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: 6, pointerEvents: 'none', opacity: 0, transition: 'opacity 0.12s',
                whiteSpace: 'nowrap', zIndex: 10,
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, padding: '5px 10px', borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid var(--border-faint)',
              }}>
                {author.username}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{
        padding: '8px 12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flex: 1,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {note.content && (
              <div className="collab-note-md" style={{
                fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0,
                maxHeight: '4.5em', overflow: 'hidden',
                wordBreak: 'break-word', fontFamily: FONT,
              }}>
                <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{note.content}</Markdown>
              </div>
            )}
          </div>
              {/* Right: website + attachment thumbnails */}
              {(note.website || (note.attachments?.length ?? 0) > 0) && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
                  {/* Website */}
                  {note.website && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 'calc(7px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.3 }}>Link</span>
                      <WebsiteThumbnail url={note.website} tripId={tripId} color={color} />
                    </div>
                  )}
                  {/* Files */}
                  {(note.attachments || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 'calc(7px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{t('files.title')}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                  {(note.attachments || []).slice(0, note.website ? 1 : 2).map(a => {
                    const isImage = a.mime_type?.startsWith('image/')
                    const ext = (a.original_name || '').split('.').pop()?.toUpperCase() || '?'
                    return isImage ? (
                      <AuthedImg key={a.id} src={a.url} alt={a.original_name}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s' }}
                        onClick={() => onPreviewFile?.(a)}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }} />
                    ) : (
                      <div key={a.id} title={a.original_name} onClick={() => onPreviewFile?.(a)}
                        style={{
                          width: 48, height: 48, borderRadius: 8, cursor: 'pointer',
                          background: a.mime_type === 'application/pdf' ? '#ef44441a' : 'var(--bg-secondary)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                          transition: 'transform 0.12s, box-shadow 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}>
                        <span style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700, color: a.mime_type === 'application/pdf' ? '#ef4444' : 'var(--text-muted)', letterSpacing: 0.3 }}>{ext}</span>
                      </div>
                    )
                  })}
                  {(note.attachments?.length || 0) > (note.website ? 1 : 2) && (
                    <span style={{ fontSize: 'calc(8px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', textAlign: 'center' }}>+{(note.attachments?.length || 0) - (note.website ? 1 : 2)}</span>
                  )}
                      </div>
                    </div>
                  )}
                </div>
              )}
        </div>
      </div>
    </div>
  )
}
