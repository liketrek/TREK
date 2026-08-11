import PluginIcon from '../shared/PluginIcon'
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
          // The glass vocabulary (--glass-*, --r-xl, --ink-3) is scoped to
          // .trek-dash. The phone dashboard is a different route and mounts these
          // widgets outside that subtree, so every one of those resolved empty and
          // the card lost its background, border, shadow and blur — a bare title
          // over the gradient. Each now falls back to a mobile token, which is
          // what the surrounding cards on that screen are made of.
          style={{
            background: 'var(--glass-bg, var(--m-card))',
            border: '1px solid var(--glass-border, var(--m-cbr))',
            borderRadius: 'var(--r-xl, 20px)',
            boxShadow: 'var(--glass-shadow, 0 16px 44px -20px rgba(0,0,0,.28)), var(--glass-highlight, 0 0 0 0 transparent)',
            backdropFilter: 'var(--glass-blur, blur(30px) saturate(1.8))',
            WebkitBackdropFilter: 'var(--glass-blur, blur(30px) saturate(1.8))',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px 8px',
              fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.14em',
              color: 'var(--ink-3, var(--m-faint))',
            }}
          >
            <PluginIcon name={p.icon} size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </div>
          {/* min-height is just a pre-resize floor; trek:resize drives the real height. */}
          <div style={{ minHeight: 60 }}>
            <PluginFrame pluginId={p.id} tripId={tripId} title={p.name} surface="dashboard-widget" />
          </div>
        </div>
      ))}
    </>
  )
}
