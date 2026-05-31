import type { PackingState } from './usePackingListPanel'

export function PackingFilterTabs({ items, filter, setFilter, t }: PackingState) {
  if (items.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 0 0', flexShrink: 0 }}>
      {[['alle', t('packing.filterAll')], ['offen', t('packing.filterOpen')], ['erledigt', t('packing.filterDone')]].map(([id, label]) => (
        <button key={id} onClick={() => setFilter(id)} style={{
          padding: '4px 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
          fontSize: 12, fontFamily: 'inherit', fontWeight: filter === id ? 600 : 400,
          background: filter === id ? 'var(--text-primary)' : 'transparent',
          color: filter === id ? 'var(--bg-primary)' : 'var(--text-muted)',
        }}>{label}</button>
      ))}
    </div>
  )
}
