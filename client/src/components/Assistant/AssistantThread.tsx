import { AuiIf, ThreadPrimitive } from '@assistant-ui/react';
import { ArrowDown, FileUp, MapPin } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '../../i18n';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import AssistantComposer from './AssistantComposer';
import AssistantError from './AssistantError';
import AssistantMessage from './AssistantMessage';
import AssistantPrivacyBanner from './AssistantPrivacyBanner';
import AssistantWelcome, { AssistantSuggestions } from './AssistantWelcome';
import { useAssistantView } from './assistantViewContext';
import { useAssistantAttach } from './useAssistantAttach';
import { useFollowSelectedDay } from './useAssistantFocus';
import { joinDropZones, useAssistantPlaceDrop } from './useAssistantPlaceDrop';
import { useAssistantSuggestions } from './useAssistantSuggestions';

/**
 * The chat itself: the messages, and under them the line that says what went
 * wrong, the privacy note and the composer, held at the bottom while the
 * messages scroll. A new question moves up to the top of the view, so its
 * answer reads from its first line instead of chasing the newest one. A
 * booking file or a place of the trip can be dropped anywhere on it.
 */
export default function AssistantThread({ tripTitle }: { tripTitle: string }) {
  const { t } = useTranslation();
  const { tripId, variant } = useAssistantView();
  const messages = useAssistantStore((s) => chatOf(s, tripId).messages);
  const isRunning = useAssistantStore((s) => chatOf(s, tripId).isRunning);
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const { suggestions, canEdit } = useAssistantSuggestions(tripId);
  useFollowSelectedDay(tripId);

  const phone = variant === 'fullscreen';
  const attach = useAssistantAttach(tripId);
  const placeDrop = useAssistantPlaceDrop(tripId);
  const DropIcon = placeDrop.dragging ? MapPin : FileUp;
  // `@` reaches only the trip the planner shows; for another one the hint would promise nothing.
  const mentionable = useTripStore((s) => s.trip?.id === tripId);

  return (
    <ThreadPrimitive.Root
      className="relative flex min-h-0 flex-1 flex-col"
      {...joinDropZones(attach.dropZone, placeDrop.dropZone)}
    >
      {(attach.dragging || placeDrop.dragging) && (
        <div className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge bg-surface-elevated text-center backdrop-blur-sm">
          <DropIcon size={22} aria-hidden="true" className="text-content-secondary" />
          <span className="max-w-[16rem] text-body font-medium text-content">
            {t(placeDrop.dragging ? 'assistant.attach.dropPlace' : 'assistant.attach.drop')}
          </span>
        </div>
      )}
      <ThreadPrimitive.Viewport turnAnchor="top" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <AssistantWelcome suggestions={suggestions} canEdit={canEdit} withSuggestions={!phone} />
          {mentionable && (
            <p className="m-0 pb-1 text-center text-caption text-content-faint">{t('assistant.mention.hint')}</p>
          )}
        </AuiIf>
        <div role="log" aria-label={t('assistant.window.log')} aria-busy={isRunning} className="pt-2">
          <ThreadPrimitive.Messages>
            {({ message }) => {
              const stored = byId.get(message.id);
              return stored ? <AssistantMessage message={stored} /> : null;
            }}
          </ThreadPrimitive.Messages>
        </div>
      </ThreadPrimitive.Viewport>
      {/* Outside the scroller, so it needs no backdrop of its own: on the glass window a second
          surface behind the composer showed as a box. */}
      <div className="relative flex flex-shrink-0 flex-col gap-2 px-4 pb-3 pt-2">
        <ThreadPrimitive.ScrollToBottom
          aria-label={t('assistant.thread.scrollDown')}
          className="absolute -top-10 start-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-edge-faint bg-surface-card text-content-secondary shadow-dropdown hover:text-content disabled:hidden rtl:translate-x-1/2"
        >
          <ArrowDown size={15} aria-hidden="true" />
        </ThreadPrimitive.ScrollToBottom>
        {phone && (
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <AssistantSuggestions suggestions={suggestions} layout="row" />
          </AuiIf>
        )}
        <AssistantError tripId={tripId} />
        <AssistantPrivacyBanner />
        <AssistantComposer tripId={tripId} tripTitle={tripTitle} />
      </div>
    </ThreadPrimitive.Root>
  );
}
