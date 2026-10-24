import type { RoadtripCard } from '@trek/shared';
import { useState } from 'react';

import { useTranslation } from '../../../../i18n';
import { formatDurationShort } from '../../../Roadtrip/roadtripModel';
import type { CardEntry } from '../cardTypes';
import { useCardFormat } from '../parts/useCardFormat';
import ChargingCard from './ChargingCard';
import { dayHasWarning, splitDriveEntries } from './roadtripCardModel';
import RoadtripDrive from './RoadtripDrive';
import { settingLabel } from './roadtripSettings';

/**
 * The drives and chargers of one answer. A drive is the road trip's card; an
 * answer that worked out the drive more than once (the saved settings and a
 * preview of others) shows one card with a row per way to drive it, and the
 * picked one drives the sketch, the strip and the rail. Chargers join the
 * row of their stop where the drive shows it, and stand on their own
 * otherwise.
 */

/** One way of driving it, as a row to pick: saved or tried, how far and how long, how much to look at. */
function VariantRow({ card, picked, onPick }: { card: RoadtripCard; picked: boolean; onPick: () => void }) {
  const { t } = useTranslation();
  const format = useCardFormat();
  const warnings = card.days.filter(dayHasWarning).length;
  const tone = picked ? 'bg-surface-hover text-content' : 'text-content-secondary hover:bg-surface-hover';
  const label =
    card.previewKeys.length > 0
      ? `${t('assistant.card.roadtrip.preview')}: ${card.previewKeys.map((key) => settingLabel(key, t)).join(', ')}`
      : t('assistant.card.roadtrip.saved');
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-pressed={picked}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-caption transition-colors ${tone}`}
      >
        <bdi className="min-w-0 flex-1 truncate" title={label}>
          {label}
        </bdi>
        <span className="flex-none tabular-nums">
          {t('roadtrip.leg.driveText', {
            distance: format.distance(card.distanceM / 1000),
            time: formatDurationShort(card.durationS),
          })}
        </span>
        {warnings > 0 && (
          <span className="flex-none text-warning">{t('assistant.card.roadtrip.warnings', { count: warnings })}</span>
        )}
      </button>
    </li>
  );
}

export default function RoadtripBlock({ cards }: { cards: readonly CardEntry[] }) {
  const { t } = useTranslation();
  const { drives, chargers } = splitDriveEntries(cards);
  const [picked, setPicked] = useState(0);
  const drive = drives[Math.min(picked, drives.length - 1)];
  if (!drive) {
    return (
      <div className="flex flex-col gap-2">
        {chargers.map(({ toolCallId, card }) => (
          <ChargingCard key={toolCallId} toolCallId={toolCallId} card={card} />
        ))}
      </div>
    );
  }
  const variants =
    drives.length > 1 ? (
      <ul aria-label={t('assistant.card.roadtrip.variants')} className="mt-1.5 flex list-none flex-col gap-0.5 p-0">
        {drives.map(({ toolCallId, card }, index) => (
          <VariantRow
            key={toolCallId}
            card={card}
            picked={drive.toolCallId === toolCallId}
            onPick={() => setPicked(index)}
          />
        ))}
      </ul>
    ) : undefined;
  return (
    <div className="flex flex-col gap-2">
      <RoadtripDrive
        key={drive.toolCallId}
        toolCallId={drive.toolCallId}
        card={drive.card}
        chargers={chargers}
        variants={variants}
      />
    </div>
  );
}
