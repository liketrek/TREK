import { HIKING_PREFERENCE_KEYS, type HikingPreferenceKey } from '@trek/shared';
import { ChartNoAxesColumnIncreasing, Mountain, Ship } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from '../../../i18n';
import { BOX } from '../../Planner/bookings/bookingParts';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import { fs } from '../../shared/DialogShell';
import { InfoDot } from '../tourParts';
import type { TourPlannerController } from './useTourPlanner';

const ICON: Record<HikingPreferenceKey, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  avoid_climbs: Mountain,
  avoid_steps: ChartNoAxesColumnIncreasing,
  avoid_ferries: Ship,
};

/**
 * MF-08: what a hike asks the router for besides its difficulty limit, as
 * switches under it. Only preferences the router was seen to honour are here
 * (hikingCostingOptions in @trek/shared says which and how they were checked),
 * each with what it really does in a line of its own; the info dot says they
 * weigh the way and give way where there is none other, and that none of them
 * grades a path.
 * Switching one plans the route again, as one step of the history.
 */
export function HikingPreferencesField({
  planner,
  locked,
}: {
  planner: Pick<TourPlannerController, 'hikingPreferences' | 'setHikingPreferences'>;
  locked: boolean;
}) {
  const { t } = useTranslation();
  const current = planner.hikingPreferences;
  const toggle = (key: HikingPreferenceKey) => {
    if (!locked) planner.setHikingPreferences({ ...current, [key]: !current?.[key] });
  };
  return (
    <div className="min-w-0" data-testid="tour-hiking-preferences">
      <div className="mb-1.5 flex min-h-[18px] items-center gap-1.5">
        <span className="font-semibold uppercase tracking-[0.06em] text-content-muted" style={fs(10, 'caption')}>
          {t('tours.preferences.title')}
        </span>
        <InfoDot label={t('tours.preferences.infoLabel')} description={t('tours.preferences.info')} />
      </div>
      <ul className={`${BOX} m-0 flex list-none flex-col divide-y divide-edge-faint p-0`}>
        {HIKING_PREFERENCE_KEYS.map((key) => {
          const Icon = ICON[key];
          const hintId = `tour-preference-${key}-hint`;
          return (
            <li key={key} className="flex items-center gap-2.5 px-3 py-2">
              <Icon size={14} strokeWidth={2} className="flex-none text-content-faint" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold text-content" style={fs(12.5, 'body')}>
                  {t(`tours.preferences.${key}`)}
                </span>
                <span id={hintId} className="leading-snug text-content-faint" style={fs(11, 'body')}>
                  {t(`tours.preferences.${key}Hint`)}
                </span>
              </span>
              <span className={locked ? 'pointer-events-none opacity-50' : undefined}>
                <ToggleSwitch
                  on={current?.[key] === true}
                  onToggle={() => toggle(key)}
                  label={t(`tours.preferences.${key}`)}
                  describedBy={hintId}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
