import { useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Users, UserRound, Share2, Check, Copy, HandHelping } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { PackingItem } from '../../types'
import type { TripMember } from './usePackingListPanel'

interface Props {
  item: PackingItem
  tripMembers: TripMember[]
  currentUserId?: number
  onSetSharing: (id: number, visibility: 'common' | 'personal' | 'shared', recipientIds: number[]) => void
  onClone: (id: number) => void
  onJoin: (id: number) => void
  onLeave: (id: number, userId: number) => void
}

/**
 * Per-item sharing control for the three-tier packing model (#858). The owner
 * (bringer) sets the tier — Common / Personal / Shared with specific people — via
 * a dropdown; everyone else can pledge to co-bring a Common item ("I can bring
 * that too") or clone it onto their own list.
 */
export default function PackingShareControl({ item, tripMembers, currentUserId, onSetSharing, onClone, onJoin, onLeave }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // The dropdown is portaled to <body> and fixed-positioned from the button so it
  // can't be clipped by the packing panel's overflow.
  const toggle = () => {
    if (open) { setOpen(false); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    setOpen(true)
  }

  const isCommon = !item.is_private
  const isOwner = item.owner_id == null || item.owner_id === currentUserId
  const recipientIds = (item.recipients || []).map(r => r.user_id)
  const visibility: 'common' | 'personal' | 'shared' = isCommon ? 'common' : recipientIds.length > 0 ? 'shared' : 'personal'
  const iAmContributor = (item.contributors || []).some(c => c.user_id === currentUserId)
  const others = tripMembers.filter(m => m.id !== item.owner_id && m.id !== currentUserId)

  const toggleRecipient = (uid: number) => {
    const next = recipientIds.includes(uid) ? recipientIds.filter(x => x !== uid) : [...recipientIds, uid]
    onSetSharing(item.id, 'shared', next)
  }

  const btn = (onClick: () => void, title: string, active: boolean, node: React.ReactNode) => (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 6, display: 'flex', color: active ? 'var(--accent)' : 'var(--text-faint)' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-faint)' }}>
      {node}
    </button>
  )

  // Non-owner on a Common item: pledge to co-bring + clone to personal list.
  if (!isOwner && isCommon) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {btn(() => (iAmContributor ? onLeave(item.id, currentUserId!) : onJoin(item.id)),
          iAmContributor ? t('packing.alsoBringingStop') : t('packing.alsoBring'), iAmContributor, <HandHelping size={14} />)}
        {btn(() => onClone(item.id), t('packing.cloneToMine'), false, <Copy size={13} />)}
      </div>
    )
  }
  // A recipient of a shared item has no controls (it's the owner's responsibility).
  if (!isOwner) return null

  return (
    <div style={{ display: 'flex' }}>
      <button ref={btnRef} onClick={toggle} title={t('packing.share')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 6, display: 'flex', color: visibility !== 'common' ? 'var(--accent)' : 'var(--text-faint)' }}
        onMouseEnter={e => { if (visibility === 'common') e.currentTarget.style.color = 'var(--text-secondary)' }}
        onMouseLeave={e => { if (visibility === 'common') e.currentTarget.style.color = 'var(--text-faint)' }}>
        <Share2 size={14} />
      </button>
      {open && pos && ReactDOM.createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1099 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'fixed', top: pos.top, right: pos.right, zIndex: 1100,
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
            boxShadow: '0 8px 28px rgba(0,0,0,0.18)', padding: 4, minWidth: 200, maxHeight: '60vh', overflowY: 'auto',
          }}>
            <Row icon={<Users size={13} />} label={t('packing.viewCommon')} sub={t('packing.tierCommonHint')} active={visibility === 'common'} onClick={() => { onSetSharing(item.id, 'common', []); setOpen(false) }} />
            <Row icon={<UserRound size={13} />} label={t('packing.tierPersonal')} sub={t('packing.tierPersonalHint')} active={visibility === 'personal'} onClick={() => { onSetSharing(item.id, 'personal', []); setOpen(false) }} />
            <div style={{ height: 1, background: 'var(--bg-tertiary)', margin: '4px 0' }} />
            <div style={{ padding: '4px 10px 2px', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Share2 size={10} /> {t('packing.tierShared')}
            </div>
            {others.length === 0 ? (
              <div style={{ padding: '4px 10px 6px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{t('packing.noOneToShare')}</div>
            ) : others.map(m => {
              const on = recipientIds.includes(m.id)
              return (
                <button key={m.id} onClick={() => toggleRecipient(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'none', fontFamily: 'inherit', fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: `hsl(${m.username.charCodeAt(0) * 37 % 360}, 55%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'white', textTransform: 'uppercase' }}>{m.username[0]}</span>
                  <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.username}</span>
                  {on && <Check size={13} className="text-content-muted" />}
                </button>
              )
            })}
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}

function Row({ icon, label, sub, active, onClick }: { icon: React.ReactNode; label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: active ? 'var(--bg-tertiary)' : 'none', fontFamily: 'inherit', textAlign: 'left' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'var(--bg-tertiary)' : 'none' }}>
      <span style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', marginTop: 1 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{sub}</span>
      </span>
      {active && <Check size={13} className="text-content-muted" style={{ marginTop: 2 }} />}
    </button>
  )
}
