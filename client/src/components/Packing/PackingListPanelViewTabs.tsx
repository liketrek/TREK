import { Users, UserRound } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'

/**
 * One tab row: the three-tier view switch (Gemeinsam / Meine Liste, #858) on the
 * left, and the all/open/done filter on the right, separated by a vertical rule
 * and sharing the same height. Left-aligned with the list content.
 */
export function PackingViewTabs(S: PackingState) {
  const { view, setView, filter, setFilter, t, items } = S
  const commonCount = items.filter(i => !i.is_private).length
  const personalCount = items.filter(i => !!i.is_private).length

  const pillBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 999,
    border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600, transition: 'all 0.12s',
  }

  const viewPill = (id: 'common' | 'personal', icon: React.ReactNode, label: string, count: number) => {
    const active = view === id
    return (
      <button onClick={() => setView(id)} style={{
        ...pillBase,
        background: active ? 'var(--text-primary)' : 'transparent',
        borderColor: active ? 'var(--text-primary)' : 'var(--border-primary)',
        color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
      }}>
        {icon}{label}
        <span style={{
          fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, borderRadius: 99, padding: '0 6px',
          background: active ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
          color: active ? 'var(--text-primary)' : 'var(--text-faint)',
        }}>{count}</span>
      </button>
    )
  }

  const filterPill = (id: string, label: string) => {
    const active = filter === id
    return (
      <button key={id} onClick={() => setFilter(id)} style={{
        ...pillBase, gap: 0, border: '1px solid transparent', fontWeight: active ? 600 : 400,
        background: active ? 'var(--text-primary)' : 'transparent',
        color: active ? 'var(--bg-primary)' : 'var(--text-muted)',
      }}>{label}</button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0 0', flexShrink: 0, flexWrap: 'wrap' }}>
      {viewPill('common', <Users size={14} />, t('packing.viewCommon'), commonCount)}
      {viewPill('personal', <UserRound size={14} />, t('packing.viewPersonal'), personalCount)}
      {items.length > 0 && (
        <>
          <span style={{ alignSelf: 'stretch', width: 1, background: 'var(--border-primary)', margin: '3px 4px' }} />
          {filterPill('alle', t('packing.filterAll'))}
          {filterPill('offen', t('packing.filterOpen'))}
          {filterPill('erledigt', t('packing.filterDone'))}
        </>
      )}
    </div>
  )
}
