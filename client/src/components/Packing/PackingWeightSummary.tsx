import { Users } from 'lucide-react'
import { Tooltip } from '../shared/Tooltip'
import type { PersonLoad } from './packingListPanel.helpers'

const kgOrG = (grams: number) => (grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`)

interface Props {
  t: (key: string, params?: Record<string, string | number>) => string
  total: number
  packed: number
  people: PersonLoad[]
  /** Hairline above the people block; off where the summary sits in its own frame. */
  topRule?: boolean
}

/**
 * The weight foot under the bags (#1131): who carries what, then the total with
 * the packed part of it as a thin bar. Shared by the sidebar and the bag modal so
 * both read the same.
 */
export function PackingWeightSummary({ t, total, packed, people, topRule = true }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((packed / total) * 100)) : 0
  return (
    <div>
      {people.length > 0 && (
        <div style={{ padding: '10px 14px 8px', borderTop: topRule ? '1px solid var(--border-faint)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Users size={12} style={{ color: 'var(--text-faint)' }} />
            <span style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('packing.perPerson')}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {people.map(p => (
              <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                {p.avatar ? (
                  <img src={p.avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <span aria-hidden style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {p.username[0]?.toUpperCase()}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {p.username}
                </span>
                {p.shared ? (
                  <Tooltip label={t('packing.perPersonSharedHint')}>
                    <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', borderBottom: '1px dotted var(--text-faint)', cursor: 'help' }}>
                      {kgOrG(p.grams)}
                    </span>
                  </Tooltip>
                ) : (
                  <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{kgOrG(p.grams)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: '0 0 15px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span>{t('packing.totalWeight')}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{kgOrG(total)}</span>
        </div>
        {total > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)' }}>
              <span>{t('packing.packedWeight')}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{kgOrG(packed)}</span>
            </div>
            <div role="progressbar" aria-label={t('packing.packedWeight')} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
              style={{ height: 3, borderRadius: 99, background: 'var(--border-faint)', marginTop: 5, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'var(--accent)', transition: 'width 0.3s ease' }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
