import type { MTabScreenProps } from './tabModel'
import MPackingListTab from './MPackingListTab'
import MTodoListTab from './MTodoListTab'

/**
 * Tab 4 — Listen (spec 03 §4). The header segmented switcher (Packing/To-do,
 * with the packed/open badges) already lives in the shell
 * (`MTripShell.tsx`, `trTab === 'listen'`) and drives `shell.listsTab`; this
 * panel only renders the body for whichever sub-tab is active. Both bodies
 * share the same `packing_edit` permission (§6.6) and gate on real data —
 * see `MPackingListTab`/`MTodoListTab` for the sub-tab logic.
 */
export default function MListsTab({ planner, shell }: MTabScreenProps) {
  return shell.listsTab === 'todo'
    ? <MTodoListTab planner={planner} />
    : <MPackingListTab planner={planner} />
}
