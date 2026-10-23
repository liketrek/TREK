import { type TriggerAdapter, type TriggerItem, useAui } from '@assistant-ui/react';
import { ASSISTANT_MENTION_KINDS } from '@trek/shared';
import { useMemo } from 'react';

import { useTranslation } from '../../i18n';
import { type AssistantMentionItem, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import { MENTION_KINDS, mentionGroups, mentionOf, searchMentions, withMention } from './assistantMentionModel';

/**
 * Writes the composer's text and keeps the draft in step: a text set from
 * code fires no change event, so the store would otherwise keep the old one.
 */
function useComposerWriter(tripId: number) {
  const aui = useAui();
  const setDraft = useAssistantStore((s) => s.setDraft);
  const read = () => aui.composer.getState().text;
  return {
    read,
    /** Takes into the draft what the popover wrote into the text itself. */
    keep: () => setDraft(tripId, read()),
    write: (text: string) => {
      aui.composer.setText(text);
      setDraft(tripId, text);
    },
  };
}

/**
 * `@` in the composer: the trip's days, places and bookings to pick from
 * (nothing for a trip the planner is not showing, whose lists are not at
 * hand). The text is the truth: a pick stays as `@label` in it, and a
 * mention whose `@label` was deleted is not sent.
 */
export function useAssistantMentions(tripId: number) {
  const { t, locale } = useTranslation();
  const here = useTripStore((s) => s.trip?.id === tripId);
  const days = useTripStore((s) => s.days);
  const places = useTripStore((s) => s.places);
  const reservations = useTripStore((s) => s.reservations);
  const addMention = useAssistantStore((s) => s.addMention);
  const composer = useComposerWriter(tripId);

  const adapter = useMemo((): TriggerAdapter | undefined => {
    if (!here) return undefined;
    const groups = mentionGroups({ days, places, reservations }, t, locale);
    const kinds = ASSISTANT_MENTION_KINDS.filter((k) => groups[k].length > 0);
    const categories = kinds.map((k) => ({ id: k, label: t(MENTION_KINDS[k].labelKey) }));
    return {
      categories: () => categories,
      categoryItems: (id) => {
        const kind = ASSISTANT_MENTION_KINDS.find((k) => k === id);
        return kind ? groups[kind] : [];
      },
      search: (query) => searchMentions(groups, query),
    };
  }, [here, days, places, reservations, t, locale]);

  return {
    adapter,
    /** After the popover wrote `@label` into the text. */
    onInserted: (item: TriggerItem) => {
      const mention = mentionOf(item);
      if (mention) addMention(tripId, mention);
      composer.keep();
    },
  };
}

/**
 * Names something in the question from outside the text, such as a place
 * dropped on the chat: `@label` goes at the end of what is typed, the way a
 * pick from the popover leaves it, once.
 */
export function useInsertMention(tripId: number) {
  const addMention = useAssistantStore((s) => s.addMention);
  const composer = useComposerWriter(tripId);
  return (mention: AssistantMentionItem) => {
    addMention(tripId, mention);
    composer.write(withMention(composer.read(), mention.label));
  };
}
