import type { RoadtripRulesCard } from '@trek/shared';
import { Flag, SlidersHorizontal } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import type { ChangeItem } from '../../assistantParts';
import { CardFacts, Fact, FactChange } from '../parts/CardFacts';
import { useCardFormat } from '../parts/useCardFormat';
import { settingLabel, settingValueText, type SettingWords } from './roadtripSettings';

/**
 * What a change to the road trip's rules does, under its change row: each
 * driving setting it changes, named as the settings dialog names it, from
 * what is saved to what it sets; or where it makes a day end, at a stop,
 * part way along a drive, or back at the automatic end. The day itself is
 * the change row's own fact, so it is not said twice.
 */

/** The three ways a day can end, each a literal key. */
const DAY_END = {
  stop: { labelKey: 'assistant.card.roadtrip.dayEnd.at' },
  along: { labelKey: 'assistant.card.roadtrip.dayEnd.along' },
  auto: { labelKey: 'assistant.card.roadtrip.dayEnd.auto' },
} as const;

/** Where the day ends in words; null when the change names no stop to end at, or no share of the drive. */
function dayEndLabel(dayEnd: NonNullable<RoadtripRulesCard['dayEnd']>, t: SettingWords['t']): string | null {
  if (dayEnd.mode === 'auto') return t(DAY_END.auto.labelKey);
  if (!dayEnd.from) return null;
  if (dayEnd.mode === 'stop') return t(DAY_END.stop.labelKey, { name: dayEnd.from });
  return dayEnd.percent === null ? null : t(DAY_END.along.labelKey, { name: dayEnd.from, percent: dayEnd.percent });
}

function DayEnd({ dayEnd }: { dayEnd: NonNullable<RoadtripRulesCard['dayEnd']> }) {
  const { t } = useTranslation();
  const label = dayEndLabel(dayEnd, t);
  if (!label) return null;
  return (
    <CardFacts>
      <Fact icon={Flag} tone={dayEnd.mode === 'auto' ? 'neutral' : 'info'} label={label} />
    </CardFacts>
  );
}

export default function RulesBody({ card }: { card: RoadtripRulesCard; item: ChangeItem }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const words: SettingWords = {
    t,
    minutes: format.minutes,
    clock: format.clock,
    distance: format.distance,
    number: format.count,
  };
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {card.settings.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {card.settings.map((setting) => (
            <li key={setting.key} className="flex flex-wrap items-center gap-1.5">
              <span className="text-caption text-content-muted">{settingLabel(setting.key, t)}</span>
              <FactChange
                icon={SlidersHorizontal}
                tone="info"
                before={
                  setting.before === null || setting.before === setting.after
                    ? null
                    : settingValueText(setting.key, setting.before, words)
                }
                after={settingValueText(setting.key, setting.after, words)}
              />
            </li>
          ))}
        </ul>
      )}
      {card.dayEnd && <DayEnd dayEnd={card.dayEnd} />}
    </div>
  );
}
