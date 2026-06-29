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
    <div
      className="rounded-2xl overflow-hidden flex flex-col lg:flex-row relative bg-surface-card border border-edge"
      style={{
        minHeight: 'min(820px, calc(100vh - var(--nav-h) - 120px))',
      }}
    >
      {/* Mobile top bar with hamburger */}
      <div
        className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-edge"
      >
        <button
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
        className="hidden lg:flex flex-col shrink-0 relative bg-surface-secondary border-r border-edge"
        style={{
          width: 260,
          padding: '24px 14px',
        }}
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
            onClick={() => setMobileOpen(false)}
          />
          <aside
            ref={drawerRef}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col shadow-2xl bg-surface-secondary"
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
              <button
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
      <div className="flex-1 min-w-0" style={{ padding: '26px 28px' }}>
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
      {sidebarLabel && (
        <div
          className="text-[11px] font-bold tracking-widest uppercase mb-3 px-3 text-content-muted"
        >
          {sidebarLabel}
        </div>
      )}
      <nav className="flex flex-col gap-1 flex-1">
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
                  <div className="text-[10px] font-bold tracking-widest uppercase text-content-faint px-3 mt-3 mb-0.5 first:mt-0">
                    {tab.group}
                  </div>
                )}
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${active ? 'text-content font-semibold' : 'text-content-secondary font-medium'}`}
                  style={{
                    background: active ? 'var(--bg-hover)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              </React.Fragment>
            )
          })
        })()}
      </nav>
      {footer && (
        <div
          className="mt-4 pt-3 px-3 text-[10px] tracking-wide text-content-faint border-t border-edge"
        >
          {footer}
        </div>
      )}
    </>
  )
}
