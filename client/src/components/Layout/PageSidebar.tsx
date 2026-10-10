import React, { useState, useEffect, useRef } from 'react'
import { Menu, X, type LucideIcon } from 'lucide-react'

export interface PageSidebarTab {
  id: string
  label: string
  icon: LucideIcon
  /** Optional group heading shown above the first tab of each group. Tabs that
   *  share a group must be contiguous in the array. */
  group?: string
}

interface PageSidebarProps {
  /** Uppercase label shown above the tab list, e.g. "SETTINGS". */
  sidebarLabel: string
  tabs: PageSidebarTab[]
  activeTab: string
  onTabChange: (id: string) => void
  children: React.ReactNode
  /** Small text at the very bottom of the sidebar (e.g. "v3.0 · self-hosted"). */
  footer?: React.ReactNode
}

/**
 * Left-sidebar + right-panel layout used by the Settings and Admin pages.
 *
 * Desktop (>=1024px): sidebar is always visible at 260px; panel fills rest.
 * Mobile: sidebar collapses behind a hamburger at the top of the panel; tap
 * the hamburger to slide the sidebar in as an overlay, tap a tab to close.
 */
export default function PageSidebar({
  sidebarLabel,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
}: PageSidebarProps): React.ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeLabel = tabs.find(t => t.id === activeTab)?.label ?? ''

  // Close the mobile drawer on Escape or on outside click.
  const drawerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    // The planner's layout (#2541): a navigation card on the left, the panel's
    // own cards on the page beside it, no frame around the two.
    <div className="relative flex flex-col items-start gap-5 lg:flex-row">
      {/* Mobile top bar with hamburger */}
      <div
        className="lg:hidden flex w-full items-center justify-between rounded-[14px] border border-edge-faint bg-surface-secondary px-3 py-2"
      >
        <button type="button"
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-hover)] text-content"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold text-content">
          {activeLabel}
        </div>
        <div className="w-9" />
      </div>

      {/* Desktop sidebar (always visible on lg) */}
      <aside
        className="hidden lg:flex sticky flex-col shrink-0 self-start rounded-[18px] border border-edge-faint bg-surface-secondary p-2.5"
        style={{ width: 248, top: 'calc(var(--nav-h, 56px) + 16px)', maxHeight: 'calc(100vh - var(--nav-h, 56px) - 32px)', overflowY: 'auto' }}
      >
        <SidebarInner
          sidebarLabel={sidebarLabel}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          footer={footer}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-[rgba(0,0,0,0.35)]"
            role="presentation"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            ref={drawerRef}
            className="lg:hidden fixed top-0 start-0 bottom-0 z-50 flex flex-col shadow-2xl bg-surface-secondary"
            style={{
              width: 280,
              padding: '18px 14px',
            }}
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <span
                className="text-[11px] font-bold tracking-widest uppercase text-content-muted"
              >
                {sidebarLabel}
              </span>
              <button type="button"
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-hover)] text-content"
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>
            <SidebarInner
              sidebarLabel={null}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(id) => {
                onTabChange(id)
                setMobileOpen(false)
              }}
              footer={footer}
            />
          </aside>
        </>
      )}

      {/* Panel */}
      <div className="w-full min-w-0 flex-1">
        {children}
      </div>
    </div>
  )
}

function SidebarInner({
  sidebarLabel,
  tabs,
  activeTab,
  onTabChange,
  footer,
}: {
  sidebarLabel: string | null
  tabs: PageSidebarTab[]
  activeTab: string
  onTabChange: (id: string) => void
  footer?: React.ReactNode
}): React.ReactElement {
  return (
    <>
      {/* Grouped tabs carry their own headings; a page label above the first would stack two. */}
      {sidebarLabel && !tabs[0]?.group && (
        <div className="mb-1.5 mt-1 px-2.5 font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={{ fontSize: 'calc(9.5px * var(--fs-scale-caption, 1))' }}>
          {sidebarLabel}
        </div>
      )}
      <nav className="flex flex-col gap-0.5 flex-1">
        {(() => {
          let lastGroup: string | undefined
          return tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab
            const showHeader = !!tab.group && tab.group !== lastGroup
            lastGroup = tab.group
            return (
              <React.Fragment key={tab.id}>
                {showHeader && (
                  <div className="mt-3 mb-1 px-2.5 font-geist font-bold uppercase tracking-[.08em] text-content-faint first:mt-0" style={{ fontSize: 'calc(9.5px * var(--fs-scale-caption, 1))' }}>
                    {tab.group}
                  </div>
                )}
                <button type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-[11px] px-2 py-1.5 text-start transition-colors ${active ? 'bg-surface-card font-semibold text-content shadow-sm ring-1 ring-edge-faint' : 'font-medium text-content-secondary hover:bg-surface-hover hover:text-content'}`}
                  style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[8px] ${active ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-muted'}`}>
                    <Icon size={14} strokeWidth={2} />
                  </span>
                  <span className="truncate">{tab.label}</span>
                </button>
              </React.Fragment>
            )
          })
        })()}
      </nav>
      {footer && (
        <div
          className="mt-3 border-t border-edge-faint px-2.5 pt-2.5 font-geist tabular-nums text-content-faint"
          style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))' }}
        >
          {footer}
        </div>
      )}
    </>
  )
}
