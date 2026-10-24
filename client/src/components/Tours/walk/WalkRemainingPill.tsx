import type { WalkRemainder } from '@trek/shared';
import { Hourglass } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { SoftPill } from '../../Planner/planParts';
import { Tooltip } from '../../shared/Tooltip';
import { walkRemainingText } from './walkRemaining';

/**
 * CW-13: the walking time still ahead on the day the walk was opened from, as
 * a pill beside its progress. A time not known stays in its place, dimmed,
 * and its tooltip says why.
 */
export function WalkRemainingPill({ remainder }: { remainder: WalkRemainder }) {
  const { t } = useTranslation();
  const { value, label, known } = walkRemainingText(remainder, t);
  return (
    <Tooltip label={label}>
      <span data-testid="walk-remaining" aria-label={label} className={`inline-flex ${known ? '' : 'opacity-60'}`}>
        <SoftPill icon={<Hourglass size={10} strokeWidth={2.2} className="flex-none" />}>{value}</SoftPill>
      </span>
    </Tooltip>
  );
}
