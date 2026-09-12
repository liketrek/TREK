import { FormEvent, useEffect, useState } from 'react'
import { ExternalLink, Link2, Pin, Plus, Trash2, X } from 'lucide-react'
import { collabApi } from '../../api/client'
import { addListener, removeListener } from '../../api/websocket'
import { useTranslation } from '../../i18n'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { useToast } from '../shared/Toast'

interface CollabLink {
  id: number
  title: string
  url: string
  pinned: boolean | number
}

function LinkIcon({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false)
  let favicon = ''
  try { favicon = new URL('/favicon.ico', url).href } catch { favicon = '' }
  if (!favicon || failed) return <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, flex: '0 0 28px', borderRadius: 7, background: 'var(--bg-secondary)', color: 'var(--text-faint)' }}><Link2 size={15} /></span>
  return <img src={favicon} alt="" aria-hidden="true" title={title} onError={() => setFailed(true)} style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: 7, objectFit: 'contain', background: 'var(--bg-secondary)' }} />
}

export default function CollabLinks({ tripId }: { tripId: number }) {
  const { t } = useTranslation()
  const trip = useTripStore(s => s.trip)
  const canEdit = useCanDo()('collab_edit', trip)
  const toast = useToast()
  const [links, setLinks] = useState<CollabLink[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    collabApi.getLinks(tripId)
      .then(d => { if (!cancelled) setLinks(d.links || []) })
      .catch(err => {
        if (cancelled) return
        console.error('Failed to load collab links:', err)
        toast.error(t('common.error'))
      })
    return () => { cancelled = true }
  }, [tripId, toast, t])

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
  const add = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!title.trim() || !url.trim() || busy) return
    setBusy(true)
    try {
      const d = await collabApi.createLink(tripId, { title: title.trim(), url: url.trim() })
      setLinks(v => [d.link, ...v])
      setTitle(''); setUrl(''); setExpanded(false)
    } catch (err) {
      console.error('Failed to add collab link:', err)
      toast.error(t('common.error'))
    } finally {
      setBusy(false)
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
  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--border-faint)' }}><Link2 size={18} aria-hidden="true" /><strong>{t('collab.tabs.links')}</strong><span style={{ marginLeft: 'auto', color: 'var(--text-faint)', fontSize: 12 }}>{links.length}</span></div>
    {canEdit && <div style={{ padding: 10, borderBottom: '1px solid var(--border-faint)' }}>
      <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded} aria-controls={`collab-link-form-${tripId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 8, padding: '7px 10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>{expanded ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{expanded ? t('collab.links.cancel') : t('collab.links.add')}</button>
      {expanded && <form id={`collab-link-form-${tripId}`} onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <label htmlFor={`collab-link-title-${tripId}`} style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>{t('collab.links.titlePlaceholder')}</label>
        <input id={`collab-link-title-${tripId}`} value={title} onChange={e => setTitle(e.target.value)} placeholder={t('collab.links.titlePlaceholder')} autoFocus style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
        <div style={{ display: 'flex', gap: 6 }}><label htmlFor={`collab-link-url-${tripId}`} style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>{t('collab.links.urlPlaceholder')}</label><input id={`collab-link-url-${tripId}`} type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder={t('collab.links.urlPlaceholder')} style={{ flex: 1, minWidth: 0, padding: 8, borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} /><button type="submit" disabled={busy || !title.trim() || !url.trim()} aria-label={t('collab.links.save')} style={{ width: 36, border: 0, borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-text)', cursor: 'pointer' }}><Plus size={18} aria-hidden="true" /></button></div>
      </form>}
    </div>}
    <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>{links.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)' }}>{t('collab.links.empty')}</div> : links.map(link => <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', borderBottom: '1px solid var(--border-faint)' }}><LinkIcon url={link.url} title={link.title} /><a href={link.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, color: 'var(--text-primary)', textDecoration: 'none' }}><div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.title}</div><div style={{ fontSize: 11, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div></a><ExternalLink size={15} color="var(--text-faint)" aria-hidden="true" />{canEdit && <><button type="button" onClick={() => toggle(link)} aria-label={link.pinned ? t('collab.links.unpin') : t('collab.links.pin')} style={{ border: 0, background: 'transparent', color: link.pinned ? 'var(--accent)' : 'var(--text-faint)', cursor: 'pointer' }}><Pin size={15} fill={link.pinned ? 'currentColor' : 'none'} aria-hidden="true" /></button><button type="button" onClick={() => remove(link.id)} aria-label={t('collab.links.delete')} style={{ border: 0, background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer' }}><Trash2 size={15} aria-hidden="true" /></button></>}</div>)}</div>
  </div>
}
