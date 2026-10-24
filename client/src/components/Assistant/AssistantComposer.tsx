import { AuiIf, ComposerPrimitive, useAui, useAuiState } from '@assistant-ui/react';
import { ArrowUp, CalendarDays, MapPin, Paperclip, Square, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';

import { useTranslation } from '../../i18n';
import { HOME_CHAT_KEY } from '../../store/assistantChatKey';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import PlaceAvatar from '../shared/PlaceAvatar';
import Tooltip from '../shared/Tooltip';
import AssistantMentionPopover from './AssistantMentionPopover';
import { useAssistantView } from './assistantViewContext';
import { useAssistantAttach } from './useAssistantAttach';
import { useAssistantFocus } from './useAssistantFocus';
import { useAssistantMentions } from './useAssistantMentions';
import { useAssistantSuggestions } from './useAssistantSuggestions';
import { useTypewriterPlaceholder } from './useTypewriterPlaceholder';

/** Send and Stop share one spot; on the phone it is a full thumb's size. */
const ACTION = {
  window: 'h-9 w-9',
  fullscreen: 'h-11 w-11',
} as const;

/**
 * Where the user writes. One rounded shell with the text and, in the same
 * spot, Send or Stop. Enter sends, Shift+Enter breaks the line, Escape stops
 * a running answer. The one chip above the text is the focus the question is
 * about, and can be removed. `@` at the start of a word opens the trip's days,
 * places and bookings to name; a pick stays as `@label` in the text, which is
 * what the question names, and shows as a chip only in the sent bubble. While
 * that list is open, Enter picks and Escape closes it. While the field is empty,
 * its placeholder writes out things worth asking about this trip, one after
 * another.
 *
 * The text typed so far lives in the assistant store too, so it survives the
 * window closing or the phone hopping to the map and back.
 */
export default function AssistantComposer({ tripId, tripTitle }: { tripId: number; tripTitle: string }) {
  const { t } = useTranslation();
  const { variant } = useAssistantView();
  const aui = useAui();
  const setDraft = useAssistantStore((s) => s.setDraft);
  const { label, kind, place, clear } = useAssistantFocus(tripId);
  const mentions = useAssistantMentions(tripId);
  const { suggestions } = useAssistantSuggestions(tripId);
  const empty = useAuiState((s) => s.composer.isEmpty);
  const { take, busy, accept, canAttach } = useAssistantAttach(tripId);
  const fileInput = useRef<HTMLInputElement>(null);
  // The home chat is about no one trip, so its placeholder names none.
  const fallback =
    tripId === HOME_CHAT_KEY
      ? t('assistant.home.placeholder')
      : t('assistant.composer.placeholder', { trip: tripTitle });
  const placeholder = useTypewriterPlaceholder(
    suggestions.map((s) => s.prompt),
    fallback,
    empty
  );

  // Takes back what was typed before the chat was last shown.
  useEffect(() => {
    const draft = chatOf(useAssistantStore.getState(), tripId).draft;
    if (draft) aui.composer.setText(draft);
  }, [aui, tripId]);

  const FocusIcon = kind === 'place' ? MapPin : CalendarDays;

  return (
    <ComposerPrimitive.Root className="relative rounded-2xl border border-edge-faint bg-surface-card shadow-card transition-colors focus-within:border-edge">
      <ComposerPrimitive.TriggerPopoverRoot>
        <AssistantMentionPopover adapter={mentions.adapter} onInserted={mentions.onInserted} />
        {label && (
          <div className="flex flex-wrap gap-1 px-2 pt-2">
            <ContextChip
              label={label}
              icon={place ? <PlaceAvatar place={place} size={18} /> : <FocusIcon size={12} aria-hidden="true" />}
              round={!!place}
              onRemove={clear}
            />
          </div>
        )}
        <div className="flex items-center gap-1 p-1.5">
          {canAttach && (
            <>
              <Tooltip label={t('assistant.attach.button')} placement="top">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInput.current?.click()}
                  aria-label={t('assistant.attach.button')}
                  className={`flex ${ACTION[variant]} flex-shrink-0 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-surface-hover hover:text-content disabled:opacity-40`}
                >
                  <Paperclip size={17} aria-hidden="true" />
                </button>
              </Tooltip>
              <input
                ref={fileInput}
                type="file"
                accept={accept}
                hidden
                onChange={(e) => {
                  take(e.target.files);
                  e.target.value = '';
                }}
              />
            </>
          )}
          <ComposerPrimitive.Input
            // The desktop window opens ready to type; on the phone the keyboard waits for a tap.
            autoFocus={variant === 'window'}
            dir="auto"
            minRows={1}
            maxRows={8}
            submitMode="enter"
            addAttachmentOnPaste={false}
            enterKeyHint="send"
            aria-label={fallback}
            placeholder={placeholder}
            onChange={(e) => setDraft(tripId, e.target.value)}
            onPaste={(e) => {
              if (e.clipboardData.files.length > 0 && take(e.clipboardData.files)) e.preventDefault();
            }}
            className="max-h-48 min-h-[36px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-body text-content outline-none placeholder:text-content-faint disabled:cursor-not-allowed dark:bg-transparent"
          />
          <AuiIf condition={(s) => s.thread.isRunning}>
            <ComposerPrimitive.Cancel
              aria-label={t('assistant.composer.stop')}
              className={`flex ${ACTION[variant]} flex-shrink-0 items-center justify-center rounded-full bg-accent text-accent-text transition-transform hover:scale-105 hover:bg-accent-hover active:scale-95`}
            >
              <Square size={12} fill="currentColor" aria-hidden="true" />
            </ComposerPrimitive.Cancel>
          </AuiIf>
          <AuiIf condition={(s) => !s.thread.isRunning}>
            <SendButton size={ACTION[variant]} />
          </AuiIf>
        </div>
      </ComposerPrimitive.TriggerPopoverRoot>
    </ComposerPrimitive.Root>
  );
}

/** One thing the question is about, above the text, with the cross that takes it back. */
function ContextChip({
  label,
  icon,
  round,
  onRemove,
}: {
  label: string;
  icon: ReactNode;
  /** A place's picture fills the chip's round end, so the chip starts closer to it. */
  round: boolean;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-surface-secondary py-0.5 pe-1 text-caption text-content-secondary ${round ? 'ps-0.5' : 'ps-2'}`}
    >
      <span className="flex flex-shrink-0">{icon}</span>
      <bdi className="truncate">{label}</bdi>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('assistant.context.remove')}
        className="rounded-full p-0.5 text-content-faint hover:bg-surface-hover hover:text-content"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );
}

function SendButton({ size }: { size: string }) {
  const { t } = useTranslation();
  // Sending waits while a proposed change is undecided; the tooltip says so.
  const blocked = useAuiState((s) => s.thread.isSendDisabled);
  const button = (
    <ComposerPrimitive.Send
      aria-label={t('assistant.composer.send')}
      className={`flex ${size} flex-shrink-0 items-center justify-center rounded-full bg-accent text-accent-text shadow-card transition-[transform,opacity,box-shadow] duration-150 hover:scale-105 hover:bg-accent-hover hover:shadow-dropdown active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:shadow-none`}
    >
      <ArrowUp size={17} strokeWidth={2.4} aria-hidden="true" />
    </ComposerPrimitive.Send>
  );
  // A disabled button gets no pointer events, so the tooltip that says why hangs on a wrapper.
  return blocked ? (
    <Tooltip label={t('assistant.composer.decideFirst')} placement="top">
      <span className="inline-flex">{button}</span>
    </Tooltip>
  ) : (
    button
  );
}
