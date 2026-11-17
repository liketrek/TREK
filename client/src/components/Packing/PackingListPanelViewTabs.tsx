import { Users, UserRound, CheckCheck } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'

/**
 * One row above the lists: whose list (Gemeinsam / Meine Liste, #858) on the
 * left in a tinted track, and how far the packing has come on the right as a
 * line of text with a slim bar. Showing packed items and the order live in the
 * Lists menu, so the row asks one question and answers one.
 */
export function PackingViewTabs(S: PackingState) {
  const { view, setView, t, items, abgehakt, viewTotal, fortschritt, inlineHeader } = S
  const commonCount = items.filter(i => !i.is_private).length
  const personalCount = items.filter(i => !!i.is_private).length

  const viewPill = (id: 'common' | 'personal', icon: React.ReactNode, label: string, count: number) => {
    const active = view === id
    return (
      <button type="button" onClick={() => setView(id)} aria-pressed={active} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 13px', borderRadius: 999,
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600, transition: 'all 0.12s',
        background: active ? 'var(--text-primary)' : 'transparent',
        color: active ? 'var(--bg-primary)' : 'var(--text-muted)',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
      }}>
        {icon}{label}
        <span style={{
          fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, borderRadius: 99, padding: '0 6px',
          background: active ? 'var(--bg-primary)' : 'var(--bg-card)',
          color: active ? 'var(--text-primary)' : 'var(--text-faint)',
        }}>{count}</span>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0 0', flexShrink: 0, flexWrap: 'wrap' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 999, background: 'var(--bg-tertiary)' }}>
        {viewPill('common', <Users size={14} />, t('packing.viewCommon'), commonCount)}
        {viewPill('personal', <UserRound size={14} />, t('packing.viewPersonal'), personalCount)}
      </div>
      {/* The standalone panel says it in its own header already. */}
      {!inlineHeader && viewTotal > 0 && (
        <div className="ms-auto inline-flex items-center gap-2.5 text-caption tabular-nums text-content-muted">
          {fortschritt === 100 ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-success"><CheckCheck size={14} strokeWidth={2.5} />{t('packing.allPacked')}</span>
          ) : (
            <span>{t('packing.packedCount', { packed: abgehakt, total: viewTotal })}</span>
          )}
          <span aria-hidden className="h-1.5 w-[120px] overflow-hidden rounded-full bg-surface-tertiary">
            <span className={`block h-full rounded-full transition-[width] duration-500 ${fortschritt === 100 ? 'bg-success' : 'bg-accent'}`} style={{ width: `${fortschritt}%` }} />
          </span>
        </div>
      )}
    </div>
  )
}
