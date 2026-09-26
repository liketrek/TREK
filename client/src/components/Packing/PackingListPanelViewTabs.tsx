import { Users, UserRound } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'

/**
 * One tab row: the three-tier view switch (Gemeinsam / Meine Liste, #858) on the
 * left, and the all/open/done filter on the right. Each sits in its own tinted
 * track, the way the phone shows them, so the row reads as two questions
 * (whose list, which state) rather than five pills of equal weight.
 */
export function PackingViewTabs(S: PackingState) {
  const { view, setView, filter, setFilter, t, items } = S
  const commonCount = items.filter(i => !i.is_private).length
  const personalCount = items.filter(i => !!i.is_private).length

  const track: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 999, background: 'var(--bg-tertiary)',
  }
  const segment = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 13px', borderRadius: 999,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600, transition: 'all 0.12s',
    background: active ? 'var(--text-primary)' : 'transparent',
    color: active ? 'var(--bg-primary)' : 'var(--text-muted)',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
  })

  const viewPill = (id: 'common' | 'personal', icon: React.ReactNode, label: string, count: number) => {
    const active = view === id
    return (
      <button type="button" onClick={() => setView(id)} style={segment(active)}>
        {icon}{label}
        <span style={{
          fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, borderRadius: 99, padding: '0 6px',
          background: active ? 'var(--bg-primary)' : 'var(--bg-card)',
          color: active ? 'var(--text-primary)' : 'var(--text-faint)',
        }}>{count}</span>
      </button>
    )
  }

  const filterPill = (id: string, label: string) => (
    <button type="button" key={id} onClick={() => setFilter(id)} style={segment(filter === id)}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 0', flexShrink: 0, flexWrap: 'wrap' }}>
      <div style={track}>
        {viewPill('common', <Users size={14} />, t('packing.viewCommon'), commonCount)}
        {viewPill('personal', <UserRound size={14} />, t('packing.viewPersonal'), personalCount)}
      </div>
      {items.length > 0 && (
        <div style={track}>
          {filterPill('alle', t('packing.filterAll'))}
          {filterPill('offen', t('packing.filterOpen'))}
          {filterPill('erledigt', t('packing.filterDone'))}
        </div>
      )}
    </div>
  )
}
