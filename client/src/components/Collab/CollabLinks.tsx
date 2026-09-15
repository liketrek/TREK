import { CSSProperties, FormEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, Link2, Pin, Plus, Trash2, X } from 'lucide-react'
import { collabApi } from '../../api/client'
import { addListener, removeListener } from '../../api/websocket'
import { useTranslation } from '../../i18n'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import EmptyState from '../shared/EmptyState'
import { useToast } from '../shared/Toast'

const FONT = "var(--font-system)"

interface CollabLink {
  id: number
  title: string
  url: string
  pinned: boolean | number
}

function LinkIcon({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false)
  let favicon = ''
  try { favicon = new URL('/favicon.ico', url).href } catch { /* not a parseable url, fall through to the glyph */ }
  if (!favicon || failed) return <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, flex: '0 0 28px', borderRadius: 7, background: 'var(--bg-secondary)', color: 'var(--text-faint)' }}><Link2 size={15} /></span>
  return <img src={favicon} alt="" aria-hidden="true" title={title} onError={() => setFailed(true)} style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: 7, objectFit: 'contain', background: 'var(--bg-secondary)' }} />
}

/**
 * The add form as a modal, like the poll and note panels next to it. Inline it
 * pushed the list down and gave the panel a second header, which is what made
 * this tab read as a different app from its four siblings.
 */
function AddLinkModal({ onClose, onCreate }: { onClose: () => void; onCreate: (link: { title: string; url: string }) => Promise<void> }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const valid = title.trim().length > 0 && url.trim().length > 0

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    try {
      await onCreate({ title: title.trim(), url: url.trim() })
      onClose()
    } catch {
      // add() already said what went wrong; the form stays open with the input in it.
    } finally {
      setBusy(false)
    }
  }

  const field: CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 10, fontFamily: 'inherit',
    fontSize: 'calc(13px * var(--fs-scale-body, 1))', outline: 'none',
    border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)',
  }
  const label: CSSProperties = {
    fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600,
    color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
  }

  return createPortal(
    <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg, rgba(0,0,0,0.35))', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16, fontFamily: FONT }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <form style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '90vh', overflow: 'auto', border: '1px solid var(--border-faint)' }} onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: '1px solid var(--border-faint)' }}>
          <h3 style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('collab.links.add')}</h3>
          <button type="button" onClick={onClose} aria-label={t('collab.links.cancel')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2, display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label htmlFor="collab-link-title" style={{ ...label, display: 'block' }}>{t('collab.links.titlePlaceholder')}</label>
            <input id="collab-link-title" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('collab.links.titlePlaceholder')} autoFocus style={field} />
          </div>
          <div>
            <label htmlFor="collab-link-url" style={{ ...label, display: 'block' }}>{t('collab.links.urlPlaceholder')}</label>
            <input id="collab-link-url" type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder={t('collab.links.urlPlaceholder')} style={field} />
          </div>
          <button type="submit" disabled={!valid || busy} style={{
            width: '100%', borderRadius: 99, padding: '9px 14px', background: valid && !busy ? 'var(--accent)' : 'var(--border-primary)',
            color: valid && !busy ? 'var(--accent-text)' : 'var(--text-faint)', fontSize: 'calc(13px * var(--fs-scale-body, 1))',
            fontWeight: 600, border: 'none', cursor: valid && !busy ? 'pointer' : 'default', fontFamily: FONT,
          }}>
            {busy ? '...' : t('collab.links.save')}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default function CollabLinks({ tripId }: { tripId: number }) {
  const { t } = useTranslation()
  const trip = useTripStore(s => s.trip)
  const canEdit = useCanDo()('collab_edit', trip)
  const toast = useToast()
  const [links, setLinks] = useState<CollabLink[]>([])
  const [showForm, setShowForm] = useState(false)

  // Both are new objects on every render, so depending on them would reload the
  // list after each keystroke and drop a link that was just added back out of it.
  const toastRef = useRef(toast)
  toastRef.current = toast
  const tRef = useRef(t)
  tRef.current = t

  useEffect(() => {
    let cancelled = false
    collabApi.getLinks(tripId)
      .then(d => { if (!cancelled) setLinks(d.links || []) })
      .catch(err => {
        if (cancelled) return
        console.error('Failed to load collab links:', err)
        toastRef.current.error(tRef.current('common.error'))
      })
    return () => { cancelled = true }
  }, [tripId])

  // Live sync, the same shape the notes panel uses. Without it the three
  // collab:link events the server broadcasts would arrive nowhere and a link
  // somebody else added would only appear on the next reload.
  useEffect(() => {
    if (!tripId) return
    const handler = (msg: { type?: string; tripId?: number | string; link?: CollabLink; linkId?: number }) => {
      // The panel is not remounted on a trip change, so an event still in
      // flight from the trip we just left must not land in this list.
      if (String(msg?.tripId) !== String(tripId)) return
      if (msg.type === 'collab:link:created' && msg.link) {
        setLinks(prev => prev.some(l => l.id === msg.link!.id) ? prev : [msg.link!, ...prev])
      }
      if (msg.type === 'collab:link:updated' && msg.link) {
        setLinks(prev => prev
          .map(l => l.id === msg.link!.id ? { ...l, ...msg.link! } : l)
          .sort((a, b) => Number(b.pinned) - Number(a.pinned)))
      }
      if (msg.type === 'collab:link:deleted' && msg.linkId) {
        setLinks(prev => prev.filter(l => l.id !== msg.linkId))
      }
    }
    addListener(handler)
    return () => removeListener(handler)
  }, [tripId])

  // Every write says something when it fails. Silence left the pin looking
  // unchanged and the delete looking ignored, with an unhandled rejection in
  // the console as the only trace.
  const add = async (data: { title: string; url: string }) => {
    try {
      const d = await collabApi.createLink(tripId, data)
      setLinks(v => [d.link, ...v])
    } catch (err) {
      console.error('Failed to add collab link:', err)
      toast.error(t('common.error'))
      throw err
    }
  }

  const toggle = async (link: CollabLink) => {
    try {
      const d = await collabApi.updateLink(tripId, link.id, { pinned: !link.pinned })
      setLinks(v => v.map(x => x.id === link.id ? d.link : x).sort((a, b) => Number(b.pinned) - Number(a.pinned)))
    } catch (err) {
      console.error('Failed to pin collab link:', err)
      toast.error(t('common.error'))
    }
  }

  const remove = async (id: number) => {
    try {
      await collabApi.deleteLink(tripId, id)
      setLinks(v => v.filter(x => x.id !== id))
    } catch (err) {
      console.error('Failed to delete collab link:', err)
      toast.error(t('common.error'))
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', flexShrink: 0 }}>
        <h3 style={{ margin: 0, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, letterSpacing: 0.3, textTransform: 'uppercase' }}>
          <Link2 size={14} color="var(--text-faint)" />
          {t('collab.tabs.links')}
        </h3>
        {canEdit && (
          <button type="button" onClick={() => setShowForm(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 99, padding: '6px 12px',
            background: 'var(--accent)', color: 'var(--accent-text)', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600,
            fontFamily: FONT, border: 'none', cursor: 'pointer',
          }}>
            <Plus size={12} /> {t('collab.links.add')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {links.length === 0 ? (
          <EmptyState scene="links" title={t('collab.links.empty')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {links.map(link => (
              <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', borderBottom: '1px solid var(--border-faint)' }}>
                <LinkIcon url={link.url} title={link.title} />
                <a href={link.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, color: 'var(--text-primary)', textDecoration: 'none' }}>
                  <div style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.title}</div>
                  <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div>
                </a>
                <ExternalLink size={15} color="var(--text-faint)" aria-hidden="true" />
                {canEdit && <>
                  <button type="button" onClick={() => toggle(link)} aria-label={link.pinned ? t('collab.links.unpin') : t('collab.links.pin')} style={{ border: 0, background: 'transparent', color: link.pinned ? 'var(--accent)' : 'var(--text-faint)', cursor: 'pointer' }}>
                    <Pin size={15} fill={link.pinned ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => remove(link.id)} aria-label={t('collab.links.delete')} style={{ border: 0, background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer' }}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && <AddLinkModal onClose={() => setShowForm(false)} onCreate={add} />}
    </div>
  )
}
