import type { DestinationIdea } from '@trek/shared';
import { useState } from 'react';
import { aiTravelPlanApi } from '../../api/aiTravelPlan';
import { briefDayCount, splitList, type TravelBrief } from '../../components/AiTravelPlan/aiPlanModel';
import { useToast } from '../../components/shared/Toast';
import { useTranslation } from '../../i18n';

/**
 * The "suggest destinations" affordance on the brief form. Discovery is
 * advisory: a failure leaves the form untouched and shows a toast.
 */
export function useDestinationIdeas(brief: TravelBrief, updateBrief: (patch: Partial<TravelBrief>) => void) {
  const { t } = useTranslation();
  const toast = useToast();
  const [destinationIdeas, setDestinationIdeas] = useState<DestinationIdea[] | null>(null);
  const [ideasPending, setIdeasPending] = useState(false);

  const suggestDestinations = (): void => {
    setIdeasPending(true);
    const month = brief.startDate ? Number(brief.startDate.slice(5, 7)) : undefined;
    const budget = brief.budgetCny.trim() === '' ? undefined : Number(brief.budgetCny);
    void aiTravelPlanApi
      .destinationIdeas({
        days: briefDayCount(brief) ?? undefined,
        budgetCny: budget,
        travelers: brief.adults + brief.children + brief.seniors,
        month: month && month >= 1 && month <= 12 ? month : undefined,
        interests: splitList(brief.interests).slice(0, 20),
      })
      .then((response) => {
        setDestinationIdeas(response.ideas);
      })
      .catch(() => {
        toast.error(t('planner.ai.ideasFailed'));
      })
      .finally(() => {
        setIdeasPending(false);
      });
  };

  const pickDestinationIdea = (idea: DestinationIdea): void => {
    updateBrief({ destination: idea.name });
    setDestinationIdeas(null);
  };

  return { destinationIdeas, ideasPending, suggestDestinations, pickDestinationIdea };
}
