import type { MTripCollabTab } from '../MTripShell';

/** The collab boards that can stand beside the chat: everything but the chat itself. */
const BOARD_TABS = ['notes', 'links', 'polls'] as const;
type CollabBoardTab = (typeof BOARD_TABS)[number];

/** Whether a collab tab is one of the boards (not the chat, nor a tab this screen does not know). */
export function isCollabBoard(tab: string): tab is CollabBoardTab {
  return (BOARD_TABS as readonly string[]).includes(tab);
}

interface CollabFeatureFlags {
  chat: boolean;
  notes: boolean;
  links: boolean;
  polls: boolean;
}

/** The boards this trip has switched on, in the order the header lists them. */
export function collabBoards(features: CollabFeatureFlags): CollabBoardTab[] {
  return BOARD_TABS.filter((tab) => (tab === 'links' ? features.links !== false : !!features[tab]));
}

/**
 * Whether the collab tab shows the chat beside a board: a window with room for
 * two panes (split size class), with the chat and at least one board on.
 */
export function collabSideBySide(split: boolean, features: CollabFeatureFlags): boolean {
  return split && !!features.chat && collabBoards(features).length > 0;
}

/**
 * The board shown beside the chat. The chat is always on screen there, so a
 * tab still set to it (the default, or chosen on a narrower window before a
 * rotation) shows the first board instead.
 */
export function collabBoardFor(tab: MTripCollabTab, features: CollabFeatureFlags): CollabBoardTab {
  const boards = collabBoards(features);
  return tab !== 'chat' && boards.includes(tab) ? tab : (boards[0] ?? 'notes');
}
