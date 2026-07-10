import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { pluginsApi, type ViewContribution } from '../../api/client'
import { useToast } from '../shared/Toast'
import PluginFrame from './PluginFrame'

/**
 * Host-rendered plugin contributions in a native planner view (#plugins,
 * tableContributor hook). The server has already normalized + bounded every field
 * (label/value length, http/https/mailto-only urls, enum tone/target), so this only
 * renders trusted primitives — a column is text/link, an action is a labelled button
 * that opens the plugin's sandboxed frame or calls one of its routes. Plugin-authored
 * markup NEVER runs inline; it only ever runs inside the opaque-origin PluginFrame.
 */
export type ViewName = 'reservations' | 'transports' | 'places' | 'day' | 'costs' | 'packing' | 'files' | 'todos'
type Column = Extract<ViewContribution, { kind: 'column' }>
type Action = Extract<ViewContribution, { kind: 'action' }>

const EMPTY: ViewContribution[] = []

/** Fetch a view's contributions once (keyed on tripId) and bucket them by entityId.
 * Fail-safe: any error yields an empty lookup, so a plugin can never block or break
 * the native view — it can only ADD cells/buttons. */
export function usePluginViewContributions(view: ViewName, tripId: string | number | null | undefined) {
  const [byEntity, setByEntity] = useState<Map<number, ViewContribution[]>>(new Map())
  useEffect(() => {
    if (tripId == null) { setByEntity(new Map()); return }
    let cancelled = false
    pluginsApi.viewContributions(view, tripId)
      .then(({ contributions }) => {
        if (cancelled) return
        const m = new Map<number, ViewContribution[]>()
        for (const c of contributions || []) {
          const arr = m.get(c.entityId)
          if (arr) arr.push(c); else m.set(c.entityId, [c])
        }
        setByEntity(m)
      })
      .catch(() => { if (!cancelled) setByEntity(new Map()) })
    return () => { cancelled = true }
  }, [view, tripId])
  return useCallback((entityId: number): ViewContribution[] => byEntity.get(entityId) ?? EMPTY, [byEntity])
}

const TONE_CLASS: Record<Column['tone'], string> = {
  default: 'text-content-muted',
  success: 'text-success',
  warn: 'text-warning',
  danger: 'text-danger',
}

/** Extra read-only cells (label + value/link) for one entity, in the card/row body. */
export function PluginColumns({ items }: { items: ViewContribution[] }) {
  const cols = items.filter((c): c is Column => c.kind === 'column')
  if (!cols.length) return null
  return (
    <div className="flex flex-col gap-1">
      {cols.map((c) => (
        <div key={c.pluginId + c.id} className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-content-secondary font-medium shrink-0">{c.label}</span>
          {c.url
            ? <a href={c.url} target="_blank" rel="noreferrer noopener" className="text-accent truncate text-right" onClick={(e) => e.stopPropagation()}>{c.value ?? '↗'}</a>
            : <span className={`${TONE_CLASS[c.tone] ?? TONE_CLASS.default} text-right truncate`}>{c.value}</span>}
        </div>
      ))}
    </div>
  )
}

/** The plugin-contributed columns + actions strip appended to the bottom of an
 * entity row/card. Renders nothing (zero change) when no plugin contributes. */
export function PluginCardFooter({ items, tripId }: { items: ViewContribution[]; tripId: number }) {
  if (!items.length) return null
  return (
    <div className="border-t border-edge" style={{ marginTop: 8, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <PluginColumns items={items} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}><PluginActions items={items} tripId={tripId} /></div>
    </div>
  )
}

/** Labelled action buttons for one entity — a route action calls the plugin route;
 * a frame action opens the plugin's sandboxed UI in a modal. */
export function PluginActions({ items, tripId, className }: { items: ViewContribution[]; tripId: string | number | null; className?: string }) {
  const actions = items.filter((c): c is Action => c.kind === 'action')
  const [frame, setFrame] = useState<{ pluginId: string; label: string } | null>(null)
  const toast = useToast()
  if (!actions.length) return null

  const run = (a: Action, e: React.MouseEvent) => {
    e.stopPropagation()
    if (a.target.kind === 'frame') { setFrame({ pluginId: a.pluginId, label: a.label }); return }
    void pluginsApi.invoke(a.pluginId, a.target.sub, { method: a.target.method })
      .then(() => toast.success(a.label))
      .catch(() => toast.error(a.label))
  }

  return (
    <>
      {actions.map((a) => (
        <button
          key={a.pluginId + a.id}
          onClick={(e) => run(a, e)}
          title={a.label}
          className={className ?? 'px-2 h-7 inline-flex items-center rounded-lg border border-edge bg-surface-card text-xs text-content-muted hover:text-content hover:border-content-faint transition-colors'}
        >
          {a.label}
        </button>
      ))}
      {frame && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/50 p-4" onClick={() => setFrame(null)}>
          <div className="bg-surface-card rounded-xl shadow-xl w-full max-w-lg h-[70vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-edge shrink-0">
              <span className="text-sm font-medium text-content truncate">{frame.label}</span>
              <button onClick={() => setFrame(null)} className="text-content-muted hover:text-content"><X size={16} /></button>
            </div>
            <div className="flex-1 min-h-0">
              <PluginFrame pluginId={frame.pluginId} tripId={tripId != null ? String(tripId) : null} title={frame.label} fill />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
