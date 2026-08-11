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
  // between the floating top controls and the dock. Both clearances come from the
  // variables TabScroller uses, so the frame cannot drift away from the native
  // tabs: the top one kept the plugin's first row under the z-42 back button, and
  // the bottom one was a copy of 84px that ignored the safe area on the devices
  // that have one. The frame also states its surface, so the plugin knows it is
  // expected to fill and scroll itself rather than report a height.
  //
  // color-scheme is pinned for the same reason both settings mounts pin it:
  // Chromium paints a white canvas behind a transparent frame otherwise.
  if (tab.startsWith('plugin:')) {
    return (
      <div
        className="absolute inset-0 pt-[calc(var(--m-safe-top,12px)+58px)] pb-[calc(var(--bottom-nav-h,84px)+22px)]"
      >
        <PluginFrame
          pluginId={tab.slice('plugin:'.length)}
          tripId={planner.tripId != null ? String(planner.tripId) : null}
          fill
          surface="trip-tab"
          className="h-full w-full [color-scheme:light]"
        />
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
