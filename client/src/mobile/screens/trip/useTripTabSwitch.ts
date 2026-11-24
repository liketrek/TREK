import { useEffect } from 'react';
import type { MTripCollabTab, MTripMode } from './MTripShell';

interface TabSwitchPlanner {
  handleTabChange: (tabId: string) => void;
  /** The last `?tab=` link the planner took, counted so the same tab twice still lands. */
  tabLink: { tab: string; seq: number } | null;
}

/**
 * How the phone shell changes the trip's section. A tap on the dock goes through the
 * planner and leaves the places browser; a notification link the planner took does the
 * same, and a message one opens the chat rather than the collab part last on screen.
 */
export function useTripTabSwitch(
  planner: TabSwitchPlanner,
  mode: MTripMode,
  setMode: (update: (mode: MTripMode) => MTripMode) => void,
  setCollabTab: (tab: MTripCollabTab) => void
): (tabId: string) => void {
  const { tabLink } = planner;
  useEffect(() => {
    if (!tabLink) return;
    setMode((m) => (m === 'browse' ? 'go' : m));
    if (tabLink.tab === 'collab') setCollabTab('chat');
  }, [tabLink, setMode, setCollabTab]);

  return (tabId: string) => {
    planner.handleTabChange(tabId);
    if (mode === 'browse') setMode(() => 'go');
  };
}
