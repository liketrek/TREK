import type { ReactNode } from 'react'

/**
 * The bar at the top of every Studio panel, on both sides of the page: what the
 * panel is about, how many of it there are, and the things you do to it.
 *
 * One head for all of them. The panels on the left used to open on small grey
 * capitals and the inspector on a darker title of its own, so the two sides of
 * the screen had two ideas of what a panel's top looks like, and the left ones
 * had none at all: their head was set exactly like every group label under it.
 * Now each panel opens on its name in ink, the count beside it as a quiet
 * figure, and the actions at the end. The head keeps one height whether it has
 * actions or not, so the heads of the two sides line up across the page.
 *
 * Its own file so every panel can share it without importing another panel:
 * `StudioSidebar` owns the rail, and a panel that reached back into it for a
 * header would make the sidebar impossible to split.
 */
export function PanelHead({ label, count, meta, actions }: {
  label: string
  count?: number
  /** A fact about the panel's subject in quiet type after the name, such as the page size. */
  meta?: string
  actions?: ReactNode
}) {
  return (
    <div className="st-panel-head">
      <h2 className="st-what">
        <span className="st-what-label">{label}</span>
        {count != null && <em>{count}</em>}
      </h2>
      {meta && <span className="st-head-meta">{meta}</span>}
      {actions && <span className="st-head-acts">{actions}</span>}
    </div>
  )
}

/**
 * A titled group of things to add, in the panels on the left: a heading over a
 * grid or a list, and a line of help under it when it needs one.
 *
 * Never folded. A shelf is browsed, and a library whose groups had to be opened
 * one at a time would be a library read through a keyhole; the inspector's
 * groups fold because they are a reference, these are a catalogue.
 */
export function Shelf({ label, hint, children, className = '' }: {
  label?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`st-section st-shelf ${className}`}>
      {label && <h3 className="st-section-label">{label}</h3>}
      {children}
      {hint && <p className="st-hint st-shelf-hint">{hint}</p>}
    </div>
  )
}
