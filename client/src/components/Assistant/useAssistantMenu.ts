import type { AssistantFocus } from '@trek/shared';
import { CalendarCheck, CloudRain, type LucideIcon, Shuffle, Sparkles, UtensilsCrossed } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { useAssistantStore } from '../../store/assistantStore';
import type { Place } from '../../types';

/** One row of a context menu, or the line before the assistant's rows. */
type AssistantMenuEntry = { label: string; icon: LucideIcon; onClick: () => void } | { divider: true };

/**
 * The assistant's rows in the planner's context menus, so a question starts
 * where the user already is: a right click on a place asks about it, finds
 * something else in its place, or a restaurant near it; one on a day plans it
 * or makes a plan for rain. Each opens the chat with the place or day as its
 * focus and sends the question at once. Empty while the assistant cannot run
 * for this user, so the menus look as they always did.
 */
export function useAssistantMenu(tripId: number | null) {
  const { t } = useTranslation();
  const available = useAssistantStore((s) => s.status?.available === true);
  const openWith = useAssistantStore((s) => s.openWith);
  const send = useAssistantStore((s) => s.send);
  const on = available && tripId !== null;

  const ask = (focus: AssistantFocus, text?: string) => {
    if (tripId === null) return;
    openWith(tripId, focus);
    if (text) void send(tripId, text);
  };

  const place = (target: Place): AssistantMenuEntry[] => {
    if (!on) return [];
    const focus = { placeIds: [target.id] };
    return [
      { divider: true },
      { label: t('assistant.context.ask'), icon: Sparkles, onClick: () => ask(focus) },
      {
        label: t('assistant.menu.alternative'),
        icon: Shuffle,
        onClick: () => ask(focus, t('assistant.menu.alternativeAsk', { place: target.name })),
      },
      {
        label: t('assistant.menu.foodNearby'),
        icon: UtensilsCrossed,
        onClick: () => ask(focus, t('assistant.menu.foodNearbyAsk', { place: target.name })),
      },
    ];
  };

  const day = (dayId: number): AssistantMenuEntry[] => {
    if (!on) return [];
    const focus = { dayId };
    return [
      { divider: true },
      {
        label: t('assistant.menu.planDay'),
        icon: CalendarCheck,
        onClick: () => ask(focus, t('assistant.menu.planDayAsk')),
      },
      {
        label: t('assistant.menu.rainPlan'),
        icon: CloudRain,
        onClick: () => ask(focus, t('assistant.menu.rainPlanAsk')),
      },
    ];
  };

  return { place, day };
}
