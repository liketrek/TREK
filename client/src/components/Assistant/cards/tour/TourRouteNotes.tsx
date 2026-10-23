import type { TourRouteCard } from '@trek/shared';
import { AlertTriangle } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { SoftPill } from '../../../Planner/planParts';
import { TourNotice } from '../../../Tours/tourParts';
import { useCardFormat } from '../parts/useCardFormat';
import { PROBLEM_LOOK, WARNING_LOOK } from './tourRouteWords';

/**
 * What to look out for on a route: its warnings as pills (thunder, rain, the
 * dark; legs of a plan that failed), and why a route is drawn straight as a
 * notice, the way the Tours tab says it. A held change whose way is planned
 * only once applied says so in its row instead.
 */

export function TourRouteWarnings({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  if (card.warnings.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1" data-testid="tour-warnings">
      {card.warnings.map((warning, index) => {
        const look = WARNING_LOOK[warning.kind];
        return (
          <SoftPill
            key={`${warning.kind}-${index}`}
            tone={look.tone}
            icon={<AlertTriangle size={10} strokeWidth={2.2} aria-hidden="true" />}
          >
            {t(look.labelKey, { time: warning.at ? format.clock(warning.at) : '', count: warning.count ?? 1 })}
          </SoftPill>
        );
      })}
    </div>
  );
}

export function TourRouteProblem({ card }: { card: TourRouteCard }) {
  const { t } = useTranslation();
  const problem = card.problem;
  if (!problem || problem.why === 'not_planned') return null;
  // No path within a limit the card does not know is said without one.
  const text =
    problem.why === 'no_way' && card.limit === null
      ? t('assistant.card.tour.problem.no_way_any')
      : t(PROBLEM_LOOK[problem.why].labelKey, { grade: card.limit ?? '', point: problem.position ?? 1 });
  return (
    <div className="mt-2">
      <TourNotice tone="warning" icon={<AlertTriangle size={12} strokeWidth={2} aria-hidden="true" />}>
        {text}
      </TourNotice>
    </div>
  );
}
