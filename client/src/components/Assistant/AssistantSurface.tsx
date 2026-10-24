import './assistant.css';

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useMemo } from 'react';

import AssistantThread from './AssistantThread';
import { type AssistantView, AssistantViewContext } from './assistantViewContext';
import { useAssistantRuntime } from './useAssistantRuntime';

export interface AssistantSurfaceProps extends AssistantView {
  /** Named in the composer's placeholder: the trip's title, or the journey's in TREK Studio. */
  tripTitle: string;
}

/**
 * The chat for one trip, the same on the desktop window and the phone screen,
 * and for one journey in TREK Studio: `tripId` is the chat's key, so the
 * Studio passes `assistantChatKey({ kind: 'journey', journeyId })` and gets
 * the journey's conversations, with the parts that need a trip left empty.
 * Its own chunk: this is the only module tree that pulls in @assistant-ui, so
 * nobody downloads the chat runtime before opening the assistant.
 */
export default function AssistantSurface({
  tripId,
  tripTitle,
  variant,
  density,
  onOpen,
  onFocusDay,
  onRevealMap,
  bookVersion,
  onOpenTripChat,
}: AssistantSurfaceProps) {
  const runtime = useAssistantRuntime(tripId);
  // The phone is always compact; a window is what its width says.
  const view = useMemo(
    () => ({
      tripId,
      variant,
      density: variant === 'fullscreen' ? ('compact' as const) : (density ?? 'roomy'),
      onOpen,
      onFocusDay,
      onRevealMap,
      bookVersion,
      onOpenTripChat,
    }),
    [tripId, variant, density, onOpen, onFocusDay, onRevealMap, bookVersion, onOpenTripChat]
  );
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantViewContext.Provider value={view}>
        <AssistantThread tripTitle={tripTitle} />
      </AssistantViewContext.Provider>
    </AssistantRuntimeProvider>
  );
}
