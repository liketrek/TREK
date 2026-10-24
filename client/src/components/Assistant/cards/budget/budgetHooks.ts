import type { CardPerson } from '@trek/shared';

import { useTranslation } from '../../../../i18n';
import { useViewerId } from '../parts/useViewerId';

/**
 * The words the costs' cards say about people, as the Costs page says them:
 * the signed-in user is "You", and "You paid" rather than "Ana paid".
 */
export function useBudgetPeople() {
  const { t } = useTranslation();
  const viewerId = useViewerId();
  const isViewer = (person: CardPerson) => person.id === viewerId;
  return {
    nameOf: (person: CardPerson) => (isViewer(person) ? t('costs.you') : person.name),
    paidBy: (person: CardPerson) =>
      isViewer(person) ? t('costs.youPaid') : t('assistant.card.budget.paidBy', { name: person.name }),
  };
}
