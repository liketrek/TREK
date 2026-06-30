import { usePackingList } from './usePackingListPanel'
import type { PackingListPanelProps } from './usePackingListPanel'
import { PackingHeader } from './PackingListPanelHeader'
import { PackingViewTabs } from './PackingListPanelViewTabs'
import { PackingList } from './PackingListPanelList'
import { BagSidebar } from './PackingListPanelBagSidebar'
import { BagModal } from './PackingListPanelBagModal'
import { BulkImportModal } from './PackingListPanelImportModal'

// Re-exported for tests and external callers that import it from this module.
export { itemWeight } from './packingListPanel.helpers'

export default function PackingListPanel(props: PackingListPanelProps) {
  const S = usePackingList(props)
  const { font, bagTrackingEnabled, bags, showBagModal, showImportModal } = S
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', ...font }}>
      {/* ── Header ── */}
      <PackingHeader {...S} />

      {/* ── Tabs: Gemeinsam / Meine Liste (#858) + Filter ── */}
      <PackingViewTabs {...S} />

      {/* ── Liste + Bags Sidebar ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <PackingList {...S} />
        {bagTrackingEnabled && bags.length > 0 && <BagSidebar {...S} />}
      </div>

      {/* ── Bag Modal (mobile + click) ── */}
      {showBagModal && bagTrackingEnabled && <BagModal {...S} />}

      <style>{`
        .assignee-chip:hover + .assignee-tooltip { opacity: 1 !important; }
        .assignee-chip:hover { opacity: 0.7; }
      `}</style>

      {/* Bulk Import Modal */}
      {showImportModal && <BulkImportModal {...S} />}
    </div>
  )
}
