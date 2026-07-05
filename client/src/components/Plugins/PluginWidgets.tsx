import { Blocks } from 'lucide-react'
import PluginFrame from './PluginFrame'
import type { ActivePlugin } from '../../store/pluginStore'

/**
 * Renders active `widget` plugins as dashboard cards (#plugins, M8). Each is a
 * sandboxed PluginFrame; the widget talks to TREK only over the bridge.
 *
 * The card mirrors the native dashboard tools (glassy `.tool` surface + uppercase
 * title) so plugins sit alongside them seamlessly, and the body auto-sizes to the
 * height the widget reports over trek:resize — no fixed height that would clip a
 * taller widget's controls.
 */
export default function PluginWidgets({ plugins, tripId = null }: { plugins: ActivePlugin[]; tripId?: string | null }) {
  if (plugins.length === 0) return null
  return (
    <>
      {plugins.map((p) => (
        <div
          key={p.id}
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--r-xl, 20px)',
            boxShadow: 'var(--glass-shadow), var(--glass-highlight)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px 8px',
              fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'var(--ink-3)',
            }}
          >
            <Blocks size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </div>
          {/* min-height is just a pre-resize floor; trek:resize drives the real height. */}
          <div style={{ minHeight: 60 }}>
            <PluginFrame pluginId={p.id} tripId={tripId} title={p.name} />
          </div>
        </div>
      ))}
    </>
  )
}
