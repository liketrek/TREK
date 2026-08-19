/**
 * The bar at the top of a Studio panel: what it is, and how many.
 *
 * Its own file so the three panels can share it without any of them having to
 * import the others — `StudioSidebar` owns the rail, and a panel that reached
 * back into it for a header would make the sidebar impossible to split.
 */
export function PanelHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="st-panel-head">
      <span>{label}</span>
      {count != null && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>}
    </div>
  )
}
