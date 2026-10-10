import { useCallback } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import { safeExternalHref } from '../../utils/safeUrl'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { sanitizedMarkdownPlugins, sanitizedMarkdownComponents } from '../shared/markdownSanitize'
import { ExternalLink, Maximize2, MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { Tooltip } from '../shared/Tooltip'
import { ContextMenu, useContextMenu } from '../shared/ContextMenu'
import { Eyebrow, fs } from '../Planner/bookings/bookingParts'
import { AuthedImg } from './CollabNotesAuthedImg'
import { UserAvatar } from './CollabNotesUserAvatar'
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

/** The link chip shows the host: that is what people recognise, "www." is noise. */
function linkHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

const LINK_BTN = 'grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-surface-card shadow-sm'

/**
 * A note as the booking cards are drawn, kept compact: one head band tinted by
 * its category, carrying the category dot, the title, its link, the actions
 * behind "…" and who wrote it; under it the text and the files.
 */
export function NoteCard({ note, canEdit, onUpdate, onDelete, onEdit, onView, onPreviewFile, getCategoryColor, t }: NoteCardProps) {
  const author = note.author || note.user || { username: note.username, avatar: note.avatar_url || avatarSrc(note.avatar) }
  const color = getCategoryColor ? getCategoryColor(note.category) : (note.color || '#6366f1')
  const attachments = note.attachments || []
  const shown = attachments.slice(0, 3)
  const hidden = attachments.length - shown.length
  // Allow-listed like everywhere else a note's link opens: the field takes any string.
  const websiteHref = safeExternalHref(note.website)
  const hasBody = !!note.content || attachments.length > 0
  const menu = useContextMenu()

  const handleTogglePin = useCallback(() => {
    void onUpdate(note.id, { pinned: !note.pinned })
  }, [note.id, note.pinned, onUpdate])

  const handleDelete = useCallback(() => {
    onDelete(note.id)
  }, [note.id, onDelete])

  const menuItems = [
    ...(note.content ? [{ label: t('common.expand'), icon: Maximize2, onClick: () => onView?.(note) }] : []),
    ...(canEdit ? [
      { label: note.pinned ? t('collab.notes.unpin') : t('collab.notes.pin'), icon: note.pinned ? PinOff : Pin, onClick: handleTogglePin },
      { label: t('collab.notes.edit'), icon: Pencil, onClick: () => onEdit?.(note) },
      { divider: true },
      { label: t('collab.notes.delete'), icon: Trash2, onClick: handleDelete, danger: true },
    ] : []),
  ]

  return (
    <article
      aria-label={note.title}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-surface-card transition-shadow hover:shadow-md"
      // A pinned note keeps its category colour on the frame, the way a selected booking card does.
      style={{ borderColor: note.pinned ? `color-mix(in srgb, ${color} 45%, transparent)` : 'var(--border-faint)' }}
    >
      <div className={`flex items-center gap-2 py-1.5 ps-3 pe-1.5 ${hasBody ? 'border-b border-edge-faint' : ''}`} style={{ background: `color-mix(in srgb, ${color} 11%, transparent)` }}>
        {/* The category is only its colour here; the name is in the tooltip and the filter above. */}
        {note.category && (
          <Tooltip label={note.category}>
            <span role="img" aria-label={note.category} data-testid="note-category-dot" className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
          </Tooltip>
        )}
        <span className="min-w-0 flex-1 truncate font-bold text-content" style={fs(13, 'body')}>{note.title}</span>
        {!!note.pinned && <Pin size={12} strokeWidth={2.2} className="flex-none" style={{ color }} />}
        {/* The link rides in the title row as one round button; the host is in its tooltip. */}
        {note.website && (
          <Tooltip label={websiteHref ? linkHost(websiteHref) : note.website}>
            {websiteHref ? (
              <a href={websiteHref} target="_blank" rel="noopener noreferrer" aria-label={linkHost(websiteHref)} className={`${LINK_BTN} text-content-muted hover:text-content`}>
                <ExternalLink size={12} strokeWidth={2.2} />
              </a>
            ) : (
              <span role="img" aria-label={note.website} className={`${LINK_BTN} text-content-faint`}>
                <ExternalLink size={12} strokeWidth={2.2} />
              </span>
            )}
          </Tooltip>
        )}
        {menuItems.length > 0 && (
          <Tooltip label={t('files.menu')} disabled={!!menu.menu}>
            <button type="button" onClick={e => menu.open(e, menuItems, true)} aria-label={t('files.menu')} aria-haspopup="menu"
              className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-content-muted transition-colors hover:bg-surface-card hover:text-content">
              <MoreHorizontal size={15} strokeWidth={2} />
            </button>
          </Tooltip>
        )}
        <Tooltip label={author.username}>
          <span role="img" aria-label={author.username} className="flex flex-none"><UserAvatar user={author} size={20} /></span>
        </Tooltip>
      </div>

      {hasBody && (
        <div className="flex flex-1 flex-col gap-2 px-3 pb-2.5 pt-2">
          {note.content && (
            <div className="collab-note-md line-clamp-3 break-words text-content-muted" style={{ ...fs(12, 'body'), lineHeight: 1.45 }}>
              <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={sanitizedMarkdownPlugins} components={sanitizedMarkdownComponents}>{note.content}</Markdown>
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <Eyebrow className="mb-[3px]">{t('files.title')}</Eyebrow>
              <div className="flex items-center gap-1.5">
                {shown.map(a => {
                  const isImage = a.mime_type?.startsWith('image/')
                  const isPdf = a.mime_type === 'application/pdf'
                  const ext = (a.original_name || '').split('.').pop()?.toUpperCase() || '?'
                  return isImage ? (
                    <AuthedImg key={a.id} src={a.url} alt={a.original_name}
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 10, cursor: 'pointer' }}
                      onClick={() => onPreviewFile?.(a)} />
                  ) : (
                    <Tooltip key={a.id} label={a.original_name || ext}>
                      <button type="button" aria-label={a.original_name} onClick={() => onPreviewFile?.(a)}
                        className={`grid h-10 w-10 place-items-center rounded-[10px] font-geist font-bold tracking-[.03em] transition-transform hover:scale-[1.06] ${isPdf ? 'bg-danger-soft text-danger' : 'bg-surface-secondary text-content-muted'}`}
                        style={fs(9)}>
                        {ext}
                      </button>
                    </Tooltip>
                  )
                })}
                {hidden > 0 && (
                  <span className="rounded-full bg-surface-tertiary px-2 py-[2px] font-geist font-bold text-content-muted" style={fs(10)}>+{hidden}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ContextMenu menu={menu.menu} onClose={menu.close} />
    </article>
  )
}
