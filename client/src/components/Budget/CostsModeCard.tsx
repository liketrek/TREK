import { useId } from 'react';

import { useTranslation } from '../../i18n';
import type { Trip } from '../../types';
import ToggleSwitch from '../Settings/ToggleSwitch';
import { fs } from '../shared/DialogShell';
import { useCostsMode } from './useCostsMode';

/**
 * The switch between splitting a trip's costs and keeping the totals only
 * (#1714), at the foot of the Costs sidebar. Nothing is shown to someone who may
 * not change it, or on a trip of one.
 */
export function CostsModeCard({
  trip,
  memberCount,
  canEdit,
  className,
}: {
  trip: Trip | null | undefined;
  memberCount: number;
  canEdit: boolean;
  className: string;
}) {
  const { t } = useTranslation();
  const hintId = useId();
  const { splitting, setSplitting, saving, offered } = useCostsMode(trip, memberCount, canEdit);
  if (!offered) return null;

  return (
    <section aria-label={t('costs.mode.label')} className={className}>
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-content" style={fs(13, 'body')}>
            {t('costs.mode.label')}
          </div>
          <p id={hintId} className="m-0 mt-1 text-content-faint" style={fs(12, 'body')}>
            {splitting ? t('costs.mode.hintSplit') : t('costs.mode.hintTotals')}
          </p>
        </div>
        <ToggleSwitch
          on={splitting}
          onToggle={() => void setSplitting(!splitting)}
          label={t('costs.mode.label')}
          describedBy={hintId}
          disabled={saving}
        />
      </div>
    </section>
  );
}
