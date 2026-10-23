import type { AssistantScope } from '@trek/shared';
import { createContext, useContext } from 'react';

import { type AssistantChatKey, assistantScopeOf } from '../../store/assistantChatKey';
import type { EntityTarget } from './cards/cardTypes';

/** What the parts deep inside a chat need from whoever shows it. */
export interface AssistantView {
  /**
   * The chat's key, which every part hands to the assistant store: the trip's
   * id in the planner, a journey's key in TREK Studio (`assistantChatKey`).
   * No trip is held under a journey's key, so the parts that read the trip
   * (its map, its days, found places) stay empty there.
   */
  tripId: AssistantChatKey;
  /** 'window' on the desktop, 'fullscreen' on the phone. */
  variant: 'window' | 'fullscreen';
  /** How much room the chat has: a narrow window and the phone are 'compact'. */
  density?: 'compact' | 'roomy';
  /**
   * Opens what a card or an applied change points at: a spot on the plan's
   * map, a tab of the trip, another page. The buttons are left out where
   * nothing can open them.
   */
  onOpen?: (target: EntityTarget) => void;
  /** Selects a day in the planner, from its weather; left out where no planner can show it. */
  onFocusDay?: (dayId: number) => void;
  /** Brings the map into view where the chat covers it (the phone), before the map moves. */
  onRevealMap?: () => void;
  /**
   * The stored book's version the book open in TREK Studio stands on, null
   * before it has one; left out outside the Studio. A book card draws the page
   * after as the server's trial made it only while the book is still at the
   * version the trial ran on.
   */
  bookVersion?: number | null;
}

export const AssistantViewContext = createContext<AssistantView | null>(null);

export function useAssistantView(): AssistantView {
  const view = useContext(AssistantViewContext);
  if (!view) throw new Error('useAssistantView outside AssistantSurface');
  return view;
}

/** What the chat on screen is about, for the parts that only make sense on a trip. */
export function useAssistantScope(): AssistantScope {
  return assistantScopeOf(useAssistantView().tripId);
}
