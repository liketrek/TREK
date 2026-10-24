import { ThreadPrimitive } from '@assistant-ui/react';

import { useTranslation } from '../../i18n';
import EmptyState from '../shared/EmptyState';
import AssistantHints, { MAX_VISIBLE_HINTS } from './AssistantHints';
import { useAssistantScope, useAssistantView } from './assistantViewContext';
import { useAssistantHints } from './useAssistantHints';
import type { ReadySuggestion } from './useAssistantSuggestions';

/** Suggestions left under a full list of hints, so both fit the smallest window. */
const SUGGESTIONS_UNDER_HINTS = 2;

/**
 * The empty chat: the mascot, one question, and a few things to ask that fit
 * where the trip stands. A suggestion sends itself; there is nothing to edit
 * first. On the phone the suggestions sit by the composer instead, where the
 * thumb is, so this shows them only when `withSuggestions` asks for it.
 * Between the two sit the plan hints, when the trip has any.
 */
export default function AssistantWelcome({
  suggestions,
  canEdit,
  withSuggestions,
}: {
  suggestions: ReadySuggestion[];
  canEdit: boolean;
  withSuggestions: boolean;
}) {
  const { t } = useTranslation();
  const { tripId, variant } = useAssistantView();
  // The Studio's chat is about a book, not a plan; the home chat about all of the user's travels.
  const scope = useAssistantScope().kind;
  const book = scope === 'journey';
  const hints = useAssistantHints(tripId, { withStays: true });
  const crowded = Math.min(hints.hints.length, MAX_VISIBLE_HINTS) > SUGGESTIONS_UNDER_HINTS;
  const offered = crowded ? suggestions.slice(0, SUGGESTIONS_UNDER_HINTS) : suggestions;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
      <EmptyState scene="chat" size={72} compact surface="var(--bg-elevated)" title={welcomeTitle(scope, t)} />
      {!canEdit && (
        <p className="m-0 max-w-xs text-center text-caption text-content-muted">
          {book ? t('journey.studio.assistant.readOnly') : t('assistant.empty.readOnly')}
        </p>
      )}
      <AssistantHints view={hints} phone={variant === 'fullscreen'} />
      {withSuggestions && offered.length > 0 && <AssistantSuggestions suggestions={offered} layout="stack" />}
    </div>
  );
}

/** The question over the empty chat, by what the chat is about. */
function welcomeTitle(scope: 'trip' | 'journey' | 'home', t: (key: string) => string): string {
  if (scope === 'journey') return t('journey.studio.assistant.welcome');
  return scope === 'home' ? t('assistant.home.welcome') : t('assistant.empty.title');
}

export function AssistantSuggestions({
  suggestions,
  layout,
}: {
  suggestions: ReadySuggestion[];
  /** 'stack' under the mascot, 'row' as a strip of chips over the composer. */
  layout: 'stack' | 'row';
}) {
  return (
    <div
      className={
        layout === 'stack'
          ? 'trek-stagger flex w-full max-w-sm flex-col gap-1.5'
          : 'trek-stagger -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]'
      }
    >
      {suggestions.map((s) => (
        <ThreadPrimitive.Suggestion
          key={s.id}
          prompt={s.prompt}
          send
          dir="auto"
          className={
            layout === 'stack'
              ? 'rounded-xl border border-edge-faint bg-surface-card px-3.5 py-2.5 text-start text-body text-content transition-colors hover:border-edge hover:bg-surface-hover'
              : 'min-h-[44px] flex-shrink-0 whitespace-nowrap rounded-full border border-edge-faint bg-surface-card px-4 text-body text-content'
          }
        >
          {s.prompt}
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
}
