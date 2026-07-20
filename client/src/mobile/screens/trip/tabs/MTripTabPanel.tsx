import type { MTripTabPanelProps } from '../MTripShell'
import { TabScroller } from './tabChrome'
import MTransportsTab from './MTransportsTab'
import MBookingsTab from './MBookingsTab'
import MCostsTab from './MCostsTab'
import MFilesTab from './MFilesTab'
import MCollabTab from './MCollabTab'
import MListsTab from './MListsTab'
import PluginFrame from '../../../../components/Plugins/PluginFrame'

/**
 * Routes the active non-plan trip tab to its panel. `tab` is the legacy id the
 * desktop planner uses (transports · buchungen · finanzplan · listen · dateien ·
 * collab · plugin:<id>); addon/plugin gating already happened in the shell, so
 * only enabled tabs ever reach here. Panels are wired in as they are built
 * (spec analysis/03-trip-tabs.md); an unbuilt tab shows its empty scroll body
 * while the surrounding chrome (top controls, day chips, dock) stays usable.
 */
export default function MTripTabPanel({ planner, shell, tab }: MTripTabPanelProps) {
  // Trip-page plugin tab — the same sandboxed frame the desktop planner mounts,
  // filling the panel between the top chrome and the dock. The bottom padding
  // mirrors TabScroller's safe-area clearance so the frame never hides under it.
  if (tab.startsWith('plugin:')) {
    return (
      <div className="absolute inset-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)' }}>
        <PluginFrame pluginId={tab.slice('plugin:'.length)} tripId={planner.tripId != null ? String(planner.tripId) : null} fill className="h-full w-full" />
      </div>
    )
  }
  switch (tab) {
    case 'transports':
      return <MTransportsTab planner={planner} shell={shell} />
    case 'buchungen':
      return <MBookingsTab planner={planner} shell={shell} />
    case 'finanzplan':
      return <MCostsTab planner={planner} shell={shell} />
    case 'dateien':
      return <MFilesTab planner={planner} shell={shell} />
    case 'collab':
      return <MCollabTab planner={planner} shell={shell} />
    case 'listen':
      return <MListsTab planner={planner} shell={shell} />
    default:
      return <TabScroller>{null}</TabScroller>
  }
}
