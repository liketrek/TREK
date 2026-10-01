import type { CSSProperties } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { Tooltip } from '../shared/Tooltip'

interface PackedCounterProps {
  packed: number
  quantity: number
  onChange: (count: number) => void
  style?: CSSProperties
}

const stepStyle: CSSProperties = {
  width: 18, height: 18, display: 'grid', placeItems: 'center', padding: 0, border: 'none',
  borderRadius: 99, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
}

/**
 * How many pieces of a multi-piece item are already in the bag (#2296): "7/10"
 * between a minus and a plus. Reaching the quantity ticks the item off.
 */
export function PackedCounter({ packed, quantity, onChange, style }: PackedCounterProps) {
  const { t } = useTranslation()
  const partial = packed > 0 && packed < quantity
  return (
    <Tooltip label={t('packing.packedCount', { packed, total: quantity })}>
      <div
        role="group"
        aria-label={t('packing.packedCount', { packed, total: quantity })}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0, height: 24, padding: '0 3px',
          borderRadius: 99, border: '1px solid transparent',
          background: partial ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-tertiary)',
          ...style,
        }}
      >
        <button type="button" aria-label={t('packing.packedLess')} disabled={packed <= 0} onClick={() => onChange(packed - 1)}
          style={{ ...stepStyle, opacity: packed <= 0 ? 0.35 : 1, cursor: packed <= 0 ? 'default' : 'pointer' }}>
          <Minus size={11} strokeWidth={2.5} />
        </button>
        <span style={{
          minWidth: 30, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600,
          fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
          color: partial ? 'var(--accent)' : 'var(--text-secondary)',
        }}>
          {packed}/{quantity}
        </span>
        <button type="button" aria-label={t('packing.packedMore')} disabled={packed >= quantity} onClick={() => onChange(packed + 1)}
          style={{ ...stepStyle, opacity: packed >= quantity ? 0.35 : 1, cursor: packed >= quantity ? 'default' : 'pointer' }}>
          <Plus size={11} strokeWidth={2.5} />
        </button>
      </div>
    </Tooltip>
  )
}
